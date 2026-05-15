package io.mixeway.mixewayflowapi.modules.downloader.model;

import lombok.Getter;
import lombok.Setter;

@Setter @Getter
public class VersionRange {
    private String versionStartIncluding;
    private String versionStartExcluding;
    private String versionEndIncluding;
    private String versionEndExcluding;

    public boolean isEmpty() {
        return !hasStart() && !hasEnd();
    }

    public boolean hasStart() {
        return versionStartIncluding != null || versionStartExcluding != null;
    }

    public boolean hasEnd() {
        return versionEndIncluding != null || versionEndExcluding != null;
    }

}
