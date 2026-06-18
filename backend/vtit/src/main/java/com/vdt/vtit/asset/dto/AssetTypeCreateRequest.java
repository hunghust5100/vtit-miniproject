package com.vdt.vtit.asset.dto;

import lombok.Data;

@Data
public class AssetTypeCreateRequest {
    private String name;
    private String code;
    private String description;
}
