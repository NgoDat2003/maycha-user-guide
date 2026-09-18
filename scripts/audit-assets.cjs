const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const assetDir = path.join(projectRoot, 'public', 'assets', 'user-guide', '2026-09-contract-guide');
const contentPath = path.join(projectRoot, 'src', 'content', 'guide-content.json');

console.log('=== ASSET INTEGRITY AUDIT ===');
console.log(`Checking directory: ${assetDir}`);

if (!fs.existsSync(assetDir)) {
  console.error(`Directory not found: ${assetDir}`);
  process.exit(1);
}

const files = fs.readdirSync(assetDir).filter((f) => f.endsWith('.png'));
console.log(`Found ${files.length} PNG files.`);

let errors = [];
const MIN_SIZE_BYTES = 20480; // 20KB

files.forEach((file) => {
  const filePath = path.join(assetDir, file);
  const stat = fs.statSync(filePath);
  if (stat.size < MIN_SIZE_BYTES) {
    errors.push(`File too small (${Math.round(stat.size / 1024)} KB < 20KB): ${file}`);
  }
});

let referencedAssets = new Set();
try {
  const guide = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
  (guide.sections || []).forEach((sec) => {
    (sec.blocks || []).forEach((b) => {
      if (b.type === 'image' && b.src) {
        referencedAssets.add(path.basename(b.src));
      }
    });
  });
} catch {
  // guide-content.json may be seed in early phases
}

console.log(`Referenced assets in guide-content.json: ${referencedAssets.size}`);

// Check for missing referenced assets
referencedAssets.forEach((ref) => {
  if (!files.includes(ref)) {
    errors.push(`Referenced asset missing on disk: ${ref}`);
  }
});

// Check for orphan assets
const orphans = files.filter((f) => referencedAssets.size > 0 && !referencedAssets.has(f));
if (orphans.length > 0) {
  console.warn(`[WARN] Orphan assets on disk (${orphans.length}): ${orphans.join(', ')}`);
}

if (files.length < 34) {
  errors.push(`Expected 34 images, found ${files.length}`);
}
// Check for duplicate/unapproved directories in public
const unapprovedDirs = [path.join(projectRoot, 'public', 'images')];
unapprovedDirs.forEach((dir) => {
  if (fs.existsSync(dir)) {
    errors.push(`Unapproved duplicate directory exists: ${path.relative(projectRoot, dir)}. All assets must reside in public/assets/user-guide/...`);
  }
});


if (errors.length > 0) {
  console.error(`\n=== AUDIT FAILED (${errors.length} errors) ===`);
  errors.forEach((e) => console.error(`✗ ${e}`));
  process.exit(1);
}

console.log(`✓ All ${files.length} images verified (>20KB, no missing files).`);
console.log('=== AUDIT PASSED ===\n');
process.exit(0);
