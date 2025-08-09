
import { useState } from 'react';
import './UserDashboard.scss';
import UserSettingsPanel from './UserSettingsPanel';
import ActivityPanel from './ActivityPanel';
import RecommendationsPanel from './RecommendationsPanel';

interface UserDashboardProps {
  onClose: () => void;
}

export default function UserDashboard({ onClose }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState('settings');

  return (
    <div className="user-dashboard">
      <div className="tab-navigation">
        <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'active' : ''}>
          Settings
        </button>
        <button onClick={() => setActiveTab('activity')} className={activeTab === 'activity' ? 'active' : ''}>
          Activity
        </button>
        <button onClick={() => setActiveTab('recommendations')} className={activeTab === 'recommendations' ? 'active' : ''}>
          Recommendations
        </button>
        <button className="close-button material-symbols-outlined" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="tab-content">
        {activeTab === 'settings' && <UserSettingsPanel onClose={onClose} />}
        {activeTab === 'activity' && <ActivityPanel />}
        {activeTab === 'recommendations' && <RecommendationsPanel />}
      </div>
    </div>
  );
}
