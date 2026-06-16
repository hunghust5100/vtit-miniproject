package com.vdt.vtit.security.jwt;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "jwt")
public record JwtProp(
        String secret,
        Long expiration
) {
}
