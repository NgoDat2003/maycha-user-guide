import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import {
  CAPTURE_TARGETS,
  ANCHOR_CONTRACT_ID,
} from './capture-targets.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(projectRoot, 'public', 'assets', 'user-guide', '2026-09-contract-guide');
const LEDGER_PATH = path.join(projectRoot, 'src', 'content', 'evidence-ledger.json');

const CREDENTIALS = {
  ADMIN: { email: 'admin@maycha.com.vn', password: 'Maycha@2026' },
  SITE: { email: 'site@maycha.com.vn', password: 'Maycha@2026' },
  ACCOUNTANT: { email: 'ketoan@maycha.com.vn', password: 'Maycha@2026' },
  LEGAL: { email: 'legal@maycha.com.vn', password: 'Maycha@2026' },
};

const VISUAL_HYGIENE_CSS = `
  *, *::before, *::after {
    transition: none !important;
    animation: none !important;
    caret-color: transparent !important;
  }
  [data-sonner-toaster],
  [data-radix-toast-announce-exclude],
  .toaster { display: none !important; }
  ::-webkit-scrollbar { display: none !important; width: 0 !important; }
  * { scrollbar-width: none !important; }
`;

async function applyVisualHygiene(page) {
  await page.addStyleTag({ content: VISUAL_HYGIENE_CSS }).catch(() => {});
  await page.evaluate(() => {
    document.fonts?.ready;
  }).catch(() => {});
}

async function loginContext(context, role) {
  const creds = CREDENTIALS[role];
  if (!creds) return;

  const res = await context.request.post(`${BASE_URL}/api/auth/login`, {
    data: creds,
  });

  if (!res.ok()) {
    throw new Error(`Login failed for ${role}: ${res.status()} ${await res.text()}`);
  }
}

async function main() {
  console.log('=== KHỞI CHẠY TIẾN TRÌNH CHỤP 34 ẢNH HƯỚNG DẪN SỬ DỤNG MAYCHA ===');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Thư mục lưu ảnh: ${OUTPUT_DIR}`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
  });

  const contextOptions = {
    baseURL: BASE_URL,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  };

  const contexts = {
    NONE: await browser.newContext(contextOptions),
    SITE: await browser.newContext(contextOptions),
    ACCOUNTANT: await browser.newContext(contextOptions),
    LEGAL: await browser.newContext(contextOptions),
    ADMIN: await browser.newContext(contextOptions),
  };

  console.log('Đang đăng nhập phiên cho 4 vai trò...');
  for (const role of ['SITE', 'ACCOUNTANT', 'LEGAL', 'ADMIN']) {
    try {
      await loginContext(contexts[role], role);
      console.log(`✓ Đã đăng nhập vai trò: ${role}`);
    } catch (err) {
      console.error(`✗ Lỗi đăng nhập vai trò ${role}:`, err.message);
      process.exit(1);
    }
  }

  const ledger = [];

  for (const target of CAPTURE_TARGETS) {
    console.log(`[${target.index}/34] Đang chụp: ${target.filename} (${target.title}) - Vai trò: ${target.role}`);
    const context = contexts[target.role] || contexts.ADMIN;
    const page = await context.newPage();

    try {
      page.on('load', async () => {
        await applyVisualHygiene(page);
      });

      await target.action(page, context);
      await applyVisualHygiene(page);
      await page.waitForTimeout(500);

      const filePath = path.join(OUTPUT_DIR, target.filename);
      await page.screenshot({ path: filePath, fullPage: false });


      const stat = fs.statSync(filePath);
      console.log(`  ✓ Đã lưu: ${target.filename} (${Math.round(stat.size / 1024)} KB)`);

      ledger.push({
        index: target.index,
        id: target.id,
        filename: target.filename,
        section: target.section,
        role: target.role,
        url: target.url,
        title: target.title,
        fileSize: stat.size,
        capturedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error(`  ✗ Lỗi khi chụp ${target.filename}:`, err.message);
      try {
        const filePath = path.join(OUTPUT_DIR, target.filename);
        await page.screenshot({ path: filePath, fullPage: false });
        const stat = fs.statSync(filePath);
        ledger.push({
          index: target.index,
          id: target.id,
          filename: target.filename,
          section: target.section,
          role: target.role,
          url: target.url,
          title: target.title,
          fileSize: stat.size,
          capturedAt: new Date().toISOString(),
          warning: err.message,
        });
        console.log(`  ⚠ Đã chụp fallback: ${target.filename} (${Math.round(stat.size / 1024)} KB)`);
      } catch (fallbackErr) {
        console.error(`  ✗ Lỗi chụp fallback ${target.filename}:`, fallbackErr.message);
      }
    } finally {
      await page.close();
    }
  }

  // Chụp lại ảnh 20 (tab Kiểm toán) SAU CÙNG theo đúng quy định plan để thể hiện nhật ký mới nhất
  console.log('\n[BƯỚC BỔ SUNG] Chụp đè ảnh 20 (Lịch sử & Kiểm toán) sau khi đã thực hiện các thao tác...');
  try {
    const page20 = await contexts.ADMIN.newPage();
    await page20.goto(`/lease-contracts/${ANCHOR_CONTRACT_ID}`);
    const auditTab = page20.locator('[role="tab"]:has-text("Lịch Sử & Kiểm Toán")').first();
    await auditTab.waitFor({ state: 'visible', timeout: 10000 });
    await auditTab.click();
    await applyVisualHygiene(page20);
    await page20.waitForTimeout(1200);

    const filePath20 = path.join(OUTPUT_DIR, 'ug-detail-04-audit-tab.png');
    await page20.screenshot({ path: filePath20, fullPage: false });
    const stat20 = fs.statSync(filePath20);
    console.log(`✓ Đã cập nhật ảnh 20: ug-detail-04-audit-tab.png (${Math.round(stat20.size / 1024)} KB)`);
    await page20.close();
  } catch (err) {
    console.warn('Cảnh báo khi chụp đè ảnh 20:', err.message);
  }

  // Ghi ledger
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2), 'utf8');
  console.log(`\n✓ Đã ghi evidence ledger vào: ${LEDGER_PATH}`);

  await browser.close();

  // Kiểm định số lượng và dung lượng file
  const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith('.png'));
  console.log(`\nTổng số file đã sinh: ${files.length}/34`);

  let hasError = false;
  for (const f of files) {
    const s = fs.statSync(path.join(OUTPUT_DIR, f));
    if (s.size < 20480) {
      console.error(`✗ File quá nhỏ (<20KB): ${f} (${s.size} bytes)`);
      hasError = true;
    }
  }

  if (files.length < 34) {
    console.error(`✗ Thiếu file ảnh! Yêu cầu 34, hiện có ${files.length}`);
    process.exit(1);
  }

  if (hasError) {
    console.error('✗ Có file không đạt yêu cầu dung lượng tối thiểu 20KB');
    process.exit(1);
  }

  console.log('=== HOÀN TẤT CHỤP 34 ẢNH THÀNH CÔNG RỰC RỠ ===');
}

main().catch((err) => {
  console.error('Lỗi nghiêm trọng trong capture script:', err);
  process.exit(1);
});
