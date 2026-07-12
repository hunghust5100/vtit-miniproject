package com.vdt.vtit.asset.controller;

import com.vdt.vtit.asset.dto.AssetInstanceCreateRequest;
import com.vdt.vtit.asset.dto.AssetInstanceResponse;
import com.vdt.vtit.asset.dto.AssetInstanceUpdateRequest;
import com.vdt.vtit.asset.dto.UnusedAssetsReportResponse;
import com.vdt.vtit.asset.service.AssetInstanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/assets/instance")
public class AssetInstanceController {

    private final AssetInstanceService assetInstanceService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AssetInstanceResponse> createAssetInstance(@Valid @RequestBody AssetInstanceCreateRequest request) {
        return new ResponseEntity<>(assetInstanceService.createAssetInstance(request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<AssetInstanceResponse> getAssetInstanceById(@PathVariable Long id) {
        return ResponseEntity.ok(assetInstanceService.getAssetInstanceById(id));
    }

    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Page<AssetInstanceResponse>> getAssetInstancePagination(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        return ResponseEntity.ok(assetInstanceService.getAllAssetInstancePagination(page, size, sortBy, sortDir));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AssetInstanceResponse> updateAssetInstance(@PathVariable Long id, @Valid @RequestBody AssetInstanceUpdateRequest request) {
        return ResponseEntity.ok(assetInstanceService.updateAssetInstanceById(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteAssetInstance(@PathVariable Long id) {

        assetInstanceService.deleteAssetInstanceById(id);

        return ResponseEntity.ok(Map.of("Message", "Xóa thiết bị thành công"));
    }

    @GetMapping("/unused-report")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<UnusedAssetsReportResponse> getUnusedAssetsReport() {
        return ResponseEntity.ok(assetInstanceService.getUnusedAssetsReport());
    }

    @GetMapping("/by-serial/{serial}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<AssetInstanceResponse> getAssetInstanceBySerial(@PathVariable String serial) {
        return ResponseEntity.ok(assetInstanceService.getAssetInstanceBySerial(serial));
    }
}

