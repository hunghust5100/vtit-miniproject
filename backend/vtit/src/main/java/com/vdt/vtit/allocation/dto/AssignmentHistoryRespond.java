package com.vdt.vtit.allocation.dto;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class AssignmentHistoryRespond {
    private Long id;
    private Long AssetModelId;
    private Long AssetModelName;
    private Long StaffId;
    private Long AssetInstanceId;
    private LocalDateTime requestAt;

    private LocalDateTime assignedAt;

    private LocalDateTime receivedAt;

    private LocalDate expectedReturnDate;

    private LocalDateTime returnedAt;
}

