package AIntervier.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.List;
import java.util.Map;
import java.util.UUID;
@Service
public class QdrantService {

    @Value("${qdrant.url:http://localhost:6333}")
    private String qdrantUrl;

    private final WebClient client = WebClient.create();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public void upsertVectors(String collection, List<float[]> vectors, List<String> texts) {
        try {
            List<Map<String, Object>> payloads = vectors.stream().map((vector) -> Map.of(
                    "id", UUID.randomUUID().toString(),
                    "vector", vector,
                    "payload", Map.of("text", texts.get(vectors.indexOf(vector))))
            ).toList();

            Map<String, Object> body = Map.of("points", payloads);
            client.put()
                    .uri(qdrantUrl + "/collections/" + collection + "/points")
                    .bodyValue(body)
                .retrieve()
                    .toBodilessEntity()
                .block();
        } catch (WebClientResponseException e) {
            throw new RuntimeException("Error upserting vectors: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Error upserting vectors: " + e.getMessage(), e);
        }
    }

    public List<String> search(String collection, float[] vector, int limit) {
        boolean exists = checkCollectionExists(collection);
        if (!exists) {
            createCollection(collection);
        }

        try {
            Map<String, Object> body = Map.of("vector", vector, "limit", limit);
            ResponseEntity<Map> response = client.post()
                    .uri(qdrantUrl + "/collections/" + collection + "/points/search")
                    .bodyValue(body)
                    .retrieve()
                    .toEntity(Map.class)
                    .block();

            if(response != null && response.getStatusCode().is2xxSuccessful()){
                return extractTextFromResponse(response.getBody());
            } else{
                throw new RuntimeException("Error searching: "+ response.getStatusCode().toString());
            }
        } catch (WebClientResponseException e) {
            throw new RuntimeException("Error searching: " + e.getMessage(), e);
        }
    }

    private List<String> extractTextFromResponse(Map body) {
        try {
            List<Map<String, Object>> results = (List<Map<String, Object>>) body.get("result");
            return results.stream().map(result -> (String) result.get("payload")).toList();
        } catch (Exception e) {
            throw new RuntimeException("Error parsing JSON response: " + e.getMessage(), e);
        }
    }

    private boolean checkCollectionExists(String collection) {
        try {
            client.get()
                    .uri(qdrantUrl + "/collections/" + collection)
                    .retrieve()
                    .toBodilessEntity()
                    .block();
            return true;
        } catch (WebClientResponseException e) {
            return e.getStatusCode().value() == 404;
        } catch (Exception e) {
            throw new RuntimeException("Error checking collection: " + e.getMessage(), e);
        }
    }

    private void createCollection(String collection) {
        String createBody = """
        {
            "vectors": {
                "size": 1536,
                "distance": "Cosine"
            }
        }
        """;

        try {
            ResponseEntity<Void> response = client.put()
                    .uri(qdrantUrl + "/collections/" + collection)
                    .bodyValue(createBody)
                    .retrieve()
                    .toBodilessEntity()
                    .block();

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Error creating collection: " + response.getStatusCode());
            }

            System.out.println("Collection created: " + collection);
        } catch (WebClientResponseException e) {
            throw new RuntimeException("Error creating collection: " + e.getMessage(), e);
        }
    }
}
