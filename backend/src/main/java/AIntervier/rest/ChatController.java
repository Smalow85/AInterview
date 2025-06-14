package AIntervier.rest;

import AIntervier.model.ChatMessage;
import AIntervier.model.ChatRequest;
import AIntervier.model.ChatResponse;
import AIntervier.repository.ChatMessageRepository;
import AIntervier.service.GeminiService;
import org.springframework.ai.audio.transcription.AudioTranscription;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.sound.sampled.*;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

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
        userMessage.setCreated(LocalDateTime.now());
        repository.save(userMessage);

        String botReply = geminiService.askGemini(request.getMessage());

        ChatMessage botMessage = new ChatMessage();
        botMessage.setSessionId(request.getSessionId());
        botMessage.setSender("bot");
        botMessage.setMessage(botReply);
        botMessage.setCreated(LocalDateTime.now());
        repository.save(botMessage);

        return ResponseEntity.ok(new ChatResponse(botReply));
    }

    @PostMapping("/save")
    public ResponseEntity<ChatResponse> saveMessage(@RequestBody ChatRequest request) {
        System.out.println(request);
        ChatMessage message = new ChatMessage();
        message.setSessionId(request.getSessionId());
        message.setSender("bot");
        message.setMessage(request.getMessage());
        message.setCreated(LocalDateTime.now());
        repository.save(message);

        return ResponseEntity.ok(new ChatResponse(message.getMessage()));
    }

    @GetMapping("/history")
    public List<ChatMessage> getHistory() {
        return repository.findAll();
    }
}

