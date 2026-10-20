package dev.finbot.api.platform.health;

import static org.assertj.core.api.Assertions.assertThat;

import dev.finbot.api.TestcontainersConfiguration;
import dev.finbot.api.platform.web.OriginSecretFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

/** Whole application on a real Postgres: filters, routing and the database check together. */
@SpringBootTest(properties = "finbot.origin.secret=" + HealthEndpointsIntegrationTest.SECRET)
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class HealthEndpointsIntegrationTest {

    static final String SECRET = "integration-test-origin-secret-0001";

    @Autowired
    MockMvcTester mvc;

    @Test
    void livenessNeedsNoSecretAndIsNeverCached() {
        assertThat(mvc.get().uri("/health"))
                .hasStatusOk()
                .hasHeader("Cache-Control", "no-store")
                .bodyJson()
                .extractingPath("$.status")
                .isEqualTo("ok");
    }

    @Test
    void apiHealthReachesTheDatabaseThroughTheProxy() {
        assertThat(mvc.get().uri("/api/health").header(OriginSecretFilter.HEADER, SECRET))
                .hasStatusOk()
                .hasHeader("Cache-Control", "no-store")
                .bodyJson()
                .isEqualTo("{\"status\":\"ok\",\"database\":\"up\"}");
    }

    @Test
    void directCallsAreForbiddenAndNeverCached() {
        assertThat(mvc.get().uri("/api/health"))
                .hasStatus(403)
                .hasHeader("Cache-Control", "no-store");
    }

    @Test
    void unknownApiPathsAreForbiddenWithoutTheSecret() {
        assertThat(mvc.get().uri("/api/does-not-exist")).hasStatus(403);
    }
}
