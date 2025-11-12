package io.mixeway.mixewayflowapi.integrations.nist.dto;

import lombok.Data;

import java.util.List;

@Data
public class NistCveReference {
    private String url;
    private String source;
    private List<String> tags;
}
