package org.NovaGroup.EmergencyWallet.controller;

import lombok.extern.slf4j.Slf4j;
import org.NovaGroup.EmergencyWallet.dto.ApiResponse;
import org.NovaGroup.EmergencyWallet.dto.AuthRequest;
import org.NovaGroup.EmergencyWallet.dto.AuthResponse;
import org.NovaGroup.EmergencyWallet.dto.RegisterRequest;
import org.NovaGroup.EmergencyWallet.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@Slf4j
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Register request for email: {}", request.getEmail());
        AuthResponse response = authService.register(request);
        return new ResponseEntity<>(ApiResponse.success("User registered successfully", response), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest request) {
        log.info("Login request for email: {}", request.getEmail());
        AuthResponse response = authService.login(request);
        return new ResponseEntity<>(ApiResponse.success("Login successful", response), HttpStatus.OK);
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Object>> health() {
        return new ResponseEntity<>(ApiResponse.success("Service is healthy", null), HttpStatus.OK);
    }
}
