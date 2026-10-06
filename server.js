import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const PROJECTS_DIR = path.join(__dirname, 'projects');

if (!fs.existsSync(PROJECTS_DIR)) {
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express static with custom headers and mime types
express.static.mime.define({
  'application/wasm': ['wasm'],
  'font/ttf': ['ttf'],
  'application/octet-stream': ['3dd', '3dcsl']
});

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let targetDir = PROJECTS_DIR;
    const uploadRoot = req.body && req.body.uploadRoot ? String(req.body.uploadRoot).trim() : '';
    if (uploadRoot) {
      const sanitizedRoot = path.normalize(uploadRoot).replace(/^(\.\.(\/|\\|$))+/, '');
      targetDir = path.join(PROJECTS_DIR, sanitizedRoot);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
    }
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    // Preserve original file name (or relative path if passed in body)
    const baseName = path.basename(file.originalname);
    cb(null, baseName);
  }
});

const upload = multer({ storage });

// API: Recursive projects tree listing
function getProjectsTree(dirPath, relativeRoot = 'projects') {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const result = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.join(relativeRoot, entry.name).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      result.push({
        type: 'folder',
        name: entry.name,
        contents: getProjectsTree(fullPath, relPath)
      });
    } else if (entry.isFile()) {
      result.push({
        type: 'file',
        name: entry.name,
        path: relPath
      });
    }
  }

  // Folders first, then files sorted alphabetically
  result.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return result;
}

app.get('/api/projects', (req, res) => {
  try {
    const tree = getProjectsTree(PROJECTS_DIR);
    res.json(tree);
  } catch (err) {
    console.error('Error listing projects:', err);
    res.status(500).json({ error: 'Failed to list projects' });
  }
});

// API: Create folder inside projects
app.post('/api/create-folder', (req, res) => {
  try {
    const folderName = req.body && req.body.name ? String(req.body.name).trim() : '';
    if (!folderName) {
      return res.status(400).json({ error: 'Folder name is required' });
    }
    const safeName = path.normalize(folderName).replace(/^(\.\.(\/|\\|$))+/, '');
    const targetPath = path.join(PROJECTS_DIR, safeName);
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
    res.json({ success: true, path: path.join('projects', safeName).replace(/\\/g, '/') });
  } catch (err) {
    console.error('Error creating folder:', err);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// API: Upload files into projects
app.post('/upload', upload.array('files'), (req, res) => {
  try {
    const saved = (req.files || []).map(file => {
      return path.relative(__dirname, file.path).replace(/\\/g, '/');
    });
    res.json({ success: true, saved });
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// API: Download Compiled Android APK
app.get('/csl-cad-view.apk', (req, res) => {
  const apkPath = path.join(__dirname, 'csl-cad-view.apk');
  if (fs.existsSync(apkPath)) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.download(apkPath, 'CSL-CAD-VIEW.apk');
  } else {
    res.status(404).send('APK file not found');
  }
});

// API: Download Android Project Zip
app.get('/csl-cad-view-android.zip', (req, res) => {
  const zipPath = path.join(__dirname, 'csl-cad-view-android.zip');
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, 'CSL-CAD-VIEW-Android-Project.zip');
  } else {
    res.status(404).send('Android project package not found');
  }
});

// API: Download Complete VS Code Project Zip (Web + Android + .vscode)
app.get('/csl-cad-view-vscode-project.zip', (req, res) => {
  const zipPath = path.join(__dirname, 'csl-cad-view-vscode-project.zip');
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, 'CSL-CAD-VIEW-VSCode-Project.zip');
  } else {
    res.status(404).send('VS Code project package not found');
  }
});

// API: Download Complete GitHub Repository Zip
app.get(['/csl-cad-view-github-repo.zip', '/github-repo.zip', '/repository.zip'], (req, res) => {
  const zipPath = path.join(__dirname, 'csl-cad-view-github-repo.zip');
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, 'csl-cad-view-github-repo.zip');
  } else {
    res.status(404).send('GitHub repository package not found');
  }
});

// Serve static files
app.use(express.static(__dirname, {
  dotfiles: 'ignore',
  etag: true,
  extensions: ['html'],
  index: 'index.html'
}));

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ShipView3D server listening on http://0.0.0.0:${PORT}`);
});
