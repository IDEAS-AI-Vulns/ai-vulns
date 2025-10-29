package io.mixeway.mixewayflowapi.integrations.nist.dto;

import lombok.Data;

import java.util.List;

@Data
public class NistCveDTO {

    private String id;
    private String sourceIdentifier;
    private String published;
    private String lastModified;
    private String vulnStatus;
    private List<String> cveTags;
    private List<NistCveDescription> descriptions;
    private NistCveMetrics metrics;
    private List<NistCveWeakness> weaknesses;
    private List<NistCveConfiguration> configurations;
    private List<NistCveReference> references;
}
