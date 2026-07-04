package com.vdt.vtit.asset.service;

import com.vdt.vtit.asset.dto.AssetDepreciationResponse;
import com.vdt.vtit.asset.dto.DepreciationSchedulePoint;
import com.vdt.vtit.asset.dto.DepreciationAlertResponse;
import java.time.LocalDate;
import java.util.List;

public interface DepreciationService {
    AssetDepreciationResponse calculateDepreciation(Long instanceId, LocalDate targetDate);
    List<DepreciationSchedulePoint> getDepreciationSchedule(Long instanceId);
    List<DepreciationAlertResponse> getDepreciationAlerts();
}
