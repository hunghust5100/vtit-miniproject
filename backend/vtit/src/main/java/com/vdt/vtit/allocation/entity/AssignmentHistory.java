package com.vdt.vtit.allocation.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "assignment_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long AssetModelId;

    @Column(nullable = false)
    private Long StaffId;

    private Long AssetInstanceId;

    private LocalDateTime requestAt;

    private LocalDateTime assignedAt;

    private LocalDateTime receivedAt;

    private LocalDate expectedReturnDate;

    private LocalDateTime returnedAt;

    @PrePersist
    protected void onCreate() {
        receivedAt = LocalDateTime.now();
    }
}
