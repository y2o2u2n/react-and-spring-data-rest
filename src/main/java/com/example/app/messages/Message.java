package com.example.app.messages;

import com.example.app.chatters.Chatter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;

import javax.persistence.*;

@Entity

@Getter @Setter @EqualsAndHashCode(of = "id")
@NoArgsConstructor @ToString
public class Message {
	private @Id @GeneratedValue Long id;
	private String content;
	private @ManyToOne Chatter chatter;

	private @Version @JsonIgnore Long version;

	public Message(String content, Chatter chatter) {
		this.content = content;
		this.chatter = chatter;
	}
}
