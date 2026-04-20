import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useGame } from '../context/GameContext';

export function useWebSocket(roomId) {
  const clientRef = useRef(null);
  const { state, dispatch } = useGame();

  const connect = useCallback(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 3000,
      onConnect: () => {

        client.subscribe(`/topic/game/${roomId}`, (msg) => {
          dispatch({ type: 'GAME_UPDATE', payload: JSON.parse(msg.body) });
        });

        client.subscribe(`/topic/chat/public/${roomId}`, (msg) => {
          dispatch({ type: 'ADD_MESSAGE', payload: JSON.parse(msg.body) });
        });

        client.subscribe(`/topic/chat/wolves/${roomId}`, (msg) => {
          dispatch({ type: 'ADD_WOLVES_MESSAGE', payload: JSON.parse(msg.body) });
        });

        client.subscribe(`/topic/vote/${roomId}`, (msg) => {
          dispatch({ type: 'VOTE_UPDATE', payload: JSON.parse(msg.body) });
        });

        client.subscribe(`/topic/narrator/${roomId}`, (msg) => {
          const data = JSON.parse(msg.body);
          dispatch({ type: 'GAME_UPDATE', payload: { announcement: data.message } });
        });

        client.subscribe(`/topic/eliminated/${roomId}`, (msg) => {
          dispatch({ type: 'SET_ELIMINATED', payload: JSON.parse(msg.body) });
        });

        client.subscribe(`/topic/night-call/${roomId}`, (msg) => {
          dispatch({ type: 'SET_NIGHT_CALL', payload: JSON.parse(msg.body) });
        });

        client.subscribe(`/topic/narrator-alert/${roomId}`, (msg) => {
          dispatch({ type: 'SET_NARRATOR_ALERT', payload: JSON.parse(msg.body) });
        });

        client.subscribe(`/topic/night-result/${roomId}`, (msg) => {
          dispatch({ type: 'SET_NIGHT_RESULT', payload: JSON.parse(msg.body) });
        });

        client.subscribe(`/topic/night-summary/${roomId}`, (msg) => {
          dispatch({ type: 'SET_NIGHT_SUMMARY', payload: JSON.parse(msg.body) });
        });

        client.subscribe(`/topic/death-reveal/${roomId}`, (msg) => {
          const data = JSON.parse(msg.body);
          if (data.type === 'CHASSEUR_SHOT_RESULT') {
            dispatch({ type: 'SET_ELIMINATED', payload: {
              playerId: data.targetId,
              playerName: data.targetName,
              role: data.targetRole,
              type: 'CHASSEUR_SHOT_RESULT',
            }});
          } else {
            dispatch({ type: 'SET_DEATH_REVEAL', payload: data });
          }
        });

        if (state.player?.id) {
          client.subscribe(`/topic/seer-result/${roomId}/${state.player.id}`, (msg) => {
            dispatch({ type: 'SET_NIGHT_RESULT', payload: JSON.parse(msg.body) });
          });
        }
      },
    });

    client.activate();
    clientRef.current = client;
  }, [roomId, state.player?.id, dispatch]);

  const send = useCallback((destination, body) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: `/app${destination}`,
        body: JSON.stringify(body),
      });
    }
  }, []);

  useEffect(() => {
    if (roomId) connect();
    return () => clientRef.current?.deactivate();
  }, [roomId]);

  return { send };
}