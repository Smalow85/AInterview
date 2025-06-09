package AIntervier.interview.AIntervier.rest;

import AIntervier.interview.AIntervier.model.ChatMessage;
import main.AIntervier.model.ChatRequest;
import main.AIntervier.model.ChatResponse;
import main.AIntervier.repository.ChatMessageRepository;
import main.AIntervier.rest.ChatController;
import main.AIntervier.service.GeminiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.http.ResponseEntity;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ChatControllerTest {

    @InjectMocks
    private ChatController chatController;

    @Mock
    private GeminiService geminiService;

    @Mock
    private ChatMessageRepository repository;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void sendMessage_shouldReturnBotReply_andSaveMessages() {
        // Arrange
        ChatRequest request = new ChatRequest();
        request.setSessionId("123");
        request.setMessage("Hello");

        String botReply = "Hi, how can I help you?";

        when(geminiService.askGemini("Hello")).thenReturn(botReply);

        // Act
        ResponseEntity<ChatResponse> response = chatController.sendMessage(request);

        // Assert
        assertEquals(200, response.getStatusCodeValue());
        assertEquals(botReply, response.getBody().getReply());

        // Verify messages are saved
        verify(repository, times(2)).save(any(ChatMessage.class));
        verify(geminiService).askGemini("Hello");
    }

    @Test
    void getHistory_shouldReturnChatMessagesBySessionId() {
        // Arrange
        String sessionId = "123";
        List<ChatMessage> mockMessages = Arrays.asList(
                new ChatMessage("123", "user", "Hello"),
                new ChatMessage("123", "bot", "Hi there!")
        );

        when(repository.findBySessionId(sessionId)).thenReturn(mockMessages);

        // Act
        List<ChatMessage> result = chatController.getHistory(sessionId);

        // Assert
        assertEquals(2, result.size());
        assertEquals("user", result.get(0).getSender());
        assertEquals("bot", result.get(1).getSender());

        verify(repository).findBySessionId(sessionId);
    }
}
