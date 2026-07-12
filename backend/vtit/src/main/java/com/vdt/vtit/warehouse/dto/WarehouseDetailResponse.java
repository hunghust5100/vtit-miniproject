package com.vdt.vtit.warehouse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseDetailResponse {
    private Long id;
    private String name;
    private String code;
    private String location;
    private String description;
    private List<AssetInWarehouseResponse> assets;
}
