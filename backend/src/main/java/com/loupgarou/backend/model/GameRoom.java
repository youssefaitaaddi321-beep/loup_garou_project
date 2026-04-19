package com.loupgarou.backend.model;

import lombok.*;
import java.util.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameRoom {

    private String id;
    private String name;
    private String narratorId;
    private int maxPlayers;
    private String password;
    private boolean advancedRoles;
    
    @Builder.Default
    private int wolfCount = 2;

    @Builder.Default
    private List<Role> extraRoles = new ArrayList<>();

    @Builder.Default
    private List<Player> players = new ArrayList<>();

    @Builder.Default
    private List<Vote> votes = new ArrayList<>();

    @Builder.Default
    private GamePhase phase = GamePhase.LOBBY;

    @Builder.Default
    private GameState state = GameState.WAITING;

    // Night action fields
    private String nightVictimId;

    @Builder.Default
    private Map<String, String> wolfVotes = new HashMap<>();
    private String witchKillTargetId;
    private String protectedPlayerId;
    private String lover1Id;
    private String lover2Id;
    private String loupBlancTargetId;
    private String chasseurTargetId;

    // Persistent state flags
    private boolean witchLifeUsed;
    private boolean witchDeathUsed;
    private boolean cupidonUsed;
    private boolean idiotRevealed;

    // Night counter for loup blanc (kills every other night)
    @Builder.Default
    private int nightCount = 0;

    // Saved victim name for witch display (before nulling nightVictimId)
    private String savedVictimName;

    // Win result for end screen
    private String winResult;

    public boolean hasPassword() {
        return password != null && !password.isBlank();
    }

    public boolean isFull() {
        return players.size() >= maxPlayers;
    }

    public List<Player> getAlivePlayers() {
        return players.stream().filter(Player::isAlive).toList();
    }

    public Optional<Player> findPlayer(String playerId) {
        return players.stream()
                .filter(p -> p.getId().equals(playerId))
                .findFirst();
    }

    public List<Player> getWolves() {
        return players.stream()
                .filter(p -> p.isAlive() &&
                    (p.getRole() == Role.LOUP_GAROU || p.getRole() == Role.LOUP_BLANC))
                .toList();
    }

    /**
     * Check if a player has the given role and is alive.
     */
    public boolean hasAliveRole(Role role) {
        return players.stream().anyMatch(p -> p.isAlive() && p.getRole() == role);
    }

    /**
     * Is it a loup blanc kill night? (every other night, starting from night 2)
     */
    public boolean isLoupBlancNight() {
        return nightCount > 0 && nightCount % 2 == 0;
    }

    /**
     * Reset all night-specific action fields (called at start of each night).
     */
    public void resetNightActions() {
        nightVictimId = null;
        witchKillTargetId = null;
        protectedPlayerId = null;
        loupBlancTargetId = null;
        chasseurTargetId = null;
        savedVictimName = null;
        wolfVotes = new HashMap<>();
    }
}
