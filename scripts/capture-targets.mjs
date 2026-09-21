import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ANCHOR_CONTRACT_ID = '5c3b5ddd-d7cb-4317-af6c-e8c5681be9f4';
export const ALT_TERMINATE_CONTRACT_ID = '352e4c14-38fe-4a90-b904-f468837621a4';
export const SAMPLE_PDF_PATH = path.resolve(__dirname, '../../../docs/hop_dong_mau/HDTN - 92B Hậu Giang.pdf');

export const CAPTURE_TARGETS = [
  // ----------------------------------------------------
  // CHƯƠNG 1: TỔNG QUAN & DASHBOARD PHÂN QUYỀN (01 - 05)
  // ----------------------------------------------------
  {
    index: 1,
    id: 'auth-01-login-form',
    filename: 'ug-auth-01-login-form.png',
    section: '1.1',
    role: 'NONE',
    url: '/login',
    title: 'Form đăng nhập hệ thống Maycha',
    action: async (page) => {
      await page.goto('/login');
      await page.locator('form, input[name="email"], input[type="email"]').first().waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(500);
    },
  },
  {
    index: 2,
    id: 'dashboard-02-site-metrics',
    filename: 'ug-dashboard-02-site-metrics.png',
    section: '1.2',
    role: 'SITE',
    url: '/dashboard',
    title: 'Dashboard Phát triển Mặt bằng (SITE)',
    action: async (page) => {
      await page.goto('/dashboard');
      await page.locator('h1, .grid').first().waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(1000);
    },
  },
  {
    index: 3,
    id: 'dashboard-03-accountant-pnl',
    filename: 'ug-dashboard-03-accountant-pnl.png',
    section: '1.3',
    role: 'ACCOUNTANT',
    url: '/dashboard',
    title: 'Dashboard Kế toán Tài chính (ACCOUNTANT)',
    action: async (page) => {
      await page.goto('/dashboard');
      await page.locator('h1, .grid').first().waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(1000);
    },
  },
  {
    index: 4,
    id: 'dashboard-04-legal-radar',
    filename: 'ug-dashboard-04-legal-radar.png',
    section: '1.4',
    role: 'LEGAL',
    url: '/dashboard',
    title: 'Dashboard Pháp chế & Cảnh báo hạn (LEGAL)',
    action: async (page) => {
      await page.goto('/dashboard');
      await page.locator('h1, .grid').first().waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(1000);
    },
  },
  {
    index: 5,
    id: 'dashboard-05-admin-360',
    filename: 'ug-dashboard-05-admin-360.png',
    section: '1.5',
    role: 'ADMIN',
    url: '/dashboard',
    title: 'Dashboard Điều hành 360° (ADMIN)',
    action: async (page) => {
      await page.goto('/dashboard');
      await page.locator('h1, .grid').first().waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(1000);
    },
  },

  // ----------------------------------------------------
  // CHƯƠNG 2: DỮ LIỆU NỀN TẢNG MASTER DATA (06 - 09)
  // ----------------------------------------------------
  {
    index: 6,
    id: 'master-01-stores-list',
    filename: 'ug-master-01-stores-list.png',
    section: '2.1',
    role: 'ACCOUNTANT',
    url: '/master-data',
    title: 'Danh mục Điểm bán SAP - Tra cứu',
    action: async (page) => {
      await page.goto('/master-data');
      await page.locator('table, [role="table"]').first().waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(800);
    },
  },
  {
    index: 7,
    id: 'master-02-stores-drawer',
    filename: 'ug-master-02-stores-drawer.png',
    section: '2.2',
    role: 'ACCOUNTANT',
    url: '/master-data',
    title: 'Danh mục Điểm bán SAP - Khai báo mới',
    action: async (page) => {
      await page.goto('/master-data');
      const addBtn = page.locator('button:has-text("Thêm Cửa Hàng SAP")').first();
      await addBtn.waitFor({ state: 'visible', timeout: 10000 });
      await addBtn.click();
      await page.locator('[role="dialog"][data-state="open"]').first().waitFor({ state: 'visible', timeout: 8000 });
      const codeInput = page.locator('[role="dialog"] input[name="storeCode"], [role="dialog"] input#storeCode').first();
      if (await codeInput.count() > 0) {
        await codeInput.fill('CH-GUIDE-01');
      }
      const nameInput = page.locator('[role="dialog"] input[name="storeName"], [role="dialog"] input#storeName').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill('Maycha Cửa Hàng Demo');
      }
      await page.waitForTimeout(600);
    },
  },
  {
    index: 8,
    id: 'master-03-vendors-list',
    filename: 'ug-master-03-vendors-list.png',
    section: '2.3',
    role: 'ACCOUNTANT',
    url: '/master-data',
    title: 'Danh mục Đối tác & Chủ nhà - Tra cứu',
    action: async (page) => {
      await page.goto('/master-data');
      const vendorTab = page.locator('[role="tab"]:has-text("Đối Tác"), [role="tab"]:has-text("SapVendor"), [role="tab"][value="vendors"]').first();
      await vendorTab.waitFor({ state: 'visible', timeout: 10000 });
      await vendorTab.click();
      await page.locator('table, [role="table"]').first().waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(800);
    },
  },
  {
    index: 9,
    id: 'master-04-vendors-drawer',
    filename: 'ug-master-04-vendors-drawer.png',
    section: '2.4',
    role: 'ACCOUNTANT',
    url: '/master-data',
    title: 'Danh mục Đối tác & Chủ nhà - Khai báo mới',
    action: async (page) => {
      await page.goto('/master-data');
      const vendorTab = page.locator('[role="tab"]:has-text("Đối Tác"), [role="tab"]:has-text("SapVendor"), [role="tab"][value="vendors"]').first();
      await vendorTab.waitFor({ state: 'visible', timeout: 10000 });
      await vendorTab.click();
      const addVendorBtn = page.locator('button:has-text("Thêm Nhà Cung Cấp SAP")').first();
      await addVendorBtn.waitFor({ state: 'visible', timeout: 10000 });
      await addVendorBtn.click();
      await page.locator('[role="dialog"][data-state="open"]').first().waitFor({ state: 'visible', timeout: 8000 });
      const codeInput = page.locator('[role="dialog"] input[name="vendorCode"], [role="dialog"] input#vendorCode').first();
      if (await codeInput.count() > 0) {
        await codeInput.fill('NCC-GUIDE-01');
      }
      const nameInput = page.locator('[role="dialog"] input[name="vendorName"], [role="dialog"] input#vendorName').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill('Công ty TNHH Maycha Demo');
      }
      await page.waitForTimeout(600);
    },
  },

  // ----------------------------------------------------
  // CHƯƠNG 3: TIẾP NHẬN HỢP ĐỒNG & AI OCR (10 - 12)
  // ----------------------------------------------------
  {
    index: 10,
    id: 'ocr-01-upload-zone',
    filename: 'ug-ocr-01-upload-zone.png',
    section: '3.1',
    role: 'SITE',
    url: '/lease-contracts/new',
    title: 'Tiếp nhận hồ sơ - Vùng tải tệp quét hợp đồng',
    action: async (page) => {
      await page.goto('/lease-contracts/new');
      await page.locator('input[type="file"], .border-dashed').first().waitFor({ state: 'attached', timeout: 10000 });
      await page.waitForTimeout(600);
    },
  },
  {
    index: 11,
    id: 'ocr-02-scanning-progress',
    filename: 'ug-ocr-02-scanning-progress.png',
    section: '3.2',
    role: 'SITE',
    url: '/lease-contracts/new',
    title: 'Tiến trình trích xuất AI & Độ tin cậy',
    action: async (page) => {
      await page.goto('/lease-contracts/new');
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.waitFor({ state: 'attached', timeout: 10000 });
      await fileInput.setInputFiles(SAMPLE_PDF_PATH);
      const scanBtn = page.locator('button:has-text("Bắt đầu bóc tách dữ liệu AI")').first();
      await scanBtn.waitFor({ state: 'visible', timeout: 10000 });
      await scanBtn.click();
      await page.waitForTimeout(1200);
    },
  },
  {
    index: 12,
    id: 'ocr-03-side-by-side-review',
    filename: 'ug-ocr-03-side-by-side-review.png',
    section: '3.3',
    role: 'SITE',
    url: '/lease-contracts/new',
    title: 'Rà soát song song PDF & Dữ liệu bóc tách',
    action: async (page) => {
      await page.goto('/lease-contracts/new');
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.waitFor({ state: 'attached', timeout: 10000 });
      await fileInput.setInputFiles(SAMPLE_PDF_PATH);
      const manualBtn = page.locator('button:has-text("Tiếp tục nhập thủ công với tệp này")').first();
      await manualBtn.waitFor({ state: 'visible', timeout: 10000 });
      await manualBtn.click();
      await page.locator('form, input[name="contractNumber"]').first().waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(1000);
    },
  },

  // ----------------------------------------------------
  // CHƯƠNG 4: DANH SÁCH & BỘ LỌC HỢP ĐỒNG (13 - 16)
  // ----------------------------------------------------
  {
    index: 13,
    id: 'contract-01-list-console',
    filename: 'ug-contract-01-list-console.png',
    section: '4.1',
    role: 'ADMIN',
    url: '/lease-contracts',
    title: 'Danh sách Hợp đồng toàn chuỗi',
    action: async (page) => {
      await page.goto('/lease-contracts');
      await page.locator('table, [role="table"]').first().waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(1000);
    },
  },
  {
    index: 14,
    id: 'contract-02-filter-active',
    filename: 'ug-contract-02-filter-active.png',
    section: '4.2',
    role: 'ADMIN',
    url: '/lease-contracts',
    title: 'Bộ lọc đa chiều & Tìm kiếm',
    action: async (page) => {
      await page.goto('/lease-contracts');
      await page.locator('table, [role="table"]').first().waitFor({ state: 'visible', timeout: 10000 });
      const filterBtn = page.locator('button:has-text("Trạng thái"), button:has-text("Tất cả"), [data-testid="status-filter"]').first();
      if (await filterBtn.count() > 0) {
        await filterBtn.click();
        await page.waitForTimeout(500);
      }
    },
  },
  {
    index: 15,
    id: 'contract-03-status-badges',
    filename: 'ug-contract-03-status-badges.png',
    section: '4.3',
    role: 'ADMIN',
    url: '/lease-contracts',
    title: 'Đọc hiểu Huy hiệu Trạng thái & Cảnh báo hạn',
    action: async (page) => {
      await page.goto('/lease-contracts');
      await page.locator('table tbody tr').first().waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(1000);
    },
  },
  {
    index: 16,
    id: 'contract-04-alert-config-modal',
    filename: 'ug-contract-04-alert-config-modal.png',
    section: '4.4',
    role: 'LEGAL',
    url: '/dashboard',
    title: 'Cấu hình Ngưỡng Cảnh báo hạn',
    action: async (page) => {
      await page.goto('/dashboard');
      const alertBtn = page.locator('button:has-text("Cấu Hình Ngưỡng"), button:has-text("Cấu hình hạn")').first();
      await alertBtn.waitFor({ state: 'visible', timeout: 10000 });
      await alertBtn.click();
      await page.locator('[role="dialog"]').first().waitFor({ state: 'visible', timeout: 8000 });
      await page.waitForTimeout(600);
    },
  },

  // ----------------------------------------------------
  // CHƯƠNG 5: HỒ SƠ PHÁP LÝ & TÀI LIỆU (17 - 20)
  // ----------------------------------------------------
  {
    index: 17,
    id: 'detail-01-legal-overview',
    filename: 'ug-detail-01-legal-overview.png',
    section: '5.1',
    role: 'ADMIN',
    url: `/lease-contracts/${ANCHOR_CONTRACT_ID}`,
    title: 'Tab Hồ sơ Pháp lý & Health Banner',
    action: async (page) => {
      await page.goto(`/lease-contracts/${ANCHOR_CONTRACT_ID}`);
      const legalTab = page.locator('[role="tab"]:has-text("Hồ Sơ Pháp Lý")').first();
      await legalTab.waitFor({ state: 'visible', timeout: 10000 });
      await legalTab.click();
      await page.waitForTimeout(800);
    },
  },
  {
    index: 18,
    id: 'detail-02-documents-section',
    filename: 'ug-detail-02-documents-section.png',
    section: '5.2',
    role: 'LEGAL',
    url: `/lease-contracts/${ANCHOR_CONTRACT_ID}`,
    title: 'Danh sách Tài liệu đính kèm & Tải lên',
    action: async (page) => {
      await page.goto(`/lease-contracts/${ANCHOR_CONTRACT_ID}`);
      const legalTab = page.locator('[role="tab"]:has-text("Hồ Sơ Pháp Lý")').first();
      await legalTab.waitFor({ state: 'visible', timeout: 10000 });
      await legalTab.click();
      const docSection = page.locator('h3:has-text("Tài Liệu"), h3:has-text("Đính Kèm"), .border-t').last();
      if (await docSection.count() > 0) {
        await docSection.scrollIntoViewIfNeeded();
      }
      await page.waitForTimeout(800);
    },
  },
  {
    index: 19,
    id: 'detail-03-pdf-preview-modal',
    filename: 'ug-detail-03-pdf-preview-modal.png',
    section: '5.3',
    role: 'LEGAL',
    url: `/lease-contracts/${ANCHOR_CONTRACT_ID}`,
    title: 'Xem trước Tài liệu PDF trực quan',
    action: async (page) => {
      await page.goto(`/lease-contracts/${ANCHOR_CONTRACT_ID}`);
      const previewBtn = page.locator('button:has-text("Xem"), button:has-text("Xem trước"), [aria-label*="xem"], .lucide-eye').first();
      if (await previewBtn.count() > 0) {
        await previewBtn.click();
        await page.locator('[role="dialog"]').first().waitFor({ state: 'visible', timeout: 6000 }).catch(() => {});
      }
      await page.waitForTimeout(800);
    },
  },
  {
    index: 20,
    id: 'detail-04-audit-tab',
    filename: 'ug-detail-04-audit-tab.png',
    section: '5.4',
    role: 'ADMIN',
    url: `/lease-contracts/${ANCHOR_CONTRACT_ID}`,
    title: 'Tab Lịch sử & Kiểm toán Hợp đồng',
    action: async (page) => {
      await page.goto(`/lease-contracts/${ANCHOR_CONTRACT_ID}`);
      const auditTab = page.locator('[role="tab"]:has-text("Lịch Sử & Kiểm Toán")').first();
      await auditTab.waitFor({ state: 'visible', timeout: 10000 });
      await auditTab.click();
      await page.waitForTimeout(1000);
    },
  },

  // ----------------------------------------------------
  // CHƯƠNG 6: TÀI CHÍNH & HẠCH TOÁN SAP (21 - 24)
  // ----------------------------------------------------
  {
    index: 21,
    id: 'finance-01-sap-section',
    filename: 'ug-finance-01-sap-section.png',
    section: '6.1',
    role: 'ACCOUNTANT',
    url: `/lease-contracts/${ANCHOR_CONTRACT_ID}`,
    title: 'Bút toán SAP của Hợp đồng',
    action: async (page) => {
      await page.goto(`/lease-contracts/${ANCHOR_CONTRACT_ID}`);
      const finTab = page.locator('[role="tab"]:has-text("Tài Chính")').first();
      await finTab.waitFor({ state: 'visible', timeout: 10000 });
      await finTab.click();
      await page.waitForTimeout(800);
    },
  },
  {
    index: 22,
    id: 'finance-02-schedules-section',
    filename: 'ug-finance-02-schedules-section.png',
    section: '6.2',
    role: 'ACCOUNTANT',
    url: `/lease-contracts/${ANCHOR_CONTRACT_ID}`,
    title: 'Lịch thanh toán của Hợp đồng',
    action: async (page) => {
      await page.goto(`/lease-contracts/${ANCHOR_CONTRACT_ID}`);
      const finTab = page.locator('[role="tab"]:has-text("Tài Chính")').first();
      await finTab.waitFor({ state: 'visible', timeout: 10000 });
      await finTab.click();
      const schedElem = page.locator('h3:has-text("Lịch Thanh Toán"), h3:has-text("Kỳ Thanh Toán"), table').last();
      if (await schedElem.count() > 0) {
        await schedElem.scrollIntoViewIfNeeded();
      }
      await page.waitForTimeout(800);
    },
  },
  {
    index: 23,
    id: 'finance-03-sap-mapping-drawer',
    filename: 'ug-finance-03-sap-mapping-drawer.png',
    section: '6.3',
    role: 'ACCOUNTANT',
    url: `/lease-contracts/${ANCHOR_CONTRACT_ID}`,
    title: 'Cấu hình Ánh xạ Kế toán SAP B1',
    action: async (page) => {
      await page.goto(`/lease-contracts/${ANCHOR_CONTRACT_ID}`);
      const finTab = page.locator('[role="tab"]:has-text("Tài Chính")').first();
      await finTab.waitFor({ state: 'visible', timeout: 10000 });
      await finTab.click();
      // Nút Ghép Nối Mã SAP hoặc Chỉnh Sửa Liên Kết SAP
      const sapBtn = page.locator('button:has-text("Ghép Nối Mã SAP"), button:has-text("Chỉnh Sửa Liên Kết SAP"), button:has-text("Cấu hình SAP")').first();
      await sapBtn.waitFor({ state: 'visible', timeout: 10000 });
      await sapBtn.click();
      await page.locator('[role="dialog"][data-state="open"]').first().waitFor({ state: 'visible', timeout: 8000 });
      await page.waitForTimeout(600);
    },
  },
  {
    index: 24,
    id: 'finance-04-locked-banner',
    filename: 'ug-finance-04-locked-banner.png',
    section: '6.4',
    role: 'ACCOUNTANT',
    url: `/lease-contracts/${ANCHOR_CONTRACT_ID}`,
    title: 'Quy tắc Khóa Điều khoản Tài chính',
    action: async (page) => {
      await page.goto(`/lease-contracts/${ANCHOR_CONTRACT_ID}`);
      const editBtn = page.locator('button[data-testid="edit-metadata-btn"], button:has-text("Sửa thông tin")').first();
      await editBtn.waitFor({ state: 'visible', timeout: 10000 });
      await editBtn.click();
      await page.locator('[role="dialog"][data-state="open"]').first().waitFor({ state: 'visible', timeout: 8000 });
      // Click tab Chủ Nhà bên trong drawer để hiển thị Banner khóa tài chính (DrawerFinancialLockBanner)
      const landlordTab = page.locator('[role="dialog"] [role="tab"]:has-text("Chủ Nhà"), [role="dialog"] [role="tab"][value="landlord"]').first();
      await landlordTab.waitFor({ state: 'visible', timeout: 8000 });
      await landlordTab.click();
      await page.locator('[data-testid="drawer-tab-landlord"], [role="dialog"] div:has-text("Thông tin tài khoản & chủ nhà đã khóa chỉ đọc")').first().waitFor({ state: 'visible', timeout: 8000 });
      await page.waitForTimeout(600);
    },
  },

  // ----------------------------------------------------
  // CHƯƠNG 7: PHỤ LỤC ĐIỀU CHỈNH (25 - 28)
  // ----------------------------------------------------
  {
    index: 25,
    id: 'addendum-01-drawer-init',
    filename: 'ug-addendum-01-drawer-init.png',
    section: '7.1',
    role: 'ACCOUNTANT',
    url: `/lease-contracts/${ANCHOR_CONTRACT_ID}`,
    title: 'Khởi tạo Phụ lục & Chọn loại điều chỉnh',
    action: async (page) => {
      await page.goto(`/lease-contracts/${ANCHOR_CONTRACT_ID}`);
      const addendumBtn = page.locator('button[data-testid="create-addendum-btn"], button:has-text("Tạo Phụ Lục")').first();
      await addendumBtn.waitFor({ state: 'visible', timeout: 10000 });
      await addendumBtn.click();
      await page.locator('[role="dialog"][data-state="open"]').first().waitFor({ state: 'visible', timeout: 8000 });
      await page.waitForTimeout(600);
    },
  },
  {
    index: 26,
    id: 'addendum-02-beneficiary-form',
    filename: 'ug-addendum-02-beneficiary-form.png',
    section: '7.2',
    role: 'ACCOUNTANT',
    url: `/lease-contracts/${ANCHOR_CONTRACT_ID}`,
    title: 'Thay đổi Tài khoản Thụ hưởng',
    action: async (page) => {
      await page.goto(`/lease-contracts/${ANCHOR_CONTRACT_ID}`);
      const addendumBtn = page.locator('button[data-testid="create-addendum-btn"], button:has-text("Tạo Phụ Lục")').first();
      await addendumBtn.waitFor({ state: 'visible', timeout: 10000 });
      await addendumBtn.click();
      await page.locator('[role="dialog"][data-state="open"]').first().waitFor({ state: 'visible', timeout: 8000 });
      const typeBtn = page.locator('[role="dialog"] button:has-text("Chỉ đổi thụ hưởng")').first();
      await typeBtn.waitFor({ state: 'visible', timeout: 6000 });
      await typeBtn.click();
      await page.waitForTimeout(600);
    },
  },
  {
    index: 27,
    id: 'addendum-03-pricing-override',
    filename: 'ug-addendum-03-pricing-override.png',
    section: '7.3',
    role: 'ACCOUNTANT',
    url: `/lease-contracts/${ANCHOR_CONTRACT_ID}`,
    title: 'Điều chỉnh Bậc thang Giá & Giảm giá hỗ trợ',
    action: async (page) => {
      await page.goto(`/lease-contracts/${ANCHOR_CONTRACT_ID}`);
      const addendumBtn = page.locator('button[data-testid="create-addendum-btn"], button:has-text("Tạo Phụ Lục")').first();
      await addendumBtn.waitFor({ state: 'visible', timeout: 10000 });
      await addendumBtn.click();
      await page.locator('[role="dialog"][data-state="open"]').first().waitFor({ state: 'visible', timeout: 8000 });
      const typeBtn = page.locator('[role="dialog"] button:has-text("Chỉ đổi giá thuê")').first();
      await typeBtn.waitFor({ state: 'visible', timeout: 6000 });
      await typeBtn.click();
      await page.waitForTimeout(600);
    },
  },
  {
    index: 28,
    id: 'addendum-04-diff-preview',
    filename: 'ug-addendum-04-diff-preview.png',
    section: '7.4',
    role: 'ACCOUNTANT',
    url: `/lease-contracts/${ANCHOR_CONTRACT_ID}`,
    title: 'Đối soát Biến động Lịch thanh toán (Diff)',
    action: async (page) => {
      await page.goto(`/lease-contracts/${ANCHOR_CONTRACT_ID}`);
      const addendumBtn = page.locator('button[data-testid="create-addendum-btn"], button:has-text("Tạo Phụ Lục")').first();
      await addendumBtn.waitFor({ state: 'visible', timeout: 10000 });
      await addendumBtn.click();
      await page.locator('[role="dialog"][data-state="open"]').first().waitFor({ state: 'visible', timeout: 8000 });
      const typeBtn = page.locator('[role="dialog"] button:has-text("Chỉ đổi giá thuê")').first();
      await typeBtn.waitFor({ state: 'visible', timeout: 6000 });
      await typeBtn.click();
      const simBtn = page.locator('[role="dialog"] button:has-text("Xem trước biến động")').first();
      if (await simBtn.count() > 0) {
        await simBtn.click();
        await page.waitForTimeout(1000);
      }
      await page.waitForTimeout(600);
    },
  },

  // ----------------------------------------------------
  // CHƯƠNG 8: THANH LÝ & QUYẾT TOÁN CỌC (29 - 30)
  // (Thực hiện trên hợp đồng khác để không hủy ANCHOR)
  // ----------------------------------------------------
  {
    index: 29,
    id: 'termination-01-drawer',
    filename: 'ug-termination-01-drawer.png',
    section: '8.1',
    role: 'LEGAL',
    url: `/lease-contracts/${ALT_TERMINATE_CONTRACT_ID}`,
    title: 'Khởi tạo Quy trình Thanh lý hợp đồng',
    action: async (page) => {
      await page.goto(`/lease-contracts/${ALT_TERMINATE_CONTRACT_ID}`);
      const termBtn = page.locator('button[data-testid="terminate-contract-btn"], button:has-text("Thanh lý")').first();
      await termBtn.waitFor({ state: 'visible', timeout: 10000 });
      await termBtn.click();
      await page.locator('[role="dialog"][data-state="open"]').first().waitFor({ state: 'visible', timeout: 8000 });
      await page.waitForTimeout(600);
    },
  },
  {
    index: 30,
    id: 'termination-02-deposit-form',
    filename: 'ug-termination-02-deposit-form.png',
    section: '8.2',
    role: 'ACCOUNTANT',
    url: `/lease-contracts/${ALT_TERMINATE_CONTRACT_ID}`,
    title: 'Quyết toán Cọc TK 244 & Khấu trừ',
    action: async (page) => {
      await page.goto(`/lease-contracts/${ALT_TERMINATE_CONTRACT_ID}`);
      const termBtn = page.locator('button[data-testid="terminate-contract-btn"], button:has-text("Thanh lý")').first();
      await termBtn.waitFor({ state: 'visible', timeout: 10000 });
      await termBtn.click();
      await page.locator('[role="dialog"][data-state="open"]').first().waitFor({ state: 'visible', timeout: 8000 });
      const partialRadio = page.locator('[role="dialog"] label:has-text("Khấu trừ một phần"), [role="dialog"] input[value="PARTIAL"]').first();
      if (await partialRadio.count() > 0) {
        await partialRadio.click({ force: true });
      }
      await page.waitForTimeout(600);
    },
  },

  // ----------------------------------------------------
  // CHƯƠNG 9: SỔ THANH TOÁN & XUẤT SAP (31 - 33)
  // ----------------------------------------------------
  {
    index: 31,
    id: 'payment-01-console-table',
    filename: 'ug-payment-01-console-table.png',
    section: '9.1',
    role: 'ACCOUNTANT',
    url: '/payment-schedules',
    title: 'Bàn điều khiển Sổ Lịch Thanh toán',
    action: async (page) => {
      await page.goto('/payment-schedules');
      await page.locator('table, [role="table"]').first().waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(1000);
    },
  },
  {
    index: 32,
    id: 'payment-02-sap-action-bar',
    filename: 'ug-payment-02-sap-action-bar.png',
    section: '9.2',
    role: 'ACCOUNTANT',
    url: '/payment-schedules',
    title: 'Tích chọn & Xuất hàng loạt Bút toán SAP',
    action: async (page) => {
      await page.goto('/payment-schedules');
      await page.locator('table tbody tr').first().waitFor({ state: 'visible', timeout: 10000 });
      // Tích chọn checkbox bằng button[role="checkbox"] (Radix UI Checkbox component)
      const checkboxes = page.locator('table tbody tr button[role="checkbox"]');
      const count = await checkboxes.count();
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 3); i++) {
          await checkboxes.nth(i).click({ force: true });
          await page.waitForTimeout(200);
        }
      } else {
        // Thử click checkbox trên header nếu có
        const headerCheckbox = page.locator('table thead button[role="checkbox"]').first();
        if (await headerCheckbox.count() > 0) {
          await headerCheckbox.click({ force: true });
        }
      }
      await page.locator('aside[aria-label="Thanh tác vụ xuất bút toán SAP"], aside:has-text("Xuất Bút Toán SAP")').first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(600);
    },
  },
  {
    index: 33,
    id: 'payment-03-sap-history-modal',
    filename: 'ug-payment-03-sap-history-modal.png',
    section: '9.3',
    role: 'ACCOUNTANT',
    url: '/payment-schedules',
    title: 'Nhật ký Lịch sử Xuất SAP',
    action: async (page) => {
      await page.goto('/payment-schedules');
      await page.locator('table tbody tr').first().waitFor({ state: 'visible', timeout: 10000 });
      // Tìm badge hoặc button có title hoặc text lịch sử xuất
      const histBtn = page.locator('[title="Xem lịch sử xuất bút toán"], button:has-text("Lịch sử xuất"), [role="dialog"] button:has-text("Lịch sử")').first();
      if (await histBtn.count() > 0) {
        await histBtn.click();
        await page.locator('[role="dialog"]').first().waitFor({ state: 'visible', timeout: 8000 });
      }
      await page.waitForTimeout(800);
    },
  },

  // ----------------------------------------------------
  // CHƯƠNG 10: QUẢN TRỊ & BẢO MẬT (34)
  // ----------------------------------------------------
  {
    index: 34,
    id: 'admin-01-users-matrix',
    filename: 'ug-admin-01-users-matrix.png',
    section: '10.1',
    role: 'ADMIN',
    url: '/users',
    title: 'Quản lý Người dùng & Ma trận Phân quyền PBAC',
    action: async (page) => {
      await page.goto('/users');
      await page.locator('table tbody tr').first().waitFor({ state: 'visible', timeout: 10000 });
      const addBtn = page.locator('button:has-text("Thêm người dùng"), button:has-text("Thêm mới")').first();
      await addBtn.waitFor({ state: 'visible', timeout: 10000 });
      await addBtn.click();
      await page.locator('[role="dialog"][data-state="open"]').first().waitFor({ state: 'visible', timeout: 8000 });
      await page.waitForTimeout(800);
    },
  },
];
