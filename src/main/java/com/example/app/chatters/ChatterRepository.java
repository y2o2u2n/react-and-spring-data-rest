package com.example.app.chatters;

import org.springframework.data.repository.Repository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

@RepositoryRestResource(exported = false)
public interface ChatterRepository extends Repository<Chatter, Long> {
    Chatter save(Chatter chatter);
    Chatter findByName(String name);
}
