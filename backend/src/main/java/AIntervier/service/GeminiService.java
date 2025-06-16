package AIntervier.service;

import AIntervier.embedding.RemoteEmbeddingService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class GeminiService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String endpoint;
    private final String apiKey;
    private final List<Map<String, String>> contextBuffer = new ArrayList<>();
    private final int contextThreshold = 3;
    private final AtomicBoolean requestInProgress = new AtomicBoolean(false);
    private final int maxHistorySize = 10;

    @Autowired
    private QdrantService qdrantService;

    @Autowired
    private RemoteEmbeddingService embeddingService;


    public GeminiService(RestTemplate restTemplate, ObjectMapper objectMapper, String endpoint, String apiKey) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.endpoint = endpoint;
        this.apiKey = apiKey;
    }

    public String askGemini(String prompt, String role) {
        synchronized (contextBuffer) {
            contextBuffer.add(Map.of("role", role, "text", prompt));

            if (contextBuffer.size() >= contextThreshold && !requestInProgress.get()) {
                requestInProgress.set(true);
                new Thread(() -> {
                    String response = sendGeminiRequest();
                    contextBuffer.clear();
                    requestInProgress.set(false);
                }).start();
                return "Request to Gemini initiated.  Please wait...";
            } else {
                return "Context accumulating.  More turns needed.";
            }
            }
    }

    private String sendGeminiRequest() {
        try {
            List<Map<String, Object>> contextParts = new ArrayList<>();
            for (Map<String, String> turn : contextBuffer) {
                contextParts.add(Map.of("role", turn.get("role"), "text", turn.get("text")));
            }

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(Map.of("parts", contextParts))
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    endpoint + "?key=" + apiKey,
                    request,
                    String.class
            );

            JsonNode json = objectMapper.readTree(response.getBody());
            return json
                    .path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text")
                    .asText("No answer");
        } catch (Exception e) {
            return "Error from Gemini: " + e.getMessage();
        }
    }

    public String askGeminiWithContext(String prompt) {
        float[] queryVector = embeddingService.embed(prompt);
        List<String> contextChunks = qdrantService.search("context", queryVector, 5);

        StringBuilder finalPrompt = new StringBuilder("Context:\n");
        for (String c : contextChunks) {
            finalPrompt.append("- ").append(c).append("\n");
        }
        finalPrompt.append("\nQuestion: ").append(prompt);

        return askGemini(finalPrompt.toString(), "user");
    }
}