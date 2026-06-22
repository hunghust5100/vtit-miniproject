package com.vdt.vtit.allocation.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class AssignmentHistoryUpdateRequest {
    private Long AssetInstanceId;
    private LocalDateTime assignedAt;
    private LocalDateTime receivedAt;
    private LocalDate expectedReturnDate;
    private LocalDateTime returnedAt;
}
