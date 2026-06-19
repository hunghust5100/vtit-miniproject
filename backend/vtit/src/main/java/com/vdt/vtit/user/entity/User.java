package com.vdt.vtit.user.entity;

import com.vdt.vtit.department.entity.Department;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String role;

    private String phoneNumber;

    private LocalDate birthday;

    private LocalDateTime createdAt;

    private boolean enabled;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "department_id",
            nullable = true,
            foreignKey = @ForeignKey(name = "FK_DEPARTMENT")
    )
    private Department department;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
