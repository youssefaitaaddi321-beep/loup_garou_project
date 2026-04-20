import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function WaitingRoom({ roomId, onGameStart }) {
  const { state, dispatch } = useGame();
  const [room, setRoom]     = useState(state.room);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 3000,
      onConnect: () => {
        client.subscribe(`/topic/game/${roomId}`, (msg) => {
          const data = JSON.parse(msg.body);
          dispatch({ type: 'GAME_UPDATE', payload: data });
          if (data.phase && data.phase !== 'LOBBY') onGameStart();
        });
        client.subscribe(`/topic/lobby-update/${roomId}`, (msg) => {
          const data = JSON.parse(msg.body);
          setRoom(data);
          dispatch({ type: 'SET_ROOM', payload: data });
        });
      },
    });
    client.activate();
    return () => client.deactivate();
  }, [roomId]);

  useEffect(() => {
    fetchRoom();
    const interval = setInterval(fetchRoom, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchRoom = async () => {
    try {
      const res  = await fetch(`http://localhost:8080/api/rooms/${roomId}`);
      const data = await res.json();
      setRoom(data);
      dispatch({ type: 'SET_ROOM', payload: data });
      if (data.state === 'IN_PROGRESS') onGameStart();
    } catch(e) { console.error(e); }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startGame = async () => {
    try { await fetch(`http://localhost:8080/api/rooms/${roomId}/start`, { method: 'POST' }); }
    catch(e) { console.error(e); }
  };

  const players    = room?.players?.filter(p => !p.narrator) || [];
  const narrator   = room?.players?.find(p => p.narrator);
  const maxPlayers = room?.maxPlayers || 10;
  const isNarrator = state.player?.narrator;
  const fillPercent = Math.round((players.length / maxPlayers) * 100);

  const COLORS = [
    ['#7c3aed','#ddd6fe'], ['#1d4ed8','#bfdbfe'], ['#0f766e','#99f6e4'],
    ['#15803d','#bbf7d0'], ['#b45309','#fde68a'], ['#c2410c','#fed7aa'],
    ['#be123c','#fecdd3'], ['#7e22ce','#f3e8ff'],
  ];

  return (
    <div className="h-full flex flex-col safe-top safe-bottom" style={{ background: '#0a0a0f' }}>

      {/* Header */}
      <div className="px-4 py-3 flex-shrink-0 text-center"
        style={{ background: '#0f0f1a', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize: 32 }}>🐺</p>
        <h1 className="font-bold text-lg mt-1" style={{ color: '#f5e6ca' }}>{room?.name}</h1>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(245,230,202,0.4)' }}>
          Salle d'attente · {room?.advancedRoles ? 'Rôles avancés' : 'Rôles basiques'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scroll-smooth p-4 space-y-3">

        {/* Room code */}
        <div className="rounded-2xl p-4 text-center"
          style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'rgba(245,230,202,0.3)' }}>
            Code de la partie
          </p>
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-3xl font-mono font-bold tracking-widest" style={{ color: '#e94560' }}>
              {roomId}
            </span>
            <button onClick={copyCode}
              className="text-xs px-3 py-1.5 rounded-xl transition-all active:scale-95"
              style={{
                background: copied ? 'rgba(5,150,105,0.2)' : 'rgba(255,255,255,0.06)',
                color: copied ? '#6ee7b7' : 'rgba(245,230,202,0.5)',
                border: `1px solid ${copied ? 'rgba(5,150,105,0.4)' : 'rgba(255,255,255,0.1)'}`,
                cursor: 'pointer',
              }}>
              {copied ? '✓ Copié !' : 'Copier'}
            </button>
          </div>
          <p className="text-xs" style={{ color: 'rgba(245,230,202,0.25)' }}>
            Partagez ce code avec vos amis
          </p>
        </div>

        {/* Player count */}
        <div className="rounded-2xl p-4"
          style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: '#f5e6ca' }}>Joueurs connectés</span>
            <span className="text-sm font-bold" style={{ color: '#e94560' }}>
              {players.length} / {maxPlayers}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full rounded-full h-2 mb-4" style={{ background: '#0f0f1a' }}>
            <div className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${fillPercent}%`, background: 'linear-gradient(90deg, #e94560, #c73652)' }} />
          </div>
          {/* Narrator row */}
          {narrator && (
            <div className="flex items-center gap-2.5 mb-3 pb-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: '#e94560' }}>
                {narrator?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <span className="text-sm font-medium" style={{ color: '#f5e6ca' }}>{narrator?.username}</span>
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(233,69,96,0.15)', color: '#e94560' }}>
                  Narrateur
                </span>
              </div>
            </div>
          )}
          {/* Players grid */}
          <div className="grid grid-cols-2 gap-2">
            {players.map((player, i) => {
              const [bg, text] = COLORS[i % COLORS.length];
              return (
                <div key={player.id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: '#0f0f1a' }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: bg, color: text }}>
                    {player.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-xs truncate" style={{ color: '#f5e6ca' }}>{player.username}</span>
                  {player.username === state.player?.username && (
                    <span className="text-[9px] ml-auto" style={{ color: '#e94560' }}>Vous</span>
                  )}
                </div>
              );
            })}
            {/* Empty slots */}
            {Array.from({ length: Math.max(0, maxPlayers - players.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: '#0f0f1a', border: '1px dashed rgba(255,255,255,0.06)' }}>
                <div className="w-7 h-7 rounded-full flex-shrink-0" style={{ background: '#1a1a2e' }} />
                <span className="text-xs" style={{ color: 'rgba(245,230,202,0.2)' }}>Libre...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action area */}
        {isNarrator ? (
          <div className="rounded-2xl p-4" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs text-center mb-3" style={{ color: 'rgba(245,230,202,0.35)' }}>
              Vous pouvez lancer la partie avec minimum 2 joueurs
            </p>
            <button
              disabled={players.length < 2}
              onClick={startGame}
              className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-98"
              style={{
                background: players.length >= 2 ? 'linear-gradient(135deg,#e94560 0%,#c73652 100%)' : 'rgba(255,255,255,0.06)',
                color: players.length >= 2 ? 'white' : 'rgba(255,255,255,0.2)',
                border: 'none', cursor: players.length >= 2 ? 'pointer' : 'not-allowed',
                boxShadow: players.length >= 2 ? '0 4px 20px rgba(233,69,96,0.3)' : 'none',
              }}
            >
              {players.length < 2 ? `Attendre ${2 - players.length} joueur(s)` : `🐺 Lancer la partie (${players.length} joueurs)`}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl p-5 text-center" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-center gap-1.5 mb-2">
              {[0, 0.2, 0.4].map((d, i) => (
                <div key={i} className="w-2 h-2 rounded-full animate-pulse-wolf"
                  style={{ background: '#e94560', animationDelay: `${d}s` }} />
              ))}
            </div>
            <p className="text-sm" style={{ color: 'rgba(245,230,202,0.4)' }}>
              En attente du narrateur...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
