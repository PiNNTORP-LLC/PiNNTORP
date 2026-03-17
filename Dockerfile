# Stage 1: Build the Java backend
FROM eclipse-temurin:17-jdk-focal AS build

# Set the working directory to /app
WORKDIR /app

# Copy all project files
COPY . .

# Move into the pinn-api folder to compile
WORKDIR /app/pinn-api

# Compile the server using the method in start-server.sh
RUN mkdir -p build && \
    find . -name "*.java" > sources.txt && \
    javac -cp "lib/*:build" -d build @sources.txt && \
    rm sources.txt

# Stage 2: Final Runtime Image
FROM eclipse-temurin:17-jre-focal

# Set working directory
WORKDIR /app/pinn-api

# Copy the compiled build and libraries
COPY --from=build /app/pinn-api/build /app/pinn-api/build
COPY --from=build /app/pinn-api/lib /app/pinn-api/lib

# Copy static assets (index.html, css, js) from the root
# The Java Main.java expects static assets to be at user.dir + "/.."
COPY --from=build /app/index.html /app/index.html
COPY --from=build /app/css /app/css
COPY --from=build /app/js /app/js

# Set any environment variables
ENV PORT=8080

# Expose the server port
EXPOSE 8080

# Run the server
CMD ["java", "-cp", "lib/*:build", "com.pinntorp.Server.Main"]
