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
public class TransactionDTO {
    private String id;
    private String type;
    private BigDecimal amount;
    private BigDecimal fee;
    private String status;
    private String description;
    private String reference;
    private String phoneNumber;
    private String paybillNumber;
    private String accountNumber;
    private String tillNumber;
    private String mpesaReceipt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
