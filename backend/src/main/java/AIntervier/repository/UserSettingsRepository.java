package AIntervier.repository;

import AIntervier.model.UserSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSettingsRepository extends JpaRepository<UserSettings, Long> {
}
