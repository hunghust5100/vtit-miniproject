package com.vdt.vtit.warehouse.controller;

import com.vdt.vtit.warehouse.dto.WarehouseDetailResponse;
import com.vdt.vtit.warehouse.dto.WarehouseRequest;
import com.vdt.vtit.warehouse.dto.WarehouseResponse;
import com.vdt.vtit.warehouse.service.WarehouseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/warehouses")
public class WarehouseController {

    private final WarehouseService warehouseService;

    @GetMapping
    public ResponseEntity<List<WarehouseResponse>> getAllWarehouses() {
        return ResponseEntity.ok(warehouseService.getAllWarehouses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<WarehouseDetailResponse> getWarehouseById(@PathVariable Long id) {
        return ResponseEntity.ok(warehouseService.getWarehouseById(id));
    }

    @PostMapping
    public ResponseEntity<WarehouseResponse> createWarehouse(@Valid @RequestBody WarehouseRequest request) {
        return new ResponseEntity<>(warehouseService.createWarehouse(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<WarehouseResponse> updateWarehouse(@PathVariable Long id, @Valid @RequestBody WarehouseRequest request) {
        return ResponseEntity.ok(warehouseService.updateWarehouse(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteWarehouse(@PathVariable Long id) {
        warehouseService.deleteWarehouse(id);
        return ResponseEntity.ok(Map.of("message", "Xóa kho hàng thành công"));
    }

    @PostMapping("/{id}/assets/{assetInstanceId}")
    public ResponseEntity<Map<String, String>> addAssetToWarehouse(@PathVariable Long id, @PathVariable Long assetInstanceId) {
        warehouseService.addAssetToWarehouse(id, assetInstanceId);
        return ResponseEntity.ok(Map.of("message", "Thêm thiết bị vào kho thành công"));
    }

    @DeleteMapping("/assets/{assetInstanceId}")
    public ResponseEntity<Map<String, String>> removeAssetFromWarehouse(@PathVariable Long assetInstanceId) {
        warehouseService.removeAssetFromWarehouse(assetInstanceId);
        return ResponseEntity.ok(Map.of("message", "Đã xuất thiết bị khỏi kho"));
    }
}
