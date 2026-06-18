package com.vdt.vtit.user.service;

import com.vdt.vtit.user.dto.ChangePasswordRequest;
import com.vdt.vtit.user.dto.UserRegisterRequest;
import com.vdt.vtit.user.dto.UserResponse;
import com.vdt.vtit.user.dto.UserUpdateRequest;
import org.springframework.data.domain.Page;

import java.util.List;

public interface UserService {

    UserResponse createUser(UserRegisterRequest request);

    UserResponse getUserById(Long id);
    UserResponse getUserByEmail(String email);
    List<UserResponse> getAllUsers();
    Page<UserResponse> getUsersWithPagination(int page, int size, String sortBy, String sortDir);

    UserResponse updateUser(Long id, UserUpdateRequest request);
    void changePassword(Long id, ChangePasswordRequest request);

    void toggleUserStatus(Long id, boolean enabled);

    void deleteUser(Long id);
}
