package io.mixeway.mixewayflowapi.db.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@Entity
@RequiredArgsConstructor
@Table(name = "vulnerable_configurations")
public class VulnerableConfigurations {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private final long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vulnerability_id", nullable = false)
    private Vulnerability vulnerability;

    @Column(name = "criteria")
    private String criteria;

    @Column(name = "version_start_including")
    private String versionStartIncluding;

    @Column(name = "version_end_excluding")
    private String versionEndExcluding;

    public VulnerableConfigurations() {
        id=0;
    }
}
