package dev.finbot.api;

import org.springframework.boot.SpringApplication;

/** Runs the API against a throwaway Postgres container: {@code ./mvnw spring-boot:test-run}. */
public class TestFinbotApiApplication {

    public static void main(String[] args) {
        SpringApplication.from(FinbotApiApplication::main)
                .with(TestcontainersConfiguration.class)
                .run("--finbot.origin.secret=local-dev-origin-secret-not-for-production");
    }
}
