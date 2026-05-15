package io.mixeway.mixewayflowapi.modules.downloader.api.gateway;

import io.mixeway.mixewayflowapi.api.constraint.service.ConstraintService;
import io.mixeway.mixewayflowapi.db.entity.Constraint;
import io.mixeway.mixewayflowapi.db.entity.Finding;
import io.mixeway.mixewayflowapi.db.entity.Vulnerability;
import io.mixeway.mixewayflowapi.db.entity.VulnerableConfigurations;
import io.mixeway.mixewayflowapi.domain.vulnerability.GetOrCreateVulnerabilityService;
import io.mixeway.mixewayflowapi.domain.vulnerability.UpdateVulnerabilityService;
import io.mixeway.mixewayflowapi.domain.vulnerableconfiguration.VulnerableConfigurationsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@RequiredArgsConstructor
@Log4j2
@Service
public class DownloaderRavenGateway {

    private final GetOrCreateVulnerabilityService getOrCreateVulnerabilityService;
    private final UpdateVulnerabilityService updateVulnerabilityService;
    private final ConstraintService constraintService;
    private final VulnerableConfigurationsService vulnerableConfigurationsService;

    public Vulnerability getOrCreateVulnerability(String key, String attackComplexity, String ref, String recommendation, Finding.Severity severity, BigDecimal epss, BigDecimal epssPercentile, Boolean exploitExists) {
        return getOrCreateVulnerabilityService.getOrCreate(
                key,
                attackComplexity,
                ref,
                recommendation,
                severity,
                epss,
                epssPercentile,
                exploitExists
        );
    }

    public Constraint createConstraint(Vulnerability vulnerability, String c) {
        return constraintService.createConstraint(vulnerability, c);
    }

    public void updateVulnerability(Vulnerability vulnerability) {
        updateVulnerabilityService.updateVulnerability(vulnerability);
    }

    public VulnerableConfigurations getOrCreateVulnerableConfigurations(String criteria, String versionStartIncluding, String versionStartExcluding, String versionEndIncluding, String versionEndExcluding) {
        return vulnerableConfigurationsService.getOrCreateVulnerableConfigurations(
                criteria,
                versionStartIncluding,
                versionStartExcluding,
                versionEndIncluding,
                versionEndExcluding);
    }
}
