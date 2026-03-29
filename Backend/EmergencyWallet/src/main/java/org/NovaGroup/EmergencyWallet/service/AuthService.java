package org.NovaGroup.EmergencyWallet.service;

import lombok.extern.slf4j.Slf4j;
import org.NovaGroup.EmergencyWallet.dto.AuthRequest;
import org.NovaGroup.EmergencyWallet.dto.AuthResponse;
import org.NovaGroup.EmergencyWallet.dto.RegisterRequest;
import org.NovaGroup.EmergencyWallet.entity.User;
import org.NovaGroup.EmergencyWallet.entity.Wallet;
import org.NovaGroup.EmergencyWallet.exception.ApiException;
import org.NovaGroup.EmergencyWallet.repository.UserRepository;
import org.NovaGroup.EmergencyWallet.repository.WalletRepository;
import org.NovaGroup.EmergencyWallet.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;

@Service
@Slf4j
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Registering user: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApiException("Email already registered", "DUPLICATE_EMAIL");
        }

        if (request.getUsername() != null && userRepository.existsByUsername(request.getUsername())) {
            throw new ApiException("Username already taken", "DUPLICATE_USERNAME");
        }

        User user = User.builder()
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .fullName(request.getFullName())
            .username(request.getUsername())
            .phone(request.getPhone())
            .businessName(request.getBusinessName())
            .accountType(request.getAccountType() != null ?
                User.AccountType.valueOf(request.getAccountType().toUpperCase()) :
                User.AccountType.PERSONAL)
            .role(User.UserRole.USER)
            .build();

        user = userRepository.save(user);

        // Create default wallet
        Wallet wallet = Wallet.builder()
            .user(user)
            .walletName("Default Wallet")
            .balance(BigDecimal.ZERO)
            .currency("KES")
            .isActive(true)
            .isDemoFunded(false)
            .build();

        walletRepository.save(wallet);

        String token = tokenProvider.generateTokenFromEmail(user.getEmail());

        log.info("User registered successfully: {}", user.getId());

        return AuthResponse.builder()
            .token(token)
            .type("Bearer")
            .email(user.getEmail())
            .fullName(user.getFullName())
            .userId(user.getId())
            .build();
    }

    public AuthResponse login(AuthRequest request) {
        log.info("Logging in user: {}", request.getEmail());

        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getEmail(),
                request.getPassword()
            )
        );

        String token = tokenProvider.generateToken(authentication);
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new ApiException("User not found", "USER_NOT_FOUND"));

        log.info("User logged in successfully: {}", user.getId());

        return AuthResponse.builder()
            .token(token)
            .type("Bearer")
            .email(user.getEmail())
            .fullName(user.getFullName())
            .userId(user.getId())
            .build();
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new ApiException("User not found", "USER_NOT_FOUND"));
    }
}
