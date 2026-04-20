import { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import LoginPage from './pages/LoginPage';
import LobbyPage from './pages/LobbyPage';
import WaitingRoom from './pages/WaitingRoom';
import GamePage from './pages/GamePage';

function AppContent() {
  const { state, dispatch } = useGame();
  const [screen, setScreen] = useState('login');
  const [roomId, setRoomId] = useState(null);

  const handleLogin = (username) => {
    dispatch({ type: 'SET_PLAYER', payload: { username, id: null, narrator: false } });
    setScreen('lobby');
  };

  const handleJoinRoom = (id) => {
    setRoomId(id);
    setScreen('waiting');
  };

  const handleGameStart = () => {
    setScreen('game');
  };

  if (screen === 'login')   return <LoginPage onLogin={handleLogin} />;
  if (screen === 'lobby')   return <LobbyPage onJoinRoom={handleJoinRoom} />;
  if (screen === 'waiting') return <WaitingRoom roomId={roomId} onGameStart={handleGameStart} />;
  if (screen === 'game')    return <GamePage roomId={roomId} />;
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}
