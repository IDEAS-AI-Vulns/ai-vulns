package io.mixeway.mixewayflowapi.modules.downloader.api.gateway;

import io.mixeway.mixewayflowapi.api.constraint.service.ConstraintService;
import io.mixeway.mixewayflowapi.db.entity.Constraint;
import io.mixeway.mixewayflowapi.db.entity.Finding;
import io.mixeway.mixewayflowapi.db.entity.Vulnerability;
import io.mixeway.mixewayflowapi.db.entity.VulnerableConfigurations;
import io.mixeway.mixewayflowapi.domain.vulnerability.GetOrCreateVulnerabilityService;
import io.mixeway.mixewayflowapi.domain.vulnerability.UpdateVulnerabilityService;
import io.mixeway.mixewayflowapi.domain.vulnerableconfiguration.VulnerableConfigurationsService;
import io.mixeway.mixewayflowapi.modules.downloader.exception.InvalidDataForVulnerabilityException;
import io.mixeway.mixewayflowapi.modules.downloader.exception.InvalidPackageDataException;
import io.mixeway.mixewayflowapi.modules.downloader.model.DownloaderVulnerability;
import io.mixeway.mixewayflowapi.utils.VersionComparator;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@RequiredArgsConstructor
@Log4j2
@Service
public class DownloaderRavenGateway {

    private final GetOrCreateVulnerabilityService getOrCreateVulnerabilityService;
    private final UpdateVulnerabilityService updateVulnerabilityService;
    private final ConstraintService constraintService;
    private final VulnerableConfigurationsService vulnerableConfigurationsService;

    public void createOrUpdateVulnerability(String key, DownloaderVulnerability downloaderVulnerability) {

        Vulnerability vulnerability = getOrCreateVulnerabilityService.getOrCreate(
                    key,
                    downloaderVulnerability.getAttackComplexity(),
                    downloaderVulnerability.getRef(),
                    downloaderVulnerability.getRecommendation(),
                    resolveSeverity(downloaderVulnerability.getSeverity()),
                    downloaderVulnerability.getEpss(),
                    downloaderVulnerability.getEpssPercentile(),
                    downloaderVulnerability.getExploitExists()
            );

            updateBaseInfo(vulnerability, downloaderVulnerability);

            updateComponents(vulnerability);
            updateConfigurations(vulnerability, downloaderVulnerability);
            updateConstraints(vulnerability, downloaderVulnerability);

            updateVulnerabilityService.updateVulnerability(vulnerability);

            log.debug("Vulnerability {} updated", vulnerability.getName());
    }

    private void updateConstraints(Vulnerability vulnerability, DownloaderVulnerability downloaderVulnerability) {
        vulnerability.getConstraints().clear();
        Set<Constraint> constraints = vulnerability.getConstraints();
        downloaderVulnerability.getConstraints().forEach(c -> constraints.add(constraintService.createConstraint(vulnerability, c)));
    }

    private void updateComponents(Vulnerability vulnerability) {
        log.debug("Components should be updated");
    }

    private void updateConfigurations(Vulnerability vulnerability, DownloaderVulnerability downloaderVulnerability) {
        Set<VulnerableConfigurations> configurations;
        if (vulnerability.getConfigurations() != null) {
            vulnerability.getConfigurations().clear();
            configurations = vulnerability.getConfigurations();
        } else {
            configurations = new HashSet<>();
        }

        try {
            downloaderVulnerability.getPackages().forEach(entry ->
                    configurations.addAll(parseVulnerableConfiguration(entry)));
        } catch (InvalidPackageDataException e) {
            log.error("Error parsing package data: {}", e.getInvalidEntry());
            throw new InvalidDataForVulnerabilityException(vulnerability.getName(), downloaderVulnerability, e.getMessage());
        }
        vulnerability.setConfigurations(configurations);
    }

    /**
     * Parses a package entry of the form "criteria >=a,<=b,>=c,<d,..." into one or more
     * {@link VulnerableConfigurations} rows. A single entry can describe multiple disjoint
     * version ranges (as commonly seen in NVD data for products patched across several
     * release lines), so constraints are grouped greedily: a new lower-bound constraint
     * (">=" / ">"), or a repeated upper-bound constraint ("<=" / "<") while the current
     * range already has an upper bound, finalizes the current range and opens a new one.
     * Individual ranges that are internally inconsistent (start > end) are logged and
     * skipped instead of rejecting the whole vulnerability.
     */
    public List<VulnerableConfigurations> parseVulnerableConfiguration(String entry) {
        int operatorIndex = findFirstOperatorIndex(entry);

        if (operatorIndex == -1) {
            return List.of();
        }

        String criteria = entry.substring(0, operatorIndex).trim();
        String versionPart = entry.substring(operatorIndex);
        String[] versionConstraints = versionPart.split(",");

        List<VersionRange> ranges = new ArrayList<>();
        VersionRange current = new VersionRange();

        for (String raw : versionConstraints) {
            String constraint = raw.trim();
            if (constraint.isEmpty()) {
                continue;
            }

            if (constraint.startsWith(">=")) {
                current = startNewRangeIfNeeded(ranges, current, true);
                current.versionStartIncluding = constraint.substring(2).trim();
            } else if (constraint.startsWith(">")) {
                current = startNewRangeIfNeeded(ranges, current, true);
                current.versionStartExcluding = constraint.substring(1).trim();
            } else if (constraint.startsWith("<=")) {
                current = startNewRangeIfNeeded(ranges, current, current.hasEnd());
                current.versionEndIncluding = constraint.substring(2).trim();
            } else if (constraint.startsWith("<")) {
                current = startNewRangeIfNeeded(ranges, current, current.hasEnd());
                current.versionEndExcluding = constraint.substring(1).trim();
            } else {
                throw new InvalidPackageDataException(entry, "Invalid package entry");
            }
        }
        if (!current.isEmpty()) {
            ranges.add(current);
        }

        List<VulnerableConfigurations> configurations = new ArrayList<>();
        for (VersionRange range : ranges) {
            VulnerableConfigurations vc = buildConfiguration(entry, criteria, range);
            if (vc != null) {
                configurations.add(vc);
            }
        }
        return configurations;
    }

    private VersionRange startNewRangeIfNeeded(List<VersionRange> ranges, VersionRange current, boolean flush) {
        if (flush) {
            if (!current.isEmpty()) {
                ranges.add(current);
            }
            return new VersionRange();
        }
        return current;
    }

    private VulnerableConfigurations buildConfiguration(String entry, String criteria, VersionRange range) {
        String versionStartIncluding = range.versionStartIncluding;
        String versionStartExcluding = range.versionStartExcluding;
        String versionEndIncluding = range.versionEndIncluding;
        String versionEndExcluding = range.versionEndExcluding;

        //Correction of data (defensive - by construction only one of each pair is set per range):
        if (versionStartIncluding != null && versionStartExcluding != null) {
            int comparison = compareVersions(versionStartIncluding, versionStartExcluding);
            if (comparison >= 0) {
                versionStartExcluding = null;
            } else {
                versionStartIncluding = null;
            }
        }
        if (versionEndIncluding != null && versionEndExcluding != null) {
            int comparison = compareVersions(versionEndIncluding, versionEndExcluding);
            if (comparison >= 0) {
                versionEndExcluding = null;
            } else {
                versionEndIncluding = null;
            }
        }

        String versionStart = versionStartIncluding != null ? versionStartIncluding : versionStartExcluding;
        String versionEnd = versionEndIncluding != null ? versionEndIncluding : versionEndExcluding;
        if (versionStart != null && versionEnd != null) {
            int cmp = compareVersions(versionStart, versionEnd);
            // An empty range: start > end, or start == end while at least one bound is exclusive.
            boolean inclusiveBothEnds = versionStartIncluding != null && versionEndIncluding != null;
            if (cmp > 0 || (cmp == 0 && !inclusiveBothEnds)) {
                log.warn("Skipping invalid version range for '{}': start version {} vs end version {}",
                        entry, versionStart, versionEnd);
                return null;
            }
        }

        return vulnerableConfigurationsService.getOrCreateVulnerableConfigurations(criteria,
                versionStartIncluding,
                versionStartExcluding,
                versionEndIncluding,
                versionEndExcluding);
    }

    private static class VersionRange {
        String versionStartIncluding;
        String versionStartExcluding;
        String versionEndIncluding;
        String versionEndExcluding;

        boolean hasStart() {
            return versionStartIncluding != null || versionStartExcluding != null;
        }

        boolean hasEnd() {
            return versionEndIncluding != null || versionEndExcluding != null;
        }

        boolean isEmpty() {
            return !hasStart() && !hasEnd();
        }
    }

    /**
     * Maps the downloader's textual severity to {@link Finding.Severity}. Missing, blank
     * or unrecognised values (e.g. "UNKNOWN") are coerced to {@link Finding.Severity#INFO}
     * so that a single vulnerability with non-standard severity does not abort the whole
     * CVE import run.
     */
    Finding.Severity resolveSeverity(String severity) {
        if (severity == null || severity.isBlank()) {
            return Finding.Severity.INFO;
        }
        try {
            return Finding.Severity.valueOf(severity.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            log.warn("Unknown severity '{}', defaulting to INFO", severity);
            return Finding.Severity.INFO;
        }
    }

    private int findFirstOperatorIndex(String entry) {
        int[] indices = {
                entry.indexOf(">="),
                entry.indexOf("<="),
                entry.indexOf(">"),
                entry.indexOf("<")
        };

        int minIndex = -1;
        for (int index : indices) {
            if (index != -1 && (minIndex == -1 || index < minIndex)) {
                minIndex = index;
            }
        }

        return minIndex;
    }

    int compareVersions(String version1, String version2) {
        return VersionComparator.compare(version1, version2);
    }

    private void updateBaseInfo(Vulnerability vulnerability, DownloaderVulnerability downloaderVulnerability) {
        vulnerability.setDescription(downloaderVulnerability.getDescription());
        vulnerability.setInsertedDate(downloaderVulnerability.getInsertedDate().toLocalDateTime());
        vulnerability.setVector(downloaderVulnerability.getVector());
        vulnerability.setWeaknesses(downloaderVulnerability.getWeaknesses());
        vulnerability.setUpdatedDate(downloaderVulnerability.getUpdatedDate().toLocalDateTime());
        vulnerability.setPublishedDate(downloaderVulnerability.getPublishedDate().toLocalDateTime());
        vulnerability.setNistLastModifiedDate(downloaderVulnerability.getNistLastModifiedDate().toLocalDateTime());
        vulnerability.setMetricVersion(downloaderVulnerability.getMetricVersion());
        vulnerability.setExploitabilityScore(downloaderVulnerability.getExploitabilityScore());
        vulnerability.setImpactScore(downloaderVulnerability.getImpactScore());
        vulnerability.setAttackVector(downloaderVulnerability.getAttackVector());
        vulnerability.setPrivilegesRequired(downloaderVulnerability.getPrivilegesRequired());
        vulnerability.setUserInteraction(downloaderVulnerability.getUserInteraction());
        vulnerability.setScope(downloaderVulnerability.getScope());
        vulnerability.setConfidentialityImpact(downloaderVulnerability.getConfidentialityImpact());
        vulnerability.setIntegrityImpact(downloaderVulnerability.getIntegrityImpact());
        vulnerability.setAvailabilityImpact(downloaderVulnerability.getAvailabilityImpact());
        vulnerability.setBaseScore(downloaderVulnerability.getBaseScore());
        vulnerability.setBaseSeverity(downloaderVulnerability.getBaseSeverity());
    }
}
