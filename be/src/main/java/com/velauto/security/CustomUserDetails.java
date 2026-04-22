package com.velauto.security;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;

@Getter
public class CustomUserDetails extends User {

  private final Integer userId;
  private final Integer tenantId;

  public CustomUserDetails(
      String username,
      String password,
      Collection<? extends GrantedAuthority> authorities,
      Integer userId,
      Integer tenantId) {
    super(username, password, authorities);
    this.userId = userId;
    this.tenantId = tenantId;
  }

  public CustomUserDetails(
      String username,
      String password,
      boolean enabled,
      boolean accountNonExpired,
      boolean credentialsNonExpired,
      boolean accountNonLocked,
      Collection<? extends GrantedAuthority> authorities,
      Integer userId,
      Integer tenantId) {
    super(username, password, enabled, accountNonExpired, credentialsNonExpired, accountNonLocked, authorities);
    this.userId = userId;
    this.tenantId = tenantId;
  }
}

