package io.mixeway.mixewayflowapi.api.coderepo.controller;

import io.mixeway.mixewayflowapi.api.coderepo.service.CodeRepoApiService;
import io.mixeway.mixewayflowapi.api.components.dto.ComponentDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@Log4j2
public class CodeRepoComponentsController {
    private final CodeRepoApiService codeRepoApiService;

    @PreAuthorize("hasAuthority('USER')")
    @GetMapping(value= "/api/v1/coderepo/{id}/components")
    public ResponseEntity<List<ComponentDto>> getCoderepoComponents(@PathVariable("id") Long id, Principal principal){
        try {
            return new ResponseEntity<>(codeRepoApiService.getComponents(id, principal), HttpStatus.OK);
        } catch (Exception e){
            return new ResponseEntity<>( HttpStatus.BAD_REQUEST);
        }
    }
}
