package com.vdt.vtit.asset.service;

import com.vdt.vtit.asset.dto.AssetInstanceCreateRequest;
import com.vdt.vtit.asset.dto.AssetInstanceResponse;
import com.vdt.vtit.asset.dto.AssetInstanceUpdateRequest;
import com.vdt.vtit.asset.dto.UnusedAssetsReportResponse;
import com.vdt.vtit.asset.entity.AssetInstance;
import com.vdt.vtit.asset.entity.AssetModel;
import com.vdt.vtit.asset.repository.AssetInstanceRepository;
import com.vdt.vtit.asset.repository.AssetModelRepository;
import com.vdt.vtit.common.exception.BadRequestException;
import com.vdt.vtit.warehouse.entity.Warehouse;
import com.vdt.vtit.warehouse.repository.WarehouseRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AssetInstanceServiceImpl implements AssetInstanceService {
    private final AssetInstanceRepository assetInstanceRepository;
    private final AssetModelRepository assetModelRepository;
    private final WarehouseRepository warehouseRepository;

    @Override
    public AssetInstanceResponse createAssetInstance(AssetInstanceCreateRequest request) {

        AssetModel assetModel = assetModelRepository.findById(request.getAssetModelId())
                .orElseThrow(() -> new BadRequestException("Không tìm thấy model"));

        String method = request.getDepreciationMethod() != null ? request.getDepreciationMethod() : assetModel.getDepreciationMethod();
        Double rate = request.getDepreciationRate() != null ? request.getDepreciationRate() : assetModel.getDepreciationRate();
        Integer cycle = request.getDepreciationCycle() != null ? request.getDepreciationCycle() : assetModel.getDepreciationCycle();
        Double factor = request.getAdjustmentFactor() != null ? request.getAdjustmentFactor() : assetModel.getAdjustmentFactor();
        Long netVal = request.getNetBookValue() != null ? request.getNetBookValue() : request.getPurchasePrice();
        Long salvage = request.getSalvageValue() != null ? request.getSalvageValue() : 0L;

        Warehouse warehouse = null;
        if (request.getWarehouseId() != null) {
            warehouse = warehouseRepository.findById(request.getWarehouseId())
                    .orElseThrow(() -> new BadRequestException("Không tìm thấy kho hàng"));
        }

        AssetInstance assetInstance = AssetInstance.builder()
                .assetModel(assetModel)
                .serial(request.getSerial())
                .specification(assetModel.getSpecification())
                .status("AVAILABLE")
                .purchaseDate(request.getPurchaseDate())
                .purchasePrice(request.getPurchasePrice())
                .depreciationMethod(method != null ? method : "STRAIGHT_LINE")
                .depreciationRate(rate)
                .depreciationCycle(cycle)
                .adjustmentFactor(factor)
                .netBookValue(netVal)
                .salvageValue(salvage)
                .maintenanceCost(request.getMaintenanceCost())
                .warehouse(warehouse)
                .build();

        return mapToAssetInstanceResponse(assetInstanceRepository.save(assetInstance));
    }

    @Override
    public AssetInstanceResponse getAssetInstanceById(Long id) {
        AssetInstance assetInstance = assetInstanceRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy thiết bị"));

        return mapToAssetInstanceResponse(assetInstance);
    }

    @Override
    public List<AssetInstanceResponse> getAllAssetInstance() {
        return assetInstanceRepository.findAll()
                .stream()
                .map(this::mapToAssetInstanceResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<AssetInstanceResponse> getAllAssetInstancePagination(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) ?
                Sort.by(sortBy).ascending() :
                Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<AssetInstance> assetInstancePage = assetInstanceRepository.findAll(pageable);

        return assetInstancePage.map(this::mapToAssetInstanceResponse);
    }

    @Override
    public AssetInstanceResponse updateAssetInstanceById(Long id, AssetInstanceUpdateRequest request) {

        AssetInstance assetInstance = assetInstanceRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy thiết bị"));

        AssetModel assetModel = assetModelRepository.findById(request.getAssetModelId())
                .orElseThrow(() -> new BadRequestException("Không tìm thấy model"));

        Warehouse warehouse = null;
        if (request.getWarehouseId() != null) {
            warehouse = warehouseRepository.findById(request.getWarehouseId())
                    .orElseThrow(() -> new BadRequestException("Không tìm thấy kho hàng"));
        }

        assetInstance.setAssetModel(assetModel);
        assetInstance.setSerial(request.getSerial());
        assetInstance.setSpecification(request.getSpecification());
        assetInstance.setStatus(request.getStatus());
        assetInstance.setDepreciationMethod(request.getDepreciationMethod());
        assetInstance.setPurchaseDate(request.getPurchaseDate());
        assetInstance.setPurchasePrice(request.getPurchasePrice());
        assetInstance.setNetBookValue(request.getNetBookValue());
        assetInstance.setSalvageValue(request.getSalvageValue());
        assetInstance.setDepreciationRate(request.getDepreciationRate());
        assetInstance.setDepreciationCycle(request.getDepreciationCycle());
        assetInstance.setAdjustmentFactor(request.getAdjustmentFactor());
        assetInstance.setMaintenanceCost(request.getMaintenanceCost());
        assetInstance.setWarehouse(warehouse);

        return mapToAssetInstanceResponse(assetInstanceRepository.save(assetInstance));
    }

    @Override
    public void deleteAssetInstanceById(Long id) {
        AssetInstance assetInstance = assetInstanceRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy thiết bị"));

        assetInstanceRepository.delete(assetInstance);
    }

    private Long calculateCurrentNetBookValue(AssetInstance instance) {
        if (instance.getPurchasePrice() == null) {
            return 0L;
        }

        LocalDate purchaseDate = instance.getPurchaseDate() != null ? instance.getPurchaseDate() : LocalDate.now();
        Long purchasePrice = instance.getPurchasePrice();
        String method = instance.getDepreciationMethod() != null ? instance.getDepreciationMethod() : "STRAIGHT_LINE";
        Integer cycle = instance.getDepreciationCycle() != null ? instance.getDepreciationCycle() : 12;
        if (cycle <= 0) cycle = 12;
        Double rate = instance.getDepreciationRate() != null ? instance.getDepreciationRate() : 0.0;

        Long salvageValue = instance.getSalvageValue() != null ? instance.getSalvageValue() : 0L;
        if ("LICENSE_KEY".equalsIgnoreCase(method)) {
            salvageValue = 0L;
        }

        LocalDate targetDate = LocalDate.now();
        int monthsElapsed = 0;
        if (targetDate.isAfter(purchaseDate)) {
            monthsElapsed = (int) java.time.temporal.ChronoUnit.MONTHS.between(
                    purchaseDate.withDayOfMonth(1),
                    targetDate.withDayOfMonth(1)
            );
            if (monthsElapsed < 0) {
                monthsElapsed = 0;
            }
        }

        if (monthsElapsed <= 0) return purchasePrice;
        if (monthsElapsed >= cycle) return salvageValue;

        if ("DECLINING_BALANCE".equalsIgnoreCase(method)) {
            double r = rate / 100.0;
            double factor = Math.pow(1.0 - r, monthsElapsed);
            long val = Math.round(purchasePrice * factor);
            return Math.max(salvageValue, val);
        } else {
            // STRAIGHT_LINE or LICENSE_KEY
            double D = (double) purchasePrice / cycle;
            long val = Math.round(purchasePrice - monthsElapsed * D);
            return Math.max(salvageValue, val);
        }
    }

    private AssetInstanceResponse mapToAssetInstanceResponse(AssetInstance assetInstance) {
        Long dynamicNetBookValue = calculateCurrentNetBookValue(assetInstance);

        return AssetInstanceResponse.builder()
                .id(assetInstance.getId())
                .assetModelId(assetInstance.getAssetModel().getId())
                .assetModelName(assetInstance.getAssetModel().getName())
                .assetTypeName(assetInstance.getAssetModel().getAssetType().getName())
                .serial(assetInstance.getSerial())
                .specification(assetInstance.getSpecification())
                .status(assetInstance.getStatus())
                .purchaseDate(assetInstance.getPurchaseDate())
                .purchasePrice(assetInstance.getPurchasePrice())
                .depreciationMethod(assetInstance.getDepreciationMethod())
                .netBookValue(dynamicNetBookValue)
                .salvageValue(assetInstance.getSalvageValue())
                .depreciationRate(assetInstance.getDepreciationRate())
                .depreciationCycle(assetInstance.getDepreciationCycle())
                .adjustmentFactor(assetInstance.getAdjustmentFactor())
                .maintenanceCost(assetInstance.getMaintenanceCost())
                .warehouseId(assetInstance.getWarehouse() != null ? assetInstance.getWarehouse().getId() : null)
                .warehouseName(assetInstance.getWarehouse() != null ? assetInstance.getWarehouse().getName() : null)
                .build();
    }

    @Override
    public UnusedAssetsReportResponse getUnusedAssetsReport() {
        LocalDate threeMonthsAgo = LocalDate.now().minusMonths(3);
        LocalDateTime threeMonthsAgoDateTime = LocalDateTime.now().minusMonths(3);

        List<AssetInstance> unusedAssets = assetInstanceRepository.findUnusedAssets(threeMonthsAgo, threeMonthsAgoDateTime);

        long count = unusedAssets.size();
        long totalNetBookValue = 0;
        long totalPurchasePrice = 0;

        List<AssetInstanceResponse> responseList = new ArrayList<>();
        for (AssetInstance asset : unusedAssets) {
            Long dynamicNetBookValue = calculateCurrentNetBookValue(asset);
            long netVal = dynamicNetBookValue != null ? dynamicNetBookValue : 0L;
            long price = asset.getPurchasePrice() != null ? asset.getPurchasePrice() : 0L;
            totalNetBookValue += netVal;
            totalPurchasePrice += price;
            responseList.add(mapToAssetInstanceResponse(asset));
        }

        return UnusedAssetsReportResponse.builder()
                .count(count)
                .totalNetBookValue(totalNetBookValue)
                .totalPurchasePrice(totalPurchasePrice)
                .unusedAssets(responseList)
                .build();
    }

    @Override
    public AssetInstanceResponse getAssetInstanceBySerial(String serial) {
        AssetInstance assetInstance = assetInstanceRepository.findBySerial(serial)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy thiết bị với số serial: " + serial));
        return mapToAssetInstanceResponse(assetInstance);
    }
}
