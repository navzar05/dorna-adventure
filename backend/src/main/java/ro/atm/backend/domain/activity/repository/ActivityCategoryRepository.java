package ro.atm.backend.domain.activity.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ro.atm.backend.domain.activity.entity.ActivityCategory;

import java.util.List;
import java.util.Optional;

@Repository
public interface ActivityCategoryRepository extends JpaRepository<ActivityCategory, Long> {

    Optional<ActivityCategory> findBySlug(String slug);

    List<ActivityCategory> findByActiveTrueOrderByDisplayOrderAsc();

    boolean existsByName(String name);

    boolean existsBySlug(String slug);
}