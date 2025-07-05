package AIntervier.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.io.Serializable;
import java.util.List;

@Entity
@Table(name = "learning_goals")
@JsonIgnoreProperties(ignoreUnknown = true)
public class LearningGoalsPlan implements Serializable {

    @Id
    @Column(name = "session_id")
    private String sessionId;

    @Column(name = "learning_goals")
    private List<String> learningGoals;

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public List<String> getLearningGoals() {
        return learningGoals;
    }

    public void setLearningGoals(List<String> learningGoals) {
        this.learningGoals = learningGoals;
    }
}

