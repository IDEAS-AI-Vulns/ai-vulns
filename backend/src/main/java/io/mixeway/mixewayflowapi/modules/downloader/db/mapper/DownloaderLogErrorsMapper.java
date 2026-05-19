package io.mixeway.mixewayflowapi.modules.downloader.db.mapper;

import io.mixeway.mixewayflowapi.modules.downloader.api.dto.DownloaderLogErrorsDto;
import io.mixeway.mixewayflowapi.modules.downloader.db.entity.DownloaderLogError;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DownloaderLogErrorsMapper {

    @Mapping(source = "downloaderLog.id", target = "downloaderLogId")
    DownloaderLogErrorsDto toDTO(DownloaderLogError downloaderLogError);
}
