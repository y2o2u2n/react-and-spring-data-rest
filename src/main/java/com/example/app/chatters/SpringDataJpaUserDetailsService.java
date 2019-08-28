package com.example.app.chatters;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

@Component
public class SpringDataJpaUserDetailsService implements UserDetailsService {
    @Autowired
    private ChatterRepository chatterRepository;

    @Override
    public UserDetails loadUserByUsername(String name) throws UsernameNotFoundException {
        Chatter chatter = this.chatterRepository.findByName(name);
        return new User(chatter.getName(), chatter.getPassword(), AuthorityUtils.createAuthorityList(chatter.getRoles()));
    }
}
