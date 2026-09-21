import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  TableOfContents,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  VerticalAlign,
  Header,
  Footer,
  PageNumber,
  PageBreak,
  ImageRun,
  LevelFormat,
} from 'docx';
import type {
  GuideContent,
  GuideSection,
  ContentBlock,
  RoleTag,
  TableBlock,
} from '../types/guide';

/**
 * Usable page width in Word with 1-inch (1440 DXA) margins on Letter/A4
 * 8.5" * 1440 - 2880 = 9360 DXA
 */
const USABLE_PAGE_WIDTH = 9360;

/**
 * Colors palette following Maycha Brand and Executive Report Guidelines
 */
const COLORS = {
  primary: '0F4C81', // Classic Maycha Navy Blue
  primaryLight: 'E6F0FA', // Tint
  secondary: '0284C7', // Sky Blue Accent
  textDark: '1E293B', // Slate Dark
  textMuted: '64748B', // Muted Gray
  borderLight: 'D1D5DB', // Light gray border
  borderMuted: 'E2E8F0', // Table internal border
  white: 'FFFFFF',
  tableStripe: 'F8FAFC',

  // Semantic Callout Colors
  purposeBorder: '0284C7',
  purposeBg: 'F0F9FF',
  conditionBorder: '7C3AED',
  conditionBg: 'F5F3FF',
  actionBorder: '059669',
  actionBg: 'ECFDF5',
  resultBorder: '2563EB',
  resultBg: 'EFF6FF',
  cautionBorder: 'D97706',
  cautionBg: 'FFFBEB',
  scenarioBorder: '0F4C81',
  scenarioBg: 'F8FAFC',
  playbookBorder: 'DC2626',
  playbookBg: 'FEF2F2',
  glossaryBorder: '475569',
  glossaryBg: 'F1F5F9',
};

const BORDER_SINGLE = { style: BorderStyle.SINGLE, size: 1, color: COLORS.borderLight };
const TABLE_CELL_BORDERS = {
  top: BORDER_SINGLE,
  bottom: BORDER_SINGLE,
  left: BORDER_SINGLE,
  right: BORDER_SINGLE,
};

/**
 * Parses PNG image dimensions (width, height) directly from the header bytes
 */
function getPngDimensions(data: Uint8Array): { width: number; height: number } | null {
  if (data.length < 24) return null;
  // PNG signature check: 89 50 4E 47 0D 0A 1A 0A
  if (
    data[0] !== 0x89 ||
    data[1] !== 0x50 ||
    data[2] !== 0x4e ||
    data[3] !== 0x47 ||
    data[4] !== 0x0d ||
    data[5] !== 0x0a ||
    data[6] !== 0x1a ||
    data[7] !== 0x0a
  ) {
    return null;
  }
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const width = view.getUint32(16, false);
  const height = view.getUint32(20, false);
  return { width, height };
}

/**
 * Downloads binary image data from a given URL / relative path in the browser
 */
async function fetchImageAsUint8Array(src: string): Promise<Uint8Array | null> {
  try {
    let resolvedUrl = src;
    if (typeof window !== 'undefined') {
      resolvedUrl = new URL(src, window.location.href).href;
    }
    const response = await fetch(resolvedUrl);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (e) {
    console.warn('Failed to fetch image for docx export:', src, e);
    return null;
  }
}

/**
 * Triggers browser download for a Blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 200);
}

/**
 * Returns role label in Vietnamese
 */
function getRoleLabel(role: RoleTag): string {
  switch (role) {
    case 'SITE':
      return 'Phòng Mặt Bằng';
    case 'ACCOUNTANT':
      return 'Phòng Kế Toán';
    case 'LEGAL':
      return 'Phòng Pháp Lý';
    case 'ADMIN':
      return 'Ban Giám Đốc';
    case 'ALL':
    default:
      return 'Tất Cả Vai Trò';
  }
}

/**
 * Returns role tag color for docx
 */
function getRoleColor(role: RoleTag): string {
  switch (role) {
    case 'SITE':
      return '16A34A'; // Green
    case 'ACCOUNTANT':
      return '0284C7'; // Blue
    case 'LEGAL':
      return 'D97706'; // Amber / Gold
    case 'ADMIN':
      return '4F46E5'; // Indigo
    case 'ALL':
    default:
      return '475569'; // Slate
  }
}

/**
 * Determines semantic styling for a label block
 */
function getLabelSemantic(text: string) {
  const normalized = text.normalize('NFC').trim();
  if (normalized.includes('Việc này để làm gì')) {
    return { icon: '🎯', label: 'MỤC ĐÍCH & Ý NGHĨA', borderColor: COLORS.purposeBorder, bgColor: COLORS.purposeBg };
  }
  if (normalized.includes('Cần chuẩn bị')) {
    return { icon: '📋', label: 'ĐIỀU KIỆN TIÊN QUYẾT', borderColor: COLORS.conditionBorder, bgColor: COLORS.conditionBg };
  }
  if (normalized.includes('Làm theo')) {
    return { icon: '▶️', label: 'HƯỚNG DẪN THỰC HIỆN', borderColor: COLORS.actionBorder, bgColor: COLORS.actionBg };
  }
  if (normalized.includes('Bạn sẽ thấy')) {
    return { icon: '👁️', label: 'KẾT QUẢ KỲ VỌNG', borderColor: COLORS.resultBorder, bgColor: COLORS.resultBg };
  }
  if (normalized.includes('Mẹo hay') || normalized.includes('Lưu ý')) {
    return { icon: '💡', label: 'LƯU Ý NGHIỆP VỤ & MẸO HAY', borderColor: COLORS.cautionBorder, bgColor: COLORS.cautionBg };
  }
  if (normalized.startsWith('Playbook')) {
    return { icon: '⚡', label: 'PLAYBOOK XỬ LÝ SỰ CỐ', borderColor: COLORS.playbookBorder, bgColor: COLORS.playbookBg };
  }
  if (normalized.includes('Thẻ Nghiệp vụ') || normalized.startsWith('Thẻ ')) {
    return { icon: '📌', label: 'THẺ TRA CỨU NHANH', borderColor: COLORS.scenarioBorder, bgColor: COLORS.scenarioBg };
  }
  if (normalized.includes('Bảng tra')) {
    return { icon: '📖', label: 'BẢNG TRA THUẬT NGỮ', borderColor: COLORS.glossaryBorder, bgColor: COLORS.glossaryBg };
  }
  return { icon: '📌', label: 'GHI CHÚ NGHIỆP VỤ', borderColor: COLORS.primary, bgColor: COLORS.primaryLight };
}

/**
 * Builds the Cover Page for the Executive Report
 */
function buildCoverPage(guide: GuideContent): Paragraph[] {
  const borderThin = { style: BorderStyle.SINGLE, size: 1, color: COLORS.borderLight };
  const metadataBorders = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };

  return [
    // Top Organization Header
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 80 },
      children: [
        new TextRun({
          text: 'CÔNG TY CỔ PHẦN MAYCHA',
          bold: true,
          size: 26,
          color: COLORS.primary,
          font: 'Arial',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 600 },
      children: [
        new TextRun({
          text: 'MAYCHA TEA & COFFEE — BAN CÔNG NGHỆ THÔNG TIN & CHUYỂN ĐỔI SỐ',
          bold: true,
          size: 18,
          color: COLORS.textMuted,
          font: 'Arial',
        }),
      ],
    }),

    // Horizontal Rule Accent
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 600 },
      children: [
        new TextRun({
          text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          color: COLORS.primaryLight,
          size: 18,
        }),
      ],
    }),

    // Main Report Title
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 180 },
      children: [
        new TextRun({
          text: 'CẨM NANG HƯỚNG DẪN SỬ DỤNG',
          bold: true,
          size: 48, // 24pt
          color: COLORS.primary,
          font: 'Arial',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 240 },
      children: [
        new TextRun({
          text: 'HỆ THỐNG QUẢN LÝ HỢP ĐỒNG THUÊ MẶT BẰNG',
          bold: true,
          size: 32, // 16pt
          color: COLORS.secondary,
          font: 'Arial',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 600 },
      children: [
        new TextRun({
          text: 'TÀI LIỆU QUY CHUẨN VẬN HÀNH LIÊN PHÒNG BAN TOÀN CHUỖI',
          italics: true,
          size: 22,
          color: COLORS.textDark,
          font: 'Arial',
        }),
      ],
    }),

    // Metadata Specification Box (Clean 2-column table)
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 120 },
      children: [
        new TextRun({
          text: 'THÔNG TIN TÀI LIỆU BÁO CÁO NGHIỆP VỤ',
          bold: true,
          size: 20,
          color: COLORS.primary,
        }),
      ],
    }),

    // Metadata Table wrapped in paragraphs
    new Paragraph({
      spacing: { after: 200 },
      children: [],
    }),
  ];
}

/**
 * Creates the Metadata Table for the Cover Page
 */
function createCoverMetadataTable(guide: GuideContent): Table {
  const labelWidth = 2800;
  const valueWidth = 6560;
  const metaRows: [string, string][] = [
    ['Tên hệ thống:', guide.systemName],
    ['Phiên bản tài liệu:', `v${guide.version} (Cập nhật chuẩn hóa chuỗi)`],
    ['Phạm vi áp dụng:', guide.scope],
    ['Đối tượng sử dụng:', guide.audience],
    ['Tổng số chương / Mục:', `${12} Chương quy chuẩn · ${35} Mục hướng dẫn chi tiết`],
    ['Phân loại tài liệu:', 'TÀI LIỆU NỘI BỘ — LƯU HÀNH BẢO MẬT (INTERNAL USE ONLY)'],
  ];

  return new Table({
    columnWidths: [labelWidth, valueWidth],
    margins: { top: 120, bottom: 120, left: 180, right: 180 },
    rows: metaRows.map(([label, value], idx) => {
      const isLast = idx === metaRows.length - 1;
      return new TableRow({
        children: [
          new TableCell({
            borders: TABLE_CELL_BORDERS,
            width: { size: labelWidth, type: WidthType.DXA },
            shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: label,
                    bold: true,
                    size: 20,
                    color: isLast ? 'DC2626' : COLORS.textDark,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            borders: TABLE_CELL_BORDERS,
            width: { size: valueWidth, type: WidthType.DXA },
            shading: { fill: isLast ? 'FEF2F2' : COLORS.white, type: ShadingType.CLEAR },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: value,
                    bold: isLast,
                    size: 20,
                    color: isLast ? 'DC2626' : COLORS.textDark,
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    }),
  });
}

/**
 * Builds Executive Summary & 8-Step Lifecycle Framework Section
 */
function buildExecutiveOverview(): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      pageBreakBefore: true,
      children: [new TextRun('PHẦN MỞ ĐẦU: TỔNG QUAN HỆ THỐNG & NGUYÊN TẮC VẬN HÀNH')],
    }),
    new Paragraph({
      spacing: { before: 120, after: 120, line: 276 },
      children: [
        new TextRun({
          text: 'Hệ thống Quản lý Hợp đồng Thuê Mặt bằng Maycha (Maycha Lease Contract Management System) là nền tảng số hóa quản trị hợp đồng xuyên suốt từ khảo sát mặt bằng, số hóa tệp scan bằng AI OCR, quản lý dòng tiền thanh toán hàng tháng đến khớp nối bút toán với phần mềm kế toán SAP Business One.',
          size: 22,
          color: COLORS.textDark,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 100, after: 120, line: 276 },
      children: [
        new TextRun({
          text: 'Tài liệu cẩm nang này được biên soạn nhằm chuẩn hóa toàn bộ thao tác vận hành thực tế của 4 phòng ban trọng yếu, áp dụng nghiêm ngặt nguyên tắc ',
          size: 22,
          color: COLORS.textDark,
        }),
        new TextRun({
          text: 'Phân công rõ việc (Segregation of Duties - SoD & Role-Based Access Control - PBAC)',
          bold: true,
          color: COLORS.primary,
          size: 22,
        }),
        new TextRun({
          text: ' nhằm bảo vệ tài sản doanh nghiệp, kiểm soát tính chuẩn xác của hồ sơ pháp lý và ngăn ngừa thất thoát dòng tiền thuê mặt bằng.',
          size: 22,
          color: COLORS.textDark,
        }),
      ],
    })
  );

  // Role Responsibility Matrix Table
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun('1. Ma Trận Phân Định Trách Nhiệm 4 Phòng Ban (PBAC Matrix)')],
    })
  );

  const roleCols = [2200, 3160, 4000];
  const roleTable = new Table({
    columnWidths: roleCols,
    margins: { top: 120, bottom: 120, left: 160, right: 160 },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            borders: TABLE_CELL_BORDERS,
            width: { size: roleCols[0], type: WidthType.DXA },
            shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'Phòng ban / Vai trò', bold: true, color: COLORS.white, size: 20 })],
              }),
            ],
          }),
          new TableCell({
            borders: TABLE_CELL_BORDERS,
            width: { size: roleCols[1], type: WidthType.DXA },
            shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'Phạm vi trách nhiệm chính', bold: true, color: COLORS.white, size: 20 })],
              }),
            ],
          }),
          new TableCell({
            borders: TABLE_CELL_BORDERS,
            width: { size: roleCols[2], type: WidthType.DXA },
            shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'Nghiệp vụ trên hệ thống & Chốt chặn rủi ro', bold: true, color: COLORS.white, size: 20 })],
              }),
            ],
          }),
        ],
      }),
      // Rows for SITE, ACCOUNTANT, LEGAL, ADMIN
      new TableRow({
        children: [
          new TableCell({
            borders: TABLE_CELL_BORDERS,
            width: { size: roleCols[0], type: WidthType.DXA },
            shading: { fill: 'F0FDF4', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Phòng Mặt Bằng\n(SITE)', bold: true, color: '16A34A', size: 20 })],
              }),
            ],
          }),
          new TableCell({
            borders: TABLE_CELL_BORDERS,
            width: { size: roleCols[1], type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Tìm kiếm, đàm phán, khảo sát mặt bằng và tiếp nhận hồ sơ ban đầu.', size: 20 })],
              }),
            ],
          }),
          new TableCell({
            borders: TABLE_CELL_BORDERS,
            width: { size: roleCols[2], type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Tải tệp PDF scan lên AI OCR, rà soát kết quả trích xuất ban đầu, gắn ảnh hiện trạng. Không được phép chỉnh sửa đơn giá kế toán đã khóa.', size: 20 })],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: TABLE_CELL_BORDERS,
            width: { size: roleCols[0], type: WidthType.DXA },
            shading: { fill: 'F0F9FF', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Phòng Kế Toán\n(ACCOUNTANT)', bold: true, color: '0284C7', size: 20 })],
              }),
            ],
          }),
          new TableCell({
            borders: TABLE_CELL_BORDERS,
            width: { size: roleCols[1], type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Kiểm soát tài chính, tiền cọc TK 244, lịch chi trả tiền thuê và kết nối SAP B1.', size: 20 })],
              }),
            ],
          }),
          new TableCell({
            borders: TABLE_CELL_BORDERS,
            width: { size: roleCols[2], type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Ánh xạ Cost Center cửa hàng, CardCode chủ nhà, phê duyệt lịch thanh toán hàng tháng, lập phụ lục thay đổi giá và xuất file bút toán SAP.', size: 20 })],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: TABLE_CELL_BORDERS,
            width: { size: roleCols[0], type: WidthType.DXA },
            shading: { fill: 'FFFBEB', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Phòng Pháp Lý\n(LEGAL)', bold: true, color: 'D97706', size: 20 })],
              }),
            ],
          }),
          new TableCell({
            borders: TABLE_CELL_BORDERS,
            width: { size: roleCols[1], type: WidthType.DXA },
            shading: { fill: COLORS.tableStripe, type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Thẩm định hồ sơ pháp lý, theo dõi thời hạn hợp đồng và thanh lý mặt bằng.', size: 20 })],
              }),
            ],
          }),
          new TableCell({
            borders: TABLE_CELL_BORDERS,
            width: { size: roleCols[2], type: WidthType.DXA },
            shading: { fill: COLORS.tableStripe, type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Đánh giá thước đo sức khỏe hồ sơ, giám sát hệ thống cảnh báo hạn Đỏ/Vàng/Xanh, thực hiện quy trình thanh lý và đối soát cọc.', size: 20 })],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: TABLE_CELL_BORDERS,
            width: { size: roleCols[0], type: WidthType.DXA },
            shading: { fill: 'F5F3FF', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Ban Giám Đốc\n(ADMIN)', bold: true, color: '4F46E5', size: 20 })],
              }),
            ],
          }),
          new TableCell({
            borders: TABLE_CELL_BORDERS,
            width: { size: roleCols[1], type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Điều hành chiến lược toàn chuỗi, giám sát P&L và bảo mật hệ thống.', size: 20 })],
              }),
            ],
          }),
          new TableCell({
            borders: TABLE_CELL_BORDERS,
            width: { size: roleCols[2], type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Truy cập Dashboard 360 độ, phân quyền người dùng, quản trị nhật ký kiểm toán (Audit Trail) và phê duyệt các ngoại lệ vận hành.', size: 20 })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
  elements.push(roleTable);

  // 8-Step Collaborative Workflow
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      children: [new TextRun('2. Quy Trình Vận Hành Hợp Đồng 8 Bước Toàn Vòng Đời')],
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'Vòng đời một hợp đồng thuê mặt bằng Maycha vận hành qua 8 mắt xích chuẩn hóa, đảm bảo dữ liệu chuyển giao thông suốt giữa Mặt bằng, Kế toán và Pháp chế:',
          size: 22,
        }),
      ],
    })
  );

  const workflowSteps = [
    { n: 1, title: 'Khảo sát & Tiếp nhận', role: 'Phòng Mặt Bằng (SITE)', desc: 'Khảo sát mặt bằng, thu thập hồ sơ pháp lý bên A và tiếp nhận bản gốc.' },
    { n: 2, title: 'Số hóa AI OCR', role: 'Mặt Bằng & Pháp Lý', desc: 'Tải scan PDF lên mô hình AI OCR, đối chiếu song song và rà soát tính toàn vẹn.' },
    { n: 3, title: 'Chuẩn hóa Dữ liệu Nền tảng', role: 'Phòng Kế Toán', desc: 'Đồng bộ mã cửa hàng (Cost Center) và mã nhà cung cấp (CardCode) chuẩn SAP B1.' },
    { n: 4, title: 'Giám sát Danh sách & Bộ lọc', role: 'Toàn Bộ Phòng Ban', desc: 'Theo dõi tình trạng hiệu lực (ACTIVE, Sắp hết hạn, Thanh lý) qua console tập trung.' },
    { n: 5, title: 'Quản trị Hồ sơ Pháp lý & Hạn', role: 'Phòng Pháp Lý (LEGAL)', desc: 'Kiểm tra thước đo sức khỏe hồ sơ, tài liệu PDF đính kèm và cảnh báo gia hạn.' },
    { n: 6, title: 'Quản trị Tài chính & Khóa', role: 'Phòng Kế Toán (ACCOUNTANT)', desc: 'Tự động tính lịch thanh toán, cấn trừ cọc, khóa điều khoản tài chính chỉ đọc.' },
    { n: 7, title: 'Lập Phụ lục Điều chỉnh', role: 'Kế Toán & Pháp Lý', desc: 'Khởi tạo phụ lục thay đổi chủ tài khoản thụ hưởng hoặc điều chỉnh giá thuê.' },
    { n: 8, title: 'Thanh lý & Quyết toán Cọc', role: 'Pháp Lý & Kế Toán', desc: 'Biên bản thanh lý, quyết toán cọc TK 244 và xuất đợt thanh toán sang SAP B1.' },
  ];

  const wfCols = [1000, 2600, 2200, 3560];
  const wfTable = new Table({
    columnWidths: wfCols,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            borders: TABLE_CELL_BORDERS,
            width: { size: wfCols[0], type: WidthType.DXA },
            shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Bước', bold: true, color: COLORS.white, size: 20 })] })],
          }),
          new TableCell({
            borders: TABLE_CELL_BORDERS,
            width: { size: wfCols[1], type: WidthType.DXA },
            shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ children: [new TextRun({ text: 'Tên giai đoạn quy trình', bold: true, color: COLORS.white, size: 20 })] })],
          }),
          new TableCell({
            borders: TABLE_CELL_BORDERS,
            width: { size: wfCols[2], type: WidthType.DXA },
            shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ children: [new TextRun({ text: 'Đơn vị chủ trì', bold: true, color: COLORS.white, size: 20 })] })],
          }),
          new TableCell({
            borders: TABLE_CELL_BORDERS,
            width: { size: wfCols[3], type: WidthType.DXA },
            shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ children: [new TextRun({ text: 'Hành động trọng tâm', bold: true, color: COLORS.white, size: 20 })] })],
          }),
        ],
      }),
      ...workflowSteps.map((step, idx) => {
        const isStripe = idx % 2 === 1;
        return new TableRow({
          children: [
            new TableCell({
              borders: TABLE_CELL_BORDERS,
              width: { size: wfCols[0], type: WidthType.DXA },
              shading: { fill: isStripe ? COLORS.tableStripe : COLORS.white, type: ShadingType.CLEAR },
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `0${step.n}`, bold: true, color: COLORS.primary, size: 20 })] })],
            }),
            new TableCell({
              borders: TABLE_CELL_BORDERS,
              width: { size: wfCols[1], type: WidthType.DXA },
              shading: { fill: isStripe ? COLORS.tableStripe : COLORS.white, type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: step.title, bold: true, size: 20, color: COLORS.textDark })] })],
            }),
            new TableCell({
              borders: TABLE_CELL_BORDERS,
              width: { size: wfCols[2], type: WidthType.DXA },
              shading: { fill: isStripe ? COLORS.tableStripe : COLORS.white, type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: step.role, bold: true, size: 19, color: COLORS.secondary })] })],
            }),
            new TableCell({
              borders: TABLE_CELL_BORDERS,
              width: { size: wfCols[3], type: WidthType.DXA },
              shading: { fill: isStripe ? COLORS.tableStripe : COLORS.white, type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: step.desc, size: 19, color: COLORS.textDark })] })],
            }),
          ],
        });
      }),
    ],
  });
  elements.push(wfTable);

  return elements;
}

/**
 * Builds the Executive Table of Contents mapping all 12 chapters and 35 sections
 */
function buildExecutiveTocSection(guide: GuideContent): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      pageBreakBefore: true,
      children: [new TextRun('MỤC LỤC TÀI LIỆU (TABLE OF CONTENTS)')],
    }),
    new Paragraph({
      spacing: { before: 80, after: 180 },
      children: [
        new TextRun({
          text: 'Tài liệu hướng dẫn bao gồm 12 Chương nghiệp vụ và 35 Mục thao tác chi tiết, được cấu trúc theo đúng vòng đời thực tế của hợp đồng:',
          italics: true,
          size: 21,
          color: COLORS.textMuted,
        }),
      ],
    })
  );

  // 1. Native Word TOC field
  elements.push(
    new TableOfContents('Mục lục chi tiết', {
      hyperlink: true,
      headingStyleRange: '1-2',
    }),
    new Paragraph({
      spacing: { before: 180, after: 120 },
      children: [
        new TextRun({
          text: 'BẢNG DANH MỤC CÁC CHƯƠNG & NGHIỆP VỤ TRỌNG TÂM',
          bold: true,
          size: 22,
          color: COLORS.primary,
        }),
      ],
    })
  );

  // 2. Structured Executive Roadmap Table
  const tocCols = [1400, 3600, 3160, 1200];
  const tocRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          borders: TABLE_CELL_BORDERS,
          width: { size: tocCols[0], type: WidthType.DXA },
          shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Chương', bold: true, color: COLORS.white, size: 20 })] })],
        }),
        new TableCell({
          borders: TABLE_CELL_BORDERS,
          width: { size: tocCols[1], type: WidthType.DXA },
          shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({ children: [new TextRun({ text: 'Tên chương nghiệp vụ', bold: true, color: COLORS.white, size: 20 })] })],
        }),
        new TableCell({
          borders: TABLE_CELL_BORDERS,
          width: { size: tocCols[2], type: WidthType.DXA },
          shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({ children: [new TextRun({ text: 'Các mục thao tác chi tiết', bold: true, color: COLORS.white, size: 20 })] })],
        }),
        new TableCell({
          borders: TABLE_CELL_BORDERS,
          width: { size: tocCols[3], type: WidthType.DXA },
          shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Vai trò', bold: true, color: COLORS.white, size: 20 })] })],
        }),
      ],
    }),
  ];

  // Group sections by chapter
  let currentChapTitle = '';
  let currentChapNum = '';
  let currentRole: RoleTag = 'ALL';
  let sectionTitles: string[] = [];

  for (const s of guide.sections) {
    if (s.level === 1) {
      if (currentChapTitle) {
        const isStripe = tocRows.length % 2 === 0;
        tocRows.push(
          new TableRow({
            children: [
              new TableCell({
                borders: TABLE_CELL_BORDERS,
                width: { size: tocCols[0], type: WidthType.DXA },
                shading: { fill: isStripe ? COLORS.tableStripe : COLORS.white, type: ShadingType.CLEAR },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: currentChapNum, bold: true, color: COLORS.primary, size: 20 })] })],
              }),
              new TableCell({
                borders: TABLE_CELL_BORDERS,
                width: { size: tocCols[1], type: WidthType.DXA },
                shading: { fill: isStripe ? COLORS.tableStripe : COLORS.white, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: currentChapTitle, bold: true, size: 20, color: COLORS.textDark })] })],
              }),
              new TableCell({
                borders: TABLE_CELL_BORDERS,
                width: { size: tocCols[2], type: WidthType.DXA },
                shading: { fill: isStripe ? COLORS.tableStripe : COLORS.white, type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: sectionTitles.length > 0 ? sectionTitles.join(' • ') : 'Nội dung cơ sở & thuật ngữ tra cứu',
                        size: 19,
                        color: COLORS.textMuted,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                borders: TABLE_CELL_BORDERS,
                width: { size: tocCols[3], type: WidthType.DXA },
                shading: { fill: isStripe ? COLORS.tableStripe : COLORS.white, type: ShadingType.CLEAR },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: currentRole, bold: true, size: 18, color: getRoleColor(currentRole) })],
                  }),
                ],
              }),
            ],
          })
        );
      }
      currentChapTitle = s.title.replace(/^Chương\s*\d+\.\s*/i, '');
      const match = s.title.match(/Chương\s*(\d+)/i);
      currentChapNum = match ? `Chương ${match[1]}` : 'Chương';
      currentRole = s.role;
      sectionTitles = [];
    } else {
      sectionTitles.push(s.title);
    }
  }

  // Push the last chapter
  if (currentChapTitle) {
    const isStripe = tocRows.length % 2 === 0;
    tocRows.push(
      new TableRow({
        children: [
          new TableCell({
            borders: TABLE_CELL_BORDERS,
            width: { size: tocCols[0], type: WidthType.DXA },
            shading: { fill: isStripe ? COLORS.tableStripe : COLORS.white, type: ShadingType.CLEAR },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: currentChapNum, bold: true, color: COLORS.primary, size: 20 })] })],
          }),
          new TableCell({
            borders: TABLE_CELL_BORDERS,
            width: { size: tocCols[1], type: WidthType.DXA },
            shading: { fill: isStripe ? COLORS.tableStripe : COLORS.white, type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: currentChapTitle, bold: true, size: 20, color: COLORS.textDark })] })],
          }),
          new TableCell({
            borders: TABLE_CELL_BORDERS,
            width: { size: tocCols[2], type: WidthType.DXA },
            shading: { fill: isStripe ? COLORS.tableStripe : COLORS.white, type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: sectionTitles.length > 0 ? sectionTitles.join(' • ') : 'Quy chuẩn vận hành nhanh',
                    size: 19,
                    color: COLORS.textMuted,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            borders: TABLE_CELL_BORDERS,
            width: { size: tocCols[3], type: WidthType.DXA },
            shading: { fill: isStripe ? COLORS.tableStripe : COLORS.white, type: ShadingType.CLEAR },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: currentRole, bold: true, size: 18, color: getRoleColor(currentRole) })],
              }),
            ],
          }),
        ],
      })
    );
  }

  elements.push(new Table({ columnWidths: tocCols, margins: { top: 100, bottom: 100, left: 140, right: 140 }, rows: tocRows }));
  return elements;
}

/**
 * Renders a label block as an attractive callout box (Single-cell table with colored thick left border)
 */
function renderLabelBlock(text: string): Table {
  const semantic = getLabelSemantic(text);
  const cellBorder = {
    left: { style: BorderStyle.SINGLE, size: 24, color: semantic.borderColor }, // 3pt accent border
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  };

  return new Table({
    columnWidths: [USABLE_PAGE_WIDTH],
    margins: { top: 100, bottom: 100, left: 200, right: 160 },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorder,
            width: { size: USABLE_PAGE_WIDTH, type: WidthType.DXA },
            shading: { fill: semantic.bgColor, type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({
                    text: `${semantic.icon} ${text}`,
                    bold: true,
                    size: 21,
                    color: semantic.borderColor === COLORS.primary ? COLORS.primary : '0F172A',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

/**
 * Renders a table block cleanly in Word
 */
function renderTableBlock(block: TableBlock): Table {
  const cols = Math.max(1, block.headers.length);
  const baseWidth = Math.floor(USABLE_PAGE_WIDTH / cols);
  const colWidths = Array.from({ length: cols }, (_, i) =>
    i === cols - 1 ? USABLE_PAGE_WIDTH - baseWidth * (cols - 1) : baseWidth
  );

  const headerRow = new TableRow({
    tableHeader: true,
    children: block.headers.map((h, i) => {
      const colWidth = colWidths[i] ?? baseWidth;
      return new TableCell({
        borders: TABLE_CELL_BORDERS,
        width: { size: colWidth, type: WidthType.DXA },
        shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: h,
                bold: true,
                size: 20,
                color: COLORS.white,
              }),
            ],
          }),
        ],
      });
    }),
  });

  const bodyRows = block.rows.map((row, rIdx) => {
    const isStripe = rIdx % 2 === 1;
    return new TableRow({
      children: Array.from({ length: cols }, (_, cIdx) => {
        const cellText = row[cIdx] ?? '';
        const colWidth = colWidths[cIdx] ?? baseWidth;
        return new TableCell({
          borders: TABLE_CELL_BORDERS,
          width: { size: colWidth, type: WidthType.DXA },
          shading: { fill: isStripe ? COLORS.tableStripe : COLORS.white, type: ShadingType.CLEAR },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: cellText,
                  size: 20,
                  color: COLORS.textDark,
                }),
              ],
            }),
          ],
        });
      }),
    });
  });

  return new Table({
    columnWidths: colWidths,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    rows: [headerRow, ...bodyRows],
  });
}

/**
 * Renders step items with clean bold step prefixes
 */
function renderStepParagraph(item: string): Paragraph {
  // Check for step format: e.g. "Bước 1 [1]: ..." or "Bước 1: ..."
  const match = item.match(/^(Bước\s*\d+(?:\s*\[[^\]]+\])?:\s*)(.*)$/);
  if (match) {
    const [, prefix, body] = match;
    return new Paragraph({
      spacing: { before: 60, after: 80, line: 260 },
      indent: { left: 360 },
      children: [
        new TextRun({
          text: prefix,
          bold: true,
          color: COLORS.primary,
          size: 21,
        }),
        new TextRun({
          text: body,
          color: COLORS.textDark,
          size: 21,
        }),
      ],
    });
  }

  return new Paragraph({
    spacing: { before: 60, after: 80, line: 260 },
    indent: { left: 360 },
    children: [
      new TextRun({
        text: item,
        color: COLORS.textDark,
        size: 21,
      }),
    ],
  });
}

/**
 * Main export function: reads GuideContent, fetches all screenshots, builds
 * a comprehensive executive docx report, and downloads it to the user's computer.
 */
export async function exportGuideToDocx(
  guide: GuideContent,
  onProgress?: (percent: number, status: string) => void
): Promise<void> {
  onProgress?.(5, 'Đang chuẩn bị tài liệu và kiểm tra cấu trúc...');

  // 1. Collect all images to pre-fetch
  const imageMap = new Map<string, Uint8Array | null>();
  const imageBlocks: { src: string; alt: string; caption: string }[] = [];

  for (const section of guide.sections) {
    for (const block of section.blocks) {
      if (block.type === 'image' && !imageMap.has(block.src)) {
        imageMap.set(block.src, null);
        imageBlocks.push(block);
      }
    }
  }

  const totalImages = imageBlocks.length;
  onProgress?.(10, `Đang tải hình ảnh minh họa (0/${totalImages})...`);

  // Fetch images in concurrency batches of 6
  let loadedImages = 0;
  const BATCH_SIZE = 6;
  for (let i = 0; i < totalImages; i += BATCH_SIZE) {
    const batch = imageBlocks.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (img) => {
        const data = await fetchImageAsUint8Array(img.src);
        imageMap.set(img.src, data);
        loadedImages++;
      })
    );
    const progress = Math.round(10 + (loadedImages / totalImages) * 65);
    onProgress?.(progress, `Đang tải hình ảnh minh họa (${loadedImages}/${totalImages})...`);
  }

  onProgress?.(80, 'Đang khởi tạo mục lục và dàn trang báo cáo Word...');

  const children: (Paragraph | Table)[] = [];

  // 1. Cover Page
  children.push(...buildCoverPage(guide));
  children.push(createCoverMetadataTable(guide));
  children.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  // 2. Executive Overview & 8-Step Lifecycle
  children.push(...buildExecutiveOverview());
  children.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  // 3. Executive Table of Contents (Report Roadmap + Native TOC)
  children.push(...buildExecutiveTocSection(guide));
  children.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  // 4. Chapters and Sections
  onProgress?.(88, 'Đang xuất nội dung 12 Chương nghiệp vụ...');

  let chapterIdx = 0;
  for (const section of guide.sections) {
    if (section.level === 1) {
      chapterIdx++;
      // Heading 1 for Chapters
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          pageBreakBefore: true,
          spacing: { before: 240, after: 160 },
          children: [
            new TextRun({
              text: section.title,
              bold: true,
              size: 32,
              color: COLORS.primary,
            }),
          ],
        })
      );
    } else {
      // Heading 2 for Sections
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 280, after: 120 },
          children: [
            new TextRun({
              text: section.title,
              bold: true,
              size: 26,
              color: COLORS.secondary,
            }),
            new TextRun({
              text: `   [${getRoleLabel(section.role)}]`,
              bold: true,
              size: 19,
              color: getRoleColor(section.role),
            }),
          ],
        })
      );
    }

    // Render Blocks
    for (const block of section.blocks) {
      switch (block.type) {
        case 'paragraph': {
          children.push(
            new Paragraph({
              spacing: { before: 80, after: 120, line: 276 },
              children: [
                new TextRun({
                  text: block.text,
                  size: 22,
                  color: COLORS.textDark,
                }),
              ],
            })
          );
          break;
        }

        case 'label': {
          children.push(renderLabelBlock(block.text));
          children.push(new Paragraph({ spacing: { after: 100 }, children: [] }));
          break;
        }

        case 'steps': {
          for (const item of block.items) {
            children.push(renderStepParagraph(item));
          }
          children.push(new Paragraph({ spacing: { after: 100 }, children: [] }));
          break;
        }

        case 'bullets': {
          for (const item of block.items) {
            children.push(
              new Paragraph({
                numbering: { reference: 'bullet-list', level: 0 },
                spacing: { before: 40, after: 60, line: 260 },
                children: [
                  new TextRun({
                    text: item,
                    size: 21,
                    color: COLORS.textDark,
                  }),
                ],
              })
            );
          }
          children.push(new Paragraph({ spacing: { after: 100 }, children: [] }));
          break;
        }

        case 'table': {
          children.push(renderTableBlock(block));
          children.push(new Paragraph({ spacing: { after: 140 }, children: [] }));
          break;
        }

        case 'image': {
          const imgData = imageMap.get(block.src);
          if (imgData) {
            const dims = getPngDimensions(imgData);
            const origW = dims ? dims.width : 2880;
            const origH = dims ? dims.height : 1800;
            // Target width in DXA/points (520pt fits Letter/A4 comfortably)
            const targetW = 520;
            const targetH = Math.min(360, Math.round(targetW * (origH / origW)));

            children.push(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 160, after: 60 },
                children: [
                  new ImageRun({
                    type: 'png',
                    data: imgData,
                    transformation: { width: targetW, height: targetH },
                    altText: {
                      title: block.alt || block.caption,
                      description: block.caption,
                      name: block.alt,
                    },
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 180 },
                children: [
                  new TextRun({
                    text: block.caption,
                    italics: true,
                    size: 18,
                    color: COLORS.textMuted,
                  }),
                ],
              })
            );
          } else {
            // Fallback if image could not be fetched
            children.push(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 100, after: 100 },
                children: [
                  new TextRun({
                    text: `[Minh họa trực quan: ${block.caption}]`,
                    italics: true,
                    size: 20,
                    color: COLORS.textMuted,
                  }),
                ],
              })
            );
          }
          break;
        }

        default:
          break;
      }
    }
  }

  onProgress?.(94, 'Đang đóng gói và nén tệp Word (.docx)...');

  // Build Document
  const doc = new Document({
    features: {
      updateFields: true,
    },
    title: guide.title,
    description: guide.scope,
    creator: 'Maycha Contract Management System',
    styles: {
      default: {
        document: {
          run: { font: 'Arial', size: 22, color: COLORS.textDark },
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 32, bold: true, color: COLORS.primary, font: 'Arial' },
          paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 0 },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 26, bold: true, color: COLORS.secondary, font: 'Arial' },
          paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: 'bullet-list',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 720, hanging: 360 } },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }, // 1-inch margins
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Hệ Thống Quản Lý Hợp Đồng Maycha · Cẩm Nang Vận Hành Chuỗi v2.0',
                    size: 16,
                    color: '94A3B8',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'CÔNG TY CỔ PHẦN MAYCHA — BẢO MẬT NỘI BỘ   |   Trang ',
                    size: 18,
                    color: '94A3B8',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    color: '94A3B8',
                  }),
                  new TextRun({
                    text: ' / ',
                    size: 18,
                    color: '94A3B8',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    color: '94A3B8',
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);

  onProgress?.(99, 'Đang gửi tệp xuống máy tính của bạn...');

  const cleanFilename = 'Maycha-Cam-Nang-Huong-Dan-Su-Dung-v2.0.docx';
  downloadBlob(blob, cleanFilename);

  onProgress?.(100, 'Tải file Word (.docx) thành công!');
}
