package com.example.app.messages;

import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.Optional;

@PreAuthorize("hasRole('ROLE_CHATTER')")
public interface MessageRepository extends PagingAndSortingRepository<Message, Long> {

    @Override
    Optional<Message> findById(@Param("id") Long id);

    @Override
    @PreAuthorize("#message?.chatter == null or #message?.chatter?.name == authentication?.name")
    Message save(@Param("message") Message message);

    @Override
    @PreAuthorize("#messageRepository.findById(#id)?.chatter?.name == authentication?.name")
    void deleteById(@Param("id") Long id);

    @Override
    @PreAuthorize("#message?.chatter?.name == authentication?.name")
    void delete(@Param("message") Message message);
}
