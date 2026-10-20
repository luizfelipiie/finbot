package dev.finbot.api.platform.web;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class OriginSecretFilterTest {

    private static final String SECRET = "0123456789abcdef0123456789abcdef";

    private final OriginSecretFilter filter = new OriginSecretFilter(new OriginProperties(SECRET));

    @Test
    void passesRequestsCarryingTheSecret() throws Exception {
        var request = new MockHttpServletRequest("GET", "/api/health");
        request.addHeader(OriginSecretFilter.HEADER, SECRET);
        var chain = new MockFilterChain();

        filter.doFilter(request, new MockHttpServletResponse(), chain);

        assertThat(chain.getRequest()).isSameAs(request);
    }

    @Test
    void rejectsRequestsWithoutTheSecret() throws Exception {
        var response = run(new MockHttpServletRequest("GET", "/api/health"));

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentType()).isEqualTo("application/problem+json");
        assertThat(response.getContentAsString()).doesNotContain(SECRET);
    }

    @Test
    void rejectsAWrongSecretOfTheSameLength() throws Exception {
        var request = new MockHttpServletRequest("GET", "/api/health");
        request.addHeader(OriginSecretFilter.HEADER, SECRET.replace('0', '1'));

        assertThat(run(request).getStatus()).isEqualTo(403);
    }

    @Test
    void rejectsAPrefixOfTheSecret() throws Exception {
        var request = new MockHttpServletRequest("GET", "/api/health");
        request.addHeader(OriginSecretFilter.HEADER, SECRET.substring(0, 16));

        assertThat(run(request).getStatus()).isEqualTo(403);
    }

    @Test
    void protectsUnknownPathsInsteadOfRevealingThem() throws Exception {
        assertThat(run(new MockHttpServletRequest("GET", "/actuator/env")).getStatus())
                .isEqualTo(403);
    }

    @Test
    void leavesTheLivenessProbeOpen() throws Exception {
        var request = new MockHttpServletRequest("GET", "/health");
        var chain = new MockFilterChain();

        filter.doFilter(request, new MockHttpServletResponse(), chain);

        assertThat(chain.getRequest()).isSameAs(request);
    }

    @Test
    void doesNotPrintTheSecret() {
        assertThat(new OriginProperties(SECRET).toString()).doesNotContain(SECRET);
    }

    private MockHttpServletResponse run(MockHttpServletRequest request) throws Exception {
        var response = new MockHttpServletResponse();
        var chain = new MockFilterChain();
        filter.doFilter(request, response, chain);
        assertThat(chain.getRequest()).isNull();
        return response;
    }
}
