package com.vdt.vtit.asset.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.Map;

@Data
public class AssetInstanceCreateRequest {
    private Long assetModelId;

    private String serial;

    private LocalDate purchaseDate;

    private Long purchasePrice;

}
