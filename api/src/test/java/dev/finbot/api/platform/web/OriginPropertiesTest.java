package dev.finbot.api.platform.web;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;

class OriginPropertiesTest {

    private final ApplicationContextRunner runner =
            new ApplicationContextRunner().withUserConfiguration(Config.class);

    @Test
    void failsToStartWithoutASecret() {
        runner.run(context -> assertThat(context).hasFailed());
    }

    @Test
    void failsToStartWithAShortSecret() {
        runner.withPropertyValues("finbot.origin.secret=too-short")
                .run(context -> assertThat(context).hasFailed());
    }

    @Test
    void startsWithALongEnoughSecret() {
        runner.withPropertyValues("finbot.origin.secret=0123456789abcdef0123456789abcdef")
                .run(context -> assertThat(context).hasNotFailed());
    }

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(OriginProperties.class)
    static class Config {}
}
