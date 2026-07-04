package com.vdt.vtit.asset.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class AssetModelResponse {
    private Long id;
    private String name;
    private String code;
    private String manufacturer;
    private Long assetTypeId;
    private String assetTypeName;
    private Map<String, Object> specification;
    private String depreciationMethod;
    private Double depreciationRate;
    private Integer depreciationCycle;
    private Double adjustmentFactor;
}
