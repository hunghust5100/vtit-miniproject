package com.vdt.vtit.warehouse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetInWarehouseResponse {
    private Long id;
    private String serial;
    private String modelName;
    private String typeName;
    private String status;         // AssetInstance.status (AVAILABLE, PENDING, USING, etc.)
    private String exportStatus;   // "Trong kho" | "Chờ duyệt xuất kho" | "Đang chờ bàn giao" | "Đã xuất kho"
    private String allocatedToStaff; // Name of staff if currently allocated
    private LocalDate purchaseDate;
    private Long purchasePrice;
}
