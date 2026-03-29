package org.NovaGroup.EmergencyWallet.controller;

import lombok.extern.slf4j.Slf4j;
import org.NovaGroup.EmergencyWallet.dto.*;
import org.NovaGroup.EmergencyWallet.service.AuthService;
import org.NovaGroup.EmergencyWallet.service.MpesaService;
import org.NovaGroup.EmergencyWallet.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
@Slf4j
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private AuthService authService;

    @Autowired
    private MpesaService mpesaService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TransactionDTO>>> getTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        log.info("Fetching transactions for user: {}", authentication.getName());
        String userId = authService.getUserByEmail(authentication.getName()).getId();
        Pageable pageable = PageRequest.of(page, size);
        Page<TransactionDTO> transactions = transactionService.getUserTransactions(userId, pageable);
        return new ResponseEntity<>(ApiResponse.success("Transactions retrieved", transactions), HttpStatus.OK);
    }

    @PostMapping("/deposit")
    public ResponseEntity<ApiResponse<TransactionDTO>> deposit(
            @RequestBody DepositRequest request,
            Authentication authentication) {
        log.info("Processing deposit request for user: {}", authentication.getName());
        String userId = authService.getUserByEmail(authentication.getName()).getId();
        TransactionDTO transaction = transactionService.processDeposit(userId, request);
        return new ResponseEntity<>(ApiResponse.success("Deposit processed", transaction), HttpStatus.CREATED);
    }

    @PostMapping("/withdraw")
    public ResponseEntity<ApiResponse<TransactionDTO>> withdraw(
            @RequestBody DepositRequest request,
            Authentication authentication) {
        log.info("Processing withdrawal request for user: {}", authentication.getName());
        String userId = authService.getUserByEmail(authentication.getName()).getId();
        TransactionDTO transaction = transactionService.processWithdrawal(userId, request);
        return new ResponseEntity<>(ApiResponse.success("Withdrawal processed", transaction), HttpStatus.CREATED);
    }

    @PostMapping("/transfer")
    public ResponseEntity<ApiResponse<TransactionDTO>> transfer(
            @RequestBody TransferRequest request,
            Authentication authentication) {
        log.info("Processing transfer request for user: {}", authentication.getName());
        String userId = authService.getUserByEmail(authentication.getName()).getId();
        TransactionDTO transaction = transactionService.transferBetweenWallets(userId, request);
        return new ResponseEntity<>(ApiResponse.success("Transfer processed", transaction), HttpStatus.CREATED);
    }

    @PostMapping("/mpesa")
    public ResponseEntity<ApiResponse<TransactionDTO>> processMpesa(
            @RequestBody MpesaRequest request,
            Authentication authentication) {
        log.info("Processing M-Pesa transaction for user: {}", authentication.getName());
        String userId = authService.getUserByEmail(authentication.getName()).getId();
        TransactionDTO transaction = transactionService.processMpesaTransaction(userId, request);
        return new ResponseEntity<>(ApiResponse.success("M-Pesa transaction processed", transaction), HttpStatus.CREATED);
    }

    @PostMapping("/mpesa/stk-push")
    public ResponseEntity<ApiResponse<Map<String, Object>>> initiateStkPush(
            @RequestParam String phoneNumber,
            @RequestParam long amount,
            Authentication authentication) throws IOException {
        log.info("Initiating STK Push for user: {} phone: {}", authentication.getName(), phoneNumber);
        String userId = authService.getUserByEmail(authentication.getName()).getId();
        Map<String, Object> response = mpesaService.initiateStkPush(phoneNumber, amount, userId);
        return new ResponseEntity<>(ApiResponse.success("STK Push initiated", response), HttpStatus.CREATED);
    }

    @PostMapping("/mpesa/c2b")
    public ResponseEntity<ApiResponse<Map<String, Object>>> processC2B(
            @RequestParam String paybillNumber,
            @RequestParam String accountNumber,
            @RequestParam String phoneNumber,
            @RequestParam long amount,
            Authentication authentication) throws IOException {
        log.info("Processing C2B payment for user: {} paybill: {}", authentication.getName(), paybillNumber);
        Map<String, Object> response = mpesaService.processC2B(paybillNumber, accountNumber, phoneNumber, amount);
        return new ResponseEntity<>(ApiResponse.success("C2B payment initiated", response), HttpStatus.CREATED);
    }

    @PostMapping("/mpesa/b2b")
    public ResponseEntity<ApiResponse<Map<String, Object>>> processB2B(
            @RequestParam String receiverShortcode,
            @RequestParam long amount,
            @RequestParam String accountReference,
            Authentication authentication) throws IOException {
        log.info("Processing B2B payment for user: {} receiver: {}", authentication.getName(), receiverShortcode);
        Map<String, Object> response = mpesaService.processB2B(receiverShortcode, amount, accountReference);
        return new ResponseEntity<>(ApiResponse.success("B2B payment initiated", response), HttpStatus.CREATED);
    }

    @PostMapping("/mpesa/b2c")
    public ResponseEntity<ApiResponse<Map<String, Object>>> processB2C(
            @RequestParam String phoneNumber,
            @RequestParam long amount,
            @RequestParam(required = false, defaultValue = "SalaryPayment") String commandId,
            @RequestParam(required = false) String remarks,
            Authentication authentication) throws IOException {
        log.info("Processing B2C payment for user: {} phone: {}", authentication.getName(), phoneNumber);
        Map<String, Object> response = mpesaService.processB2C(phoneNumber, amount, commandId, remarks);
        return new ResponseEntity<>(ApiResponse.success("B2C payment initiated", response), HttpStatus.CREATED);
    }

    @PostMapping("/mpesa/c2b-simulate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> simulateC2B(
            @RequestParam String paybillNumber,
            @RequestParam String accountNumber,
            @RequestParam long amount,
            Authentication authentication) {
        log.info("Simulating C2B for user: {}", authentication.getName());
        Map<String, Object> response = mpesaService.simulateC2B(paybillNumber, accountNumber, amount);
        return new ResponseEntity<>(ApiResponse.success("C2B simulated", response), HttpStatus.OK);
    }

    @PostMapping("/mpesa/b2b-simulate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> simulateB2B(
            @RequestParam String receiverShortcode,
            @RequestParam long amount,
            Authentication authentication) {
        log.info("Simulating B2B for user: {}", authentication.getName());
        Map<String, Object> response = mpesaService.simulateB2B(receiverShortcode, amount);
        return new ResponseEntity<>(ApiResponse.success("B2B simulated", response), HttpStatus.OK);
    }

    @PostMapping("/mpesa/b2c-simulate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> simulateB2C(
            @RequestParam String phoneNumber,
            @RequestParam long amount,
            Authentication authentication) {
        log.info("Simulating B2C for user: {}", authentication.getName());
        Map<String, Object> response = mpesaService.simulateB2C(phoneNumber, amount);
        return new ResponseEntity<>(ApiResponse.success("B2C simulated", response), HttpStatus.OK);
    }
}
