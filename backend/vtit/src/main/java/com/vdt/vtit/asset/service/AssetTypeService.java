package com.vdt.vtit.asset.service;

import com.vdt.vtit.asset.dto.AssetTypeCreateRequest;
import com.vdt.vtit.asset.dto.AssetTypeResponse;
import com.vdt.vtit.asset.dto.AssetTypeUpdateRequest;
import org.springframework.data.domain.Page;

import java.util.List;

public interface AssetTypeService {

    AssetTypeResponse createAssetType(AssetTypeCreateRequest request);

    AssetTypeResponse getAssetTypeById(Long id);

    List<AssetTypeResponse> getAllAssetType();

    Page<AssetTypeResponse> getAssetTypeWithPagination(int page, int size, String sortBy, String sortDir);

    AssetTypeResponse updateAssetType(Long id, AssetTypeUpdateRequest request);

    void deleteAssetType(Long id);
}
