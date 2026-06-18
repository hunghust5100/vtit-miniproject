package com.vdt.vtit.asset.dto;

import lombok.Data;

@Data
public class AssetTypeUpdateRequest {
    private String name;
    private String code;
    private String description;
}
