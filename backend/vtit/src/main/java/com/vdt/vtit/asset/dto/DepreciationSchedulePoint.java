package com.vdt.vtit.asset.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class DepreciationSchedulePoint {
    private Integer monthIndex;
    private LocalDate date;
    private Long netBookValue;
    private Long monthlyDepreciation;
    private Long accumulatedDepreciation;
}
