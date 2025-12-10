# --- ETAPA 1: Build (Compilare) ---
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copiem tot codul sursă în container
COPY . .
# Compilăm aplicația (creăm folderul target și .jar-ul)
# -DskipTests e recomandat ca să meargă build-ul mai repede
RUN mvn clean package -DskipTests

# --- ETAPA 2: Run (Rulare) ---
FROM eclipse-temurin:21-jdk
WORKDIR /app

# Copiem JAR-ul generat în etapa anterioară
# Observă --from=build
COPY --from=build /app/target/*.jar app.jar

# Setăm portul corect pentru Railway
ENV PORT=8080

# Pornim aplicația și îi spunem să asculte pe portul dat de Railway
ENTRYPOINT ["java", "-Dserver.port=${PORT}", "-jar", "app.jar"]