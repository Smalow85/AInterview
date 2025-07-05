package AIntervier.rest;

import AIntervier.model.LearningGoalsPlan;
import AIntervier.repository.LearningGoalsPlanRepository;
import AIntervier.rest.data.ConversationRequest;
import AIntervier.service.GeminiService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping(value = "/api/themed-conversation")
public class ThemeConversationController {

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private LearningGoalsPlanRepository repository;

    @PostMapping(value = "/themed-conversation-plan/{sessionId}")
    @Transactional
    public ResponseEntity<LearningGoalsPlan> generateInterviewPlan(@PathVariable String sessionId, @RequestBody ConversationRequest request) {
        try {
            LearningGoalsPlan goalsPlan = geminiService.generateLearningObjectivesPlan(request, sessionId);

            if (goalsPlan == null || goalsPlan.getLearningGoals() == null) {
                return ResponseEntity.badRequest().build();
            } else {
                LearningGoalsPlan plan = repository.save(goalsPlan);
                return ResponseEntity.ok(plan);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping(value = "/themed-conversation-plan/{sessionId}")
    public ResponseEntity<LearningGoalsPlan> getPlan(@PathVariable String sessionId) {
        try {
            Optional<LearningGoalsPlan> plan = repository.findById(sessionId);
            return plan.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

}
