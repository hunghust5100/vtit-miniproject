package com.vdt.vtit.asset.controller;

import com.vdt.vtit.asset.dto.AssetTypeCreateRequest;
import com.vdt.vtit.asset.dto.AssetTypeResponse;
import com.vdt.vtit.asset.dto.AssetTypeUpdateRequest;
import com.vdt.vtit.asset.service.AssetTypeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/assets/type")

public class AssetTypeController {
    private final AssetTypeService assetTypeService;

    @PostMapping
    public ResponseEntity<AssetTypeResponse> createAssetType(@Valid @RequestBody AssetTypeCreateRequest request) {
        return new ResponseEntity<>(assetTypeService.createAssetType(request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetTypeResponse> getAssetTypeById(@PathVariable Long id) {
        return ResponseEntity.ok(assetTypeService.getAssetTypeById(id));
    }

    @GetMapping
    public ResponseEntity<Page<AssetTypeResponse>> getAllAssetType(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        Page<AssetTypeResponse> assetTypeResponsesPage = assetTypeService
                .getAssetTypeWithPagination(page, size, sortBy, sortDir);
        return ResponseEntity.ok(assetTypeResponsesPage);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssetTypeResponse> updateAssetType(@PathVariable Long id, @Valid @RequestBody AssetTypeUpdateRequest request) {
        return ResponseEntity.ok(assetTypeService.updateAssetType(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteAssetType(@PathVariable Long id) {
        assetTypeService.deleteAssetType(id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa loại thiết bị thành công"));
    }
}
