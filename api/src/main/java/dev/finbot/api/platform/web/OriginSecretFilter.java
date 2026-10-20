package dev.finbot.api.platform.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Set;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Rejects every request that did not come through the Vercel proxy (ADR 0012).
 * Only the liveness probe used by the host is reachable without the secret, and it returns no data.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class OriginSecretFilter extends OncePerRequestFilter {

    public static final String HEADER = "x-origin-secret";

    private static final Set<String> PUBLIC_PATHS = Set.of("/health");
    private static final String FORBIDDEN_BODY =
            "{\"type\":\"about:blank\",\"title\":\"Forbidden\",\"status\":403}";

    private final byte[] expected;

    public OriginSecretFilter(OriginProperties properties) {
        this.expected = properties.secret().getBytes(StandardCharsets.UTF_8);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return PUBLIC_PATHS.contains(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String provided = request.getHeader(HEADER);
        if (provided != null
                && MessageDigest.isEqual(expected, provided.getBytes(StandardCharsets.UTF_8))) {
            chain.doFilter(request, response);
            return;
        }
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.getWriter().write(FORBIDDEN_BODY);
    }
}
