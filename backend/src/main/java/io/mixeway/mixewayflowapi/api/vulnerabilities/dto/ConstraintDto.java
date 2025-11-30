package io.mixeway.mixewayflowapi.api.vulnerabilities.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ConstraintDto {
    private Long id;
    private String text;
}
