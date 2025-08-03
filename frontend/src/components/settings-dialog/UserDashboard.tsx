import React from 'react';
import "../../styles/main.scss";
import UserSettingsPanel from './UserSettingsPanel';
import ActivityPanel from './ActivityPanel';
import RecommendationsPanel from './RecommendationsPanel';

// Mock Data
const mockInterviews = [
  { id: 1, title: 'Software Engineer Interview', date: '2025-07-28', score: 85 },
  { id: 2, title: 'Product Manager Interview', date: '2025-07-25', score: 92 },
];

const mockConversations = [
  { id: 1, title: 'Technical Deep Dive', date: '2025-07-29' },
  { id: 2, title: 'Behavioral Questions Practice', date: '2025-07-26' },
];

const mockRecommendations = [
  { id: 1, text: 'Practice more on system design questions.' },
  { id: 2, text: 'Improve your STAR method answers.' },
];

const UserDashboard: React.FC = () => {
  return (
    <div className="user-profile-dashboard">
      <div className="dashboard-container">
        <h1 className="dashboard-title">User Dashboard</h1>
        <div className="dashboard-grid">
          <div className="left-panel">
            <UserSettingsPanel />
          </div>
          <div className="middle-panel">
            <ActivityPanel interviews={mockInterviews} conversations={mockConversations} />
          </div>
          <div className="right-panel">
            <RecommendationsPanel recommendations={mockRecommendations} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
