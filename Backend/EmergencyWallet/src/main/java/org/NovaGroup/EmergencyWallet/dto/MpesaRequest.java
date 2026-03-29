package org.NovaGroup.EmergencyWallet.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MpesaRequest {
    private String type; // mpesa_paybill, mpesa_send_money, mpesa_buy_goods
    private BigDecimal amount;
    private String phoneNumber;
    private String paybillNumber;
    private String accountNumber;
    private String tillNumber;
}
