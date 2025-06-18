package AIntervier.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "response_card")
public class ResponseCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false)
    private String sessionId;

    @Column(name = "sender")
    private String sender;

    @Column(name = "data", nullable = false)
    private String data;

    @Column(name = "header", nullable = false)
    private String header;

    @Column(name = "tags")
    private List<String> tags;

    @Column(name = "summary")
    private String summary;

    @Column(name = "created")
    private LocalDateTime created;

    public ResponseCard() {
    }

    public ResponseCard(Long id, String sessionId, String sender, String data, String header, LocalDateTime created) {
        this.id = id;
        this.sessionId = sessionId;
        this.sender = sender;
        this.data = data;
        this.header = header;
        this.created = created;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }

    public String getHeader() {
        return header;
    }

    public void setHeader(String header) {
        this.header = header;
    }

    public LocalDateTime getCreated() {
        return created;
    }

    public void setCreated(LocalDateTime created) {
        this.created = created;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }
}
