package org.NovaGroup.EmergencyWallet.repository;

import org.NovaGroup.EmergencyWallet.entity.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, String> {
    Optional<Wallet> findByUserIdAndIsActiveTrue(String userId);
    List<Wallet> findByUserId(String userId);
    Optional<Wallet> findByIdAndUserId(String walletId, String userId);
}
