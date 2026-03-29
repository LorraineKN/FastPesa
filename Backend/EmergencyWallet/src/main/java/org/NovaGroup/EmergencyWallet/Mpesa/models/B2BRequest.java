package org.NovaGroup.EmergencyWallet.Mpesa.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class B2BRequest {

        public String Initiator;
        public String SecurityCredential ;
        public String CommandID ;
        public String SenderIdentifierType ;
        public String ReceiverIdentifierType ;
        public String Amount;
        public String PartyA ;
        public String PartyB;
        public String AccountReference ";
        public String Remarks = "B2B Payment";
        public String QueueTimeOutURL = ;
        public String ResultURL = ";


        public B2BRequest(String receiverShortcode, long amount) {
                this.PartyB = receiverShortcode;
                this.Amount = String.valueOf(amount);
        }

}