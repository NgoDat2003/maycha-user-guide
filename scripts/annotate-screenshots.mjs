import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const assetDir = path.join(projectRoot, 'public', 'assets', 'user-guide', '2026-09-contract-guide');
const backupDir = path.join(assetDir, '.originals');

// Hotspot definitions for all 46 screenshots
const ANNOTATIONS = {
  // --- CHƯƠNG 1 ---
  'ug-auth-01-login-form.png': [
    { left: '71%', top: '44%', num: 1 }, // Ô Email công vụ
    { left: '71%', top: '56%', num: 2 }, // Ô Mật khẩu
    { left: '71%', top: '68%', num: 3 }, // Nút Truy cập trung tâm điều hành
  ],

  // --- CHƯƠNG 2 ---
  'ug-master-01-stores-list.png': [
    { left: '35%', top: '15%', num: 1 }, // Thanh tìm kiếm điểm bán
    { left: '55%', top: '32%', num: 2 }, // Cột Mã Cost Center SAP
    { left: '72%', top: '32%', num: 3 }, // Cột Trạng thái hoạt động
  ],
  'ug-master-02-store-trigger.png': [
    { left: '89%', top: '15%', num: 1 }, // Nút + Thêm Cửa Hàng Mới
  ],
  'ug-master-02-stores-drawer.png': [
    { left: '75%', top: '25%', num: 2 }, // Ô nhập Mã Cửa Hàng
    { left: '75%', top: '42%', num: 3 }, // Tên cửa hàng & Cost Center
    { left: '92%', top: '94%', num: 4 }, // Nút Lưu Thông Tin
  ],
  'ug-master-03-vendors-list.png': [
    { left: '35%', top: '15%', num: 1 }, // Thanh tìm kiếm chủ nhà
    { left: '52%', top: '32%', num: 2 }, // Cột Mã CardCode SAP
    { left: '70%', top: '32%', num: 3 }, // Tài khoản ngân hàng thụ hưởng
  ],
  'ug-master-04-vendor-trigger.png': [
    { left: '88%', top: '15%', num: 1 }, // Nút + Thêm Đối Tác Mới
  ],
  'ug-master-04-vendors-drawer.png': [
    { left: '75%', top: '22%', num: 2 }, // Mã CardCode SAP
    { left: '75%', top: '36%', num: 3 }, // Họ tên chủ nhà & CCCD
    { left: '75%', top: '55%', num: 4 }, // Số tài khoản & Ngân hàng
    { left: '92%', top: '94%', num: 5 }, // Nút Lưu Đối Tác
  ],

  // --- CHƯƠNG 3 ---
  'ug-ocr-01-upload-zone.png': [
    { left: '50%', top: '38%', num: 1 }, // Vùng kéo thả file PDF scan
    { left: '50%', top: '58%', num: 2 }, // Tên file đã chọn
    { left: '50%', top: '72%', num: 3 }, // Nút Bắt Đầu Trích Xuất AI
  ],
  'ug-ocr-02-scanning-progress.png': [
    { left: '50%', top: '40%', num: 1 }, // Thanh tiến trình quét %
    { left: '50%', top: '55%', num: 2 }, // Các giai đoạn bóc tách
    { left: '50%', top: '28%', num: 3 }, // Điểm tin cậy (Confidence Score)
  ],

  // --- CHƯƠNG 4 ---
  'ug-contract-01-list-console.png': [
    { left: '50%', top: '45%', num: 1 }, // Bảng danh sách hợp đồng
    { left: '25%', top: '32%', num: 2 }, // Cột Mã hợp đồng & Điểm bán
    { left: '58%', top: '32%', num: 3 }, // Cột Tiền thuê tháng
    { left: '92%', top: '32%', num: 4 }, // Biểu tượng con mắt xem chi tiết
  ],
  'ug-contract-02-filter-active.png': [
    { left: '30%', top: '15%', num: 1 }, // Ô tìm kiếm nhanh
    { left: '55%', top: '15%', num: 2 }, // Dropdown lọc Trạng Thái
    { left: '70%', top: '15%', num: 3 }, // Dropdown lọc Cảnh Báo Hạn
  ],
  'ug-contract-03-status-badges.png': [
    { left: '68%', top: '35%', num: 1 }, // Huy hiệu Trạng thái
    { left: '82%', top: '35%', num: 2 }, // Đồng hồ cát cảnh báo
    { left: '82%', top: '48%', num: 3 }, // Số ngày còn lại
  ],
  'ug-contract-04-alert-trigger.png': [
    { left: '85%', top: '15%', num: 1 }, // Nút Cấu Hình Cảnh Báo
  ],
  'ug-contract-04-alert-config-modal.png': [
    { left: '50%', top: '36%', num: 2 }, // Mốc cảnh báo 180 ngày
    { left: '50%', top: '48%', num: 3 }, // Mốc cảnh báo 90 ngày
    { left: '50%', top: '60%', num: 4 }, // Mốc cảnh báo 30 ngày
    { left: '62%', top: '72%', num: 5 }, // Nút Lưu Cấu Hình
  ],

  // --- CHƯƠNG 5 ---
  'ug-detail-02-documents-section.png': [
    { left: '50%', top: '42%', num: 1 }, // Bảng danh mục tài liệu
    { left: '88%', top: '22%', num: 2 }, // Nút + Tải Lên Tài Liệu Mới
    { left: '88%', top: '42%', num: 3 }, // Cột Thao tác (Xem/Tải)
  ],
  'ug-detail-04-audit-tab.png': [
    { left: '25%', top: '45%', num: 1 }, // Dòng thời gian Timeline
    { left: '50%', top: '38%', num: 2 }, // Tên sự kiện & người thao tác
    { left: '75%', top: '38%', num: 3 }, // Thời điểm bất biến
  ],

  // --- CHƯƠNG 6 ---
  'ug-finance-01-sap-section.png': [
    { left: '50%', top: '24%', num: 1 }, // Trạng thái khớp nối SAP
    { left: '35%', top: '36%', num: 2 }, // Mã Cost Center
    { left: '65%', top: '36%', num: 3 }, // Mã CardCode chủ nhà
  ],
  'ug-finance-02-schedules-section.png': [
    { left: '50%', top: '45%', num: 1 }, // Bảng lịch thanh toán
    { left: '48%', top: '35%', num: 2 }, // Tiền thuê gốc & thuế
    { left: '78%', top: '35%', num: 3 }, // Trạng thái hạch toán
  ],
  'ug-finance-03-mapping-trigger.png': [
    { left: '85%', top: '22%', num: 1 }, // Nút Cấu Hình Ánh Xạ SAP
  ],
  'ug-finance-03-sap-mapping-drawer.png': [
    { left: '75%', top: '32%', num: 2 }, // Ô chọn Điểm bán
    { left: '75%', top: '48%', num: 3 }, // Ô chọn Chủ nhà
    { left: '92%', top: '94%', num: 4 }, // Nút Lưu Ánh Xạ
  ],

  // --- CHƯƠNG 7 ---
  'ug-addendum-01-trigger.png': [
    { left: '89%', top: '14%', num: 1 }, // Nút + Lập Phụ Lục Hợp Đồng
  ],
  'ug-addendum-01-drawer-init.png': [
    { left: '75%', top: '25%', num: 2 }, // Chọn loại phụ lục
    { left: '75%', top: '45%', num: 3 }, // Số hiệu & ngày áp dụng
    { left: '88%', top: '92%', num: 4 }, // Nút Tiếp Tục
  ],
  'ug-addendum-02-beneficiary-form.png': [
    { left: '75%', top: '26%', num: 1 }, // Tên chủ tài khoản mới
    { left: '75%', top: '42%', num: 2 }, // Số tài khoản & Ngân hàng
    { left: '75%', top: '62%', num: 3 }, // Tải lên Giấy ủy quyền
    { left: '88%', top: '92%', num: 4 }, // Nút Lưu Phụ Lục
  ],

  // --- CHƯƠNG 8 ---
  'ug-termination-01-trigger.png': [
    { left: '70%', top: '14%', num: 1 }, // Nút Thanh Lý Hợp Đồng
  ],
  'ug-termination-01-drawer.png': [
    { left: '75%', top: '26%', num: 2 }, // Ngày chấm dứt hợp đồng
    { left: '75%', top: '42%', num: 3 }, // Lý do thanh lý
    { left: '75%', top: '62%', num: 4 }, // Tải biên bản bàn giao
    { left: '85%', top: '92%', num: 5 }, // Nút Tiếp Tục Sang Quyết Toán Cọc
  ],
  'ug-termination-02-deposit-form.png': [
    { left: '75%', top: '24%', num: 1 }, // Tiền cọc ban đầu (TK 244)
    { left: '75%', top: '38%', num: 2 }, // Phương án hoàn trả / cấn trừ
    { left: '75%', top: '54%', num: 3 }, // Số tiền khấu trừ thiệt hại
    { left: '85%', top: '92%', num: 4 }, // Nút Hoàn Tất Thanh Lý
  ],

  // --- CHƯƠNG 9 ---
  'ug-payment-01-console-table.png': [
    { left: '50%', top: '18%', num: 1 }, // 4 Thẻ tổng hợp dòng tiền
    { left: '30%', top: '28%', num: 2 }, // Bộ lọc kỳ kế toán
    { left: '50%', top: '55%', num: 3 }, // Danh sách đợt thanh toán
  ],
  'ug-payment-02-sap-action-bar.png': [
    { left: '22%', top: '42%', num: 1 }, // Checkbox chọn các đợt
    { left: '50%', top: '88%', num: 2 }, // Thanh tác vụ nổi
    { left: '68%', top: '88%', num: 3 }, // Nút Xuất Bút Toán SAP
  ],
  'ug-payment-03-history-trigger.png': [
    { left: '88%', top: '15%', num: 1 }, // Nút Lịch Sử Xuất SAP
  ],
  'ug-payment-03-sap-history-modal.png': [
    { left: '50%', top: '45%', num: 2 }, // Danh sách mã Batch ID
    { left: '75%', top: '45%', num: 3 }, // Nút Tải Lại File
  ],

  // --- CHƯƠNG 10 ---
};

async function annotateImage(browser, filename, hotspots) {
  const filePath = path.join(assetDir, filename);
  const backupFile = path.join(backupDir, filename);

  if (!fs.existsSync(backupFile)) {
    console.warn(`Original backup không tìm thấy cho: ${filename}`);
    return;
  }

  const base64Data = fs.readFileSync(backupFile).toString('base64');
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  const badgesHtml = hotspots.map((h) => `
    <div style="
      position: absolute;
      left: ${h.left};
      top: ${h.top};
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
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      pointer-events: none;
    ">${h.num}</div>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #000; display: flex; justify-content: flex-start; align-items: flex-start; }
          .canvas-wrap { position: relative; display: inline-block; line-height: 0; }
          .canvas-wrap img { display: block; width: 1440px; height: 900px; }
        </style>
      </head>
      <body>
        <div class="canvas-wrap" id="canvas">
          <img src="data:image/png;base64,${base64Data}" />
          ${badgesHtml}
        </div>
      </body>
    </html>
  `;

  await page.setContent(html);
  await page.waitForTimeout(200);

  const canvas = page.locator('#canvas');
  await canvas.screenshot({ path: filePath });
  await page.close();

  console.log(`✓ Đã gắn callout [${hotspots.map(h => h.num).join(',')}] lên: ${filename}`);
}

async function main() {
  console.log('=== GẮN CALLOUT [1], [2], [3] CHO TOÀN BỘ 46 ẢNH TRONG CẨM NANG ===');
  const browser = await chromium.launch({ headless: true });

  for (const [filename, hotspots] of Object.entries(ANNOTATIONS)) {
    await annotateImage(browser, filename, hotspots);
  }

  await browser.close();
  console.log(`=== HOÀN TẤT GẮN CALLOUT CHO ${Object.keys(ANNOTATIONS).length} ẢNH ===`);
}

main().catch((err) => {
  console.error('Lỗi khi gắn callout:', err);
  process.exit(1);
});
