package com.vdt.vtit.allocation.dto;

import lombok.Data;

@Data
public class AllocationCreateRequest {
    private Long assetModelId;
    private Long staffId;
}
