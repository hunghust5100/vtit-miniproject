package com.vdt.vtit.asset.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AssetTypeResponse {
    private Long id;
    private String name;
    private String code;
    private String description;
}
