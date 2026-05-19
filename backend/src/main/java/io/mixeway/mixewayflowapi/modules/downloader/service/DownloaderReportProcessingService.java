package io.mixeway.mixewayflowapi.modules.downloader.service;

import io.mixeway.mixewayflowapi.db.entity.Constraint;
import io.mixeway.mixewayflowapi.db.entity.Finding;
import io.mixeway.mixewayflowapi.db.entity.Vulnerability;
import io.mixeway.mixewayflowapi.db.entity.VulnerableConfigurations;
import io.mixeway.mixewayflowapi.modules.downloader.api.gateway.DownloaderRavenGateway;
import io.mixeway.mixewayflowapi.modules.downloader.db.entity.DownloaderLog;
import io.mixeway.mixewayflowapi.modules.downloader.exception.InvalidDataForVulnerabilityException;
import io.mixeway.mixewayflowapi.modules.downloader.exception.InvalidPackageDataException;
import io.mixeway.mixewayflowapi.modules.downloader.model.DownloaderStatus;
import io.mixeway.mixewayflowapi.modules.downloader.model.DownloaderVulnerability;
import io.mixeway.mixewayflowapi.modules.downloader.model.VersionRange;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.hibernate.NonUniqueResultException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigInteger;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Log4j2
@Service
@RequiredArgsConstructor
public class DownloaderReportProcessingService {

    private final DownloaderRavenGateway downloaderRavenGateway;
    private final DownloaderLogService downloaderLogService;
    private final DownloaderLogErrorsService downloaderLogErrorsService;

    private static final Pattern VERSION_TOKEN_PATTERN = Pattern.compile("(\\d+)|([A-Za-z]+)");

    @Transactional
    public void processCVEs(Map<String, DownloaderVulnerability> vulnerabilityData) {
        log.debug("Processing Vulnerabilities started");

        DownloaderLog processingLog = downloaderLogService.logDataImportStart();

        vulnerabilityData.forEach((key, data) -> {
            log.debug("Processing Vulnerability: {} started", key);

            try {
                correctData(key, data, processingLog);
                processCVE(key, data, processingLog);
                log.debug("Processing Vulnerability: {} finished", key);
            } catch (InvalidDataForVulnerabilityException e) {
                log.error("Error processing vulnerability {}", e.getMessage());
                processingLog.getErrors().add(downloaderLogErrorsService.createDownloaderLogError(data, "Severity cannot be null or empty - defaulting to INFO", processingLog));
            } catch (Exception e) {
                log.error("Unexpected error processing vulnerability {}", key, e);
                processingLog.getErrors().add(downloaderLogErrorsService.createDownloaderLogError(data, "Unexpected error: " + e.getMessage(), processingLog));
            }
        });

        DownloaderStatus status = DownloaderStatus.SUCCESS;
        if(!processingLog.getErrors().isEmpty()) status = DownloaderStatus.WARNING;

        downloaderLogService.updateLog(processingLog,
                status,
                vulnerabilityData.size()-processingLog.getErrors().size(),
                processingLog.getErrors().size());

        log.debug("Processing Vulnerabilities finished");
    }

    private void processCVE(String key, DownloaderVulnerability data, DownloaderLog processingLog) {
        if (key.equals("CVE-2018-8013") || key.equals("CVE-2018-6594") || key.equals("CVE-2018-8032"))
            log.info("CVE-2018-8013 is a false positive, skipping");
        Vulnerability vulnerability = downloaderRavenGateway.getOrCreateVulnerability(
                key,
                data.getAttackComplexity(),
                data.getRef(),
                data.getRecommendation(),
                Finding.Severity.valueOf(data.getSeverity()),
                data.getEpss(),
                data.getEpssPercentile(),
                data.getExploitExists()
        );

        updateBaseInfo(vulnerability, data);
        updateComponents(vulnerability);
        updateConfigurations(vulnerability, data);
        updateConstraints(vulnerability, data);

        downloaderRavenGateway.updateVulnerability(vulnerability);
    }

    private void correctData(String name, DownloaderVulnerability data, DownloaderLog processingLog) {
        if(data == null)
            throw new InvalidDataForVulnerabilityException(name, null, "Data cannot be null");

        if(name == null || name.isEmpty())
            throw new InvalidDataForVulnerabilityException(name, data, "Name/Key cannot be null or empty");


        if(data.getSeverity() == null || data.getSeverity().isBlank()) {
            data.setSeverity(io.mixeway.mixewayflowapi.db.entity.Finding.Severity.INFO.name());
            processingLog.getErrors().add(downloaderLogErrorsService.createDownloaderLogError(data, "Severity cannot be null or empty - defaulting to INFO", processingLog));
        } else {
            String severity = io.mixeway.mixewayflowapi.db.entity.Finding.Severity.INFO.name();
            try {
                severity = io.mixeway.mixewayflowapi.db.entity.Finding.Severity.valueOf(data.getSeverity().trim().toUpperCase(Locale.ROOT)).name();
            } catch (IllegalArgumentException e) {
                log.warn("Unknown severity '{}', defaulting to INFO", severity);
            }
            data.setSeverity(severity);
        }
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

    private void updateComponents(Vulnerability vulnerability) {
        log.debug("Components should be updated");
    }

    private void updateConstraints(Vulnerability vulnerability, DownloaderVulnerability downloaderVulnerability) {
        vulnerability.getConstraints().clear();
        Set<Constraint> constraints = vulnerability.getConstraints();
        downloaderVulnerability.getConstraints().forEach(c -> constraints.add(downloaderRavenGateway.createConstraint(vulnerability, c)));
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
            downloaderVulnerability.getPackages().forEach(entry -> {
                log.info("Parsing package data: {}", entry);
                configurations.addAll(parseVulnerableConfiguration(entry));
            });
        } catch (InvalidPackageDataException e) {
            log.error("Error parsing package data: {}", e.getInvalidEntry());
            throw new InvalidDataForVulnerabilityException(vulnerability.getName(), downloaderVulnerability, e.getMessage());
        } catch (NonUniqueResultException e) {
            throw new InvalidDataForVulnerabilityException(vulnerability.getName(), downloaderVulnerability, "Storage error for configuration");
        }
        vulnerability.setConfigurations(configurations);
    }

    private List<VulnerableConfigurations> parseVulnerableConfiguration(String entry) {
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
                current.setVersionStartIncluding(constraint.substring(2).trim());
            } else if (constraint.startsWith(">")) {
                current = startNewRangeIfNeeded(ranges, current, true);
                current.setVersionStartExcluding(constraint.substring(1).trim());
            } else if (constraint.startsWith("<=")) {
                current = startNewRangeIfNeeded(ranges, current, current.hasEnd());
                current.setVersionEndIncluding(constraint.substring(2).trim());
            } else if (constraint.startsWith("<")) {
                current = startNewRangeIfNeeded(ranges, current, current.hasEnd());
                current.setVersionEndExcluding(constraint.substring(1).trim());
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

    private VulnerableConfigurations buildConfiguration(String entry, String criteria, VersionRange range) {
        String versionStartIncluding = range.getVersionStartIncluding();
        String versionStartExcluding = range.getVersionStartExcluding();
        String versionEndIncluding = range.getVersionEndIncluding();
        String versionEndExcluding = range.getVersionEndExcluding();

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
                throw new InvalidPackageDataException(entry, "Invalid version range " + versionStart + " - " + versionEnd);
            }
        }

        return downloaderRavenGateway.getOrCreateVulnerableConfigurations(criteria,
                versionStartIncluding,
                versionStartExcluding,
                versionEndIncluding,
                versionEndExcluding);
    }

    /**
     * Compares two version strings supporting:
     *  - semantic versioning (1.2.3)
     *  - build metadata suffixes stripped per SemVer (e.g. "2.0.0+incompatible" from Go modules)
     *  - pre-release suffixes attached either with a dot or directly to the numeric part
     *    (e.g. "6.0.0.beta1", "5.2b1", "1.3.0b3", "1.0.0-rc1")
     *
     * Rules:
     *  - Build metadata (after '+') is ignored.
     *  - Version is tokenized into a sequence of numeric and alphabetic tokens. Numeric
     *    tokens use {@link BigInteger} so arbitrarily long runs of digits (e.g. embedded
     *    timestamps like "202305301015" or "20230601080528") are compared correctly
     *    without overflow.
     *  - Numeric tokens are compared numerically, alphabetic tokens lexicographically (case-insensitive).
     *  - A missing token is treated as zero; a numeric token outranks an alphabetic token at the
     *    same position, so "1.0.0" > "1.0.0-alpha" and "5.2" > "5.2b1" (pre-releases < final release).
     */
    int compareVersions(String version1, String version2) {
        List<Object> tokens1 = tokenizeVersion(version1);
        List<Object> tokens2 = tokenizeVersion(version2);

        int maxLength = Math.max(tokens1.size(), tokens2.size());
        for (int i = 0; i < maxLength; i++) {
            Object t1 = i < tokens1.size() ? tokens1.get(i) : BigInteger.ZERO;
            Object t2 = i < tokens2.size() ? tokens2.get(i) : BigInteger.ZERO;

            int cmp = compareVersionTokens(t1, t2);
            if (cmp != 0) {
                return cmp;
            }
        }
        return 0;
    }

    private List<Object> tokenizeVersion(String version) {
        List<Object> tokens = new ArrayList<>();
        if (version == null) {
            return tokens;
        }

        String normalized = version.trim();
        int buildMetadataIdx = normalized.indexOf('+');
        if (buildMetadataIdx >= 0) {
            normalized = normalized.substring(0, buildMetadataIdx);
        }

        Matcher matcher = VERSION_TOKEN_PATTERN.matcher(normalized);
        while (matcher.find()) {
            if (matcher.group(1) != null) {
                // Use BigInteger to accommodate long numeric segments (e.g. timestamp-like
                // build identifiers such as "20230601080528" or date stamps like
                // "6.6.0.202305301015") that overflow int / long representations.
                tokens.add(new BigInteger(matcher.group(1)));
            } else {
                tokens.add(matcher.group(2).toLowerCase());
            }
        }
        return tokens;
    }

    private int compareVersionTokens(Object t1, Object t2) {
        if (t1 instanceof BigInteger && t2 instanceof BigInteger) {
            return ((BigInteger) t1).compareTo((BigInteger) t2);
        }
        // Numeric token outranks alphabetic (pre-release) token at the same position,
        // so release versions sort above their pre-releases.
        if (t1 instanceof BigInteger) {
            return 1;
        }
        if (t2 instanceof BigInteger) {
            return -1;
        }
        return ((String) t1).compareTo((String) t2);
    }
}
