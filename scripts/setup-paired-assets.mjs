import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const assetDir = path.join(projectRoot, 'public', 'assets', 'user-guide', '2026-09-contract-guide');
const backupDir = path.join(assetDir, '.originals');

// Ensure backup dir exists
fs.mkdirSync(backupDir, { recursive: true });

// Backup all base images if not yet backed up
const currentFiles = fs.readdirSync(assetDir).filter(f => f.endsWith('.png'));
currentFiles.forEach(file => {
  const src = path.join(assetDir, file);
  const dst = path.join(backupDir, file);
  if (!fs.existsSync(dst)) {
    fs.copyFileSync(src, dst);
  }
});

// Map of paired trigger files to create from base originals
const TRIGGER_PAIRS = [
  { trigger: 'ug-master-02-store-trigger.png', base: 'ug-master-01-stores-list.png' },
  { trigger: 'ug-master-04-vendor-trigger.png', base: 'ug-master-03-vendors-list.png' },
  { trigger: 'ug-contract-04-alert-trigger.png', base: 'ug-contract-01-list-console.png' },
  { trigger: 'ug-contract-05-edit-trigger.png', base: 'ug-detail-01-legal-overview.png' },
  { trigger: 'ug-finance-03-mapping-trigger.png', base: 'ug-finance-01-sap-section.png' },
  { trigger: 'ug-addendum-01-trigger.png', base: 'ug-detail-01-legal-overview.png' },
  { trigger: 'ug-termination-01-trigger.png', base: 'ug-detail-01-legal-overview.png' },
  { trigger: 'ug-payment-03-history-trigger.png', base: 'ug-payment-01-console-table.png' },
  { trigger: 'ug-admin-02b-user-trigger.png', base: 'ug-admin-02-users-table.png' },
];

TRIGGER_PAIRS.forEach(({ trigger, base }) => {
  const baseSrc = fs.existsSync(path.join(backupDir, base)) 
    ? path.join(backupDir, base) 
    : path.join(assetDir, base);
  const triggerDst = path.join(assetDir, trigger);
  const triggerBackup = path.join(backupDir, trigger);

  fs.copyFileSync(baseSrc, triggerDst);
  fs.copyFileSync(baseSrc, triggerBackup);
  console.log(`✓ Đã tạo file trigger: ${trigger} từ ${base}`);
});

console.log('=== HOÀN TẤT THIẾT LẬP FILE ẢNH ĐÔI ===');
