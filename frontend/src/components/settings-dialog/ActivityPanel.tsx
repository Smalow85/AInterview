
import React, { useState, useEffect } from 'react';
import { fetchAllInterviews } from '../../lib/storage/interview-storage';
import { fetchAllConversations } from '../../lib/storage/conversation-storage';
import { InterviewSettings, ThemedConversationSettings } from '../../types/settings';
import ActivityCard from './ActivityCard';

export type HistoryItem = (InterviewSettings & { type: 'interview' }) | (ThemedConversationSettings & { type: 'conversation' });

export default function ActivityPanel() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const interviews = await fetchAllInterviews();
        const conversations = await fetchAllConversations();

        const formattedInterviews: HistoryItem[] = interviews.map((item) => ({
          ...item,
          type: 'interview' as const,
        }));

        const formattedConversations: HistoryItem[] = conversations.map((item) => ({
          ...item,
          type: 'conversation' as const,
        }));

        const combinedHistory = [...formattedInterviews, ...formattedConversations];
        // Assuming createdAt is available on both types
        // combinedHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setHistory(combinedHistory);
      } catch (err) {
        setError('Failed to load activity history.');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="activity-panel">
      {history.length === 0 ? (
        <p>No activity yet.</p>
      ) : (
        <div className="activity-list">
          {history.map((item) => (
            <ActivityCard key={item.activeSessionId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}