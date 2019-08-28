package com.example.app;

import com.example.app.messages.Message;
import com.example.app.messages.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.stream.IntStream;

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
				IntStream.range(1, 12).forEach(i -> this.repository.save(
					Message.builder()
						.content(i + "content")
						.build()
				));
			}
		};
	}
}
