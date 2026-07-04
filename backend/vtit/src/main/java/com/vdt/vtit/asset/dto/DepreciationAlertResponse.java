package com.vdt.vtit.asset.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class DepreciationAlertResponse {
    private Long assetInstanceId;
    private String serial;
    private String modelName;
    private String status;
    private Long purchasePrice;
    private LocalDate purchaseDate;
    private Long netBookValue;
    private Long salvageValue;
    private Integer cycleMonths;
    private Integer monthsElapsed;
    private String alertType; // "FULLY_DEPRECIATED" or "UPGRADE_REQUIRED"
    private String message; 
}
