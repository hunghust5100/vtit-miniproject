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
import com.vdt.vtit.auth.entity.AppUser;
import org.springframework.security.core.context.SecurityContextHolder;
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
        releaseExpiredAllocations();
        User staff = userRepository.findById(request.getStaffId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên"));

        AssetInstance assetInstance;
        if (request.getAssetInstanceId() != null) {
            assetInstance = assetInstanceRepository.findById(request.getAssetInstanceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thiết bị với ID: " + request.getAssetInstanceId()));
            if (!"AVAILABLE".equals(assetInstance.getStatus())) {
                throw new BadRequestException("Thiết bị này không khả dụng để cấp phát (Trạng thái hiện tại: " + assetInstance.getStatus() + ")");
            }
        } else {
            Pageable limitOne = PageRequest.of(0, 1);
            Page<AssetInstance> availableAsset = assetInstanceRepository
                    .findByFilter(
                            "AVAILABLE",
                            request.getAssetModelId(),
                            limitOne
                    );

            if (availableAsset.isEmpty()) {
                throw new BadRequestException("Không có thiết bị nào sẵn sàng");
            }
            assetInstance = availableAsset.getContent().getFirst();
        }
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

    private User getCurrentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof AppUser) {
            return ((AppUser) principal).getUser();
        }
        return null;
    }

    @Override
    public Page<AllocationRespond> getAllocationPagination(int page, int size, String sortBy, String sortDir) {
        releaseExpiredAllocations();
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name())
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return Page.empty(pageable);
        }

        Page<Allocation> allocationPage;
        if ("ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            allocationPage = allocationRepository.findAll(pageable);
        } else if ("MANAGER".equalsIgnoreCase(currentUser.getRole())) {
            if (currentUser.getDepartment() == null) {
                return Page.empty(pageable);
            }
            allocationPage = allocationRepository.findByStaffDepartmentId(currentUser.getDepartment().getId(), pageable);
        } else {
            // USER (Staff)
            allocationPage = allocationRepository.findByStaffId(currentUser.getId(), pageable);
        }

        return allocationPage.map(this::mapToAllocationResponse);
    }

    @Override
    public AllocationRespond getAllocationById(Long id) {
        releaseExpiredAllocations();
        Allocation allocation = allocationRepository.findById(id)
                .orElseThrow(()-> new ResourceNotFoundException("Không tìm thấy lịch sử"));

        User currentUser = getCurrentUser();
        if (currentUser != null) {
            if ("MANAGER".equalsIgnoreCase(currentUser.getRole())) {
                if (allocation.getStaff().getDepartment() == null || 
                        currentUser.getDepartment() == null || 
                        !allocation.getStaff().getDepartment().getId().equals(currentUser.getDepartment().getId())) {
                    throw new BadRequestException("Bạn không có quyền xem lịch sử cấp phát này.");
                }
            } else if ("USER".equalsIgnoreCase(currentUser.getRole())) {
                if (!allocation.getStaff().getId().equals(currentUser.getId())) {
                    throw new BadRequestException("Bạn không có quyền xem lịch sử cấp phát này.");
                }
            }
        }

        return mapToAllocationResponse(allocation);
    }

    @Override
    public Page<AllocationRespond> getAllocationByStaff(Long staffId, int page, int size, String sortBy, String sortDir) {
        releaseExpiredAllocations();
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên"));

        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name())
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        User currentUser = getCurrentUser();
        if (currentUser != null) {
            if ("MANAGER".equalsIgnoreCase(currentUser.getRole())) {
                if (staff.getDepartment() == null || 
                        currentUser.getDepartment() == null || 
                        !staff.getDepartment().getId().equals(currentUser.getDepartment().getId())) {
                    throw new BadRequestException("Bạn không có quyền xem lịch sử cấp phát của nhân viên này.");
                }
            } else if ("USER".equalsIgnoreCase(currentUser.getRole())) {
                if (!staffId.equals(currentUser.getId())) {
                    throw new BadRequestException("Bạn không có quyền xem lịch sử cấp phát của nhân viên khác.");
                }
            }
        }

        Page<Allocation> allocationPage = allocationRepository.findByStaffId(staffId, pageable);

        return allocationPage.map(this::mapToAllocationResponse);
    }

    @Override
    public Page<AllocationRespond> getAllocationByAssetInstance(Long assetInstanceId, int page, int size, String sortBy, String sortDir) {
        releaseExpiredAllocations();
        AssetInstance assetInstance = assetInstanceRepository.findById(assetInstanceId)
                .orElseThrow(()-> new ResourceNotFoundException("Không tìm thấy thiết bị"));

        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name())
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return Page.empty(pageable);
        }

        Page<Allocation> allocationPage;
        if ("ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            allocationPage = allocationRepository.findByAssetInstanceId(assetInstanceId, pageable);
        } else if ("MANAGER".equalsIgnoreCase(currentUser.getRole())) {
            if (currentUser.getDepartment() == null) {
                return Page.empty(pageable);
            }
            allocationPage = allocationRepository.findByAssetInstanceIdAndStaffDepartmentId(assetInstanceId, currentUser.getDepartment().getId(), pageable);
        } else {
            // USER (Staff) - Không được phép xem lịch sử bàn giao thiết bị
            throw new BadRequestException("Bạn không có quyền xem lịch sử bàn giao của thiết bị này.");
        }

        return allocationPage.map(this::mapToAllocationResponse);
    }

    @Override
    public AllocationRespond updateAllocation(Long id, String targetStatus) {

        Allocation allocation = allocationRepository.findById(id)
                .orElseThrow(()-> new ResourceNotFoundException("Không tìm thấy lịch sử"));

        User currentUser = getCurrentUser();
        if (currentUser != null) {
            // Kiểm tra phân quyền cập nhật trạng thái
            if ("APPROVED".equals(targetStatus) || "REJECTED".equals(targetStatus)) {
                // Chỉ MANAGER và ADMIN mới được Duyệt / Từ chối
                if (!"ADMIN".equalsIgnoreCase(currentUser.getRole()) && !"MANAGER".equalsIgnoreCase(currentUser.getRole())) {
                    throw new BadRequestException("Bạn không có quyền Duyệt hoặc Từ chối yêu cầu cấp phát.");
                }
                // Nếu là MANAGER, nhân viên mượn phải thuộc cùng phòng ban
                if ("MANAGER".equalsIgnoreCase(currentUser.getRole())) {
                    if (allocation.getStaff().getDepartment() == null || 
                            currentUser.getDepartment() == null || 
                            !allocation.getStaff().getDepartment().getId().equals(currentUser.getDepartment().getId())) {
                        throw new BadRequestException("Bạn không có quyền Duyệt hoặc Từ chối yêu cầu của nhân viên thuộc phòng ban khác.");
                    }
                }
            } else if ("USING".equals(targetStatus) || "CANCELED".equals(targetStatus) || "RETURNED".equals(targetStatus)) {
                // USER chỉ được tự Nhận / Trả / Hủy của chính mình
                if ("USER".equalsIgnoreCase(currentUser.getRole())) {
                    if (!allocation.getStaff().getId().equals(currentUser.getId())) {
                        throw new BadRequestException("Bạn không thể thay đổi trạng thái yêu cầu của người khác.");
                    }
                } else if ("MANAGER".equalsIgnoreCase(currentUser.getRole())) {
                    // MANAGER chỉ được thao tác cho nhân viên thuộc phòng của mình
                    if (allocation.getStaff().getDepartment() == null || 
                            currentUser.getDepartment() == null || 
                            !allocation.getStaff().getDepartment().getId().equals(currentUser.getDepartment().getId())) {
                        throw new BadRequestException("Bạn không có quyền thao tác trên yêu cầu của nhân viên thuộc phòng ban khác.");
                    }
                }
            }
        }

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

    @Override
    public void releaseExpiredAllocations() {
        LocalDateTime expirationTime = LocalDateTime.now().minusHours(24);
        List<Allocation> expiredAllocations = allocationRepository.findByStatusAndRequestAtBefore("PENDING", expirationTime);
        if (!expiredAllocations.isEmpty()) {
            for (Allocation allocation : expiredAllocations) {
                allocation.setStatus("CANCELED");
                allocation.setActionAt(LocalDateTime.now());
                AssetInstance asset = allocation.getAssetInstance();
                if (asset != null) {
                    asset.setStatus("AVAILABLE");
                }
            }
            allocationRepository.saveAll(expiredAllocations);
        }
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
