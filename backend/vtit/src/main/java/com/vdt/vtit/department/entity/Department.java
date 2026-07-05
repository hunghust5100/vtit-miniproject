package com.vdt.vtit.department.entity;

import com.vdt.vtit.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "departments")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String category;

    private String description;

    private String location;

    private Long headManagerId;

    @OneToMany(
            mappedBy = "department",
            fetch = FetchType.LAZY
    )
    @Builder.Default
    private List<User> staffs = new ArrayList<>();
}
