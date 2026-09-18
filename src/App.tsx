import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FloatButton, Layout } from 'antd';
import { ArrowUpOutlined } from '@ant-design/icons';
import { guide } from './content/guide-content';
import {
  groupSectionsByChapter,
  countSectionImages,
} from './content/guide-chapters';
import { GuideHeader } from './components/guide-header';
import { GuideSidebar } from './components/guide-sidebar';
import { MobileToc } from './components/mobile-toc';
import { GuideContentView } from './components/guide-content-view';
import { HeroRoleSelector } from './components/hero-role-selector';
import { WorkflowTimeline8Steps } from './components/workflow-timeline-8steps';
import { expandQuery, matchText } from './lib/search';
import type { GuideSection, RoleTag } from './types/guide';

function readHashId(): string {
  const hash = window.location.hash.replace(/^#/, '');
  try {
    return decodeURIComponent(hash);
  } catch {
    return hash;
  }
}

export default function App() {
  const [activeSectionId, setActiveSectionId] = useState<string>(() => readHashId() || guide.sections[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<RoleTag | null>(null);
  const [mobileTocOpen, setMobileTocOpen] = useState<boolean>(false);
  const observerSuppressedUntil = useRef<number>(0);

  const suppressObserver = useCallback((durationMs = 450) => {
    observerSuppressedUntil.current = performance.now() + durationMs;
  }, []);

  const scrollToTarget = useCallback((targetId: string) => {
    const element = document.getElementById(targetId);
    if (!element) return;

    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${targetId}`);
    setActiveSectionId(targetId);
  }, []);

  const handleSelectSection = useCallback(
    (sectionId: string) => {
      suppressObserver(1500);
      scrollToTarget(sectionId);
    },
    [scrollToTarget, suppressObserver],
  );

  // Group all chapters initially
  const allChapterGroups = useMemo(
    () => groupSectionsByChapter(guide.sections),
    [],
  );

  // Role counts memo
  const roleCounts = useMemo(() => {
    const acc = { SITE: 0, ACCOUNTANT: 0, LEGAL: 0, ADMIN: 0 } as Record<'SITE' | 'ACCOUNTANT' | 'LEGAL' | 'ADMIN', number>;
    guide.sections.forEach((s) => {
      if (s.level === 2 && s.role in acc) acc[s.role as 'SITE' | 'ACCOUNTANT' | 'LEGAL' | 'ADMIN'] += 1;
    });
    return acc;
  }, []);

  // Chapter-aware search filter: preserves the parent chapter header for matching child sections
  const chapterGroups = useMemo(() => {
    const terms = expandQuery(searchQuery);
    const hasSearch = terms.length > 0;
    const hasRole = roleFilter !== null;
    if (!hasSearch && !hasRole) return allChapterGroups;

    function matchBlocks(blocks: GuideSection['blocks']): boolean {
      return blocks.some((b) => {
        if (b.type === 'paragraph' || b.type === 'label') {
          return matchText(b.text, terms);
        }
        if (b.type === 'steps' || b.type === 'bullets') {
          return b.items.some((item) => matchText(item, terms));
        }
        if (b.type === 'table') {
          const matchHeaders = b.headers.some((h) => matchText(h, terms));
          const matchRows = b.rows.some((row) => row.some((cell) => matchText(cell, terms)));
          return matchHeaders || matchRows;
        }
        if (b.type === 'image') {
          return matchText(b.caption || '', terms) || matchText(b.alt || '', terms);
        }
        return false;
      });
    }

    return allChapterGroups
      .map((group) => {
        const chapterMatches = hasSearch && (matchText(group.chapterSection.title, terms) || matchBlocks(group.chapterSection.blocks));

        const matchingSections = group.sections.filter((sec) => {
          if (hasRole && sec.role !== roleFilter && sec.role !== 'ALL') {
            return false;
          }
          if (!hasSearch) return true;
          if (matchText(sec.title, terms)) return true;
          return matchBlocks(sec.blocks);
        });

        if (chapterMatches) {
          return group;
        }

        if (matchingSections.length === 0 && group.sections.length === 0) {
          return !hasSearch ? group : null;
        }

        if (matchingSections.length > 0) {
          return {
            ...group,
            sections: matchingSections,
          };
        }

        return null;
      })
      .filter((g): g is typeof allChapterGroups[number] => g !== null);
  }, [allChapterGroups, searchQuery, roleFilter]);

  // Flatten back to filteredSections for GuideContentView
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim() && roleFilter === null) return guide.sections;

    const result: GuideSection[] = [];
    chapterGroups.forEach((group) => {
      result.push(group.chapterSection);
      result.push(...group.sections);
    });
    return result;
  }, [chapterGroups, searchQuery, roleFilter]);

  const chapterCount = useMemo(
    () => chapterGroups.length,
    [chapterGroups],
  );
  const sectionCount = useMemo(
    () => chapterGroups.reduce((acc, g) => acc + g.sections.length, 0),
    [chapterGroups],
  );
  const imageCount = useMemo(
    () => chapterGroups.reduce((acc, g) => acc + countSectionImages(g.sections), 0),
    [chapterGroups],
  );

  // Initial hash scroll
  useEffect(() => {
    const initialId = readHashId();
    if (initialId) {
      suppressObserver(600);
      setTimeout(() => scrollToTarget(initialId), 100);
    }
  }, [scrollToTarget, suppressObserver]);

  // Scroll spy with IntersectionObserver
  useEffect(() => {
    const sectionElements = guide.sections
      .map((sec) => document.getElementById(sec.id))
      .filter((el): el is HTMLElement => el !== null);

    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (performance.now() < observerSuppressedUntil.current) return;

        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Choose topmost visible entry
          const topEntry = visibleEntries.sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0];
          const newId = topEntry.target.id;
          setActiveSectionId(newId);
          window.history.replaceState(null, '', `#${newId}`);
        }
      },
      {
        rootMargin: '-12% 0px -72% 0px',
        threshold: [0, 0.25, 0.5],
      },
    );

    sectionElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [filteredSections]);

  return (
    <Layout className="app-shell">
      <GuideHeader
        guide={guide}
        chapterCount={chapterCount}
        sectionCount={sectionCount}
        imageCount={imageCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenMobileToc={() => setMobileTocOpen(true)}
      />

      <main className="guide-main-layout">
        <GuideSidebar
          chapterGroups={chapterGroups}
          activeSectionId={activeSectionId}
          onSelectSection={handleSelectSection}
        />

        <section className="guide-content-area">
          <HeroRoleSelector counts={roleCounts} activeRole={roleFilter} onSelectRole={setRoleFilter} />
          <WorkflowTimeline8Steps activeSectionId={activeSectionId} onJumpToStep={handleSelectSection} />
          <GuideContentView guide={guide} sections={filteredSections} />
        </section>
      </main>

      <MobileToc
        open={mobileTocOpen}
        onClose={() => setMobileTocOpen(false)}
        chapterGroups={chapterGroups}
        activeSectionId={activeSectionId}
        onSelectSection={handleSelectSection}
      />

      <FloatButton.BackTop icon={<ArrowUpOutlined />} tooltip="Lên đầu trang" />
    </Layout>
  );
}
