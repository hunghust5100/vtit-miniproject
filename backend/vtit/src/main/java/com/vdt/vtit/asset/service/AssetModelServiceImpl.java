package com.vdt.vtit.asset.service;

import com.vdt.vtit.asset.dto.AssetModelCreateRequest;
import com.vdt.vtit.asset.dto.AssetModelResponse;
import com.vdt.vtit.asset.dto.AssetModelUpdateRequest;
import com.vdt.vtit.asset.entity.AssetModel;
import com.vdt.vtit.asset.entity.AssetType;
import com.vdt.vtit.asset.repository.AssetModelRepository;
import com.vdt.vtit.asset.repository.AssetTypeRepository;
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
public class AssetModelServiceImpl implements AssetModelService{
    private final AssetModelRepository assetModelRepository;
    private final AssetTypeRepository assetTypeRepository;

    @Override
    public AssetModelResponse createAssetModel(AssetModelCreateRequest request) {
        AssetType assetType = assetTypeRepository.findById(request.getAssetTypeId())
                .orElseThrow(() -> new BadRequestException("Không tìm thấy loại thiết bị"));

        AssetModel assetModel = AssetModel.builder()
                .name(request.getName())
                .code(request.getCode())
                .assetType(assetType)
                .manufacturer(request.getManufacturer())
                .specification(request.getSpecification())
                .build();

        return mapToAssetModelResponse(assetModelRepository.save(assetModel));
    }

    @Override
    public AssetModelResponse getAssetModelById(Long id) {
        AssetModel assetModel = assetModelRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy loại model"));
        return mapToAssetModelResponse(assetModel);
    }

    @Override
    public List<AssetModelResponse> getAllAssetModel() {
        return assetModelRepository.findAll()
                .stream()
                .map(this::mapToAssetModelResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<AssetModelResponse> getAllAssetModelPagination(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) ?
                Sort.by(sortBy).ascending() :
                Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<AssetModel> assetModelPage = assetModelRepository.findAll(pageable);

        return assetModelPage.map(this::mapToAssetModelResponse);
    }

    @Override
    public AssetModelResponse updateAssetModel(Long id, AssetModelUpdateRequest request) {
        AssetModel assetModel = assetModelRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy loại model"));

        AssetType assetType = assetTypeRepository.findById(request.getAssetTypeId())
                .orElseThrow(() -> new BadRequestException("Không tìm thấy loại thiết bị"));

        assetModel.setName(request.getName());
        assetModel.setCode(request.getCode());
        assetModel.setAssetType(assetType);
        assetModel.setManufacturer(request.getManufacturer());
        assetModel.setSpecification(request.getSpecification());

        return mapToAssetModelResponse(assetModelRepository.save(assetModel));
    }

    @Override
    public void deleteAssetModel(Long id) {
        AssetModel assetModel = assetModelRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy loại model"));

        assetModelRepository.deleteById(id);
    }

    private AssetModelResponse mapToAssetModelResponse(AssetModel assetModel) {
        return AssetModelResponse.builder()
                .id(assetModel.getId())
                .name(assetModel.getName())
                .code(assetModel.getCode())
                .assetTypeId(assetModel.getAssetType().getId())
                .assetTypeName(assetModel.getAssetType().getName())
                .manufacturer(assetModel.getManufacturer())
                .specification(assetModel.getSpecification())
                .build();
    }
}
