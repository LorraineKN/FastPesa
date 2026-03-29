# Stage 1: Build the application
FROM eclipse-temurin:21-jdk-jammy AS build

# Set workdir
WORKDIR /app

# Copy Maven files first to leverage caching
COPY pom.xml mvnw ./
COPY .mvn .mvn

# Download dependencies only
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the Spring Boot app
RUN ./mvnw clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Copy the jar from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose default Spring Boot port
EXPOSE 8080

# Run the app
ENTRYPOINT ["java","-jar","app.jar"]
