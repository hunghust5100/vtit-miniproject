package com.vdt.vtit.asset.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.util.Map;

@Entity
@Table(name = "asset_instances")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssetInstance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name= "asset_model_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "FK_ASSET_MODEL")
    )
    private AssetModel assetModel;

    @Column(nullable = false, unique = true)
    private String serial;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> specification;

    private String status;

    private LocalDate purchaseDate;

    private Long purchasePrice;

    private String depreciationMethod;

    private Long netBookValue;

    private Long salvageValue;

    @Version
    private Long version;
}
