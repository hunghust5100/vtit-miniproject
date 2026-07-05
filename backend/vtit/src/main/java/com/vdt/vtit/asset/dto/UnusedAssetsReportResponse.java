package com.vdt.vtit.asset.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class UnusedAssetsReportResponse {
    private long count;
    private long totalNetBookValue;
    private long totalPurchasePrice;
    private List<AssetInstanceResponse> unusedAssets;
}
