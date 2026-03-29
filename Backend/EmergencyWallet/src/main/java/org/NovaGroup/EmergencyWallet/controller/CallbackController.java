package org.NovaGroup.EmergencyWallet.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/callbacks")
@Slf4j
public class CallbackController {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/mpesa/stk")
    public ResponseEntity<Map<String, Object>> handleStkCallback(@RequestBody Map<String, Object> payload) {
        log.info("STK Callback received: {}", payload);
        
        // Extract callback data
        Map<String, Object> body = (Map<String, Object>) payload.get("Body");
        Map<String, Object> stkCallback = (Map<String, Object>) body.get("stkCallback");
        
        int resultCode = ((Number) stkCallback.get("ResultCode")).intValue();
        String resultDesc = (String) stkCallback.get("ResultDesc");
        
        if (resultCode == 0) {
            log.info("STK Push successful: {}", resultDesc);
            // Handle successful payment
        } else {
            log.warn("STK Push failed: {}", resultDesc);
            // Handle failed payment
        }

        return new ResponseEntity<>(new HashMap<>(), HttpStatus.OK);
    }

    @PostMapping("/mpesa/c2b")
    public ResponseEntity<Map<String, Object>> handleC2BCallback(@RequestBody Map<String, Object> payload) {
        log.info("C2B Callback received: {}", payload);
        
        // Process callback data
        String transactionRef = (String) payload.get("TransID");
        String msisdn = (String) payload.get("MSISDN");
        String amount = (String) payload.get("TransAmount");
        
        log.info("C2B Transaction - Ref: {}, Phone: {}, Amount: {}", transactionRef, msisdn, amount);
        
        return new ResponseEntity<>(new HashMap<>(), HttpStatus.OK);
    }

    @PostMapping("/mpesa/b2c")
    public ResponseEntity<Map<String, Object>> handleB2CCallback(@RequestBody Map<String, Object> payload) {
        log.info("B2C Callback received: {}", payload);
        
        // Process callback data
        log.debug("B2C Payload: {}", payload);
        
        return new ResponseEntity<>(new HashMap<>(), HttpStatus.OK);
    }

    @PostMapping("/mpesa/b2b")
    public ResponseEntity<Map<String, Object>> handleB2BCallback(@RequestBody Map<String, Object> payload) {
        log.info("B2B Callback received: {}", payload);
        
        // Process callback data
        log.debug("B2B Payload: {}", payload);
        
        return new ResponseEntity<>(new HashMap<>(), HttpStatus.OK);
    }
}
