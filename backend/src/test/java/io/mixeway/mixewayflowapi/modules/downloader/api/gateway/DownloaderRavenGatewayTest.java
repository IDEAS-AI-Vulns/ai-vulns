package io.mixeway.mixewayflowapi.modules.downloader.api.gateway;

import io.mixeway.mixewayflowapi.api.constraint.service.ConstraintService;
import io.mixeway.mixewayflowapi.db.entity.Finding;
import io.mixeway.mixewayflowapi.db.entity.VulnerableConfigurations;
import io.mixeway.mixewayflowapi.domain.vulnerability.GetOrCreateVulnerabilityService;
import io.mixeway.mixewayflowapi.domain.vulnerability.UpdateVulnerabilityService;
import io.mixeway.mixewayflowapi.domain.vulnerableconfiguration.VulnerableConfigurationsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;

/**
 * Unit tests for the downloader-side vulnerability parsing logic in
 * {@link DownloaderRavenGateway}. The suite pins the behaviour that was broken in production
 * when importing CVEs from NVD whose package constraint strings contain multiple disjoint
 * version ranges, pre-release/build-metadata version tokens, or non-standard severities.
 */
@ExtendWith(MockitoExtension.class)
class DownloaderRavenGatewayTest {

    @Mock
    GetOrCreateVulnerabilityService getOrCreateVulnerabilityService;
    @Mock
    UpdateVulnerabilityService updateVulnerabilityService;
    @Mock
    ConstraintService constraintService;
    @Mock
    VulnerableConfigurationsService vulnerableConfigurationsService;

    @InjectMocks
    DownloaderRavenGateway gateway;

    @BeforeEach
    void setUp() {
        lenient().when(vulnerableConfigurationsService.getOrCreateVulnerableConfigurations(
                any(), any(), any(), any(), any()))
                .thenAnswer(invocation -> {
                    VulnerableConfigurations vc = new VulnerableConfigurations();
                    vc.setCriteria(invocation.getArgument(0));
                    vc.setVersionStartIncluding(invocation.getArgument(1));
                    vc.setVersionStartExcluding(invocation.getArgument(2));
                    vc.setVersionEndIncluding(invocation.getArgument(3));
                    vc.setVersionEndExcluding(invocation.getArgument(4));
                    return vc;
                });
    }

    // ------------------------------------------------------------------
    // parseVulnerableConfiguration - multi-range entries from production logs
    // ------------------------------------------------------------------

    @Test
    void parse_apacheMesos_splitsIntoSixIndependentRanges() {
        String entry = "apache:mesos:1.8.0 >=1.4.0,<=1.4.2,>=1.5.0,<=1.5.2,>=1.6.0,<=1.6.1,>=1.7.0,<=1.7.1,>=4.0.0,<5.0.0,<1.5.0";

        List<VulnerableConfigurations> ranges = gateway.parseVulnerableConfiguration(entry);

        List<Range> actual = toRanges(ranges);
        assertEquals(List.of(
                new Range("1.4.0", null, "1.4.2", null),
                new Range("1.5.0", null, "1.5.2", null),
                new Range("1.6.0", null, "1.6.1", null),
                new Range("1.7.0", null, "1.7.1", null),
                new Range("4.0.0", null, null, "5.0.0"),
                new Range(null, null, null, "1.5.0")
        ), actual);
        ranges.forEach(r -> assertEquals("apache:mesos:1.8.0", r.getCriteria()));
    }

    @Test
    void parse_redhatOpenshift_splitsIntoTwoRanges_closedAndOpenEnded() {
        String entry = "redhat:openshift_container_platform:3.10 >=1.0,<=1.12,>=1.13.12";

        List<VulnerableConfigurations> ranges = gateway.parseVulnerableConfiguration(entry);

        assertEquals(List.of(
                new Range("1.0", null, "1.12", null),
                new Range("1.13.12", null, null, null)
        ), toRanges(ranges));
    }

    @Test
    void parse_netappTelegraf_keepsPointVersionAndOrphanUpperBounds_skipsInverted() {
        String entry = "netapp:cloud_insights_telegraf_agent >=1.13.0,<=1.13.0,<1.12.10,<1.13.1,>=13.0.0,<14.0.0,<1.14.0";

        List<VulnerableConfigurations> ranges = gateway.parseVulnerableConfiguration(entry);

        // Note: >=1.13.0,<=1.13.0 is a valid point-version range (both inclusive)
        // and must survive the "start>=end" sanity check.
        assertEquals(List.of(
                new Range("1.13.0", null, "1.13.0", null),
                new Range(null, null, null, "1.12.10"),
                new Range(null, null, null, "1.13.1"),
                new Range("13.0.0", null, null, "14.0.0"),
                new Range(null, null, null, "1.14.0")
        ), toRanges(ranges));
    }

    @Test
    void parse_opensuseLeap_skipsInvertedSubRangeButKeepsValidOnes() {
        String entry = "opensuse:leap >=8.0.53,<=29.32.1,>=9.0.35,<=3.39.1,<=3.57.3,<8.0.53,<9.0.35";

        List<VulnerableConfigurations> ranges = gateway.parseVulnerableConfiguration(entry);

        // >=9.0.35,<=3.39.1 is internally inverted and must be dropped; the rest stays.
        assertEquals(List.of(
                new Range("8.0.53", null, "29.32.1", null),
                new Range(null, null, "3.57.3", null),
                new Range(null, null, null, "8.0.53"),
                new Range(null, null, null, "9.0.35")
        ), toRanges(ranges));
    }

    @Test
    void parse_spumkoHapi_splitsAllFiveRanges() {
        String entry = "spumko_project:hapi_server_framework:2.0.0 <2.2.0,>=0.0.0,<1.0.0,>=1.0.0,<2.0.0,>=2.0.0,<2.1.0,>=2.1.0";

        List<VulnerableConfigurations> ranges = gateway.parseVulnerableConfiguration(entry);

        assertEquals(List.of(
                new Range(null, null, null, "2.2.0"),
                new Range("0.0.0", null, null, "1.0.0"),
                new Range("1.0.0", null, null, "2.0.0"),
                new Range("2.0.0", null, null, "2.1.0"),
                new Range("2.1.0", null, null, null)
        ), toRanges(ranges));
    }

    @Test
    void parse_graphhopper_dropsDegenerateRangeAndKeepsDisjointUppers() {
        String entry = "graphhopper:graphhopper:4.0 <3.2,<4.0,>=4.0";

        List<VulnerableConfigurations> ranges = gateway.parseVulnerableConfiguration(entry);

        // Each '>=' / '>' starts a new range, so '>=4.0' is not glued to the preceding '<4.0'.
        assertEquals(List.of(
                new Range(null, null, null, "3.2"),
                new Range(null, null, null, "4.0"),
                new Range("4.0", null, null, null)
        ), toRanges(ranges));
    }

    @Test
    void parse_apacheTomcat_splitsInterleavedClosedAndOpenRanges() {
        String entry = "apache:tomcat:10.1.0 >=8.5.0,<=8.5.93,<11.0.0,<10.1.13,<9.0.81,<8.5.93,>=11.0.0,>=10.1.0,>=9.0.0";

        List<VulnerableConfigurations> ranges = gateway.parseVulnerableConfiguration(entry);

        // Previously the old parser collapsed all >= / <= onto single fields, yielding a
        // nonsensical "start 9.0.0 > end 8.5.93" rejection. The corrected parser yields
        // one closed range plus four orphan uppers and three orphan lowers.
        assertEquals(List.of(
                new Range("8.5.0", null, "8.5.93", null),
                new Range(null, null, null, "11.0.0"),
                new Range(null, null, null, "10.1.13"),
                new Range(null, null, null, "9.0.81"),
                new Range(null, null, null, "8.5.93"),
                new Range("11.0.0", null, null, null),
                new Range("10.1.0", null, null, null),
                new Range("9.0.0", null, null, null)
        ), toRanges(ranges));
    }

    @Test
    void parse_kyvernoGoPseudoVersions_keepsRangeWithLongTimestampSegments() {
        // Go pseudo-versions embed 14-digit commit timestamps; these overflow Integer and
        // used to collapse to zero, making the two pseudo-versions compare as equal and
        // the range be rejected. BigInteger-based token comparison must keep them ordered.
        String entry = "github.com/kyverno/kyverno >=1.5.0-rc1.0.20230601080528-80d139bb5d1d,<1.5.0-rc1.0.20230918070231-fec2992e3f9f";

        List<VulnerableConfigurations> ranges = gateway.parseVulnerableConfiguration(entry);

        assertEquals(List.of(new Range(
                "1.5.0-rc1.0.20230601080528-80d139bb5d1d",
                null,
                null,
                "1.5.0-rc1.0.20230918070231-fec2992e3f9f"
        )), toRanges(ranges));
    }

    @Test
    void parse_eclipseJgit_keepsRangeWithLongNumericBuildId() {
        // "202305301015" (12 digits) also overflows int; start (6.6.0) must remain < end.
        String entry = "eclipse:jgit >=6.6.0,<6.6.0.202305301015";

        List<VulnerableConfigurations> ranges = gateway.parseVulnerableConfiguration(entry);

        assertEquals(List.of(new Range(
                "6.6.0", null, null, "6.6.0.202305301015"
        )), toRanges(ranges));
    }

    // ------------------------------------------------------------------
    // parseVulnerableConfiguration - simple cases / edge cases
    // ------------------------------------------------------------------

    @Test
    void parse_entryWithoutAnyOperator_returnsEmptyList() {
        assertTrue(gateway.parseVulnerableConfiguration("some:criteria").isEmpty());
    }

    @Test
    void parse_simpleSingleRange_isParsedAsExpected() {
        List<VulnerableConfigurations> ranges = gateway.parseVulnerableConfiguration(
                "vendor:product >=1.0.0,<2.0.0");

        assertEquals(1, ranges.size());
        VulnerableConfigurations vc = ranges.get(0);
        assertEquals("vendor:product", vc.getCriteria());
        assertEquals("1.0.0", vc.getVersionStartIncluding());
        assertEquals("2.0.0", vc.getVersionEndExcluding());
        assertNull(vc.getVersionStartExcluding());
        assertNull(vc.getVersionEndIncluding());
    }

    @Test
    void parse_onlyUpperBound_returnsSingleRangeWithoutStart() {
        List<VulnerableConfigurations> ranges = gateway.parseVulnerableConfiguration(
                "vendor:product <=2.0.0");

        assertEquals(List.of(new Range(null, null, "2.0.0", null)), toRanges(ranges));
    }

    // ------------------------------------------------------------------
    // compareVersions - formerly broken for pre-release / build metadata
    // ------------------------------------------------------------------

    @ParameterizedTest
    @CsvSource({
            // build metadata (Go modules) must be stripped before comparison
            "2.0.0+incompatible, 2.0.1+incompatible, -1",
            "2.0.0+incompatible, 2.0.0+other,         0",
            // PEP 440 beta-style suffixes
            "5.1,                5.2b1,              -1",
            "1.3.0b1,            1.3.0b3,            -1",
            // dotted Ruby gem beta suffix
            "6.0.0.beta1,        6.0.0.beta3,        -1",
            // pre-release sorts below the corresponding release
            "1.0.0,              1.0.0-alpha,         1",
            "5.2,                5.2b1,               1",
            // trivial numeric ordering still works
            "1.0.0,              1.0.1,              -1",
            "2.0.0,              1.99.99,             1",
            "1.0,                1.0.0,               0",
            // long numeric segments that used to overflow Integer.parseInt
            "6.6.0,                                     6.6.0.202305301015,                         -1",
            "1.5.0-rc1.0.20230601080528-80d139bb5d1d,   1.5.0-rc1.0.20230918070231-fec2992e3f9f,    -1",
            "1.0.0.99999999999999999999,                1.0.0.100000000000000000000,                -1"
    })
    void compareVersions_handlesSemverAndPreReleaseSuffixes(String a, String b, int expectedSign) {
        int actual = gateway.compareVersions(a, b);
        assertEquals(expectedSign, Integer.signum(actual),
                () -> "compareVersions(" + a + ", " + b + ") = " + actual);
    }

    // ------------------------------------------------------------------
    // resolveSeverity - UNKNOWN and other non-standard severities
    // ------------------------------------------------------------------

    @ParameterizedTest
    @ValueSource(strings = {"UNKNOWN", "unknown", "Unknown", "garbage", " "})
    void resolveSeverity_mapsUnknownOrBlankToInfo(String severity) {
        assertEquals(Finding.Severity.INFO, gateway.resolveSeverity(severity));
    }

    @Test
    void resolveSeverity_mapsNullToInfo() {
        assertEquals(Finding.Severity.INFO, gateway.resolveSeverity(null));
    }

    @ParameterizedTest
    @CsvSource({
            "CRITICAL, CRITICAL",
            "critical, CRITICAL",
            "HIGH,     HIGH",
            "Medium,   MEDIUM",
            "low,      LOW",
            "NONE,     NONE",
            "INFO,     INFO"
    })
    void resolveSeverity_mapsKnownValuesCaseInsensitively(String input, String expected) {
        assertEquals(Finding.Severity.valueOf(expected), gateway.resolveSeverity(input));
    }

    // ------------------------------------------------------------------
    // helpers
    // ------------------------------------------------------------------

    private static List<Range> toRanges(List<VulnerableConfigurations> configurations) {
        List<Range> result = new ArrayList<>(configurations.size());
        for (VulnerableConfigurations c : configurations) {
            result.add(new Range(
                    c.getVersionStartIncluding(),
                    c.getVersionStartExcluding(),
                    c.getVersionEndIncluding(),
                    c.getVersionEndExcluding()));
        }
        return result;
    }

    /**
     * Lightweight value type used for asserting ranges without depending on
     * {@link VulnerableConfigurations#equals(Object)} (which ignores the id but includes
     * JPA collections).
     */
    private record Range(String startIncluding,
                         String startExcluding,
                         String endIncluding,
                         String endExcluding) {
    }
}
