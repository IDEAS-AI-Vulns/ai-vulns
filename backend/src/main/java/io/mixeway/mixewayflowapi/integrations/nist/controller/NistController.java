package io.mixeway.mixewayflowapi.integrations.nist.controller;

import io.mixeway.mixewayflowapi.api.vulnerabilities.dto.VulnerabilityDto;
import io.mixeway.mixewayflowapi.integrations.nist.service.NistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@Log4j2
public class NistController {

    private final NistService nistService;
    private final NistWebClient nistWebClient;

    //@PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping(value = "/api/v1/nist/{id}")
    public ResponseEntity<VulnerabilityDto> updateVulnerabilityWithNistData(@PathVariable("id") String id) {
        try {
            return new ResponseEntity<>(nistService.updateVulnerabilityWithNistData(id), HttpStatus.OK);
        } catch (Exception e) {
            log.error("Failed to retrieve constraints", e);
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping(value = "/api/v1/nist")
    public ResponseEntity<List<VulnerabilityDto>> updateAllVulnerabilitiesWithNistData() {
        try {
            return new ResponseEntity<>(nistService.updateAllVulnerabilitiesWithNistData(), HttpStatus.OK);
        } catch (Exception e) {
            log.error("Failed to retrieve constraints", e);
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }
}
