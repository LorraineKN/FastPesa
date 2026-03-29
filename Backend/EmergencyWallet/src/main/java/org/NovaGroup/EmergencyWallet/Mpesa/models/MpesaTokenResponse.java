package org.NovaGroup.EmergencyWallet.Mpesa.models;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MpesaTokenResponse {
    private String access_token;
    private String expires_in;

}