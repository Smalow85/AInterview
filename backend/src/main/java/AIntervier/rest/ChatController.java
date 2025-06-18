package AIntervier.rest;

import AIntervier.model.ChatMessage;
import AIntervier.model.ChatRequest;
import AIntervier.model.ChatResponse;
import AIntervier.model.ResponseCard;
import AIntervier.repository.ChatMessageRepository;
import AIntervier.repository.ResponseCardRepository;
import AIntervier.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private ChatMessageRepository repository;

    @Autowired
    private ResponseCardRepository cardRepository;

    @PostMapping("/ask")
    public ResponseEntity<ResponseCard> sendMessage(@RequestBody ChatRequest request) {
        Map<String, Object> botReply = geminiService.askGemini(request.getMessage(), request.getSender());
        if (!botReply.isEmpty() ) {
            ResponseCard card = new ResponseCard();
            card.setData((String) botReply.get("data"));
            card.setSessionId(request.getSessionId());
            card.setHeader((String) botReply.get("header"));
            card.setTags((List<String>) botReply.getOrDefault("tags", new ArrayList<>()));
            card.setSummary((String) botReply.get("summary"));
            card.setCreated(LocalDateTime.now());
            card.setSender(request.getSender());
            cardRepository.save(card);
            return ResponseEntity.ok(card);
        } else {
            return ResponseEntity.noContent().build();
        }
    }

    @PostMapping("/save")
    public ResponseEntity<ChatResponse> saveMessage(@RequestBody ChatRequest request) {
        System.out.println(request);
        ChatMessage message = new ChatMessage();
        message.setSessionId(request.getSessionId());
        message.setSender(request.getSender());
        message.setMessage(request.getMessage());
        message.setCreated(LocalDateTime.now());
        repository.save(message);

        return ResponseEntity.ok(new ChatResponse(message.getMessage()));
    }

    @GetMapping("/history/{sessionId}")
    public List<ChatMessage> getHistory(@PathVariable String sessionId) {
        return repository.findBySessionId(sessionId);
    }

    @GetMapping("/card-history/{sessionId}")
    public List<ResponseCard> getCards(@PathVariable String sessionId) {
        return cardRepository.findBySessionId(sessionId);
    }

    @DeleteMapping("/history/clear")
    public void clearHistory() {
        repository.deleteAll();
    }
}

