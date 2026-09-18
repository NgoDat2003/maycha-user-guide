import type { GuideSection } from '../types/guide';

export interface ChapterGroup {
  id: string;
  chapterNumber: number;
  chapterSection: GuideSection;
  sections: GuideSection[];
}

export function getChapterNumber(section: GuideSection): number | null {
  const match = section.title.match(/(?:Chương\s*(\d+)|(\d+)\.\d+)/i);
  if (match) {
    return parseInt(match[1] || match[2], 10);
  }
  return null;
}

export function countSectionImages(sections: GuideSection[]): number {
  return sections.reduce((total, sec) => {
    return total + sec.blocks.filter((b) => b.type === 'image').length;
  }, 0);
}

export function groupSectionsByChapter(sections: GuideSection[]): ChapterGroup[] {
  const groups: ChapterGroup[] = [];
  let currentGroup: ChapterGroup | null = null;
  let chapterIndex = 1;

  for (const section of sections) {
    if (section.level === 1) {
      const num = getChapterNumber(section) ?? chapterIndex++;
      currentGroup = {
        id: section.id,
        chapterNumber: num,
        chapterSection: section,
        sections: [],
      };
      groups.push(currentGroup);
    } else {
      if (!currentGroup) {
        currentGroup = {
          id: 'chapter-default',
          chapterNumber: 1,
          chapterSection: {
            id: 'chapter-default',
            title: 'Chương 1',
            level: 1,
            role: 'ALL',
            blocks: [],
          },
          sections: [],
        };
        groups.push(currentGroup);
      }
      currentGroup.sections.push(section);
    }
  }

  return groups;
}
