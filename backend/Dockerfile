# Builds any one service:  docker build --build-arg SERVICE=content-service -t portfolio/content-service backend
FROM maven:3.9-eclipse-temurin-21 AS build
ARG SERVICE
WORKDIR /build
# dependencies first, so they're cached between source changes
COPY pom.xml .
COPY common/pom.xml common/
COPY discovery-server/pom.xml discovery-server/
COPY api-gateway/pom.xml api-gateway/
COPY auth-service/pom.xml auth-service/
COPY content-service/pom.xml content-service/
COPY learning-service/pom.xml learning-service/
COPY coding-service/pom.xml coding-service/
COPY contest-service/pom.xml contest-service/
COPY media-service/pom.xml media-service/
COPY chat-service/pom.xml chat-service/
RUN mvn -q -B -pl ${SERVICE} -am dependency:go-offline
COPY . .
RUN mvn -q -B -pl ${SERVICE} -am package -DskipTests && cp ${SERVICE}/target/app.jar /build/app.jar

FROM eclipse-temurin:21-jre
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --create-home --uid 10001 app
WORKDIR /app
COPY --from=build /build/app.jar app.jar
# never run as root inside the container
USER app
# small heaps: nine JVMs share one server. Raise -Xmx if the server has more memory.
ENV JAVA_OPTS="-Xms48m -Xmx192m -XX:+UseSerialGC -XX:MaxMetaspaceSize=160m -XX:+ExitOnOutOfMemoryError"
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
