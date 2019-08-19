package com.example.app.rooms;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.core.annotation.HandleAfterCreate;
import org.springframework.data.rest.core.annotation.HandleAfterDelete;
import org.springframework.data.rest.core.annotation.HandleAfterSave;
import org.springframework.data.rest.core.annotation.RepositoryEventHandler;
import org.springframework.hateoas.EntityLinks;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.example.app.config.WebSocketConfig;

@Component
@RepositoryEventHandler
public class RoomEventHandler {
	@Autowired
	private SimpMessagingTemplate websocket;
	@Autowired
	private EntityLinks entityLinks;

	@HandleAfterCreate
	public void newRoom(Room room) {
		this.websocket.convertAndSend(WebSocketConfig.MESSAGE_PREFIX + "/newRoom", getPath(room));
	}

	@HandleAfterDelete
	public void deleteRoom(Room room) {
		this.websocket.convertAndSend(WebSocketConfig.MESSAGE_PREFIX + "/deleteRoom", getPath(room));
	}

	@HandleAfterSave
	public void updateRoom(Room room) {
		this.websocket.convertAndSend(WebSocketConfig.MESSAGE_PREFIX + "/updateRoom", getPath(room));
	}

	private String getPath(Room room) {
		return this.entityLinks.linkForSingleResource(room.getClass(), room.getId()).toUri().getPath();
	}

}
