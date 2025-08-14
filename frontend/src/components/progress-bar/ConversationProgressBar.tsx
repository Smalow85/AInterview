import React, { useState } from "react";
import "./ConversationProgressBar.scss";

import { useThemedConversationStore } from "../../lib/store-conversation";

export default function ConversationProgressBar() {
    const { themedConversation } = useThemedConversationStore();
    const [expanded, setExpanded] = useState(false);

    return (
        <>
            {themedConversation.learningGoals.length > 0 && (
                <div
                    className="interview-progress"
                    onClick={() => setExpanded(!expanded)}
                    data-expanded={expanded}
                >
                    <div className="progress-bar">
                        <span className="progress-label">
                            {themedConversation.currentGoalIndex + 1} / {themedConversation.learningGoals.length}
                        </span>
                        <div className="progress-bar-inner">
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${((themedConversation.currentGoalIndex + 1) /
                                        themedConversation.learningGoals.length) *
                                        100}%`,
                                }}
                            ></div>
                        </div>
                    </div>
                    <div className="current-goal">
                        Goal {themedConversation.currentGoalIndex + 1}: {themedConversation.learningGoals[themedConversation.currentGoalIndex]}
                    </div>

                    {expanded && (
                        <div className="progress-details">
                            {themedConversation.learningGoals.map((goal, index) => (
                                <div className="goal-item" key={index}>
                                    <span>{index + 1}: {goal}</span>
                                    <span>{themedConversation.learningGoalScore[index] || "Not yet graded"}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
