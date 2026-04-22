package com.velauto.startup;

import com.velauto.entity.User;
import com.velauto.entity.enums.Role;
import com.velauto.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class StartupSuperAdminSeeder implements CommandLineRunner {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  private static final String SUPER_ADMIN_EMAIL = "superadmin@velauto.com";
  private static final String SUPER_ADMIN_PASSWORD = "Admin123";

  @Override
  @Transactional
  public void run(String... args) throws Exception {
    if (userRepository.existsByEmail(SUPER_ADMIN_EMAIL)) {
      log.info("Super admin mevcut: {}", SUPER_ADMIN_EMAIL);
      return;
    }

    User superAdmin = new User();
    superAdmin.setEmail(SUPER_ADMIN_EMAIL);
    superAdmin.setPasswordHash(passwordEncoder.encode(SUPER_ADMIN_PASSWORD));
    superAdmin.setRole(Role.super_admin);
    superAdmin.setActive(true);
    superAdmin.setCreatedBy(null);
    superAdmin.setTenantId(null);
    superAdmin.setDeletedAt(null);
    superAdmin.setCreatedAt(LocalDateTime.now());
    superAdmin.setPhone("+900000000000");

    userRepository.save(superAdmin);

    log.info("Super admin oluşturuldu: {}", SUPER_ADMIN_EMAIL);
  }
}

