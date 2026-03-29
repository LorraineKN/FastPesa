package org.NovaGroup.EmergencyWallet.repository;

import org.NovaGroup.EmergencyWallet.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, String> {
    Optional<Transaction> findByReference(String reference);
    Page<Transaction> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
    Page<Transaction> findBySenderWalletIdOrderByCreatedAtDesc(String walletId, Pageable pageable);
}
