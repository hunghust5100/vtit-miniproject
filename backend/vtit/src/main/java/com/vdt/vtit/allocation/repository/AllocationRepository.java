package com.vdt.vtit.allocation.repository;

import com.vdt.vtit.allocation.entity.Allocation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AllocationRepository extends JpaRepository<Allocation, Long> {
    Page<Allocation> findByStaffId(Long staffId, Pageable pageable);

    Page<Allocation> findByAssetInstanceId(Long assetInstanceId, Pageable pageable);
}
