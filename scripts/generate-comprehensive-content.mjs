import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const contentPath = path.join(projectRoot, 'src', 'content', 'guide-content.json');

const metadata = {
  title: 'Cẩm Nang Hướng Dẫn Sử Dụng Hệ Thống Quản Lý Hợp Đồng Maycha',
  version: '2.0.0',
  systemName: 'Maycha Lease Contract Management System',
  scope: 'Hướng dẫn vận hành toàn diện quy trình nghiệp vụ Quản lý Hợp đồng Thuê Mặt bằng Maycha dành cho 4 phòng ban: Mặt Bằng (SITE), Kế Toán (ACCOUNTANT), Pháp Lý (LEGAL), Ban Giám Đốc (ADMIN)',
  audience: 'Toàn thể Cán bộ - Nhân viên thuộc Phòng Phát triển Mặt bằng, Phòng Kế toán Tài chính, Phòng Pháp chế và Ban Giám Đốc Công ty Cổ phần Maycha',
  notice: 'Tài liệu quy chuẩn nghiệp vụ nội bộ. Hướng dẫn chi tiết từng bước thao tác thực tế gắn liền trách nhiệm pháp lý, kiểm soát dòng tiền và phân tách trách nhiệm (SoD). Mọi vướng mắc vận hành vui lòng liên hệ Ban Quản trị Hệ thống.',
  imageCount: 47,
};

const LABEL_ROLE = 'Ai làm việc này?';
const LABEL_PURPOSE = 'Việc này để làm gì?';
const LABEL_CONDITION = 'Cần chuẩn bị trước';
const LABEL_ACTION = 'Làm theo từng bước';
const LABEL_RESULT = 'Bạn sẽ thấy gì';
const LABEL_CAUTION = 'Mẹo hay & Điều cần biết';

const TERMINOLOGY_MAP = {
  'Cost Center': 'Mã quán Maycha',
  'CardCode': 'Mã chủ nhà',
  'Batch ID': 'Mã đợt xuất SAP',
  'Action Bar': 'Thanh thao tác chân trang',
  'Drawer': 'Khung trượt bên phải',
  'Modal': 'Cửa sổ',
  'SoD/PBAC': 'Phân công rõ việc',
  'PBAC': 'Phân công rõ việc',
  'SoD': 'Phân công rõ việc',
};

function replaceTerms(text) {
  let out = text;
  const keys = Object.keys(TERMINOLOGY_MAP).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    out = out.replace(new RegExp(escaped, 'gi'), TERMINOLOGY_MAP[key]);
  }
  out = out
    .replace(/\bMã\s+Mã\s+/g, 'Mã ')
    .replace(/\bmã\s+Mã\s+/g, 'mã ')
    .replace(/\bMã\s+mã\s+/g, 'Mã ')
    .replace(/chủ nhà\s+chủ nhà/gi, 'chủ nhà');
  return out;
}

function applyTerminology(text) {
  if (typeof text !== 'string') return text;
  return text
    .split(/("[^"]*"|`[^`]*`)/)
    .map((seg, i) => (i % 2 === 1 ? seg : replaceTerms(seg)))
    .join('');
}

function plainifyGuide(guide) {
  if (guide.notice) {
    guide.notice = applyTerminology(guide.notice);
  }
  if (guide.scope) {
    guide.scope = applyTerminology(guide.scope);
  }
  for (const section of guide.sections) {
    if (section.id === 'chapter-0-glossary') continue;
    section.title = applyTerminology(section.title);
    for (const block of section.blocks) {
      if (block.type === 'label') continue;
      if (block.type === 'paragraph') block.text = applyTerminology(block.text);
      if (block.type === 'steps' || block.type === 'bullets') {
        block.items = block.items.map(applyTerminology);
      }
      if (block.type === 'table') {
        block.headers = block.headers.map(applyTerminology);
        block.rows = block.rows.map((r) => r.map(applyTerminology));
      }
      if (block.type === 'image') {
        block.alt = applyTerminology(block.alt);
        block.caption = applyTerminology(block.caption);
      }
    }
  }
  return guide;
}

function createSection(id, title, role, { purpose, conditions, steps, images, result, cautions, extraBlocks = [] }) {
  const blocks = [
    { type: 'label', text: LABEL_ROLE },
    { type: 'paragraph', text: `Bộ phận phụ trách: ${role}` },
    { type: 'label', text: LABEL_PURPOSE },
    { type: 'paragraph', text: purpose },
    { type: 'label', text: LABEL_CONDITION },
    { type: 'bullets', items: conditions },
    { type: 'label', text: LABEL_ACTION },
    { type: 'steps', items: steps },
  ];

  images.forEach((img) => {
    blocks.push({
      type: 'image',
      src: img.src,
      alt: img.alt,
      caption: img.caption,
    });
  });
  extraBlocks.forEach((b) => blocks.push(b));

  blocks.push(
    { type: 'label', text: LABEL_RESULT },
    { type: 'paragraph', text: result },
    { type: 'label', text: LABEL_CAUTION },
    { type: 'bullets', items: cautions },
  );

  return {
    id,
    title,
    level: 2,
    role: role.includes('(SITE)') ? 'SITE' : role.includes('(ACCOUNTANT)') ? 'ACCOUNTANT' : role.includes('(LEGAL)') ? 'LEGAL' : role.includes('(ADMIN)') ? 'ADMIN' : 'ALL',
    blocks,
  };
}

const sections = [
  // =========================================================================
  // CHƯƠNG 0 — TỪ ĐIỂN VẬN HÀNH BỎ TÚI
  // =========================================================================
  {
    id: 'chapter-0-glossary',
    title: 'Chương 0. Từ điển Vận hành Bỏ túi',
    level: 1,
    role: 'ALL',
    blocks: [
      {
        type: 'paragraph',
        text: 'Gặp một từ lạ trên màn hình? Tra nhanh tại đây. Cột bên trái là chữ đôi khi còn thấy trong hệ thống hoặc file kế toán; cột giữa là cách gọi bình dân của Maycha; cột phải là mẹo ghi nhớ.'
      },
      {
        type: 'label',
        text: 'Bảng tra nhanh thuật ngữ'
      },
      {
        type: 'table',
        headers: ['Từ trong hệ thống / SAP', 'Cách gọi bình dân Maycha', 'Ghi nhớ nhanh'],
        rows: [
          ['Cost Center', 'Mã quán Maycha', 'Mỗi quán một mã để tính lãi/lỗ riêng'],
          ['CardCode', 'Mã chủ nhà', 'Định danh người nhận tiền thuê trên SAP'],
          ['Batch ID', 'Mã đợt xuất SAP', 'Mỗi lần xuất file kế toán sinh 1 mã để tra ngược'],
          ['Drawer', 'Khung trượt bên phải', 'Bảng nhập liệu trượt ra từ mép phải màn hình'],
          ['Modal', 'Cửa sổ', 'Hộp nổi giữa màn hình khi bạn bấm nút'],
          ['Action Bar', 'Thanh thao tác chân trang', 'Dải nút hành động nằm cuối bảng'],
          ['SoD / PBAC', 'Phân công rõ việc', 'Mỗi phòng ban chỉ thấy và làm đúng phần của mình'],
          ['TK 244', 'Tài khoản tiền cọc', 'Nơi treo tiền đặt cọc mặt bằng'],
          ['TK 811', 'Chi phí khác (mất cọc)', 'Nơi ghi khoản cọc bị mất do vi phạm'],
          ['JE (Journal Entry)', 'Bút toán kế toán', 'Dòng ghi nợ/có nạp vào SAP']
        ]
      },
      {
        type: 'paragraph',
        text: 'Mẹo: dùng ô Tìm kiếm ở đầu trang, gõ không dấu cũng ra (ví dụ gõ "mat coc" sẽ tìm thấy phần quyết toán cọc). (Tính năng này có hiệu lực sau khi bộ lọc vai trò Phase 1 được triển khai.)'
      }
    ]
  },
  // =========================================================================
  // CHƯƠNG 1
  // =========================================================================
  {
    id: 'chapter-1-overview',
    title: 'Chương 1. Tổng quan & Dashboard Phân quyền',
    level: 1,
    role: 'ALL',
    blocks: [
      {
        type: 'paragraph',
        text: 'Hệ thống Quản lý Hợp đồng Thuê Mặt bằng Maycha là nền tảng số hóa tập trung, kết nối 4 khối nghiệp vụ (Mặt Bằng, Kế Toán, Pháp Lý, Ban Giám Đốc) trong một luồng vận hành khép kín từ khâu khảo sát tiếp nhận, theo dõi lịch thanh toán, hạch toán ERP SAP B1 đến thanh lý hợp đồng.',
      },
      {
        type: 'label',
        text: 'Phân tách Trách nhiệm Nghiệp vụ (SoD - Segregation of Duties)',
      },
      {
        type: 'paragraph',
        text: 'Nhằm bảo đảm tính minh bạch tài chính và kiểm soát rủi ro pháp lý, hệ thống thiết lập nguyên tắc phân quyền độc lập giữa các phòng ban:',
      },
      {
        type: 'table',
        headers: ['Phòng ban / Vai trò', 'Nhiệm vụ trọng tâm', 'Quyền hạn trên hệ thống', 'Giới hạn kiểm soát rủi ro'],
        rows: [
          [
            'Phát Triển Mặt Bằng (SITE)',
            'Khảo sát, tiếp nhận hồ sơ thuê, bóc tách hợp đồng scan bằng AI OCR',
            'Tạo mới hồ sơ mặt bằng, tải tài liệu đính kèm và lưu trữ hồ sơ',
            'Chuyên trách hồ sơ mặt bằng và tiếp nhận; phần tài chính và xuất bút toán SAP được để dành cho Kế toán để tránh nhầm lẫn tiền bạc'
          ],
          [
            'Kế Toán Tài Chính (ACCOUNTANT)',
            'Ánh xạ mã SAP, kiểm soát lịch thanh toán, lập phụ lục điều chỉnh giá, xuất bút toán SAP B1',
            'Quản lý Master Data, lập phụ lục đổi thụ hưởng/giá, xuất file kế toán',
            'Chuyên trách số liệu kế toán và thanh toán; việc phân quyền tài khoản do Ban Giám Đốc quản trị để bảo đảm an toàn dữ liệu'
          ],
          [
            'Pháp Lý (LEGAL)',
            'Thẩm định hồ sơ pháp lý, cấu hình radar cảnh báo hạn, khởi tạo thanh lý',
            'Kiểm tra giấy tờ chủ quyền, thiết lập mốc cảnh báo, lập biên bản thanh lý',
            'Chuyên trách rà soát tính pháp lý và hồ sơ tài sản; nghiệp vụ chi tiền và xuất bút toán do Kế toán phụ trách'
          ],
          [
            'Ban Giám Đốc (ADMIN)',
            'Giám sát điều hành toàn diện 360°, quản trị người dùng và phân bổ vai trò',
            'Toàn quyền giám sát chỉ số toàn chuỗi, cấp/thu hồi tài khoản nhân sự',
            'Giám sát toàn diện chỉ số toàn chuỗi, phân quyền nhân sự và chịu trách nhiệm cao nhất về an toàn dữ liệu'
          ]
        ]
      }
    ]
  },
  createSection('auth-login-pbac', '1.1. Đăng nhập Hệ thống & Phiên làm việc An toàn', 'Tất cả Cán bộ - Nhân viên (ALL)', {
    purpose: 'Cung cấp cơ chế đăng nhập an toàn vào trung tâm điều hành Maycha, xác thực danh tính nhân sự qua tài khoản công vụ và tự động chuyển hướng tới Dashboard tương ứng với phòng ban.',
    conditions: [
      'Nhân sự đã được Quản trị viên cấp tài khoản qua email công vụ đuôi @maycha.com.vn.',
      'Sử dụng trình duyệt web hiện đại (Google Chrome, Microsoft Edge, Firefox hoặc Safari).',
      'Tài khoản đang ở trạng thái Hoạt động (ACTIVE).'
    ],
    steps: [
      'Bước 1: Mở trình duyệt và truy cập cổng nội bộ Maycha, nhập chính xác Email công vụ (ví dụ: site@maycha.com.vn, ketoan@maycha.com.vn).',
      'Bước 2: Nhập Mật khẩu đăng nhập được cấp ban đầu hoặc mật khẩu cá nhân đã đổi.',
      'Bước 3: Nhấn biểu tượng con mắt nếu muốn kiểm tra lại ký tự mật khẩu vừa gõ.',
      'Bước 4: Nhấn nút "Truy Cập Trung Tâm Điều Hành" để đăng nhập vào Dashboard của phòng ban.'
    ],
    images: [{
      src: '/assets/user-guide/2026-09-contract-guide/ug-auth-01-login-form.png',
      alt: 'Giao diện Đăng nhập hệ thống Quản lý Hợp đồng Maycha',
      caption: 'Hình 1.1: Giao diện Đăng nhập Maycha'
    }],
    result: 'Hệ thống xác thực thành công, ghi nhận phiên làm việc an toàn và tự động chuyển hướng tới Dashboard làm việc đúng với vai trò của nhân sự.',
    cautions: [
      'Mỗi nhân sự nên dùng tài khoản công vụ riêng và bảo mật mật khẩu của mình, giúp hệ thống ghi nhận chính xác người thực hiện thao tác.',
      'Hệ thống tự động ghi nhớ phiên làm việc an toàn trong ngày; nếu không thao tác trong thời gian dài, vui lòng đăng nhập lại để bảo vệ thông tin công ty.'
    ]
  }),
  createSection('dashboard-site', '1.2. Dashboard Phòng Phát triển Mặt bằng', 'Phòng Phát triển Mặt bằng (SITE)', {
    purpose: 'Cung cấp góc nhìn toàn cảnh về tiến độ khảo sát, tiếp nhận và số hóa hợp đồng thuê mới, giúp chuyên viên mặt bằng theo dõi chặt chẽ từng hồ sơ từ lúc tìm kiếm điểm bán tới khi bàn giao cho kế toán.',
    conditions: [
      'Đăng nhập tài khoản thuộc Phòng Phát triển Mặt bằng (vai trò SITE).',
      'Đang trong quá trình khảo sát, tiếp nhận hoặc chuẩn bị ký hợp đồng điểm bán mới.'
    ],
    steps: [
      'Bước 1: Sau khi đăng nhập, quan sát 4 thẻ chỉ số nhanh: Tổng số mặt bằng quản lý, Hồ sơ đang tiếp nhận qua AI OCR, Hợp đồng đang theo dõi và Mặt bằng cần tái khảo sát.',
      'Bước 2: Theo dõi biểu đồ tiến độ tiếp nhận theo từng khu vực tỉnh/thành phố để nắm bắt điểm nghẽn.',
      'Bước 3: Kiểm tra danh sách các điểm thuê cần tái khảo sát hoặc sắp hết hạn bàn giao.',
      'Bước 4: Nhấp vào nút "Tiếp Nhận Hợp Đồng Mới" ở góc phải để bắt đầu số hóa tài liệu thuê mới.'
    ],
    images: [{
      src: '/assets/user-guide/2026-09-contract-guide/ug-dashboard-02-site-metrics.png',
      alt: 'Dashboard Phòng Phát triển Mặt bằng',
      caption: 'Hình 1.2: Dashboard Mặt bằng'
    }],
    result: 'Hiển thị đầy đủ số liệu mặt bằng theo thời gian thực, hỗ trợ điều hướng nhanh tới tác vụ quét AI OCR hoặc tạo hợp đồng mới.',
    cautions: [
      'Sau khi hợp đồng có hiệu lực, mọi điều chỉnh giá cần thực hiện qua phụ lục pháp lý do Kế toán phối hợp lập để bảo đảm tính pháp lý.',
      'Cần đối soát kỹ số lượng mặt bằng đang vận hành với danh mục điểm bán thực tế để tránh trùng lặp.'
    ]
  }),
  createSection('dashboard-accountant', '1.3. Dashboard Phòng Kế toán Tài chính', 'Phòng Kế toán Tài chính (ACCOUNTANT)', {
    purpose: 'Hỗ trợ Kế toán trưởng và Chuyên viên Kế toán tiền thuê kiểm soát toàn diện nghĩa vụ chi trả, dự báo dòng tiền thuê mặt bằng từng tháng và cảnh báo các đợt thanh toán đến hạn hạch toán SAP B1.',
    conditions: [
      'Đăng nhập tài khoản thuộc Phòng Kế toán Tài chính (vai trò ACCOUNTANT).',
      'Đã hoàn tất ánh xạ mã SAP B1 cho các hợp đồng đang hiệu lực.'
    ],
    steps: [
      'Bước 1: Tại Dashboard Kế toán, theo dõi khối dự báo dòng tiền chi trả tiền thuê trong 30 - 60 - 90 ngày tới.',
      'Bước 2: Kiểm tra bảng danh sách các đợt thanh toán sắp đến hạn trong tuần để chuẩn bị nguồn vốn.',
      'Bước 3: Nhấp vào lối tắt "Sổ Lịch Thanh Toán" ở góc trên bên phải để vào trung tâm hạch toán bút toán SAP.',
      'Bước 4: Đối chiếu tổng số tiền cần chi trong tháng với kế hoạch ngân sách được duyệt từ Ban Giám Đốc.'
    ],
    images: [{
      src: '/assets/user-guide/2026-09-contract-guide/ug-dashboard-03-accountant-pnl.png',
      alt: 'Dashboard Phòng Kế toán Tài chính',
      caption: 'Hình 1.3: Dashboard Kế toán'
    }],
    result: 'Cung cấp số liệu tài chính chính xác phục vụ lập kế hoạch ngân sách và ngăn chặn triệt để tình trạng chậm trả tiền thuê mặt bằng.',
    cautions: [
      'Dòng tiền dự báo đã tính toán các đợt giảm giá hỗ trợ (nếu có phụ lục giảm giá đã duyệt).',
      'Kế toán cần kiểm tra kỹ thông tin thuế nộp thay chủ nhà trước khi xuất dữ liệu sang SAP B1.'
    ]
  }),
  createSection('dashboard-legal', '1.4. Dashboard Phòng Pháp chế & Radar Hạn hợp đồng', 'Phòng Pháp chế (LEGAL)', {
    purpose: 'Giúp Chuyên viên Pháp lý giám sát tính toàn vẹn của hồ sơ pháp lý mặt bằng và chủ động quản lý thời hạn thuê qua hệ thống Radar cảnh báo sớm 3 cấp độ, tránh bị động khi hết hạn hoặc bị phạt cọc.',
    conditions: [
      'Đăng nhập tài khoản thuộc Phòng Pháp chế (vai trò LEGAL).',
      'Hồ sơ hợp đồng đã được tải lên bản scan tài liệu chứng thực.'
    ],
    steps: [
      'Bước 1: Tại Dashboard Pháp chế, quan sát hệ thống cảnh báo hạn phân chia 3 cấp độ: Xanh (dưới 180 ngày), Vàng (dưới 90 ngày), Đỏ (dưới 30 ngày).',
      'Bước 2: Lọc nhanh danh sách các hợp đồng nằm trong vùng Đỏ và Vàng để lên kế hoạch đàm phán tái ký hoặc trả mặt bằng.',
      'Bước 3: Kiểm tra cột Thước đo Sức khỏe Hồ sơ để phát hiện các hợp đồng còn thiếu bản scan công chứng hoặc giấy ủy quyền.',
      'Bước 4: Gửi thông báo nhắc nhở nội bộ tới chuyên viên mặt bằng phụ trách điểm thuê để đôn đốc hoàn thiện giấy tờ.'
    ],
    images: [{
      src: '/assets/user-guide/2026-09-contract-guide/ug-dashboard-04-legal-radar.png',
      alt: 'Dashboard Phòng Pháp chế',
      caption: 'Hình 1.4: Dashboard Pháp chế'
    }],
    result: 'Danh sách các hợp đồng cần ưu tiên xử lý pháp lý được làm nổi bật, giúp phòng Pháp chế gửi thông báo kịp thời cho Ban Giám Đốc và phòng Mặt Bằng.',
    cautions: [
      'Hợp đồng ở vùng cảnh báo Đỏ (dưới 30 ngày) cần được ưu tiên liên hệ chủ nhà tái ký hoặc thông báo hoàn trả theo hạn cam kết, giúp Maycha bảo toàn toàn bộ tiền cọc.',
      'Hồ sơ thiếu chứng từ sở hữu cần được bổ sung trong vòng 14 ngày làm việc kể từ ngày khai trương cửa hàng.'
    ]
  }),
  createSection('dashboard-admin', '1.5. Dashboard Ban Giám Đốc Điều hành 360°', 'Ban Giám Đốc / Quản trị Viên (ADMIN)', {
    purpose: 'Cung cấp cho Ban Giám Đốc bức tranh điều hành tổng thể 360 độ: toàn bộ mạng lưới điểm bán, chi phí tiền thuê chuỗi F&B, sức khỏe pháp lý và trạng thái nhân sự vận hành.',
    conditions: [
      'Tài khoản thuộc Ban Giám Đốc hoặc Quản trị viên cấp cao (vai trò ADMIN).',
      'Cần theo dõi báo cáo quản trị cấp cao.'
    ],
    steps: [
      'Bước 1: Tại Dashboard Điều hành, quan sát các chỉ số chiến lược: Tổng số cửa hàng đang hoạt động, Tổng chi phí thuê hàng tháng và Tỷ lệ thanh toán đúng hạn.',
      'Bước 2: Xem biểu đồ phân bổ chi phí thuê mặt bằng theo từng khu vực thị trường trọng điểm.',
      'Bước 3: Kiểm tra khối trạng thái nhân sự vận hành và các cảnh báo vi phạm phân công rõ việc (SoD).',
      'Bước 4: Kiểm tra nhanh nhật ký kiểm toán hệ thống để giám sát các giao dịch xuất dữ liệu tài chính trong ngày.'
    ],
    images: [{
      src: '/assets/user-guide/2026-09-contract-guide/ug-dashboard-05-admin-360.png',
      alt: 'Dashboard Ban Giám Đốc Điều hành 360 độ',
      caption: 'Hình 1.5: Dashboard Điều hành 360°'
    }],
    result: 'Giao diện tổng hợp số liệu trực quan phục vụ ra quyết định mở rộng chuỗi hoặc tối ưu hóa chi phí thuê mặt bằng trên toàn hệ thống.',
    cautions: [
      'Báo cáo tổng hợp số liệu tài chính được cập nhật liên tục dựa trên các đợt xuất bút toán SAP thực tế.',
      'Ban Giám Đốc có thể kiểm tra chéo nhật ký kiểm toán (Audit Trail) để phát hiện bất kỳ sự thay đổi dữ liệu bất thường nào.'
    ]
  }),

  // =========================================================================
  // CHƯƠNG 2
  // =========================================================================
  {
    id: 'chapter-2-master-data',
    title: 'Chương 2. Dữ liệu Nền tảng Master Data SAP B1',
    level: 1,
    role: 'ACCOUNTANT',
    blocks: [
      {
        type: 'paragraph',
        text: 'Dữ liệu nền tảng (Master Data) là xương sống kết nối giữa hợp đồng mặt bằng và hệ thống kế toán ERP SAP B1. Việc khai báo chuẩn xác Mã Điểm Bán (Cost Center) và Mã Đối Tác / Chủ Nhà (CardCode) bảo đảm mọi khoản tiền thuê chi ra đều được hạch toán đúng cửa hàng và đúng đối tượng thụ hưởng.',
      },
      {
        type: 'label',
        text: 'Nguyên tắc Đối soát Dữ liệu Nền tảng',
      },
      {
        type: 'bullets',
        items: [
          'Mã Điểm Bán (Cost Center): Tương ứng với từng cửa hàng Maycha, là trung tâm chi phí để tính toán lỗ/lãi (P&L) riêng biệt.',
          'Mã Đối Tác / Chủ Nhà (CardCode): Định danh pháp nhân hoặc cá nhân chủ nhà trên SAP B1 để theo dõi công nợ chi trả tiền thuê và hoàn cọc.',
          'Mẹo an toàn: Mỗi cửa hàng chỉ cần một mã duy nhất để số liệu báo cáo luôn nhất quán; thông tin thụ hưởng nên đối chiếu kỹ với hợp đồng trước khi lưu.'
        ]
      }
    ]
  },
  createSection('master-stores-list', '2.1. Danh mục Điểm bán (Mã quán Maycha) — Tra cứu', 'Phòng Kế toán (ACCOUNTANT)', {
    purpose: 'Tra cứu, tìm kiếm và kiểm tra tình trạng kết nối của các cửa hàng Maycha trên toàn quốc, phục vụ việc gán đúng trung tâm chi phí cho hợp đồng thuê.',
    conditions: [
      'Tài khoản có quyền quản lý danh mục dữ liệu nền tảng (ACCOUNTANT / ADMIN).',
      'Cần kiểm tra cửa hàng đã được khai báo trên hệ thống hay chưa.'
    ],
    steps: [
      'Bước 1: Chọn mục "Dữ Liệu Nền Tảng (Master Data)" trên thanh menu, nhấp tab "Cửa Hàng / Điểm Bán SAP".',
      'Bước 2 [1]: Nhập mã cửa hàng (ví dụ: `CH-045`) hoặc tên đường vào ô tìm kiếm.',
      'Bước 3 [2]: Kiểm tra cột "Mã Cost Center SAP" được cấp từ hệ thống ERP.',
      'Bước 4 [3]: Kiểm tra cột "Trạng Thái" đảm bảo điểm bán đang ở trạng thái Hoạt Động.'
    ],
    images: [{
      src: '/assets/user-guide/2026-09-contract-guide/ug-master-01-stores-list.png',
      alt: 'Danh mục Điểm bán SAP Maycha',
      caption: 'Hình 2.1: Danh mục Điểm bán SAP'
    }],
    result: 'Bảng danh sách hiển thị chi tiết mã cửa hàng, tên điểm bán, địa chỉ, trung tâm chi phí và tình trạng hoạt động.',
    cautions: [
      'Nếu cửa hàng mới mở chưa có mã Cost Center trên danh sách, kế toán cần tạo mới trước khi tạo hợp đồng thuê.',
      'Mã điểm bán của cửa hàng đã phát sinh hạch toán nên được giữ nguyên để số liệu báo cáo qua các tháng luôn đồng nhất.'
    ]
  }),
  createSection('master-stores-create', '2.2. Danh mục Điểm bán Maycha — Khai báo Cửa hàng mới', 'Phòng Kế toán (ACCOUNTANT)', {
    purpose: 'Khai báo thông tin điểm bán mới vào hệ thống, thiết lập mã Cost Center chuẩn theo quy định ERP SAP B1 phục vụ việc ghi nhận chi phí thuê mặt bằng.',
    conditions: [
      'Đã có quyết định mở điểm bán mới từ Ban Giám Đốc.',
      'Đã được phòng Kế toán Tổng hợp cấp mã Cost Center chuẩn trên phần mềm SAP.'
    ],
    steps: [
      'Bước 1 [1]: Tại màn hình Danh mục Điểm bán, nhấp vào nút [1] "+ Thêm Cửa Hàng SAP" ở góc trên bên phải (Xem Hình 2.2a).',
      'Bước 2 [2]: Drawer thêm mới mở ra; nhập [2] "Mã Cửa Hàng (Store Code)" theo quy chuẩn (ví dụ: `MC076`) (Xem Hình 2.2b).',
      'Bước 3 [3]: Điền [3] "Tên Cửa Hàng SAP" (ví dụ: `MC-145 Lê Văn Quới`) và chọn Thương Hiệu.',
      'Bước 4 [4]: Nhấn nút [4] "Lưu thông tin" ở chân Drawer để hoàn tất lưu trữ.'
    ],
    images: [
      {
        src: '/assets/user-guide/2026-09-contract-guide/ug-master-02-store-trigger.png',
        alt: 'Vị trí nút thêm cửa hàng mới trên danh sách',
        caption: 'Hình 2.2a: Vị trí nút Thao tác'
      },
      {
        src: '/assets/user-guide/2026-09-contract-guide/ug-master-02-stores-drawer.png',
        alt: 'Form Khai báo Cửa hàng SAP mới',
        caption: 'Hình 2.2b: Biểu mẫu Khai báo Điểm bán'
      }
    ],
    result: 'Cửa hàng mới xuất hiện ngay trên danh sách và có thể chọn trong danh mục khi lập hợp đồng thuê mặt bằng.',
    cautions: [
      'Mã Cost Center là trường định danh duy nhất, không được trùng với bất kỳ điểm bán nào khác.',
      'Kiểm tra kỹ khoảng trắng thừa khi sao chép mã từ Excel vào phần mềm.'
    ]
  }),
  createSection('master-vendors-list', '2.3. Danh mục Đối tác & Chủ nhà (CardCode) — Tra cứu', 'Phòng Kế toán (ACCOUNTANT)', {
    purpose: 'Quản lý danh sách các chủ nhà, đơn vị cho thuê và đối tác thụ hưởng tài chính, kiểm tra mã CardCode đối soát công nợ trên hệ thống SAP B1.',
    conditions: [
      'Truy cập phân hệ Dữ Liệu Nền Tảng với quyền Kế toán hoặc Quản trị viên.',
      'Cần tìm kiếm thông tin tài khoản ngân hàng của chủ nhà để kiểm tra chuyển khoản.'
    ],
    steps: [
      'Bước 1: Chuyển sang tab "Đối Tác / Chủ Nhà SAP" trong phân hệ Master Data.',
      'Bước 2 [1]: Nhập mã, tên hoặc MST vào ô tìm kiếm [1] ("Tìm mã, tên hoặc MST nhà cung cấp...").',
      'Bước 3 [2]: Kiểm tra cột [2] "Mã Đối Tác (CardCode)" để bảo đảm chủ nhà đã được đồng bộ với hệ thống kế toán công nợ.',
      'Bước 4 [3]: Nhấp vào nút [3] "+ Thêm Nhà Cung Cấp SAP" nếu cần khai báo đối tác mới.'
    ],
    images: [{
      src: '/assets/user-guide/2026-09-contract-guide/ug-master-03-vendors-list.png',
      alt: 'Danh mục Đối tác Chủ nhà SAP Maycha',
      caption: 'Hình 2.3: Danh mục Đối tác & Chủ nhà'
    }],
    result: 'Hiển thị đầy đủ thông tin chủ nhà: họ tên, mã số thuế/CCCD, mã CardCode SAP và thông tin tài khoản ngân hàng thụ hưởng.',
    cautions: [
      'Một chủ nhà có thể cho thuê nhiều mặt bằng khác nhau; cần kiểm tra kỹ CardCode để tránh liên kết nhầm.',
      'Nếu chủ nhà là tổ chức/doanh nghiệp, cần có thêm Mã Số Thuế hợp lệ để phục vụ kê khai chi phí được trừ khi tính thuế.'
    ]
  }),
  createSection('master-vendors-create', '2.4. Danh mục Đối tác & Chủ nhà — Khai báo Chủ nhà mới', 'Phòng Kế toán (ACCOUNTANT)', {
    purpose: 'Đăng ký thông tin chủ nhà hoặc người thụ hưởng mới vào danh mục hệ thống, thiết lập số tài khoản ngân hàng chính xác để phục vụ thanh toán tiền thuê định kỳ.',
    conditions: [
      'Đã có bản photo CCCD/MST và xác nhận thông tin tài khoản ngân hàng của chủ nhà.',
      'Đã được cấp mã CardCode đối tác từ hệ thống SAP B1.'
    ],
    steps: [
      'Bước 1 [1]: Tại danh sách đối tác, nhấp vào nút [1] "+ Thêm Nhà Cung Cấp SAP" ở góc phải (Xem Hình 2.4a).',
      'Bước 2 [2]: Khung trượt thêm đối tác mở ra; nhập [2] ô "Mã Nhà Cung Cấp" (mã CardCode trên SAP, ví dụ: `310285`) (Xem Hình 2.4b).',
      'Bước 3 [3]: Nhập [3] "Tên Nhà Cung Cấp / Chủ Nhà" theo đúng giấy tờ pháp lý.',
      'Bước 4 [4]: Nhập [4] "Mã Số Thuế (MST)" nếu là doanh nghiệp hoặc hộ kinh doanh.',
      'Bước 5 [5]: Nhấn nút [5] "Lưu thông tin" ở chân khung trượt để hoàn tất lưu đối tác.'
    ],
    images: [
      {
        src: '/assets/user-guide/2026-09-contract-guide/ug-master-04-vendor-trigger.png',
        alt: 'Vị trí nút thêm đối tác chủ nhà mới',
        caption: 'Hình 2.4a: Vị trí nút Thao tác'
      },
      {
        src: '/assets/user-guide/2026-09-contract-guide/ug-master-04-vendors-drawer.png',
        alt: 'Form Khai báo Đối tác Chủ nhà mới',
        caption: 'Hình 2.4b: Biểu mẫu Khai báo Chủ nhà'
      }
    ],
    result: 'Thông tin chủ nhà mới được lưu thành công, sẵn sàng để chọn làm đối tác thụ hưởng trong các hợp đồng thuê mặt bằng.',
    cautions: [
      'Tên chủ tài khoản nhận tiền nên trùng khớp với người ký hợp đồng; trường hợp chuyển khoản cho người được ủy quyền, bạn nhớ đính kèm Giấy Ủy Quyền vào hồ sơ để kế toán đối chiếu.',
      'Số tài khoản ngân hàng cần được kiểm tra kỹ lưỡng từng chữ số để tránh rủi ro chuyển tiền nhầm.'
    ]
  }),

  // =========================================================================
  // CHƯƠNG 3
  // =========================================================================
  {
    id: 'chapter-3-intake-ocr',
    title: 'Chương 3. Tiếp nhận Hợp đồng & AI OCR',
    level: 1,
    role: 'SITE',
    blocks: [
      {
        type: 'paragraph',
        text: 'Trạm Tiếp Nhận AI OCR là công nghệ bóc tách dữ liệu tự động, cho phép chuyển đổi file PDF hoặc ảnh chụp hợp đồng scan thành dữ liệu số có cấu trúc chỉ trong vài giây. Chuyên viên mặt bằng không cần gõ tay toàn bộ nội dung mà chỉ cần đối chiếu, kiểm chứng song song văn bản gốc với kết quả trích xuất.',
      },
      {
        type: 'label',
        text: 'Quy trình Tiếp nhận 3 Bước Chuẩn hóa',
      },
      {
        type: 'bullets',
        items: [
          'Bước 1 - Tải lên: Hỗ trợ kéo thả file PDF hoặc ảnh scan dung lượng tối đa 50MB.',
          'Bước 2 - Trích xuất AI: Máy quét thông minh tự động nhận diện các thực thể: Bên A, Bên B, địa chỉ, diện tích, giá thuê, chu kỳ thanh toán và tiền cọc.',
          'Bước 3 - Rà soát Song song: Màn hình chia đôi cho phép đối chiếu văn bản scan bên trái và form dữ liệu bên phải trước khi bấm Lưu.'
        ]
      }
    ]
  },
  createSection('ocr-upload-zone', '3.1. Tải lên Hồ sơ Quét Hợp đồng Thuê', 'Phòng Phát triển Mặt bằng (SITE)', {
    purpose: 'Tải tệp tin số hóa hợp đồng thuê (PDF hoặc ảnh chụp scan) lên hệ thống để chuẩn bị cho tiến trình bóc tách dữ liệu tự động bằng trí tuệ nhân tạo.',
    conditions: [
      'Đã có file scan hợp đồng thuê hoàn chỉnh (đầy đủ chữ ký, con dấu của 2 bên).',
      'Định dạng tệp được hỗ trợ: PDF, PNG, JPG; kích thước tệp không quá 50MB.'
    ],
    steps: [
      'Bước 1: Chọn mục "Tiếp Nhận AI OCR" trên menu điều hướng bên trái.',
      'Bước 2 [1]: Kéo và thả file PDF hợp đồng vào vùng nét đứt [1] để hệ thống tự động nhận diện tệp.',
      'Bước 3 [2]: Hoặc nhấp vào nút [2] "Tải tệp từ máy tính" để chọn file từ thư mục thiết bị.',
      'Bước 4 [3]: Nếu không có bản scan hoặc muốn nhập liệu trực tiếp, nhấp vào liên kết [3] "Tạo thủ công không thông qua quét AI" để mở form tạo hợp đồng mới.'
    ],
    images: [{
      src: '/assets/user-guide/2026-09-contract-guide/ug-ocr-01-upload-zone.png',
      alt: 'Vùng tải lên tệp quét hợp đồng AI OCR',
      caption: 'Hình 3.1: Vùng tiếp nhận tài liệu'
    }],
    result: 'Hệ thống tiếp nhận file tải lên, tự động khởi tạo tiến trình phân tích văn bản và hiển thị thanh tiến độ xử lý.',
    cautions: [
      'Bản scan cần rõ nét, không bị lóa sáng, mất góc hoặc quá mờ để AI đạt độ chính xác bóc tách cao nhất.',
      'Nên chọn bản scan từ văn bản đã có chữ ký chính thức của hai bên để dữ liệu bóc tách được chuẩn xác và có giá trị pháp lý.'
    ]
  }),
  createSection('ocr-scanning-progress', '3.2. Tiến trình Bóc tách Dữ liệu AI & Kiểm tra Độ tin cậy', 'Phòng Phát triển Mặt bằng (SITE)', {
    purpose: 'Theo dõi tiến trình phân tích tài liệu của trí tuệ nhân tạo và kiểm tra chỉ số độ tin cậy trích xuất đối với từng trường dữ liệu pháp lý và tài chính.',
    conditions: [
      'Đã tải file hợp đồng thành công và tiến trình quét AI đang chạy.',
      'Giữ kết nối mạng ổn định trong suốt thời gian bóc tách.'
    ],
    steps: [
      'Bước 1 [1]: Quan sát thanh tiến trình quét AI [1] đang chạy phần trăm hoàn thành (thời gian mô hình xử lý từ 45 - 88 giây).',
      'Bước 2 [2]: Theo dõi dòng mô tả trạng thái trích xuất cấu trúc văn bản [2] ở ngay bên dưới.',
      'Bước 3 [3]: Nếu tải nhầm tệp hoặc muốn dừng tiến trình, nhấp vào nút [3] "Hủy quét" ở cuối khung thông báo.',
      'Bước 4: Khi tiến trình quét hoàn tất 100%, hệ thống sẽ tự động chuyển tiếp sang màn hình Rà Soát Dữ Liệu.'
    ],
    images: [{
      src: '/assets/user-guide/2026-09-contract-guide/ug-ocr-02-scanning-progress.png',
      alt: 'Tiến trình trích xuất AI OCR Maycha',
      caption: 'Hình 3.2: Tiến trình trích xuất AI'
    }],
    result: 'Dữ liệu thô trong văn bản scan được trích xuất thành các trường thông tin cụ thể, phân nhóm theo thông tin mặt bằng, chủ nhà và điều khoản tài chính.',
    cautions: [
      'Nếu Điểm tin cậy dưới 80%, hệ thống sẽ gắn nhãn cảnh báo màu vàng; chuyên viên cần kiểm tra kỹ từng số liệu ở bước tiếp theo.',
      'Không tắt tab trình duyệt hoặc làm mới trang trong lúc thanh tiến trình đang chạy.'
    ]
  }),
  createSection('ocr-side-by-side-review', '3.3. Rà soát Dữ liệu Quét & Lưu Hồ sơ Hợp đồng Mới', 'Phòng Phát triển Mặt bằng (SITE)', {
    purpose: 'Kiểm tra lại toàn bộ thông tin do máy quét AI tự động bóc tách từ văn bản scan gốc (Bên A, Bên B, địa chỉ mặt bằng, số tài khoản, giá thuê), chỉnh sửa các sai sót nếu có và chính thức lưu hồ sơ hợp đồng vào hệ thống Maycha.',
    conditions: [
      'Tiến trình quét AI đã hoàn tất và màn hình Rà Soát Dữ Liệu đang hiển thị.',
      'Chuyên viên có sẵn bản gốc hoặc tệp scan hợp đồng để đối chiếu từng điều khoản.'
    ],
    steps: [
      'Bước 1 [1]: Tại khung xem trước tài liệu ở phần trên màn hình (Xem Hình 3.3a), kiểm tra bản scan hợp đồng gốc [1] để đối chiếu câu chữ, số tiền và các điều khoản cam kết.',
      'Bước 2 [2]: Cuộn chuột xuống phần biểu mẫu bên dưới (Xem Hình 3.3b), kiểm tra khối [2] "1. THÔNG TIN PHÁP LÝ & MẶT BẰNG" gồm: Mã số hợp đồng, Tên điểm bán Maycha, Địa chỉ chi tiết và Diện tích sàn thuê.',
      'Bước 3 [3]: Tiếp tục kiểm tra khối [3] "2. CHỦ THỂ CHO THUÊ & TÀI KHOẢN THỤ HƯỞNG": Họ tên chủ nhà, Số CCCD / Mã số thuế và đặc biệt là Số tài khoản ngân hàng nhận tiền. Nhấp chuột trực tiếp vào ô để sửa lại nếu AI đọc chưa chuẩn.',
      'Bước 4 [4]: Cuộn xuống cuối trang kiểm tra bảng đơn giá thuê từng năm và nhấp nút [4] "Lưu & Khởi Tạo Hợp Đồng" (Xem Hình 3.3c) để chính thức ghi nhận hồ sơ vào hệ thống Maycha.'
    ],
    images: [
      {
        src: '/assets/user-guide/2026-09-contract-guide/ug-ocr-03-side-by-side-review.png',
        alt: 'Khung xem trước bản scan hợp đồng gốc',
        caption: 'Hình 3.3a: Khung Đối Chiếu Văn Bản'
      },
      {
        src: '/assets/user-guide/2026-09-contract-guide/ug-ocr-03b-form-review.png',
        alt: 'Biểu mẫu rà soát thông tin pháp lý và tài khoản chủ nhà',
        caption: 'Hình 3.3b: Biểu Mẫu Rà Soát Dữ Liệu'
      },
      {
        src: '/assets/user-guide/2026-09-contract-guide/ug-ocr-03c-form-submit.png',
        alt: 'Bảng giá thuê và nút lưu khởi tạo hợp đồng',
        caption: 'Hình 3.3c: Bảng Giá Thuê & Nút Hoàn Tất'
      }
    ],
    result: 'Hệ thống thông báo tạo hồ sơ thành công; hợp đồng xuất hiện ngay trên Danh Sách Hợp Đồng Toàn Chuỗi và tự động chuyển giao thông tin sang cho phòng Kế toán và Pháp lý theo dõi.',
    cautions: [
      'Mẹo nhỏ: Bạn nên kiểm tra kỹ số tài khoản và tên chủ tài khoản với hợp đồng gốc trước khi bấm Lưu, giúp các đợt chi tiền đầu kỳ luôn đến đúng người nhận.',
      'File scan gốc sẽ được tự động lưu trữ vĩnh viễn vào kho tài liệu của hợp đồng sau khi bấm Lưu, không cần tải lại thủ công.'
    ]
  }),

  // =========================================================================
  // CHƯƠNG 4
  // =========================================================================
  {
    id: 'chapter-4-contract-list',
    title: 'Chương 4. Danh sách & Bộ lọc Hợp đồng',
    level: 1,
    role: 'ALL',
    blocks: [
      {
        type: 'paragraph',
        text: 'Bảng điều khiển Quản lý Hợp đồng là trung tâm tra cứu của toàn bộ chuỗi Maycha. Nơi đây tập hợp toàn bộ hồ sơ thuê mặt bằng từ lúc ký kết, đang vận hành đến khi thanh lý, cung cấp bộ lọc đa chiều và công cụ thiết lập cảnh báo hạn sớm.',
      },
      {
        type: 'label',
        text: 'Quy chuẩn Nhận diện Trạng thái Hợp đồng',
      },
      {
        type: 'table',
        headers: ['Huy hiệu Trạng thái', 'Mã màu hiển thị', 'Ý nghĩa nghiệp vụ', 'Thao tác cho phép'],
        rows: [
          [
            'Đang Hiệu Lực (ACTIVE)',
            'Xanh lá cây (Green)',
            'Mặt bằng đang hoạt động bình thường, đang phát sinh kỳ thanh toán tiền thuê hàng tháng',
            'Sửa thông tin cơ bản, Lập phụ lục điều chỉnh, Khởi tạo thanh lý'
          ],
          [
            'Sắp Hết Hạn (EXPIRING_SOON)',
            'Vàng cam (Warning)',
            'Hợp đồng nằm trong ngưỡng cảnh báo hạn (dưới 90 ngày hoặc theo cấu hình)',
            'Ưu tiên đàm phán tái ký phụ lục gia hạn hoặc làm thủ tục trả mặt bằng'
          ],
          [
            'Đã Thanh Lý (TERMINATED)',
            'Đỏ xám (Danger/Gray)',
            'Hợp đồng đã kết thúc, đã bàn giao mặt bằng và quyết toán cọc',
            'Hồ sơ đóng băng vĩnh viễn, chỉ cho phép tra cứu lịch sử kiểm toán'
          ],
          [
            'Hết Hạn (EXPIRED)',
            'Xám tro (Gray)',
            'Hợp đồng đã qua ngày kết thúc nhưng chưa hoàn tất thủ tục thanh lý',
            'Cần lập biên bản thanh lý và quyết toán cọc để đóng hồ sơ'
          ]
        ]
      }
    ]
  },
  createSection('contract-list-console', '4.1. Danh sách Hợp đồng toàn chuỗi', 'Tất cả Phòng ban (ALL)', {
    purpose: 'Tra cứu tập trung toàn bộ danh sách hợp đồng thuê mặt bằng của hệ thống Maycha trên toàn quốc, theo dõi mã hợp đồng, tên điểm bán, thời hạn và số tiền thuê hàng tháng.',
    conditions: [
      'Đăng nhập với bất kỳ vai trò nào trong hệ thống (SITE, ACCOUNTANT, LEGAL, ADMIN).',
      'Cần tìm kiếm hoặc xem tổng quan tình trạng các điểm thuê.'
    ],
    steps: [
      'Bước 1 [1]: Chọn mục "Hợp Đồng Mặt Bằng" trên thanh menu để mở bảng điều khiển chính [1].',
      'Bước 2 [2]: Quan sát cột Mã Hợp Đồng và Tên Điểm Bán Maycha [2].',
      'Bước 3 [3]: Theo dõi cột Tiền Thuê Mỗi Tháng và Thời Hạn Hợp Đồng [3].',
      'Bước 4 [4]: Nhấp vào biểu tượng con mắt [4] ở cuối dòng để xem hồ sơ chi tiết của mặt bằng.'
    ],
    images: [{
      src: '/assets/user-guide/2026-09-contract-guide/ug-contract-01-list-console.png',
      alt: 'Danh sách Hợp đồng toàn chuỗi Maycha',
      caption: 'Hình 4.1: Bảng điều khiển Danh sách Hợp đồng'
    }],
    result: 'Hiển thị danh sách hợp đồng đầy đủ và mới nhất, hỗ trợ sắp xếp theo ngày hết hạn hoặc giá trị hợp đồng.',
    cautions: [
      'Người dùng chỉ nhìn thấy các nút hành động phù hợp với quyền hạn của phòng ban mình (ví dụ: nhân viên mặt bằng không thấy nút xuất SAP).',
      'Luôn kiểm tra kỹ mã hợp đồng trước khi thực hiện các thao tác phụ lục hay thanh lý.'
    ]
  }),
  createSection('contract-filter-active', '4.2. Bộ lọc đa chiều & Tìm kiếm Mặt bằng', 'Tất cả Phòng ban (ALL)', {
    purpose: 'Sử dụng bộ công cụ lọc thông minh để nhanh chóng thu hẹp danh sách theo Tỉnh/Thành phố, Trạng thái hồ sơ, Mức cảnh báo hạn hoặc tìm kiếm nhanh theo tên chủ nhà.',
    conditions: [
      'Đang ở trang Danh Sách Hợp Đồng Mặt Bằng.',
      'Cần tìm kiếm hồ sơ cụ thể trong hàng trăm điểm bán của chuỗi.'
    ],
    steps: [
      'Bước 1 [1]: Nhập từ khóa tìm kiếm (tên đường, mã cửa hàng, tên chủ nhà) vào ô tìm kiếm chính [1].',
      'Bước 2 [2]: Bấm vào dropdown "Trạng Thái" [2] để lọc riêng các hợp đồng Đang Hoạt Động (ACTIVE) hoặc Đã Thanh Lý.',
      'Bước 3 [3]: Bấm vào dropdown "Mức Cảnh Báo" [3] để lọc các hợp đồng sắp hết hạn trong 30, 90 ngày.',
      'Bước 4: Nhấn nút "Đặt Lại Bộ Lọc" nếu muốn quay về danh sách toàn bộ mặt bằng.'
    ],
    images: [{
      src: '/assets/user-guide/2026-09-contract-guide/ug-contract-02-filter-active.png',
      alt: 'Bộ lọc trạng thái hợp đồng thuê mặt bằng',
      caption: 'Hình 4.2: Bộ lọc Đa chiều'
    }],
    result: 'Danh sách hợp đồng được lọc ngay tức thì, đáp ứng chính xác tiêu chí tìm kiếm của người dùng.',
    cautions: [
      'Bộ lọc có tính năng kết hợp đồng thời (AND): nếu chọn vừa Thành phố vừa Cảnh báo hạn thì kết quả phải thỏa mãn cả hai.',
      'Kiểm tra xem bộ lọc có đang bị lưu từ phiên trước không nếu không thấy hợp đồng mình vừa tạo.'
    ]
  }),
  createSection('contract-status-badges', '4.3. Đọc hiểu Huy hiệu Trạng thái & Cảnh báo hạn', 'Tất cả Phòng ban (ALL)', {
    purpose: 'Hướng dẫn đọc hiểu chuẩn xác hệ thống huy hiệu trạng thái hồ sơ và mã màu cảnh báo hạn thời gian thực trên từng dòng hợp đồng.',
    conditions: [
      'Quan sát bảng danh sách hợp đồng tại cột "Trạng Thái" và cột "Cảnh Báo Hạn".'
    ],
    steps: [
      'Bước 1 [1]: Quan sát cột "Trạng Thái" [1] với các huy hiệu: Xanh (Đang hiệu lực - ACTIVE), Cam (Sắp hết hạn), Đỏ (Đã thanh lý - TERMINATED), Xám (Hết hạn - EXPIRED).',
      'Bước 2 [2]: Quan sát cột "Cảnh Báo Hạn" [2] có biểu tượng đồng hồ cát.',
      'Bước 3 [3]: Nhận biết mã màu cảnh báo theo số ngày còn lại [3]: Xanh lá (trên 180 ngày), Vàng (dưới 90 ngày), Đỏ (dưới 30 ngày).'
    ],
    images: [{
      src: '/assets/user-guide/2026-09-contract-guide/ug-contract-03-status-badges.png',
      alt: 'Huy hiệu Trạng thái và Cảnh báo hạn Hợp đồng',
      caption: 'Hình 4.3: Cận cảnh Cột Huy hiệu'
    }],
    result: 'Người dùng nhận biết ngay rủi ro thời hạn hợp đồng chỉ bằng cách nhìn lướt qua màu sắc huy hiệu.',
    cautions: [
      'Huy hiệu màu Đỏ đòi hỏi hành động khẩn cấp từ phòng Pháp lý và Mặt bằng để tránh vi phạm thời hạn thông báo trả nhà.',
      'Số ngày cảnh báo được tính toán tự động mỗi ngày dựa trên ngày kết thúc hợp đồng hoặc phụ lục gia hạn mới nhất.'
    ]
  }),
  createSection('contract-edit-drawer', '4.4. Chỉnh sửa Hồ sơ Hợp đồng (Khi chưa khóa tài chính)', 'Phòng Kế toán & Mặt bằng (ACCOUNTANT / SITE)', {
    purpose: 'Cập nhật, bổ sung các thông tin hành chính về mặt bằng, số giấy chứng nhận sở hữu, thông tin liên hệ chủ nhà hoặc thời gian ân hạn đối với hợp đồng đang trong giai đoạn chuẩn bị và chưa bị khóa điều khoản tài chính.',
    conditions: [
      'Hợp đồng đang ở trạng thái Hoạt động (ACTIVE) nhưng CHƯA phát sinh kỳ thanh toán và chưa xuất SAP (chưa bị khóa tài chính).',
      'Có quyết định cập nhật thông tin bổ sung từ phòng Mặt Bằng hoặc Kế Toán.'
    ],
    steps: [
      'Bước 1 [1]: Mở trang Chi tiết hợp đồng cần cập nhật, nhấp nút [1] "Sửa thông tin" ở góc trên bên phải (Xem Hình 4.4a).',
      'Bước 2 [2]: Khung Chỉnh Sửa mở ra; nhấp vào [2] 4 Tab chức năng: Mặt Bằng, Chủ Nhà, Vận Hành & Hạn, Master Data SAP (Xem Hình 4.4b).',
      'Bước 3 [3]: Tại tab "Mặt Bằng", cập nhật các trường [3] Tên điểm bán, Địa chỉ chi tiết, Diện tích sàn (m²) hoặc Số sổ hồng / GCN.',
      'Bước 4: Chuyển sang tab "Chủ Nhà" hoặc "Vận Hành" để cập nhật số điện thoại liên hệ hoặc ngày bàn giao thực tế.',
      'Bước 5 [4]: Nhấn nút [4] "Lưu Thay Đổi" ở chân Khung trượt để hoàn tất cập nhật.'
    ],
    images: [
      {
        src: '/assets/user-guide/2026-09-contract-guide/ug-contract-05-edit-trigger.png',
        alt: 'Vị trí nút Sửa thông tin trên trang chi tiết hợp đồng',
        caption: 'Hình 4.4a: Vị trí nút Thao tác'
      },
      {
        src: '/assets/user-guide/2026-09-contract-guide/ug-contract-05-edit-drawer.png',
        alt: 'Khung Chỉnh Sửa Hồ Sơ Hợp Đồng',
        caption: 'Hình 4.4b: Khung Chỉnh Sửa Hợp Đồng'
      }
    ],
    result: 'Thông tin hợp đồng được cập nhật mới nhất, hiển thị ngay trên bảng tổng quan và ghi nhận một bản ghi UPDATE vào lịch sử kiểm toán.',
    cautions: [
      'Số hợp đồng là mã định danh pháp lý cố định, hệ thống không cho phép sửa đổi để đảm bảo tính toàn vẹn.',
      'Khi hợp đồng đã phát sinh thanh toán, các ô tài khoản và tiền thuê sẽ tự động đóng băng (Mục 6.4); nếu cần thay đổi, bạn bấm nút Lập Phụ Lục Hợp Đồng để tạo điều chỉnh hợp lệ.'
    ]
  }),

  // =========================================================================
  // CHƯƠNG 5
  // =========================================================================
  {
    id: 'chapter-5-legal-dossier',
    title: 'Chương 5. Hồ sơ Pháp lý & Tài liệu',
    level: 1,
    role: 'LEGAL',
    blocks: [
      {
        type: 'paragraph',
        text: 'Chi tiết hợp đồng là trung tâm lưu trữ toàn bộ hồ sơ pháp lý, tài liệu số hóa đính kèm và chuỗi nhật ký kiểm toán bất biến. Nơi đây cung cấp thước đo sức khỏe hồ sơ (Health Banner) giúp phòng Pháp chế kiểm soát rủi ro tính toàn vẹn của mặt bằng thuê.',
      },
      {
        type: 'label',
        text: 'Các Danh mục Tài liệu Bắt buộc của Hồ sơ Mặt bằng',
      },
      {
        type: 'bullets',
        items: [
          'Hợp đồng thuê gốc: Bản scan PDF đầy đủ chữ ký, con dấu của hai bên.',
          'Giấy tờ pháp lý chủ quyền: Sổ hồng, Giấy chứng nhận quyền sử dụng đất, Giấy phép xây dựng điểm bán.',
          'Giấy tờ pháp nhân / Nhân thân: CCCD chủ nhà hoặc Giấy chứng nhận Đăng ký Doanh nghiệp bên cho thuê.',
          'Biên bản bàn giao hiện trạng: Xác nhận hiện trạng cơ sở vật chất, chỉ số điện nước khi nhận mặt bằng.'
        ]
      }
    ]
  },
  createSection('detail-legal-overview', '5.1. Tab Hồ sơ Pháp lý & Thước đo Sức khỏe Mặt bằng', 'Tất cả Phòng ban (ALL)', {
    purpose: 'Xem tổng quan thông tin pháp lý của hợp đồng thuê và kiểm tra Thước đo Sức khỏe Hồ sơ (Health Banner) để biết hồ sơ đã đầy đủ chứng từ hay còn thiếu sót.',
    conditions: [
      'Đang mở trang Chi Tiết Hợp Đồng.',
      'Mặc định hệ thống hiển thị tab đầu tiên là tab "Hồ Sơ Pháp Lý".'
    ],
    steps: [
      'Bước 1: Quan sát thanh Thước đo Sức khỏe Hồ sơ (Health Banner) ở đầu trang: Màu xanh lá cây nếu hồ sơ đầy đủ 100%, màu vàng nếu còn thiếu tài liệu scan.',
      'Bước 2: Kiểm tra khối thông tin Bên A (Chủ nhà): Họ tên, số CCCD/MST, địa chỉ liên hệ và số điện thoại.',
      'Bước 3: Kiểm tra khối thời hạn thuê và thời gian ân hạn sửa chữa mặt bằng.',
      'Bước 4: Kiểm tra khối thông tin Bên B (Bên thuê): Pháp nhân Maycha đứng tên ký hợp đồng.'
    ],
    images: [{
      src: '/assets/user-guide/2026-09-contract-guide/ug-detail-01-legal-overview.png',
      alt: 'Tổng quan Tab Hồ sơ Pháp lý và Thước đo Sức khỏe Mặt bằng',
      caption: 'Hình 5.1: Tab Hồ sơ Pháp lý & Thước đo Sức khỏe Mặt bằng'
    }],
    result: 'Nắm bắt đầy đủ tình trạng pháp lý của hợp đồng và các đầu mục hồ sơ còn thiếu cần đốc thúc bổ sung.',
    cautions: [
      'Nếu Health Banner báo màu vàng (thiếu chứng từ), phòng Mặt Bằng cần nhanh chóng liên hệ chủ nhà để thu thập bổ sung.',
      'Mọi thông tin trong tab này được dùng làm căn cứ giải quyết tranh chấp pháp lý nếu có.'
    ]
  }),
  createSection('detail-documents-section', '5.2. Quản lý Bản Scan Hợp đồng Gốc & Tải lên Chứng từ', 'Phòng Pháp lý & Mặt bằng (LEGAL / SITE)', {
    purpose: 'Quản lý kho tệp đính kèm số hóa của hợp đồng: tải lên bản scan hợp đồng công chứng, phụ lục bổ sung, biên bản bàn giao và tải về khi cần đối chiếu.',
    conditions: [
      'Tài khoản có quyền quản lý tài liệu đính kèm (LEGAL, SITE, ACCOUNTANT).',
      'Có file chứng từ scan định dạng PDF hoặc ảnh chất lượng cao.'
    ],
    steps: [
      'Bước 1 [1]: Tại trang chi tiết hợp đồng, cuộn xuống khu vực Bảng Tài Liệu Đính Kèm [1].',
      'Bước 2 [2]: Nhấp vào nút [2] "+ Tải Lên Tài Liệu Mới" để mở hộp thoại tải file.',
      'Bước 3: Chọn Loại Tài Liệu (Hợp đồng gốc, Giấy tờ chủ quyền, Giấy ủy quyền) và chọn tệp tin từ máy tính.',
      'Bước 4 [3]: Sau khi tải lên, sử dụng cột Thao tác [3] để xem trước hoặc tải tệp về máy tính.'
    ],
    images: [{
      src: '/assets/user-guide/2026-09-contract-guide/ug-detail-02-documents-section.png',
      alt: 'Danh sách Tài liệu đính kèm Hợp đồng',
      caption: 'Hình 5.2: Khu vực Tài liệu Đính kèm'
    }],
    result: 'Tài liệu được mã hóa và lưu trữ an toàn trên kho lưu trữ đám mây của Maycha, cho phép truy cập mọi lúc mọi nơi.',
    cautions: [
      'Tên file tải lên nên đặt rõ ràng không dấu (ví dụ: `HD-45-VANKIEP-SCAN-GOC.pdf`) để tiện tra cứu.',
      'Các văn bản scan hợp đồng gốc đã thẩm định được hệ thống bảo toàn lâu dài; nếu có bản sửa đổi mới, bạn nên tải lên dưới dạng phụ lục bổ sung.'
    ]
  }),
  createSection('detail-pdf-preview', '5.3. Trình Đọc và Xem trước Tài liệu PDF Trực quan', 'Tất cả Phòng ban (ALL)', {
    purpose: 'Đọc và đối soát văn bản scan hợp đồng trực tiếp trên trình duyệt web thông qua modal xem trước, không cần tải file về máy tính cá nhân.',
    conditions: [
      'Hợp đồng đã có tệp đính kèm định dạng PDF trong bảng "Hồ Sơ & Chứng Từ Pháp Lý".',
      'Cần đọc và kiểm chứng nội dung chi tiết điều khoản hợp đồng gốc.'
    ],
    steps: [
      'Bước 1 [1]: Trong bảng "Hồ Sơ & Chứng Từ Pháp Lý", tìm dòng tài liệu PDF cần đọc và nhấp vào nút [1] "Xem" (biểu tượng con mắt) ở cột Thao tác (Xem Hình 5.3a).',
      'Bước 2 [2]: Cửa sổ xem trước PDF mở lên toàn màn hình; đọc và đối soát nội dung trực tiếp tại khung hiển thị văn bản [2] (Xem Hình 5.3b).',
      'Bước 3: Sử dụng các công cụ phóng to, thu nhỏ hoặc chuyển trang để kiểm tra từng điều khoản.',
      'Bước 4 [3]: Nhấn nút [3] "✕ Đóng" ở góc trên bên phải hoặc nhấn phím Escape để quay lại trang hồ sơ hợp đồng.'
    ],
    images: [
      {
        src: '/assets/user-guide/2026-09-contract-guide/ug-detail-03-pdf-trigger.png',
        alt: 'Vị trí nút Xem PDF trên bảng tài liệu',
        caption: 'Hình 5.3a: Vị trí nút Thao tác'
      },
      {
        src: '/assets/user-guide/2026-09-contract-guide/ug-detail-03-pdf-preview-modal.png',
        alt: 'Modal Xem trước Tài liệu PDF trực quan',
        caption: 'Hình 5.3b: Trình Xem PDF Trực quan'
      }
    ],
    result: 'Hỗ trợ việc thẩm định và tra cứu điều khoản diễn ra nhanh chóng, tăng tính bảo mật do không phải lưu file nhạy cảm ở máy cá nhân.',
    cautions: [
      'Nếu trình duyệt chặn mở tệp, kiểm tra xem có đang bật tính năng chặn cửa sổ pop-up không.',
      'Tài liệu scan nhiều trang có thể mất 1-2 giây để tải hết các trang nét cao.'
    ]
  }),
  createSection('detail-audit-tab', '5.4. Lịch sử Biến động & Nhật ký Kiểm toán Hợp đồng (Audit Trail)', 'Tất cả Phòng ban (ALL)', {
    purpose: 'Theo dõi chuỗi lưu vết lịch sử bất biến của hợp đồng: ai đã tạo, ai đã sửa đổi thông tin, ai lập phụ lục và ai xuất bút toán SAP, bảo đảm tính minh bạch tuyệt đối.',
    conditions: [
      'Truy cập trang Chi Tiết Hợp Đồng với bất kỳ vai trò nào.',
      'Cần kiểm tra nguồn gốc của một sự thay đổi dữ liệu.'
    ],
    steps: [
      'Bước 1: Tại thanh tab chi tiết hợp đồng, nhấp vào tab "Lịch Sử & Kiểm Toán".',
      'Bước 2 [1]: Quan sát Dòng thời gian Timeline [1] sắp xếp sự kiện mới nhất ở trên cùng.',
      'Bước 3 [2]: Đọc chi tiết Tên sự kiện và Người thực hiện [2] (ví dụ: `UPDATE`, `CREATE`, `EXPORT_SAP`).',
      'Bước 4 [3]: Kiểm tra Thời điểm chính xác và Dấu vết bất biến [3] ghi nhận trên hệ thống.'
    ],
    images: [{
      src: '/assets/user-guide/2026-09-contract-guide/ug-detail-04-audit-tab.png',
      alt: 'Tab Lịch sử và Kiểm toán Hợp đồng Maycha',
      caption: 'Hình 5.4: Tab Lịch Sử & Kiểm Toán'
    }],
    result: 'Mọi hành vi can thiệp vào hợp đồng đều được lưu vết vĩnh viễn, không thể xóa bỏ hoặc làm sai lệch.',
    cautions: [
      'Nhật ký kiểm toán là bằng chứng pháp lý quan trọng khi có tranh chấp nội bộ hoặc kiểm toán thuế.',
      'Hệ thống tự động ghi nhận địa chỉ IP và mã nhân viên tương ứng với từng thao tác.'
    ]
  }),

  // =========================================================================
  // CHƯƠNG 6
  // =========================================================================
  {
    id: 'chapter-6-finance-sap',
    title: 'Chương 6. Tài chính & Hạch toán SAP',
    level: 1,
    role: 'ACCOUNTANT',
    blocks: [
      {
        type: 'paragraph',
        text: 'Phân hệ Tài chính & Hạch toán SAP là trái tim kế toán của hợp đồng thuê mặt bằng Maycha. Tại đây, kế toán kiểm soát các đợt chi trả tiền thuê, đối soát mã Cost Center và CardCode, đồng thời kích hoạt cơ chế khóa tài chính để đóng băng dữ liệu sau khi đã hạch toán kế toán.',
      },
      {
        type: 'label',
        text: 'Nguyên tắc Khóa Điều khoản Tài chính (Financial Lock)',
      },
      {
        type: 'bullets',
        items: [
          'Hợp đồng sau khi tạo quá 7 ngày hoặc đã phát sinh ít nhất một kỳ thanh toán/xuất SAP sẽ tự động kích hoạt chế độ KHÓA TÀI CHÍNH.',
          'Khi đã khóa, toàn bộ trường thông tin tiền tệ (Giá thuê, Tiền cọc, Chu kỳ thanh toán, Tài khoản ngân hàng) chuyển sang chế độ CHỈ ĐỌC.',
          'Mọi thay đổi liên quan đến số tiền thuê hoặc số tài khoản nhận tiền được thực hiện qua việc lập Phụ Lục Hợp Đồng chính thức (Chương 7) để bảo đảm tính pháp lý.'
        ]
      }
    ]
  },
  createSection('finance-sap-section', '6.1. Bút toán SAP của Hợp đồng', 'Phòng Kế toán (ACCOUNTANT)', {
    purpose: 'Kiểm tra tình trạng khớp nối kế toán của hợp đồng với hệ thống ERP SAP B1, theo dõi mã Cost Center cửa hàng và mã CardCode chủ nhà đã gán.',
    conditions: [
      'Đang mở trang Chi Tiết Hợp Đồng, nhấp chuyển sang tab "Tài Chính".',
      'Hợp đồng đã có thông tin về mặt bằng và chủ nhà.'
    ],
    steps: [
      'Bước 1 [1]: Tại tab Tài Chính, quan sát khối "Trạng Thái Khớp Nối SAP B1" [1] ở đầu tab.',
      'Bước 2 [2]: Kiểm tra Điểm Bán Maycha liên kết với [2] Mã Cost Center điểm bán.',
      'Bước 3 [3]: Kiểm tra Đối Tác Cho Thuê liên kết với [3] Mã CardCode chủ nhà trên SAP.',
      'Bước 4: Kiểm tra huy hiệu tích xanh xác nhận đã sẵn sàng cho việc xuất bút toán tự động.'
    ],
    images: [{
      src: '/assets/user-guide/2026-09-contract-guide/ug-finance-01-sap-section.png',
      alt: 'Trạng thái khớp nối Master Data SAP B1',
      caption: 'Hình 6.1: Khối Trạng thái Khớp nối SAP B1'
    }],
    result: 'Kế toán xác nhận hợp đồng đã đủ điều kiện hạch toán tự động sang hệ thống SAP B1.',
    cautions: [
      'Nếu khối SAP hiển thị cảnh báo đỏ "Chưa ánh xạ", hợp đồng sẽ bị chặn xuất bút toán kế toán.',
      'Cần đối soát kỹ mã điểm bán với danh sách chi nhánh thực tế trước khi xác nhận ánh xạ.'
    ]
  }),
  createSection('finance-schedules-section', '6.2. Lịch thanh toán của Hợp đồng', 'Phòng Kế toán (ACCOUNTANT)', {
    purpose: 'Đọc hiểu và theo dõi chi tiết toàn bộ các kỳ thanh toán tiền thuê mặt bằng từ ngày đầu tiên đến khi kết thúc hợp đồng, kiểm tra số tiền gốc, thuế nộp thay và trạng thái chi trả.',
    conditions: [
      'Hợp đồng đã được duyệt bảng giá thuê và chu kỳ thanh toán (hàng tháng, hàng quý).',
      'Đang mở tab Tài Chính của hợp đồng.'
    ],
    steps: [
      'Bước 1 [1]: Cuộn xuống Bảng Lịch Thanh Toán Chi Tiết [1] trong tab Tài Chính.',
      'Bước 2 [2]: Kiểm tra cột Tiền Thuê Gốc và Cột Thuế Nộp Thay [2] được tính toán tự động.',
      'Bước 3 [3]: Kiểm tra Cột Trạng Thái Hạch Toán [3]: Chưa Xuất, Đã Xuất SAP, hoặc Đã Thanh Toán.',
      'Bước 4: Đối chiếu ngày hạn chót thanh toán để lên kế hoạch chuyển tiền đúng hạn cho chủ nhà.'
    ],
    images: [{
      src: '/assets/user-guide/2026-09-contract-guide/ug-finance-02-schedules-section.png',
      alt: 'Bảng Lịch thanh toán chi tiết của Hợp đồng',
      caption: 'Hình 6.2: Bảng Lịch Thanh Toán của Hợp Đồng'
    }],
    result: 'Kế toán nắm bắt đầy đủ lịch trình chi tiền thuê của từng mặt bằng để chuẩn bị dòng tiền và đối soát công nợ.',
    cautions: [
      'Số tiền lẻ ở đợt đầu hoặc đợt cuối do ngày nhận mặt bằng lẻ tháng đã được hệ thống tính toán chính xác theo số ngày thực tế.',
      'Kỳ đã gắn nhãn "Đã Xuất SAP" được hệ thống giữ nguyên để đối chiếu với phần mềm kế toán; nếu cần thay đổi, bạn hãy lập phụ lục điều chỉnh hợp lệ.'
    ],
    extraBlocks: [
      { type: 'label', text: '📋 Thẻ Nghiệp vụ SC-04 — Tính tiền lẻ đầu/cuối kỳ (Case 92B Hậu Giang)' },
      { type: 'paragraph', text: 'Khi nhận mặt bằng giữa tháng, kỳ đầu và kỳ cuối không đủ 30 ngày nên tiền thuê được tính theo số ngày thực tế: Tiền kỳ lẻ = (Giá thuê tháng ÷ số ngày thực tế của tháng đó) × số ngày thuê trong kỳ. Hệ thống tự tính, bạn chỉ cần đối chiếu.' },
      {
        type: 'table',
        headers: ['Kỳ', 'Số ngày tính', 'Cách hiểu', 'Số tiền'],
        rows: [
          ['Kỳ đầu (lẻ)', 'Từ ngày nhận mặt bằng đến hết tháng', 'Chỉ tính số ngày thực sự thuê trong tháng đầu', '3.677.419đ'],
          ['Các kỳ giữa', 'Trọn tháng', 'Bằng đúng giá thuê tháng', 'Theo đơn giá hợp đồng'],
          ['Kỳ cuối (lẻ)', 'Từ đầu tháng đến ngày trả mặt bằng', 'Chỉ tính số ngày thực sự thuê ở tháng cuối', '12.193.548đ'],
        ],
      },
      { type: 'paragraph', text: 'Mẹo hay: nếu con số lẻ trông "khác thường", đừng sửa tay — hãy đếm lại số ngày thực tế của tháng (28/29/30/31 ngày) rồi nhân lại; gần như luôn khớp với hệ thống.' },
    ]
  }),
  createSection('finance-sap-mapping', '6.3. Cấu hình Ánh xạ Kế toán SAP B1', 'Phòng Kế toán (ACCOUNTANT)', {
    purpose: 'Thực hiện thao tác liên kết hợp đồng thuê mặt bằng với đúng mã Điểm Bán (Cost Center) và mã Đối Tác (CardCode) trong danh mục Master Data SAP B1.',
    conditions: [
      'Tài khoản thuộc Phòng Kế toán có quyền cấu hình kế toán (ACCOUNTANT).',
      'Đã khai báo mã Cửa hàng và mã Chủ nhà trên hệ thống Master Data (Chương 2).'
    ],
    steps: [
      'Bước 1 [1]: Tại tab Tài Chính, nhấp vào nút [1] "Cấu Hình Ánh Xạ SAP" (Xem Hình 6.3a).',
      'Bước 2 [2]: Drawer Ánh Xạ SAP mở ra; tại ô [2] "Điểm Bán Maycha", chọn đúng cửa hàng phụ trách mặt bằng này (Xem Hình 6.3b).',
      'Bước 3 [3]: Tại ô [3] "Đối Tác / Chủ Nhà", chọn đúng tên chủ nhà hoặc người nhận tiền thanh toán.',
      'Bước 4 [4]: Nhấn nút [4] "Lưu Ánh Xạ" để hoàn tất việc liên kết dữ liệu kế toán.'
    ],
    images: [
      {
        src: '/assets/user-guide/2026-09-contract-guide/ug-finance-03-mapping-trigger.png',
        alt: 'Vị trí nút cấu hình ánh xạ SAP trong tab Tài chính',
        caption: 'Hình 6.3a: Vị trí nút Thao tác'
      },
      {
        src: '/assets/user-guide/2026-09-contract-guide/ug-finance-03-sap-mapping-drawer.png',
        alt: 'Drawer Cấu hình Ánh xạ Master Data SAP B1',
        caption: 'Hình 6.3b: Drawer Ánh xạ SAP B1'
      }
    ],
    result: 'Hợp đồng được khớp nối thành công với phần mềm SAP, các đợt thanh toán sẽ tự động nhận diện mã hạch toán khi xuất file.',
    cautions: [
      'Hãy đối chiếu kỹ mã quán trước khi lưu: chọn đúng mã giúp báo cáo lãi/lỗ từng chi nhánh luôn chính xác, tránh phải truy ngược sửa sổ về sau.',
      'Nếu chủ nhà đổi người thụ hưởng, cần lập phụ lục đổi thụ hưởng thay vì chỉ sửa ánh xạ tại đây.'
    ]
  }),
  createSection('finance-locked-banner', '6.4. Quy tắc Khóa Điều khoản Tài chính', 'Phòng Kế toán (ACCOUNTANT)', {
    purpose: 'Giải thích cơ chế bảo vệ dữ liệu kế toán tự động: đóng băng chỉ đọc các trường tiền tệ và tài khoản ngân hàng sau khi hợp đồng đã phát sinh thanh toán, ngăn ngừa rủi ro sửa sai lệch số liệu.',
    conditions: [
      'Hợp đồng đã quá 7 ngày kể từ ngày ký hoặc đã có đợt thanh toán được xuất sang SAP.',
      'Người dùng mở Drawer Chỉnh sửa thông tin hợp đồng.'
    ],
    steps: [
      'Bước 1 [1]: Quan sát Banner Cảnh Báo Màu Vàng [1] hiện lên đầu khung trượt bên phải: "Thông tin tài khoản & chủ nhà đã khóa chỉ đọc".',
      'Bước 2 [3]: Kiểm tra các trường Số tài khoản ngân hàng, Tên người thụ hưởng, Ngân hàng và Giá thuê [3] đều có nền xám (chỉ đọc).',
      'Bước 3 [2]: Nếu cần thay đổi tài khoản nhận tiền hoặc đơn giá thuê, nhấp vào nút [2] "[+] Lập Phụ Lục Hợp Đồng" nằm ngay trên banner.',
      'Bước 4: Đóng khung trượt bên phải và chuyển sang quy trình Lập Phụ Lục chính thức (xem Chương 7).'
    ],
    images: [{
      src: '/assets/user-guide/2026-09-contract-guide/ug-finance-04-locked-banner.png',
      alt: 'Banner Khóa Điều khoản Tài chính Maycha',
      caption: 'Hình 6.4: Cơ chế Khóa Tài Chính'
    }],
    result: 'Bảo vệ toàn vẹn số liệu tài chính đã hạch toán, buộc mọi biến động tiền bạc phải có hồ sơ phụ lục pháp lý kèm theo.',
    cautions: [
      'Bạn không cần can thiệp để mở khóa tài chính — cơ chế khóa tự động bảo vệ số liệu giữa Maycha và SAP B1 luôn khớp đúng.',
      'Banner khóa chính là "người bảo vệ" cho bạn: giúp số liệu đã chốt luôn an toàn và có bằng chứng rõ ràng khi cần đối soát.'
    ]
  }),

  // =========================================================================
  // CHƯƠNG 7
  // =========================================================================
  {
    id: 'chapter-7-addendum',
    title: 'Chương 7. Phụ lục Điều chỉnh',
    level: 1,
    role: 'ACCOUNTANT',
    blocks: [
      {
        type: 'paragraph',
        text: 'Phụ lục hợp đồng là công cụ pháp lý duy nhất để điều chỉnh các điều khoản tài chính đã bị khóa. Hệ thống Maycha hỗ trợ 2 nghiệp vụ phụ lục trọng yếu: Thay đổi thông tin thụ hưởng (số tài khoản ngân hàng) và Điều chỉnh bậc thang giá thuê / hỗ trợ giảm giá, kèm theo bảng đối soát chênh lệch lịch thanh toán (Diff Schedule Preview).',
      },
      {
        type: 'label',
        text: 'Hai Loại Phụ Lục Nghiệp Vụ Chuẩn Hóa',
      },
      {
        type: 'bullets',
        items: [
          'Phụ lục Loại 1 - Đổi Tài Khoản Thụ Hưởng: Áp dụng khi chủ nhà đổi số tài khoản ngân hàng, thay đổi người đại diện nhận tiền hoặc ủy quyền cho bên thứ ba.',
          'Phụ lục Loại 2 - Điều Chỉnh Giá Thuê & Miễn Giảm: Áp dụng khi tăng/giảm giá thuê theo lộ trình hợp đồng, hoặc hỗ trợ giảm tiền nhà trong giai đoạn sửa chữa, thiên tai, dịch bệnh.'
        ]
      }
    ]
  },
  createSection('addendum-drawer-init', '7.1. Khởi tạo Phụ lục & Chọn loại điều chỉnh', 'Phòng Kế toán (ACCOUNTANT)', {
    purpose: 'Mở Drawer Lập Phụ Lục Hợp Đồng, khai báo số phụ lục, ngày hiệu lực và lựa chọn đúng phân loại nghiệp vụ cần điều chỉnh.',
    conditions: [
      'Hợp đồng đang ở trạng thái Hoạt Động (ACTIVE).',
      'Đã có văn bản thỏa thuận phụ lục hợp đồng được hai bên ký duyệt chính thức.'
    ],
    steps: [
      'Bước 1 [1]: Tại trang Chi tiết hợp đồng, nhấp vào nút [1] "+ Lập Phụ Lục Hợp Đồng" ở góc trên bên phải (Xem Hình 7.1a).',
      'Bước 2 [2]: Drawer Lập Phụ Lục mở ra; chọn [2] Loại Phụ Lục: "Thay đổi thông tin thụ hưởng" hoặc "Điều chỉnh giá thuê & hỗ trợ" (Xem Hình 7.1b).',
      'Bước 3 [3]: Điền [3] Số Phụ Lục pháp lý (ví dụ: `PL-01/HDTN-45-2026`) và chọn Ngày Bắt Đầu Áp Dụng.',
      'Bước 4 [4]: Nhấn nút [4] "Tiếp Tục" để chuyển sang form nhập liệu chi tiết.'
    ],
    images: [
      {
        src: '/assets/user-guide/2026-09-contract-guide/ug-addendum-01-trigger.png',
        alt: 'Vị trí nút lập phụ lục trên trang chi tiết hợp đồng',
        caption: 'Hình 7.1a: Vị trí nút Thao tác'
      },
      {
        src: '/assets/user-guide/2026-09-contract-guide/ug-addendum-01-drawer-init.png',
        alt: 'Drawer Khởi tạo Phụ lục Hợp đồng Maycha',
        caption: 'Hình 7.1b: Drawer Lập Phụ Lục'
      }
    ],
    result: 'Giao diện hiển thị đúng biểu mẫu nhập liệu nghiệp vụ tương ứng với loại thay đổi tài chính kế toán cần xử lý.',
    cautions: [
      'Số phụ lục phải đánh liên tục (PL-01, PL-02...) không nhảy cóc số để phục vụ đối chiếu hồ sơ.',
      'Ngày áp dụng phụ lục phải nằm trong khoảng thời hạn còn hiệu lực của hợp đồng gốc.'
    ]
  }),
  createSection('addendum-beneficiary-form', '7.2. Thay đổi Tài khoản Thụ hưởng', 'Phòng Kế toán (ACCOUNTANT)', {
    purpose: 'Cập nhật số tài khoản ngân hàng mới của chủ nhà, đính kèm chứng từ xác nhận ủy quyền để đảm bảo chuyển tiền đúng người và đúng quy định pháp luật.',
    conditions: [
      'Đã chọn loại phụ lục "Thay đổi thông tin thụ hưởng".',
      'Có văn bản đề nghị đổi tài khoản hoặc giấy ủy quyền nhận tiền có công chứng của chủ nhà.'
    ],
    steps: [
      'Bước 1 [1]: Nhập [1] "Tên Chủ Tài Khoản Mới" (in hoa không dấu, ví dụ: `NGUYEN VAN A`).',
      'Bước 2 [2]: Nhập [2] "Số Tài Khoản Ngân Hàng Mới", chọn Ngân Hàng và Chi Nhánh mở tài khoản.',
      'Bước 3 [3]: Tải lên [3] bản scan Giấy Đề Nghị Thay Đổi Tài Khoản / Giấy Ủy Quyền có chữ ký của chủ nhà.',
      'Bước 4 [4]: Nhấn nút [4] "Lưu Phụ Lục" để hoàn tất cập nhật tài khoản thụ hưởng mới.'
    ],
    images: [{
      src: '/assets/user-guide/2026-09-contract-guide/ug-addendum-02-beneficiary-form.png',
      alt: 'Form Thay đổi Tài khoản Thụ hưởng Phụ lục',
      caption: 'Hình 7.2: Form Đổi Thụ Hưởng'
    }],
    result: 'Các đợt thanh toán trong tương lai (kể từ ngày phụ lục có hiệu lực) sẽ tự động cập nhật số tài khoản ngân hàng mới khi xuất bút toán SAP.',
    cautions: [
      'Các đợt thanh toán ĐÃ XUẤT SAP trong quá khứ sẽ giữ nguyên lịch sử tài khoản cũ để phục vụ đối chiếu sao kê.',
      'Bạn nhớ tải file chứng từ scan đính kèm để hệ thống lưu trữ đầy đủ hồ sơ pháp lý của phụ lục.'
    ],
    extraBlocks: [
      { type: 'label', text: '📋 Thẻ Nghiệp vụ SC-02 — Chủ nhà bán nhà, đổi người nhận tiền thuê' },
      { type: 'paragraph', text: 'Chủ cũ bán mặt bằng cho chủ mới. Bạn lập phụ lục đổi thông tin thụ hưởng với Ngày hiệu lực (EffectiveDate) = ngày chuyển nhượng. Từ ngày đó, mọi kỳ thuê trả cho chủ mới; các kỳ đã trả cho chủ cũ trước đó GIỮ NGUYÊN, không bị ghi đè.' },
      {
        type: 'table',
        headers: ['Mốc thời gian', 'Người nhận tiền', 'Lịch sử thanh toán'],
        rows: [
          ['Trước Ngày hiệu lực', 'Chủ cũ (mã chủ nhà cũ)', 'Giữ nguyên, tra cứu được'],
          ['Từ Ngày hiệu lực trở đi', 'Chủ mới (mã chủ nhà mới)', 'Các kỳ tương lai tự cập nhật tài khoản mới'],
        ],
      },
      { type: 'paragraph', text: 'Điều cần biết: đính kèm hợp đồng mua bán/giấy chuyển nhượng có công chứng; chọn đúng Ngày hiệu lực để không trả nhầm người cho các kỳ giao thời.' },
    ]
  }),
  createSection('addendum-pricing-override', '7.3. Điều chỉnh Bậc thang Giá & Giảm giá hỗ trợ', 'Phòng Kế toán (ACCOUNTANT)', {
    purpose: 'Thiết lập bảng giá thuê mới cho các năm tiếp theo hoặc áp dụng mức giảm giá hỗ trợ (theo số tiền cố định hoặc phần trăm) trong các giai đoạn đặc biệt.',
    conditions: [
      'Đã chọn loại phụ lục "Điều chỉnh giá thuê & hỗ trợ".',
      'Đã có biên bản thỏa thuận điều chỉnh giá thuê được hai bên ký kết.'
    ],
    steps: [
      'Bước 1: Chọn hình thức điều chỉnh: "Thay đổi đơn giá theo giai đoạn" hoặc "Giảm giá tiền nhà hỗ trợ".',
      'Bước 2: Chọn khoảng thời gian áp dụng giá mới (Từ ngày ... Đến ngày ...).',
      'Bước 3: Nhập Đơn giá thuê mới mỗi tháng hoặc số tiền giảm trừ cụ thể kèm lý do điều chỉnh.',
      'Bước 4: Nhấn nút "Tiếp Tục" để chuyển sang bảng đối soát chênh lệch lịch thanh toán.'
    ],
    images: [{
      src: '/assets/user-guide/2026-09-contract-guide/ug-addendum-03-pricing-override.png',
      alt: 'Biểu mẫu Điều chỉnh Giá thuê và Giảm giá hỗ trợ',
      caption: 'Hình 7.3: Biểu mẫu Điều chỉnh Đơn giá & Giảm giá'
    }],
    result: 'Hệ thống tự động tính toán lại giá trị của các kỳ thanh toán trong tương lai chịu ảnh hưởng bởi phụ lục.',
    cautions: [
      'Mức giảm giá không được vượt quá 100% tổng tiền thuê của kỳ tương ứng.',
      'Thời gian áp dụng giảm giá phải liên tục và không được chồng lấn giữa các giai đoạn.'
    ],
    extraBlocks: [
      { type: 'label', text: '📋 Thẻ Nghiệp vụ SC-05 — Giảm giá tạm thời & tự hồi phục giá gốc' },
      { type: 'paragraph', text: 'Khi mặt bằng bị ảnh hưởng kinh doanh (sửa đường, ngập nước...), Maycha có thể thương lượng giảm giá CÓ THỜI HẠN. Bạn nhập giai đoạn giảm và ngày kết thúc; hết giai đoạn hệ thống tự áp lại giá gốc, không cần lập thêm phụ lục tăng giá.' },
      {
        type: 'table',
        headers: ['Giai đoạn', 'Lý do', 'Mức áp dụng', 'Giá hiệu lực'],
        rows: [
          ['Trước sự cố', 'Bình thường', 'Giá gốc hợp đồng', '100% giá gốc'],
          ['Trong giai đoạn hỗ trợ', 'Sửa đường / ngập nước', 'Giảm tạm thời (số tiền hoặc %)', 'Giá gốc − mức giảm'],
          ['Sau ngày kết thúc giảm', 'Sự cố đã khắc phục', 'Tự động khôi phục', '100% giá gốc (tự động)'],
        ],
      },
      { type: 'paragraph', text: 'Điều cần biết: hãy đặt đúng "Ngày kết thúc giảm giá". Nếu bỏ trống, mức giảm sẽ kéo dài vô thời hạn và làm hụt tiền thuê phải thu.' },
    ]
  }),
  createSection('addendum-diff-preview', '7.4. Đối soát Biến động Lịch thanh toán (Diff Schedule)', 'Phòng Kế toán (ACCOUNTANT)', {
    purpose: 'Cung cấp bảng đối chiếu chênh lệch trực quan so sánh lịch thanh toán Cũ và Mới theo từng kỳ chi trả trước khi người dùng bấm xác nhận áp dụng phụ lục.',
    conditions: [
      'Đã hoàn tất nhập liệu thông tin điều chỉnh giá thuê ở bước 7.3.',
      'Cần kiểm chứng số tiền chênh lệch trước khi ghi nhận vào hệ thống kế toán.'
    ],
    steps: [
      'Bước 1: Cuộn xuống Bảng Đối Soát Biến Động Lịch Thanh Toán (Diff Preview).',
      'Bước 2: Quan sát Cột Số Tiền Cũ của từng đợt thanh toán.',
      'Bước 3: Kiểm tra Cột Số Tiền Mới được tính lại sau khi áp dụng đơn giá hoặc mức giảm.',
      'Bước 4: Kiểm tra Cột Biến Động Chênh Lệch (+ tăng hoặc - giảm trừ) và dòng Tổng cộng.',
      'Bước 5: Nhấn nút "Xác Nhận Áp Dụng Phụ Lục" để chính thức cập nhật lịch thanh toán mới.'
    ],
    images: [{
      src: '/assets/user-guide/2026-09-contract-guide/ug-addendum-04-diff-preview.png',
      alt: 'Bảng Đối soát Biến động Lịch thanh toán',
      caption: 'Hình 7.4: Bảng Đối soát Biến động Lịch thanh toán'
    }],
    result: 'Phụ lục được lưu trữ và có hiệu lực ngay lập tức; toàn bộ lịch thanh toán của hợp đồng được cập nhật tức thì theo số liệu mới.',
    cautions: [
      'Sau khi bấm Xác Nhận, lịch thanh toán mới sẽ có hiệu lực ngay lập tức trong Sổ Thanh Toán Toàn Chuỗi.',
      'Bảng đối soát Diff Preview là bằng chứng quan trọng để kế toán giải trình biến động chi phí với Kế toán trưởng.'
    ]
  }),

  // =========================================================================
  // CHƯƠNG 8
  // =========================================================================
  {
    id: 'chapter-8-termination',
    title: 'Chương 8. Thanh lý & Quyết toán Cọc',
    level: 1,
    role: 'LEGAL',
    blocks: [
      {
        type: 'paragraph',
        text: 'Quy trình Thanh lý hợp đồng thuê mặt bằng là giai đoạn kết thúc vòng đời điểm bán. Quy trình này đòi hỏi sự phối hợp chặt chẽ giữa phòng Pháp lý (lập biên bản bàn giao, ngày kết thúc) và phòng Kế toán (quyết toán tiền cọc mặt bằng TK 244, cấn trừ công nợ tiền nhà và chi phí hư hỏng).',
      },
      {
        type: 'label',
        text: 'Hai Giai đoạn Thanh lý Chuẩn hóa',
      },
      {
        type: 'bullets',
        items: [
          'Giai đoạn 1 - Pháp lý: Thiết lập ngày chấm dứt hợp đồng, lý do trả mặt bằng và đính kèm Biên bản Bàn giao hiện trạng.',
          'Giai đoạn 2 - Kế toán: Quyết toán tiền cọc thuê mặt bằng (Tài khoản 244) theo phương án hoàn trả 100%, khấu trừ công nợ hoặc mất cọc do vi phạm.'
        ]
      }
    ]
  },
  createSection('termination-drawer', '8.1. Khởi tạo Quy trình Thanh lý Mặt bằng', 'Phòng Pháp lý (LEGAL)', {
    purpose: 'Bắt đầu thủ tục thanh lý hợp đồng thuê mặt bằng, ghi nhận ngày chấm dứt chính thức và tải lên biên bản thanh lý có chữ ký của hai bên.',
    conditions: [
      'Đã có quyết định đóng cửa điểm bán hoặc hết hạn hợp đồng không tái ký.',
      'Đã hoàn tất việc bàn giao hiện trạng mặt bằng cho chủ nhà.'
    ],
    steps: [
      'Bước 1 [1]: Tại trang Chi tiết hợp đồng cần thanh lý, nhấp vào nút [1] "Thanh Lý Hợp Đồng" ở góc phải (Xem Hình 8.1a).',
      'Bước 2 [2]: Drawer Thanh Lý mở lên; nhập chính xác [2] "Ngày Chấm Dứt Hợp Đồng" (ngày bàn giao mặt bằng) (Xem Hình 8.1b).',
      'Bước 3 [3]: Chọn [3] "Lý Do Thanh Lý" và nhập ghi chú tình trạng bàn giao tài sản.',
      'Bước 4 [4]: Tải lên [4] bản scan "Biên Bản Thanh Lý Hợp Đồng" và "Biên Bản Bàn Giao Mặt Bằng".',
      'Bước 5 [5]: Nhấn nút [5] "Tiếp Tục Sang Quyết Toán Cọc" để chuyển hồ sơ cho bộ phận Kế toán.'
    ],
    images: [
      {
        src: '/assets/user-guide/2026-09-contract-guide/ug-termination-01-trigger.png',
        alt: 'Vị trí nút thanh lý hợp đồng trên trang chi tiết',
        caption: 'Hình 8.1a: Vị trí nút Thao tác'
      },
      {
        src: '/assets/user-guide/2026-09-contract-guide/ug-termination-01-drawer.png',
        alt: 'Drawer Thanh lý hợp đồng thuê mặt bằng',
        caption: 'Hình 8.1b: Drawer Thanh Lý'
      }
    ],
    result: 'Hợp đồng được chuyển sang trạng thái "Chờ Quyết Toán Cọc" và khóa các đợt thanh toán tiền nhà phát sinh sau ngày chấm dứt.',
    cautions: [
      'Ngày chấm dứt hợp đồng là căn cứ để kế toán chốt số ngày thuê thực tế và dừng tạo lịch thanh toán.',
      'Cần kiểm tra đầy đủ chữ ký của chủ nhà trên biên bản bàn giao trước khi hoàn tất thủ tục thanh lý.'
    ]
  }),
  createSection('termination-deposit-form', '8.2. Quyết toán Cọc Mặt bằng (Tài khoản 244) & Khấu trừ', 'Phòng Kế toán (ACCOUNTANT)', {
    purpose: 'Xử lý hoàn tất số tiền đặt cọc mặt bằng (TK 244) theo các phương án: thu hồi đủ cọc, cấn trừ tiền nhà còn thiếu hoặc khấu trừ tiền bồi thường hư hại tài sản.',
    conditions: [
      'Phòng Pháp lý đã hoàn tất bước 8.1 và đính kèm biên bản bàn giao.',
      'Kế toán đã có số liệu đối soát công nợ cuối cùng với chủ nhà.'
    ],
    steps: [
      'Bước 1 [1]: Tại màn hình Quyết Toán Cọc, kiểm tra [1] Tổng số tiền cọc ban đầu được ghi nhận (TK 244).',
      'Bước 2 [2]: Chọn [2] Phương án xử lý cọc: "Chủ nhà hoàn trả toàn bộ", "Cấn trừ tiền thuê", hoặc "Khấu trừ chi phí".',
      'Bước 3 [3]: Nếu có khấu trừ, nhập [3] Số tiền khấu trừ và ghi rõ lý do thiệt hại.',
      'Bước 4: Kiểm tra số tiền cọc thực tế chủ nhà phải thanh toán trả lại cho Maycha.',
      'Bước 5 [4]: Nhấn nút [4] "Hoàn Tất Thanh Lý & Đóng Hồ Sơ" để kết thúc vòng đời hợp đồng.'
    ],
    images: [{
      src: '/assets/user-guide/2026-09-contract-guide/ug-termination-02-deposit-form.png',
      alt: 'Form Quyết toán Cọc TK 244 Maycha',
      caption: 'Hình 8.2: Form Quyết Toán Cọc TK 244'
    }],
    result: 'Hợp đồng chuyển sang trạng thái ĐÃ THANH LÝ (TERMINATED), toàn bộ nghĩa vụ tài chính và cọc TK 244 được tất toán sạch sẽ trên hệ thống.',
    cautions: [
      'Số tiền cọc thực thu về phải được theo dõi khớp với sao kê ngân hàng của công ty.',
      'Sau khi bấm Hoàn Tất, hồ sơ được chuyển sang trạng thái lưu trữ an toàn; bạn vẫn có thể mở xem lại bất kỳ lúc nào nhưng không thể chỉnh sửa số liệu.'
    ],
    extraBlocks: [
      { type: 'label', text: '📋 Thẻ Nghiệp vụ SC-06 — Mất cọc do vi phạm (TK 244 → TK 811)' },
      { type: 'paragraph', text: 'Khi Maycha vi phạm và mất cọc, tiền cọc đang treo ở Tài khoản tiền cọc (TK 244) phải được ghi nhận thành Chi phí khác (TK 811). Ví dụ mất trọn 38.000.000đ.' },
      {
        type: 'table',
        headers: ['Bút toán', 'Ghi Nợ', 'Ghi Có', 'Số tiền', 'Diễn giải'],
        rows: [
          ['Kết chuyển mất cọc', 'TK 811 (Chi phí khác)', 'TK 244 (Tiền cọc)', '38.000.000đ', 'Cọc không thu hồi được do vi phạm hợp đồng'],
        ],
      },
      { type: 'paragraph', text: 'Lưu ý quan trọng: đây là BÚT TOÁN THỨ 3, phải hạch toán TAY, nằm NGOÀI 2 mẫu bút toán (JE) mà hệ thống tự sinh (bút toán ghi nhận tiền thuê và bút toán quyết toán cọc thông thường). Hệ thống không tự tạo bút toán 811 này — kế toán chủ động lập trong SAP và ghi chú Mã đợt xuất SAP tương ứng để đối soát.' },
    ]
  }),

  // =========================================================================
  // CHƯƠNG 9
  // =========================================================================
  {
    id: 'chapter-9-payment-schedules',
    title: 'Chương 9. Sổ Thanh toán & Xuất SAP',
    level: 1,
    role: 'ACCOUNTANT',
    blocks: [
      {
        type: 'paragraph',
        text: 'Sổ Lịch Thanh Toán Toàn Chuỗi là trung tâm điều hành xuất dữ liệu kế toán của Maycha. Nơi đây tập hợp hàng trăm đợt chi trả tiền thuê của toàn bộ các điểm bán, hỗ trợ kế toán tích chọn hàng loạt để xuất file Excel chuẩn 2 sheet (JE Header & JE Line) nạp trực tiếp vào ERP SAP B1.',
      },
      {
        type: 'label',
        text: 'Cấu trúc File Bút toán Xuất SAP Chuẩn',
      },
      {
        type: 'table',
        headers: ['Thành phần Sheet', 'Nội dung hạch toán', 'Quy cách kỹ thuật', 'Kiểm soát chéo'],
        rows: [
          [
            'Sheet 1: JE Header',
            'Tiêu đề bút toán, Mã lô (Batch ID), Ngày hạch toán, Diễn giải chung',
            'Khớp chuẩn định dạng Journal Entry Header của SAP Business One',
            'Mỗi lần xuất sinh một Batch ID duy nhất'
          ],
          [
            'Sheet 2: JE Line',
            'Chi tiết từng dòng chi phí: Tài khoản Nợ (Chi phí thuê), Tài khoản Có (Phải trả chủ nhà), Cost Center điểm bán, Số tiền',
            'Cân đối Nợ - Có 100%, tự động bóc tách thuế nộp thay chủ nhà',
            'Đối soát chéo với mã CardCode chủ nhà trên hệ thống'
          ]
        ]
      }
    ]
  },
  createSection('payment-console-table', '9.1. Bàn điều khiển Sổ Lịch Thanh toán Toàn chuỗi', 'Phòng Kế toán (ACCOUNTANT)', {
    purpose: 'Theo dõi tập trung toàn bộ các đợt thanh toán tiền thuê của tất cả cửa hàng trong hệ thống, lọc các đợt sắp đến hạn thanh toán trong tháng để chuẩn bị nguồn chi.',
    conditions: [
      'Đăng nhập với vai trò Kế toán (ACCOUNTANT) hoặc Ban Giám Đốc (ADMIN).',
      'Truy cập phân hệ Sổ Lịch Thanh Toán.'
    ],
    steps: [
      'Bước 1: Chọn mục "Sổ Lịch Thanh Toán" trên menu bên trái.',
      'Bước 2 [1]: Quan sát 4 thẻ tổng hợp tài chính [1]: Tổng tiền cần chi trong kỳ, Số đợt đã thanh toán, Số đợt chờ xuất SAP và Quá hạn.',
      'Bước 3 [2]: Sử dụng Bộ lọc kỳ kế toán tháng/năm [2] để chọn tháng cần đối soát (ví dụ: Tháng 09/2026).',
      'Bước 4 [3]: Kiểm tra Danh sách các đợt thanh toán chi tiết [3] hiển thị bên dưới bảng.'
    ],
    images: [{
      src: '/assets/user-guide/2026-09-contract-guide/ug-payment-01-console-table.png',
      alt: 'Bàn điều khiển Sổ Lịch Thanh toán Maycha',
      caption: 'Hình 9.1: Bàn điều khiển Sổ Thanh Toán'
    }],
    result: 'Nắm bắt chính xác tổng nhu cầu vốn chi trả tiền thuê mặt bằng trong kỳ của toàn bộ chuỗi cửa hàng.',
    cautions: [
      'Các đợt thanh toán quá hạn được bôi đỏ cảnh báo; kế toán cần ưu tiên xử lý trước để tránh chủ nhà khiếu nại.',
      'Có thể xuất danh sách tổng quan ra Excel để báo cáo nhanh cho Kế toán trưởng.'
    ]
  }),
  createSection('payment-sap-action-bar', '9.2. Tích chọn Hàng loạt & Xuất Bút toán Kế toán SAP B1', 'Phòng Kế toán (ACCOUNTANT)', {
    purpose: 'Tích chọn hàng loạt các đợt thanh toán đủ điều kiện và xuất file Excel chuẩn 2 sheet (JE Header & JE Line) để nạp thẳng vào phần mềm kế toán SAP Business One.',
    conditions: [
      'Các hợp đồng của những đợt được chọn đã hoàn tất ánh xạ mã SAP (Cost Center và CardCode).',
      'Kế toán đã kiểm tra và phê duyệt số tiền cần chi trả.'
    ],
    steps: [
      'Bước 1 [1]: Tích chọn ô vuông [1] ở đầu các dòng thanh toán muốn xuất (hoặc tích ô chọn tất cả trên header).',
      'Bước 2 [2]: Quan sát Thanh Tác Vụ Nổi màu xanh dương [2] (Action Bar) xuất hiện ở cạnh dưới màn hình, hiển thị tổng số dòng và tổng tiền.',
      'Bước 3 [3]: Nhấn nút [3] "Xuất Bút Toán SAP (Excel)" trên thanh tác vụ nổi.',
      'Bước 4: Trình duyệt tự động tải xuống file Excel chứa 2 sheet dữ liệu chuẩn định dạng SAP B1.',
      'Bước 5: Hệ thống tự động gắn nhãn "Đã Xuất SAP" và mã Batch ID cho các đợt vừa xuất.'
    ],
    images: [{
      src: '/assets/user-guide/2026-09-contract-guide/ug-payment-02-sap-action-bar.png',
      alt: 'Thanh tác vụ xuất bút toán SAP nổi',
      caption: 'Hình 9.2: Thanh tác vụ Xuất SAP'
    }],
    result: 'File Excel xuất ra sẵn sàng để nạp trực tiếp vào SAP B1 thông qua tính năng Import Journal Entry, tiết kiệm hàng giờ nhập liệu thủ công.',
    cautions: [
      'Chỉ những đợt đã có đủ mã Cost Center và CardCode mới xuất được; nếu thiếu mã, hệ thống sẽ báo lỗi và đánh dấu dòng cần bổ sung.',
      'Nếu xuất lại đợt đã từng xuất, hệ thống sẽ hiện cảnh báo mềm kèm ghi nhận Mã đợt xuất mới để kế toán đối soát, tránh trùng lặp.'
    ],
    extraBlocks: [
      { type: 'label', text: '📋 Thẻ Nghiệp vụ SC-08 (A) — Chống xuất trùng: cảnh báo mềm, không chặn cứng' },
      { type: 'paragraph', text: 'Nếu bạn tích chọn một đợt đã từng xuất, hệ thống hiện cảnh báo mềm ("Đợt này có thể đã được xuất") nhưng VẪN cho phép tiếp tục — vì đôi khi bạn cần xuất lại có chủ đích. Quyền quyết định thuộc về kế toán, hệ thống chỉ nhắc.' },
      {
        type: 'table',
        headers: ['Tình huống', 'Hệ thống làm gì', 'Bạn nên làm gì'],
        rows: [
          ['Đợt chưa từng xuất', 'Cho xuất bình thường, sinh Mã đợt xuất SAP mới', 'Xuất và lưu file'],
          ['Đợt đã từng xuất', 'Hiện cảnh báo mềm, KHÔNG chặn', 'Kiểm tra Lịch sử xuất (mục 9.3) trước khi xuất lại'],
        ],
      },
    ]
  }),
  createSection('payment-sap-history-modal', '9.3. Nhật ký Lịch sử Xuất SAP & Đối soát Mã Đợt Xuất', 'Phòng Kế toán (ACCOUNTANT)', {
    purpose: 'Tra cứu lại các lần xuất file kế toán trong quá khứ, kiểm tra mã lô (Batch ID), người xuất, thời điểm xuất và tải lại file Excel nếu cần.',
    conditions: [
      'Đang ở trang Sổ Lịch Thanh Toán.',
      'Cần đối chiếu số liệu bút toán đã nạp vào SAP với dữ liệu gốc của hợp đồng.'
    ],
    steps: [
      'Bước 1 [1]: Nhấp vào nút [1] "Lịch Sử Xuất SAP" ở góc trên bên phải bảng điều khiển (Xem Hình 9.3a).',
      'Bước 2 [2]: Cửa sổ Lịch Sử mở lên, liệt kê các đợt xuất theo [2] Danh sách mã Batch ID (ví dụ: `BATCH-202609-001`) (Xem Hình 9.3b).',
      'Bước 3 [3]: Nhấp vào [3] Nút "Tải Lại File" Excel hạch toán nếu bị thất lạc file cũ.'
    ],
    images: [
      {
        src: '/assets/user-guide/2026-09-contract-guide/ug-payment-03-history-trigger.png',
        alt: 'Vị trí nút Lịch sử xuất SAP trên thanh công cụ',
        caption: 'Hình 9.3a: Vị trí nút Thao tác'
      },
      {
        src: '/assets/user-guide/2026-09-contract-guide/ug-payment-03-sap-history-modal.png',
        alt: 'Modal Lịch sử Xuất Bút toán SAP B1',
        caption: 'Hình 9.3b: Modal Lịch Sử Xuất SAP'
      }
    ],
    result: 'Cung cấp bằng chứng đối soát toàn diện phục vụ công tác thanh kiểm tra sổ sách kế toán định kỳ.',
    cautions: [
      'Mã Batch ID là căn cứ duy nhất để tra cứu vết hạch toán tương ứng trong phần mềm SAP B1.',
      'Lịch sử xuất được lưu trữ vĩnh viễn và không cho phép xóa.'
    ],
    extraBlocks: [
      { type: 'label', text: '📋 Thẻ Nghiệp vụ SC-08 (B) — Đối soát log Mã đợt xuất SAP' },
      { type: 'paragraph', text: 'Mỗi lần xuất sinh một Mã đợt xuất SAP riêng và được ghi vào nhật ký này. Muốn biết một đợt đã xuất mấy lần, tra ở đây theo Mã đợt — đây là căn cứ để phát hiện trùng lặp mà không cần hệ thống chặn cứng.' },
      {
        type: 'table',
        headers: ['Cột trong nhật ký', 'Ý nghĩa'],
        rows: [
          ['Mã đợt xuất SAP', 'Định danh duy nhất mỗi lần xuất, dùng để đối soát với SAP'],
          ['Người xuất / Thời điểm', 'Ai xuất, lúc nào — phục vụ truy vết'],
          ['Tải lại file', 'Lấy lại đúng file Excel của đợt đó nếu thất lạc'],
        ],
      },
    ]
  }),

  // =========================================================================
  // CHƯƠNG 10
  // =========================================================================
  {
    id: 'chapter-10-administration',
    title: 'Chương 10. Quản trị & Bảo mật',
    level: 1,
    role: 'ADMIN',
    blocks: [
      {
        type: 'paragraph',
        text: 'Phân hệ Quản trị & Bảo mật dành riêng cho Ban Giám Đốc và Quản trị viên hệ thống. Nơi đây thiết lập các tài khoản nhân sự, phân bổ vai trò chuẩn xác theo phòng ban, quản lý vòng đời tài khoản (tạo mới, cấp lại mật khẩu, tạm khóa khi nhân viên nghỉ việc) và bảo đảm nguyên tắc phân tách trách nhiệm (SoD).',
      },
      {
        type: 'label',
        text: 'Bốn Vai trò Nền tảng trong Hệ thống Maycha',
      },
      {
        type: 'table',
        headers: ['Vai trò hệ thống', 'Chức danh công việc', 'Phạm vi trách nhiệm chính', 'Chính sách bảo mật'],
        rows: [
          [
            'SITE',
            'Nhân viên / Trưởng phòng Mặt Bằng',
            'Khảo sát, tiếp nhận hợp đồng thuê, tải tài liệu scan, theo dõi danh sách điểm thuê',
            'Bắt buộc dùng email công vụ @maycha.com.vn, không có quyền xem dữ liệu tài chính sâu'
          ],
          [
            'ACCOUNTANT',
            'Kế toán tiền thuê / Kế toán trưởng',
            'Kiểm soát lịch thanh toán, ánh xạ Master Data SAP, lập phụ lục điều chỉnh, xuất bút toán SAP B1',
            'Kiểm soát chéo 2 lớp khi xuất dữ liệu tài chính, khóa chỉ đọc khi hợp đồng kích hoạt'
          ],
          [
            'LEGAL',
            'Chuyên viên Pháp chế',
            'Thẩm định pháp lý, kiểm soát hồ sơ scan gốc, quản lý radar hạn hợp đồng, khởi tạo thanh lý',
            'Bảo đảm tính toàn vẹn chứng từ, lưu trữ hồ sơ pháp lý an toàn và minh bạch'
          ],
          [
            'ADMIN',
            'Tổng Giám Đốc / Quản trị viên',
            'Điều hành toàn chuỗi 360°, quản lý tài khoản người dùng, phân vai trò, theo dõi nhật ký kiểm toán',
            'Toàn quyền quản trị, bắt buộc tuân thủ nguyên tắc bảo mật và phân tách kiểm toán SoD'
          ]
        ]
      }
    ]
  },
  createSection('admin-users-matrix', '10.1. Bàn điều khiển Quản trị Người dùng & Ma trận Quyền hạn', 'Ban Giám Đốc / Quản trị (ADMIN)', {
    purpose: 'Cung cấp cái nhìn tổng quan về danh sách toàn bộ tài khoản nhân viên trong hệ thống, trạng thái hoạt động và cấu hình vai trò của từng nhân sự.',
    conditions: [
      'Đăng nhập tài khoản có quyền Quản trị cấp cao (vai trò ADMIN).',
      'Cần tra cứu danh sách nhân sự đang được cấp quyền truy cập hệ thống.'
    ],
    steps: [
      'Bước 1: Trên thanh menu bên trái, chọn mục "Quản Lý Người Dùng & Phân Quyền".',
      'Bước 2 [2]: Sử dụng [2] Ô tìm kiếm để gõ tên hoặc email nhân sự, hoặc dùng dropdown để lọc theo vai trò (SITE, ACCOUNTANT, LEGAL, ADMIN).',
      'Bước 3: Quan sát bảng danh sách nhân viên: Họ tên, Email, Vai trò, Trạng thái (Hoạt động / Tạm khóa), Ngày tạo.',
      'Bước 4 [1]: Nhấp vào nút [1] "+ Thêm người dùng" nếu muốn khởi tạo tài khoản nhân sự mới.',
      'Bước 5 [3]: Nhấp vào menu 3 chấm [3] ở cuối mỗi dòng để chọn tác vụ Đặt lại mật khẩu hoặc Tạm khóa tài khoản.'
    ],
    images: [{
      src: '/assets/user-guide/2026-09-contract-guide/ug-admin-02-users-table.png',
      alt: 'Bàn điều khiển Quản trị Người dùng',
      caption: 'Hình 10.1: Bàn điều khiển Quản trị Người dùng'
    }],
    result: 'Quản trị viên nắm bắt chính xác toàn bộ nhân sự đang có quyền truy cập vào dữ liệu hợp đồng của công ty.',
    cautions: [
      'Thường xuyên rà soát danh sách nhân sự để phát hiện và vô hiệu hóa kịp thời các tài khoản của nhân viên đã chuyển công tác.',
      'Mỗi nhân viên chỉ được cấp đúng một tài khoản cá nhân gắn liền với email doanh nghiệp Maycha.'
    ]
  }),
  createSection('admin-user-lifecycle', '10.2. Quy trình Cấp mới, Phân vai trò, Khóa tài khoản & Đặt lại Mật khẩu', 'Ban Giám Đốc / Quản trị (ADMIN)', {
    purpose: 'Hướng dẫn đầy đủ quy trình vòng đời tài khoản nhân sự: tạo tài khoản mới, gán vai trò theo phòng ban, đặt lại mật khẩu khi nhân viên quên và tạm khóa tài khoản khi nghỉ việc.',
    conditions: [
      'Tài khoản đăng nhập có quyền ADMIN tối cao.',
      'Đã có thông tin nhân sự mới (họ tên, email công vụ, phòng ban).'
    ],
    steps: [
      'Bước 1 [1]: Tại Bàn điều khiển người dùng, nhấp nút [1] "+ Thêm người dùng" ở góc trên bên phải (Xem Hình 10.2a).',
      'Bước 2 [2]: Drawer Thêm người dùng mở ra; nhập [2] Email công vụ (@maycha.com.vn), Họ và tên, Mật khẩu khởi tạo (Xem Hình 10.2b).',
      'Bước 3 [3]: Chọn [3] "Vai trò nền" (SITE cho Mặt bằng, ACCOUNTANT cho Kế toán, LEGAL cho Pháp lý) và nhấn nút [4] "Lưu người dùng".',
      'Bước 4 [4]: Khi nhân viên quên mật khẩu hoặc cần thu hồi quyền, nhấp menu 3 chấm [4] trên dòng nhân sự (Xem Hình 10.2a).',
      'Bước 5 [5][6]: Tại hộp thoại Đặt lại mật khẩu, nhập [5] Mật khẩu mới, [6] Xác nhận mật khẩu và nhấn [7] "Lưu mật khẩu" (Xem Hình 10.2c).',
      'Bước 6: Khi nhân viên nghỉ việc, chọn "Đổi trạng thái" -> chuyển sang "Tạm khóa (SUSPENDED)" để vô hiệu hóa tài khoản ngay tức thì.'
    ],
    images: [
      {
        src: '/assets/user-guide/2026-09-contract-guide/ug-admin-02b-user-trigger.png',
        alt: 'Vị trí nút thêm người dùng và menu thao tác dòng nhân sự',
        caption: 'Hình 10.2a: Vị trí nút Thao tác'
      },
      {
        src: '/assets/user-guide/2026-09-contract-guide/ug-admin-01-users-matrix.png',
        alt: 'Form Thêm người dùng mới và phân quyền vai trò',
        caption: 'Hình 10.2b: Biểu mẫu Thêm Người Dùng'
      },
      {
        src: '/assets/user-guide/2026-09-contract-guide/ug-admin-03-user-status-dialog.png',
        alt: 'Hộp thoại Đặt lại mật khẩu nhân viên',
        caption: 'Hình 10.2c: Hộp thoại Đặt Lại Mật Khẩu'
      }
    ],
    result: 'Tài khoản nhân sự được quản lý chặt chẽ trong suốt vòng đời công tác, bảo đảm an toàn dữ liệu và quyền truy cập đúng vai trò.',
    cautions: [
      'Mật khẩu khởi tạo phải bảo đảm độ phức tạp (tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và chữ số); yêu cầu nhân viên đổi lại mật khẩu ngay lần đầu đăng nhập.',
      'Khi nhân viên nghỉ việc, cần thực hiện Tạm khóa tài khoản ngay trong ngày bàn giao để bảo vệ dữ liệu bí mật kinh doanh của chuỗi.'
    ]
  }),
  // =========================================================================
  // CHƯƠNG 11 — CẨM NANG XỬ LÝ SỰ CỐ & THẺ BỎ TÚI
  // =========================================================================
  {
    id: 'chapter-11-troubleshooting',
    title: 'Chương 11. Cẩm nang Xử lý Sự cố & Thẻ Bỏ túi',
    level: 1,
    role: 'ALL',
    blocks: [
      {
        type: 'paragraph',
        text: 'Khi có trục trặc, đừng hoảng. Tìm dấu hiệu của bạn trong Bảng tra bên dưới, xem mức độ khẩn, rồi làm theo đúng Playbook cứu hộ. Mọi thao tác đều an toàn và có dấu vết — bạn không thể làm hỏng dữ liệu nếu đi theo hướng dẫn.'
      },
      { type: 'label', text: '11.1. Bảng tra sự cố khẩn cấp (Triage Index)' },
      {
        type: 'table',
        headers: ['Mã', 'Dấu hiệu bạn gặp', 'Mức khẩn', 'Xem Playbook'],
        rows: [
          ['TS-1', 'Không đăng nhập được / quên mật khẩu', 'Trung bình', '11.2 – Playbook 1'],
          ['TS-2', 'AI quét mờ, sai số tài khoản chủ nhà', 'Cao', '11.2 – Playbook 2'],
          ['TS-3', 'Chủ nhà đổi số tài khoản gấp trước kỳ chi', 'Cao', '11.2 – Playbook 3'],
          ['TS-4', 'Xuất SAP báo thiếu mã (mã quán / mã chủ nhà)', 'Cao', '11.2 – Playbook 4'],
          ['TS-5', 'Phải quyết toán mất cọc do vi phạm', 'Cao', '11.2 – Playbook 5'],
        ],
      },
      { type: 'label', text: '11.2. Playbook cứu hộ chi tiết' },
      { type: 'label', text: 'Playbook 1 (TS-1) — Quên mật khẩu / không đăng nhập được' },
      {
        type: 'bullets',
        items: [
          'Kiểm tra đúng email công vụ đuôi @maycha.com.vn và bàn phím không bật Caps Lock.',
          'Báo Quản trị viên (ADMIN) đặt lại mật khẩu tạm thời cho tài khoản (xem mục 10.2).',
          'Sau khi được cấp mật khẩu tạm, đăng nhập và đổi mật khẩu mới ngay trong lần đầu truy cập.',
          'Nếu vẫn không vào được sau 2 lần thử, chụp màn hình báo lỗi gửi Ban Quản trị Hệ thống.',
        ],
      },
      { type: 'label', text: 'Playbook 2 (TS-2) — AI quét mờ, sai số tài khoản chủ nhà' },
      {
        type: 'bullets',
        items: [
          'Ở màn hình Rà soát Dữ liệu (mục 3.3), so từng chữ số tài khoản với bản scan gốc bên trái.',
          'Sửa tay trường bị sai TRƯỚC khi bấm Lưu — đây là việc bình thường, không phải lỗi của bạn.',
          'Nếu bản scan quá mờ, chụp/scan lại rõ hơn rồi tải lại và cho quét lại.',
          'Chỉ lưu khi số tài khoản khớp 100% với giấy tờ chủ nhà.',
        ],
      },
      { type: 'label', text: 'Playbook 3 (TS-3) — Chủ nhà đổi số tài khoản gấp trước kỳ chi' },
      {
        type: 'bullets',
        items: [
          'Không sửa trực tiếp ở hồ sơ đã khóa tài chính — hãy lập phụ lục "Thay đổi thông tin thụ hưởng" (mục 7.2).',
          'Đặt Ngày hiệu lực đúng để kỳ chi sắp tới trả vào tài khoản mới.',
          'Đính kèm giấy đề nghị đổi tài khoản / ủy quyền có chữ ký chủ nhà.',
          'Báo Kế toán trưởng để tạm hoãn kỳ chi nếu phụ lục chưa kịp duyệt.',
        ],
      },
      { type: 'label', text: 'Playbook 4 (TS-4) — Xuất SAP báo thiếu mã' },
      {
        type: 'bullets',
        items: [
          'Mở tab Tài chính của hợp đồng, kiểm tra đã gán Mã quán Maycha và Mã chủ nhà chưa (mục 6.3).',
          'Nếu thiếu, khai báo/ánh xạ mã trong Dữ liệu Nền tảng (Chương 2) rồi ánh xạ lại.',
          'Xuất lại đợt sau khi đủ mã; đối chiếu Mã đợt xuất SAP ở nhật ký (mục 9.3).',
          'Không tự tạo mã trùng — nếu nghi trùng, tra danh mục trước khi tạo mới.',
        ],
      },
      { type: 'label', text: 'Playbook 5 (TS-5) — Phạt mất cọc do vi phạm' },
      {
        type: 'bullets',
        items: [
          'Ở màn hình Quyết toán cọc (mục 8.2), chọn phương án "Khấu trừ / mất cọc do vi phạm".',
          'Ghi rõ lý do và số tiền mất cọc để có dấu vết kiểm toán.',
          'Hạch toán bút toán mất cọc: Nợ TK 811 / Có TK 244 (xem Thẻ SC-06 ở mục 8.2) — bút toán này lập tay trong SAP.',
          'Đối chiếu số tiền thực tế với sao kê ngân hàng trước khi đóng hồ sơ.',
        ],
      },
      { type: 'label', text: '11.3. Thẻ bỏ túi 60 giây (Cheatsheet theo phòng ban)' },
      { type: 'label', text: 'Thẻ SITE — Phòng Mặt bằng' },
      {
        type: 'table',
        headers: ['Việc cần nhớ', 'Ở đâu'],
        rows: [
          ['Tải scan hợp đồng đầy đủ chữ ký/dấu', 'Mục 3.1'],
          ['Rà soát dữ liệu AI, sửa sai trước khi lưu', 'Mục 3.3'],
          ['Không sửa điều khoản tài chính (để Kế toán lo)', 'Mục 4.5 / 6.4'],
        ],
      },
      { type: 'label', text: 'Thẻ ACCOUNTANT — Phòng Kế toán' },
      {
        type: 'table',
        headers: ['Việc cần nhớ', 'Ở đâu'],
        rows: [
          ['Gán đúng Mã quán Maycha & Mã chủ nhà', 'Mục 6.3'],
          ['Đổi tiền/tài khoản phải qua phụ lục', 'Chương 7'],
          ['Xuất SAP: xem cảnh báo mềm, đối soát Mã đợt', 'Mục 9.2 / 9.3'],
          ['Mất cọc: Nợ 811 / Có 244 (lập tay)', 'Mục 8.2 (SC-06)'],
        ],
      },
      { type: 'label', text: 'Thẻ LEGAL — Phòng Pháp lý' },
      {
        type: 'table',
        headers: ['Việc cần nhớ', 'Ở đâu'],
        rows: [
          ['Theo dõi Radar cảnh báo hạn (Đỏ = gấp)', 'Mục 1.4 / 4.3'],
          ['Đủ chứng từ pháp lý trước khi khóa hồ sơ', 'Mục 5.1 / 5.2'],
          ['Khởi tạo thanh lý, đính kèm biên bản bàn giao', 'Mục 8.1'],
        ],
      },
      { type: 'label', text: 'Thẻ ADMIN — Ban Giám đốc' },
      {
        type: 'table',
        headers: ['Việc cần nhớ', 'Ở đâu'],
        rows: [
          ['Xem bức tranh 360° toàn chuỗi', 'Mục 1.5'],
          ['Quản trị người dùng, phân vai trò', 'Mục 10.1 / 10.2'],
          ['Phê duyệt 3 câu hỏi Decision Log (xem plan.md mục 7)', 'plan.md §7'],
        ],
      },
    ],
  },
];

const fullGuide = {
  ...metadata,
  sections,
};
plainifyGuide(fullGuide);

fs.writeFileSync(contentPath, JSON.stringify(fullGuide, null, 2), 'utf8');
console.log(`✓ Đã sinh thành công guide-content.json hoàn chỉnh:`);
console.log(`- Tiêu đề: ${fullGuide.title}`);
console.log(`- Phiên bản: ${fullGuide.version}`);
console.log(`- Tổng số mục: ${fullGuide.sections.length} (${fullGuide.sections.filter(s => s.level === 1).length} Chương, ${fullGuide.sections.filter(s => s.level === 2).length} Mục nghiệp vụ)`);
console.log(`- Tổng số ảnh được tham chiếu: ${metadata.imageCount}`);
