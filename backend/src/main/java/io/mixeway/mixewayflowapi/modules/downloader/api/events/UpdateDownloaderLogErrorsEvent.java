package io.mixeway.mixewayflowapi.modules.downloader.api.events;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class UpdateDownloaderLogErrorsEvent extends ApplicationEvent {

    private final long repositoryId;

    public UpdateDownloaderLogErrorsEvent(long repositoryId) {
        super(repositoryId);
        this.repositoryId = repositoryId;
    }
}
