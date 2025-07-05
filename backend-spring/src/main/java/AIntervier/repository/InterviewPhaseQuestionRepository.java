package AIntervier.repository;

import AIntervier.model.InterviewPhaseQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewPhaseQuestionRepository extends JpaRepository<InterviewPhaseQuestion, Long> {

    List<InterviewPhaseQuestion> findByPhaseId(Long phaseId);
}
