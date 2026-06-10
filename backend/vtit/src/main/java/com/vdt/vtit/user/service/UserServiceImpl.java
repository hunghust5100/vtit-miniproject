package com.vdt.vtit.user.service;

import com.vdt.vtit.common.exception.BadRequestException;
import com.vdt.vtit.common.exception.ResourceNotFoundException;
import com.vdt.vtit.user.dto.ChangePasswordRequest;
import com.vdt.vtit.user.dto.UserRegisterRequest;
import com.vdt.vtit.user.dto.UserResponse;
import com.vdt.vtit.user.dto.UserUpdateRequest;
import com.vdt.vtit.user.entity.User;
import com.vdt.vtit.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService{

    private final UserRepository userRepository;

    // Create
    @Override
    public UserResponse createUser(UserRegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email đã tồn tại. Vui lòng thử lại với email khác!");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(request.getPassword())
                .fullName(request.getFullName())
                .role("ROLE_USER")
                .phoneNumber(request.getPhoneNumber())
                .enabled(true)
                .build();

        User savedUser = userRepository.save(user);

        return mapToUserResponse(savedUser);
    }

    // Read
    @Override
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        return mapToUserResponse(user);
    }


    @Override
    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng có email " + email));

        return mapToUserResponse(user);
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    // Update
    @Override
    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        user.setFullName(request.getFullName());
        user.setBirthday(request.getBirthday());
        user.setPhoneNumber(request.getPhoneNumber());

        User updateUser = userRepository.save(user);

        return mapToUserResponse(updateUser);
    }

    @Override
    public void changePassword(Long id, ChangePasswordRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy người dùng"));

        if (!request.getOldPassword().equals(user.getPassword())) {
            throw new RuntimeException("Mật khẩu cũ không chính xác!");
        }

        user.setPassword(request.getNewPassword());
        User save = userRepository.save(user);
    }

    @Override
    public void toggleUserStatus(Long id, boolean enabled) {

    }

    // Delete
    @Override
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy người dùng"));
        userRepository.deleteById(id);
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .birthday(user.getBirthday())
                .createdAt(user.getCreatedAt())
                .build();
    }

}
