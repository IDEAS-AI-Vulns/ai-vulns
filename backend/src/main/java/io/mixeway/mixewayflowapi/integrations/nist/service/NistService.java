package io.mixeway.mixewayflowapi.integrations.nist.service;

import io.mixeway.mixewayflowapi.domain.vulnerability.FindVulnerabilityService;
import io.mixeway.mixewayflowapi.integrations.nist.controller.NistWebClient;
import io.mixeway.mixewayflowapi.integrations.nist.dto.NistCveDTO;
import io.mixeway.mixewayflowapi.integrations.nist.dto.NistCveResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

@Service
@Log4j2
@RequiredArgsConstructor
public class NistService {

    private final FindVulnerabilityService findVulnerabilityService;

    private final NistWebClient nistWebClient;

    public NistCveDTO getNistDataForVulnerabilityByName(String vulnerabilityName) {

        if (vulnerabilityName == null) {
            log.error("Vulnerability name name cannot be null");
            return null;
        }

        return fetchNistData(vulnerabilityName);
    }

    private NistCveDTO fetchNistData(String vulnerabilityName) {

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

        return nistCveResponseDTO.getVulnerabilities()
                .stream()
                .filter(v -> v.getCve().getId().equals(vulnerabilityName))
                .toList()
                .getFirst()
                .getCve();
    }

}
