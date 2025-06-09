package AIntervier.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class QdrantService {

    @Value("${qdrant.url:http://localhost:6333}")
    private String qdrantUrl;

    private final WebClient client = WebClient.create();

    public void upsertVectors(String collection, List<float[]> vectors, List<String> texts) {
        List<Map<String, Object>> payloads = new ArrayList<>();
        for (int i = 0; i < vectors.size(); i++) {
            payloads.add(Map.of(
                    "id", UUID.randomUUID().toString(),
                    "vector", vectors.get(i),
                    "payload", Map.of("text", texts.get(i))
            ));
        }

        Map<String, Object> body = Map.of("points", payloads);

        client.put()
                .uri(qdrantUrl + "/collections/" + collection + "/points")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }

    public List<String> search(String collection, float[] vector, int limit) {
        Map<String, Object> body = Map.of(
                "vector", vector,
                "limit", limit
        );

        String result = client.post()
                .uri(qdrantUrl + "/collections/" + collection + "/points/search")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        List<String> results = new ArrayList<>();
        if (result != null && result.contains("payload")) {
            String[] parts = result.split("\"payload\":");
            for (int i = 1; i < parts.length; i++) {
                String text = parts[i].split(",")[0].replaceAll("[\"{}]", "").split(":")[1].trim();
                results.add(text);
            }
        }
        return results;
    }
}
