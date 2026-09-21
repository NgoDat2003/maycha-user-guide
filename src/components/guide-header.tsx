import { useState } from 'react';
import { Input, Tag, Button, Tooltip, message } from 'antd';
import { MenuOutlined, FileWordOutlined, PrinterOutlined } from '@ant-design/icons';
import type { GuideContent } from '../types/guide';
import { exportGuideToDocx } from '../lib/export-docx';

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
  const [isExporting, setIsExporting] = useState(false);

  const handleExportWord = async () => {
    if (isExporting) return;
    setIsExporting(true);
    message.loading({
      content: 'Đang chuẩn bị xuất file Word (.docx)...',
      key: 'docx-export-key',
      duration: 0,
    });

    try {
      await exportGuideToDocx(guide, (percent, status) => {
        message.loading({
          content: `${status} (${percent}%)`,
          key: 'docx-export-key',
          duration: 0,
        });
      });
      message.success({
        content: 'Đã tải cẩm nang hướng dẫn sử dụng Maycha (.docx) thành công!',
        key: 'docx-export-key',
        duration: 4,
      });
    } catch (err: unknown) {
      console.error('Lỗi khi xuất Word:', err);
      const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định';
      message.error({
        content: `Không thể xuất file Word: ${errorMessage}`,
        key: 'docx-export-key',
        duration: 5,
      });
    } finally {
      setIsExporting(false);
    }
  };

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

          <div className="doc-actions-group">
            <Tooltip title="Xuất toàn bộ cẩm nang hướng dẫn ra file Word (.docx) chuẩn báo cáo thuyết trình kèm mục lục đầy đủ">
              <Button
                type="primary"
                icon={<FileWordOutlined />}
                onClick={handleExportWord}
                loading={isExporting}
                className="export-word-btn"
              >
                {isExporting ? 'Đang xuất Word...' : 'Xuất file Word (.docx)'}
              </Button>
            </Tooltip>
            <Tooltip title="In tài liệu / Lưu PDF trình duyệt">
              <Button
                icon={<PrinterOutlined />}
                onClick={() => window.print()}
                className="print-btn"
                aria-label="In tài liệu"
              />
            </Tooltip>
          </div>
        </div>
      </div>
    </header>
  );
}
