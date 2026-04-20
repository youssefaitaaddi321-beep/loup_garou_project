import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

const ADVANCED_ROLES = [
  { value: 'CHASSEUR',         label: 'Chasseur',           desc: 'Tire une flèche à sa mort' },
  { value: 'CUPIDON',          label: 'Cupidon',            desc: 'Lie deux amoureux' },
  { value: 'PETITE_FILLE',     label: 'Petite Fille',       desc: 'Espionner les loups (risqué)' },
  { value: 'CAPITAINE',        label: 'Capitaine',          desc: 'Vote double' },
  { value: 'IDIOT_DU_VILLAGE', label: 'Idiot du Village',   desc: 'Survit au vote une fois' },
  { value: 'LOUP_BLANC',       label: 'Loup Blanc',         desc: 'Élimine les loups la nuit' },
];

export default function LobbyPage({ onJoinRoom }) {
  const { state, dispatch } = useGame();
  const [rooms, setRooms] = useState([]);
  const [tab, setTab] = useState('browse');
  const [form, setForm] = useState({
    name: '', maxPlayers: 10, advancedRoles: false, password: ''
  });
  const [extraRoles, setExtraRoles] = useState([]);
  const [wolfCount, setWolfCount] = useState(2);
  const [joinCode, setJoinCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordPrompt, setPasswordPrompt] = useState(null);
  const [browsePassword, setBrowsePassword] = useState('');

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/rooms');
      const data = await res.json();
      setRooms(data);
    } catch {
      console.error('Erreur chargement parties');
    }
  };

  const toggleExtraRole = (role) => {
    setExtraRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const createRoom = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:8080/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          narratorUsername: state.player.username,
          extraRoles: form.advancedRoles ? extraRoles : [],
          wolfCount: form.maxPlayers > 10 ? wolfCount : 2,
        }),
      });
      const room = await res.json();
      dispatch({ type: 'SET_ROOM', payload: room });
      const narrator = room.players.find(p => p.narrator);
      dispatch({ type: 'SET_PLAYER', payload: narrator });
      onJoinRoom(room.id);
    } catch {
      setError('Erreur lors de la création');
    }
  };

  const joinRoom = async (roomId, password = '') => {
    setError('');
    try {
      const res = await fetch(`http://localhost:8080/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: state.player.username, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Erreur');
        return;
      }
      const room = await res.json();
      dispatch({ type: 'SET_ROOM', payload: room });
      const me = room.players.find(p => p.username === state.player.username && !p.narrator);
      dispatch({ type: 'SET_PLAYER', payload: me || state.player });
      onJoinRoom(room.id);
    } catch {
      setError('Erreur lors de la connexion');
    }
  };

  const joinByCode = (e) => {
    e.preventDefault();
    joinRoom(joinCode.toUpperCase(), joinPassword);
  };

  const roleLabel = (r) => r?.advancedRoles ? 'Avancé' : 'Basique';
  const stateLabel = (s) => ({ WAITING: 'En attente', IN_PROGRESS: 'En cours', FINISHED: 'Terminée' }[s] || s);
  const stateBadge = (s) => ({
    WAITING: 'bg-purple-900 text-purple-300',
    IN_PROGRESS: 'bg-green-900 text-green-300',
    FINISHED: 'bg-gray-700 text-gray-400'
  }[s] || '');

  const currentWolves = form.advancedRoles ? wolfCount : 2;
  const baseRoleCount = currentWolves + 3; // wolves + voyante + sorcière + salvateur
  const remainingSlots = form.maxPlayers - baseRoleCount - extraRoles.length;

  return (
    <div className="min-h-screen bg-night-950 p-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-moon-300">Loup-Garou</h1>
            <p className="text-moon-400 opacity-50 text-sm">
              Connecté en tant que <span className="text-wolf-400">{state.player?.username}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-wolf-400 flex items-center justify-center font-bold text-white">
            {state.player?.username?.[0]?.toUpperCase()}
          </div>
        </div>

        <div className="bg-night-800 rounded-2xl border border-night-600 overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-night-600">
            {['browse', 'create', 'join'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-medium transition-colors
                  ${tab === t
                    ? 'text-wolf-400 border-b-2 border-wolf-400 bg-night-900'
                    : 'text-moon-400 opacity-50 hover:opacity-80'}`}>
                {t === 'browse' ? 'Parcourir' : t === 'create' ? 'Créer une partie' : 'Rejoindre par code'}
              </button>
            ))}
          </div>

          <div className="p-4">
            {/* Password prompt modal */}
            {passwordPrompt && (
              <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
                <div className="bg-night-800 border border-night-600 rounded-2xl p-6 w-80">
                  <h3 className="text-moon-300 font-bold text-base mb-1">🔒 Partie protégée</h3>
                  <p className="text-moon-400 opacity-50 text-xs mb-4">
                    Entrez le mot de passe pour rejoindre
                  </p>
                  <input
                    type="password"
                    value={browsePassword}
                    onChange={e => setBrowsePassword(e.target.value)}
                    placeholder="Mot de passe"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        joinRoom(passwordPrompt, browsePassword);
                        setPasswordPrompt(null);
                      }
                    }}
                    className="w-full bg-night-900 border border-night-600 text-moon-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-wolf-400"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setPasswordPrompt(null); setBrowsePassword(''); }}
                      className="flex-1 bg-night-900 text-moon-400 border border-night-600 py-2 rounded-lg text-sm transition-colors hover:border-night-500">
                      Annuler
                    </button>
                    <button
                      onClick={() => {
                        joinRoom(passwordPrompt, browsePassword);
                        setPasswordPrompt(null);
                      }}
                      className="flex-1 bg-wolf-400 hover:bg-wolf-500 text-white font-bold py-2 rounded-lg text-sm transition-colors">
                      Rejoindre
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ===== BROWSE TAB ===== */}
            {tab === 'browse' && (
              <div>
                <p className="text-moon-400 opacity-50 text-sm mb-3">
                  {rooms.length} partie(s) disponible(s)
                </p>
                {rooms.length === 0 ? (
                  <p className="text-center text-moon-400 opacity-30 py-8">
                    Aucune partie disponible.<br/>Créez-en une !
                  </p>
                ) : (
                  rooms.map(room => (
                    <div key={room.id} className="flex items-center gap-3 p-3 bg-night-900 rounded-xl mb-2">
                      <div className="w-9 h-9 rounded-lg bg-wolf-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {room.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-moon-300 text-sm">{room.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${stateBadge(room.state)}`}>
                            {stateLabel(room.state)}
                          </span>
                        </div>
                        <p className="text-xs text-moon-400 opacity-50 mt-0.5">
                          {room.players?.length}/{room.maxPlayers} joueurs · {roleLabel(room)}
                          {room.hasPassword && ' · 🔒'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (room.hasPassword) {
                            setPasswordPrompt(room.id);
                            setBrowsePassword('');
                            setError('');
                          } else {
                            joinRoom(room.id);
                          }
                        }}
                        disabled={room.state !== 'WAITING'}
                        className="bg-wolf-400 hover:bg-wolf-500 disabled:opacity-30
                                   disabled:cursor-not-allowed text-white text-sm px-3 py-1.5
                                   rounded-lg transition-colors flex-shrink-0">
                        Rejoindre
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ===== CREATE TAB ===== */}
            {tab === 'create' && (
              <form onSubmit={createRoom} className="space-y-4">

                {/* Room name */}
                <div>
                  <label className="block text-moon-400 text-xs mb-1">Nom de la partie</label>
                  <input
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="La Forêt Maudite..." required
                    className="w-full bg-night-900 border border-night-600 text-moon-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-wolf-400" />
                </div>

                {/* Player count + mode */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-moon-400 text-xs mb-1">Nombre de joueurs</label>
                    <select
                      value={form.maxPlayers}
                      onChange={e => {
                        const n = +e.target.value;
                        setForm({...form, maxPlayers: n, advancedRoles: n > 10 ? form.advancedRoles : false});
                        if (n <= 10) setExtraRoles([]);
                      }}
                      className="w-full bg-night-900 border border-night-600 text-moon-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-wolf-400">
                      {[6,7,8,9,10,11,12,14,16].map(n => (
                        <option key={n} value={n}>{n} joueurs</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-moon-400 text-xs mb-1">Mode</label>
                    <select
                      value={form.advancedRoles}
                      disabled={form.maxPlayers <= 10}
                      onChange={e => {
                        setForm({...form, advancedRoles: e.target.value === 'true'});
                        if (e.target.value === 'false') setExtraRoles([]);
                      }}
                      className="w-full bg-night-900 border border-night-600 text-moon-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-wolf-400 disabled:opacity-40">
                      <option value="false">Basique</option>
                      {form.maxPlayers > 10 && <option value="true">Avancé</option>}
                    </select>
                    {form.maxPlayers <= 10 && (
                      <p className="text-xs text-moon-400 opacity-40 mt-1">
                        Mode avancé: 11+ joueurs
                      </p>
                    )}
                  </div>
                </div>

                {/* Base roles — always shown */}
                <div className="bg-night-900 rounded-xl p-3">
                  <p className="text-xs text-moon-400 opacity-60 mb-2">
                    Rôles de base (toujours inclus)
                  </p>
                  {form.maxPlayers > 10 && (
                    <div className="flex items-center gap-3 mb-3">
                      <label className="text-xs text-moon-400">🐺 Nombre de Loups-Garous :</label>
                      <select
                        value={wolfCount}
                        onChange={e => setWolfCount(+e.target.value)}
                        className="bg-night-800 border border-night-600 text-moon-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-wolf-400">
                        {[2,3,4,5].map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {[`🐺 Loup-Garou x${form.advancedRoles ? wolfCount : 2}`, '🔮 Voyante', '🧙 Sorcière', '🛡️ Salvateur'].map(r => (
                      <span key={r}
                        className="text-xs bg-night-800 text-moon-300 px-2 py-1 rounded-lg border border-night-600">
                        {r}
                      </span>
                    ))}
                    <span className="text-xs bg-night-800 text-moon-400 opacity-50 px-2 py-1 rounded-lg border border-night-600 border-dashed">
                      + {Math.max(0, remainingSlots)} Villageois
                    </span>
                  </div>
                </div>

                {/* Advanced role picker — only shown for 11+ players in advanced mode */}
                {form.advancedRoles && form.maxPlayers > 10 && (
                  <div className="bg-night-900 rounded-xl p-3">
                    <p className="text-xs text-moon-400 opacity-60 mb-2">
                      Rôles supplémentaires
                      <span className="ml-2 text-wolf-400">
                        ({extraRoles.length} sélectionné{extraRoles.length > 1 ? 's' : ''})
                      </span>
                    </p>
                    <div className="space-y-1.5">
                      {ADVANCED_ROLES.map(role => {
                        const isSelected = extraRoles.includes(role.value);
                        const isDisabled = !isSelected && remainingSlots <= 0;
                        return (
                          <div
                            key={role.value}
                            onClick={() => !isDisabled && toggleExtraRole(role.value)}
                            className={`flex items-center gap-3 p-2 rounded-lg transition-colors
                              ${isSelected
                                ? 'bg-wolf-400 bg-opacity-20 border border-wolf-400 border-opacity-50'
                                : 'bg-night-800 border border-night-600 hover:border-night-500'}
                              ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors
                              ${isSelected ? 'bg-wolf-400 border-wolf-400' : 'border-night-500'}`}>
                              {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-medium text-moon-300">{role.label}</span>
                              <span className="text-xs text-moon-400 opacity-50 ml-2">{role.desc}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {remainingSlots <= 0 && (
                      <p className="text-xs text-wolf-400 opacity-70 mt-2 text-center">
                        Toutes les places sont assignées à des rôles
                      </p>
                    )}
                  </div>
                )}

                {/* Password */}
                <div>
                  <label className="block text-moon-400 text-xs mb-1">Mot de passe (optionnel)</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    placeholder="Laisser vide pour partie publique"
                    className="w-full bg-night-900 border border-night-600 text-moon-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-wolf-400" />
                </div>

                {/* Narrator info */}
                <div className="bg-night-900 rounded-lg p-3 text-xs text-moon-400">
                  Vous serez le <span className="text-wolf-400 font-bold">Narrateur</span> de cette partie.
                </div>

                <button type="submit"
                  className="w-full bg-wolf-400 hover:bg-wolf-500 text-white font-bold py-2.5 rounded-lg transition-colors">
                  Créer la partie
                </button>
              </form>
            )}

            {/* ===== JOIN BY CODE TAB ===== */}
            {tab === 'join' && (
              <form onSubmit={joinByCode} className="space-y-4">
                <div>
                  <label className="block text-moon-400 text-xs mb-1">Code de la partie</label>
                  <input
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ex: W3LF42" maxLength={6} required
                    className="w-full bg-night-900 border border-night-600 text-moon-300 rounded-lg px-3 py-2 text-sm text-center tracking-widest font-mono focus:outline-none focus:border-wolf-400" />
                </div>
                <div>
                  <label className="block text-moon-400 text-xs mb-1">Mot de passe (si requis)</label>
                  <input
                    type="password"
                    value={joinPassword}
                    onChange={e => setJoinPassword(e.target.value)}
                    placeholder="Laisser vide si aucun"
                    className="w-full bg-night-900 border border-night-600 text-moon-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-wolf-400" />
                </div>
                <button type="submit"
                  className="w-full bg-wolf-400 hover:bg-wolf-500 text-white font-bold py-2.5 rounded-lg transition-colors">
                  Rejoindre
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}