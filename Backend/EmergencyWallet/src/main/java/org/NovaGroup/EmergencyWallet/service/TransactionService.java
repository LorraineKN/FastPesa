package org.NovaGroup.EmergencyWallet.service;

import lombok.extern.slf4j.Slf4j;
import org.NovaGroup.EmergencyWallet.dto.DepositRequest;
import org.NovaGroup.EmergencyWallet.dto.MpesaRequest;
import org.NovaGroup.EmergencyWallet.dto.TransactionDTO;
import org.NovaGroup.EmergencyWallet.dto.TransferRequest;
import org.NovaGroup.EmergencyWallet.entity.Notification;
import org.NovaGroup.EmergencyWallet.entity.Transaction;
import org.NovaGroup.EmergencyWallet.entity.User;
import org.NovaGroup.EmergencyWallet.entity.Wallet;
import org.NovaGroup.EmergencyWallet.exception.ApiException;
import org.NovaGroup.EmergencyWallet.repository.NotificationRepository;
import org.NovaGroup.EmergencyWallet.repository.TransactionRepository;
import org.NovaGroup.EmergencyWallet.repository.UserRepository;
import org.NovaGroup.EmergencyWallet.repository.WalletRepository;
import org.NovaGroup.EmergencyWallet.util.ReferenceGenerator;
import org.NovaGroup.EmergencyWallet.util.TimestampFormatter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;

@Service
@Slf4j
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    public Page<TransactionDTO> getUserTransactions(String userId, Pageable pageable) {
        log.debug("Fetching transactions for user: {}", userId);
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
            .map(this::mapToDTO);
    }

    @Transactional
    public TransactionDTO processDeposit(String userId, DepositRequest request) {
        log.info("Processing deposit for user: {} amount: {}", userId, request.getAmount());

        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException("Amount must be greater than zero", "INVALID_AMOUNT");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException("User not found", "USER_NOT_FOUND"));

        Wallet wallet = walletRepository.findByUserIdAndIsActiveTrue(userId)
            .orElseThrow(() -> new ApiException("Wallet not found", "WALLET_NOT_FOUND"));

        String reference = ReferenceGenerator.generateTxReference();
        BigDecimal newBalance = wallet.getBalance().add(request.getAmount());

        wallet.setBalance(newBalance);
        walletRepository.save(wallet);

        Transaction transaction = Transaction.builder()
            .user(user)
            .receiverWallet(wallet)
            .type(Transaction.TransactionType.DEPOSIT)
            .amount(request.getAmount())
            .status(Transaction.TransactionStatus.COMPLETED)
            .description(request.getDescription() != null ? request.getDescription() : "Wallet deposit")
            .reference(reference)
            .build();

        transaction = transactionRepository.save(transaction);

        createNotification(user, "Deposit Confirmed",
            reference + " Confirmed. You have deposited " + TimestampFormatter.formatKES(request.getAmount()) +
            " to your InstantAid wallet. New InstantAid balance is " + TimestampFormatter.formatKES(newBalance) + ".",
            reference);

        log.info("Deposit processed successfully. Reference: {}", reference);
        return mapToDTO(transaction);
    }

    @Transactional
    public TransactionDTO processWithdrawal(String userId, DepositRequest request) {
        log.info("Processing withdrawal for user: {} amount: {}", userId, request.getAmount());

        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException("Amount must be greater than zero", "INVALID_AMOUNT");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException("User not found", "USER_NOT_FOUND"));

        Wallet wallet = walletRepository.findByUserIdAndIsActiveTrue(userId)
            .orElseThrow(() -> new ApiException("Wallet not found", "WALLET_NOT_FOUND"));

        if (request.getAmount().compareTo(wallet.getBalance()) > 0) {
            throw new ApiException("Insufficient balance", "INSUFFICIENT_BALANCE");
        }

        String reference = ReferenceGenerator.generateTxReference();
        BigDecimal newBalance = wallet.getBalance().subtract(request.getAmount());

        wallet.setBalance(newBalance);
        walletRepository.save(wallet);

        Transaction transaction = Transaction.builder()
            .user(user)
            .senderWallet(wallet)
            .type(Transaction.TransactionType.WITHDRAWAL)
            .amount(request.getAmount())
            .status(Transaction.TransactionStatus.COMPLETED)
            .description(request.getDescription() != null ? request.getDescription() : "Wallet withdrawal")
            .reference(reference)
            .build();

        transaction = transactionRepository.save(transaction);

        createNotification(user, "Withdrawal Confirmed",
            reference + " Confirmed. " + TimestampFormatter.formatKES(request.getAmount()) +
            " withdrawn from your InstantAid wallet. New InstantAid balance is " + 
            TimestampFormatter.formatKES(newBalance) + ".",
            reference);

        log.info("Withdrawal processed successfully. Reference: {}", reference);
        return mapToDTO(transaction);
    }

    @Transactional
    public TransactionDTO transferBetweenWallets(String senderId, TransferRequest request) {
        log.info("Processing wallet transfer. Sender: {} amount: {}", senderId, request.getAmount());

        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException("Amount must be greater than zero", "INVALID_AMOUNT");
        }

        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new ApiException("User not found", "USER_NOT_FOUND"));

        Wallet senderWallet = walletRepository.findByUserIdAndIsActiveTrue(senderId)
            .orElseThrow(() -> new ApiException("Sender wallet not found", "WALLET_NOT_FOUND"));

        Wallet receiverWallet = walletRepository.findById(request.getReceiverWalletId())
            .orElseThrow(() -> new ApiException("Receiver wallet not found", "WALLET_NOT_FOUND"));

        if (senderWallet.getId().equals(receiverWallet.getId())) {
            throw new ApiException("Cannot transfer to the same wallet", "INVALID_TRANSFER");
        }

        if (request.getAmount().compareTo(senderWallet.getBalance()) > 0) {
            throw new ApiException("Insufficient balance", "INSUFFICIENT_BALANCE");
        }

        String reference = ReferenceGenerator.generateTxReference();
        BigDecimal senderNewBalance = senderWallet.getBalance().subtract(request.getAmount());
        BigDecimal receiverNewBalance = receiverWallet.getBalance().add(request.getAmount());

        senderWallet.setBalance(senderNewBalance);
        receiverWallet.setBalance(receiverNewBalance);
        walletRepository.saveAll(java.util.Arrays.asList(senderWallet, receiverWallet));

        Transaction transaction = Transaction.builder()
            .user(sender)
            .senderWallet(senderWallet)
            .receiverWallet(receiverWallet)
            .type(Transaction.TransactionType.WALLET_TRANSFER)
            .amount(request.getAmount())
            .status(Transaction.TransactionStatus.COMPLETED)
            .description("Transfer to " + receiverWallet.getUser().getFullName())
            .reference(reference)
            .build();

        transaction = transactionRepository.save(transaction);

        // Sender notification
        createNotification(sender, "Transfer Sent",
            reference + " Confirmed. " + TimestampFormatter.formatKES(request.getAmount()) +
            " sent to " + receiverWallet.getUser().getFullName().toUpperCase() +
            ". New InstantAid balance is " + TimestampFormatter.formatKES(senderNewBalance) + ".",
            reference);

        // Receiver notification
        createNotification(receiverWallet.getUser(), "Transfer Received",
            reference + " Confirmed. You have received " + TimestampFormatter.formatKES(request.getAmount()) +
            " from " + sender.getFullName().toUpperCase() +
            ". New InstantAid balance is " + TimestampFormatter.formatKES(receiverNewBalance) + ".",
            reference);

        log.info("Wallet transfer processed successfully. Reference: {}", reference);
        return mapToDTO(transaction);
    }

    @Transactional
    public TransactionDTO processMpesaTransaction(String userId, MpesaRequest request) {
        log.info("Processing M-Pesa transaction. Type: {} amount: {}", request.getType(), request.getAmount());

        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException("Amount must be greater than zero", "INVALID_AMOUNT");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException("User not found", "USER_NOT_FOUND"));

        Wallet wallet = walletRepository.findByUserIdAndIsActiveTrue(userId)
            .orElseThrow(() -> new ApiException("Wallet not found", "WALLET_NOT_FOUND"));

        if (request.getAmount().compareTo(wallet.getBalance()) > 0) {
            throw new ApiException("Insufficient balance", "INSUFFICIENT_BALANCE");
        }

        String reference = ReferenceGenerator.generateTxReference();
        BigDecimal newBalance = wallet.getBalance().subtract(request.getAmount());

        wallet.setBalance(newBalance);
        walletRepository.save(wallet);

        Transaction.TransactionType txType = Transaction.TransactionType.valueOf(request.getType().toUpperCase());

        Transaction transaction = Transaction.builder()
            .user(user)
            .senderWallet(wallet)
            .type(txType)
            .amount(request.getAmount())
            .status(Transaction.TransactionStatus.COMPLETED)
            .reference(reference)
            .phoneNumber(request.getPhoneNumber())
            .paybillNumber(request.getPaybillNumber())
            .accountNumber(request.getAccountNumber())
            .tillNumber(request.getTillNumber())
            .mpesaReceipt(reference)
            .build();

        transaction = transactionRepository.save(transaction);

        String description = buildMpesaDescription(request);
        createNotification(user, "M-Pesa Transaction Confirmed",
            reference + " Confirmed. " + TimestampFormatter.formatKES(request.getAmount()) +
            " " + description + ". New InstantAid balance is " + 
            TimestampFormatter.formatKES(newBalance) + ".",
            reference);

        log.info("M-Pesa transaction processed successfully. Reference: {}", reference);
        return mapToDTO(transaction);
    }

    private String buildMpesaDescription(MpesaRequest request) {
        return switch (request.getType()) {
            case "MPESA_PAYBILL" -> "paid to Paybill " + request.getPaybillNumber() + " A/C " + request.getAccountNumber();
            case "MPESA_SEND_MONEY" -> "sent via M-Pesa to " + request.getPhoneNumber();
            case "MPESA_BUY_GOODS" -> "spent at Till " + request.getTillNumber();
            default -> "transferred";
        };
    }

    private void createNotification(User user, String title, String message, String reference) {
        Notification notification = Notification.builder()
            .user(user)
            .title(title)
            .message(message)
            .type("TRANSACTION")
            .reference(reference)
            .isRead(false)
            .build();
        notificationRepository.save(notification);
    }

    private TransactionDTO mapToDTO(Transaction transaction) {
        return TransactionDTO.builder()
            .id(transaction.getId())
            .type(transaction.getType().name())
            .amount(transaction.getAmount())
            .fee(transaction.getFee())
            .status(transaction.getStatus().name())
            .description(transaction.getDescription())
            .reference(transaction.getReference())
            .phoneNumber(transaction.getPhoneNumber())
            .paybillNumber(transaction.getPaybillNumber())
            .accountNumber(transaction.getAccountNumber())
            .tillNumber(transaction.getTillNumber())
            .mpesaReceipt(transaction.getMpesaReceipt())
            .createdAt(transaction.getCreatedAt())
            .updatedAt(transaction.getUpdatedAt())
            .build();
    }
}
