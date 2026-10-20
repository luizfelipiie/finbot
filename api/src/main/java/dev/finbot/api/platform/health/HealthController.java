package dev.finbot.api.platform.health;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class HealthController {

    private static final Logger log = LoggerFactory.getLogger(HealthController.class);

    private final JdbcTemplate jdbc;

    HealthController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Liveness probe for the host. It must not touch the database: the host polls it, and a
     * query here would keep the Neon compute awake and burn the free compute hours (ADR 0010).
     */
    @GetMapping("/health")
    Liveness liveness() {
        return new Liveness("ok");
    }

    /** End-to-end check through the proxy: secret accepted and database reachable. */
    @GetMapping("/api/health")
    ResponseEntity<ApiHealth> apiHealth() {
        try {
            jdbc.queryForObject("select 1", Integer.class);
            return ResponseEntity.ok(new ApiHealth("ok", "up"));
        } catch (DataAccessException e) {
            log.warn("Database health check failed: {}", e.getClass().getSimpleName());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ApiHealth("degraded", "down"));
        }
    }

    record Liveness(String status) {}

    record ApiHealth(String status, String database) {}
}
