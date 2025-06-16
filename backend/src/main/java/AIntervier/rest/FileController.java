package AIntervier.rest;

import AIntervier.embedding.FileTextExtractor;
import AIntervier.embedding.RemoteEmbeddingService;
import AIntervier.service.FileParserService;
import AIntervier.service.QdrantService;
import org.springframework.ai.document.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/files")
public class FileController {

    @Autowired
    private RemoteEmbeddingService embedding;

    @Autowired
    private QdrantService qdrant;

    @PostMapping("/upload")
    public ResponseEntity<String> upload(@RequestPart("file") MultipartFile file) throws Exception {
        File temp = null;
        try {
            temp = File.createTempFile("upload-", file.getOriginalFilename());
            file.transferTo(temp);
            String text = FileTextExtractor.extractText(temp);

            List<String> chunks = splitIntoChunks(text, 500);
            List<Document> docs = chunks.stream().map(Document::new).toList();
            float[] vectors = embedding.embedAll(docs);

            qdrant.upsertVectors("context", List.of(vectors), chunks);

            return ResponseEntity.ok("Uploaded " + chunks.size() + " chunks to Qdrant");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Ошибка обработки файла: " + e.getMessage());
        } finally {
            if (temp != null) {
                temp.delete();
            }
        }
    }

    public static List<String> splitIntoChunks(String text, int chunkSize) {
        List<String> chunks = new ArrayList<>();
        int length = text.length();

        for (int i = 0; i < length; i += chunkSize) {
            chunks.add(text.substring(i, Math.min(length, i + chunkSize)));
        }

        return chunks;
    }
}