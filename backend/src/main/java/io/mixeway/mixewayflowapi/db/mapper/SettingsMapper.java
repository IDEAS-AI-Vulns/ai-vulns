package io.mixeway.mixewayflowapi.db.mapper;

import io.mixeway.mixewayflowapi.api.admin.dto.SettingsDTO;
import io.mixeway.mixewayflowapi.db.entity.Settings;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface SettingsMapper {
    SettingsDTO toDTO(Settings settings);
}
