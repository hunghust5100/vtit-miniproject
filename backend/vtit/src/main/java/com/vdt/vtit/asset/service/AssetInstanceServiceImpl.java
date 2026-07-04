package com.vdt.vtit.asset.service;

import com.vdt.vtit.asset.dto.AssetInstanceCreateRequest;
import com.vdt.vtit.asset.dto.AssetInstanceResponse;
import com.vdt.vtit.asset.dto.AssetInstanceUpdateRequest;
import com.vdt.vtit.asset.entity.AssetInstance;
import com.vdt.vtit.asset.entity.AssetModel;
import com.vdt.vtit.asset.repository.AssetInstanceRepository;
import com.vdt.vtit.asset.repository.AssetModelRepository;
import com.vdt.vtit.common.exception.BadRequestException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AssetInstanceServiceImpl implements AssetInstanceService {
    private final AssetInstanceRepository assetInstanceRepository;
    private final AssetModelRepository assetModelRepository;

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

        return mapToAssetInstanceResponse(assetInstanceRepository.save(assetInstance));
    }

    @Override
    public void deleteAssetInstanceById(Long id) {
        AssetInstance assetInstance = assetInstanceRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy thiết bị"));

        assetInstanceRepository.delete(assetInstance);
    }

    private AssetInstanceResponse mapToAssetInstanceResponse(AssetInstance assetInstance) {
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
                .netBookValue(assetInstance.getNetBookValue())
                .salvageValue(assetInstance.getSalvageValue())
                .depreciationRate(assetInstance.getDepreciationRate())
                .depreciationCycle(assetInstance.getDepreciationCycle())
                .adjustmentFactor(assetInstance.getAdjustmentFactor())
                .build();
    }
}
