package AIntervier.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.HashMap;
import java.util.ArrayList;


@Service
public class QdrantService {

    @Value("${qdrant.url:http://localhost:6334}")
    private String qdrantUrl;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();


    public void upsertVectors(String collection, List<float[]> vectors, List<String> texts) {
        try {
            Map<String, Object> body = Map.of("points", createPoints(vectors, texts));
            restTemplate.put(qdrantUrl + "/collections/" + collection + "/points", body, String.class);
        } catch (Exception e) {
            throw new RuntimeException("Error upserting vectors: " + e.getMessage(), e);
        }
    }

    public void deleteCollection(String collection) {
        try {
            restTemplate.delete(qdrantUrl + "/collections/" + collection);
            System.out.println("Collection deleted: " + collection);
        } catch (HttpClientErrorException.NotFound e) {
            System.out.println("Collection not found: " + collection); // Handle not found
        } catch (Exception e) {
            throw new RuntimeException("Error deleting collection: " + e.getMessage(), e);
        }
    }

    private List<Map<String, Object>> createPoints(List<float[]> vectors, List<String> texts) {
        List<Map<String, Object>> points = new ArrayList<>();
        for (int i = 0; i < vectors.size(); i++) {
            points.add(Map.of(
                    "id", UUID.randomUUID().toString(),
                    "vector", vectors.get(i),
                    "payload", Map.of("text", texts.get(i))
            ));
        }
        return points;
    }

    public List<String> search(String collection, float[] vector, int limit) {
        boolean exists = checkCollectionExists(collection);
        if (!exists) {
            createCollection(collection);
        }
        try{
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("vector", vector);
            requestBody.put("limit", limit);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(qdrantUrl + "/collections/" + collection + "/points/search", request, Map.class);

            if(response.getStatusCode().is2xxSuccessful()){
                return extractTextFromResponse(response.getBody());
            } else{
                throw new RuntimeException("Error during search: " + response.getStatusCode());
            }
        } catch (HttpClientErrorException e){
            throw new RuntimeException("HTTP error during search: " + e.getStatusCode(), e);
        } catch (Exception e){
            throw new RuntimeException("Error during search: " + e.getMessage(), e);
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
            restTemplate.getForEntity(qdrantUrl + "/collections/" + collection, Void.class);
            return true;
        } catch (HttpClientErrorException.NotFound e) {
            return false;
        } catch (Exception e) {
            throw new RuntimeException("Error checking collection: " + e.getMessage(), e);
        }
    }

    private void createCollection(String collection) {
        String createBody = """
                {
                    "vectors": {
                        "size": 384,
                        "distance": "Cosine"
                    }
                }
                """;

        try {
            restTemplate.put(qdrantUrl + "/collections/" + collection, createBody, String.class);
            System.out.println("Collection created: " + collection);
        } catch (Exception e) {
            throw new RuntimeException("Error creating collection: " + e.getMessage(), e);
        }
    }
}
