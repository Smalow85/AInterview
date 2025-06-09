package AIntervier.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_message")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false)
    private String sessionId;

    @Column(name = "sender")
    private String sender;

    @Column(name = "message", nullable = false)
    private String message;

    @Column(name = "created")
    private LocalDateTime created;

    public ChatMessage() {
    }

    public ChatMessage(String sessionId, String sender, String message) {
        this.sessionId = sessionId;
        this.sender = sender;
        this.message = message;
        this.created = LocalDateTime.now(); // Set current timestamp on creation
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

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getCreated() {
        return created;
    }

    public void setCreated(LocalDateTime created) {
        this.created = created;
    }

    // Optional: Override toString() for easier logging and debugging
    @Override
    public String toString() {
        return "ChatMessage{" +
                "id=" + id +
                ", sessionId='" + sessionId + '\'' +
                ", sender='" + sender + '\'' +
                ", message='" + message + '\'' +
                ", created=" + created +
                '}';
    }
}