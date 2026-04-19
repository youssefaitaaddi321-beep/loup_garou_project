package com.loupgarou.backend.controller;

import com.loupgarou.backend.model.GameRoom;
import com.loupgarou.backend.model.Role;
import com.loupgarou.backend.service.GameService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class LobbyController {

    private final GameService gameService;
    private final SimpMessagingTemplate messaging;

    @GetMapping
    public ResponseEntity<List<GameRoom>> getRooms() {
        return ResponseEntity.ok(gameService.getAvailableRooms());
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<GameRoom> getRoom(@PathVariable String roomId) {
        return gameService.getRoom(roomId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<GameRoom> createRoom(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String narratorUsername = (String) body.get("narratorUsername");
        int maxPlayers = (Integer) body.getOrDefault("maxPlayers", 10);
        boolean advancedRoles = (Boolean) body.getOrDefault("advancedRoles", false);
        String password = (String) body.getOrDefault("password", null);

        List<String> extraRoleNames = (List<String>) body.getOrDefault("extraRoles", List.of());
        List<Role> extraRoles = extraRoleNames.stream()
                .map(r -> {
                    try { return Role.valueOf(r); }
                    catch (Exception e) { return null; }
                })
                .filter(r -> r != null)
                .collect(Collectors.toList());

        int wolfCount = body.containsKey("wolfCount") ? (Integer) body.get("wolfCount") : 2;
        
        GameRoom room = gameService.createRoom(
                name, narratorUsername, maxPlayers, advancedRoles, password, extraRoles, wolfCount);
        return ResponseEntity.ok(room);
    }

    @PostMapping("/{roomId}/join")
    public ResponseEntity<?> joinRoom(@PathVariable String roomId,
                                       @RequestBody Map<String, String> body) {
        try {
            String username = body.get("username");
            String password = body.getOrDefault("password", null);
            GameRoom room = gameService.joinRoom(roomId, username, password);
            return ResponseEntity.ok(room);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Bug fix #7: REST start also broadcasts via WebSocket so all clients get it instantly
    @PostMapping("/{roomId}/start")
    public ResponseEntity<?> startGame(@PathVariable String roomId) {
        try {
            GameRoom room = gameService.startGame(roomId);

            // Broadcast to WebSocket so all players transition immediately
            Map<String, Object> msg = new HashMap<>();
            msg.put("roomId", roomId);
            msg.put("phase", room.getPhase().name());
            msg.put("state", room.getState().name());
            msg.put("alivePlayers", room.getAlivePlayers());
            msg.put("players", room.getPlayers());
            msg.put("announcement", "La partie commence... La nuit tombe sur le village.");
            MessageHelper.send(messaging, "/topic/game/" + roomId, (Object) msg);

            return ResponseEntity.ok(room);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
