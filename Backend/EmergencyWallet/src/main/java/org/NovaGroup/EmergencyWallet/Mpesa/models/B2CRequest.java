package org.NovaGroup.EmergencyWallet.Mpesa.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor

public class B2CRequest {
        public String Initiator = "<INITIATOR_NAME>";
        public String SecurityCredential = "<SECURITY_CREDENTIAL>";
        public String CommandID = "BusinessPayment";
        public String Amount;
        public String PartyA = "<YOUR_SHORTCODE>";
        public String PartyB;
        public String Remarks = "B2C Payment";
        public String QueueTimeOutURL = "<QUEUE_TIMEOUT_URL>";
        public String ResultURL = "<RESULT_URL>";
        public String Occasion = "";

        public B2CRequest(String phoneNumber, long amount) {
            this.PartyB = phoneNumber;
            this.Amount = String.valueOf(amount);
        }
    }