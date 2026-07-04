package com.vdt.vtit.asset.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "asset_models")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssetModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "asset_type_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "FK_MODEL_TYPE")
    )
    private AssetType assetType;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String code;

    private String manufacturer;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> specification;

    private String depreciationMethod;

    private Double depreciationRate;

    private Integer depreciationCycle;

    private Double adjustmentFactor;

    @OneToMany(
            mappedBy = "assetModel",
            cascade = CascadeType.ALL,
            fetch = FetchType.LAZY
    )
    @Builder.Default
    private List<AssetInstance> instances = new ArrayList<>();
}
