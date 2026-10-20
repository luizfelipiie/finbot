package dev.finbot.api.platform.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * The shared secret the Vercel proxy injects as {@code x-origin-secret} (ADR 0012).
 * The application refuses to start without it, so a misconfigured deploy fails closed.
 */
@Validated
@ConfigurationProperties("finbot.origin")
public record OriginProperties(@NotBlank @Size(min = 32) String secret) {

    @Override
    public String toString() {
        return "OriginProperties[secret=<redacted>]";
    }
}
