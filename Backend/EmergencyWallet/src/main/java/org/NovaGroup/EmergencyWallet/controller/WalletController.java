package org.NovaGroup.EmergencyWallet.controller;

import lombok.extern.slf4j.Slf4j;
import org.NovaGroup.EmergencyWallet.dto.ApiResponse;
import org.NovaGroup.EmergencyWallet.dto.WalletDTO;
import org.NovaGroup.EmergencyWallet.service.AuthService;
import org.NovaGroup.EmergencyWallet.service.WalletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/wallets")
@Slf4j
public class WalletController {

    @Autowired
    private WalletService walletService;

    @Autowired
    private AuthService authService;

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<WalletDTO>> getActiveWallet(Authentication authentication) {
        log.info("Fetching active wallet for user: {}", authentication.getName());
        String userId = authService.getUserByEmail(authentication.getName()).getId();
        WalletDTO wallet = walletService.getUserActiveWallet(userId);
        return new ResponseEntity<>(ApiResponse.success("Active wallet retrieved", wallet), HttpStatus.OK);
    }

    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<WalletDTO>>> getUserWallets(Authentication authentication) {
        log.info("Fetching all wallets for user: {}", authentication.getName());
        String userId = authService.getUserByEmail(authentication.getName()).getId();
        List<WalletDTO> wallets = walletService.getUserWallets(userId);
        return new ResponseEntity<>(ApiResponse.success("Wallets retrieved", wallets), HttpStatus.OK);
    }

    @GetMapping("/{walletId}")
    public ResponseEntity<ApiResponse<WalletDTO>> getWalletById(
            @PathVariable String walletId,
            Authentication authentication) {
        log.info("Fetching wallet: {}", walletId);
        WalletDTO wallet = walletService.getWalletById(walletId);
        return new ResponseEntity<>(ApiResponse.success("Wallet retrieved", wallet), HttpStatus.OK);
    }

    @PostMapping("/demo-fund")
    public ResponseEntity<ApiResponse<WalletDTO>> fundDemoWallet(
            @RequestParam BigDecimal amount,
            Authentication authentication) {
        log.info("Funding demo wallet with amount: {}", amount);
        String userId = authService.getUserByEmail(authentication.getName()).getId();
        walletService.fundDemoWallet(userId, amount);
        WalletDTO wallet = walletService.getUserActiveWallet(userId);
        return new ResponseEntity<>(ApiResponse.success("Demo wallet funded", wallet), HttpStatus.OK);
    }
}
