package AIntervier.rest;

import AIntervier.model.InterviewPhase;
import AIntervier.model.InterviewPhaseQuestion;
import AIntervier.model.InterviewPlan;
import AIntervier.model.InterviewQuestion;
import AIntervier.repository.InterviewPhaseQuestionRepository;
import AIntervier.repository.InterviewPhaseRepository;
import AIntervier.repository.InterviewQuestionRepository;
import AIntervier.rest.data.InterviewQestionRequest;
import AIntervier.service.GeminiService;
import AIntervier.service.InterviewQuestionService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping(value = "/api/interview-questions")
public class InterviewQuestionController {

    @Autowired
    private InterviewQuestionService interviewQuestionService;

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private InterviewQuestionRepository interviewQuestionRepository;

    @Autowired
    private InterviewPhaseRepository phaseRepository;

    @Autowired
    private InterviewPhaseQuestionRepository questionRepository;

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

    @PostMapping(value = "/interview-plan/{sessionId}")
    @Transactional
    public ResponseEntity<InterviewPlan> generateInterviewPlan(@PathVariable String sessionId, @RequestBody InterviewQestionRequest request) {
        try {
            // Generate the interview plan
            InterviewPlan interviewPlan = geminiService.generateInterviewPlan(request);

            // Validate the generated plan
            if (interviewPlan == null || interviewPlan.getPhases() == null) {
                return ResponseEntity.badRequest().build();
            }

            // Save phases if any exist
            if (!interviewPlan.getPhases().isEmpty()) {
                List<InterviewPhase> phasesToSave = new ArrayList<>();

                for (InterviewPhase sourcePhase : interviewPlan.getPhases()) {
                    // Create new phase entity
                    InterviewPhase phaseToSave = new InterviewPhase();
                    phaseToSave.setSessionId(sessionId);
                    phaseToSave.setName(sourcePhase.getName());

                    // Create and add questions to the phase
                    if (sourcePhase.getQuestions() != null && !sourcePhase.getQuestions().isEmpty()) {
                        List<InterviewPhaseQuestion> questionsToSave = new ArrayList<>();

                        for (InterviewPhaseQuestion sourceQuestion : sourcePhase.getQuestions()) {
                            InterviewPhaseQuestion questionToSave = new InterviewPhaseQuestion();
                            questionToSave.setText(sourceQuestion.getText()); // Используем правильное поле
                            questionToSave.setType(sourceQuestion.getType());
                            questionToSave.setDifficulty(sourceQuestion.getDifficulty());
                            questionToSave.setExpectedKeywords(sourceQuestion.getExpectedKeywords());
                            questionToSave.setEvaluationCriteria(sourceQuestion.getEvaluationCriteria());
                            questionToSave.setPhase(phaseToSave); // Устанавливаем связь

                            questionsToSave.add(questionToSave);
                        }

                        phaseToSave.setQuestions(questionsToSave);
                    }

                    phasesToSave.add(phaseToSave);
                }

                // Сохраняем только фазы - вопросы сохранятся каскадно
                phaseRepository.saveAll(phasesToSave);
            }

            return ResponseEntity.ok(interviewPlan);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/interview-plan/{sessionId}")
    public ResponseEntity<String> getPhasesBySessionId(@PathVariable String sessionId) throws JsonProcessingException {
        List<InterviewPhase> phases = phaseRepository.findBySessionId(sessionId);

        ObjectMapper objectMapper = new ObjectMapper();
        String json = objectMapper.writeValueAsString(phases);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(json);
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
