package com.vdt.vtit.asset.service;

import com.vdt.vtit.asset.dto.AssetDepreciationResponse;
import com.vdt.vtit.asset.dto.DepreciationSchedulePoint;
import com.vdt.vtit.asset.dto.DepreciationAlertResponse;
import com.vdt.vtit.asset.entity.AssetInstance;
import com.vdt.vtit.asset.repository.AssetInstanceRepository;
import com.vdt.vtit.common.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DepreciationServiceImpl implements DepreciationService {

    private final AssetInstanceRepository assetInstanceRepository;

    @Override
    public AssetDepreciationResponse calculateDepreciation(Long instanceId, LocalDate targetDate) {
        AssetInstance instance = assetInstanceRepository.findById(instanceId)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy thiết bị với ID: " + instanceId));

        LocalDate purchaseDate = instance.getPurchaseDate() != null ? instance.getPurchaseDate() : LocalDate.now();
        Long purchasePrice = instance.getPurchasePrice() != null ? instance.getPurchasePrice() : 0L;
        String method = instance.getDepreciationMethod() != null ? instance.getDepreciationMethod() : "STRAIGHT_LINE";
        Integer cycle = instance.getDepreciationCycle() != null ? instance.getDepreciationCycle() : 12;
        if (cycle <= 0) cycle = 12;
        Double rate = instance.getDepreciationRate() != null ? instance.getDepreciationRate() : 0.0;
        
        // Salvage value
        Long salvageValue = instance.getSalvageValue() != null ? instance.getSalvageValue() : 0L;
        if ("LICENSE_KEY".equalsIgnoreCase(method)) {
            salvageValue = 0L;
        }

        // Calculate months elapsed
        int monthsElapsed = 0;
        if (targetDate.isAfter(purchaseDate)) {
            monthsElapsed = (int) ChronoUnit.MONTHS.between(
                    purchaseDate.withDayOfMonth(1), 
                    targetDate.withDayOfMonth(1)
            );
            if (monthsElapsed < 0) {
                monthsElapsed = 0;
            }
        }

        long currentNetBookValue = calculateNetBookValue(purchasePrice, salvageValue, cycle, rate, method, monthsElapsed);
        long accumulatedDepreciation = purchasePrice - currentNetBookValue;

        return AssetDepreciationResponse.builder()
                .assetInstanceId(instance.getId())
                .serial(instance.getSerial())
                .modelName(instance.getAssetModel().getName())
                .depreciationMethod(method)
                .purchasePrice(purchasePrice)
                .purchaseDate(purchaseDate)
                .depreciationCycleMonths(cycle)
                .depreciationRate(rate)
                .currentNetBookValue(currentNetBookValue)
                .accumulatedDepreciation(accumulatedDepreciation)
                .salvageValue(salvageValue)
                .monthsElapsed(monthsElapsed)
                .build();
    }

    @Override
    public List<DepreciationSchedulePoint> getDepreciationSchedule(Long instanceId) {
        AssetInstance instance = assetInstanceRepository.findById(instanceId)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy thiết bị với ID: " + instanceId));

        LocalDate purchaseDate = instance.getPurchaseDate() != null ? instance.getPurchaseDate() : LocalDate.now();
        Long purchasePrice = instance.getPurchasePrice() != null ? instance.getPurchasePrice() : 0L;
        String method = instance.getDepreciationMethod() != null ? instance.getDepreciationMethod() : "STRAIGHT_LINE";
        Integer cycle = instance.getDepreciationCycle() != null ? instance.getDepreciationCycle() : 12;
        if (cycle <= 0) cycle = 12;
        Double rate = instance.getDepreciationRate() != null ? instance.getDepreciationRate() : 0.0;
        
        Long salvageValue = instance.getSalvageValue() != null ? instance.getSalvageValue() : 0L;
        if ("LICENSE_KEY".equalsIgnoreCase(method)) {
            salvageValue = 0L;
        }

        List<DepreciationSchedulePoint> schedule = new ArrayList<>();
        long previousNetBookValue = purchasePrice;

        for (int i = 0; i <= cycle; i++) {
            long netValue = calculateNetBookValue(purchasePrice, salvageValue, cycle, rate, method, i);
            long monthlyDep = (i == 0) ? 0L : (previousNetBookValue - netValue);
            long accumDep = purchasePrice - netValue;

            schedule.add(DepreciationSchedulePoint.builder()
                    .monthIndex(i)
                    .date(purchaseDate.plusMonths(i))
                    .netBookValue(netValue)
                    .monthlyDepreciation(monthlyDep)
                    .accumulatedDepreciation(accumDep)
                    .build());

            previousNetBookValue = netValue;
        }

        return schedule;
    }

    @Override
    public List<DepreciationAlertResponse> getDepreciationAlerts() {
        List<AssetInstance> instances = assetInstanceRepository.findAll();
        List<DepreciationAlertResponse> alerts = new ArrayList<>();

        for (AssetInstance instance : instances) {
            if ("LIQUIDATED".equalsIgnoreCase(instance.getStatus())) {
                continue;
            }
            if (instance.getPurchasePrice() == null || instance.getPurchasePrice() == 0L) {
                continue;
            }

            try {
                AssetDepreciationResponse dep = calculateDepreciation(instance.getId(), LocalDate.now());
                
                if (dep.getCurrentNetBookValue() <= dep.getSalvageValue() || dep.getMonthsElapsed() >= dep.getDepreciationCycleMonths()) {
                    alerts.add(DepreciationAlertResponse.builder()
                            .assetInstanceId(instance.getId())
                            .serial(instance.getSerial())
                            .modelName(instance.getAssetModel().getName())
                            .status(instance.getStatus())
                            .purchasePrice(instance.getPurchasePrice())
                            .purchaseDate(instance.getPurchaseDate())
                            .netBookValue(dep.getCurrentNetBookValue())
                            .salvageValue(dep.getSalvageValue())
                            .cycleMonths(dep.getDepreciationCycleMonths())
                            .monthsElapsed(dep.getMonthsElapsed())
                            .alertType("FULLY_DEPRECIATED")
                            .message("Thiết bị đã khấu hao hết toàn bộ giá trị sử dụng.")
                            .build());
                } else if (dep.getMonthsElapsed() >= dep.getDepreciationCycleMonths() * 0.8) {
                    alerts.add(DepreciationAlertResponse.builder()
                            .assetInstanceId(instance.getId())
                            .serial(instance.getSerial())
                            .modelName(instance.getAssetModel().getName())
                            .status(instance.getStatus())
                            .purchasePrice(instance.getPurchasePrice())
                            .purchaseDate(instance.getPurchaseDate())
                            .netBookValue(dep.getCurrentNetBookValue())
                            .salvageValue(dep.getSalvageValue())
                            .cycleMonths(dep.getDepreciationCycleMonths())
                            .monthsElapsed(dep.getMonthsElapsed())
                            .alertType("UPGRADE_REQUIRED")
                            .message("Thiết bị đã sử dụng được " + dep.getMonthsElapsed() + " / " + dep.getDepreciationCycleMonths() + " tháng (đạt " + Math.round((double)dep.getMonthsElapsed() / dep.getDepreciationCycleMonths() * 100) + "%). Cần bảo dưỡng hoặc nâng cấp định kỳ.")
                            .build());
                }
            } catch (Exception e) {
                // Ignore instances that fail calculation (e.g. invalid date formats) and log it
            }
        }

        return alerts;
    }

    private long calculateNetBookValue(Long cost, Long salvage, Integer cycle, Double ratePercent, String method, int t) {
        if (t <= 0) return cost;
        if (t >= cycle) return salvage;

        if ("DECLINING_BALANCE".equalsIgnoreCase(method)) {
            double r = ratePercent / 100.0;
            double factor = Math.pow(1.0 - r, t);
            long val = Math.round(cost * factor);
            return Math.max(salvage, val);
        } else {
            // STRAIGHT_LINE or LICENSE_KEY
            double D = (double) cost / cycle;
            long val = Math.round(cost - t * D);
            return Math.max(salvage, val);
        }
    }
}
