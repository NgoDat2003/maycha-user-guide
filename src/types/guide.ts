export type RoleTag = 'ADMIN' | 'SITE' | 'ACCOUNTANT' | 'LEGAL' | 'ALL';

export type BlockType = 'paragraph' | 'label' | 'steps' | 'bullets' | 'table' | 'image';

export interface ParagraphBlock {
  type: 'paragraph';
  text: string;
}

export interface LabelBlock {
  type: 'label';
  text: string;
}

export interface StepsBlock {
  type: 'steps';
  items: string[];
}

export interface BulletsBlock {
  type: 'bullets';
  items: string[];
}

export interface TableBlock {
  type: 'table';
  headers: string[];
  rows: string[][];
}

export interface ImageBlock {
  type: 'image';
  src: string;
  alt: string;
  caption: string;
}

export type ContentBlock =
  | ParagraphBlock
  | LabelBlock
  | StepsBlock
  | BulletsBlock
  | TableBlock
  | ImageBlock;

export interface GuideSection {
  id: string;
  title: string;
  level: 1 | 2;
  role: RoleTag;
  blocks: ContentBlock[];
}

export interface GuideContent {
  title: string;
  version: string;
  systemName: string;
  scope: string;
  audience: string;
  notice: string;
  imageCount: number;
  sections: GuideSection[];
}
