package com.velauto.startup;

import com.velauto.entity.Tenant;
import com.velauto.entity.User;
import com.velauto.entity.enums.Role;
import com.velauto.repository.TenantRepository;
import com.velauto.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class StartupSuperAdminSeeder implements CommandLineRunner {

  private final UserRepository userRepository;
  private final TenantRepository tenantRepository;
  private final PasswordEncoder passwordEncoder;

  private static final String SUPER_ADMIN_EMAIL = "superadmin@velauto.com";
  private static final String SUPER_ADMIN_PASSWORD = "Admin123";

  @Override
  @Transactional
  public void run(String... args) throws Exception {

    // 1. ÖNCE DÜKKANI (TENANT) BUL VEYA ZORLA YARAT
    Tenant defaultTenant;
    List<Tenant> existingTenants = tenantRepository.findAll();

    if (existingTenants.isEmpty()) {
      Tenant newTenant = new Tenant();
      newTenant.setName("Merkez Şube");
      newTenant.setCode("MERKEZ-01");
      newTenant.setActive(true);

      // saveAndFlush ile anında veritabanına yazdırıyoruz!
      defaultTenant = tenantRepository.saveAndFlush(newTenant);
      log.info("Varsayılan dükkan oluşturuldu. ID: {}", defaultTenant.getId());
    } else {
      defaultTenant = existingTenants.get(0);
    }

    // 2. SONRA SUPER ADMIN'İ OLUŞTUR VE O DÜKKANA BAĞLA
    if (userRepository.existsByEmail(SUPER_ADMIN_EMAIL)) {
      log.info("Super admin mevcut: {}", SUPER_ADMIN_EMAIL);
      return;
    }

    User superAdmin = new User();
    superAdmin.setEmail(SUPER_ADMIN_EMAIL);
    superAdmin.setPasswordHash(passwordEncoder.encode(SUPER_ADMIN_PASSWORD));
    superAdmin.setRole(Role.SUPER_ADMIN);
    superAdmin.setActive(true);
    superAdmin.setCreatedBy(null);
    superAdmin.setTenantId(defaultTenant.getId());

    superAdmin.setDeletedAt(null);
    superAdmin.setCreatedAt(LocalDateTime.now());
    superAdmin.setPhone("+900000000000");

    userRepository.saveAndFlush(superAdmin);

    log.info("Super admin oluşturuldu: {}", SUPER_ADMIN_EMAIL);
  }
}