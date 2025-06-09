package AIntervier.service;

import AIntervier.embedding.RemoteEmbeddingService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class GeminiService {

    @Value("${gemini.api-key}")
    private String apiKey;

    @Value("${gemini.endpoint}")
    private String endpoint;

    @Autowired
    private QdrantService qdrantService;

    @Autowired
    private RemoteEmbeddingService embeddingService;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String askGemini(String prompt) {
        try {
            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
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

        return askGemini(finalPrompt.toString());
    }
}