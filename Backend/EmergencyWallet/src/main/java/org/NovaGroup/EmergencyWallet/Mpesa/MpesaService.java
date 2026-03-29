package org.NovaGroup.EmergencyWallet.Mpesa;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.NovaGroup.EmergencyWallet.Mpesa.models.MpesaTokenResponse;
import org.NovaGroup.EmergencyWallet.Mpesa.models.StkPushResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Slf4j
public class MpesaService {

    @Value("${mpesa.consumer-key}")
    private String consumerKey;

    @Value("${mpesa.consumer-secret}")
    private String consumerSecret;

    @Value("${mpesa.shortcode}")
    private String shortcode;

    @Value("${mpesa.passkey}")
    private String passkey;

    @Value("${mpesa.callback-url}")
    private String callbackUrl;

    @Value("${mpesa.stk-callback-url}")
    private String stkCallbackUrl;

    @Value("${mpesa.env:sandbox}")
    private String environment;

    @Value("${demo.mode:true}")
    private boolean demoMode;

    private static final String SANDBOX_AUTH_URL = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
    private static final String PROD_AUTH_URL = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
    private static final String SANDBOX_STK_URL = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
    private static final String PROD_STK_URL = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
    private static final String SANDBOX_C2B_URL = "https://sandbox.safaricom.co.ke/mpesa/c2b/v1/simulate";
    private static final String PROD_C2B_URL = "https://api.safaricom.co.ke/mpesa/c2b/v1/simulate";
    private static final String SANDBOX_B2C_URL = "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest";
    private static final String PROD_B2C_URL = "https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest";
    private static final String SANDBOX_B2B_URL = "https://sandbox.safaricom.co.ke/mpesa/b2b/v1/paymentrequest";
    private static final String PROD_B2B_URL = "https://api.safaricom.co.ke/mpesa/b2b/v1/paymentrequest";

    private String accessToken;
    private LocalDateTime tokenExpiry;
    private final OkHttpClient client = new OkHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String getAccessToken() throws IOException {
        if (accessToken != null && tokenExpiry != null && LocalDateTime.now().isBefore(tokenExpiry)) {
            log.debug("Returning cached access token");
            return accessToken;
        }

        String authUrl = "sandbox".equalsIgnoreCase(environment) ? SANDBOX_AUTH_URL : PROD_AUTH_URL;
        String credentials = Base64.getEncoder().encodeToString((consumerKey + ":" + consumerSecret).getBytes(StandardCharsets.UTF_8));

        log.debug("Encoded credentials: {}", credentials);

        Request request = new Request.Builder()
                .url(authUrl)
                .header("Authorization", "Basic " + credentials)
                .header("User-Agent", "Java/OkHttp")
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Failed to authenticate with Daraja API. HTTP: " + response.code());
            }

            String responseBodyStr = response.body() != null ? response.body().string() : "";
            log.debug("Token Response: {}", responseBodyStr);

            MpesaTokenResponse tokenResponse = objectMapper.readValue(responseBodyStr, MpesaTokenResponse.class);
            accessToken = tokenResponse.getAccess_token();
            tokenExpiry = LocalDateTime.now().plusMinutes(55);

            log.info("M-Pesa access token obtained successfully");
            log.debug("Access Token: {}", accessToken);
            return accessToken;
        }
    }

    public StkPushResponse initiateStkPush(String phoneNumber, long amount, String accountReference) throws IOException {
        if (demoMode) {
            Map<String, Object> simulated = simulateStkPush(phoneNumber, amount, accountReference);
            // map simulated response to DTO if needed
            return objectMapper.convertValue(simulated, StkPushResponse.class);
        }

        String token = getAccessToken();
        String timestamp = generateTimestamp();
        String password = generatePassword(timestamp);
        String url = "sandbox".equalsIgnoreCase(environment) ? SANDBOX_STK_URL : PROD_STK_URL;

        Map<String, Object> payload = new HashMap<>();
        payload.put("BusinessShortCode", shortcode);
        payload.put("Password", password);
        payload.put("Timestamp", timestamp);
        payload.put("TransactionType", "CustomerPayBillOnline");
        payload.put("Amount", amount);
        payload.put("PartyA", phoneNumber);
        payload.put("PartyB", shortcode);
        payload.put("PhoneNumber", phoneNumber);
        payload.put("CallBackURL", stkCallbackUrl);
        payload.put("AccountReference", accountReference);
        payload.put("TransactionDesc", "Emergency Wallet Deposit");

        RequestBody body = RequestBody.create(
                objectMapper.writeValueAsString(payload),
                MediaType.parse("application/json")
        );

        Request request = new Request.Builder()
                .url(url)
                .header("Authorization", "Bearer " + token)
                .header("User-Agent", "Java/OkHttp")
                .post(body)
                .build();

        try (Response response = client.newCall(request).execute()) {
            String responseBodyStr = response.body() != null ? response.body().string() : "";
            log.debug("STK Push response body: {}", responseBodyStr);

            StkPushResponse stkResponse = objectMapper.readValue(responseBodyStr, StkPushResponse.class);
            log.info("STK Push initiated. Response code: {}", stkResponse.getResponseCode());
            return stkResponse;
        }
    }
    public Map<String, Object> simulateStkPush(String phoneNumber, long amount, String accountReference) {
        log.info("[DEMO MODE] Simulating STK Push. Phone: {}, Amount: {}", phoneNumber, amount);

        Map<String, Object> response = new HashMap<>();
        response.put("MerchantRequestID", "ws_CO_" + System.currentTimeMillis());
        response.put("CheckoutRequestID", "ws_CO_" + System.currentTimeMillis());
        response.put("ResponseCode", "0");
        response.put("ResponseDescription", "Success. Request accepted for processing.");
        response.put("CustomerMessage", "Success. Request accepted for processing.");

        return response;
    }

    public Map<String, Object> processC2B(String paybillNumber, String accountNumber, String phoneNumber, long amount) throws IOException {
        if (demoMode) {
            return simulateC2B(paybillNumber, accountNumber, amount);
        }

        String token = getAccessToken();
        String url = "sandbox".equalsIgnoreCase(environment) ? SANDBOX_C2B_URL : PROD_C2B_URL;

        Map<String, Object> payload = new HashMap<>();
        payload.put("ShortCode", paybillNumber);
        payload.put("CommandID", "CustomerPayBillOnline");
        payload.put("Amount", amount);
        payload.put("Msisdn", phoneNumber);
        payload.put("BillRefNumber", accountNumber);

        RequestBody body = RequestBody.create(
            objectMapper.writeValueAsString(payload),
            MediaType.parse("application/json")
        );

        Request request = new Request.Builder()
            .url(url)
            .header("Authorization", "Bearer " + token)
            .post(body)
            .build();

        try (Response response = client.newCall(request).execute()) {
            Map<String, Object> responseBody = objectMapper.readValue(response.body().string(), Map.class);
            log.info("C2B Paybill payment initiated. Response: {}", responseBody.get("ResponseCode"));
            return responseBody;
        }
    }

    public Map<String, Object> simulateC2B(String paybillNumber, String accountNumber, long amount) {
        log.info("[DEMO MODE] Simulating C2B. Paybill: {}, Account: {}, Amount: {}", 
            paybillNumber, accountNumber, amount);
        
        Map<String, Object> response = new HashMap<>();
        response.put("ConversationID", "c2b_" + System.currentTimeMillis());
        response.put("OriginatorConversationID", "oc2b_" + System.currentTimeMillis());
        response.put("ResponseCode", "0");
        response.put("ResponseDescription", "Accept the service request successfully.");
        
        return response;
    }

    public Map<String, Object> processB2B(String receiverShortcode, long amount, String accountReference) throws IOException {
        if (demoMode) {
            return simulateB2B(receiverShortcode, amount);
        }

        String token = getAccessToken();
        String timestamp = generateTimestamp();
        String url = "sandbox".equalsIgnoreCase(environment) ? SANDBOX_B2B_URL : PROD_B2B_URL;

        Map<String, Object> payload = new HashMap<>();
        payload.put("Initiator", shortcode);
        payload.put("SecurityCredential", generateSecurityCredential(shortcode));
        payload.put("CommandID", "BusinessPayBill");
        payload.put("SenderIdentifierType", "4"); // Business till/Account
        payload.put("RecieverIdentifierType", "4");
        payload.put("Amount", amount);
        payload.put("PartyA", shortcode);
        payload.put("PartyB", receiverShortcode);
        payload.put("Remarks", "B2B Payment");
        payload.put("QueueTimeOutURL", callbackUrl);
        payload.put("ResultURL", callbackUrl);
        payload.put("AccountReference", accountReference);

        RequestBody body = RequestBody.create(
            objectMapper.writeValueAsString(payload),
            MediaType.parse("application/json")
        );

        Request request = new Request.Builder()
            .url(url)
            .header("Authorization", "Bearer " + token)
            .post(body)
            .build();

        try (Response response = client.newCall(request).execute()) {
            Map<String, Object> responseBody = objectMapper.readValue(response.body().string(), Map.class);
            log.info("B2B payment initiated. Response: {}", responseBody.get("ResponseCode"));
            return responseBody;
        }
    }

    public Map<String, Object> processB2C(String phoneNumber, long amount, String commandId, String remarks) throws IOException {
        if (demoMode) {
            return simulateB2C(phoneNumber, amount);
        }

        String token = getAccessToken();
        String url = "sandbox".equalsIgnoreCase(environment) ? SANDBOX_B2C_URL : PROD_B2C_URL;

        Map<String, Object> payload = new HashMap<>();
        payload.put("Initiator", shortcode);
        payload.put("SecurityCredential", generateSecurityCredential(shortcode));
        payload.put("CommandID", commandId); // SalaryPayment, BusinessPayment, PromotionPayment
        payload.put("Amount", amount);
        payload.put("PartyA", shortcode);
        payload.put("PartyB", phoneNumber);
        payload.put("Remarks", remarks != null ? remarks : "B2C Payment");
        payload.put("QueueTimeOutURL", callbackUrl);
        payload.put("ResultURL", callbackUrl);

        RequestBody body = RequestBody.create(
            objectMapper.writeValueAsString(payload),
            MediaType.parse("application/json")
        );

        Request request = new Request.Builder()
            .url(url)
            .header("Authorization", "Bearer " + token)
            .post(body)
            .build();

        try (Response response = client.newCall(request).execute()) {
            Map<String, Object> responseBody = objectMapper.readValue(response.body().string(), Map.class);
            log.info("B2C payment initiated. Response: {}", responseBody.get("ResponseCode"));
            return responseBody;
        }
    }

    public Map<String, Object> simulateB2B(String receiverShortcode, long amount) {
        log.info("[DEMO MODE] Simulating B2B. Receiver: {}, Amount: {}", receiverShortcode, amount);

        Map<String, Object> response = new HashMap<>();
        response.put("ConversationID", "b2b_" + System.currentTimeMillis());
        response.put("OriginatorConversationID", "ob2b_" + System.currentTimeMillis());
        response.put("ResponseCode", "0");
        response.put("ResponseDescription", "Accept the service request successfully.");

        return response;
    }

    public Map<String, Object> simulateB2C(String phoneNumber, long amount) {
        log.info("[DEMO MODE] Simulating B2C. Phone: {}, Amount: {}", phoneNumber, amount);

        Map<String, Object> response = new HashMap<>();
        response.put("ConversationID", "b2c_" + System.currentTimeMillis());
        response.put("OriginatorConversationID", "ob2c_" + System.currentTimeMillis());
        response.put("ResponseCode", "0");
        response.put("ResponseDescription", "Accept the service request successfully.");

        return response;
    }

    private String generateTimestamp() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }

    private String generatePassword(String timestamp) {
        String rawPassword = shortcode + passkey + timestamp;
        return Base64.getEncoder().encodeToString(rawPassword.getBytes(StandardCharsets.UTF_8));
    }

    private String generateSecurityCredential(String shortcode) {
        // In production, this should use actual encryption
        // For now, return base64 encoded shortcode as placeholder
        return Base64.getEncoder().encodeToString(shortcode.getBytes(StandardCharsets.UTF_8));
    }
}
