# -----------------------------------------------------------------------------
# STAGE 1: Build the application
# -----------------------------------------------------------------------------
FROM maven:3.9.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy the pom.xml and download dependencies (caches layers for faster builds)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy the source code and build
COPY src ./src
# -DskipTests saves time and prevents deployment failure if a unit test is flaky
RUN mvn clean package -DskipTests

# -----------------------------------------------------------------------------
# STAGE 2: Run the application
# -----------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the JAR from the build stage
# Note: This wildcard (*.jar) handles version changes automatically
COPY --from=build /app/target/*.jar app.jar

# Create a non-root user for security (Good practice for production)
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# The "exec" form allows the app to receive signals (like shutdown) correctly
ENTRYPOINT ["java", "-Djava.net.preferIPv4Stack=true", "-jar", "app.jar"]