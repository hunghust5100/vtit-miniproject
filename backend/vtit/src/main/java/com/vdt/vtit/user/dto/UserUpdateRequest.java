package com.vdt.vtit.user.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class UserUpdateRequest {
    private String fullName;
    private String phoneNumber;
    private LocalDate birthday;
    private String role;
}
