package com.vdt.vtit.allocation.controller;

import com.vdt.vtit.allocation.dto.AllocationCreateRequest;
import com.vdt.vtit.allocation.dto.AllocationRespond;
import com.vdt.vtit.allocation.service.AllocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/allocation")
@RequiredArgsConstructor
public class AllocationController {

    private final AllocationService allocationService;

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<AllocationRespond> createNewAllocation(@RequestBody AllocationCreateRequest request) {
        return new ResponseEntity<>(allocationService.createNewAllocation(request), HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Page<AllocationRespond>> getAllocationPagination(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        return ResponseEntity.ok(allocationService.getAllocationPagination(page, size, sortBy, sortDir));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<AllocationRespond> getAllocationById(@PathVariable Long id) {
        return ResponseEntity.ok(allocationService.getAllocationById(id));
    }

    @GetMapping("/staff/{staffId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Page<AllocationRespond>> getAllocationByStaff(
            @PathVariable Long staffId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        return ResponseEntity.ok(allocationService.getAllocationByStaff(staffId, page, size, sortBy, sortDir));
    }

    @GetMapping("/asset-instance/{assetInstanceId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Page<AllocationRespond>> getAllocationByAssetInstance(
            @PathVariable Long assetInstanceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        return ResponseEntity.ok(allocationService.getAllocationByAssetInstance(assetInstanceId, page, size, sortBy, sortDir));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<AllocationRespond> updateAllocation(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(allocationService.updateAllocation(id, status));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAllocation(@PathVariable Long id) {
        allocationService.deleteAllocation(id);
        return ResponseEntity.noContent().build();
    }
}

