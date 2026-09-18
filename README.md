# Maycha Contract User Guide Web - Standalone Documentation SPA

Cẩm nang Hướng dẫn Sử dụng Hệ thống Quản lý Hợp đồng Maycha dạng Standalone Single Page Application (SPA), xây dựng hoàn toàn độc lập với Vite 7 + React 19 + TypeScript (strict) + Ant Design 5.

## 1. Tổng quan Kiến trúc

- **Runtime**: Zero-backend, Zero-database, Zero-env. Dữ liệu tĩnh 100% nạp từ `src/content/guide-content.json`.
- **Cấu trúc nội dung**: 10 Chương & 34 Mục nghiệp vụ chuẩn 6 thành phần:
  1. *Dành cho* (Vai trò PBAC)
  2. *Mục đích* (Tác động nghiệp vụ)
  3. *Điều kiện thực hiện*
  4. *Cách thao tác* (3 - 7 bước thao tác + ảnh chụp thực tế)
  5. *Kết quả hiển thị*
  6. *Lưu ý nghiệp vụ & bẫy sai sót* (2 - 4 cảnh báo)
- **Minh họa**: 34 ảnh chụp màn hình thực tế từ hệ thống `http://localhost:36000` (viewport `1440x900`, `deviceScaleFactor: 2`, format PNG sắc nét > 200KB).
- **Bộ tính năng**:
  - Mục lục phân cấp 10 chương kèm scroll spy tự động highlight vị trí đang đọc.
  - Tìm kiếm nhanh nội dung và lọc mục lục thời gian thực.
  - Phóng to ảnh (Lightbox Gallery) với Ant Design Image PreviewGroup.
  - Responsive hoàn chỉnh (Sidebar desktop -> Drawer trên mobile < 768px).
  - Tối ưu hóa in ấn (`@media print`) cho phép xuất PDF tài liệu chuẩn bản in.

## 2. Cấu trúc Thư mục

```
outputs/contract-user-guide-web/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── playwright.config.ts
├── README.md
├── scripts/
│   ├── capture-screenshots.mjs      # Playwright script chụp 34 ảnh tự động
│   ├── capture-targets.mjs          # Định nghĩa 34 mục tiêu và selectors
│   ├── build-guide-content.cjs      # Validator 13 cổng kiểm định nội dung
│   ├── audit-assets.cjs             # Kiểm tra tính toàn vẹn 34 file ảnh PNG
│   └── generate-guide-content.mjs   # Script sinh dữ liệu guide-content.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── styles.css                   # Bảng màu thương hiệu Maycha & responsive
│   ├── types/
│   │   └── guide.ts                 # Type contract GuideContent
│   ├── content/
│   │   ├── guide-content.json       # Dữ liệu nội dung 10 chương / 34 mục
│   │   ├── guide-content.ts         # Type-safe wrapper
│   │   ├── guide-chapters.ts        # Helper nhóm chương và đếm ảnh
│   │   └── evidence-ledger.json     # Nhật ký bằng chứng 34 ảnh chụp
│   └── components/
│       ├── guide-header.tsx         # Header, tìm kiếm, nút in
│       ├── guide-sidebar.tsx        # Mục lục desktop kèm scroll spy
│       ├── mobile-toc.tsx           # Drawer mục lục mobile
│       ├── guide-content-view.tsx   # Khung bài viết và bìa tài liệu
│       ├── guide-section-view.tsx   # Hiển thị từng mục nghiệp vụ
│       └── guide-block-renderer.tsx # Renderer 6 loại block (text, tag, steps, table, img)
├── tests/
│   └── guide-smoke.spec.ts          # Playwright E2E smoke test (34 ảnh, TOC, lightbox)
└── public/
    └── assets/
        └── user-guide/
            └── 2026-09-contract-guide/  # 34 tệp ảnh PNG chụp thực tế
```

## 3. Lệnh Phát triển & Kiểm định

```bash
# Cài đặt thư viện
npm install

# Khởi chạy môi trường phát triển (Port 5173)
npm run dev

# Kiểm tra tính toàn vẹn nội dung (13 cổng kiểm định)
npm run validate

# Kiểm tra dung lượng và tệp ảnh (>20KB, đủ 34 tệp)
npm run audit:assets

# Chụp lại 34 ảnh tự động qua Playwright (yêu cầu http://localhost:36000 đang chạy)
npm run capture

# Build production sạch (Validator -> Audit -> TypeScript -> Vite Build)
npm run build

# Chạy bản build thử nghiệm (Port 4173)
npm run preview

# Chạy Playwright E2E Smoke test kiểm tra 34 ảnh, anchor TOC và lightbox
npm run test:smoke
```

## 4. Cấu hình Triển khai (Deployment)

Dự án có thể deploy lên bất kỳ static hosting nào (Vercel, Cloudflare Pages, Netlify, Nginx):
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node.js Version**: >= 18
