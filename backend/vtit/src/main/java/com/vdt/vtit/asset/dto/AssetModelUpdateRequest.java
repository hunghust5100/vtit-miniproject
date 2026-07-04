package com.vdt.vtit.asset.dto;

import lombok.Data;

import java.util.Map;

@Data
public class AssetModelUpdateRequest {
    private String name;
    private String code;
    private String manufacturer;
    private Long assetTypeId;
    private Map<String, Object> specification;
    private String depreciationMethod;
    private Double depreciationRate;
    private Integer depreciationCycle;
    private Double adjustmentFactor;
}
