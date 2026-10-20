# syntax=docker/dockerfile:1
# Base images are pinned by digest; Dependabot proposes updates (.github/dependabot.yml).

FROM eclipse-temurin:21-jdk-noble@sha256:107215954359f1ab0be058a247d7c64ed6e69c71c1682d471d38ef751ec8e964 AS build
WORKDIR /workspace
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw -B -q dependency:go-offline
COPY src/ src/
# Tests already ran in CI; the host only deploys commits whose checks passed (render.yaml).
RUN ./mvnw -B -q package -DskipTests \
    && java -Djarmode=tools -jar target/finbot-api.jar extract --layers --destination target/app

FROM eclipse-temurin:21-jre-noble@sha256:35501d3f93173b420ac9001658eb68157e813316b865087e345c187fca422c4c
RUN groupadd --system finbot && useradd --system --gid finbot --no-create-home finbot
WORKDIR /app
COPY --from=build /workspace/target/app/dependencies/ ./
COPY --from=build /workspace/target/app/snapshot-dependencies/ ./
COPY --from=build /workspace/target/app/application/ ./
# Tuned for the free instance (512 MB, 0.1 CPU): a small heap share for metaspace and threads,
# the serial collector, and C1-only compilation for a faster start (ADR 0009).
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=60 -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Xss512k"
# Class Data Sharing: a training run that stops right after the context refresh records the
# loaded classes, so the real start skips most class loading. It needs no database: migrations
# and schema validation are off, and Hibernate does not read JDBC metadata.
RUN java -XX:ArchiveClassesAtExit=finbot-api.jsa -Dspring.context.exit=onRefresh \
        -Dspring.flyway.enabled=false \
        -Dspring.jpa.hibernate.ddl-auto=none \
        -Dspring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect \
        -Dspring.jpa.properties.hibernate.boot.allow_jdbc_metadata_access=false \
        -Dspring.datasource.url=jdbc:postgresql://training.invalid/none \
        -Dfinbot.origin.secret=cds-training-run-placeholder-secret \
        -jar finbot-api.jar
USER finbot
EXPOSE 8080
ENTRYPOINT ["java", "-XX:SharedArchiveFile=finbot-api.jsa", "-jar", "finbot-api.jar"]
