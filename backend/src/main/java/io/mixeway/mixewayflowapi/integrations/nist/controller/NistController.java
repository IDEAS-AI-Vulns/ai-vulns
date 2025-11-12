package io.mixeway.mixewayflowapi.integrations.nist.controller;

import io.mixeway.mixewayflowapi.integrations.nist.dto.NistCveDTO;
import io.mixeway.mixewayflowapi.integrations.nist.service.NistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequiredArgsConstructor
@Log4j2
public class NistController {

    private final NistService nistService;

    @GetMapping(value = "/api/v1/nist/{name}")
    public ResponseEntity<NistCveDTO> getNistDataForVulnerability(@PathVariable("name") String name) {
        try {
            return new ResponseEntity<>(nistService.getNistDataForVulnerabilityByName(name), HttpStatus.OK);
        } catch (Exception e) {
            log.error("Failed to retrieve constraints", e);
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }
}
