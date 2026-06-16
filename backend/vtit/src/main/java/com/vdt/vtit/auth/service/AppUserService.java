package com.vdt.vtit.auth.service;

import com.vdt.vtit.user.entity.User;
import com.vdt.vtit.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AppUserService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public AppUser loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng!"));

        return new AppUser(user);
    }
}
