package AIntervier.rest;

import AIntervier.model.InterviewQuestion;
import AIntervier.repository.InterviewQuestionRepository;
import AIntervier.rest.data.InterviewQestionRequest;
import AIntervier.service.InterviewQuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping(value = "/api/interview-questions")
public class InterviewQuestionController {

    @Autowired
    private InterviewQuestionService interviewQuestionService;

    @Autowired
    private InterviewQuestionRepository interviewQuestionRepository;

    @PostMapping()
    public ResponseEntity<List<InterviewQuestion>> getInterviewQuestion(@RequestBody InterviewQestionRequest request) {
        List<String> questions =  interviewQuestionService.generateQuestions(
                request.getJobTitle(),
                request.getRequiredExperience(),
                request.getResumeContent(),
                request.getKeySkills()
        );
        List<InterviewQuestion> generatedQuestions = new ArrayList<>();
        if (!questions.isEmpty()) {
            generatedQuestions = questions.stream()
                    .map(q -> convertToInterviewQuestion(q, request.getSessionId()))
                    .toList();
            interviewQuestionRepository.saveAll(generatedQuestions);
        }
        return ResponseEntity.ok(generatedQuestions);
    }

    private InterviewQuestion convertToInterviewQuestion(String questionText, String sessionId) {
        InterviewQuestion question = new InterviewQuestion();
        question.setAsked(Boolean.FALSE);
        question.setQuestion(questionText);
        question.setSessionId(sessionId);
        question.setCreated(LocalDateTime.now());
        return question;
    }
}
