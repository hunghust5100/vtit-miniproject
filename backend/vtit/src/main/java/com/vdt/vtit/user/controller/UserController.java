package com.vdt.vtit.user.controller;

import com.vdt.vtit.user.dto.ChangePasswordRequest;
import com.vdt.vtit.user.dto.UserRegisterRequest;
import com.vdt.vtit.user.dto.UserResponse;
import com.vdt.vtit.user.dto.UserUpdateRequest;
import com.vdt.vtit.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<UserResponse> register(@Valid @RequestBody UserRegisterRequest request) {
        return new ResponseEntity<>(userService.createUser(request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        Page<UserResponse> userPage = userService.getUsersWithPagination(page, size, sortBy, sortDir);

        return ResponseEntity.ok(userPage);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateProfile(@PathVariable Long id,@Valid @RequestBody UserUpdateRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @PutMapping("/{id}/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@PathVariable Long id,@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(id, request);
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "Xóa người dùng thành công"));
    }

}
