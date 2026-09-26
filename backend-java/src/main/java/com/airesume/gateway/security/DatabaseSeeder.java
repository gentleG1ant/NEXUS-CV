package com.airesume.gateway.security;

import com.airesume.gateway.model.Role;
import com.airesume.gateway.model.User;
import com.airesume.gateway.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap-admin.username:admin}")
    private String adminUsername;

    @Value("${app.bootstrap-admin.password:}")
    private String adminPassword;

    @Override
    public void run(String... args) throws Exception {
        if (!userRepository.existsByUsername(adminUsername) && !userRepository.findAll().iterator().hasNext()) {
            if (adminPassword == null || adminPassword.length() < 12) {
                throw new IllegalStateException("Set APP_BOOTSTRAP_ADMIN_PASSWORD to at least 12 characters for first start");
            }
            User admin = User.builder()
                    .username(adminUsername)
                    .password(passwordEncoder.encode(adminPassword))
                    .role(Role.ROLE_ADMIN)
                    .build();
            userRepository.save(admin);
            System.out.println("Initial admin account created: " + adminUsername);
        }
    }
}
