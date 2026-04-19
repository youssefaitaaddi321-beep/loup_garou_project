package com.loupgarou.backend.model;

import lombok.*;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Player {

    private String id;
    private String username;
    private Role role;
    private boolean alive;
    private boolean isNarrator;

    public static Player create(String username) {
        return Player.builder()
                .id(UUID.randomUUID().toString())
                .username(username)
                .alive(true)
                .isNarrator(false)
                .build();
    }
}