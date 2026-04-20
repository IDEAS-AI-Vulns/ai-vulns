package io.mixeway.mixewayflowapi.utils;

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Shared version comparator supporting semantic versioning, pre-release
 * suffixes, build metadata (stripped per SemVer), Go pseudo-versions
 * with arbitrarily long numeric segments, and common "v" prefixes.
 */
public final class VersionComparator {

    private static final Pattern VERSION_TOKEN_PATTERN = Pattern.compile("(\\d+)|([A-Za-z]+)");
    private static final Pattern V_PREFIX = Pattern.compile("^[vV](?=\\d)");

    private static final Set<String> POST_RELEASE_TAGS = Set.of("post", "patch", "p", "rev", "r");

    private VersionComparator() {
    }

    /**
     * Compares two version strings.
     *
     * <ul>
     *   <li>Build metadata (after '+') is ignored.</li>
     *   <li>A leading 'v' / 'V' followed by a digit is stripped (e.g. "v1.2.3" → "1.2.3").</li>
     *   <li>Numeric tokens use {@link BigInteger} to support arbitrarily long segments.</li>
     *   <li>Known post-release tags ("post", "patch", "p", "rev", "r") sort <b>above</b> the
     *       corresponding release, while all other alphabetic tokens (pre-release identifiers
     *       like "alpha", "beta", "rc", "dev", "b") sort below it.</li>
     * </ul>
     *
     * @return negative if v1 &lt; v2, zero if equal, positive if v1 &gt; v2
     */
    public static int compare(String version1, String version2) {
        List<Object> tokens1 = tokenize(version1);
        List<Object> tokens2 = tokenize(version2);

        int maxLength = Math.max(tokens1.size(), tokens2.size());
        for (int i = 0; i < maxLength; i++) {
            Object t1 = i < tokens1.size() ? tokens1.get(i) : null;
            Object t2 = i < tokens2.size() ? tokens2.get(i) : null;

            int cmp = compareTokens(t1, t2);
            if (cmp != 0) {
                return cmp;
            }
        }
        return 0;
    }

    private static List<Object> tokenize(String version) {
        List<Object> tokens = new ArrayList<>();
        if (version == null) {
            return tokens;
        }

        String normalized = version.trim();
        normalized = V_PREFIX.matcher(normalized).replaceFirst("");

        int buildMetadataIdx = normalized.indexOf('+');
        if (buildMetadataIdx >= 0) {
            normalized = normalized.substring(0, buildMetadataIdx);
        }

        Matcher matcher = VERSION_TOKEN_PATTERN.matcher(normalized);
        while (matcher.find()) {
            if (matcher.group(1) != null) {
                tokens.add(new BigInteger(matcher.group(1)));
            } else {
                tokens.add(matcher.group(2).toLowerCase());
            }
        }
        return tokens;
    }

    /**
     * Token comparison rules:
     * <ol>
     *   <li>Both numeric → {@link BigInteger} comparison.</li>
     *   <li>Both strings → lexicographic comparison.</li>
     *   <li>One side is {@code null} (shorter version ran out of segments):
     *     <ul>
     *       <li>If the present token is a post-release tag → present &gt; absent (post-release &gt; release).</li>
     *       <li>If the present token is an alphabetic pre-release tag → present &lt; absent (pre-release &lt; release).</li>
     *       <li>If the present token is numeric → compare with implicit zero.</li>
     *     </ul>
     *   </li>
     *   <li>Numeric vs string at the same position: numeric wins (release &gt; pre-release).</li>
     * </ol>
     */
    private static int compareTokens(Object t1, Object t2) {
        if (t1 == null && t2 == null) {
            return 0;
        }

        if (t1 == null) {
            return rankAbsent(t2) * -1;
        }
        if (t2 == null) {
            return rankAbsent(t1);
        }

        if (t1 instanceof BigInteger && t2 instanceof BigInteger) {
            return ((BigInteger) t1).compareTo((BigInteger) t2);
        }

        if (t1 instanceof BigInteger) {
            return 1;
        }
        if (t2 instanceof BigInteger) {
            return -1;
        }

        return ((String) t1).compareTo((String) t2);
    }

    /**
     * Determines how a present token compares to an absent (null) token.
     *
     * @return positive if the present token should rank above the absent side,
     *         negative if below, zero if equal.
     */
    private static int rankAbsent(Object presentToken) {
        if (presentToken instanceof BigInteger) {
            return ((BigInteger) presentToken).compareTo(BigInteger.ZERO);
        }
        String tag = (String) presentToken;
        if (POST_RELEASE_TAGS.contains(tag)) {
            return 1;
        }
        return -1;
    }
}
