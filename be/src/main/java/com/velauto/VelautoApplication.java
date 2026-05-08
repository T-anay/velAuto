package com.velauto;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@ComponentScan(basePackages = {"com.velauto", "com.velauto.mapper"})
public class VelautoApplication {

	public static void main(String[] args) {
		// .env dosyasını yükle
		Dotenv dotenv = Dotenv.configure()
				.ignoreIfMissing()
				.load();

		SpringApplication.run(VelautoApplication.class, args);
	}

}
