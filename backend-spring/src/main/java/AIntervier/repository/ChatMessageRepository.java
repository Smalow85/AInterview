package AIntervier.repository;

import AIntervier.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    public List<ChatMessage> findBySessionId(String sessionId);
}
