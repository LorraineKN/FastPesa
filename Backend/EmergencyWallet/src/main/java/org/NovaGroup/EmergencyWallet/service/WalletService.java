package org.NovaGroup.EmergencyWallet.service;

import lombok.extern.slf4j.Slf4j;
import org.NovaGroup.EmergencyWallet.dto.WalletDTO;
import org.NovaGroup.EmergencyWallet.entity.User;
import org.NovaGroup.EmergencyWallet.entity.Wallet;
import org.NovaGroup.EmergencyWallet.exception.ApiException;
import org.NovaGroup.EmergencyWallet.repository.UserRepository;
import org.NovaGroup.EmergencyWallet.repository.WalletRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class WalletService {

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private UserRepository userRepository;

    public WalletDTO getWalletById(String walletId) {
        log.debug("Fetching wallet: {}", walletId);
        Wallet wallet = walletRepository.findById(walletId)
            .orElseThrow(() -> new ApiException("Wallet not found", "WALLET_NOT_FOUND"));
        return mapToDTO(wallet);
    }

    public WalletDTO getUserActiveWallet(String userId) {
        log.debug("Fetching active wallet for user: {}", userId);
        Wallet wallet = walletRepository.findByUserIdAndIsActiveTrue(userId)
            .orElseThrow(() -> new ApiException("No active wallet found", "WALLET_NOT_FOUND"));
        return mapToDTO(wallet);
    }

    public List<WalletDTO> getUserWallets(String userId) {
        log.debug("Fetching all wallets for user: {}", userId);
        return walletRepository.findByUserId(userId)
            .stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    @Transactional
    public void fundDemoWallet(String userId, BigDecimal amount) {
        log.info("Funding demo wallet for user: {} with amount: {}", userId, amount);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException("User not found", "USER_NOT_FOUND"));

        Wallet wallet = walletRepository.findByUserIdAndIsActiveTrue(userId)
            .orElseThrow(() -> new ApiException("Wallet not found", "WALLET_NOT_FOUND"));

        wallet.setBalance(wallet.getBalance().add(amount));
        wallet.setIsDemoFunded(true);
        walletRepository.save(wallet);

        log.info("Demo wallet funded successfully. New balance: {}", wallet.getBalance());
    }

    public Wallet getWalletEntity(String walletId) {
        return walletRepository.findById(walletId)
            .orElseThrow(() -> new ApiException("Wallet not found", "WALLET_NOT_FOUND"));
    }

    public Wallet getWalletEntity(String walletId, String userId) {
        return walletRepository.findByIdAndUserId(walletId, userId)
            .orElseThrow(() -> new ApiException("Wallet not found", "WALLET_NOT_FOUND"));
    }

    private WalletDTO mapToDTO(Wallet wallet) {
        return WalletDTO.builder()
            .id(wallet.getId())
            .userId(wallet.getUser().getId())
            .walletName(wallet.getWalletName())
            .balance(wallet.getBalance())
            .currency(wallet.getCurrency())
            .isActive(wallet.getIsActive())
            .isDemoFunded(wallet.getIsDemoFunded())
            .createdAt(wallet.getCreatedAt())
            .updatedAt(wallet.getUpdatedAt())
            .build();
    }
}
