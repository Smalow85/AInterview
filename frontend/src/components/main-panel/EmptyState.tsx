import React from 'react';
import './Cards.scss';

const EmptyState: React.FC = () => {
  return (
    <div className="empty-state">
      <h3>No Cards Available</h3>
      <p>Your cards will appear here once they're created.</p>
    </div>
  );
};

export default EmptyState;