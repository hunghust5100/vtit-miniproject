package com.vdt.vtit.asset.service;


import com.vdt.vtit.asset.dto.AssetInstanceResponse;
import com.vdt.vtit.asset.dto.AssetModelCreateRequest;
import com.vdt.vtit.asset.dto.AssetModelResponse;
import com.vdt.vtit.asset.dto.AssetModelUpdateRequest;
import org.springframework.data.domain.Page;

import java.util.List;

public interface AssetModelService {

    AssetModelResponse createAssetModel(AssetModelCreateRequest request);

    AssetModelResponse getAssetModelById(Long id);

    List<AssetModelResponse> getAllAssetModel();

    Page<AssetModelResponse> getAllAssetModelPagination(int page, int size, String sortBy, String sortDir);

    AssetModelResponse updateAssetModel(Long id, AssetModelUpdateRequest request);

    Page<AssetInstanceResponse> getAssetInstanceOfModel(String status, Long assetModelId, int page, int size, String sortBy, String sortDir);

    void deleteAssetModel(Long id);
}
