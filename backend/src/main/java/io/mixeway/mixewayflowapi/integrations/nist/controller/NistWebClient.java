package io.mixeway.mixewayflowapi.integrations.nist.controller;

import io.mixeway.mixewayflowapi.integrations.nist.dto.NistCveResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class NistWebClient {

    private final WebClient webClient = WebClient.create("https://services.nvd.nist.gov/rest/json/cves/2.0");

    public NistCveResponseDTO getCveDetails(String cveId) {

        String uri = "?cveId=" + cveId;
        return webClient.get()
                .uri(uri)
                .header("apiKey", "f82be95b-615a-4c1a-a48c-8e6242411528")
                .retrieve()
                .bodyToMono(NistCveResponseDTO.class)
                .onErrorResume(e -> Mono.empty())
                .block();
    }
}
