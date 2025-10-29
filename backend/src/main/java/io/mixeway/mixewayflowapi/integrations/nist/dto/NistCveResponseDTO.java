package io.mixeway.mixewayflowapi.integrations.nist.dto;

import lombok.Data;

import java.util.List;

@Data
public class NistCveResponseDTO {

    private int resultsPerPage;
    private int startIndex;
    private int totalResults;
    private String format;
    private String version;
    private List<NistVulnerabilityDTO> vulnerabilities;
}
