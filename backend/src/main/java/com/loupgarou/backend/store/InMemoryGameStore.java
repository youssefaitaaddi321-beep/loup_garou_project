package com.loupgarou.backend.store;

import com.loupgarou.backend.model.GameRoom;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class InMemoryGameStore {

    private final Map<String, GameRoom> rooms = new ConcurrentHashMap<>();

    public GameRoom save(GameRoom room) {
        rooms.put(room.getId(), room);
        return room;
    }

    public Optional<GameRoom> findById(String id) {
        return Optional.ofNullable(rooms.get(id));
    }

    public Optional<GameRoom> findByCode(String code) {
        return rooms.values().stream()
                .filter(r -> r.getId().startsWith(code.toLowerCase()))
                .findFirst();
    }

    public List<GameRoom> findAll() {
        return new ArrayList<>(rooms.values());
    }

    public void delete(String id) {
        rooms.remove(id);
    }
}