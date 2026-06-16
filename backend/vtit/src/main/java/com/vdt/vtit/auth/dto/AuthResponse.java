package com.vdt.vtit.auth.dto;

import lombok.Builder;

@Builder
public record AuthResponse(
        String token,
        String email,
        String fullName,
        String role
) {
}
