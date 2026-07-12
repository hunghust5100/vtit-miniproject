package com.vdt.vtit.warehouse.service;

import com.vdt.vtit.allocation.entity.Allocation;
import com.vdt.vtit.asset.entity.AssetInstance;
import com.vdt.vtit.asset.repository.AssetInstanceRepository;
import com.vdt.vtit.common.exception.BadRequestException;
import com.vdt.vtit.common.exception.ResourceNotFoundException;
import com.vdt.vtit.warehouse.dto.AssetInWarehouseResponse;
import com.vdt.vtit.warehouse.dto.WarehouseDetailResponse;
import com.vdt.vtit.warehouse.dto.WarehouseRequest;
import com.vdt.vtit.warehouse.dto.WarehouseResponse;
import com.vdt.vtit.warehouse.entity.Warehouse;
import com.vdt.vtit.warehouse.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WarehouseServiceImpl implements WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final AssetInstanceRepository assetInstanceRepository;

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseResponse> getAllWarehouses() {
        return warehouseRepository.findAll().stream()
                .map(this::mapToWarehouseResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public WarehouseDetailResponse getWarehouseById(Long id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kho hàng với ID: " + id));

        List<AssetInWarehouseResponse> assets = warehouse.getAssetInstances().stream()
                .map(this::mapToAssetInWarehouseResponse)
                .collect(Collectors.toList());

        return WarehouseDetailResponse.builder()
                .id(warehouse.getId())
                .name(warehouse.getName())
                .code(warehouse.getCode())
                .location(warehouse.getLocation())
                .description(warehouse.getDescription())
                .assets(assets)
                .build();
    }

    @Override
    @Transactional
    public WarehouseResponse createWarehouse(WarehouseRequest request) {
        if (request.getCode() != null && warehouseRepository.findByCode(request.getCode()).isPresent()) {
            throw new BadRequestException("Mã kho hàng đã tồn tại: " + request.getCode());
        }

        Warehouse warehouse = Warehouse.builder()
                .name(request.getName())
                .code(request.getCode())
                .location(request.getLocation())
                .description(request.getDescription())
                .build();

        return mapToWarehouseResponse(warehouseRepository.save(warehouse));
    }

    @Override
    @Transactional
    public WarehouseResponse updateWarehouse(Long id, WarehouseRequest request) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kho hàng với ID: " + id));

        if (request.getCode() != null && !request.getCode().equals(warehouse.getCode())
                && warehouseRepository.findByCode(request.getCode()).isPresent()) {
            throw new BadRequestException("Mã kho hàng đã tồn tại: " + request.getCode());
        }

        warehouse.setName(request.getName());
        warehouse.setCode(request.getCode());
        warehouse.setLocation(request.getLocation());
        warehouse.setDescription(request.getDescription());

        return mapToWarehouseResponse(warehouseRepository.save(warehouse));
    }

    @Override
    @Transactional
    public void deleteWarehouse(Long id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kho hàng với ID: " + id));

        // Unlink all asset instances before delete
        if (warehouse.getAssetInstances() != null) {
            java.util.List<AssetInstance> assets = new java.util.ArrayList<>(warehouse.getAssetInstances());
            for (AssetInstance asset : assets) {
                asset.setWarehouse(null);
                assetInstanceRepository.save(asset);
            }
        }

        warehouseRepository.delete(warehouse);
    }

    @Override
    @Transactional
    public void addAssetToWarehouse(Long warehouseId, Long assetInstanceId) {
        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kho hàng với ID: " + warehouseId));

        AssetInstance asset = assetInstanceRepository.findById(assetInstanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thiết bị với ID: " + assetInstanceId));

        asset.setWarehouse(warehouse);
        assetInstanceRepository.save(asset);
    }

    @Override
    @Transactional
    public void removeAssetFromWarehouse(Long assetInstanceId) {
        AssetInstance asset = assetInstanceRepository.findById(assetInstanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thiết bị với ID: " + assetInstanceId));

        asset.setWarehouse(null);
        assetInstanceRepository.save(asset);
    }

    private WarehouseResponse mapToWarehouseResponse(Warehouse warehouse) {
        int totalAssets = warehouse.getAssetInstances() != null ? warehouse.getAssetInstances().size() : 0;

        return WarehouseResponse.builder()
                .id(warehouse.getId())
                .name(warehouse.getName())
                .code(warehouse.getCode())
                .location(warehouse.getLocation())
                .description(warehouse.getDescription())
                .totalAssets(totalAssets)
                .build();
    }

    private AssetInWarehouseResponse mapToAssetInWarehouseResponse(AssetInstance asset) {
        String exportStatus = "Trong kho";
        String allocatedToStaff = null;

        if (asset.getAllocations() != null) {
            Allocation activeAlloc = asset.getAllocations().stream()
                    .filter(alloc -> "PENDING".equals(alloc.getStatus())
                            || "APPROVED".equals(alloc.getStatus())
                            || "USING".equals(alloc.getStatus()))
                    .findFirst()
                    .orElse(null);

            if (activeAlloc != null) {
                allocatedToStaff = activeAlloc.getStaff() != null ? activeAlloc.getStaff().getFullName() : null;
                if ("PENDING".equals(activeAlloc.getStatus())) {
                    exportStatus = "Chờ duyệt xuất kho";
                } else if ("APPROVED".equals(activeAlloc.getStatus())) {
                    exportStatus = "Đang chờ bàn giao";
                } else if ("USING".equals(activeAlloc.getStatus())) {
                    exportStatus = "Đã xuất kho";
                }
            }
        }

        return AssetInWarehouseResponse.builder()
                .id(asset.getId())
                .serial(asset.getSerial())
                .modelName(asset.getAssetModel().getName())
                .typeName(asset.getAssetModel().getAssetType().getName())
                .status(asset.getStatus())
                .exportStatus(exportStatus)
                .allocatedToStaff(allocatedToStaff)
                .purchaseDate(asset.getPurchaseDate())
                .purchasePrice(asset.getPurchasePrice())
                .build();
    }
}
