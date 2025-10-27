package io.mixeway.mixewayflowapi.integrations.nist.dto;

import lombok.Data;

@Data
public class NistCveCvssMetricV31 {
    private String source;
    private String type;
    private NistCveCvssData cvssData;
    private String exploitabilityScore;
    private String impactScore;
}
