import React, { useState } from 'react';
import { HistoryItem } from './ActivityPanel';
import './ActivityCard.scss';

interface ActivityCardProps {
  item: HistoryItem;
}

export default function ActivityCard({ item }: ActivityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  const title = item.type === 'interview' ? item.position : item.theme;

  return (
    <div className={`activity-card card ${isExpanded ? 'expanded' : ''}`} onClick={handleCardClick}>
      <div className="card-header">
        <h4>{item.type === 'interview' ? 'Interview' : 'Conversation'}</h4>
        <span className={`material-symbols-outlined expand-icon ${isExpanded ? 'rotated' : ''}`}>
          expand_more
        </span>
      </div>
      <div className="card-body">
        <p>{title}</p>
      </div>
      {isExpanded && (
        <div className="card-details">
          {item.type === 'interview' && (
            <div className="interview-details">
              <div className="detail-item">
                <strong>Position:</strong> {item.position}
              </div>
              <div className="detail-item">
                <strong>Phases:</strong>
                <ul>
                  {item.phases.map((phase, index) => (
                    <li key={index}>
                      {phase.name} ({phase.questions.length} questions)
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {item.type === 'conversation' && (
            <div className="conversation-details">
              <div className="detail-item">
                <strong>Theme:</strong> {item.theme}
              </div>
              <div className="detail-item">
                <strong>Learning Goals:</strong>
                <ul>
                  {item.learningGoals.map((goal, index) => (
                    <li key={index}>{goal}</li>
                  ))}
                </ul>
              </div>
              <div className="detail-item">
                <strong>Final Feedback:</strong> {item.finalFeedback || 'N/A'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
