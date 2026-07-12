package com.vdt.vtit.asset.controller;

import com.vdt.vtit.asset.dto.AssetInstanceResponse;
import com.vdt.vtit.asset.dto.AssetModelCreateRequest;
import com.vdt.vtit.asset.dto.AssetModelResponse;
import com.vdt.vtit.asset.dto.AssetModelUpdateRequest;
import com.vdt.vtit.asset.service.AssetModelService;
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
@RequestMapping("/api/v1/assets/model")
public class AssetModelController {
    private final AssetModelService assetModelService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AssetModelResponse> createAssetModel(@Valid @RequestBody AssetModelCreateRequest request) {
        return new ResponseEntity<>(assetModelService.createAssetModel(request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<AssetModelResponse> getAssetModelById(@PathVariable Long id) {
        return ResponseEntity.ok(assetModelService.getAssetModelById(id));
    }

    @GetMapping()
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Page<AssetModelResponse>> getAllModel(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        return ResponseEntity.ok(assetModelService.getAllAssetModelPagination(page, size, sortBy, sortDir));
    }

    @GetMapping("/instance")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Page<AssetInstanceResponse>> getAssetInstanceOfModel(
            @RequestParam(defaultValue = "null") String status,
            @RequestParam(defaultValue = "null") Long assetModelId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        return ResponseEntity.ok(assetModelService.getAssetInstanceOfModel(status, assetModelId, page, size, sortBy, sortDir));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AssetModelResponse> updateAsseModel(@PathVariable Long id, @Valid @RequestBody AssetModelUpdateRequest request) {
        return ResponseEntity.ok(assetModelService.updateAssetModel(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteAssetModel(@PathVariable Long id) {
        assetModelService.deleteAssetModel(id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa thành công model"));
    }
}

