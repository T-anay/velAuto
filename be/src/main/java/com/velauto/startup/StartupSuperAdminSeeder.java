package com.velauto.startup;

import com.velauto.entity.Staff;
import com.velauto.entity.User;
import com.velauto.entity.enums.Role;
import com.velauto.repository.StaffRepository;
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
  private final StaffRepository staffRepository;
  private final PasswordEncoder passwordEncoder;

  private static final String SUPER_ADMIN_EMAIL = "superadmin@velauto.com";
  private static final String SUPER_ADMIN_PASSWORD = "Admin123";
  private static final String SUPER_ADMIN_PHONE = "+900000000000";

  @Override
  @Transactional
  public void run(String... args) {
    if (staffRepository.existsActiveStaffByUserRole(Role.SUPER_ADMIN)) {
      log.info("Super admin staff kaydi zaten mevcut");
      return;
    }

    User superAdmin = userRepository.findByEmail(SUPER_ADMIN_EMAIL).orElseGet(User::new);
    superAdmin.setEmail(SUPER_ADMIN_EMAIL);
    superAdmin.setPasswordHash(passwordEncoder.encode(SUPER_ADMIN_PASSWORD));
    superAdmin.setRole(Role.SUPER_ADMIN);
    superAdmin.setActive(true);
    superAdmin.setCreatedBy(null);
    superAdmin.setPhone(SUPER_ADMIN_PHONE);
    superAdmin.setDeletedAt(null);
    if (superAdmin.getCreatedAt() == null) {
      superAdmin.setCreatedAt(LocalDateTime.now());
    }

    User savedUser = userRepository.saveAndFlush(superAdmin);

    Staff staff = new Staff();
    staff.setUser(savedUser);
    staff.setFullName("VelAuto Super Admin");
    staff.setPhone(SUPER_ADMIN_PHONE);
    staffRepository.save(staff);

    log.info("Super admin staff olarak olusturuldu: {}", SUPER_ADMIN_EMAIL);
  }
}
