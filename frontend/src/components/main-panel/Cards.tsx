import React, { useEffect, useState } from 'react';
import { useCardStore } from "../../lib/store-card";
import CardModal from "./CardModal";
import "./Cards.scss";
import EmptyState from './EmptyState';

interface ResponseCardsProps {
  onCardClick?: (id: string) => void;
}

const ResponseCards: React.FC<ResponseCardsProps> = ({ onCardClick }) => {
  const { cards, updateFavoriteStatus } = useCardStore();
  const [showModal, setShowModal] = useState<string | null>(null);

  useEffect(() => {
    useCardStore.getState().fetchCards();
  }, []);

  const handleCardClick = (id: string) => {
    setShowModal(id);
    onCardClick?.(id);
  };

  const addOrRemoveToFavorite = (e: React.MouseEvent, cardId: string, favorite: number) => {
    e.stopPropagation();
    updateFavoriteStatus(cardId, favorite);
  };

  const handleModalClose = () => {
    setShowModal(null);
  };

  const handleShowMoreClick = (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    setShowModal(cardId);
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className={`response-card-inner-container ${cards.length === 0 ? 'is-empty' : ''}`}>
      {cards.length === 0 ? (
        <EmptyState />
      ) : (
        cards.map((card) => (
          card.data && (
            <article
              key={card.id}
              className="response-card"
              onClick={() => handleCardClick(card.id)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(card.id);
                }
              }}
            >
              <header className="card-header">
                <h3 title={card.header}>{card.header}
                <button
                  className={`favorite-btn ${card.favorite ? 'is-favorite' : ''}`}
                  onClick={(e) => addOrRemoveToFavorite(e, card.id, card.favorite == 1 ? 0 : 1)}
                  title={card.favorite == 1 ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {card.favorite == 1 ? '★' : '☆'}
                </button>
                </h3>
              </header>

              <div className="card-content">
                {card.tags && card.tags.length > 0 && (
                  <div className="card-tags">
                    {card.tags.slice(0, 4).map((tag, index) => (
                      <span key={index} className="tag">
                        {tag}
                      </span>
                    ))}
                    {card.tags.length > 4 && (
                      <span className="tag tag-more">
                        +{card.tags.length - 4}
                      </span>
                    )}
                  </div>
                )}

                <div className="card-summary">
                  <p>{truncateText(card.summary || '', 120)}</p>
                  {card.summary && card.summary.length > 120 && (
                    <button
                      className="show-more"
                      onClick={(e) => handleShowMoreClick(e, card.id)}
                      type="button"
                    >
                      Read More
                    </button>
                  )}
                </div>
              </div>
            </article>
          )
        ))
      )}

      {showModal && (
        <CardModal
          onClose={handleModalClose}
          card={cards.find(card => card.id === showModal) || null}
        />
      )}
    </div>
  );
};

export default ResponseCards;