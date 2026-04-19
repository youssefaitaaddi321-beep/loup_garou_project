package com.loupgarou.backend.controller;

import com.loupgarou.backend.service.GameService;
import com.loupgarou.backend.service.VoteService;
import com.loupgarou.backend.store.InMemoryGameStore;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;
    private final VoteService voteService;
    private final InMemoryGameStore store;
    private final SimpMessagingTemplate messaging;

    @MessageMapping("/game/vote")
    public void handleVote(Map<String, String> payload) {
        String roomId = payload.get("roomId");
        String voterId = payload.get("voterId");
        String targetId = payload.get("targetId");

        store.findById(roomId).ifPresent(room -> {
            voteService.addVote(room, voterId, targetId);
            store.save(room);
            Map<String, Object> msg = new HashMap<>();
            msg.put("voterId", voterId);
            msg.put("targetId", targetId);
            msg.put("totalVotes", voteService.getVoteCount(room));
            msg.put("alivePlayers", room.getAlivePlayers().size());
            MessageHelper.send(messaging, "/topic/vote/" + roomId, (Object) msg);
        });
    }

    @MessageMapping("/game/seer-action")
    public void handleSeerAction(Map<String, String> payload) {
        String roomId = payload.get("roomId");
        String targetId = payload.get("targetId");
        String seerUserId = payload.get("seerUserId");

        store.findById(roomId).ifPresent(room ->
            room.findPlayer(targetId).ifPresent(target -> {
                Map<String, Object> msg = new HashMap<>();
                msg.put("targetId", targetId);
                msg.put("targetUsername", target.getUsername());
                msg.put("role", target.getRole().name());
                MessageHelper.sendToUser(messaging, seerUserId, "/queue/seer/" + seerUserId, (Object) msg);
            })
        );
    }
}