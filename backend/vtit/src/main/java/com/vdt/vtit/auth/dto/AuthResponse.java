package com.vdt.vtit.auth.dto;

import lombok.Builder;

@Builder
public record AuthResponse(
        String token,
        Long id,
        String email,
        String fullName,
        String role
) {
}
