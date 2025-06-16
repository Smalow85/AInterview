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
import java.util.List;

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
    public ResponseEntity<ChatResponse> sendMessage(@RequestBody ChatRequest request) {
        String botReply = geminiService.askGemini(request.getMessage(), request.getSender());
        ResponseCard card = new ResponseCard();
        card.setData(botReply);
        card.setSessionId(request.getSessionId());
        card.setHeader("Header");
        card.setCreated(LocalDateTime.now());
        card.setSender(request.getSender());
        cardRepository.save(card);
        return ResponseEntity.ok(new ChatResponse(botReply));
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

    @GetMapping("/history")
    public List<ChatMessage> getHistory() {
        return repository.findAll();
    }

    @GetMapping("/card-history")
    public List<ResponseCard> getCards() {
        return cardRepository.findAll();
    }

    @DeleteMapping("/history/clear")
    public void clearHistory() {
        repository.deleteAll();
    }
}

