package com.example.app.messages;

import com.example.app.chatters.Chatter;
import com.example.app.chatters.ChatterRepository;
import com.example.app.config.WebSocketConfig;
import org.springframework.data.rest.core.annotation.*;
import org.springframework.hateoas.EntityLinks;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RepositoryEventHandler
public class MessageEventHandler {
	private final SimpMessagingTemplate websocket;
	private final EntityLinks entityLinks;
	private final ChatterRepository chatterRepository;

	public MessageEventHandler(SimpMessagingTemplate websocket, EntityLinks entityLinks, ChatterRepository chatterRepository) {
		this.websocket = websocket;
		this.entityLinks = entityLinks;
		this.chatterRepository = chatterRepository;
	}

	@HandleBeforeCreate
	@HandleAfterSave
	public void applyUserInformationUsingSecurityContext(Message message) {
		String name = SecurityContextHolder.getContext().getAuthentication().getName();
		Chatter chatter = this.chatterRepository.findByName(name);
		if (chatter == null) {
			Chatter newChatter = new Chatter();
			newChatter.setName(name);
			newChatter.setRoles(new String[]{"ROLE_CHATTER"});
			chatter = this.chatterRepository.save(newChatter);
		}
		message.setChatter(chatter);
	}

	@HandleAfterCreate
	public void newMessage(Message message) {
		this.websocket.convertAndSend(WebSocketConfig.MESSAGE_PREFIX + "/newMessage", getPath(message));
	}

	@HandleAfterDelete
	public void deleteMessage(Message message) {
		this.websocket.convertAndSend(WebSocketConfig.MESSAGE_PREFIX + "/deleteMessage", getPath(message));
	}

	@HandleAfterSave
	public void updateMessage(Message message) {
		this.websocket.convertAndSend(WebSocketConfig.MESSAGE_PREFIX + "/updateMessage", getPath(message));
	}

	private String getPath(Message message) {
		return this.entityLinks.linkForSingleResource(message.getClass(), message.getId()).toUri().getPath();
	}

}
