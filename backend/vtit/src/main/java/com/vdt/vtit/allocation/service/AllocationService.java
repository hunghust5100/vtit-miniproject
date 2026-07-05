package com.vdt.vtit.allocation.service;

import com.vdt.vtit.allocation.dto.AllocationCreateRequest;
import com.vdt.vtit.allocation.dto.AllocationRespond;
import com.vdt.vtit.allocation.dto.AllocationUpdateRequest;
import org.springframework.data.domain.Page;

public interface AllocationService {

    AllocationRespond createNewAllocation(AllocationCreateRequest request);

    Page<AllocationRespond> getAllocationPagination(int page, int size, String sortBy, String sortDir);

    AllocationRespond getAllocationById(Long assignmentHistoryId);

    Page<AllocationRespond> getAllocationByStaff(Long staffId, int page, int size, String sortBy, String sortDir);

    Page<AllocationRespond> getAllocationByAssetInstance(Long assetInstanceId, int page, int size, String sortBy, String sortDir);

    AllocationRespond updateAllocation(Long id, String status);

    void deleteAllocation(Long id);

    void releaseExpiredAllocations();
}
