package com.vdt.vtit.asset.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.Map;

@Data
@Builder
public class AssetInstanceResponse {
    private Long id;

    private Long assetModelId;

    private String assetModelName;

    private String assetTypeName;

    private String serial;

    private Map<String, Object> specification;

    private String status;

    private LocalDate purchaseDate;

    private Long purchasePrice;

    private String depreciationMethod;

    private Long netBookValue;

    private Long salvageValue;

    private Double depreciationRate;

    private Integer depreciationCycle;

    private Double adjustmentFactor;
}
