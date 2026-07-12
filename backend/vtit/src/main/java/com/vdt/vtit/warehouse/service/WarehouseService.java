package com.vdt.vtit.warehouse.service;

import com.vdt.vtit.warehouse.dto.WarehouseDetailResponse;
import com.vdt.vtit.warehouse.dto.WarehouseRequest;
import com.vdt.vtit.warehouse.dto.WarehouseResponse;

import java.util.List;

public interface WarehouseService {
    List<WarehouseResponse> getAllWarehouses();
    WarehouseDetailResponse getWarehouseById(Long id);
    WarehouseResponse createWarehouse(WarehouseRequest request);
    WarehouseResponse updateWarehouse(Long id, WarehouseRequest request);
    void deleteWarehouse(Long id);
    void addAssetToWarehouse(Long warehouseId, Long assetInstanceId);
    void removeAssetFromWarehouse(Long assetInstanceId);
}
