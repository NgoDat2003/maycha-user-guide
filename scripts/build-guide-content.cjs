const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const contentPath = path.join(projectRoot, 'src', 'content', 'guide-content.json');
const publicRoot = path.join(projectRoot, 'public');

const allowedBlockTypes = new Set(['paragraph', 'label', 'steps', 'bullets', 'table', 'image']);
const requiredMetadata = ['title', 'version', 'systemName', 'scope', 'audience', 'notice'];
const errors = [];

const fail = (message) => errors.push(message);
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

let guide;
try {
  guide = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
} catch (error) {
  console.error('Failed to parse guide-content.json:', error.message);
  process.exit(1);
}

// 1. Metadata check
requiredMetadata.forEach((key) => {
  if (!isNonEmptyString(guide[key])) fail(`metadata.${key} must be a non-empty string.`);
});

// 2. imageCount check
if (!Number.isInteger(guide.imageCount) || guide.imageCount < 0) {
  fail('metadata.imageCount must be a non-negative integer.');
}

// 3. sections check
if (!Array.isArray(guide.sections) || guide.sections.length === 0) {
  fail('sections must be a non-empty array.');
}

const REQUIRED_LABELS = [
  'Ai làm việc này?',
  'Việc này để làm gì?',
  'Cần chuẩn bị trước',
  'Làm theo từng bước',
  'Bạn sẽ thấy gì',
  'Mẹo hay & Điều cần biết',
].map((s) => s.normalize('NFC'));

// Whitelisted 3-step sections (pure observation / read-only)
const THREE_STEP_SECTION_IDS = new Set([
  'dashboard-site',          // 1.2 Bàn làm việc Phòng Mặt Bằng
  'dashboard-accountant',    // 1.3 Bàn làm việc Phòng Kế Toán
  'dashboard-legal',         // 1.4 Bàn làm việc Phòng Pháp Chế
  'dashboard-admin',         // 1.5 Bàn làm việc Ban Giám Đốc
  'contract-status-badges',  // 4.3 Đọc hiểu Huy hiệu Trạng thái & Cảnh báo hạn
  'detail-audit-tab',        // 5.4 Tab Lịch sử & Kiểm toán Hợp đồng
  'payment-sap-history-modal', // 9.3 Nhật ký Lịch sử Xuất SAP
]);

const ids = new Set();
let actualImageCount = 0;
let level1Count = 0;
let level2Count = 0;
const missingAssets = [];

(guide.sections || []).forEach((section, sectionIndex) => {
  const prefix = `sections[${sectionIndex}] (id: ${section.id || 'missing'})`;

  if (!isNonEmptyString(section.id)) fail(`${prefix}: missing or empty id.`);
  if (ids.has(section.id)) fail(`${prefix}: duplicate id '${section.id}'.`);
  ids.add(section.id);

  if (!isNonEmptyString(section.title)) fail(`${prefix}: missing or empty title.`);
  if (![1, 2].includes(section.level)) fail(`${prefix}: level must be 1 or 2.`);

  if (!Array.isArray(section.blocks)) {
    fail(`${prefix}: blocks must be an array.`);
    return;
  }

  let sectionImageCount = 0;
  section.blocks.forEach((block, blockIndex) => {
    const blockPrefix = `${prefix}.blocks[${blockIndex}]`;
    if (!allowedBlockTypes.has(block.type)) {
      fail(`${blockPrefix}: invalid block type '${block.type}'.`);
    }

    if (block.type === 'table') {
      if (!Array.isArray(block.headers) || block.headers.length === 0) {
        fail(`${blockPrefix}: table headers must be a non-empty array.`);
      }
      if (!Array.isArray(block.rows)) {
        fail(`${blockPrefix}: table rows must be an array.`);
      } else {
        block.rows.forEach((row, rowIndex) => {
          if (!Array.isArray(row) || row.length !== block.headers.length) {
            fail(`${blockPrefix}.rows[${rowIndex}]: column count (${row?.length}) does not match headers (${block.headers.length}).`);
          }
        });
      }
    }

    if (block.type === 'image') {
      sectionImageCount++;
      actualImageCount++;
      if (!isNonEmptyString(block.src)) {
        fail(`${blockPrefix}: image src must be a non-empty string.`);
      } else {
        const cleanSrc = block.src.replace(/^\//, '');
        const assetPath = path.join(publicRoot, cleanSrc);
        if (!fs.existsSync(assetPath)) {
          missingAssets.push(cleanSrc);
        }
      }
    }
  });

  if (section.level === 1) {
    level1Count++;
    if (sectionImageCount > 0) {
      fail(`${prefix}: level 1 section must NOT contain any image blocks (found ${sectionImageCount}).`);
    }
  } else if (section.level === 2) {
    level2Count++;

    // 11. Image count check (allows 1 to 3 images per section)
    if (sectionImageCount < 1) {
      fail(`${prefix}: level 2 section must contain at least 1 image block (found ${sectionImageCount}).`);
    }

    // 10. Check 6-element standard
    const labels = section.blocks
      .filter((b) => b.type === 'label')
      .map((b) => (b.text || '').normalize('NFC').trim());

    REQUIRED_LABELS.forEach((reqLabel, idx) => {
      const foundIdx = labels.findIndex((l) => l.includes(reqLabel));
      if (foundIdx === -1) {
        fail(`${prefix}: missing standard label '${reqLabel}'. Found labels: [${labels.join(', ')}]`);
      }
    });

    // Check action steps bounds
    const actionIndex = section.blocks.findIndex(
      (b) => b.type === 'label' && (b.text || '').normalize('NFC').includes('Làm theo từng bước')
    );
    const resultIndex = section.blocks.findIndex(
      (b) => b.type === 'label' && (b.text || '').normalize('NFC').includes('Bạn sẽ thấy gì')
    );
    const cautionIndex = section.blocks.findIndex(
      (b) => b.type === 'label' && (b.text || '').normalize('NFC').includes('Mẹo hay')
    );

    if (actionIndex >= 0 && resultIndex > actionIndex) {
      const stepBlocks = section.blocks.slice(actionIndex, resultIndex).filter((b) => b.type === 'steps');
      if (stepBlocks.length === 0) {
        fail(`${prefix}: missing steps block under 'Làm theo từng bước'.`);
      } else {
        const steps = stepBlocks[0];
        const minSteps = THREE_STEP_SECTION_IDS.has(section.id) ? 3 : 4;
        if (steps.items.length < minSteps || steps.items.length > 7) {
          fail(`${prefix}: steps count must be between ${minSteps} and 7 (found ${steps.items.length}).`);
        }
      }

      // Check image is between action and result
      // Check image is between action and result (allows 1 to 3 sequential images)
      const imageBlocks = section.blocks.slice(actionIndex, resultIndex).filter((b) => b.type === 'image');
      if (imageBlocks.length < 1) {
        fail(`${prefix}: section must have at least 1 image located between 'Làm theo từng bước' and 'Bạn sẽ thấy gì'.`);
      }
    }

    // Check caution bullets bounds
    if (cautionIndex >= 0) {
      const bulletBlocks = section.blocks.slice(cautionIndex + 1).filter((b) => b.type === 'bullets');
      if (bulletBlocks.length === 0) {
        fail(`${prefix}: missing bullets block after 'Mẹo hay & Điều cần biết'.`);
      } else {
        const bullets = bulletBlocks[0];
        if (bullets.items.length < 2 || bullets.items.length > 4) {
          fail(`${prefix}: caution bullets must have 2 to 4 items (found ${bullets.items.length}).`);
        }
      }
    }
  }
});

// Check image counts
if (guide.imageCount !== actualImageCount) {
  fail(`metadata.imageCount is ${guide.imageCount}, but content contains ${actualImageCount} image blocks.`);
}

if (missingAssets.length > 0) {
  [...new Set(missingAssets)].forEach((asset) => fail(`Missing physical image asset: ${asset}`));
}

// Check level counts
if (level2Count < 34) {
  fail(`Expected at least 34 level 2 sections, found ${level2Count}.`);
}
if (level1Count !== 12) {
  fail(`Expected exactly 12 level 1 chapter sections, found ${level1Count}.`);
}

if (errors.length > 0) {
  console.error(`\n=== CONTENT CONTRACT VALIDATION FAILED (${errors.length} errors) ===\n`);
  errors.forEach((err, i) => console.error(`${i + 1}. ${err}`));
  console.error('\nPlease fix the issues above before building.\n');
  process.exit(1);
}

console.log(JSON.stringify({
  status: 'VALIDATION_PASSED',
  totalSections: guide.sections.length,
  chapters: level1Count,
  sections: level2Count,
  images: actualImageCount,
  metadata: {
    title: guide.title,
    version: guide.version,
    systemName: guide.systemName,
  },
}, null, 2));

process.exit(0);
