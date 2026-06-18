package com.vdt.vtit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class VtitApplication {

	static void main(String[] args) {

		SpringApplication.run(VtitApplication.class, args);
	}

}
