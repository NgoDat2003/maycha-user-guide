import { Image } from 'antd';
import type { ContentBlock } from '../types/guide';

interface GuideBlockRendererProps {
  block: ContentBlock;
}

export function GuideBlockRenderer({ block }: GuideBlockRendererProps) {
  switch (block.type) {
    case 'paragraph':
      return <p className="guide-paragraph">{block.text}</p>;

    case 'label': {
      const normalized = block.text.normalize('NFC').trim();
      let labelClass = 'label-role';
      if (normalized.includes('Việc này để làm gì')) labelClass = 'label-purpose';
      else if (normalized.includes('Cần chuẩn bị')) labelClass = 'label-condition';
      else if (normalized.includes('Làm theo')) labelClass = 'label-action';
      else if (normalized.includes('Bạn sẽ thấy')) labelClass = 'label-result';
      else if (normalized.includes('Mẹo hay')) labelClass = 'label-caution';
      else if (normalized.includes('Thẻ Nghiệp vụ')) labelClass = 'label-scenario';
      else if (normalized.startsWith('Playbook')) labelClass = 'label-playbook';
      else if (normalized.startsWith('Thẻ ')) labelClass = 'label-cheatsheet';
      else if (normalized.includes('Bảng tra')) labelClass = 'label-glossary';

      return (
        <div className="guide-label-block">
          <span className={`guide-label-title ${labelClass}`}>
            {block.text}
          </span>
        </div>
      );
    }

    case 'steps':
      return (
        <ol className="guide-steps">
          {block.items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ol>
      );

    case 'bullets':
      return (
        <ul className="guide-bullets">
          {block.items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      );

    case 'table':
      return (
        <div className="table-wrap">
          <table className="guide-table">
            <thead>
              <tr>
                {block.headers.map((header, idx) => (
                  <th key={idx}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'image':
      return (
        <figure className="guide-figure">
          <div className="screenshot-frame">
            <div className="screenshot-toolbar" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <Image
              src={block.src}
              alt={block.alt}
              loading="lazy"
              placeholder
            />
          </div>
          {block.caption ? <figcaption>{block.caption}</figcaption> : null}
        </figure>
      );

    default:
      return null;
  }
}
