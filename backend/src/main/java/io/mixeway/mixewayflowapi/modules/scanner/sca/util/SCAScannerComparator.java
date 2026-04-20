package io.mixeway.mixewayflowapi.modules.scanner.sca.util;

import io.mixeway.mixewayflowapi.db.entity.Component;
import io.mixeway.mixewayflowapi.db.entity.VulnerableConfigurations;
import io.mixeway.mixewayflowapi.utils.VersionComparator;

public class SCAScannerComparator {

    private SCAScannerComparator() {
    }

    public static boolean matchesComponentCriteria(VulnerableConfigurations config, Component component) {
        String componentCriteria = SCAScannerCriteriaBuilder.buildCriteria(component.getGroupid(), component.getName());
        return config.getCriteria() != null && config.getCriteria().equals(componentCriteria);
    }

    public static boolean matchesComponentVersion(VulnerableConfigurations config, String version) {
        if (config.getVersionStartIncluding() == null
                && config.getVersionStartExcluding() == null
                && config.getVersionEndIncluding() == null
                && config.getVersionEndExcluding() == null) {
            return true;
        }

        boolean matchesStart = true;
        boolean matchesEnd = true;

        if (config.getVersionStartIncluding() != null) {
            matchesStart = VersionComparator.compare(version, config.getVersionStartIncluding()) >= 0;
        }

        if (config.getVersionStartExcluding() != null) {
            matchesStart = VersionComparator.compare(version, config.getVersionStartExcluding()) > 0;
        }

        if (config.getVersionEndIncluding() != null) {
            matchesEnd = VersionComparator.compare(version, config.getVersionEndIncluding()) <= 0;
        }

        if (config.getVersionEndExcluding() != null) {
            matchesEnd = VersionComparator.compare(version, config.getVersionEndExcluding()) < 0;
        }

        return matchesStart && matchesEnd;
    }
}
