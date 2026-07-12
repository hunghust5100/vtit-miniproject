package com.vdt.vtit.asset.repository;

import com.vdt.vtit.asset.entity.AssetInstance;
import com.vdt.vtit.asset.entity.AssetModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface AssetInstanceRepository extends JpaRepository<AssetInstance, Long> {
    @Query("SELECT a FROM AssetInstance a WHERE " +
            "(:status IS NULL OR a.status = :status) AND " +
            "(:assetModelId IS NULL OR a.assetModel.id = :assetModelId)")
    Page<AssetInstance> findByFilter(@Param("status") String status,
                                     @Param("assetModelId") Long assetModelId,
                                     Pageable pageable);

    @Query("SELECT a FROM AssetInstance a WHERE a.status <> 'LIQUIDATED' AND a.status <> 'USING' AND a.purchaseDate <= :threeMonthsAgo AND NOT EXISTS (" +
           "SELECT al FROM Allocation al WHERE al.assetInstance = a AND (" +
           "al.requestAt > :threeMonthsAgoDateTime OR " +
           "al.actionAt > :threeMonthsAgoDateTime OR " +
           "al.receivedAt > :threeMonthsAgoDateTime OR " +
           "al.returnedAt > :threeMonthsAgoDateTime" +
           "))")
    List<AssetInstance> findUnusedAssets(@Param("threeMonthsAgo") LocalDate threeMonthsAgo,
                                         @Param("threeMonthsAgoDateTime") LocalDateTime threeMonthsAgoDateTime);

    java.util.Optional<AssetInstance> findBySerial(String serial);
}
