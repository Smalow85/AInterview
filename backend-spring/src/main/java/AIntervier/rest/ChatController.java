package AIntervier.rest;

import AIntervier.model.ChatMessage;
import AIntervier.rest.data.ChatRequest;
import AIntervier.rest.data.ChatResponse;
import AIntervier.model.ResponseCard;
import AIntervier.repository.ChatMessageRepository;
import AIntervier.repository.ResponseCardRepository;
import AIntervier.service.EnhancedGeminiService;
import AIntervier.service.GeminiService;
import org.jetbrains.annotations.NotNull;
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

    @Autowired
    private EnhancedGeminiService enhancedGeminiService;

    @PostMapping("/ask")
    public ResponseEntity<ResponseCard> sendMessage(@RequestBody ChatRequest request) {
        Map<String, Object> botReply = geminiService.askGemini(request.getText());
        return getResponseCardResponseEntity(request, botReply);
    }

    @PostMapping("/ask-with-context")
    public ResponseEntity<ResponseCard> sendMessageWithContext(@RequestBody ChatRequest request) {
        Map<String, Object> botReply = enhancedGeminiService.askGeminiWithEmbeddings(request.getText());
        return getResponseCardResponseEntity(request, botReply);
    }

    @NotNull
    private ResponseEntity<ResponseCard> getResponseCardResponseEntity(ChatRequest request, Map<String, Object> botReply) {
        ResponseCard card = new ResponseCard();
        Map<String, Object> cardMap = (Map<String, Object>) botReply.get("card");
        card.setData((String) cardMap.get("data"));
        card.setSessionId(request.getSessionId());
        card.setHeader((String) cardMap.get("header"));
        card.setTags((List<String>) cardMap.getOrDefault("tags", new ArrayList<>()));
        card.setSummary((String) cardMap.get("summary"));
        card.setCreated(LocalDateTime.now());
        return ResponseEntity.ok(card);
    }
}

