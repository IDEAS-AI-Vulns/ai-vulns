package io.mixeway.mixewayflowapi.integrations.nist.dto;

import lombok.Data;

import java.util.List;

@Data
public class NistCveMetrics {

    private List<NistCveCvssMetricV31> cvssMetricV31;
}
