import React, { useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './Modal.scss';
import { ResponseCard } from '../../types/response-card';

interface CardModalProps {
  onClose: () => void;
  card: ResponseCard | null | undefined;
}

const Modal: React.FC<CardModalProps> = ({ onClose, card }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const parseMarkdown = (text: string): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];
  const regex = /(\*\*`([^`]+)`\*\*|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // **`code`**
      elements.push(<strong key={match.index}><code>{match[2]}</code></strong>);
    } else if (match[3]) {
      // `code`
      elements.push(<code key={match.index}>{match[3]}</code>);
    } else if (match[4]) {
      // **bold**
      elements.push(<strong key={match.index}>{match[4]}</strong>);
    } else if (match[5]) {
      // *italic*
      elements.push(<em key={match.index}>{match[5]}</em>);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements;
};

const highlightTagsWithMarkdownSupport = (
  text?: string | null,
  tags?: string[] | null
): React.ReactNode => {
  if (!text || !tags || tags.length === 0) {
    return text ?? '';
  }

  const markdownParts = parseMarkdown(text);

  return markdownParts.map((part, index) => {
    if (typeof part !== 'string') return <React.Fragment key={index}>{part}</React.Fragment>;

    const escapedTags = tags.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const tagRegex = new RegExp(`\\b(${escapedTags.join('|')})\\b`, 'gi');
    const pieces = part.split(tagRegex);

    return pieces.map((sub, i) => {
      const match = tags.find(tag => tag.toLowerCase() === sub.toLowerCase());
      return match ? (
        <span key={`${index}-${i}`} className="highlighted">
          {sub}
        </span>
      ) : (
        <React.Fragment key={`${index}-${i}`}>{sub}</React.Fragment>
      );
    });
  });
};

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (!card) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal" ref={modalRef}>
        <button className="close-button" onClick={onClose}>×</button>
        <div className="modal-content">
          <h3>{card.header}</h3>
          <p><strong>Summary:</strong> {highlightTagsWithMarkdownSupport(card.summary, card.tags)}</p>
          <p><strong>Data:</strong> {highlightTagsWithMarkdownSupport(card.data, card.tags)}</p>
          {card.tags && card.tags.length > 0 && (
            <div className="tags">
              {card.tags.map((tag, index) => (
                <span key={index} className="tag">{tag}</span>
              ))}
            </div>
          )}
          {card.codeExample && (
            <p><strong>Code:</strong> <pre>{card.codeExample}</pre></p>
          )}
        </div>
      </div>
    </div>,
    document.getElementById('modal-root') as HTMLElement
  );
};

export default Modal;