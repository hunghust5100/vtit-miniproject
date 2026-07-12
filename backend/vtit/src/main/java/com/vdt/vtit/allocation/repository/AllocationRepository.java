package com.vdt.vtit.allocation.repository;

import com.vdt.vtit.allocation.entity.Allocation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface AllocationRepository extends JpaRepository<Allocation, Long> {
    Page<Allocation> findByStaffId(Long staffId, Pageable pageable);

    Page<Allocation> findByAssetInstanceId(Long assetInstanceId, Pageable pageable);

    Page<Allocation> findByStaffDepartmentId(Long departmentId, Pageable pageable);

    Page<Allocation> findByAssetInstanceIdAndStaffDepartmentId(Long assetInstanceId, Long departmentId, Pageable pageable);

    List<Allocation> findByStatusAndRequestAtBefore(String status, LocalDateTime dateTime);
}


