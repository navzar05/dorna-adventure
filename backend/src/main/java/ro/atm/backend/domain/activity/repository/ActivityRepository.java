package ro.atm.backend.domain.activity.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import ro.atm.backend.domain.activity.entity.Activity;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {

    List<Activity> findByActiveTrue();

    List<Activity> findByCategoryId(Long categoryId);

    List<Activity> findByCategoryIdAndActiveTrue(Long categoryId);

    List<Activity> findByLocationContainingIgnoreCase(String location);

    List<Activity> findByPricePerPersonLessThanEqual(BigDecimal maxPrice);

    @Query("SELECT a FROM Activity a WHERE a.active = true AND a.pricePerPerson BETWEEN :minPrice AND :maxPrice")
    List<Activity> findByPriceRange(BigDecimal minPrice, BigDecimal maxPrice);

    @Query("SELECT a FROM Activity a WHERE a.active = true AND a.maxParticipants >= :participants")
    List<Activity> findByMinimumCapacity(Integer participants);

    long countByCategoryId(Long id);
}