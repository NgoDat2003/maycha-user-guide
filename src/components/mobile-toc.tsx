import { Drawer, Tag } from 'antd';
import type { ChapterGroup } from '../content/guide-chapters';

interface MobileTocProps {
  open: boolean;
  onClose: () => void;
  chapterGroups: ChapterGroup[];
  activeSectionId: string;
  onSelectSection: (id: string) => void;
}

export function MobileToc({
  open,
  onClose,
  chapterGroups,
  activeSectionId,
  onSelectSection,
}: MobileTocProps) {
  return (
    <Drawer
      title="Mục lục hướng dẫn"
      placement="left"
      onClose={onClose}
      open={open}
      width={320}
      styles={{ body: { padding: '16px' } }}
    >
      <div className="mobile-toc-content">
        {chapterGroups.map((group) => {
          const isChapterActive =
            activeSectionId === group.chapterSection.id ||
            group.sections.some((sec) => sec.id === activeSectionId);

          return (
            <div key={group.id} className="sidebar-chapter-group">
              <div
                className={`sidebar-chapter-header ${isChapterActive ? 'active' : ''}`}
                onClick={() => {
                  onSelectSection(group.chapterSection.id);
                  onClose();
                }}
              >
                <span>{group.chapterSection.title}</span>
              </div>
              {group.sections.length > 0 ? (
                <ul className="sidebar-section-list">
                  {group.sections.map((section) => {
                    const isActive = activeSectionId === section.id;
                    const imageCount = section.blocks.filter((b) => b.type === 'image').length;

                    return (
                      <li key={section.id} className="sidebar-section-item">
                        <a
                          href={`#${section.id}`}
                          className={`sidebar-section-link ${isActive ? 'active' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            onSelectSection(section.id);
                            onClose();
                          }}
                        >
                          <span>{section.title}</span>
                          {imageCount > 0 ? (
                            <Tag color="default" style={{ margin: 0, fontSize: 10, padding: '0 4px' }}>
                              📷 {imageCount}
                            </Tag>
                          ) : null}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </Drawer>
  );
}
