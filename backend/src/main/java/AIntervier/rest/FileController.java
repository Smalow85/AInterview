package AIntervier.rest;

import AIntervier.embedding.RemoteEmbeddingService;
import AIntervier.service.FileParserService;
import AIntervier.service.QdrantService;
import org.springframework.ai.document.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/files")
public class FileController {

    @Autowired
    private FileParserService fileParser;

    @Autowired
    private RemoteEmbeddingService embedding;

    @Autowired
    private QdrantService qdrant;

    @PostMapping("/upload")
    public String upload(@RequestParam("file") MultipartFile file) throws Exception {
        String text = fileParser.parseTextFile(file.getInputStream());

        List<String> chunks = List.of(text.split("(?<=\\G.{500})"));
        List<Document> docs = chunks.stream().map(Document::new).toList();
        float[] vectors = embedding.embedAll(docs);

        qdrant.upsertVectors("context", List.of(vectors), chunks);

        return "Uploaded " + chunks.size() + " chunks to Qdrant";
    }
}