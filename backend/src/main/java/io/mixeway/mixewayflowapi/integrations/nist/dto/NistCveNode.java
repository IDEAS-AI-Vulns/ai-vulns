package io.mixeway.mixewayflowapi.integrations.nist.dto;

import lombok.Data;

import java.util.List;

@Data
public class NistCveNode {
    private String operator;
    private boolean negate;
    private List<NistCveCpeMatch> cpeMatch;
}
