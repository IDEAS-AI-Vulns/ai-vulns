package io.mixeway.mixewayflowapi.modules.downloader.api.events;

import io.mixeway.mixewayflowapi.modules.downloader.model.DownloaderVulnerability;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.Map;

@Getter
public class DownloaderUpdateDataEvent extends ApplicationEvent {

    private final Map<String, DownloaderVulnerability> cves;

    public DownloaderUpdateDataEvent(Map<String, DownloaderVulnerability> cves) {
        super(cves);
        this.cves = cves;
    }
}
