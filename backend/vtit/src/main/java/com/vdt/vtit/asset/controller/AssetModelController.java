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
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/assets/model")
public class AssetModelController {
    private final AssetModelService assetModelService;

    @PostMapping
    public ResponseEntity<AssetModelResponse> createAssetModel(@Valid @RequestBody AssetModelCreateRequest request) {
        return new ResponseEntity<>(assetModelService.createAssetModel(request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetModelResponse> getAssetModelById(@PathVariable Long id) {
        return ResponseEntity.ok(assetModelService.getAssetModelById(id));
    }

    @GetMapping()
    public ResponseEntity<Page<AssetModelResponse>> getAllModel(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        return ResponseEntity.ok(assetModelService.getAllAssetModelPagination(page, size, sortBy, sortDir));
    }

    @GetMapping("/instance")
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
    public ResponseEntity<AssetModelResponse> updateAsseModel(@PathVariable Long id, @Valid @RequestBody AssetModelUpdateRequest request) {
        return ResponseEntity.ok(assetModelService.updateAssetModel(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteAssetModel(@PathVariable Long id) {
        assetModelService.deleteAssetModel(id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa thành công model"));
    }

}
