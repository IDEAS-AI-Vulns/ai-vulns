package io.mixeway.mixewayflowapi.modules.downloader.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.mixeway.mixewayflowapi.modules.downloader.db.entity.DownloaderLog;
import io.mixeway.mixewayflowapi.modules.downloader.db.entity.DownloaderLogError;
import io.mixeway.mixewayflowapi.modules.downloader.db.repository.DownloaderLogErrorsRepository;
import io.mixeway.mixewayflowapi.modules.downloader.model.DownloaderVulnerability;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

@Log4j2
@Service
@RequiredArgsConstructor
public class DownloaderLogErrorsService {

    private final DownloaderLogErrorsRepository downloaderLogErrorsRepository;
    private final ObjectMapper objectMapper;

    public DownloaderLogError createDownloaderLogError(DownloaderVulnerability vulnerabilityData, String errorMessage, DownloaderLog processingLog) {
        String entity = null;
        try {
            entity = objectMapper.writeValueAsString(vulnerabilityData);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize DownloaderVulnerability to JSON", e);
        }
        return downloaderLogErrorsRepository.save(new DownloaderLogError(processingLog, entity, errorMessage, vulnerabilityData.getName()));
    }
}
