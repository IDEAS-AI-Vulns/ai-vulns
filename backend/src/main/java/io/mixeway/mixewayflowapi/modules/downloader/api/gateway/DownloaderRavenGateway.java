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
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
                    Finding.Severity.valueOf(downloaderVulnerability.getSeverity()),
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
            downloaderVulnerability.getPackages().forEach(entry -> {
                VulnerableConfigurations vulnerableConfiguration = parseVulnerableConfiguration(entry);
                if (vulnerableConfiguration != null) {
                    configurations.add(vulnerableConfiguration);
                }
            });
        } catch (InvalidPackageDataException e) {
            log.error("Error parsing package data: {}", e.getInvalidEntry());
            throw new InvalidDataForVulnerabilityException(vulnerability.getName(), downloaderVulnerability, e.getMessage());
        }
        vulnerability.setConfigurations(configurations);
    }

    public VulnerableConfigurations parseVulnerableConfiguration(String entry) {
        int operatorIndex = findFirstOperatorIndex(entry);

        if (operatorIndex == -1) {
            // No version constraints found
            return null;
        }

        String criteria = entry.substring(0, operatorIndex).trim();
        String versionPart = entry.substring(operatorIndex);
        String versionStartIncluding = null;
        String versionStartExcluding = null;
        String versionEndIncluding = null;
        String versionEndExcluding = null;

        // Handle multiple version constraints separated by comma
        String[] versionConstraints = versionPart.split(",");

        for (String constraint : versionConstraints) {
            constraint = constraint.trim();

            if (constraint.startsWith(">=")) {
                versionStartIncluding = constraint.substring(2);
            } else if (constraint.startsWith(">")) {
                versionStartExcluding = constraint.substring(1);
            } else if (constraint.startsWith("<=")) {
                versionEndIncluding = constraint.substring(2);
            } else if (constraint.startsWith("<")) {
                versionEndExcluding = constraint.substring(1);
            } else {
                throw new InvalidPackageDataException(entry, "Invalid package entry");
            }
        }

        //Correction of data:
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
        if (versionStart != null && versionEnd != null && compareVersions(versionStart, versionEnd) >= 0) {
            throw new InvalidPackageDataException(entry, "Start version " + versionStart + " is greater than end version " + versionEnd);
        }

        return vulnerableConfigurationsService.getOrCreateVulnerableConfigurations(criteria,
                versionStartIncluding,
                versionStartExcluding,
                versionEndIncluding,
                versionEndExcluding);
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

    private static final Pattern VERSION_TOKEN_PATTERN = Pattern.compile("(\\d+)|([A-Za-z]+)");

    /**
     * Compares two version strings supporting:
     *  - semantic versioning (1.2.3)
     *  - build metadata suffixes stripped per SemVer (e.g. "2.0.0+incompatible" from Go modules)
     *  - pre-release suffixes attached either with a dot or directly to the numeric part
     *    (e.g. "6.0.0.beta1", "5.2b1", "1.3.0b3", "1.0.0-rc1")
     *
     * Rules:
     *  - Build metadata (after '+') is ignored.
     *  - Version is tokenized into a sequence of numeric and alphabetic tokens.
     *  - Numeric tokens are compared numerically, alphabetic tokens lexicographically (case-insensitive).
     *  - A missing token is treated as numeric 0; a numeric token outranks an alphabetic token at the
     *    same position, so "1.0.0" > "1.0.0-alpha" and "5.2" > "5.2b1" (pre-releases < final release).
     */
    int compareVersions(String version1, String version2) {
        List<Object> tokens1 = tokenizeVersion(version1);
        List<Object> tokens2 = tokenizeVersion(version2);

        int maxLength = Math.max(tokens1.size(), tokens2.size());
        for (int i = 0; i < maxLength; i++) {
            Object t1 = i < tokens1.size() ? tokens1.get(i) : Integer.valueOf(0);
            Object t2 = i < tokens2.size() ? tokens2.get(i) : Integer.valueOf(0);

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
                try {
                    tokens.add(Integer.parseInt(matcher.group(1)));
                } catch (NumberFormatException e) {
                    tokens.add(0);
                }
            } else {
                tokens.add(matcher.group(2).toLowerCase());
            }
        }
        return tokens;
    }

    private int compareVersionTokens(Object t1, Object t2) {
        if (t1 instanceof Integer && t2 instanceof Integer) {
            return Integer.compare((Integer) t1, (Integer) t2);
        }
        // Numeric token outranks alphabetic (pre-release) token at the same position,
        // so release versions sort above their pre-releases.
        if (t1 instanceof Integer) {
            return 1;
        }
        if (t2 instanceof Integer) {
            return -1;
        }
        return ((String) t1).compareTo((String) t2);
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
