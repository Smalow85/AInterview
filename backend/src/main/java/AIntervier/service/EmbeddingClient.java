package AIntervier.service;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.List;
import java.util.Map;

@Service
public class EmbeddingClient {

    private final WebClient webClient;

    public EmbeddingClient(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder
                .baseUrl("http://localhost:8000") // адрес твоего Python-сервиса
                .build();
    }

    public List<Float> getEmbedding(String text) {
        Map<String, String> requestBody = Map.of("text", text);

        Map response = webClient.post()
                .uri("/embed")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (response != null && response.containsKey("embedding")) {
            return ((List<?>) response.get("embedding")).stream()
                    .map(val -> ((Number) val).floatValue())
                    .toList();
        }

        throw new RuntimeException("Invalid response from embedding service");
    }

    public List<Float> getBatchEmbeddings(List<String> texts) {
        Map<String, List<String>> requestBody = Map.of("text", texts);

        Map response = webClient.post()
                .uri("/embed-by-batch")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (response != null && response.containsKey("embedding")) {
            return ((List<?>) response.get("embedding")).stream()
                    .map(val -> ((Number) val).floatValue())
                    .toList();
        }

        throw new RuntimeException("Invalid response from embedding service");
    }
}