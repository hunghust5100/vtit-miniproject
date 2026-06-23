package com.vdt.vtit.allocation.service;

import com.vdt.vtit.allocation.dto.AllocationCreateRequest;
import com.vdt.vtit.allocation.dto.AllocationRespond;
import com.vdt.vtit.allocation.entity.Allocation;
import com.vdt.vtit.allocation.repository.AllocationRepository;
import com.vdt.vtit.asset.entity.AssetInstance;
import com.vdt.vtit.asset.repository.AssetInstanceRepository;
import com.vdt.vtit.common.exception.BadRequestException;
import com.vdt.vtit.common.exception.ResourceNotFoundException;
import com.vdt.vtit.user.entity.User;
import com.vdt.vtit.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AllocationServiceImpl implements AllocationService{

    private final AllocationRepository allocationRepository;
    private final UserRepository userRepository;
    private final AssetInstanceRepository assetInstanceRepository;

    @Override
    public AllocationRespond createNewAllocation(AllocationCreateRequest request) {
        User staff = userRepository.findById(request.getStaffId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên"));

        Pageable limitOne = PageRequest.of(0,1);
        Page<AssetInstance> availableAsset = assetInstanceRepository
                .findByFilter(
                        "AVAILABLE",
                        request.getAssetModelId(),
                        limitOne
                );

        if (availableAsset.isEmpty()) {
            throw new BadRequestException("Không có thiết bị nào sẵn sàng");
        }

        AssetInstance assetInstance = availableAsset.getContent().getFirst();
        assetInstance.setStatus("PENDING");

        Allocation allocation = new Allocation();
        allocation.setStaff(staff);
        allocation.setAssetInstance(assetInstance);
        allocation.setStatus("PENDING");

        assetInstance.getAllocations().add(allocation);
        staff.getAllocations().add(allocation);

        Allocation saveAllocation = allocationRepository.save(allocation);

        return mapToAllocationResponse(saveAllocation);
    }

    @Override
    public Page<AllocationRespond> getAllocationPagination(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name())
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Allocation> allocationPage = allocationRepository.findAll(pageable);

        return allocationPage.map(this::mapToAllocationResponse);
    }

    @Override
    public AllocationRespond getAllocationById(Long id) {
        Allocation allocation = allocationRepository.findById(id)
                .orElseThrow(()-> new ResourceNotFoundException("Không tìm thấy lịch sử"));

        return mapToAllocationResponse(allocation);
    }

    @Override
    public Page<AllocationRespond> getAllocationByStaff(Long staffId, int page, int size, String sortBy, String sortDir) {

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên"));

        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name())
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Allocation> allocationPage = allocationRepository.findByStaffId(staffId, pageable);

        return allocationPage.map(this::mapToAllocationResponse);
    }

    @Override
    public Page<AllocationRespond> getAllocationByAssetInstance(Long assetInstanceId, int page, int size, String sortBy, String sortDir) {
        AssetInstance assetInstance = assetInstanceRepository.findById(assetInstanceId)
                .orElseThrow(()-> new ResourceNotFoundException("Không tìm thấy thiết bị"));

        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name())
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Allocation> allocationPage = allocationRepository.findByAssetInstanceId(assetInstanceId, pageable);

        return allocationPage.map(this::mapToAllocationResponse);
    }

    @Override
    public AllocationRespond updateAllocation(Long id, String targetStatus) {

        Allocation allocation = allocationRepository.findById(id)
                .orElseThrow(()-> new ResourceNotFoundException("Không tìm thấy lịch sử"));

        String currentStatus = allocation.getStatus();

        if (("APPROVED".equals(targetStatus) || "REJECTED".equals(targetStatus)) && !"PENDING".equals(currentStatus)) {
            throw new BadRequestException("Chỉ có thể Duyệt/Từ chối các yêu cầu đang ở trạng thái CHỜ DUYỆT (PENDING)");
        }

        if (("USING".equals(targetStatus) || "CANCELED".equals(targetStatus)) && !"APPROVED".equals(currentStatus)) {
            throw new BadRequestException("Chỉ có thể Nhận/Hủy các yêu cầu đã được DUYỆT (APPROVED)");
        }

        if ("RETURNED".equals(targetStatus) && !"USING".equals(currentStatus)) {
            throw new BadRequestException("Chỉ có thể Trả các tài sản đang ở trạng thái SỬ DỤNG (USING)");
        }

        List<String> validStatuses = List.of("APPROVED", "REJECTED", "USING", "CANCELED", "RETURNED");
        if (!validStatuses.contains(targetStatus)) {
            throw new BadRequestException("Trạng thái yêu cầu thay đổi không hợp lệ");
        }

        allocation.setStatus(targetStatus);

        if ("APPROVED".equals(targetStatus) || "REJECTED".equals(targetStatus)) {
            allocation.setActionAt(LocalDateTime.now());
        } else if ("USING".equals(targetStatus)) {
            allocation.setReceivedAt(LocalDateTime.now());
        } else if ("RETURNED".equals(targetStatus)) {
            allocation.setReturnedAt(LocalDateTime.now());
        }

        AssetInstance asset = allocation.getAssetInstance();
        if (asset != null) {
            if ("REJECTED".equals(targetStatus) || "CANCELED".equals(targetStatus) || "RETURNED".equals(targetStatus)) {
                asset.setStatus("AVAILABLE");
            } else if ("USING".equals(targetStatus)) {
                asset.setStatus("USING");
            }
        }

        return mapToAllocationResponse(allocationRepository.save(allocation));
    }

    @Override
    public void deleteAllocation(Long id) {
        Allocation allocation = allocationRepository.findById(id)
                .orElseThrow(()-> new ResourceNotFoundException("Không tìm thấy lịch sử"));
        allocationRepository.delete(allocation);
    }

    private AllocationRespond mapToAllocationResponse(Allocation allocation) {
        return AllocationRespond.builder()
                .id(allocation.getId())
                .assetModelId(allocation.getAssetInstance().getAssetModel().getId())
                .assetModelName(allocation.getAssetInstance().getAssetModel().getName())
                .staffId(allocation.getStaff().getId())
                .staffName(allocation.getStaff().getFullName())
                .assetInstanceId(allocation.getAssetInstance().getId())
                .requestAt(allocation.getRequestAt())
                .actionAt(allocation.getActionAt())
                .status(allocation.getStatus())
                .receivedAt(allocation.getReceivedAt())
                .expectedReturnDate(allocation.getExpectedReturnDate())
                .returnedAt(allocation.getReturnedAt())
                .build();
    }
}
