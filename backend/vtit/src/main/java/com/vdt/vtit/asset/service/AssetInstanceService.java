package com.vdt.vtit.asset.service;


import com.vdt.vtit.asset.dto.AssetInstanceCreateRequest;
import com.vdt.vtit.asset.dto.AssetInstanceResponse;
import com.vdt.vtit.asset.dto.AssetInstanceUpdateRequest;
import com.vdt.vtit.asset.dto.UnusedAssetsReportResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface AssetInstanceService {

    AssetInstanceResponse createAssetInstance(AssetInstanceCreateRequest request);

    AssetInstanceResponse getAssetInstanceById(Long id);

    List<AssetInstanceResponse> getAllAssetInstance();

    Page<AssetInstanceResponse> getAllAssetInstancePagination(int page, int size, String sortBy, String sortDir);

    AssetInstanceResponse updateAssetInstanceById(Long id, AssetInstanceUpdateRequest request);

    void deleteAssetInstanceById(Long id);

    UnusedAssetsReportResponse getUnusedAssetsReport();
}
