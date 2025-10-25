package io.mixeway.mixewayflowapi.integrations.nist.dto;

import lombok.Data;

@Data
public class NistCveCvssData {
    private String version;
    private String vectorString;
    private float baseScore;
    private String baseSeverity;
    private String attackVector;
    private String attackComplexity;
    private String privilegesRequired;
    private String userInteraction;
    private String scope;
    private String confidentialityImpact;
    private String integrityImpact;
    private String availabilityImpact;
}
