import { useEffect } from 'react';
import { Tag } from 'antd';
import type { ChapterGroup } from '../content/guide-chapters';

interface GuideSidebarProps {
  chapterGroups: ChapterGroup[];
  activeSectionId: string;
  onSelectSection: (id: string) => void;
}

export function GuideSidebar({
  chapterGroups,
  activeSectionId,
  onSelectSection,
}: GuideSidebarProps) {
  useEffect(() => {
    if (!activeSectionId) return;
    try {
      const activeEl = document.querySelector(`.sidebar-section-link[href="#${activeSectionId}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    } catch {
      // ignore invalid selector characters
    }
  }, [activeSectionId]);

  return (
    <aside className="guide-sidebar-container">
      <nav className="guide-sidebar" aria-label="Mục lục hướng dẫn">
        <div className="sidebar-title">Mục lục tài liệu</div>
        {chapterGroups.map((group) => {
          const isChapterActive =
            activeSectionId === group.chapterSection.id ||
            group.sections.some((sec) => sec.id === activeSectionId);

          return (
            <div key={group.id} className="sidebar-chapter-group">
              <div
                className={`sidebar-chapter-header ${isChapterActive ? 'active' : ''}`}
                onClick={() => onSelectSection(group.chapterSection.id)}
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
      </nav>
    </aside>
  );
}
