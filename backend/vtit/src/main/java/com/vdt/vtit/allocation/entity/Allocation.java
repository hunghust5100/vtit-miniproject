package com.vdt.vtit.allocation.entity;

import com.vdt.vtit.asset.entity.AssetInstance;
import com.vdt.vtit.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "allocations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Allocation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "asset_instance_id",
            foreignKey = @ForeignKey(name = "FK_ASSET_INSTANCE"),
            nullable = false
    )
    private AssetInstance assetInstance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "staff_id",
            foreignKey = @ForeignKey(name = "FK_STAFF_ID"),
            nullable = false
    )
    private User staff;

    private LocalDateTime requestAt;

    private String status;

    private LocalDateTime actionAt;

    private LocalDateTime receivedAt;

    private LocalDate expectedReturnDate;

    private LocalDateTime returnedAt;

    @PrePersist
    protected void onCreate() {
        requestAt = LocalDateTime.now();
    }
}
