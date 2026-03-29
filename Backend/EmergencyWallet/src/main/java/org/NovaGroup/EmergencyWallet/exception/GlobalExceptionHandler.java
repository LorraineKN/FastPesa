package org.NovaGroup.EmergencyWallet.exception;

import lombok.extern.slf4j.Slf4j;
import org.NovaGroup.EmergencyWallet.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<Object>> handleApiException(ApiException ex, WebRequest request) {
        log.error("API Exception: {} - {}", ex.getErrorCode(), ex.getMessage());
        
        HttpStatus status = mapErrorCodeToStatus(ex.getErrorCode());
        return new ResponseEntity<>(
            ApiResponse.error(ex.getErrorCode(), ex.getMessage()),
            status
        );
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadCredentials(BadCredentialsException ex, WebRequest request) {
        log.error("Bad credentials: {}", ex.getMessage());
        return new ResponseEntity<>(
            ApiResponse.error("INVALID_CREDENTIALS", "Invalid email or password"),
            HttpStatus.UNAUTHORIZED
        );
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Object>> handleAuthenticationException(AuthenticationException ex, WebRequest request) {
        log.error("Authentication failed: {}", ex.getMessage());
        return new ResponseEntity<>(
            ApiResponse.error("AUTHENTICATION_FAILED", "Authentication failed"),
            HttpStatus.UNAUTHORIZED
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationException(MethodArgumentNotValidException ex, WebRequest request) {
        log.error("Validation error: {}", ex.getMessage());
        
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
            errors.put(error.getField(), error.getDefaultMessage())
        );

        String errorMessage = errors.values().stream()
            .collect(Collectors.joining("; "));

        return new ResponseEntity<>(
            ApiResponse.error("VALIDATION_ERROR", errorMessage, errors),
            HttpStatus.BAD_REQUEST
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception ex, WebRequest request) {
        log.error("Unexpected error", ex);
        return new ResponseEntity<>(
            ApiResponse.error("INTERNAL_ERROR", "An unexpected error occurred"),
            HttpStatus.INTERNAL_SERVER_ERROR
        );
    }

    private HttpStatus mapErrorCodeToStatus(String errorCode) {
        return switch (errorCode) {
            case "DUPLICATE_EMAIL", "DUPLICATE_USERNAME" -> HttpStatus.CONFLICT;
            case "USER_NOT_FOUND", "WALLET_NOT_FOUND" -> HttpStatus.NOT_FOUND;
            case "INVALID_CREDENTIALS" -> HttpStatus.UNAUTHORIZED;
            case "INVALID_AMOUNT", "INSUFFICIENT_BALANCE", "INVALID_TRANSFER" -> HttpStatus.BAD_REQUEST;
            default -> HttpStatus.INTERNAL_SERVER_ERROR;
        };
    }
}
