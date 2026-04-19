package com.loupgarou.backend.controller;

import org.springframework.messaging.simp.SimpMessagingTemplate;

public class MessageHelper {

    public static void send(SimpMessagingTemplate m, String dest, Object payload) {
        m.convertAndSend(dest, payload);
    }

    public static void sendToUser(SimpMessagingTemplate m, String user, String dest, Object payload) {
        m.convertAndSendToUser(user, dest, payload);
    }
}