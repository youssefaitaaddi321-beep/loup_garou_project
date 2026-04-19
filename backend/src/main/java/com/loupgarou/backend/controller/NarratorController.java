package com.loupgarou.backend.controller;

import com.loupgarou.backend.model.*;
import com.loupgarou.backend.service.GameEngine;
import com.loupgarou.backend.service.GameService;
import com.loupgarou.backend.service.VoteService;
import com.loupgarou.backend.store.InMemoryGameStore;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Controller
@RequiredArgsConstructor
public class NarratorController {

    private final GameService gameService;
    private final GameEngine gameEngine;
    private final VoteService voteService;
    private final InMemoryGameStore store;
    private final SimpMessagingTemplate messaging;

    @MessageMapping("/narrator/start")
    public void startGame(Map<String, String> payload) {
        String roomId = payload.get("roomId");
        GameRoom room = gameService.startGame(roomId);

        Map<String, Object> msg = new HashMap<>();
        msg.put("roomId", roomId);
        msg.put("phase", room.getPhase().name());
        msg.put("state", room.getState().name());
        msg.put("alivePlayers", room.getAlivePlayers());
        msg.put("players", room.getPlayers());
        msg.put("announcement", "La partie commence... La nuit tombe sur le village.");
        MessageHelper.send(messaging, "/topic/game/" + roomId, (Object) msg);
    }

    @MessageMapping("/narrator/phase")
    public void switchPhase(Map<String, String> payload) {
        String roomId = payload.get("roomId");
        GamePhase phase = GamePhase.valueOf(payload.get("phase"));
        GameRoom room = gameService.switchPhase(roomId, phase);
        String announcement = switch (phase) {
            case NUIT -> "La nuit tombe sur le village... Fermez les yeux.";
            case JOUR -> "Le jour se lève. Qui a disparu cette nuit ?";
            case VOTE -> "Le village doit voter. Qui est le loup-garou ?";
            default -> "";
        };
        broadcast(roomId, room, announcement);
    }

    @MessageMapping("/narrator/eliminate")
    public void eliminatePlayer(Map<String, String> payload) {
        String roomId = payload.get("roomId");
        String playerId = payload.get("playerId");
        GameRoom room = gameService.eliminatePlayer(roomId, playerId);
        room.findPlayer(playerId).ifPresent(p -> {
            Map<String, Object> elimMsg = new HashMap<>();
            elimMsg.put("playerId", playerId);
            elimMsg.put("playerName", p.getUsername());
            elimMsg.put("role", p.getRole() != null ? p.getRole().name() : "INCONNU");
            elimMsg.put("phase", room.getPhase().name());
            MessageHelper.send(messaging, "/topic/eliminated/" + roomId, (Object) elimMsg);
        });

        room.findPlayer(playerId).ifPresent(p -> {
            if (p.getRole() == Role.CHASSEUR) {
                Map<String, Object> chasseurMsg = new HashMap<>();
                chasseurMsg.put("type", "CHASSEUR_SHOT");
                chasseurMsg.put("chasseurId", playerId);
                chasseurMsg.put("chasseurName", p.getUsername());
                MessageHelper.send(messaging, "/topic/night-call/" + roomId, (Object) chasseurMsg);
            }
        });

        broadcast(roomId, room, "Un joueur a été éliminé !");
    }

    @MessageMapping("/narrator/announce")
    public void announce(Map<String, String> payload) {
        String roomId = payload.get("roomId");
        String message = payload.get("message");
        store.findById(roomId).ifPresent(room -> {
            Map<String, Object> msg = new HashMap<>();
            msg.put("message", message);
            msg.put("phase", room.getPhase().name());
            MessageHelper.send(messaging, "/topic/narrator/" + roomId, (Object) msg);
        });
    }

    @MessageMapping("/narrator/close-vote")
    public void closeVote(Map<String, String> payload) {
        String roomId = payload.get("roomId");
        Optional<String> winnerId = gameService.processVotes(roomId);

        store.findById(roomId).ifPresent(room -> {
            Map<String, Object> result = new HashMap<>();

            if (winnerId.isEmpty()) {
                result.put("result", "TIE");
                result.put("message", "Égalité ! Personne n'est éliminé.");
                MessageHelper.send(messaging, "/topic/vote/" + roomId, (Object) result);
                return;
            }

            String id = winnerId.get();
            room.findPlayer(id).ifPresent(p -> {
                if (gameEngine.checkIdiotSurvival(room, id)) {
                    room.setIdiotRevealed(true);
                    store.save(room);

                    result.put("result", "IDIOT_SURVIVES");
                    result.put("eliminatedId", id);
                    result.put("eliminatedName", p.getUsername());
                    result.put("role", "IDIOT_DU_VILLAGE");
                    result.put("message", p.getUsername() + " est l'Idiot du Village ! Il survit mais perd son droit de vote.");
                    MessageHelper.send(messaging, "/topic/vote/" + roomId, (Object) result);
                    broadcast(roomId, room, p.getUsername() + " est l'Idiot du Village et survit !");
                    return;
                }

                gameService.eliminatePlayer(roomId, id);
                GameRoom updated = store.findById(roomId).orElse(room);

                result.put("result", "CLOSED");
                result.put("eliminatedId", id);
                result.put("eliminatedName", p.getUsername());
                result.put("role", p.getRole() != null ? p.getRole().name() : "INCONNU");
                MessageHelper.send(messaging, "/topic/vote/" + roomId, (Object) result);

                if (p.getRole() == Role.CHASSEUR) {
                    Map<String, Object> chasseurMsg = new HashMap<>();
                    chasseurMsg.put("type", "CHASSEUR_SHOT");
                    chasseurMsg.put("chasseurId", id);
                    chasseurMsg.put("chasseurName", p.getUsername());
                    MessageHelper.send(messaging, "/topic/night-call/" + roomId, (Object) chasseurMsg);
                }

                handleLoverDeath(roomId, updated, id);

                broadcast(roomId, updated, p.getUsername() + " a été éliminé par le village !");
            });
        });
    }

    @MessageMapping("/narrator/call-role")
    public void callRole(Map<String, String> payload) {
        String roomId = payload.get("roomId");
        String role = payload.get("role");

        store.findById(roomId).ifPresent(room -> {
            Map<String, Object> msg = new HashMap<>();
            msg.put("calledRole", role);
            msg.put("roomId", roomId);
            msg.put("players", room.getPlayers());
            msg.put("alivePlayers", room.getAlivePlayers());

            if (role.equals("SORCIERE") && room.getNightVictimId() != null) {
                msg.put("nightVictimId", room.getNightVictimId());
                room.findPlayer(room.getNightVictimId())
                    .ifPresent(p -> msg.put("nightVictimName", p.getUsername()));
            }

            msg.put("witchLifeUsed", room.isWitchLifeUsed());
            msg.put("witchDeathUsed", room.isWitchDeathUsed());

            if (role.equals("LOUP_BLANC")) {
                msg.put("isLoupBlancNight", room.isLoupBlancNight());
            }

            MessageHelper.send(messaging, "/topic/night-call/" + roomId, (Object) msg);

            // Notify narrator that a role is now acting
            Map<String, Object> acting = new HashMap<>();
            acting.put("type", "ROLE_ACTING");
            acting.put("role", role);
            String roleLabel = switch (role) {
                case "LOUP_GAROU" -> "Les Loups-Garous";
                case "VOYANTE" -> "La Voyante";
                case "SORCIERE" -> "La Sorcière";
                case "SALVATEUR" -> "Le Salvateur";
                case "CUPIDON" -> "Cupidon";
                case "PETITE_FILLE" -> "La Petite Fille";
                case "LOUP_BLANC" -> "Le Loup Blanc";
                default -> role;
            };
            acting.put("message", roleLabel + " est en train d'agir...");
            MessageHelper.send(messaging, "/topic/narrator-alert/" + roomId, (Object) acting);
        });
    }

    @MessageMapping("/narrator/night-summary")
    public void sendNightSummary(Map<String, String> payload) {
        String roomId = payload.get("roomId");
        store.findById(roomId).ifPresent(room -> {
            Map<String, Object> summary = new HashMap<>();

            List<String> deathIds = gameEngine.resolveNightDeaths(room);

            if (room.getNightVictimId() != null) {
                room.findPlayer(room.getNightVictimId()).ifPresent(p -> {
                    summary.put("wolfVictimId", p.getId());
                    summary.put("wolfVictimName", p.getUsername());
                });
            }

            if (room.getSavedVictimName() != null) {
                summary.put("witchSaved", true);
                summary.put("savedVictimName", room.getSavedVictimName());
            }

            if (room.getNightVictimId() != null && room.getProtectedPlayerId() != null
                    && room.getNightVictimId().equals(room.getProtectedPlayerId())) {
                summary.put("salvateurSaved", true);
            }

            if (room.getWitchKillTargetId() != null) {
                room.findPlayer(room.getWitchKillTargetId()).ifPresent(p -> {
                    summary.put("witchKillId", p.getId());
                    summary.put("witchKillName", p.getUsername());
                });
            }

            if (room.getProtectedPlayerId() != null) {
                room.findPlayer(room.getProtectedPlayerId()).ifPresent(p -> {
                    summary.put("protectedId", p.getId());
                    summary.put("protectedName", p.getUsername());
                });
            }

            if (room.getLoupBlancTargetId() != null) {
                room.findPlayer(room.getLoupBlancTargetId()).ifPresent(p -> {
                    summary.put("loupBlancKillId", p.getId());
                    summary.put("loupBlancKillName", p.getUsername());
                });
            }

            summary.put("witchLifeUsed", room.isWitchLifeUsed());
            summary.put("witchDeathUsed", room.isWitchDeathUsed());

            List<Map<String, String>> deaths = new ArrayList<>();
            for (String deathId : deathIds) {
                room.findPlayer(deathId).ifPresent(p -> {
                    Map<String, String> d = new HashMap<>();
                    d.put("id", p.getId());
                    d.put("name", p.getUsername());
                    d.put("role", p.getRole() != null ? p.getRole().name() : "VILLAGEOIS");

                    if (deathId.equals(room.getNightVictimId())) {
                        d.put("cause", "LOUPS");
                    } else if (deathId.equals(room.getWitchKillTargetId())) {
                        d.put("cause", "SORCIERE");
                    } else if (deathId.equals(room.getLoupBlancTargetId())) {
                        d.put("cause", "LOUP_BLANC");
                    } else if (deathId.equals(room.getLover1Id()) || deathId.equals(room.getLover2Id())) {
                        d.put("cause", "AMOUR");
                    } else {
                        d.put("cause", "INCONNU");
                    }
                    deaths.add(d);
                });
            }

            summary.put("deaths", deaths);
            MessageHelper.send(messaging, "/topic/night-summary/" + roomId, (Object) summary);
        });
    }

    @MessageMapping("/narrator/reveal-deaths")
    public void revealDeaths(Map<String, String> payload) {
        String roomId = payload.get("roomId");
        store.findById(roomId).ifPresent(room -> {
            List<String> deathIds = gameEngine.resolveNightDeaths(room);

            List<Map<String, String>> deaths = new ArrayList<>();
            for (String deathId : deathIds) {
                room.findPlayer(deathId).ifPresent(p -> {
                    gameEngine.eliminatePlayer(room, p.getId());
                    Map<String, String> d = new HashMap<>();
                    d.put("id", p.getId());
                    d.put("name", p.getUsername());
                    d.put("role", p.getRole() != null ? p.getRole().name() : "VILLAGEOIS");

                    if (deathId.equals(room.getNightVictimId())) {
                        d.put("cause", "LOUPS");
                    } else if (deathId.equals(room.getWitchKillTargetId())) {
                        d.put("cause", "SORCIERE");
                    } else if (deathId.equals(room.getLoupBlancTargetId())) {
                        d.put("cause", "LOUP_BLANC");
                    } else if (deathId.equals(room.getLover1Id()) || deathId.equals(room.getLover2Id())) {
                        d.put("cause", "AMOUR");
                    } else {
                        d.put("cause", "INCONNU");
                    }
                    deaths.add(d);
                });
            }

            room.resetNightActions();
            store.save(room);

            GameEngine.WinResult winResult = gameEngine.checkWinCondition(room);
            if (winResult != GameEngine.WinResult.CONTINUE) {
                room.setPhase(GamePhase.TERMINE);
                room.setState(GameState.FINISHED);
                room.setWinResult(winResult.name());
                store.save(room);
            }

            Map<String, Object> reveal = new HashMap<>();
            reveal.put("deaths", deaths);

            for (Map<String, String> d : deaths) {
                if ("CHASSEUR".equals(d.get("role"))) {
                    reveal.put("chasseurDied", true);
                    reveal.put("chasseurId", d.get("id"));
                    reveal.put("chasseurName", d.get("name"));
                }
            }

            MessageHelper.send(messaging, "/topic/death-reveal/" + roomId, (Object) reveal);

            GameRoom updated = store.findById(roomId).orElse(room);
            broadcast(roomId, updated, "Le jour se lève... Des habitants ont disparu cette nuit.");
        });
    }

    @MessageMapping("/night/wolves-target")
    public void wolvesTarget(Map<String, String> payload) {
        String roomId = payload.get("roomId");
        String targetId = payload.get("targetId");
        String wolfId = payload.get("wolfId");

        store.findById(roomId).ifPresent(room -> {
            // Record this wolf's vote
            room.getWolfVotes().put(wolfId, targetId);
            store.save(room);

            // Broadcast the vote to other wolves
            Map<String, Object> voteMsg = new HashMap<>();
            voteMsg.put("type", "WOLF_VOTE");
            voteMsg.put("wolfId", wolfId);
            voteMsg.put("targetId", targetId);
            room.findPlayer(wolfId).ifPresent(p -> voteMsg.put("wolfName", p.getUsername()));
            room.findPlayer(targetId).ifPresent(p -> voteMsg.put("targetName", p.getUsername()));
            voteMsg.put("totalWolves", room.getWolves().size());
            voteMsg.put("votesCount", room.getWolfVotes().size());
            MessageHelper.send(messaging, "/topic/night-result/" + roomId, (Object) voteMsg);

            // Check if all wolves have voted
            long aliveWolves = room.getWolves().size();
            if (room.getWolfVotes().size() >= aliveWolves) {
                // Tally wolf votes
                Map<String, Long> counts = new HashMap<>();
                for (String vid : room.getWolfVotes().values()) {
                    counts.merge(vid, 1L, Long::sum);
                }

                long maxVotes = counts.values().stream().max(Long::compareTo).orElse(0L);
                List<String> topTargets = counts.entrySet().stream()
                        .filter(e -> e.getValue() == maxVotes)
                        .map(Map.Entry::getKey)
                        .toList();

                Map<String, Object> resultMsg = new HashMap<>();

                if (topTargets.size() == 1) {
                    // Clear winner — set as victim
                    String victimId = topTargets.get(0);
                    room.setNightVictimId(victimId);
                    store.save(room);

                    resultMsg.put("type", "WOLVES_TARGET");
                    resultMsg.put("targetId", victimId);
                    room.findPlayer(victimId).ifPresent(p -> resultMsg.put("targetName", p.getUsername()));
                } else {
                    // Tie — no victim
                    room.setNightVictimId(null);
                    store.save(room);

                    resultMsg.put("type", "WOLVES_TIE");
                    resultMsg.put("message", "Les loups n'arrivent pas à se décider... Personne n'est attaqué.");
                }

                MessageHelper.send(messaging, "/topic/night-result/" + roomId, (Object) resultMsg);

                Map<String, Object> done = new HashMap<>();
                done.put("type", "ROLE_ACTION_DONE");
                done.put("role", "LOUP_GAROU");
                done.put("message", topTargets.size() == 1
                        ? "Les Loups-Garous ont choisi leur victime"
                        : "Les Loups-Garous n'ont pas pu se décider");
                MessageHelper.send(messaging, "/topic/narrator-alert/" + roomId, (Object) done);
            }
        });
    }

    @MessageMapping("/night/seer-action")
    public void seerAction(Map<String, String> payload) {
        String roomId = payload.get("roomId");
        String targetId = payload.get("targetId");
        String seerUserId = payload.get("seerUserId");

        store.findById(roomId).ifPresent(room ->
            room.findPlayer(targetId).ifPresent(target -> {
                Map<String, Object> msg = new HashMap<>();
                msg.put("type", "SEER_REVEAL");
                msg.put("targetId", targetId);
                msg.put("targetName", target.getUsername());
                msg.put("role", target.getRole() != null ? target.getRole().name() : "VILLAGEOIS");
                MessageHelper.send(messaging,
                        "/topic/seer-result/" + roomId + "/" + seerUserId, (Object) msg);

                Map<String, Object> done = new HashMap<>();
                done.put("type", "ROLE_ACTION_DONE");
                done.put("role", "VOYANTE");
                done.put("message", "La Voyante a consulté sa vision");
                MessageHelper.send(messaging, "/topic/narrator-alert/" + roomId, (Object) done);
            })
        );
    }

    @MessageMapping("/night/witch-save")
    public void witchSave(Map<String, String> payload) {
        String roomId = payload.get("roomId");
        store.findById(roomId).ifPresent(room -> {
            if (room.getNightVictimId() != null) {
                room.findPlayer(room.getNightVictimId())
                    .ifPresent(p -> room.setSavedVictimName(p.getUsername()));
            }
            room.setNightVictimId(null);
            room.setWitchLifeUsed(true);
            store.save(room);
            Map<String, Object> msg = new HashMap<>();
            msg.put("type", "WITCH_SAVED");
            MessageHelper.send(messaging, "/topic/night-result/" + roomId, (Object) msg);

            Map<String, Object> done = new HashMap<>();
            done.put("type", "ROLE_ACTION_DONE");
            done.put("role", "SORCIERE");
            done.put("message", "La Sorcière a utilisé sa potion de vie");
            MessageHelper.send(messaging, "/topic/narrator-alert/" + roomId, (Object) done);
        });
    }

    @MessageMapping("/night/witch-kill")
    public void witchKill(Map<String, String> payload) {
        String roomId = payload.get("roomId");
        String targetId = payload.get("targetId");
        store.findById(roomId).ifPresent(room -> {
            room.setWitchDeathUsed(true);
            room.setWitchKillTargetId(targetId);
            store.save(room);
            Map<String, Object> msg = new HashMap<>();
            msg.put("type", "WITCH_KILLED");
            msg.put("targetId", targetId);
            MessageHelper.send(messaging, "/topic/night-result/" + roomId, (Object) msg);

            Map<String, Object> done = new HashMap<>();
            done.put("type", "ROLE_ACTION_DONE");
            done.put("role", "SORCIERE");
            done.put("message", "La Sorcière a utilisé sa potion de mort");
            MessageHelper.send(messaging, "/topic/narrator-alert/" + roomId, (Object) done);
        });
    }

    @MessageMapping("/night/witch-pass")
    public void witchPass(Map<String, String> payload) {
        String roomId = payload.get("roomId");

        Map<String, Object> done = new HashMap<>();
        done.put("type", "ROLE_ACTION_DONE");
        done.put("role", "SORCIERE");
        done.put("message", "La Sorcière a fermé les yeux");
        MessageHelper.send(messaging, "/topic/narrator-alert/" + roomId, (Object) done);
    }

    @MessageMapping("/night/salvateur-protect")
    public void salvateurProtect(Map<String, String> payload) {
        String roomId = payload.get("roomId");
        String targetId = payload.get("targetId");
        store.findById(roomId).ifPresent(room -> {
            room.setProtectedPlayerId(targetId);
            store.save(room);
            Map<String, Object> msg = new HashMap<>();
            msg.put("type", "SALVATEUR_PROTECTED");
            msg.put("targetId", targetId);
            MessageHelper.send(messaging, "/topic/night-result/" + roomId, (Object) msg);

            Map<String, Object> done = new HashMap<>();
            done.put("type", "ROLE_ACTION_DONE");
            done.put("role", "SALVATEUR");
            done.put("message", "Le Salvateur a protégé quelqu'un");
            MessageHelper.send(messaging, "/topic/narrator-alert/" + roomId, (Object) done);
        });
    }

    @MessageMapping("/night/cupidon-link")
    public void cupidonLink(Map<String, String> payload) {
        String roomId = payload.get("roomId");
        String lover1Id = payload.get("lover1Id");
        String lover2Id = payload.get("lover2Id");
        store.findById(roomId).ifPresent(room -> {
            room.setLover1Id(lover1Id);
            room.setLover2Id(lover2Id);
            room.setCupidonUsed(true);
            store.save(room);
            Map<String, Object> msg = new HashMap<>();
            msg.put("type", "CUPIDON_LINKED");
            room.findPlayer(lover1Id).ifPresent(p -> msg.put("lover1Name", p.getUsername()));
            room.findPlayer(lover2Id).ifPresent(p -> msg.put("lover2Name", p.getUsername()));
            MessageHelper.send(messaging, "/topic/night-result/" + roomId, (Object) msg);

            Map<String, Object> done = new HashMap<>();
            done.put("type", "ROLE_ACTION_DONE");
            done.put("role", "CUPIDON");
            done.put("message", "Cupidon a lié deux amoureux");
            MessageHelper.send(messaging, "/topic/narrator-alert/" + roomId, (Object) done);
        });
    }

    @MessageMapping("/night/loup-blanc-kill")
    public void loupBlancKill(Map<String, String> payload) {
        String roomId = payload.get("roomId");
        String targetId = payload.get("targetId");
        store.findById(roomId).ifPresent(room -> {
            room.setLoupBlancTargetId(targetId);
            store.save(room);
            Map<String, Object> msg = new HashMap<>();
            msg.put("type", "LOUP_BLANC_KILL");
            msg.put("targetId", targetId);
            room.findPlayer(targetId).ifPresent(p -> msg.put("targetName", p.getUsername()));
            MessageHelper.send(messaging, "/topic/night-result/" + roomId, (Object) msg);

            Map<String, Object> done = new HashMap<>();
            done.put("type", "ROLE_ACTION_DONE");
            done.put("role", "LOUP_BLANC");
            done.put("message", "Le Loup Blanc a agi");
            MessageHelper.send(messaging, "/topic/narrator-alert/" + roomId, (Object) done);
        });
    }

    @MessageMapping("/night/loup-blanc-pass")
    public void loupBlancPass(Map<String, String> payload) {
        String roomId = payload.get("roomId");

        Map<String, Object> done = new HashMap<>();
        done.put("type", "ROLE_ACTION_DONE");
        done.put("role", "LOUP_BLANC");
        done.put("message", "Le Loup Blanc a fermé les yeux");
        MessageHelper.send(messaging, "/topic/narrator-alert/" + roomId, (Object) done);
    }
    
    @MessageMapping("/night/chasseur-shot")
    public void chasseurShot(Map<String, String> payload) {
        String roomId = payload.get("roomId");
        String targetId = payload.get("targetId");
        store.findById(roomId).ifPresent(room -> {
            gameEngine.eliminatePlayer(room, targetId);
            store.save(room);

            handleLoverDeath(roomId, room, targetId);

            GameEngine.WinResult winResult = gameEngine.checkWinCondition(room);
            if (winResult != GameEngine.WinResult.CONTINUE) {
                room.setPhase(GamePhase.TERMINE);
                room.setState(GameState.FINISHED);
                room.setWinResult(winResult.name());
                store.save(room);
            }

            Map<String, Object> msg = new HashMap<>();
            msg.put("type", "CHASSEUR_SHOT_RESULT");
            msg.put("targetId", targetId);
            room.findPlayer(targetId).ifPresent(p -> {
                msg.put("targetName", p.getUsername());
                msg.put("targetRole", p.getRole() != null ? p.getRole().name() : "INCONNU");
            });
            MessageHelper.send(messaging, "/topic/death-reveal/" + roomId, (Object) msg);
            broadcast(roomId, room, "Le chasseur a tiré sa dernière flèche !");
        });
    }

    private void handleLoverDeath(String roomId, GameRoom room, String deadPlayerId) {
        if (room.getLover1Id() == null || room.getLover2Id() == null) return;

        String otherLoverId = null;
        if (deadPlayerId.equals(room.getLover1Id())) {
            otherLoverId = room.getLover2Id();
        } else if (deadPlayerId.equals(room.getLover2Id())) {
            otherLoverId = room.getLover1Id();
        }

        if (otherLoverId != null) {
            String loverId = otherLoverId;
            room.findPlayer(loverId).ifPresent(lover -> {
                if (lover.isAlive()) {
                    gameEngine.eliminatePlayer(room, loverId);
                    store.save(room);

                    Map<String, Object> loverMsg = new HashMap<>();
                    loverMsg.put("type", "LOVER_DEATH");
                    loverMsg.put("playerId", loverId);
                    loverMsg.put("playerName", lover.getUsername());
                    loverMsg.put("role", lover.getRole() != null ? lover.getRole().name() : "INCONNU");
                    MessageHelper.send(messaging, "/topic/eliminated/" + roomId, (Object) loverMsg);
                }
            });
        }
    }

    private void broadcast(String roomId, GameRoom room, String announcement) {
        Map<String, Object> msg = new HashMap<>();
        msg.put("roomId", roomId);
        msg.put("phase", room.getPhase().name());
        msg.put("state", room.getState().name());
        msg.put("alivePlayers", room.getAlivePlayers());
        msg.put("players", room.getPlayers());
        msg.put("announcement", announcement);
        if (room.getWinResult() != null) {
            msg.put("winResult", room.getWinResult());
        }
        MessageHelper.send(messaging, "/topic/game/" + roomId, (Object) msg);
    }
}