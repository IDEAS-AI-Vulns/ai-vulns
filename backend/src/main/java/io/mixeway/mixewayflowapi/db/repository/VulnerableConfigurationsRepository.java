package io.mixeway.mixewayflowapi.db.repository;

import io.mixeway.mixewayflowapi.db.entity.VulnerableConfigurations;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VulnerableConfigurationsRepository extends JpaRepository<VulnerableConfigurations, Long> {
}
