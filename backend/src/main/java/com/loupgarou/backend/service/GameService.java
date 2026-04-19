package com.loupgarou.backend.service;

import com.loupgarou.backend.model.*;
import com.loupgarou.backend.store.InMemoryGameStore;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class GameService {

    private final InMemoryGameStore store;
    private final GameEngine engine;
    private final VoteService voteService;

    public GameRoom createRoom(String name, String narratorUsername,
                           int maxPlayers, boolean advancedRoles,
                           String password, List<Role> extraRoles, int wolfCount) {
        Player narrator = Player.create(narratorUsername);
        narrator.setNarrator(true);

        GameRoom room = GameRoom.builder()
                .id(generateRoomCode())
                .name(name)
                .narratorId(narrator.getId())
                .maxPlayers(maxPlayers)
                .advancedRoles(advancedRoles)
                .password(password)
                .extraRoles(extraRoles != null ? extraRoles : new ArrayList<>())
                .wolfCount(wolfCount > 0 ? wolfCount : 2)
                .build();
        room.getPlayers().add(narrator);
        return store.save(room);
    }

    public GameRoom joinRoom(String roomId, String username, String password) {
        GameRoom room = store.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Partie introuvable"));
        if (room.isFull()) throw new RuntimeException("La partie est complète");
        if (room.getState() != GameState.WAITING)
            throw new RuntimeException("La partie a déjà commencé");
        if (room.hasPassword() && !room.getPassword().equals(password))
            throw new RuntimeException("Mot de passe incorrect");

        // Bug fix #6: prevent duplicate usernames
        boolean nameExists = room.getPlayers().stream()
                .anyMatch(p -> p.getUsername().equalsIgnoreCase(username));
        if (nameExists) {
            throw new RuntimeException("Ce pseudonyme est déjà pris dans cette partie");
        }

        Player player = Player.create(username);
        room.getPlayers().add(player);
        return store.save(room);
    }

    public GameRoom startGame(String roomId) {
        GameRoom room = store.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Partie introuvable"));
        engine.assignRoles(room);
        room.setState(GameState.IN_PROGRESS);
        room.setPhase(GamePhase.NUIT);
        room.setNightCount(1);
        return store.save(room);
    }

    public GameRoom switchPhase(String roomId, GamePhase phase) {
        GameRoom room = store.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Partie introuvable"));
        room.setPhase(phase);
        voteService.clearVotes(room);

        // Reset night actions when entering night phase
        if (phase == GamePhase.NUIT) {
            room.setNightCount(room.getNightCount() + 1);
            room.resetNightActions();
        }

        return store.save(room);
    }

    public GameRoom eliminatePlayer(String roomId, String playerId) {
        GameRoom room = store.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Partie introuvable"));
        engine.eliminatePlayer(room, playerId);
        GameEngine.WinResult result = engine.checkWinCondition(room);
        if (result != GameEngine.WinResult.CONTINUE) {
            room.setPhase(GamePhase.TERMINE);
            room.setState(GameState.FINISHED);
            room.setWinResult(result.name());
        }
        return store.save(room);
    }

    public Optional<String> processVotes(String roomId) {
        GameRoom room = store.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Partie introuvable"));
        return voteService.tallyVotes(room);
    }

    public List<GameRoom> getAvailableRooms() {
        return store.findAll().stream()
                .filter(r -> r.getState() == GameState.WAITING)
                .toList();
    }

    public Optional<GameRoom> getRoom(String roomId) {
        return store.findById(roomId);
    }

    private String generateRoomCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        Random random = new Random();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
