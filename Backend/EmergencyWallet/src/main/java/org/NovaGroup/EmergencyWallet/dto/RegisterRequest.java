package org.NovaGroup.EmergencyWallet.dto;

import lombok.*;
import jakarta.validation.constraints.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {
//    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
        message = "Password must contain uppercase, lowercase, digit, and special character"
    )
    private String password;

//    @NotBlank(message = "Full name is required")
//    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9_-]+$", message = "Username can only contain letters, numbers, underscores, and hyphens")
    private String username;

//    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^254\\d{9}$|^\\+254\\d{9}$|^0\\d{9}$", message = "Phone must be a valid Kenyan number (254XXXXXXXXX or +254XXXXXXXXX or 0XXXXXXXXX)")
    private String phone;

    @Pattern(regexp = "PERSONAL|BUSINESS", message = "Account type must be PERSONAL or BUSINESS")
    private String accountType;

    @Size(max = 100, message = "Business name must not exceed 100 characters")
    private String businessName;
}
