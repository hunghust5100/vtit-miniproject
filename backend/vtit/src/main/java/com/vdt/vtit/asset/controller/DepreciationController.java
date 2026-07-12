package com.vdt.vtit.asset.controller;

import com.vdt.vtit.asset.dto.AssetDepreciationResponse;
import com.vdt.vtit.asset.dto.DepreciationSchedulePoint;
import com.vdt.vtit.asset.dto.DepreciationAlertResponse;
import com.vdt.vtit.asset.service.DepreciationService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/assets/depreciation")
@PreAuthorize("hasRole('MANAGER')")
public class DepreciationController {

    private final DepreciationService depreciationService;

    @GetMapping("/{instanceId}/current")
    public ResponseEntity<AssetDepreciationResponse> getCurrentDepreciation(
            @PathVariable Long instanceId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(depreciationService.calculateDepreciation(instanceId, targetDate));
    }

    @GetMapping("/{instanceId}/schedule")
    public ResponseEntity<List<DepreciationSchedulePoint>> getDepreciationSchedule(
            @PathVariable Long instanceId
    ) {
        return ResponseEntity.ok(depreciationService.getDepreciationSchedule(instanceId));
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<DepreciationAlertResponse>> getDepreciationAlerts() {
        return ResponseEntity.ok(depreciationService.getDepreciationAlerts());
    }
}
