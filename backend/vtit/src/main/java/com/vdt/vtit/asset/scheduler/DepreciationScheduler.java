package com.vdt.vtit.asset.scheduler;

import com.vdt.vtit.asset.entity.AssetInstance;
import com.vdt.vtit.asset.repository.AssetInstanceRepository;
import com.vdt.vtit.asset.service.DepreciationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DepreciationScheduler {

    private final AssetInstanceRepository assetInstanceRepository;
    private final DepreciationService depreciationService;

    // Chạy tự động lúc 00:00 hàng ngày
    @Scheduled(cron = "0 0 0 * * ?")
    public void updateAssetDepreciation() {
        log.info("Depreciation Engine: Bắt đầu tự động cập nhật khấu hao tài sản...");
        List<AssetInstance> instances = assetInstanceRepository.findAll();
        int updatedCount = 0;

        for (AssetInstance instance : instances) {
            try {
                if (instance.getPurchasePrice() == null || instance.getPurchasePrice() == 0L) {
                    continue;
                }
                if ("LIQUIDATED".equalsIgnoreCase(instance.getStatus())) {
                    continue;
                }

                var depResponse = depreciationService.calculateDepreciation(instance.getId(), LocalDate.now());
                instance.setNetBookValue(depResponse.getCurrentNetBookValue());
                assetInstanceRepository.save(instance);
                updatedCount++;
            } catch (Exception e) {
                log.error("Lỗi khi cập nhật khấu hao cho thiết bị ID: " + instance.getId(), e);
            }
        }
        log.info("Depreciation Engine: Hoàn thành cập nhật khấu hao cho {} thiết bị.", updatedCount);
    }
}
