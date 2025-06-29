package AIntervier.service;

import AIntervier.model.InterviewPlan;
import AIntervier.rest.data.InterviewQestionRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
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

    private final RestTemplate restTemplate = new RestTemplate();
    private final AtomicBoolean requestInProgress = new AtomicBoolean(false);
    private final ExecutorService executor = Executors.newFixedThreadPool(5);

    public Map<String, Object> askGemini(String prompt, String jobTitle) {
        try {
            return sendGeminiRequest(jobTitle, prompt);
        } catch (Exception e) {
            return Map.of("error", e.getMessage());
        }
    }

    private Map<String, Object> sendGeminiRequest(String jobTitle, String promptText) {
        try {
            // Prepare the prompt with context
            StringBuilder promptBuilder = new StringBuilder();
            promptBuilder.append("System Instruction:\n");
            promptBuilder.append("You are an AI assistant helping conduct technical interviews.  Answer this question as a senior Java developer would. Use a structured approach: definition → key features → code example → use cases. If you have good and useful answer, generate a JSON response containing the card; otherwise, respond with an empty JSON object (`{}`).\n\n");

            promptBuilder.append("Question:\n").append(promptText).append("\n");
            promptBuilder.append("Interview Position:\n").append(jobTitle).append("\n");

            promptBuilder.append("Card Generation Criteria:\n");
            promptBuilder.append("Your answer should provide concise supplemental information to help the candidate check his or her answer for correctness and completeness.\n");

            promptBuilder.append("JSON Structure:\n");
            promptBuilder.append("```json\n");
            promptBuilder.append("{\n");
            promptBuilder.append("  \"generateCard\": true, // Set to false if no card is needed\n");
            promptBuilder.append("  \"card\": {\n");
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
            promptBuilder.append("  }\n");
            promptBuilder.append("}\n");
            promptBuilder.append("```\n");



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

            Map<String, Object> parsedResponse = new HashMap<>();

            JsonNode responseJson = mapper.readTree(cleanedJson);
            parsedResponse.put("generateCard", responseJson.get("generateCard").asBoolean());

            if (responseJson.has("card")) {
                Map<String, Object> cardData = new HashMap<>();
                // Attempt to parse generated JSON
                JsonNode cardNode = responseJson.get("card");

                if (cardNode.has("tags")) {
                    List<String> tags = new ArrayList<>();
                    for(JsonNode tagNode : cardNode.get("tags")) {
                        tags.add(tagNode.asText());
                    }
                    cardData.put("tags", tags);
                }

                if (cardNode.has("data")) cardData.put("data", cardNode.get("data").asText());
                if (cardNode.has("header")) cardData.put("header", cardNode.get("header").asText());
                if (cardNode.has("summary")) cardData.put("summary", cardNode.get("summary").asText());
                if(cardNode.has("codeExamples")) {
                    List<Map<String, String>> codeExamples = new ArrayList<>();
                    for(JsonNode exampleNode : cardNode.get("codeExamples")) {
                        codeExamples.add(Map.of("language", exampleNode.get("language").asText(), "code", exampleNode.get("code").asText()));
                    }
                    cardData.put("codeExamples", codeExamples);
                }
                parsedResponse.put("card", cardData);
            }
            return parsedResponse;
        } catch (Exception e) {
            return Map.of("error", "Error from Gemini: " + e.getMessage());
        }
    }

    public String askGeminiWithContext(String prompt) {
        List<String> contextChunks = List.of();

        StringBuilder finalPrompt = new StringBuilder("Context:\n");
        for (String c : contextChunks) {
            finalPrompt.append("- ").append(c).append("\n");
        }
        finalPrompt.append("\nQuestion: ").append(prompt);

        return askGemini(finalPrompt.toString(), "user").toString();
    }

    public InterviewPlan generateInterviewPlan(InterviewQestionRequest request) throws Exception {
        String prompt = buildPrompt(request);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> messageContent = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)
                        ))
                )
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(messageContent, headers);
        String fullUrl = endpoint + "?key=" + apiKey;

        ResponseEntity<String> response = restTemplate.postForEntity(fullUrl, entity, String.class);

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
        //String json = parseGeneratedText(cleanedJson);
        return mapper.readValue(cleanedJson, InterviewPlan.class);
    }

    private String buildPrompt(InterviewQestionRequest req) {
        return String.format("""
            Ты — AI-собеседователь. Сгенерируй JSON-структуру плана технического интервью для позиции "%s".
            Учитывай ключевые навыки: %s.
            Опыт кандидата: %s лет.

            Ответ верни строго в JSON-формате, без закрывающих и открывающих кавычек, комментариев или пояснений. Структура:
            {
              "phases": [
                {
                  "name": "Название фазы",
                  "questions": [
                    {
                      "text": "Вопрос текстом",
                      "type": "Technical",
                      "difficulty": "Medium",
                      "expectedKeywords": ["ключ", "слова"],
                      "evaluationCriteria": ["что оценивать"]
                    }
                  ]
                }
              ]
            }
            """,
                req.getJobTitle(),
                String.join(", ", req.getKeySkills()),
                req.getRequiredExperience()
        );
    }

    private String parseGeneratedText(String geminiResponse) throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(geminiResponse);
        return root
                .path("candidates")
                .get(0)
                .path("content")
                .path("parts")
                .get(0)
                .path("text")
                .asText();
    }

}