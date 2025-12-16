package ro.atm.backend.domain.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import ro.atm.backend.domain.auth.dto.RegisterRequest;
import ro.atm.backend.domain.auth.entity.Role;
import ro.atm.backend.domain.auth.entity.User;
import ro.atm.backend.domain.user.repository.RoleRepository;
import ro.atm.backend.domain.user.repository.UserRepository;
import ro.atm.backend.common.constants.SecurityConstants;
import ro.atm.backend.common.exception.ResourceNotFoundException;

import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private final PasswordEncoder passwordEncoder;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public RegisterRequest addUser(RegisterRequest registerRequest) {
        User user = new User();
        user.setEmail(registerRequest.getEmail());
        user.setUsername(registerRequest.getUsername());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setFirstName(registerRequest.getFirstName());
        user.setLastName(registerRequest.getLastName());
        user.setPhoneNumber(registerRequest.getPhoneNumber());

        Role userRole = roleRepository.findByName(SecurityConstants.Roles.USER)
                .orElseThrow(() -> new ResourceNotFoundException("Role", SecurityConstants.Roles.USER));
        Set<Role> roles = new HashSet<>();
        roles.add(userRole);
        user.setRoles(roles);

        userRepository.save(user);
        return registerRequest;
    }
}
