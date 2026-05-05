package com.velauto.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Configuration;

/**
 * DotEnv Configuration
 * .env dosyasını yükler ve environment variables olarak sistem değişkenlerine ekler
 */
@Configuration
public class DotEnvConfig {

    static {
        Dotenv dotenv = Dotenv.configure()
                .ignoreIfMissing()
                .load();

        // .env dosyasındaki tüm değişkenleri sistem environment'ına ekle
        dotenv.entries().forEach(entry ->
                System.setProperty(entry.getKey(), entry.getValue())
        );
    }

}
