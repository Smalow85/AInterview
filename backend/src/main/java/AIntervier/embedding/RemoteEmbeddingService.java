package AIntervier.embedding;

import AIntervier.service.EmbeddingClient;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.embedding.EmbeddingRequest;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.ai.embedding.Embedding;
import org.springframework.stereotype.Service;
import org.springframework.ai.document.Document;

import java.util.List;

@Service
public class RemoteEmbeddingService implements EmbeddingModel {

    private final EmbeddingClient embeddingClient;

    public RemoteEmbeddingService(EmbeddingClient embeddingClient) {
        this.embeddingClient = embeddingClient;
    }

    @Override
    public EmbeddingResponse call(EmbeddingRequest request) {
        List<Embedding> embeddings = request.getInstructions().stream()
                .map(text -> {
                    List<Float> vectorList = embeddingClient.getEmbedding(text);
                    float[] vector = new float[vectorList.size()];
                    for (int i = 0; i < vectorList.size(); i++) {
                        vector[i] = vectorList.get(i);
                    }
                    return new Embedding(vector, null);
                })
                .toList();

        return new EmbeddingResponse(embeddings);
    }

    @Override
    public float[] embed(Document document) {
        List<Float> vector = embeddingClient.getEmbedding(document.getText());
        float[] result = new float[vector.size()];
        for (int i = 0; i < vector.size(); i++) {
            result[i] = vector.get(i);
        }
        return result;
    }

    public float[] embedAll(List<Document> docs) {
        List<String> texts = docs.stream().map(Document::getText).toList();
        List<Float> vectors = embeddingClient.getBatchEmbeddings(texts);
        float[] result = new float[vectors.size()];
        for (int i = 0; i < vectors.size(); i++) {
            result[i] = vectors.get(i);
        }
        return result;
    }
}
