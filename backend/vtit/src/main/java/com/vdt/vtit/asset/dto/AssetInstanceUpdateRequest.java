package com.vdt.vtit.asset.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.Map;

@Data
public class AssetInstanceUpdateRequest {
    private Long assetModelId;

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

    private Long maintenanceCost;

}
