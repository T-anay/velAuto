package com.velauto.security;

import com.velauto.constant.Messages;
import com.velauto.entity.User;
import com.velauto.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

  private final UserRepository userRepository;

  @Override
  public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
    // Guard Clause 1: Email ile kullanıcıyı bul
    Optional<User> userOptional = userRepository.findByEmail(email);

    // Guard Clause 2: Kullanıcı bulunamadıysa erken dön
    if (userOptional.isEmpty()) {
      throw new UsernameNotFoundException(Messages.USER_NOT_FOUND);
    }

    // Kullanıcıyı değişkene ata
    User user = userOptional.get();

    // Guard Clause 3: Kullanıcı silinmişse erken dön
    if (user.getDeletedAt() != null) {
      throw new UsernameNotFoundException(Messages.USER_DELETED);
    }

    // Guard Clause 4: Kullanıcı aktif değilse erken dön
    if (!user.isActive()) {
      throw new UsernameNotFoundException(Messages.USER_INACTIVE);
    }

    // Authority oluştur (role'ü büyük harfe çevir)
    SimpleGrantedAuthority authority = new SimpleGrantedAuthority(user.getRole().name().toUpperCase());

    // CustomUserDetails nesnesi oluştur ve döndür
    CustomUserDetails userDetails = new CustomUserDetails(user.getEmail(), user.getPasswordHash(),
        user.isActive(),
        true, // accountNonExpired
        true, // credentialsNonExpired
        true, // accountNonLocked
        Collections.singletonList(authority),
        user.getId(),
        user.getTenantId()
    );

    return userDetails;
  }
}

