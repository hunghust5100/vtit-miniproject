# --- Stage 1: Build ứng dụng ---
FROM eclipse-temurin:25-jdk AS builder
WORKDIR /build

COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./

RUN chmod +x gradlew
RUN ./gradlew dependencies --no-daemon

COPY src src
RUN ./gradlew bootJar -x test --no-daemon

# 👇 THÊM DÒNG NÀY: Xóa file plain và đổi tên file jar thật thành app.jar cố định
RUN rm -f build/libs/*-plain.jar && mv build/libs/*.jar build/libs/app.jar


# --- Stage 2: Bộ chạy Runtime ---
FROM eclipse-temurin:25-jre
WORKDIR /app

RUN useradd -ms /bin/bash springuser

# 👇 SỬA DÒNG NÀY: Copy đích danh file app.jar đã được chuẩn bị sẵn
COPY --from=builder /build/build/libs/app.jar app.jar

RUN chown -R springuser:springuser /app
USER springuser

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]