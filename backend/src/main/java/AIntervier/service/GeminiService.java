package AIntervier.service;

import AIntervier.embedding.RemoteEmbeddingService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

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
    private final List<Map<String, String>> contextBuffer = new ArrayList<>();
    private final int contextThreshold = 3;
    private final AtomicBoolean requestInProgress = new AtomicBoolean(false);
    private final ExecutorService executor = Executors.newFixedThreadPool(5);

    public Map<String, Object> askGemini(String prompt, String role) {
        synchronized (contextBuffer) {
            contextBuffer.add(Map.of("role", role, "text", prompt));

            if (contextBuffer.size() >= contextThreshold && !requestInProgress.get()) {
                CompletableFuture<Map<String, Object>> future = CompletableFuture.supplyAsync(() -> {
                    requestInProgress.set(true);
                    Map<String, Object> response = sendGeminiRequest();
                    contextBuffer.clear();
                    requestInProgress.set(false);
                    return response;
                }, executor);
                try {
                    return future.get();
                } catch (InterruptedException | ExecutionException e) {
                    return Map.of("error", e.getMessage());
                }
            } else {
                return Map.of();
            }
        }
    }

    private Map<String, Object> sendGeminiRequest() {
        try {
            // Prepare the prompt with context
            StringBuilder promptBuilder = new StringBuilder();
            promptBuilder.append("Context:\n");
            for (Map<String, String> turn : contextBuffer) {
                promptBuilder.append(turn.get("text")).append("\n");
            }
            promptBuilder.append("\nRespond strictly in valid JSON format using this structure. ");
            promptBuilder.append("Always fill in the following fields: \"tags\", \"data\", \"header\", and \"summary\". ");
            promptBuilder.append("The field \"codeExamples\" is optional and should only be included if relevant.\n");

            promptBuilder.append("{\n");
            promptBuilder.append("  \"tags\": [\"...\"],\n");
            promptBuilder.append("  \"data\": \"...\",\n");
            promptBuilder.append("  \"header\": \"...\",\n");
            promptBuilder.append("  \"summary\": \"...\",\n");
            promptBuilder.append("  \"codeExamples\": [\n");
            promptBuilder.append("    {\n");
            promptBuilder.append("      \"language\": \"...\",\n");
            promptBuilder.append("      \"code\": \"...\"\n");
            promptBuilder.append("    }\n");
            promptBuilder.append("  ]\n");
            promptBuilder.append("}\n");


            String prompt = promptBuilder.toString();

            // Build Gemini-compliant request body
            Map<String, Object> userMessage = Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", prompt))
            );

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(userMessage)
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    endpoint + "?key=" + apiKey,
                    HttpMethod.POST,
                    request,
                    String.class
            );

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new Exception("Error from Gemini: HTTP " + response.getStatusCode() + " " + response.getBody());
            }

            // Parse Gemini response
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response.getBody());
            JsonNode candidates = root.path("candidates");

            if (!candidates.isArray() || candidates.isEmpty()) {
                throw new Exception("Error: Gemini returned no candidates");
            }

            JsonNode content = candidates.get(0).path("content");
            JsonNode parts = content.path("parts");

            if (!parts.isArray() || parts.isEmpty()) {
                throw new Exception("Error: Gemini response is missing parts");
            }

            String generatedText = parts.get(0).path("text").asText();

            int jsonStart = generatedText.indexOf('{');
            int jsonEnd = generatedText.lastIndexOf('}');
            if (jsonStart == -1 || jsonEnd == -1 || jsonEnd <= jsonStart) {
                throw new Exception("Error: Gemini response does not contain valid JSON structure");
            }

            String cleanedJson = generatedText.substring(jsonStart, jsonEnd + 1);


            // Attempt to parse generated JSON
            JsonNode result = mapper.readTree(cleanedJson);

            List<String> tags = new ArrayList<>();
            JsonNode tagsNode = result.path("tags");
            if (tagsNode.isArray()) {
                for (JsonNode tag : tagsNode) {
                    tags.add(tag.asText());
                }
            }

            String data = result.path("data").asText("");
            String header = result.path("header").asText("");
            String summary = result.path("summary").asText("");

            List<Map<String, String>> codeExamples = new ArrayList<>();
            JsonNode codeExamplesNode = result.path("code examples");
            if (codeExamplesNode.isArray()) {
                for (JsonNode exampleNode : codeExamplesNode) {
                    if (exampleNode.has("language") && exampleNode.has("code")) {
                        codeExamples.add(Map.of(
                                "language", exampleNode.get("language").asText(),
                                "code", exampleNode.get("code").asText()
                        ));
                    }
                }
            }

            Map<String, Object> validatedResponse = new HashMap<>();
            validatedResponse.put("tags", tags);
            validatedResponse.put("data", data);
            validatedResponse.put("header", header);
            validatedResponse.put("summary", summary);
            validatedResponse.put("codeExamples", codeExamples);

            return validatedResponse;

        } catch (Exception e) {
            return Map.of("error", "Error from Gemini: " + e.getMessage());
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

        return askGemini(finalPrompt.toString(), "user").toString();
    }
}