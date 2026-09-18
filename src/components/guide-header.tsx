import { Input, Tag, Button } from 'antd';
import { MenuOutlined, PrinterOutlined } from '@ant-design/icons';
import type { GuideContent } from '../types/guide';

interface GuideHeaderProps {
  guide: GuideContent;
  chapterCount: number;
  sectionCount: number;
  imageCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenMobileToc: () => void;
}

export function GuideHeader({
  guide,
  chapterCount,
  sectionCount,
  imageCount,
  searchQuery,
  onSearchChange,
  onOpenMobileToc,
}: GuideHeaderProps) {
  return (
    <header className="guide-header">
      <div className="guide-header-inner">
        <div className="brand-section">
          <Button
            className="mobile-toc-toggle"
            icon={<MenuOutlined />}
            onClick={onOpenMobileToc}
            aria-label="Mở mục lục"
          />
          <div className="brand-mark" aria-hidden="true">
            MC
          </div>
          <div className="brand-title-wrap">
            <h1>{guide.title}</h1>
            <p className="brand-subtitle">{guide.systemName} · v{guide.version}</p>
          </div>
        </div>

        <div className="header-meta">
          <Tag color="geekblue">{chapterCount} Chương</Tag>
          <Tag color="blue">{sectionCount} Mục nghiệp vụ</Tag>
          <Tag color="cyan">{imageCount} Ảnh minh họa</Tag>

          <Input.Search
            placeholder="Tìm kiếm mục lục / nội dung..."
            className="header-search"
            allowClear
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />

          <Button
            icon={<PrinterOutlined />}
            onClick={() => window.print()}
            className="print-btn"
            title="In cẩm nang / Xuất PDF"
          >
            In tài liệu
          </Button>
        </div>
      </div>
    </header>
  );
}
