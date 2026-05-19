package io.mixeway.mixewayflowapi.modules.downloader.api.controller;

import io.mixeway.mixewayflowapi.modules.downloader.api.dto.DownloaderApiMessage;
import io.mixeway.mixewayflowapi.modules.downloader.api.dto.DownloaderLogDto;
import io.mixeway.mixewayflowapi.modules.downloader.api.dto.DownloaderLogErrorsDto;
import io.mixeway.mixewayflowapi.modules.downloader.api.events.DownloaderUpdateDataEvent;
import io.mixeway.mixewayflowapi.modules.downloader.model.DownloaderVulnerability;
import io.mixeway.mixewayflowapi.modules.downloader.service.DownloaderLogService;
import io.mixeway.mixewayflowapi.modules.downloader.service.DownloaderReportMappingService;
import io.mixeway.mixewayflowapi.modules.downloader.service.DownloaderReportProcessingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Log4j2
public class DownloaderController {

    private final DownloaderReportMappingService downloaderReportMappingService;
    private final DownloaderReportProcessingService downloaderReportProcessingService;
    private final DownloaderLogService downloaderLogService;
    private final ApplicationEventPublisher publisher;

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping(value= "/api/v1/downloader/update")
    public ResponseEntity<DownloaderApiMessage> updateDatabase(@RequestBody String downloaderReport){
        if (downloaderReport == null)
            return ResponseEntity.badRequest().body(new DownloaderApiMessage("Downloader report cannot be null"));

        if (downloaderReport.isEmpty())
            return ResponseEntity.badRequest().body(new DownloaderApiMessage("Downloader report cannot be empty"));

        Map<String, DownloaderVulnerability> cves;
        try {
            cves = downloaderReportMappingService.parseReport(downloaderReport.trim());
        } catch (IllegalArgumentException _) {
            return ResponseEntity.badRequest().body(new DownloaderApiMessage("Invalid JSON file"));
        }

        if (cves == null || cves.isEmpty())
            return ResponseEntity.badRequest().body(new DownloaderApiMessage("No CVEs found in the report"));

        DownloaderUpdateDataEvent downloaderUpdateDataEvent = new DownloaderUpdateDataEvent(cves);
        publisher.publishEvent(downloaderUpdateDataEvent);

        return ResponseEntity.ok(new DownloaderApiMessage("Update of the database has started"));
    }

    @Async
    @EventListener
    public void handleDownloaderUpdateDataEvent(DownloaderUpdateDataEvent downloaderUpdateDataEvent) {
        log.debug("Received DownloaderUpdateDataEvent, number of cves: {}", downloaderUpdateDataEvent.getCves().size());
        downloaderReportProcessingService.processCVEs(downloaderUpdateDataEvent.getCves());
    }


    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping(value ="/api/v1/downloader/log")
    public ResponseEntity<List<DownloaderLogDto>> getDownloaderLogs(){
        return ResponseEntity.ok(downloaderLogService.getDownloaderLogs());
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping(value ="/api/v1/downloader/log/{id}")
    public ResponseEntity<List<DownloaderLogErrorsDto>> getDownloaderLogErrors(@PathVariable Long id){
        return ResponseEntity.ok(downloaderLogService.getDownloaderLogErrors(id));
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping(value ="/api/v1/downloader/file", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> getDownloaderDataFile(@RequestParam String id){
        return ResponseEntity.ok(downloaderLogService.getDownloaderDataFile(id));
    }
}
