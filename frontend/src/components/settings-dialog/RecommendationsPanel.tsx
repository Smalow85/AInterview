
import React, { useState, useEffect } from 'react';
import { fetchAllRecommendations, Recommendation } from '../../lib/storage/recommendation-storage';
import { useThemedConversationStore } from '../../lib/store-conversation';
import { useSettingsStore } from '../../lib/store-settings';
import { v4 as uuidv4 } from 'uuid';
import { RecommendedConversationRequest } from '../conversations/ThemedConversationGenerator';

interface RecommendationsPanelProps {
  onClose: () => void;
}

export default function RecommendationsPanel({ onClose }: RecommendationsPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { settings, updateSettings } = useSettingsStore();
  const { patchConversation } = useThemedConversationStore();

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const data = await fetchAllRecommendations();
        setRecommendations(data);
      } catch (err) {
        setError('Failed to load recommendations.');
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, []);

  const handleGenerateCards = async (recommendation: Recommendation) => {

  };

  const handleStartConversation = async (feedback: string, topics: string[]) => {
    setLoading(true);
    setError('');
    try {
      const sessionId = crypto.randomUUID();
      const requestBody: RecommendedConversationRequest = {
        feedback: feedback,
        topics: topics
      };
      const response = await fetch(`/api/themed-conversation-plan/recommended/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      console.log('got response', response);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      patchConversation({ theme: data.theme, learningGoals: data.learningGoals, conversationLoaded: true, activeSessionId: sessionId })
      updateSettings({ sessionActive: true, sessionType: 'themed_interview', activeSessionId: sessionId });
      onClose();
    } catch (error) {
      console.log("Error:", error)
      setLoading(false)
      setError("Error")
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="recommendations-panel">
      {recommendations.length === 0 ? (
        <p>No recommendations yet.</p>
      ) : (
        <div className="recommendations-list">
          {recommendations.map((rec) => (
            <div key={rec.id} className="recommendation-item card">
              <div className="card-body">
                <p>{rec.recommendation}</p>
              </div>
              <div className="card-footer">
                <button onClick={() => handleGenerateCards(rec)}>Generate Hint Cards</button>
                <button onClick={() => handleStartConversation(rec.recommendation, rec.topics)}>Start Themed Conversation</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
