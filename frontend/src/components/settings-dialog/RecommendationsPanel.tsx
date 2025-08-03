import React from 'react';

interface RecommendationsPanelProps {
  recommendations: { id: number; text: string }[];
}

const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({ recommendations }) => {
  return (
    <div className="recommendations-card">
      <div className="card-header">
        <h2>Recommendations</h2>
      </div>
      <ul className="recommendations-list">
        {recommendations.map((rec) => (
          <li key={rec.id} className="recommendation-item">
            <p>{rec.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecommendationsPanel;
