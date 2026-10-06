import subprocess
import os

svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.15"/>
    </filter>
  </defs>

  <!-- Background Card -->
  <rect x="18" y="18" width="476" height="476" rx="60" fill="#ffffff" stroke="#21b5eb" stroke-width="16"/>

  <!-- SHIP SUPERSTRUCTURE -->
  <!-- Mast & Radar Cross -->
  <rect x="251" y="62" width="10" height="50" fill="#0d47a1"/>
  <rect x="236" y="80" width="40" height="9" fill="#0d47a1"/>
  <circle cx="256" cy="62" r="5" fill="#0d47a1"/>

  <!-- Bridge Tier 1 -->
  <polygon points="236,110 276,110 282,130 230,130" fill="#1565c0"/>
  <!-- Bridge Tier 2 -->
  <polygon points="216,130 296,130 302,154 210,154" fill="#0d47a1"/>
  <!-- Bridge Tier 3 -->
  <polygon points="196,154 316,154 324,180 188,180" fill="#1976d2"/>

  <!-- Main Ship Hull -->
  <!-- Port (Left) Hull - Bright Marine Cyan -->
  <polygon points="256,180 256,306 122,238 140,180" fill="#0288d1"/>
  <!-- Starboard (Right) Hull - Deep Navy -->
  <polygon points="256,180 256,306 332,232 316,180" fill="#0d47a1"/>
  <!-- Hull Center Line (Bow Keel) -->
  <line x1="256" y1="180" x2="256" y2="306" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>

  <!-- OCEAN WAVES -->
  <!-- Wave 1 (Top Cyan) -->
  <path d="M 104,282 C 160,246 205,310 270,270 C 305,248 340,268 368,266" fill="none" stroke="#00b0ff" stroke-width="18" stroke-linecap="round"/>
  <!-- Wave 2 (Middle Deep Blue) -->
  <path d="M 126,312 C 176,278 220,336 280,296 C 314,274 348,294 374,292" fill="none" stroke="#0288d1" stroke-width="16" stroke-linecap="round"/>
  <!-- Wave 3 (Bottom Navy) -->
  <path d="M 152,342 C 196,312 236,360 292,322 C 322,304 350,320 372,318" fill="none" stroke="#0d47a1" stroke-width="14" stroke-linecap="round"/>

  <!-- CAD TRIANGLE RULER / SET SQUARE -->
  <g>
    <!-- Outer Triangle (Charcoal Dark CAD tool) -->
    <polygon points="304,264 438,124 438,368" fill="#2d3748"/>
    <!-- Inner Cutout Triangle -->
    <polygon points="346,264 416,192 416,334" fill="#ffffff"/>
    
    <!-- Measurement Scale Tick Marks along right edge -->
    <line x1="438" y1="160" x2="422" y2="160" stroke="#718096" stroke-width="3.5"/>
    <line x1="438" y1="186" x2="428" y2="186" stroke="#718096" stroke-width="2.5"/>
    <line x1="438" y1="212" x2="422" y2="212" stroke="#718096" stroke-width="3.5"/>
    <line x1="438" y1="238" x2="428" y2="238" stroke="#718096" stroke-width="2.5"/>
    <line x1="438" y1="264" x2="422" y2="264" stroke="#718096" stroke-width="3.5"/>
    <line x1="438" y1="290" x2="428" y2="290" stroke="#718096" stroke-width="2.5"/>
    <line x1="438" y1="316" x2="422" y2="316" stroke="#718096" stroke-width="3.5"/>
    <line x1="438" y1="342" x2="428" y2="342" stroke="#718096" stroke-width="2.5"/>
  </g>

  <!-- TEXT LABEL: CSL CAD VIEW -->
  <text x="256" y="442" text-anchor="middle" font-family="'Roboto', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="44" fill="#111827" letter-spacing="1.2">CSL CAD VIEW</text>
</svg>'''

icons_dir = '/app/applet/icons'
os.makedirs(icons_dir, exist_ok=True)
svg_path = os.path.join(icons_dir, 'icon.svg')

with open(svg_path, 'w') as f:
    f.write(svg_content)

print(f"Wrote {svg_path}")

# Generate PNGs using ImageMagick convert
sizes = [
    (192, 192, 'icon-192.png'),
    (512, 512, 'icon-512.png'),
    (180, 180, 'apple-touch-icon.png'),
    (48, 48, 'favicon.png')
]

for w, h, filename in sizes:
    out_path = os.path.join(icons_dir, filename)
    cmd = ['convert', '-background', 'none', '-density', '288', '-resize', f'{w}x{h}', svg_path, out_path]
    subprocess.run(cmd, check=True)
    print(f"Generated {out_path} ({w}x{h})")

print("All icons successfully generated!")
