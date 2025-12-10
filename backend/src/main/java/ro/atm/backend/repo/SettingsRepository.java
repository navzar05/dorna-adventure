package ro.atm.backend.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.atm.backend.entity.Settings;

public interface SettingsRepository extends JpaRepository<Settings, Long> {
}