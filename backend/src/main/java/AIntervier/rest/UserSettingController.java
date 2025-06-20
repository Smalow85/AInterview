package AIntervier.rest;

import AIntervier.model.UserSettings;
import AIntervier.model.UserSettingsRequest;
import AIntervier.repository.UserSettingsRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/settings")
public class UserSettingController {

    @Autowired
    private UserSettingsRepository repository;

    @GetMapping("/{userId}")
    public UserSettings getSettings(@PathVariable String userId) {
        return repository.findById(Long.parseLong(userId)).orElseGet(this::getDefaultUser);
    }

    @GetMapping("/{userId}/session")
    public String getActiveSession(@PathVariable String userId) {
        UserSettings settings = repository.findById(Long.parseLong(userId)).orElseGet(this::getDefaultUser);
        return settings.getActiveSessionId();
    }

    @PutMapping("/{userId}/save")
    public UserSettings createOfUpdateSettings(@PathVariable String userId, @RequestBody UserSettingsRequest request) {
        UserSettings settings = repository.findById(Long.parseLong(userId)).orElseGet(this::getDefaultUser);
        settings.setFirstName(request.getFirstName());
        settings.setLastName(request.getLastName());
        settings.setSystemInstruction(request.getSystemInstruction());
        settings.setLanguage(request.getLanguage());
        UserSettings updated = repository.save(settings);
        return updated;
    }

    private UserSettings getDefaultUser() {
        return repository.findById(1L).orElseThrow(EntityNotFoundException::new);
    }
}
