package com.totem.fastfood;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TotemApplication {

    public static void main(String[] args) {
        SpringApplication.run(TotemApplication.class, args);
    }
}
