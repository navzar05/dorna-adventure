package ro.atm.backend.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.atm.backend.entity.User;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    public Optional<User> findByUsername(String username);
}
