package io.mixeway.mixewayflowapi.integrations.nist.dto;

import lombok.Data;

import java.util.List;

@Data
public class NistCveWeakness {
    private String source;
    private String type;
    private List<NistCveDescription> description;
}
