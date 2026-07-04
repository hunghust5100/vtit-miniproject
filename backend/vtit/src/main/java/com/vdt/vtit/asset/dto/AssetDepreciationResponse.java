package com.vdt.vtit.asset.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class AssetDepreciationResponse {
    private Long assetInstanceId;
    private String serial;
    private String modelName;
    private String depreciationMethod;
    private Long purchasePrice;
    private LocalDate purchaseDate;
    private Integer depreciationCycleMonths;
    private Double depreciationRate;
    private Long currentNetBookValue;
    private Long accumulatedDepreciation;
    private Long salvageValue;
    private Integer monthsElapsed;
}
