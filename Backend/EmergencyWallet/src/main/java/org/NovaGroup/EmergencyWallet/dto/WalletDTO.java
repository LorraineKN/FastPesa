package org.NovaGroup.EmergencyWallet.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WalletDTO {
    private String id;
    private String userId;
    private String walletName;
    private BigDecimal balance;
    private String currency;
    private Boolean isActive;
    private Boolean isDemoFunded;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
