package AIntervier.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.*;

@Service
public class EnhancedGeminiService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String embeddingServiceUrl = "http://localhost:8000";

    @Value("${gemini.api-key}")
    private String apiKey;

    @Value("${gemini.endpoint}")
    private String endpoint;

    // Контекстный буфер для диалога
    private List<Map<String, String>> contextBuffer = new ArrayList<>();

    public EnhancedGeminiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Получает релевантные чанки из сервиса эмбеддингов
     */
    private List<String> getRelevantContext(String query, int maxChunks, double minScore) {
        try {
            String searchUrl = embeddingServiceUrl + "/search";

            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("query", query);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    searchUrl,
                    HttpMethod.POST,
                    request,
                    String.class
            );

            JsonNode jsonResponse = objectMapper.readTree(response.getBody());
            List<String> contextChunks = new ArrayList<>();

            int count = 0;
            for (JsonNode hit : jsonResponse) {
                if (count >= maxChunks) break;

                double score = hit.get("score").asDouble();
                if (score >= minScore) {
                    String chunk = hit.get("chunk").asText();
                    String filename = hit.get("filename").asText();

                    contextChunks.add(String.format("[Источник: %s | Релевантность: %.2f]\n%s",
                            filename, score, chunk));
                    count++;
                }
            }

            return contextChunks;

        } catch (Exception e) {
            System.err.println("Ошибка при получении контекста: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Добавляет сообщение в контекстный буфер
     */
    public void addToContext(String role, String text) {
        Map<String, String> turn = new HashMap<>();
        turn.put("role", role);
        turn.put("text", text);
        contextBuffer.add(turn);

        // Ограничиваем размер буфера (например, последние 10 сообщений)
        if (contextBuffer.size() > 10) {
            Map<String, String> toRemove = contextBuffer.get(0);
            contextBuffer.remove(toRemove);
        }
    }

    /**
     * Очищает контекстный буфер
     */
    public void clearContext() {
        contextBuffer.clear();
    }

    /**
     * Основной метод с обогащением контекста из эмбеддингов
     */
    public Map<String, Object> askGeminiWithEmbeddings(String userPrompt) {
        return askGeminiWithEmbeddings(userPrompt, 5, 0.7);
    }

    /**
     * Расширенный метод с настройками эмбеддингов
     */
    public Map<String, Object> askGeminiWithEmbeddings(String userPrompt, int maxChunks, double minScore) {
        // Получаем релевантный контекст из эмбеддингов
        List<String> embeddingContext = getRelevantContext(userPrompt, maxChunks, minScore);

        // Добавляем контекст из эмбеддингов в буфер
        if (!embeddingContext.isEmpty()) {
            StringBuilder embeddingContextText = new StringBuilder();
            embeddingContextText.append("=== КОНТЕКСТ ИЗ ДОКУМЕНТОВ ===\n");
            for (int i = 0; i < embeddingContext.size(); i++) {
                embeddingContextText.append(String.format("Документ %d:\n%s\n\n", i + 1, embeddingContext.get(i)));
            }
            embeddingContextText.append("=== КОНЕЦ КОНТЕКСТА ===\n");

            addToContext("system", embeddingContextText.toString());
        }

        // Добавляем пользовательский запрос
        addToContext("user", userPrompt);

        // Отправляем запрос в Gemini
        Map<String, Object> response = sendGeminiRequest();

        // Если ответ успешный, добавляем его в контекст
        if (!response.containsKey("error")) {
            String responseText = String.format("Заголовок: %s\nСводка: %s\nДанные: %s",
                    response.get("header"), response.get("summary"), response.get("data"));
            addToContext("assistant", responseText);
        }

        return response;
    }

    /**
     * Оригинальный метод sendGeminiRequest с небольшими доработками
     */
    private Map<String, Object> sendGeminiRequest() {
        try {
            // Prepare the prompt with context
            StringBuilder promptBuilder = new StringBuilder();
            promptBuilder.append("Context:\n");
            for (Map<String, String> turn : contextBuffer) {
                String role = turn.get("role");
                String text = turn.get("text");
                promptBuilder.append(String.format("[%s]: %s\n", role.toUpperCase(), text));
            }
            promptBuilder.append("\nRespond strictly in valid JSON format using this structure. ");
            promptBuilder.append("Always fill in the following fields: \"tags\", \"data\", \"header\", and \"summary\". ");
            promptBuilder.append("The field \"codeExamples\" is optional and should only be included if relevant.\n");
            promptBuilder.append("Use the provided document context to give accurate and relevant answers.\n");

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
            JsonNode root = objectMapper.readTree(response.getBody());
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
            JsonNode result = objectMapper.readTree(cleanedJson);

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
            JsonNode codeExamplesNode = result.path("codeExamples");
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

    /**
     * Обычный запрос без эмбеддингов (совместимость с существующим кодом)
     */
    public Map<String, Object> askGemini(String userPrompt) {
        addToContext("user", userPrompt);
        Map<String, Object> response = sendGeminiRequest();

        if (!response.containsKey("error")) {
            String responseText = String.format("Заголовок: %s\nСводка: %s\nДанные: %s",
                    response.get("header"), response.get("summary"), response.get("data"));
            addToContext("assistant", responseText);
        }

        return response;
    }

    /**
     * Метод с fallback
     */
    public Map<String, Object> askGeminiWithFallback(String userPrompt) {
        if (isEmbeddingServiceAvailable()) {
            return askGeminiWithEmbeddings(userPrompt);
        } else {
            System.out.println("Сервис эмбеддингов недоступен, используем обычный режим");
            return askGemini(userPrompt);
        }
    }

    /**
     * Проверка доступности сервиса эмбеддингов
     */
    public boolean isEmbeddingServiceAvailable() {
        try {
            String healthUrl = embeddingServiceUrl + "/docs";
            ResponseEntity<String> response = restTemplate.getForEntity(healthUrl, String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Получение текущего контекста (для отладки)
     */
    public List<Map<String, String>> getContext() {
        return new ArrayList<>(contextBuffer);
    }
}