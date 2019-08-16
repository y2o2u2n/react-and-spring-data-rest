package com.example.app;

import java.util.stream.IntStream;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import com.example.app.rooms.Room;
import com.example.app.rooms.RoomRepository;

@SpringBootApplication
public class Application {

	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
	}

	@Bean
	public CommandLineRunner commandLineRunner() {
		return new CommandLineRunner() {
			@Autowired
			private RoomRepository repository;

			@Override
			public void run(String... args) {
				IntStream.range(1, 12).forEach(i -> this.repository.save(
					Room.builder()
						.title(i + "room")
						.build()
				));
			}
		};
	}
}
