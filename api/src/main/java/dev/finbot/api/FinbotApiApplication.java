package dev.finbot.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class FinbotApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(FinbotApiApplication.class, args);
    }
}
