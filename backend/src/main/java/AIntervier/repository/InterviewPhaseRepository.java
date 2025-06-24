package AIntervier.repository;

import AIntervier.model.InterviewPhase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewPhaseRepository extends JpaRepository<InterviewPhase, Long> {

    List<InterviewPhase> findBySessionId(String sessionId);
}
