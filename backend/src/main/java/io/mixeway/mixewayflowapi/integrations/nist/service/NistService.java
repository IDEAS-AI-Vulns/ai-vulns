package io.mixeway.mixewayflowapi.integrations.nist.service;

import io.mixeway.mixewayflowapi.api.vulnerabilities.dto.VulnerabilityDto;
import io.mixeway.mixewayflowapi.db.entity.Vulnerability;
import io.mixeway.mixewayflowapi.domain.vulnerability.FindVulnerabilityService;
import io.mixeway.mixewayflowapi.domain.vulnerability.UpdateVulnerabilityService;
import io.mixeway.mixewayflowapi.domain.vulnerability.mapper.VulnerabilityMapper;
import io.mixeway.mixewayflowapi.integrations.nist.controller.NistWebClient;
import io.mixeway.mixewayflowapi.integrations.nist.dto.NistCveDTO;
import io.mixeway.mixewayflowapi.integrations.nist.dto.NistCveResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@Log4j2
@RequiredArgsConstructor
public class NistService {

    private final FindVulnerabilityService findVulnerabilityService;
    private final UpdateVulnerabilityService updateVulnerabilityService;
    private final VulnerabilityMapper vulnerabilityMapper;

    private final NistWebClient nistWebClient;

    public VulnerabilityDto updateVulnerabilityWithNistData(String vulnerabilityName) {
        Vulnerability vulnerability = findVulnerabilityService.getByName(vulnerabilityName).orElse(null);

        if (vulnerability == null) {
            log.debug("Vulnerability with name {} not found", vulnerabilityName);
            return null;
        }

        return updateVulnerability(vulnerability);
    }

    public List<VulnerabilityDto> updateAllVulnerabilitiesWithNistData() {
        List<Vulnerability> vulnerabilities = findVulnerabilityService. getAll()
                                                                        .stream()
                                                                        .filter(v -> v.getName().startsWith("CVE"))
                                                                        .toList();
        List<VulnerabilityDto> vulnerabilityDtos = new ArrayList<>();

        for(Vulnerability vulnerability: vulnerabilities) {
            log.debug("Updating vulnerability id: {}", vulnerability.getId());

            VulnerabilityDto updatedVulnerability = updateVulnerability(vulnerability);

            if (updatedVulnerability != null)
                vulnerabilityDtos.add(updatedVulnerability);
        }

        return vulnerabilityDtos;
    }

    private VulnerabilityDto updateVulnerability(Vulnerability vulnerability) {
        String vulnerabilityName = vulnerability.getName();

        if(vulnerability.getUpdatedDate() != null && vulnerability.getUpdatedDate().toLocalDate().isEqual(LocalDate.now())) {
            log.debug("Vulnerability {} has already been updated today, skipping..", vulnerability.getId());
            return vulnerabilityMapper.toDto(vulnerability);
        }

        NistCveResponseDTO nistCveResponseDTO = nistWebClient.getCveDetails(vulnerabilityName);
        if (nistCveResponseDTO == null) {
            int retryCnt = 0;
            while (retryCnt < 5 && nistCveResponseDTO == null) {
                nistCveResponseDTO = nistWebClient.getCveDetails(vulnerabilityName);
                retryCnt = retryCnt + 1;
            }

            if (nistCveResponseDTO == null) {
                log.debug("Vulnerability with name {} not found in NIST database", vulnerabilityName);
                return null;
            }
        }

        NistCveDTO nistCveDTO = nistCveResponseDTO.getVulnerabilities()
                .stream()
                .filter(v -> v.getCve().getId().equals(vulnerabilityName))
                .toList()
                .getFirst()
                .getCve();

        updateVulnerabilityService.updateVulnerabilityWithNistData(vulnerability, nistCveDTO);

        return vulnerabilityMapper.toDto(vulnerability);
    }
}
