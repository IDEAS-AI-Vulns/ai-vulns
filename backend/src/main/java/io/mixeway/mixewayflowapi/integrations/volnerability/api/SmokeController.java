package io.mixeway.mixewayflowapi.integrations.volnerability.api;

import io.mixeway.mixewayflowapi.integrations.volnerability.service.VolnerabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class SmokeController {

    private final VolnerabilityService volnerabilityService;

    @GetMapping("/smoke-test")
    public String runSmokeTest() throws Exception {
        return volnerabilityService.runSmokeTest();
    }
}
