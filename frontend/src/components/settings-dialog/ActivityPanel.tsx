import React from 'react';

interface ActivityPanelProps {
  interviews: { id: number; title: string; date: string; score: number }[];
  conversations: { id: number; title: string; date: string }[];
}

const ActivityPanel: React.FC<ActivityPanelProps> = ({ interviews, conversations }) => {
  return (
    <>
      <div className="interviews-card">
        <div className="card-header">
          <h2>Recent Interviews</h2>
        </div>
        <ul className="interviews-list">
          {interviews.map((interview) => (
            <li key={interview.id} className="interview-item">
              <div className="interview-header">
                <h3>{interview.title}</h3>
                <span className="score">Score: {interview.score}</span>
              </div>
              <div className="interview-meta">
                <span>{interview.date}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="conversations-card">
        <div className="card-header">
          <h2>Recent Conversations</h2>
        </div>
        <ul className="conversations-list">
          {conversations.map((conversation) => (
            <li key={conversation.id} className="conversation-item">
              <h3>{conversation.title}</h3>
              <div className="conversation-meta">
                <span>{conversation.date}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default ActivityPanel;
