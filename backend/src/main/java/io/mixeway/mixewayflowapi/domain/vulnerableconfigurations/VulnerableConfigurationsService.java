package io.mixeway.mixewayflowapi.domain.vulnerableconfigurations;

import io.mixeway.mixewayflowapi.db.entity.Vulnerability;
import io.mixeway.mixewayflowapi.db.entity.VulnerableConfigurations;
import io.mixeway.mixewayflowapi.db.repository.VulnerableConfigurationsRepository;
import io.mixeway.mixewayflowapi.integrations.nist.dto.NistCveCpeMatch;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class VulnerableConfigurationsService {

    private final VulnerableConfigurationsRepository vulnerableConfigurationsRepository;

    public VulnerableConfigurations createVulnerableConfigurationsForVulnerability(NistCveCpeMatch cpeMatch, Vulnerability vulnerability) {
        VulnerableConfigurations vulnerableConfiguration = new VulnerableConfigurations();
        vulnerableConfiguration.setVulnerability(vulnerability);
        vulnerableConfiguration.setCriteria(cpeMatch.getCriteria());
        vulnerableConfiguration.setVersionEndExcluding(cpeMatch.getVersionEndExcluding());

        vulnerableConfigurationsRepository.save(vulnerableConfiguration);

        return vulnerableConfiguration;
    }
}
