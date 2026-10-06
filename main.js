const ProjectManager = {
    serverTree: [],
    deviceTree: [],
    selectedFiles: [],

    init() {
        const dirInput = document.getElementById('projectsDirInput');
        if (dirInput) {
            dirInput.addEventListener('change', async (e) => {
                const files = Array.from(e.target.files || []);
                if (files.length === 0) return;
                await this.handleDeviceFiles(files, null);
                dirInput.value = '';
            });
        }

        const filesInput = document.getElementById('projectsUploadFilesInput');
        if (filesInput) {
            filesInput.addEventListener('change', async (e) => {
                const files = Array.from(e.target.files || []);
                if (files.length === 0) return;
                await this.handleDeviceFiles(files, 'Downloads');
                filesInput.value = '';
            });
        }

        // Setup drag & drop on projects panel & canvas container
        ['panel-projects', 'canvas-container'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
            el.addEventListener('drop', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const files = Array.from(e.dataTransfer.files);
                    await this.handleDeviceFiles(files, 'Dropped');
                }
            });
        });

        this.refreshAll();
    },

    async handleDeviceFiles(files, defaultFolder = null) {
        if (!files || files.length === 0) return;
        if (window.UI && UI.setLoading) UI.setLoading(`Reading ${files.length} device file(s)...`);

        try {
            if (window.IDBStorage) {
                await IDBStorage.saveFiles(files, defaultFolder);
            }
            await this.refreshAll();
            if (window.UI && UI.setLoading) {
                UI.setLoading(`Saved ${files.length} file(s) to device storage`);
                setTimeout(() => { if (UI && UI.setLoading) UI.setLoading(null); }, 2200);
            }
        } catch (err) {
            console.error('Error saving device files to storage:', err);
            if (window.UI && UI.setLoading) {
                UI.setLoading('Failed to save device files');
                setTimeout(() => { if (UI && UI.setLoading) UI.setLoading(null); }, 2500);
            }
        }
    },

    async pickDeviceFolder() {
        // Modern File System Access API (supported on Chrome Android & desktop)
        if ('showDirectoryPicker' in window) {
            try {
                if (window.UI && UI.setLoading) UI.setLoading('Select your device folder...');
                const dirHandle = await window.showDirectoryPicker();
                if (window.UI && UI.setLoading) UI.setLoading(`Scanning folder "${dirHandle.name}"...`);

                const loadedFiles = [];
                async function scanDirectory(handle, prefix = '') {
                    for await (const entry of handle.values()) {
                        const rel = prefix ? (prefix + '/' + entry.name) : entry.name;
                        if (entry.kind === 'file') {
                            const file = await entry.getFile();
                            try {
                                Object.defineProperty(file, 'webkitRelativePath', {
                                    value: rel,
                                    writable: true,
                                    configurable: true
                                });
                            } catch (e) {}
                            loadedFiles.push(file);
                        } else if (entry.kind === 'directory') {
                            await scanDirectory(entry, rel);
                        }
                    }
                }

                await scanDirectory(dirHandle, dirHandle.name);

                if (loadedFiles.length > 0) {
                    await this.handleDeviceFiles(loadedFiles, null);
                    return;
                } else {
                    if (window.UI && UI.setLoading) {
                        UI.setLoading(`Folder "${dirHandle.name}" contains no readable files`);
                        setTimeout(() => { if (UI && UI.setLoading) UI.setLoading(null); }, 2500);
                    }
                    return;
                }
            } catch (err) {
                if (err.name === 'AbortError') {
                    if (window.UI && UI.setLoading) UI.setLoading(null);
                    return;
                }
                console.warn('showDirectoryPicker unavailable or error, falling back to input:', err);
                if (window.UI && UI.setLoading) UI.setLoading(null);
            }
        }

        // Mobile Android fallback
        const dirInput = document.getElementById('projectsDirInput');
        if (dirInput) {
            dirInput.click();
        }
    },

    pickDeviceFiles() {
        const uploadFilesInput = document.getElementById('projectsUploadFilesInput');
        if (uploadFilesInput) {
            uploadFilesInput.click();
        }
    },

    async clearDeviceProjects() {
        try {
            if (window.IDBStorage) {
                await IDBStorage.clearAll();
            }
            await this.refreshAll();
            if (window.UI && UI.setLoading) {
                UI.setLoading('Local device storage cleared');
                setTimeout(() => { if (UI && UI.setLoading) UI.setLoading(null); }, 2000);
            }
        } catch (err) {
            console.error('Failed to clear device storage:', err);
        }
    },

    async refreshAll() {
        const container = document.getElementById('project-container');
        if (!container) return;

        // 1. Load Server Projects
        const apiBase = (window.APP_CONFIG && window.APP_CONFIG.apiBase) || '/';
        const projectsUrl = apiBase + 'api/projects';
        this.serverTree = [];
        try {
            const res = await fetch(projectsUrl);
            if (res.ok) {
                this.serverTree = await res.json();
            }
        } catch (err) {
            console.warn('ProjectManager: Server projects unreachable:', err);
        }

        // 2. Load Device Projects from IndexedDB
        this.deviceTree = [];
        try {
            if (window.IDBStorage) {
                const entries = await IDBStorage.listFiles();
                if (entries && entries.length > 0) {
                    const root = [];
                    entries.forEach(e => {
                        const parts = e.path.split('/');
                        let cur = root;
                        for (let i = 0; i < parts.length; i++) {
                            const part = parts[i];
                            const isFile = (i === parts.length - 1);
                            if (isFile) {
                                cur.push({ type: 'file', name: part, path: e.path, idb: true, size: e.size });
                            } else {
                                let folder = cur.find(x => x.type === 'folder' && x.name === part);
                                if (!folder) {
                                    folder = { type: 'folder', name: part, contents: [] };
                                    cur.push(folder);
                                }
                                cur = folder.contents;
                            }
                        }
                    });
                    this.deviceTree = root;
                }
            }
        } catch (err) {
            console.warn('ProjectManager: IDB load error:', err);
        }

        // 3. Render Combined View
        container.innerHTML = '';

        function countFiles(tree) {
            let count = 0;
            function walk(list) {
                if (!Array.isArray(list)) return;
                for (const it of list) {
                    if (it.type === 'file') count++;
                    else if (it.type === 'folder') walk(it.contents);
                }
            }
            walk(tree);
            return count;
        }

        // --- SECTION 1: DEVICE PROJECTS (Downloads / Local) ---
        const devHeader = document.createElement('div');
        devHeader.style.cssText = 'display:flex; justify-content:space-between; align-items:center; font-weight:700; font-size:12px; color:var(--panel-text); padding:6px 4px; border-bottom:1px solid var(--panel-border); margin-bottom:6px;';
        devHeader.innerHTML = `<span style="display:flex; align-items:center; gap:4px;"><span class="material-icons" style="font-size:16px; color:var(--accent);">phone_android</span> Device Projects (${countFiles(this.deviceTree)})</span>`;
        container.appendChild(devHeader);

        const devContainer = document.createElement('div');
        devContainer.style.marginBottom = '16px';
        if (this.deviceTree.length === 0) {
            devContainer.innerHTML = '<div style="padding:10px 12px; font-size:12px; color:var(--panel-text); opacity:0.8; background:var(--hover-bg); border-radius:6px; line-height:1.5;">No device projects found.<br>Tap <strong>Pick Device Folder</strong> above to view your device\'s <code>Download/projects</code> folder.</div>';
        } else {
            this.buildTree(this.deviceTree, devContainer, true);
        }
        container.appendChild(devContainer);

        // --- SECTION 2: SERVER PROJECTS ---
        const srvHeader = document.createElement('div');
        srvHeader.style.cssText = 'display:flex; justify-content:space-between; align-items:center; font-weight:700; font-size:12px; color:var(--panel-text); padding:6px 4px; border-bottom:1px solid var(--panel-border); margin-bottom:6px;';
        srvHeader.innerHTML = `<span style="display:flex; align-items:center; gap:4px;"><span class="material-icons" style="font-size:16px; color:var(--accent);">cloud_queue</span> Server Projects (${countFiles(this.serverTree)})</span>`;
        container.appendChild(srvHeader);

        const srvContainer = document.createElement('div');
        if (this.serverTree.length === 0) {
            srvContainer.innerHTML = '<div style="padding:8px; font-size:12px; opacity:0.7;">No server projects available.</div>';
        } else {
            this.buildTree(this.serverTree, srvContainer, false);
        }
        container.appendChild(srvContainer);
    },

    buildTree(data, parentElement, isDevice = false) {
        parentElement.innerHTML = '';

        data.forEach(item => {
            const row = document.createElement('div');
            row.className = 'proj-item';

            if (item.type === 'folder') {
                row.innerHTML = `<div style="display:flex;align-items:center;"><span class="material-icons">folder</span> ${item.name}</div><span class="material-icons">expand_more</span>`;

                const nestedContainer = document.createElement('div');
                nestedContainer.className = 'proj-folder';
                this.buildTree(item.contents, nestedContainer, isDevice);

                row.onclick = () => {
                    nestedContainer.classList.toggle('open');
                    const icon = row.querySelector('span:last-child');
                    if (icon) icon.innerText = nestedContainer.classList.contains('open') ? 'expand_less' : 'expand_more';
                };

                parentElement.appendChild(row);
                parentElement.appendChild(nestedContainer);
            } else if (item.type === 'file') {
                const is3d = /\.(3dd|3dcsl|dxf|step|stp|3dm)$/i.test(item.name);
                row.innerHTML = `<div style="display:flex;align-items:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:65%;">
                    <span class="material-icons" style="color:${is3d ? 'var(--accent)' : 'inherit'};">${is3d ? 'view_in_ar' : 'insert_drive_file'}</span>
                    <span title="${item.name}">${item.name}</span>
                </div>`;

                const openBtn = document.createElement('button');
                openBtn.className = 'proj-open-btn icon-btn';
                openBtn.innerHTML = '<span class="material-icons">folder_open</span>';
                openBtn.title = 'Open (replace)';

                const addBtn = document.createElement('button');
                addBtn.className = 'proj-add-btn icon-btn';
                addBtn.innerHTML = '<span class="material-icons">add</span>';
                addBtn.title = 'Add (append to scene)';

                const actions = document.createElement('div');
                actions.style.display = 'flex';
                actions.style.gap = '4px';
                actions.style.alignItems = 'center';

                const handleAction = (append = false) => {
                    return async (e) => {
                        e.stopPropagation();
                        if (item.idb) {
                            try {
                                const blob = await IDBStorage.getFile(item.path);
                                if (!blob) throw new Error('File not found in local storage');
                                const fileData = new File([blob], item.name, { type: blob.type });
                                await this.loadFileToScene(fileData, append);
                            } catch (err) {
                                console.error('Failed to load IDB file:', err);
                                if (window.UI && UI.setLoading) UI.setLoading('Error loading file: ' + err.message);
                            }
                        } else if (item.file) {
                            await this.loadFileToScene(item.file, append);
                        } else if (item.path) {
                            const apiBase = (window.APP_CONFIG && window.APP_CONFIG.apiBase) || '/';
                            const url = (item.path.startsWith('http') || item.path.startsWith('/')) ? item.path : apiBase + item.path;
                            try {
                                const response = await fetch(url);
                                const blob = await response.blob();
                                const fileData = new File([blob], item.name);
                                await this.loadFileToScene(fileData, append);
                            } catch (err) {
                                console.error('Failed to fetch server file:', err);
                                if (window.UI && UI.setLoading) UI.setLoading('Failed to fetch file from server');
                            }
                        }
                    };
                };

                openBtn.onclick = handleAction(false);
                addBtn.onclick = handleAction(true);

                actions.appendChild(openBtn);
                actions.appendChild(addBtn);

                if (isDevice && item.idb) {
                    const delBtn = document.createElement('button');
                    delBtn.className = 'proj-close-btn icon-btn';
                    delBtn.innerHTML = '<span class="material-icons" style="font-size:16px;color:#ef5350;">close</span>';
                    delBtn.title = 'Remove from device storage';
                    delBtn.onclick = async (e) => {
                        e.stopPropagation();
                        await IDBStorage.deleteFile(item.path);
                        await this.refreshAll();
                    };
                    actions.appendChild(delBtn);
                }

                row.appendChild(actions);
                parentElement.appendChild(row);
            }
        });
    },

    async loadFileToScene(file, append = false) {
        if (!file) return;
        const name = file.name.toLowerCase();
        const is3d = name.endsWith('.3dd') || name.endsWith('.3dcsl') || name.endsWith('.dxf') || name.endsWith('.step') || name.endsWith('.stp') || name.endsWith('.3dm');

        if (is3d) {
            if (window.App && typeof App.processAndLoadFiles === 'function') {
                await App.processAndLoadFiles([file], append);
                return;
            }
            if (append) {
                await this.loadAndAppendFile(file, true);
            } else {
                this.openLocalFile(file);
            }
        } else {
            this.openLocalFile(file);
        }
    },

    async createFolder() {
        const name = (window.prompt('Enter new folder name to create under projects:', '') || '').trim();
        if (!name) return;
        const apiBase = (window.APP_CONFIG && window.APP_CONFIG.apiBase) || '/';
        const url = apiBase + 'api/create-folder';
        try {
            const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
            const json = await res.json();
            if (!res.ok) throw new Error(json && json.error ? json.error : 'create failed');
            await this.refreshAll();
        } catch (e) {
            console.warn('Server folder create failed, creating in local tree:', e);
            await this.refreshAll();
        }
    },

    openLocalFile(file) {
        if (!file) return;
        const name = (file && file.name) ? file.name.toLowerCase() : '';
        if (name.endsWith('.3dd') || name.endsWith('.3dcsl') || name.endsWith('.dxf') || name.endsWith('.step') || name.endsWith('.stp') || name.endsWith('.3dm')) {
            if (window.App && typeof App.processAndLoadFiles === 'function') {
                App.processAndLoadFiles([file], false);
                return;
            }
            const fileInput = document.getElementById('fileInput');
            if (fileInput) {
                const dt = new DataTransfer();
                dt.items.add(file);
                fileInput.files = dt.files;
                fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                return;
            }
        }

        // Fallback viewer for text or images
        const viewer = document.getElementById('project-file-viewer');
        if (!viewer) return;
        const filename = document.getElementById('viewer-filename');
        const content = document.getElementById('viewer-content');
        if (filename) filename.innerText = file.name;
        if (content) content.innerHTML = '';

        const textLike = file.type.startsWith('text') || /\.(txt|md|json|csv|xml|html|css|js|csl)$/i.test(file.name);

        if (textLike) {
            const reader = new FileReader();
            reader.onload = () => { if (content) content.textContent = reader.result; viewer.style.display = 'block'; };
            reader.onerror = () => { if (content) content.textContent = 'Failed to read file.'; viewer.style.display = 'block'; };
            reader.readAsText(file);
        } else {
            if (/^image\//.test(file.type)) {
                const url = URL.createObjectURL(file);
                const img = document.createElement('img');
                img.src = url; img.style.maxWidth = '100%'; img.style.maxHeight = '100%';
                if (content) content.appendChild(img);
                viewer.style.display = 'block';
            } else {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(file);
                link.download = file.name;
                link.innerText = 'Download ' + file.name;
                link.style.color = 'var(--accent)';
                if (content) content.appendChild(link);
                viewer.style.display = 'block';
            }
        }
    },

    async loadAndAppendFile(file, append=true) {
        try {
            if (!file) throw new Error('no file');
            const name = file.name || 'file';
            if (window.App && typeof App.processAndLoadFiles === 'function') {
                await App.processAndLoadFiles([file], append);
                return true;
            }
            if (UI && UI.setLoading) UI.setLoading(`Reading ${name}...`);
            const buffer = await file.arrayBuffer();
            const isEncrypted = name.toLowerCase().endsWith('.3dcsl');
            let text;
            if (isEncrypted) {
                const data = new Uint8Array(buffer);
                const decrypted = await decryptAES(data, ENCRYPTION_PASSWORD);
                if (!decrypted) {
                    if (UI && UI.setLoading) UI.setLoading(`Failed to decrypt ${name}`);
                    throw new Error('decrypt failed');
                }
                text = decrypted;
            } else {
                text = new TextDecoder('utf-8').decode(buffer);
            }

            if (!text || !text.includes('I obi')) {
                if (UI && UI.setLoading) UI.setLoading(`Warning: ${name} may not be a valid project file`);
                throw new Error('invalid file');
            }

            if (UI && UI.setLoading) UI.setLoading('Parsing Geometry...');
            const parts = Parser.collectParts(text, name);
            if (parts && parts.length > 0) {
                if (!append && Parser && Parser.fileDataList) Parser.fileDataList = [];
                const prevList = Array.isArray(Parser.fileDataList) ? Parser.fileDataList.slice() : [];
                Parser.fileDataList = prevList.concat([{ name, rawParts: parts }]);
                if (UI && UI.setLoading) UI.setLoading('Building Scene...');
                setTimeout(() => {
                    try { Parser.buildAllFiles(); } catch (err) { console.error('Build error:', err); }
                    if (UI && UI.setLoading) UI.setLoading(null);
                }, 50);
            }
            return true;
        } catch (err) {
            if (UI && UI.setLoading) UI.setLoading('Error: ' + (err && err.message));
            return Promise.reject(err);
        }
    },

    downloadAll() {
        console.warn('Download All is not supported in local mode. Open files and download individually.');
        if (window.UI && UI.setLoading) {
            UI.setLoading('Download All is not supported in local mode. Open files and download individually.');
            setTimeout(() => { if (UI && UI.setLoading) UI.setLoading(null); }, 3000);
        }
    }
};

setTimeout(() => ProjectManager.init(), 600);