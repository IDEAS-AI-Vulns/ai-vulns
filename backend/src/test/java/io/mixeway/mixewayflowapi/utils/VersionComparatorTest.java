package io.mixeway.mixewayflowapi.utils;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.assertEquals;

class VersionComparatorTest {

    @ParameterizedTest
    @CsvSource({
            // basic numeric ordering
            "1.0.0,   1.0.1,   -1",
            "2.0.0,   1.99.99,  1",
            "1.0,     1.0.0,    0",

            // build metadata stripped (Go modules)
            "2.0.0+incompatible, 2.0.1+incompatible, -1",
            "2.0.0+incompatible, 2.0.0+other,         0",

            // pre-release suffixes (alpha, beta, rc, dev, b)
            "5.1,       5.2b1,       -1",
            "1.3.0b1,   1.3.0b3,     -1",
            "6.0.0.beta1, 6.0.0.beta3, -1",
            "1.0.0,     1.0.0-alpha,  1",
            "5.2,       5.2b1,        1",
            "1.0.0-rc1, 1.0.0,       -1",
            "1.0.0-dev1, 1.0.0,      -1",

            // post-release tags must sort ABOVE the release
            "1.0.0.post1, 1.0.0,      1",
            "1.0.0.post1, 1.0.0.post2, -1",
            "1.0.0.patch1, 1.0.0,      1",
            "1.0.0.rev2,   1.0.0,      1",

            // 'v' / 'V' prefix stripped
            "v1.2.3,  1.2.3,   0",
            "V1.2.3,  1.2.3,   0",
            "v2.0.0,  v1.9.9,  1",

            // long numeric segments (BigInteger)
            "6.6.0,                                     6.6.0.202305301015,                         -1",
            "1.5.0-rc1.0.20230601080528-80d139bb5d1d,   1.5.0-rc1.0.20230918070231-fec2992e3f9f,    -1",
            "1.0.0.99999999999999999999,                 1.0.0.100000000000000000000,                -1",

            // null / empty handling
            ",       1.0.0,  -1",
            "1.0.0,  ,        1",
            ",       ,         0"
    })
    void compare_handlesAllVersionPatterns(String a, String b, int expectedSign) {
        String v1 = a == null || a.isEmpty() ? null : a;
        String v2 = b == null || b.isEmpty() ? null : b;
        int actual = VersionComparator.compare(v1, v2);
        assertEquals(expectedSign, Integer.signum(actual),
                () -> "compare(" + v1 + ", " + v2 + ") = " + actual);
    }
}
