package com.vdt.vtit.allocation.scheduler;

import com.vdt.vtit.allocation.service.AllocationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AllocationTimeoutScheduler {

    private final AllocationService allocationService;

    // Chạy mỗi 1 phút
    @Scheduled(cron = "0 */1 * * * ?")
    public void checkExpiredAllocations() {
        log.info("Allocation Timeout Scheduler: Bắt đầu quét các yêu cầu mượn hết hạn...");
        try {
            allocationService.releaseExpiredAllocations();
            log.info("Allocation Timeout Scheduler: Hoàn thành quét các yêu cầu mượn hết hạn.");
        } catch (Exception e) {
            log.error("Allocation Timeout Scheduler: Gặp lỗi khi giải phóng yêu cầu quá hạn", e);
        }
    }
}
