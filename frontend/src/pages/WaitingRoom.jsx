import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function WaitingRoom({ roomId, onGameStart }) {
  const { state, dispatch } = useGame();
  const [room, setRoom] = useState(state.room);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 3000,
      onConnect: () => {
        client.subscribe(`/topic/game/${roomId}`, (msg) => {
          const data = JSON.parse(msg.body);
          dispatch({ type: 'GAME_UPDATE', payload: data });
          if (data.phase && data.phase !== 'LOBBY') {
            onGameStart();
          }
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
      const res = await fetch(`http://localhost:8080/api/rooms/${roomId}`);
      const data = await res.json();
      setRoom(data);
      dispatch({ type: 'SET_ROOM', payload: data });
      if (data.state === 'IN_PROGRESS') onGameStart();
    } catch (e) {
      console.error(e);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const players = room?.players?.filter(p => !p.narrator) || [];
  const narrator = room?.players?.find(p => p.narrator);
  const maxPlayers = room?.maxPlayers || 10;
  const isNarrator = state.player?.narrator;
  const fillPercent = Math.round((players.length / maxPlayers) * 100);

  const COLORS = [
    'bg-purple-800 text-purple-300',
    'bg-blue-800 text-blue-300',
    'bg-teal-800 text-teal-300',
    'bg-green-800 text-green-300',
    'bg-yellow-800 text-yellow-300',
    'bg-orange-800 text-orange-300',
    'bg-red-800 text-red-300',
    'bg-pink-800 text-pink-300',
  ];

  return (
    <div className="min-h-screen bg-night-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Room header */}
        <div className="text-center mb-8">
          <p className="text-wolf-400 text-4xl mb-2">🐺</p>
          <h1 className="text-2xl font-bold text-moon-300 mb-1">{room?.name}</h1>
          <p className="text-moon-400 opacity-50 text-sm">
            Salle d'attente · {room?.advancedRoles ? 'Rôles avancés' : 'Rôles basiques'}
          </p>
        </div>

        {/* Room code */}
        <div className="bg-night-800 border border-night-600 rounded-2xl p-4 mb-4 text-center">
          <p className="text-xs text-moon-400 opacity-50 mb-2 uppercase tracking-wide">
            Code de la partie
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-mono font-bold text-wolf-400 tracking-widest">
              {roomId}
            </span>
            <button onClick={copyCode}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors
                ${copied
                  ? 'border-green-600 text-green-400 bg-green-900'
                  : 'border-night-600 text-moon-400 hover:border-wolf-400 hover:text-wolf-400'}`}>
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>
          <p className="text-xs text-moon-400 opacity-40 mt-2">
            Partagez ce code avec vos amis
          </p>
        </div>

        {/* Player count + progress */}
        <div className="bg-night-800 border border-night-600 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-moon-300 font-medium">
              Joueurs connectés
            </span>
            <span className="text-sm font-bold text-wolf-400">
              {players.length} / {maxPlayers}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-night-900 rounded-full h-2 mb-4">
            <div
              className="bg-wolf-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${fillPercent}%` }}
            />
          </div>

          {/* Narrator */}
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-night-600">
            <div className="w-8 h-8 rounded-full bg-wolf-400 flex items-center justify-center text-white text-xs font-bold">
              {narrator?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <span className="text-sm text-moon-300 font-medium">{narrator?.username}</span>
              <span className="ml-2 text-xs bg-wolf-400 bg-opacity-20 text-wolf-400 px-2 py-0.5 rounded-full">
                Narrateur
              </span>
            </div>
          </div>

          {/* Players grid */}
          <div className="grid grid-cols-2 gap-2">
            {players.map((player, i) => (
              <div key={player.id}
                className="flex items-center gap-2 bg-night-900 rounded-xl px-3 py-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${COLORS[i % COLORS.length]}`}>
                  {player.username?.[0]?.toUpperCase()}
                </div>
                <span className="text-xs text-moon-300 truncate">{player.username}</span>
                {player.username === state.player?.username && (
                  <span className="text-xs text-wolf-400 ml-auto">Vous</span>
                )}
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: Math.max(0, maxPlayers - players.length) }).map((_, i) => (
              <div key={`empty-${i}`}
                className="flex items-center gap-2 bg-night-900 bg-opacity-50 rounded-xl px-3 py-2 border border-dashed border-night-600">
                <div className="w-7 h-7 rounded-full bg-night-800 flex-shrink-0" />
                <span className="text-xs text-moon-400 opacity-30">En attente...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Narrator controls / player waiting */}
        {isNarrator ? (
          <div className="bg-night-800 border border-night-600 rounded-2xl p-4">
            <p className="text-xs text-moon-400 opacity-50 mb-3 text-center">
              Vous pouvez lancer la partie avec minimum 2 joueurs
            </p>
            <button
              disabled={players.length < 2}
              onClick={async () => {
                try {
                  await fetch(`http://localhost:8080/api/rooms/${roomId}/start`, {
                    method: 'POST'
                  });
                } catch (e) {
                  console.error(e);
                }
              }}
              className="w-full bg-wolf-400 hover:bg-wolf-500 disabled:opacity-30
                         disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl
                         transition-colors text-sm">
              {players.length < 2
                ? `Attendre ${2 - players.length} joueur(s) de plus`
                : `Lancer la partie (${players.length} joueurs)`}
            </button>
          </div>
        ) : (
          <div className="bg-night-800 border border-night-600 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-moon-400 opacity-50">
              <div className="w-2 h-2 rounded-full bg-wolf-400 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-wolf-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 rounded-full bg-wolf-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
            <p className="text-sm text-moon-400 opacity-50 mt-2">
              En attente du narrateur...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}