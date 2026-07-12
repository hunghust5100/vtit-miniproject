package com.vdt.vtit.warehouse.entity;

import com.vdt.vtit.asset.entity.AssetInstance;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "warehouses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Warehouse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String code;

    private String location;

    private String description;

    @OneToMany(
            mappedBy = "warehouse",
            cascade = {CascadeType.PERSIST, CascadeType.MERGE},
            fetch = FetchType.LAZY
    )
    @Builder.Default
    private List<AssetInstance> assetInstances = new ArrayList<>();
}
