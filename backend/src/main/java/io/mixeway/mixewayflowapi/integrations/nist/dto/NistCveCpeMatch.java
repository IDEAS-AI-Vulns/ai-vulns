package io.mixeway.mixewayflowapi.integrations.nist.dto;

import lombok.Data;

@Data
public class NistCveCpeMatch {
    private boolean vulnerable;
    private String criteria;
    private String versionEndExcluding;
    private String matchCriteriaId;
}
