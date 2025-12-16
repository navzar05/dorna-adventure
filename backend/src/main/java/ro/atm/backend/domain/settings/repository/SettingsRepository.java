package ro.atm.backend.domain.settings.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.atm.backend.domain.settings.entity.Settings;

public interface SettingsRepository extends JpaRepository<Settings, Long> {
}
