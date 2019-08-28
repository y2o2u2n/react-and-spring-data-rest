package com.example.app;

import com.example.app.chatters.Chatter;
import com.example.app.chatters.ChatterRepository;
import com.example.app.messages.Message;
import com.example.app.messages.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;

@SpringBootApplication
public class Application {

	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
	}

	@Bean
	public CommandLineRunner commandLineRunner() {
		return new CommandLineRunner() {
			@Autowired
			private MessageRepository messageRepository;
			@Autowired
			private ChatterRepository chatterRepository;


			@Override
			public void run(String... args) {
				Chatter junseok = this.chatterRepository.save(new Chatter("junseok", "password", "ROLE_CHATTER"));
				Chatter chulsu = this.chatterRepository.save(new Chatter("chulsu", "password", "ROLE_CHATTER"));

				SecurityContextHolder.getContext().setAuthentication(
						new UsernamePasswordAuthenticationToken("junseok", "doesn't matter",
								AuthorityUtils.createAuthorityList("ROLE_CHATTER")));

				this.messageRepository.save(new Message("Hi!", junseok));
				this.messageRepository.save(new Message("Nice to meet you.", junseok));

				SecurityContextHolder.getContext().setAuthentication(
						new UsernamePasswordAuthenticationToken("chulsu", "doesn't matter",
								AuthorityUtils.createAuthorityList("ROLE_CHATTER")));

				this.messageRepository.save(new Message("Hello!", chulsu));
				this.messageRepository.save(new Message("How are you?", chulsu));

				SecurityContextHolder.clearContext();
			}
		};
	}
}
