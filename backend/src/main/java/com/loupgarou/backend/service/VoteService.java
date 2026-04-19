package com.loupgarou.backend.service;

import com.loupgarou.backend.model.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class VoteService {

    public void addVote(GameRoom room, String voterId, String targetId) {
        room.getVotes().removeIf(v -> v.getVoterId().equals(voterId));
        room.getVotes().add(Vote.builder()
                .voterId(voterId)
                .targetId(targetId)
                .phase(room.getPhase())
                .build());
    }

    /**
     * Tally votes with Capitaine double-vote support.
     * Returns the winner, or empty if there's a tie.
     */
    public Optional<String> tallyVotes(GameRoom room) {
        Map<String, Long> counts = new HashMap<>();
        for (Vote v : room.getVotes()) {
            // Capitaine's vote counts double
            long weight = 1;
            Optional<Player> voter = room.findPlayer(v.getVoterId());
            if (voter.isPresent() && voter.get().getRole() == Role.CAPITAINE && voter.get().isAlive()) {
                weight = 2;
            }
            counts.merge(v.getTargetId(), weight, Long::sum);
        }

        if (counts.isEmpty()) return Optional.empty();

        long maxVotes = counts.values().stream().max(Long::compareTo).orElse(0L);

        // Check for ties
        List<String> topCandidates = counts.entrySet().stream()
                .filter(e -> e.getValue() == maxVotes)
                .map(Map.Entry::getKey)
                .toList();

        if (topCandidates.size() > 1) {
            // Tie — return empty, narrator must decide
            return Optional.empty();
        }

        return Optional.of(topCandidates.get(0));
    }

    /**
     * Get vote counts with capitaine weight for display.
     */
    public Map<String, Long> getWeightedCounts(GameRoom room) {
        Map<String, Long> counts = new HashMap<>();
        for (Vote v : room.getVotes()) {
            long weight = 1;
            Optional<Player> voter = room.findPlayer(v.getVoterId());
            if (voter.isPresent() && voter.get().getRole() == Role.CAPITAINE && voter.get().isAlive()) {
                weight = 2;
            }
            counts.merge(v.getTargetId(), weight, Long::sum);
        }
        return counts;
    }

    public void clearVotes(GameRoom room) {
        room.getVotes().clear();
    }

    public int getVoteCount(GameRoom room) {
        return room.getVotes().size();
    }
}
