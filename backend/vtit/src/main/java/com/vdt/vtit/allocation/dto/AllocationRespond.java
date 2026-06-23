package com.vdt.vtit.allocation.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class AllocationRespond {
    private Long id;
    private Long assetModelId;
    private String assetModelName;
    private Long staffId;
    private String staffName;
    private Long assetInstanceId;
    private LocalDateTime requestAt;

    private LocalDateTime actionAt;
    private String status;
    private LocalDateTime receivedAt;

    private LocalDate expectedReturnDate;

    private LocalDateTime returnedAt;
}

