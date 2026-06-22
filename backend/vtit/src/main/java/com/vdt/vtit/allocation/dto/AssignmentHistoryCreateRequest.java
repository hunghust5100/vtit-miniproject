package com.vdt.vtit.allocation.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class AssignmentHistoryCreateRequest {
    private Long AssetModelId;
    private Long StaffId;
    private Long AssetInstanceId;
}
