package com.vdt.vtit.asset.service;

import com.vdt.vtit.asset.dto.AssetTypeCreateRequest;
import com.vdt.vtit.asset.dto.AssetTypeResponse;
import com.vdt.vtit.asset.dto.AssetTypeUpdateRequest;
import com.vdt.vtit.asset.entity.AssetType;
import com.vdt.vtit.asset.repository.AssetTypeRepository;
import com.vdt.vtit.common.exception.ResourceNotFoundException;
import com.vdt.vtit.user.entity.User;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collector;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AssetTypeServiceImpl implements AssetTypeService{

    private final AssetTypeRepository assetTypeRepository;

    @Override
    public AssetTypeResponse createAssetType(AssetTypeCreateRequest request) {
        AssetType assetType = AssetType.builder()
                .name(request.getName())
                .code(request.getCode())
                .description(request.getDescription())
                .build();
        AssetType saveAssetType = assetTypeRepository.save(assetType);
        return mapToAssetTypeResponse(saveAssetType);
    }

    @Override
    public AssetTypeResponse getAssetTypeById(Long id) {
        AssetType assetType = assetTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy loại tài nguyên"));
        return mapToAssetTypeResponse(assetType);
    }

    @Override
    public List<AssetTypeResponse> getAllAssetType() {

        return assetTypeRepository.findAll().stream()
                .map(this::mapToAssetTypeResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<AssetTypeResponse> getAssetTypeWithPagination(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) ?
                Sort.by(sortBy).ascending() :
                Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<AssetType> assetTypePage = assetTypeRepository.findAll(pageable);
        return assetTypePage.map(this::mapToAssetTypeResponse);
    }

    @Override
    public AssetTypeResponse updateAssetType(Long id, AssetTypeUpdateRequest request) {
        AssetType assetType = assetTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy loại tài nguyên"));

        assetType.setCode(request.getCode());
        assetType.setName(request.getName());
        assetType.setDescription(request.getDescription());

        AssetType update = assetTypeRepository.save(assetType);
        return mapToAssetTypeResponse(update);
    }

    @Override
    public void deleteAssetType(Long id) {
        AssetType assetType = assetTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy loại tài nguyên"));

        assetTypeRepository.deleteById(id);
    }

    private AssetTypeResponse mapToAssetTypeResponse(AssetType assetType) {
        return AssetTypeResponse.builder()
                .id(assetType.getId())
                .code(assetType.getCode())
                .name(assetType.getName())
                .description(assetType.getDescription())
                .build();
    }
}
