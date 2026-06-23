package com.vdt.vtit.asset.repository;

import com.vdt.vtit.asset.entity.AssetInstance;
import com.vdt.vtit.asset.entity.AssetModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AssetInstanceRepository extends JpaRepository<AssetInstance, Long> {
    @Query("SELECT a FROM AssetInstance a WHERE " +
            "(:status IS NULL OR a.status = :status) AND " +
            "(:assetModelId IS NULL OR a.assetModel.id = :assetModelId)")
    Page<AssetInstance> findByFilter(@Param("status") String status,
                                     @Param("assetModelId") Long assetModelId,
                                     Pageable pageable);
}
