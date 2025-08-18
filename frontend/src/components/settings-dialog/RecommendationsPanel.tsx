
import React from 'react';

const mockRecommendations = [
  {
    id: 1,
    title: 'Improve Behavioral Question Answering Skills',
    description: 'Take a mock interview focused on behavioral questions to improve your STAR responses.',
    type: 'interview',
  },
  {
    id: 2,
    title: 'Technical Prep: JavaScript',
    description: 'Practice solving JavaScript problems to strengthen your technical knowledge.',
    type: 'themed-conversation',
  },
  {
    id: 3,
    title: 'Prepare for a Google Interview',
    description: 'Familiarize yourself with the Google interview process and run a simulation.',
    type: 'interview',
  },
];

export default function RecommendationsPanel() {
  return (
    <div className="recommendations-panel">
      <h3>Recommendations</h3>
      <div className="recommendations-list">
        {mockRecommendations.map((rec) => (
          <div key={rec.id} className="recommendation-item">
            <h4>{rec.title}</h4>
            <p>{rec.description}</p>
            <button>Start</button>
          </div>
        ))}
      </div>
    </div>
  );
}
