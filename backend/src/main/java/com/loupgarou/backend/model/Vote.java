package com.loupgarou.backend.model;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Vote {
    private String voterId;
    private String targetId;
    private GamePhase phase;
}