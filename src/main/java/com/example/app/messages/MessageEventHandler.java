package com.example.app.messages;

import com.example.app.config.WebSocketConfig;
import org.springframework.data.rest.core.annotation.HandleAfterCreate;
import org.springframework.data.rest.core.annotation.HandleAfterDelete;
import org.springframework.data.rest.core.annotation.HandleAfterSave;
import org.springframework.data.rest.core.annotation.RepositoryEventHandler;
import org.springframework.hateoas.EntityLinks;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RepositoryEventHandler
public class MessageEventHandler {
	private final SimpMessagingTemplate websocket;
	private final EntityLinks entityLinks;

	public MessageEventHandler(SimpMessagingTemplate websocket, EntityLinks entityLinks) {
		this.websocket = websocket;
		this.entityLinks = entityLinks;
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
