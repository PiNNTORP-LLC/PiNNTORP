# Stage 1: Build the Java backend
FROM eclipse-temurin:17-jdk-focal AS build

# Set the working directory to /app
WORKDIR /app

# Copy all project files
COPY . .

# Compile the server from the consolidated src folder
RUN mkdir -p build && \
    find src/com/pinntorp/server src/com/pinntorp/games -name "*.java" 2>/dev/null > sources.txt && \
    javac -cp "lib/*:build" -d build @sources.txt && \
    rm sources.txt

# Stage 2: Final Runtime Image
FROM eclipse-temurin:17-jre-focal

# Set working directory
WORKDIR /app

# Copy the compiled build and libraries
COPY --from=build /app/build /app/build
COPY --from=build /app/lib /app/lib

# Copy static assets (index.html, css, js) from the root
COPY --from=build /app/*.html /app/
COPY --from=build /app/css /app/css
COPY --from=build /app/js /app/js
COPY --from=build /app/resources /app/resources

# Set any environment variables
ENV PORT=8080

# Expose the server port
EXPOSE 8080

# Run the server
CMD ["java", "-cp", "lib/*:build", "com.pinntorp.server.Main"]
