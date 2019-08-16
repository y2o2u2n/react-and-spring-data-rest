package com.example.app;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import com.example.app.messages.Message;
import com.example.app.messages.MessageRepository;

@SpringBootApplication
public class Application {

	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
	}

	@Bean
	public CommandLineRunner commandLineRunner() {
		return new CommandLineRunner() {
			@Autowired
			private MessageRepository repository;

			@Override
			public void run(String... args) {
				this.repository.save(
					Message.builder()
						.content("message's content")
						.build()
				);
			}
		};
	}
}
