package com.loupgarou.backend.service;

import com.loupgarou.backend.model.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class GameEngine {

    public void assignRoles(GameRoom room) {
        List<Role> pool = buildRolePool(room);
        Collections.shuffle(pool);
        List<Player> players = room.getPlayers().stream()
                .filter(p -> !p.isNarrator())
                .toList();
        for (int i = 0; i < players.size() && i < pool.size(); i++) {
            players.get(i).setRole(pool.get(i));
        }
    }

    public List<Role> buildRolePool(GameRoom room) {
        int count = (int) room.getPlayers().stream().filter(p -> !p.isNarrator()).count();
        List<Role> pool = new ArrayList<>();

        int wolfCount = room.getWolfCount() > 0 ? room.getWolfCount() : 2;
        for (int i = 0; i < wolfCount; i++) {
            pool.add(Role.LOUP_GAROU);
        }
        pool.add(Role.SORCIERE);
        pool.add(Role.VOYANTE);
        pool.add(Role.SALVATEUR);

        if (room.getExtraRoles() != null) {
            pool.addAll(room.getExtraRoles());
        }

        while (pool.size() < count) {
            pool.add(Role.VILLAGEOIS);
        }

        while (pool.size() > count) {
            pool.remove(pool.size() - 1);
        }

        return pool;
    }

    public void eliminatePlayer(GameRoom room, String playerId) {
        room.findPlayer(playerId).ifPresent(p -> p.setAlive(false));
    }

    /**
     * Resolve night deaths with salvateur protection + lover link + loup blanc.
     */
    public List<String> resolveNightDeaths(GameRoom room) {
        List<String> deaths = new ArrayList<>();
        String protectedId = room.getProtectedPlayerId();

        // Wolf victim — survives if protected by salvateur
        if (room.getNightVictimId() != null) {
            if (!room.getNightVictimId().equals(protectedId)) {
                deaths.add(room.getNightVictimId());
            }
        }

        // Witch kill — salvateur cannot protect against witch poison
        if (room.getWitchKillTargetId() != null) {
            if (!deaths.contains(room.getWitchKillTargetId())) {
                deaths.add(room.getWitchKillTargetId());
            }
        }

        // Loup Blanc solo kill
        if (room.getLoupBlancTargetId() != null) {
            if (!deaths.contains(room.getLoupBlancTargetId())) {
                deaths.add(room.getLoupBlancTargetId());
            }
        }

        // Cupidon lover link — if one lover dies, the other dies too
        if (room.getLover1Id() != null && room.getLover2Id() != null) {
            boolean lover1Dies = deaths.contains(room.getLover1Id());
            boolean lover2Dies = deaths.contains(room.getLover2Id());
            if (lover1Dies && !lover2Dies) {
                deaths.add(room.getLover2Id());
            } else if (lover2Dies && !lover1Dies) {
                deaths.add(room.getLover1Id());
            }
        }

        return deaths;
    }

    /**
     * Check Idiot du Village survival on vote elimination.
     */
    public boolean checkIdiotSurvival(GameRoom room, String playerId) {
        return room.findPlayer(playerId)
                .filter(p -> p.getRole() == Role.IDIOT_DU_VILLAGE && p.isAlive() && !room.isIdiotRevealed())
                .isPresent();
    }

    public WinResult checkWinCondition(GameRoom room) {
        List<Player> alive = room.getAlivePlayers();
        long wolves = alive.stream()
                .filter(p -> p.getRole() == Role.LOUP_GAROU || p.getRole() == Role.LOUP_BLANC)
                .count();
        long villagers = alive.stream()
                .filter(p -> p.getRole() != Role.LOUP_GAROU && p.getRole() != Role.LOUP_BLANC)
                .count();

        if (wolves == 0) return WinResult.VILLAGE_WINS;
        if (wolves >= villagers) return WinResult.LOUPS_WIN;

        long whiteWolves = alive.stream()
                .filter(p -> p.getRole() == Role.LOUP_BLANC)
                .count();
        if (whiteWolves > 0 && alive.size() == 1) return WinResult.LOUP_BLANC_WINS;

        // Lover win
        if (room.getLover1Id() != null && room.getLover2Id() != null) {
            boolean lover1Alive = alive.stream().anyMatch(p -> p.getId().equals(room.getLover1Id()));
            boolean lover2Alive = alive.stream().anyMatch(p -> p.getId().equals(room.getLover2Id()));
            if (lover1Alive && lover2Alive && alive.size() == 2) {
                return WinResult.LOVERS_WIN;
            }
        }

        return WinResult.CONTINUE;
    }

    public enum WinResult {
        VILLAGE_WINS, LOUPS_WIN, LOUP_BLANC_WINS, LOVERS_WIN, CONTINUE
    }
}
