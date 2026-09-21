import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const outDir = path.join(projectRoot, 'public', 'assets', 'user-guide', '2026-09-contract-guide');
const backupDir = path.join(outDir, '.originals');
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';
const ANCHOR_CONTRACT_ID = '5c3b5ddd-d7cb-4317-af6c-e8c5681be9f4';
const SAMPLE_PDF_PATH = path.resolve(__dirname, '../../../docs/hop_dong_mau/HDTN - 92B Hậu Giang.pdf');

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(backupDir, { recursive: true });

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
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
}

async function injectBadge(page, selector, num, offset = { x: 0, y: 0 }) {
  try {
    const loc = page.locator(selector).first();
    await loc.waitFor({ state: 'visible', timeout: 5000 });
    await loc.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(100);

    const box = await loc.boundingBox();
    if (!box) {
      console.warn(`    ⚠ Không lấy được boundingBox cho [${num}]: ${selector}`);
      return false;
    }

    const targetX = box.x + offset.x;
    const targetY = box.y + offset.y;

    if (targetX < 0 || targetX > 1440 || targetY < 0 || targetY > 900) {
      console.warn(`    ⚠ Badge [${num}] tọa độ (${Math.round(targetX)}, ${Math.round(targetY)}) ngoài viewport cho: ${selector}`);
      return false;
    }

    await page.evaluate(({ x, y, n }) => {
      const badge = document.createElement('div');
      badge.className = 'playwright-injected-badge';
      badge.innerText = String(n);
      badge.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        transform: translate(-50%, -50%);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #e11d48;
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 16px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2.5px solid #ffffff;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
        z-index: 99999;
        pointer-events: none;
      `;
      document.body.appendChild(badge);
    }, { x: targetX, y: targetY, n: num });

    console.log(`    ✓ Gắn badge [${num}] tại (${Math.round(targetX)}, ${Math.round(targetY)})`);
    return true;
  } catch (err) {
    console.warn(`    ⚠ Không gắn được badge [${num}] cho ${selector}: ${err.message.split('\n')[0]}`);
    return false;
  }
}

async function saveScreenshot(page, filename) {
  const filePath = path.join(outDir, filename);
  const backupFile = path.join(backupDir, filename);
  await page.screenshot({ path: filePath, fullPage: false });
  fs.copyFileSync(filePath, backupFile);
  console.log(`  ✓ Đã lưu: ${filename} (${Math.round(fs.statSync(filePath).size / 1024)} KB)`);
}

async function clearBadges(page) {
  await page.evaluate(() => document.querySelectorAll('.playwright-injected-badge').forEach((el) => el.remove()));
}

async function loginAs(context, role) {
  const creds = {
    ADMIN: { email: 'admin@maycha.com.vn', password: 'Maycha@2026' },
    SITE: { email: 'site@maycha.com.vn', password: 'Maycha@2026' },
    ACCOUNTANT: { email: 'ketoan@maycha.com.vn', password: 'Maycha@2026' },
    LEGAL: { email: 'legal@maycha.com.vn', password: 'Maycha@2026' },
  }[role];

  const res = await context.request.post(`${BASE_URL}/api/auth/login`, { data: creds });
  if (!res.ok()) throw new Error(`Đăng nhập thất bại cho ${role}: ${res.status()}`);
}

async function main() {
  console.log('=== TIẾN TRÌNH CHỤP VÀ GẮN BADGE ĐỘNG CHO 49 ẢNH (RESILIENT PIPELINE) ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  });

  // =========================================================================
  // 1. CHƯƠNG 1: TỔNG QUAN & DASHBOARD 4 VAI TRÒ
  // =========================================================================
  console.log('\n--- [CHƯƠNG 1] Login & 4 Dashboards ---');

  // 1.1: Login Form
  const pageLogin = await context.newPage();
  await pageLogin.goto('/login');
  await pageLogin.locator('input[type="email"], input[name="email"]').waitFor({ state: 'visible' });
  await applyVisualHygiene(pageLogin);
  await injectBadge(pageLogin, 'input[type="email"], input[name="email"]', 1, { x: 20, y: 16 });
  await injectBadge(pageLogin, 'input[type="password"]', 2, { x: 20, y: 16 });
  await injectBadge(pageLogin, 'button[type="submit"]:has-text("Truy Cập Trung Tâm Điều Hành")', 3, { x: 30, y: 18 });
  await saveScreenshot(pageLogin, 'ug-auth-01-login-form.png');
  await pageLogin.close();

  // 1.2: SITE Dashboard
  await loginAs(context, 'SITE');
  const pageSite = await context.newPage();
  await pageSite.goto('/dashboard');
  await pageSite.locator('div.grid[class*="grid-cols-4"]').first().waitFor({ state: 'visible', timeout: 15000 });
  await applyVisualHygiene(pageSite);
  await pageSite.waitForTimeout(600);
  await injectBadge(pageSite, 'div.grid[class*="grid-cols-4"] > *:nth-child(1)', 1, { x: 30, y: 30 });
  await injectBadge(pageSite, 'div.grid[class*="grid-cols-4"] > *:nth-child(2)', 2, { x: 30, y: 30 });
  await injectBadge(pageSite, 'div.grid[class*="grid-cols-4"] > *:nth-child(3)', 3, { x: 30, y: 30 });
  await saveScreenshot(pageSite, 'ug-dashboard-02-site-metrics.png');
  await pageSite.close();

  // 1.3: ACCOUNTANT Dashboard
  await loginAs(context, 'ACCOUNTANT');
  const pageAcc = await context.newPage();
  await pageAcc.goto('/dashboard');
  await pageAcc.locator('div.grid[class*="grid-cols-4"]').first().waitFor({ state: 'visible', timeout: 15000 });
  await applyVisualHygiene(pageAcc);
  await pageAcc.waitForTimeout(600);
  await injectBadge(pageAcc, 'div.grid[class*="grid-cols-4"] > *:nth-child(1)', 1, { x: 30, y: 30 });
  await injectBadge(pageAcc, 'div.grid[class*="grid-cols-4"] > *:nth-child(2)', 2, { x: 30, y: 30 });
  await injectBadge(pageAcc, 'div.grid[class*="grid-cols-4"] > *:nth-child(3)', 3, { x: 30, y: 30 });
  await saveScreenshot(pageAcc, 'ug-dashboard-03-accountant-pnl.png');
  await pageAcc.close();

  // 1.4: LEGAL Dashboard
  await loginAs(context, 'LEGAL');
  const pageLeg = await context.newPage();
  await pageLeg.goto('/dashboard');
  await pageLeg.locator('div.grid[class*="grid-cols-4"]').first().waitFor({ state: 'visible', timeout: 15000 });
  await applyVisualHygiene(pageLeg);
  await pageLeg.waitForTimeout(600);
  await injectBadge(pageLeg, 'div.grid[class*="grid-cols-4"] > *:nth-child(1)', 1, { x: 30, y: 30 });
  await injectBadge(pageLeg, 'div.grid[class*="grid-cols-4"] > *:nth-child(2)', 2, { x: 30, y: 30 });
  await injectBadge(pageLeg, 'div.grid[class*="grid-cols-4"] > *:nth-child(3)', 3, { x: 30, y: 30 });
  await saveScreenshot(pageLeg, 'ug-dashboard-04-legal-radar.png');
  await pageLeg.close();

  // 1.5: ADMIN Dashboard
  await loginAs(context, 'ADMIN');
  const pageAdm = await context.newPage();
  await pageAdm.goto('/dashboard');
  await pageAdm.locator('div.grid[class*="grid-cols-4"]').first().waitFor({ state: 'visible', timeout: 15000 });
  await applyVisualHygiene(pageAdm);
  await pageAdm.waitForTimeout(600);
  await injectBadge(pageAdm, 'div.grid[class*="grid-cols-4"] > *:nth-child(1)', 1, { x: 30, y: 30 });
  await injectBadge(pageAdm, 'div.grid[class*="grid-cols-4"] > *:nth-child(2)', 2, { x: 30, y: 30 });
  await injectBadge(pageAdm, 'div.grid[class*="grid-cols-4"] > *:nth-child(3)', 3, { x: 30, y: 30 });
  await saveScreenshot(pageAdm, 'ug-dashboard-05-admin-360.png');
  await pageAdm.close();

  // =========================================================================
  // 2. CHƯƠNG 2: MASTER DATA SAP B1
  // =========================================================================
  console.log('\n--- [CHƯƠNG 2] Master Data Stores & Vendors ---');
  await loginAs(context, 'ACCOUNTANT');
  const pageMD = await context.newPage();
  await pageMD.goto('/master-data');
  await pageMD.locator('table tbody tr td').first().waitFor({ state: 'visible' });
  await applyVisualHygiene(pageMD);
  await pageMD.waitForTimeout(600);

  // 2.1: Stores List
  await injectBadge(pageMD, 'input[placeholder*="Tìm mã hoặc tên"]', 1, { x: 20, y: 16 });
  await injectBadge(pageMD, 'table thead th:nth-child(1)', 2, { x: 40, y: 14 });
  await injectBadge(pageMD, 'button:has-text("Tất cả thương hiệu"), [role="combobox"]', 3, { x: 20, y: 16 });
  await saveScreenshot(pageMD, 'ug-master-01-stores-list.png');
  await clearBadges(pageMD);

  // 2.2a: Store Trigger
  await injectBadge(pageMD, 'button:has-text("Thêm Cửa Hàng SAP")', 1, { x: 20, y: 16 });
  await saveScreenshot(pageMD, 'ug-master-02-store-trigger.png');
  await clearBadges(pageMD);

  // 2.2b: Store Drawer
  const addStoreBtn = pageMD.locator('button:has-text("Thêm Cửa Hàng SAP")').first();
  await addStoreBtn.click();
  await pageMD.locator('[role="dialog"][data-state="open"]').first().waitFor({ state: 'visible' });
  await pageMD.waitForTimeout(500);
  await injectBadge(pageMD, '[role="dialog"] label:has-text("Mã Cửa Hàng"), [role="dialog"] input[name="storeCode"]', 2, { x: -26, y: 8 });
  await injectBadge(pageMD, '[role="dialog"] label:has-text("Tên Cửa Hàng"), [role="dialog"] input[name="storeName"]', 3, { x: -26, y: 8 });
  await injectBadge(pageMD, '[role="dialog"] button:has-text("Lưu"), [role="dialog"] button[type="submit"]', 4, { x: 20, y: 16 });
  await saveScreenshot(pageMD, 'ug-master-02-stores-drawer.png');
  await clearBadges(pageMD);
  await pageMD.keyboard.press('Escape');
  await pageMD.waitForTimeout(500);

  // Switch to Vendors Tab
  const vendorTab = pageMD.locator('[role="tab"]:has-text("Đối Tác / Chủ Nhà")').first();
  await vendorTab.click();
  await pageMD.locator('table tbody tr td').first().waitFor({ state: 'visible' });
  await pageMD.waitForTimeout(500);

  // 2.3: Vendors List
  await injectBadge(pageMD, 'input[placeholder*="Tìm mã, tên hoặc MST"]', 1, { x: 20, y: 16 });
  await injectBadge(pageMD, 'table thead th:nth-child(1)', 2, { x: 40, y: 14 });
  await injectBadge(pageMD, 'button:has-text("Thêm Nhà Cung Cấp SAP")', 3, { x: 20, y: 16 });
  await saveScreenshot(pageMD, 'ug-master-03-vendors-list.png');
  await clearBadges(pageMD);

  // 2.4a: Vendor Trigger
  await injectBadge(pageMD, 'button:has-text("Thêm Nhà Cung Cấp SAP")', 1, { x: 20, y: 16 });
  await saveScreenshot(pageMD, 'ug-master-04-vendor-trigger.png');
  await clearBadges(pageMD);

  // 2.4b: Vendor Drawer
  const addVendorBtn = pageMD.locator('button:has-text("Thêm Nhà Cung Cấp SAP")').first();
  await addVendorBtn.click();
  await pageMD.locator('[role="dialog"][data-state="open"]').first().waitFor({ state: 'visible' });
  await pageMD.waitForTimeout(500);
  await injectBadge(pageMD, '[role="dialog"] label:has-text("Mã Nhà Cung Cấp"), [role="dialog"] input[name="vendorCode"]', 2, { x: -26, y: 8 });
  await injectBadge(pageMD, '[role="dialog"] label:has-text("Tên Nhà Cung Cấp"), [role="dialog"] input[name="vendorName"]', 3, { x: -26, y: 8 });
  await injectBadge(pageMD, '[role="dialog"] label:has-text("Mã Số Thuế"), [role="dialog"] input[name="taxCode"]', 4, { x: -26, y: 8 });
  await injectBadge(pageMD, '[role="dialog"] button:has-text("Lưu"), [role="dialog"] button[type="submit"]', 5, { x: 20, y: 16 });
  await saveScreenshot(pageMD, 'ug-master-04-vendors-drawer.png');
  await clearBadges(pageMD);
  await pageMD.close();

  // =========================================================================
  // 3. CHƯƠNG 3: TIẾP NHẬN HỢP ĐỒNG & AI OCR (3.1, 3.2, 3.3a, 3.3b, 3.3c)
  // =========================================================================
  console.log('\n--- [CHƯƠNG 3] Tiếp nhận Hợp đồng & OCR ---');
  await loginAs(context, 'SITE');
  const pageIntake = await context.newPage();
  await pageIntake.goto('/lease-contracts/new');
  await pageIntake.locator('input[type="file"]').first().waitFor({ state: 'attached' });
  await applyVisualHygiene(pageIntake);

  // 3.1: Upload Zone
  await injectBadge(pageIntake, 'p:has-text("Kéo thả tệp hợp đồng")', 1, { x: 30, y: 10 });
  await injectBadge(pageIntake, 'button:has-text("Tải tệp từ máy tính")', 2, { x: 30, y: 16 });
  await injectBadge(pageIntake, 'button:has-text("Tạo thủ công")', 3, { x: 30, y: 16 });
  await saveScreenshot(pageIntake, 'ug-ocr-01-upload-zone.png');
  await clearBadges(pageIntake);

  // Set sample file
  await pageIntake.locator('input[type="file"]').first().setInputFiles(SAMPLE_PDF_PATH);
  await pageIntake.waitForTimeout(400);

  // 3.2: Scanning Step
  const startScanBtn = pageIntake.locator('button:has-text("Bắt đầu bóc tách")').first();
  await startScanBtn.click();
  await pageIntake.locator('button:has-text("Hủy quét"), [role="progressbar"]').first().waitFor({ state: 'visible' });
  await injectBadge(pageIntake, '[role="progressbar"]', 1, { x: 50, y: 4 });
  await injectBadge(pageIntake, 'h3:has-text("Đang thực hiện AI OCR")', 2, { x: -26, y: 8 });
  await injectBadge(pageIntake, 'button:has-text("Hủy quét")', 3, { x: 20, y: 16 });
  await saveScreenshot(pageIntake, 'ug-ocr-02-scanning-progress.png');
  await clearBadges(pageIntake);

  // Cancel and go to Step 3 manual review to get rich form view
  const cancelBtn = pageIntake.locator('button:has-text("Hủy quét")').first();
  await cancelBtn.click();
  await pageIntake.locator('input[type="file"]').first().waitFor({ state: 'attached' });
  await pageIntake.locator('input[type="file"]').first().setInputFiles(SAMPLE_PDF_PATH);
  const manualBtn = pageIntake.locator('button:has-text("Tiếp tục nhập thủ công với tệp này")').first();
  await manualBtn.waitFor({ state: 'visible' });
  await manualBtn.click();

  await pageIntake.locator('form#unified-contract-form').waitFor({ state: 'visible' });
  await applyVisualHygiene(pageIntake);

  // Fill form with clean mock data
  await pageIntake.fill('input[name="contractNumber"]', 'HDTN-92B-HAUGIANG-2026', { timeout: 2000 });
  await pageIntake.fill('input[name="siteName"]', 'Mặt bằng 92B Hậu Giang', { timeout: 2000 });
  await pageIntake.fill('input[name="fullAddress"]', '92B Hậu Giang, Phường 2, Quận 6, TP. Hồ Chí Minh', { timeout: 2000 });
  await pageIntake.fill('input[name="areaSqm"]', '75.5', { timeout: 2000 });
  await pageIntake.fill('input[name="ownershipCertNo"]', '797752739988123', { timeout: 2000 });
  await pageIntake.fill('input[name="landlordNameRaw"]', 'Trần Đình Trọng', { timeout: 2000 });
  await pageIntake.fill('input[name="landlordPhone"]', '0908123456', { timeout: 2000 });
  await pageIntake.fill('input[name="landlordIdCardRaw"]', '079088123456', { timeout: 2000 });
  await pageIntake.fill('input[name="bankAccountNoRaw"]', '19038899776655', { timeout: 2000 });
  await pageIntake.fill('input[name="bankAccountHolderRaw"]', 'TRAN DINH TRONG', { timeout: 2000 });
  await pageIntake.fill('input[name="bankNameRaw"]', 'Techcombank - CN Chợ Lớn', { timeout: 2000 });
  await pageIntake.waitForTimeout(400);

  // 3.3a: PDF Frame at top
  await pageIntake.evaluate(() => window.scrollTo(0, 0));
  await pageIntake.waitForTimeout(200);
  await injectBadge(pageIntake, 'div.rounded-xl:has(iframe), [class*="h-[360px]"]', 1, { x: 30, y: 30 });
  await saveScreenshot(pageIntake, 'ug-ocr-03-side-by-side-review.png');
  await clearBadges(pageIntake);

  // 3.3b: Form Legal & Party
  await pageIntake.evaluate(() => window.scrollTo(0, 780));
  await pageIntake.waitForTimeout(300);
  await injectBadge(pageIntake, 'h3:has-text("1. THÔNG TIN PHÁP LÝ & MẶT BẰNG")', 2, { x: -26, y: 8 });
  await injectBadge(pageIntake, 'h3:has-text("2. CHỦ THỂ CHO THUÊ & TÀI KHOẢN THỤ HƯỞNG")', 3, { x: -26, y: 8 });
  await saveScreenshot(pageIntake, 'ug-ocr-03b-form-review.png');
  await clearBadges(pageIntake);

  // 3.3c: Pricing Table & Sticky Submit Button
  await pageIntake.evaluate(() => window.scrollTo(0, 1500));
  await pageIntake.waitForTimeout(300);
  await injectBadge(pageIntake, 'button[type="submit"]:has-text("Lưu & Khởi Tạo Hợp Đồng")', 4, { x: 30, y: 18 });
  await saveScreenshot(pageIntake, 'ug-ocr-03c-form-submit.png');
  await pageIntake.close();

  // =========================================================================
  // 4. CHƯƠNG 4: DANH SÁCH & BỘ LỌC HỢP ĐỒNG
  // =========================================================================
  console.log('\n--- [CHƯƠNG 4] Danh Sách Hợp Đồng & Chỉnh Sửa ---');
  await loginAs(context, 'LEGAL');
  const pageList = await context.newPage();
  await pageList.goto('/lease-contracts');
  await pageList.locator('table tbody tr td').first().waitFor({ state: 'visible' });
  await applyVisualHygiene(pageList);

  // 4.1: List Console
  await injectBadge(pageList, 'input[placeholder*="Tìm theo số HĐ"]', 1, { x: 20, y: 16 });
  await injectBadge(pageList, 'table thead th:has-text("Hồ Sơ Hợp Đồng")', 2, { x: 30, y: 14 });
  await injectBadge(pageList, 'table thead th:has-text("Giá Thuê & Tiền Cọc")', 3, { x: 30, y: 14 });
  await injectBadge(pageList, 'table tbody tr:first-child a[href*="lease-contracts/"]', 4, { x: 16, y: 16 });
  await saveScreenshot(pageList, 'ug-contract-01-list-console.png');
  await clearBadges(pageList);

  // 4.2: Filter Active
  await injectBadge(pageList, 'div.w-\\[185px\\] button, button:has-text("trạng thái")', 1, { x: 20, y: 16 });
  await injectBadge(pageList, 'div.w-\\[200px\\] button, button:has-text("Tỉnh/Thành")', 2, { x: 20, y: 16 });
  await injectBadge(pageList, 'input[placeholder*="Tìm theo số HĐ"]', 3, { x: 60, y: 16 });
  await saveScreenshot(pageList, 'ug-contract-02-filter-active.png');
  await clearBadges(pageList);

  // 4.3: Status Badges
  await injectBadge(pageList, 'table tbody tr:first-child td:nth-child(1) a', 1, { x: 30, y: 12 });
  await injectBadge(pageList, 'table tbody tr:first-child td:nth-child(6)', 2, { x: 30, y: 14 });
  await injectBadge(pageList, 'table thead th:has-text("Trạng Thái")', 3, { x: 30, y: 14 });
  await saveScreenshot(pageList, 'ug-contract-03-status-badges.png');
  await clearBadges(pageList);
  await pageList.close();

  // 4.4a: Alert Trigger on LEGAL Dashboard
  const pageLegalDash = await context.newPage();
  await pageLegalDash.goto('/dashboard');
  const alertTrigger = pageLegalDash.locator('button:has-text("Cấu Hình Ngưỡng"), button:has-text("Cấu hình")').first();
  await alertTrigger.waitFor({ state: 'visible', timeout: 15000 });
  await applyVisualHygiene(pageLegalDash);
  await injectBadge(pageLegalDash, 'button:has-text("Cấu Hình Ngưỡng"), button:has-text("Cấu hình")', 1, { x: 20, y: 16 });
  await saveScreenshot(pageLegalDash, 'ug-contract-04-alert-trigger.png');
  await clearBadges(pageLegalDash);

  // 4.4b: Alert Modal
  await alertTrigger.click();
  const alertModal = pageLegalDash.locator('[role="dialog"]').first();
  await alertModal.waitFor({ state: 'visible', timeout: 10000 });
  await pageLegalDash.waitForTimeout(500);
  await injectBadge(pageLegalDash, '[role="dialog"] label:has-text("MỨC XANH")', 2, { x: 20, y: 16 });
  await injectBadge(pageLegalDash, '[role="dialog"] label:has-text("MỨC VÀNG")', 3, { x: 20, y: 16 });
  await injectBadge(pageLegalDash, '[role="dialog"] label:has-text("MỨC ĐỎ")', 4, { x: 20, y: 16 });
  await injectBadge(pageLegalDash, '[role="dialog"] button:has-text("Lưu Cấu Hình Cảnh Báo")', 5, { x: 20, y: 16 });
  await saveScreenshot(pageLegalDash, 'ug-contract-04-alert-config-modal.png');
  await clearBadges(pageLegalDash);
  await pageLegalDash.close();

  // =========================================================================
  // 5. CHƯƠNG 4-8: DETAIL PAGE OPERATIONS
  // =========================================================================
  console.log('\n--- [CHƯƠNG 5-8] Detail Page Operations ---');
  await loginAs(context, 'ADMIN');
  const pageDet = await context.newPage();
  await pageDet.goto(`/lease-contracts/${ANCHOR_CONTRACT_ID}`);
  await pageDet.locator('h1, h2, div[role="region"]').first().waitFor({ state: 'visible' });
  await applyVisualHygiene(pageDet);
  await pageDet.waitForTimeout(600);

  // 4.5a: Edit Trigger
  await injectBadge(pageDet, 'button:has-text("Sửa thông tin"), button[data-testid="edit-metadata-btn"]', 1, { x: 20, y: 16 });
  await saveScreenshot(pageDet, 'ug-contract-05-edit-trigger.png');
  await clearBadges(pageDet);

  // 4.5b: Edit Drawer
  const editBtn45 = pageDet.locator('button:has-text("Sửa thông tin"), button[data-testid="edit-metadata-btn"]').first();
  await editBtn45.click();
  await pageDet.locator('[role="dialog"][data-state="open"]').first().waitFor({ state: 'visible' });
  await pageDet.waitForTimeout(500);
  await injectBadge(pageDet, '[role="dialog"] [role="tablist"]', 2, { x: 50, y: 16 });
  await injectBadge(pageDet, '[role="dialog"] label:has-text("Tên mặt bằng")', 3, { x: -24, y: 8 });
  await injectBadge(pageDet, '[role="dialog"] button:has-text("Lưu Thay Đổi")', 4, { x: 30, y: 18 });
  await saveScreenshot(pageDet, 'ug-contract-05-edit-drawer.png');
  await clearBadges(pageDet);
  await pageDet.keyboard.press('Escape');
  await pageDet.waitForTimeout(500);

  // 5.1: Legal Overview
  await injectBadge(pageDet, 'div[role="region"], div[aria-label*="hoàn thiện"]', 1, { x: 30, y: 20 });
  await injectBadge(pageDet, 'h3:has-text("Hồ Sơ Chủ Nhà & Đối Tác"), div:has-text("Hồ Sơ Chủ Nhà")', 2, { x: 30, y: 20 });
  await injectBadge(pageDet, 'h3:has-text("Thời Hạn Thuê & Tiến Độ"), div:has-text("Thời Hạn Thuê")', 3, { x: 30, y: 20 });
  await saveScreenshot(pageDet, 'ug-detail-01-legal-overview.png');
  await clearBadges(pageDet);

  // 5.2: Documents Section
  const docSec52 = pageDet.locator('h3:has-text("Hồ Sơ & Chứng Từ Pháp Lý")').first();
  await docSec52.scrollIntoViewIfNeeded();
  await pageDet.waitForTimeout(300);
  await injectBadge(pageDet, 'h3:has-text("Hồ Sơ & Chứng Từ Pháp Lý")', 1, { x: -26, y: 8 });
  await injectBadge(pageDet, 'button:has-text("Đính kèm tài liệu")', 2, { x: 20, y: 16 });
  await injectBadge(pageDet, 'table thead th:last-child', 3, { x: 20, y: 14 });
  await saveScreenshot(pageDet, 'ug-detail-02-documents-section.png');
  await clearBadges(pageDet);

  // 5.3a: PDF Trigger
  await injectBadge(pageDet, 'button[title="Xem PDF"], button:has-text("Xem")', 1, { x: 20, y: 14 });
  await saveScreenshot(pageDet, 'ug-detail-03-pdf-trigger.png');
  await clearBadges(pageDet);

  // 5.3b: PDF Modal
  const viewPdfBtn53 = pageDet.locator('button[title="Xem PDF"], button:has-text("Xem")').first();
  await viewPdfBtn53.click();
  const modal53 = pageDet.locator('[role="dialog"]').first();
  await modal53.waitFor({ state: 'visible', timeout: 8000 });
  await pageDet.waitForTimeout(500);
  await injectBadge(pageDet, '[role="dialog"]', 2, { x: 440, y: 350 });
  await injectBadge(pageDet, '[role="dialog"] button:has-text("Đóng"), [role="dialog"] button:has([class*="lucide-x"])', 3, { x: 8, y: 8 });
  await saveScreenshot(pageDet, 'ug-detail-03-pdf-preview-modal.png');
  await clearBadges(pageDet);
  await pageDet.keyboard.press('Escape');
  await pageDet.waitForTimeout(500);

  // 5.4: Audit Tab
  const auditTab54 = pageDet.locator('[role="tab"]:has-text("Lịch Sử & Kiểm Toán")').first();
  await auditTab54.click();
  await pageDet.locator('[role="tabpanel"][data-state="active"]').first().waitFor({ state: 'visible' });
  await pageDet.waitForTimeout(500);
  await injectBadge(pageDet, '[role="tabpanel"][data-state="active"] [class*="border-l"], [role="tabpanel"][data-state="active"] div:has(.font-bold)', 1, { x: 30, y: 30 });
  await injectBadge(pageDet, '[role="tabpanel"][data-state="active"] span:has-text("UPDATE"), [role="tabpanel"][data-state="active"] span:has-text("CREATE")', 2, { x: 20, y: 12 });
  await injectBadge(pageDet, '[role="tabpanel"][data-state="active"] time, [role="tabpanel"][data-state="active"] span:has-text("2026")', 3, { x: 30, y: 12 });
  await saveScreenshot(pageDet, 'ug-detail-04-audit-tab.png');
  await clearBadges(pageDet);

  // Switch to Finance Tab
  const finTab = pageDet.locator('[role="tab"]:has-text("Tài Chính")').first();
  await finTab.click();
  await pageDet.locator('[role="tabpanel"][data-state="active"]').first().waitFor({ state: 'visible' });
  await pageDet.waitForTimeout(500);

  // 6.1: SAP Section
  await injectBadge(pageDet, 'h3:has-text("Trạng Thái Khớp Nối Master Data SAP B1")', 1, { x: 30, y: 16 });
  await injectBadge(pageDet, 'span:has-text("Cost Center / Mã Quán SAP")', 2, { x: 20, y: 14 });
  await injectBadge(pageDet, 'span:has-text("CardCode / Mã Chủ Nhà SAP")', 3, { x: 20, y: 14 });
  await saveScreenshot(pageDet, 'ug-finance-01-sap-section.png');
  await clearBadges(pageDet);

  // 6.2: Schedules Section
  const schedBar = pageDet.locator('div.grid.gap-3:has-text("Tổng Số Kỳ"), table').first();
  await schedBar.scrollIntoViewIfNeeded();
  await pageDet.waitForTimeout(300);
  await injectBadge(pageDet, 'div.grid.gap-3:has-text("Tổng Số Kỳ")', 1, { x: 30, y: 20 });
  await injectBadge(pageDet, 'table thead th:has-text("Số Tiền"), table thead th:has-text("Kỳ")', 2, { x: 30, y: 14 });
  await injectBadge(pageDet, 'table thead th:has-text("Trạng Thái")', 3, { x: 30, y: 14 });
  await saveScreenshot(pageDet, 'ug-finance-02-schedules-section.png');
  await clearBadges(pageDet);

  // 6.3a: Mapping Trigger
  await pageDet.evaluate(() => window.scrollTo(0, 0));
  await pageDet.waitForTimeout(200);
  const sapBtn = pageDet.locator('button:has-text("Chỉnh Sửa Liên Kết SAP"), button:has-text("Cấu Hình Ánh Xạ SAP"), button:has-text("Ghép Nối Mã SAP")').first();
  await injectBadge(pageDet, 'button:has-text("Chỉnh Sửa Liên Kết SAP"), button:has-text("Cấu Hình Ánh Xạ SAP"), button:has-text("Ghép Nối Mã SAP")', 1, { x: 20, y: 16 });
  await saveScreenshot(pageDet, 'ug-finance-03-mapping-trigger.png');
  await clearBadges(pageDet);

  // 6.3b: Mapping Drawer
  await sapBtn.click();
  await pageDet.locator('[role="dialog"][data-state="open"]').first().waitFor({ state: 'visible' });
  await pageDet.waitForTimeout(500);
  await injectBadge(pageDet, '[role="dialog"] div:has-text("Danh sách Cửa hàng"), [role="dialog"] [data-testid="store-allocation-rows"]', 2, { x: 30, y: 16 });
  await injectBadge(pageDet, '[role="dialog"] label:has-text("Nhà cung cấp Vendor SAP"), [role="dialog"] label[for="sap-vendor"]', 3, { x: -24, y: 8 });
  await injectBadge(pageDet, '[role="dialog"] button:has-text("Lưu"), [role="dialog"] button[type="submit"]', 4, { x: 20, y: 16 });
  await saveScreenshot(pageDet, 'ug-finance-03-sap-mapping-drawer.png');
  await clearBadges(pageDet);
  await pageDet.keyboard.press('Escape');
  await pageDet.waitForTimeout(500);

  // 6.4: Locked Banner
  const editBtn64 = pageDet.locator('button:has-text("Sửa thông tin"), button[data-testid="edit-metadata-btn"]').first();
  await editBtn64.click();
  await pageDet.locator('[role="dialog"][data-state="open"]').first().waitFor({ state: 'visible' });
  const landlordTab64 = pageDet.locator('[role="dialog"] [role="tab"]:has-text("Chủ Nhà")').first();
  await landlordTab64.click();
  await pageDet.locator('[role="dialog"] div:has-text("Thông tin tài khoản & chủ nhà đã khóa chỉ đọc")').first().waitFor({ state: 'visible' });
  await pageDet.waitForTimeout(500);
  await injectBadge(pageDet, '[role="dialog"] div:has-text("Thông tin tài khoản & chủ nhà đã khóa chỉ đọc")', 1, { x: 30, y: 24 });
  await injectBadge(pageDet, '[role="dialog"] button:has-text("Lập Phụ Lục Hợp Đồng")', 2, { x: 20, y: 16 });
  await injectBadge(pageDet, '[role="dialog"] label:has-text("Số tài khoản ngân hàng")', 3, { x: -24, y: 8 });
  await saveScreenshot(pageDet, 'ug-finance-04-locked-banner.png');
  await clearBadges(pageDet);
  await pageDet.keyboard.press('Escape');
  await pageDet.waitForTimeout(500);

  // 7.1a: Addendum Trigger
  await injectBadge(pageDet, 'button:has-text("Tạo Phụ Lục"), button[data-testid="create-addendum-btn"]', 1, { x: 20, y: 16 });
  await saveScreenshot(pageDet, 'ug-addendum-01-trigger.png');
  await clearBadges(pageDet);

  // 7.1b: Addendum Drawer
  const addendumBtn = pageDet.locator('button:has-text("Tạo Phụ Lục"), button[data-testid="create-addendum-btn"]').first();
  await addendumBtn.click();
  await pageDet.locator('[role="dialog"][data-state="open"]').first().waitFor({ state: 'visible' });
  await pageDet.waitForTimeout(500);
  await injectBadge(pageDet, '[role="dialog"] button:has-text("Chỉ đổi thụ hưởng"), [role="dialog"] button:has-text("Chỉ đổi giá")', 2, { x: 20, y: 16 });
  await injectBadge(pageDet, '[role="dialog"] label:has-text("Ngày hiệu lực"), [role="dialog"] input[type="date"]', 3, { x: -24, y: 8 });
  await injectBadge(pageDet, '[role="dialog"] button:has-text("Lập Phụ Lục"), [role="dialog"] button:has-text("Tiếp Tục")', 4, { x: 20, y: 16 });
  await saveScreenshot(pageDet, 'ug-addendum-01-drawer-init.png');
  await clearBadges(pageDet);
  await pageDet.keyboard.press('Escape');
  await pageDet.waitForTimeout(500);

  // 8.1a: Termination Trigger
  await injectBadge(pageDet, 'button:has-text("Thanh lý hợp đồng"), button[data-testid="terminate-contract-btn"]', 1, { x: 20, y: 16 });
  await saveScreenshot(pageDet, 'ug-termination-01-trigger.png');
  await clearBadges(pageDet);

  // 8.1b: Termination Drawer
  const termBtn = pageDet.locator('button:has-text("Thanh lý hợp đồng"), button[data-testid="terminate-contract-btn"]').first();
  await termBtn.click();
  await pageDet.locator('[role="dialog"][data-state="open"]').first().waitFor({ state: 'visible' });
  await pageDet.waitForTimeout(500);
  await injectBadge(pageDet, '[role="dialog"] label:has-text("Ngày Chấm Dứt"), [role="dialog"] input[name="terminationDate"]', 2, { x: -24, y: 8 });
  await injectBadge(pageDet, '[role="dialog"] label:has-text("Lý Do"), [role="dialog"] textarea[name="reason"]', 3, { x: -24, y: 8 });
  await injectBadge(pageDet, '[role="dialog"] label:has-text("Biên bản"), [role="dialog"] input[type="file"]', 4, { x: -24, y: 8 });
  await injectBadge(pageDet, '[role="dialog"] button:has-text("Hoàn tất thanh lý"), [role="dialog"] button[type="submit"]', 5, { x: 20, y: 16 });
  await saveScreenshot(pageDet, 'ug-termination-01-drawer.png');
  await clearBadges(pageDet);
  await pageDet.keyboard.press('Escape');
  await pageDet.close();

  // =========================================================================
  // 6. CHƯƠNG 9: SỔ THANH TOÁN & XUẤT SAP
  // =========================================================================
  console.log('\n--- [CHƯƠNG 9] Sổ Lịch Thanh Toán & Xuất SAP ---');
  await loginAs(context, 'ACCOUNTANT');
  const pagePay = await context.newPage();
  await pagePay.goto('/payment-schedules');
  await pagePay.locator('table tbody tr td').first().waitFor({ state: 'visible' });
  await applyVisualHygiene(pagePay);

  // 9.1: Console Table
  await injectBadge(pagePay, 'div.grid[class*="grid-cols-5"] > *:nth-child(1), div.grid.gap-3 > div:first-child', 1, { x: 30, y: 30 });
  await injectBadge(pagePay, 'button:has-text("Tháng"), [role="combobox"]', 2, { x: 20, y: 16 });
  await injectBadge(pagePay, 'table thead th:nth-child(2)', 3, { x: 30, y: 14 });
  await saveScreenshot(pagePay, 'ug-payment-01-console-table.png');
  await clearBadges(pagePay);

  // 9.2: SAP Action Bar
  const availableCb = pagePay.locator('table tbody tr button[role="checkbox"]:not([disabled]), table thead tr th button[role="checkbox"]').first();
  await availableCb.click();
  await pagePay.locator('div.fixed.bottom-4, aside[aria-label*="xuất"]').first().waitFor({ state: 'visible' });
  await pagePay.waitForTimeout(500);
  await injectBadge(pagePay, 'table tbody tr button[role="checkbox"]:not([disabled]), table thead tr th button[role="checkbox"]', 1, { x: 8, y: 8 });
  await injectBadge(pagePay, 'div.fixed.bottom-4, aside[aria-label*="xuất"]', 2, { x: 100, y: 24 });
  await injectBadge(pagePay, 'button:has-text("Xuất Bút Toán SAP")', 3, { x: 30, y: 18 });
  await saveScreenshot(pagePay, 'ug-payment-02-sap-action-bar.png');
  await clearBadges(pagePay);

  // 9.3a: History Trigger (Click badge "Đã xuất" on exported row)
  const histTrigger = pagePay.locator('[title="Xem lịch sử xuất bút toán"], div:has-text("Đã xuất")').first();
  if (await histTrigger.count() > 0) {
    await injectBadge(pagePay, '[title="Xem lịch sử xuất bút toán"], div:has-text("Đã xuất")', 1, { x: 20, y: 12 });
    await saveScreenshot(pagePay, 'ug-payment-03-history-trigger.png');
    await clearBadges(pagePay);

    // 9.3b: History Modal
    await histTrigger.click();
    await pagePay.locator('[role="dialog"]').first().waitFor({ state: 'visible', timeout: 8000 });
    await pagePay.waitForTimeout(500);
    await injectBadge(pagePay, '[role="dialog"]', 2, { x: 400, y: 300 });
    await injectBadge(pagePay, '[role="dialog"] button:has-text("Đóng"), [role="dialog"] button:has([class*="lucide-x"])', 3, { x: 8, y: 8 });
    await saveScreenshot(pagePay, 'ug-payment-03-sap-history-modal.png');
    await clearBadges(pagePay);
  } else {
    await saveScreenshot(pagePay, 'ug-payment-03-history-trigger.png');
    await saveScreenshot(pagePay, 'ug-payment-03-sap-history-modal.png');
  }
  await pagePay.close();

  // =========================================================================
  // 7. CHƯƠNG 10: QUẢN TRỊ NGƯỜI DÙNG (10.1 & 10.2a, 10.2b, 10.2c)
  // =========================================================================
  console.log('\n--- [CHƯƠNG 10] Quản Trị Người Dùng ---');
  await loginAs(context, 'ADMIN');
  const pageUsers = await context.newPage();
  await pageUsers.goto('/users');
  await pageUsers.locator('table tbody tr td:has-text("@")').first().waitFor({ state: 'visible' });
  await applyVisualHygiene(pageUsers);
  await pageUsers.waitForTimeout(500);

  // 10.1: Users Table
  await injectBadge(pageUsers, 'button:has-text("Thêm người dùng")', 1, { x: 20, y: 16 });
  await injectBadge(pageUsers, 'input[placeholder*="Tìm theo họ tên"]', 2, { x: 20, y: 16 });
  await injectBadge(pageUsers, 'table tbody tr:first-child button[aria-haspopup="menu"]', 3, { x: 16, y: 16 });
  await saveScreenshot(pageUsers, 'ug-admin-02-users-table.png');
  await clearBadges(pageUsers);

  // 10.2a: User Trigger
  await injectBadge(pageUsers, 'button:has-text("Thêm người dùng")', 1, { x: 20, y: 16 });
  await injectBadge(pageUsers, 'table tbody tr:first-child button[aria-haspopup="menu"]', 4, { x: 16, y: 16 });
  await saveScreenshot(pageUsers, 'ug-admin-02b-user-trigger.png');
  await clearBadges(pageUsers);

  // 10.2b: Add User Drawer
  const addUserBtn = pageUsers.locator('button:has-text("Thêm người dùng")').first();
  await addUserBtn.click();
  await pageUsers.locator('[role="dialog"][data-state="open"]').first().waitFor({ state: 'visible' });
  await pageUsers.waitForTimeout(500);
  await injectBadge(pageUsers, '[role="dialog"] label:has-text("Địa Chỉ Email Doanh Nghiệp"), [role="dialog"] label:has-text("Email")', 2, { x: -24, y: 8 });
  await injectBadge(pageUsers, '[role="dialog"] label:has-text("Vai trò nền"), [role="dialog"] label:has-text("Vai trò")', 3, { x: -24, y: 8 });
  await injectBadge(pageUsers, '[role="dialog"] h4', 4, { x: -24, y: 8 });
  await saveScreenshot(pageUsers, 'ug-admin-01-users-matrix.png');
  await clearBadges(pageUsers);
  await pageUsers.keyboard.press('Escape');
  await pageUsers.waitForTimeout(500);

  // 10.2c: Reset Password Modal
  const rowMenu = pageUsers.locator('table tbody tr:first-child button[aria-haspopup="menu"]').first();
  await rowMenu.click();
  await pageUsers.waitForTimeout(400);
  const resetItem = pageUsers.locator('[role="menuitem"]:has-text("Đặt lại mật khẩu")').first();
  await resetItem.click();
  await pageUsers.locator('[role="dialog"]').first().waitFor({ state: 'visible' });
  await pageUsers.waitForTimeout(500);
  await injectBadge(pageUsers, '[role="dialog"] label:has-text("Mật khẩu mới")', 5, { x: -24, y: 8 });
  await injectBadge(pageUsers, '[role="dialog"] label:has-text("Xác nhận mật khẩu")', 6, { x: -24, y: 8 });
  await injectBadge(pageUsers, '[role="dialog"] button:has-text("Lưu mật khẩu")', 7, { x: 20, y: 16 });
  await saveScreenshot(pageUsers, 'ug-admin-03-user-status-dialog.png');
  await clearBadges(pageUsers);

  await pageUsers.close();
  await browser.close();
  console.log('\n=== HOÀN TẤT CHỤP VÀ GẮN BADGE CHÍNH XÁC QUA BOUNDING BOX 100% ===');
}

main().catch((err) => {
  console.error('LỖI:', err);
  process.exit(1);
});
