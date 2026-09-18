import { Alert, Empty, Image, Tag } from 'antd';
import type { GuideContent, GuideSection } from '../types/guide';
import { GuideSectionView } from './guide-section-view';

interface GuideContentViewProps {
  guide: GuideContent;
  sections: GuideSection[];
}

export function GuideContentView({ guide, sections }: GuideContentViewProps) {
  return (
    <article className="guide-article">
      <header className="document-cover">
        <div className="cover-badge-row">
          <Tag color="blue">{guide.systemName}</Tag>
          <Tag color="gold">Phiên bản {guide.version}</Tag>
        </div>
        <h1>{guide.title}</h1>
        <p className="guide-paragraph">
          <strong>Phạm vi:</strong> {guide.scope}
        </p>
        <p className="guide-paragraph">
          <strong>Đối tượng áp dụng:</strong> {guide.audience}
        </p>
        <div className="cover-notice">
          <Alert message="Lưu ý vận hành" description={guide.notice} type="info" showIcon />
        </div>
      </header>

      {sections.length === 0 ? (
        <div className="guide-empty-state" style={{ padding: '64px 0', textAlign: 'center' }}>
          <Empty description="Không tìm thấy mục hoặc nội dung phù hợp với từ khóa tìm kiếm" />
        </div>
      ) : (
        <Image.PreviewGroup>
          {sections.map((section) => (
            <GuideSectionView key={section.id} section={section} />
          ))}
        </Image.PreviewGroup>
      )}
    </article>
  );
}
