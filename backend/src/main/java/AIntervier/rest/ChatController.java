package AIntervier.rest;

import AIntervier.model.ChatMessage;
import AIntervier.model.ChatRequest;
import AIntervier.model.ChatResponse;
import AIntervier.repository.ChatMessageRepository;
import AIntervier.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private ChatMessageRepository repository;

    @PostMapping("/ask")
    public ResponseEntity<ChatResponse> sendMessage(@RequestBody ChatRequest request) {
        ChatMessage userMessage = new ChatMessage();
        userMessage.setSessionId(request.getSessionId());
        userMessage.setSender("user");
        userMessage.setMessage(request.getMessage());
        repository.save(userMessage);

        String botReply = geminiService.askGemini(request.getMessage());

        ChatMessage botMessage = new ChatMessage();
        botMessage.setSessionId(request.getSessionId());
        botMessage.setSender("bot");
        botMessage.setMessage(botReply);
        repository.save(botMessage);

        return ResponseEntity.ok(new ChatResponse(botReply));
    }

    @PostMapping("/save")
    public ResponseEntity<ChatResponse> saveMessage(@RequestBody ChatRequest request) {
        ChatMessage message = new ChatMessage();
        message.setSessionId(request.getSessionId());
        message.setSender("user");
        message.setMessage(request.getMessage());
        repository.save(message);

        return ResponseEntity.ok(new ChatResponse(message.getMessage()));
    }

    @PostMapping("/ask-with-context")
    public ResponseEntity<ChatResponse> sendMessageWithContext(@RequestBody ChatRequest request) {
        if (request.isStop()) {
            ChatMessage botMessage = new ChatMessage();
            botMessage.setSessionId(request.getSessionId());
            botMessage.setSender("bot");
            botMessage.setMessage("Ok, I listen.");
            repository.save(botMessage);
            return ResponseEntity.ok(new ChatResponse("Listening user..."));
        } else {
            ChatMessage userMessage = new ChatMessage();
            userMessage.setSessionId(request.getSessionId());
            userMessage.setSender("user");
            userMessage.setMessage(request.getMessage());
            repository.save(userMessage);

            String botReply = geminiService.askGeminiWithContext(request.getMessage());

            ChatMessage botMessage = new ChatMessage();
            botMessage.setSessionId(request.getSessionId());
            botMessage.setSender("bot");
            botMessage.setMessage(botReply);
            repository.save(botMessage);

            return ResponseEntity.ok(new ChatResponse(botReply));
        }
    }

    @GetMapping("/history")
    public List<ChatMessage> getHistory() {
        return repository.findAll();
    }
}

