package AIntervier.repository;

import AIntervier.model.InterviewQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewQuestionRepository extends JpaRepository<InterviewQuestion, Long> {

    List<InterviewQuestion> findBySessionIdAndAskedFalse(String sessionId);

    List<InterviewQuestion> findBySessionId(String sessionId);

}
