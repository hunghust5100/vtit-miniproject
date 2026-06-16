package com.vdt.vtit.auth.service;

import com.vdt.vtit.auth.dto.AuthResponse;
import com.vdt.vtit.auth.dto.LoginRequest;
import com.vdt.vtit.auth.dto.RegisterRequest;
import com.vdt.vtit.common.exception.BadRequestException;
import com.vdt.vtit.security.jwt.JwtUtils;
import com.vdt.vtit.user.entity.User;
import com.vdt.vtit.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Email đã tồn tại. Vui lòng thử lại với email khác!");
        }

        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .phoneNumber(request.phoneNumber())
                .role("USER")
                .enabled(true)
                .build();

        User savedUser = userRepository.save(user);

        String token = jwtUtils.generateToken(savedUser.getEmail());

        return AuthResponse.builder()
                .token(token)
                .email(savedUser.getEmail())
                .fullName(savedUser.getFullName())
                .role(savedUser.getRole())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        } catch (BadCredentialsException e) {
            throw new BadRequestException("Email hoặc mật khẩu không chính xác!");
        }

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadRequestException("Không tìm thấy người dùng!"));

        String token = jwtUtils.generateToken(user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }
}
