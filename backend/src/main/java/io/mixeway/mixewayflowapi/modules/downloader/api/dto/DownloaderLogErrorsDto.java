package io.mixeway.mixewayflowapi.modules.downloader.api.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DownloaderLogErrorsDto {

    private final long id;
    private LocalDateTime createdDate;
    private final long downloaderLogId;
    private String entity;
    private String vulnerabilityKey;
    private String errorMessage;
}
