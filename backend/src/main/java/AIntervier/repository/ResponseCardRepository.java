package AIntervier.repository;

import AIntervier.model.ChatMessage;
import AIntervier.model.ResponseCard;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResponseCardRepository extends JpaRepository<ResponseCard, Long> {
}
