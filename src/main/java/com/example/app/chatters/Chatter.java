package com.example.app.chatters;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;

@Entity

@Getter @Setter @EqualsAndHashCode(of = "id")
@NoArgsConstructor @ToString
public class Chatter {
    public static final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private @Id @GeneratedValue Long id;
    private String name;
    private @JsonIgnore String password;
    private String[] roles;

    public void setPassword(String password) {
        this.password = passwordEncoder.encode(password);
    }

    public Chatter(String name, String password, String... roles) {
        this.name = name;
        this.setPassword(password);
        this.roles = roles;
    }
}
