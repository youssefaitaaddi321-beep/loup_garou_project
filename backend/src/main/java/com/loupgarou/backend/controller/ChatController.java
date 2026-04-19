package com.loupgarou.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messaging;
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    @MessageMapping("/chat/public")
    public void handlePublicMessage(Map<String, String> payload) {
        String roomId = payload.get("roomId");
        Map<String, Object> msg = new HashMap<>();
        msg.put("senderId", payload.get("senderId"));
        msg.put("senderName", payload.get("senderName"));
        msg.put("message", payload.get("message"));
        msg.put("time", LocalTime.now().format(TIME_FMT));
        msg.put("type", "PUBLIC");
        MessageHelper.send(messaging, "/topic/chat/public/" + roomId, (Object) msg);
    }

    @MessageMapping("/chat/wolves")
    public void handleWolvesMessage(Map<String, String> payload) {
        String roomId = payload.get("roomId");
        Map<String, Object> msg = new HashMap<>();
        msg.put("senderId", payload.get("senderId"));
        msg.put("senderName", payload.get("senderName"));
        msg.put("message", payload.get("message"));
        msg.put("time", LocalTime.now().format(TIME_FMT));
        msg.put("type", "WOLVES");
        MessageHelper.send(messaging, "/topic/chat/wolves/" + roomId, (Object) msg);
    }
}