package AIntervier.rest;

import AIntervier.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/tools")
public class ToolsController {

    @Autowired
    private GeminiService geminiService;

    @PostMapping("/add-context")
    public ResponseEntity<Map<String, Object>> addContext(@RequestBody Map<String, String> requestBody) {
        try {
            String prompt = requestBody.get("prompt");
            if (prompt == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Prompt is missing"));
            }
            String response =  geminiService.askGeminiWithContext(prompt);
            return ResponseEntity.ok(Map.of("data", response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/summarize")
    public ResponseEntity<Map<String, String>> executeTool() {
        return ResponseEntity.ok(Map.of("data", "Here is your summary"));
    }
}
