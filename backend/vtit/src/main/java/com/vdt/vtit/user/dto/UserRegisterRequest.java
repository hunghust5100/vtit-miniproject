package com.vdt.vtit.user.dto;

import lombok.Data;

@Data
public class UserRegisterRequest {
    private String email;
    private String password;
    private String fullName;
    private String phoneNumber;
    private String role;
}


