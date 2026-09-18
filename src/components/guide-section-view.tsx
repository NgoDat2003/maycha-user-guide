import { Tag } from 'antd';
import type { GuideSection, RoleTag } from '../types/guide';
import { GuideBlockRenderer } from './guide-block-renderer';

interface GuideSectionViewProps {
  section: GuideSection;
}

const ROLE_COLORS: Record<RoleTag, string> = {
  ADMIN: 'purple',
  SITE: 'blue',
  ACCOUNTANT: 'green',
  LEGAL: 'orange',
  ALL: 'cyan',
};

export function GuideSectionView({ section }: GuideSectionViewProps) {
  return (
    <section id={section.id} className={`guide-section level-${section.level}`}>
      {section.level === 1 ? (
        <h2>{section.title}</h2>
      ) : (
        <h3>
          <span>{section.title}</span>
          {section.role ? (
            <Tag color={ROLE_COLORS[section.role] || 'default'} className="role-tag">
              {section.role}
            </Tag>
          ) : null}
        </h3>
      )}
      <div className="section-body">
        {section.blocks.map((block, idx) => (
          <GuideBlockRenderer key={`${section.id}-${idx}`} block={block} />
        ))}
      </div>
    </section>
  );
}
