package AIntervier.model;

import AIntervier.utils.MapToJsonConverter;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "user_settings")
public class UserSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    private String email;

    @Column(name = "active_session_id", nullable = false)
    private String activeSessionId;

    @Column(name = "past_session_ids")
    private List<String> pastSessionIds;

    private String language;

    @Column(name = "system_instruction")
    private String systemInstruction;

    @Column(name = "created", columnDefinition = "timestamp default current_timestamp", updatable = false, insertable = false)
    private LocalDateTime created;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getActiveSessionId() {
        return activeSessionId;
    }

    public void setActiveSessionId(String activeSessionId) {
        this.activeSessionId = activeSessionId;
    }

    public List<String> getPastSessionIds() {
        return pastSessionIds;
    }

    public void setPastSessionIds(List<String> pastSessionIds) {
        this.pastSessionIds = pastSessionIds;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public LocalDateTime getCreated() {
        return created;
    }

    public String getSystemInstruction() {
        return systemInstruction;
    }

    public void setSystemInstruction(String systemInstruction) {
        this.systemInstruction = systemInstruction;
    }
}

