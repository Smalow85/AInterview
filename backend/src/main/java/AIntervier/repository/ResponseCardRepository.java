package AIntervier.repository;

import AIntervier.model.ResponseCard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResponseCardRepository extends JpaRepository<ResponseCard, Long> {
    List<ResponseCard> findBySessionId(String sessionId);
}
