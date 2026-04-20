import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

const ADVANCED_ROLES = [
  { value: 'CHASSEUR',         label: 'Chasseur',         icon: '🏹', desc: 'Tire une flèche à sa mort' },
  { value: 'CUPIDON',          label: 'Cupidon',          icon: '💘', desc: 'Lie deux amoureux' },
  { value: 'PETITE_FILLE',     label: 'Petite Fille',     icon: '👧', desc: 'Espionner les loups (risqué)' },
  { value: 'CAPITAINE',        label: 'Capitaine',        icon: '⚔️', desc: 'Vote double' },
  { value: 'IDIOT_DU_VILLAGE', label: 'Idiot du Village', icon: '🤡', desc: 'Survit au vote une fois' },
  { value: 'LOUP_BLANC',       label: 'Loup Blanc',       icon: '🤍', desc: 'Élimine les loups la nuit' },
];

export default function LobbyPage({ onJoinRoom }) {
  const { state, dispatch } = useGame();
  const [rooms, setRooms]             = useState([]);
  const [tab, setTab]                 = useState('browse');
  const [form, setForm]               = useState({ name: '', maxPlayers: 10, advancedRoles: false, password: '' });
  const [extraRoles, setExtraRoles]   = useState([]);
  const [wolfCount, setWolfCount]     = useState(2);
  const [joinCode, setJoinCode]       = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [error, setError]             = useState('');
  const [passwordPrompt, setPasswordPrompt] = useState(null);
  const [browsePassword, setBrowsePassword] = useState('');
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchRooms = async () => {
    try {
      const res  = await fetch('http://localhost:8080/api/rooms');
      setRooms(await res.json());
    } catch { /* silent */ }
  };

  const toggleExtraRole = (role) =>
    setExtraRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);

  const createRoom = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/rooms', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, narratorUsername: state.player.username,
          extraRoles: form.advancedRoles ? extraRoles : [],
          wolfCount: form.maxPlayers > 10 ? wolfCount : 2 }),
      });
      const room = await res.json();
      dispatch({ type: 'SET_ROOM', payload: room });
      dispatch({ type: 'SET_PLAYER', payload: room.players.find(p => p.narrator) });
      onJoinRoom(room.id);
    } catch { setError('Erreur lors de la création'); }
    finally { setLoading(false); }
  };

  const joinRoom = async (roomId, password = '') => {
    setError(''); setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/rooms/${roomId}/join`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: state.player.username, password }),
      });
      if (!res.ok) { const err = await res.json(); setError(err.error || 'Erreur'); return; }
      const room = await res.json();
      dispatch({ type: 'SET_ROOM', payload: room });
      dispatch({ type: 'SET_PLAYER', payload: room.players.find(p => p.username === state.player.username && !p.narrator) || state.player });
      onJoinRoom(room.id);
    } catch { setError('Erreur lors de la connexion'); }
    finally { setLoading(false); }
  };

  const joinByCode = (e) => { e.preventDefault(); joinRoom(joinCode.toUpperCase(), joinPassword); };
  const stateLabel = (s) => ({ WAITING: 'En attente', IN_PROGRESS: 'En cours', FINISHED: 'Terminée' }[s] || s);
  const stateBadgeStyle = (s) => ({
    WAITING:     { background: 'rgba(124,58,237,0.2)', color: '#a78bfa' },
    IN_PROGRESS: { background: 'rgba(5,150,105,0.2)',  color: '#6ee7b7' },
    FINISHED:    { background: 'rgba(55,65,81,0.4)',   color: '#9ca3af' },
  }[s] || {});
  const baseRoleCount  = (form.advancedRoles ? wolfCount : 2) + 3;
  const remainingSlots = form.maxPlayers - baseRoleCount - extraRoles.length;

  return (
    <div className="h-full flex flex-col safe-top safe-bottom" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: '#0f0f1a', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <h1 className="font-bold text-base" style={{ color: '#f5e6ca' }}>Loup-Garou</h1>
          <p className="text-xs" style={{ color: 'rgba(245,230,202,0.4)' }}>
            Connecté: <span style={{ color: '#e94560' }}>{state.player?.username}</span>
          </p>
        </div>
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
          style={{ background: '#e94560', color: 'white' }}>
          {state.player?.username?.[0]?.toUpperCase()}
        </div>
      </div>
      {/* Tabs */}
      <div className="flex flex-shrink-0"
        style={{ background: '#0f0f1a', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {[['browse','🔍 Parcourir'],['create','➕ Créer'],['join','🔑 Code']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className="flex-1 py-3 text-xs font-medium"
            style={{ background: 'transparent', border: 'none',
              borderBottom: tab === key ? '2px solid #e94560' : '2px solid transparent',
              color: tab === key ? '#e94560' : 'rgba(245,230,202,0.35)', cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>
      {error && (
        <div className="px-4 py-2 text-xs text-center flex-shrink-0"
          style={{ background: 'rgba(233,69,96,0.12)', color: '#fca5a5', borderBottom: '1px solid rgba(233,69,96,0.2)' }}>
          ⚠️ {error}
        </div>
      )}
      {/* Content */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        {/* BROWSE */}
        {tab === 'browse' && (
          <div className="p-4">
            <p className="text-xs mb-3" style={{ color: 'rgba(245,230,202,0.3)' }}>{rooms.length} partie(s) disponible(s)</p>
            {rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span style={{ fontSize: 40 }}>🏚️</span>
                <p className="text-sm text-center" style={{ color: 'rgba(245,230,202,0.3)' }}>Aucune partie disponible.<br/>Créez-en une !</p>
              </div>
            ) : rooms.map(room => (
              <div key={room.id} className="flex items-center gap-3 p-3 rounded-2xl mb-2"
                style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: 'rgba(233,69,96,0.2)', color: '#e94560' }}>
                  {room.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm font-medium truncate" style={{ color: '#f5e6ca' }}>{room.name}</span>
                    {room.hasPassword && <span style={{ fontSize: 11 }}>🔒</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={stateBadgeStyle(room.state)}>
                      {stateLabel(room.state)}
                    </span>
                    <span className="text-[10px]" style={{ color: 'rgba(245,230,202,0.3)' }}>
                      {room.players?.length}/{room.maxPlayers}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => room.hasPassword ? (setPasswordPrompt(room.id), setBrowsePassword(''), setError('')) : joinRoom(room.id)}
                  disabled={room.state !== 'WAITING' || loading}
                  className="px-4 py-2 rounded-xl text-xs font-bold flex-shrink-0 active:scale-95"
                  style={{ background: room.state==='WAITING'?'#e94560':'rgba(255,255,255,0.06)',
                    color: room.state==='WAITING'?'white':'rgba(255,255,255,0.2)', border:'none',
                    cursor: room.state==='WAITING'?'pointer':'not-allowed' }}>
                  Rejoindre
                </button>
              </div>
            ))}
          </div>
        )}
        {/* CREATE */}
        {tab === 'create' && (
          <form onSubmit={createRoom} className="p-4 space-y-4">
            <div>
              <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: 'rgba(245,230,202,0.4)' }}>Nom de la partie</label>
              <input value={form.name} onChange={e => setForm({...form,name:e.target.value})}
                placeholder="La Forêt Maudite..." required
                style={{ width:'100%',background:'#1a1a2e',border:'1px solid rgba(255,255,255,0.08)',color:'#f5e6ca',borderRadius:14,padding:'12px 14px',fontSize:15,outline:'none' }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: 'rgba(245,230,202,0.4)' }}>Joueurs</label>
                <select value={form.maxPlayers}
                  onChange={e => { const n=+e.target.value; setForm({...form,maxPlayers:n,advancedRoles:n>10?form.advancedRoles:false}); if(n<=10)setExtraRoles([]); }}
                  style={{ width:'100%',background:'#1a1a2e',border:'1px solid rgba(255,255,255,0.08)',color:'#f5e6ca',borderRadius:14,padding:'12px 14px',fontSize:14,outline:'none' }}>
                  {[6,7,8,9,10,11,12,14,16].map(n=><option key={n} value={n}>{n} joueurs</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: 'rgba(245,230,202,0.4)' }}>Mode</label>
                <select value={form.advancedRoles} disabled={form.maxPlayers<=10}
                  onChange={e => { setForm({...form,advancedRoles:e.target.value==='true'}); if(e.target.value==='false')setExtraRoles([]); }}
                  style={{ width:'100%',background:'#1a1a2e',border:'1px solid rgba(255,255,255,0.08)',color:form.maxPlayers<=10?'rgba(245,230,202,0.25)':'#f5e6ca',borderRadius:14,padding:'12px 14px',fontSize:14,outline:'none',opacity:form.maxPlayers<=10?0.5:1 }}>
                  <option value="false">Basique</option>
                  {form.maxPlayers>10&&<option value="true">Avancé</option>}
                </select>
              </div>
            </div>
            {/* Base roles */}
            <div className="rounded-2xl p-3" style={{ background:'#1a1a2e',border:'1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-xs mb-2" style={{ color:'rgba(245,230,202,0.35)' }}>Rôles de base</p>
              {form.maxPlayers>10&&(
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs" style={{ color:'rgba(245,230,202,0.5)' }}>🐺 Loups:</span>
                  <select value={wolfCount} onChange={e=>setWolfCount(+e.target.value)}
                    style={{ background:'#0f0f1a',border:'1px solid rgba(255,255,255,0.08)',color:'#f5e6ca',borderRadius:8,padding:'4px 8px',fontSize:12,outline:'none' }}>
                    {[2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {[`🐺×${form.advancedRoles?wolfCount:2}`,'🔮 Voyante','🧙 Sorcière','🛡️ Salvateur'].map(r=>(
                  <span key={r} className="text-xs px-2 py-1 rounded-lg"
                    style={{ background:'#0f0f1a',color:'rgba(245,230,202,0.6)',border:'1px solid rgba(255,255,255,0.06)' }}>{r}</span>
                ))}
                <span className="text-xs px-2 py-1 rounded-lg"
                  style={{ background:'#0f0f1a',color:'rgba(245,230,202,0.3)',border:'1px dashed rgba(255,255,255,0.08)' }}>
                  +{Math.max(0,remainingSlots)} Villageois
                </span>
              </div>
            </div>
            {/* Advanced roles */}
            {form.advancedRoles&&form.maxPlayers>10&&(
              <div className="rounded-2xl p-3" style={{ background:'#1a1a2e',border:'1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-xs mb-3" style={{ color:'rgba(245,230,202,0.35)' }}>
                  Rôles supplémentaires <span style={{ color:'#e94560',marginLeft:6 }}>({extraRoles.length} sélectionné{extraRoles.length>1?'s':''})</span>
                </p>
                <div className="space-y-2">
                  {ADVANCED_ROLES.map(role=>{
                    const isSel=extraRoles.includes(role.value);
                    const isDis=!isSel&&remainingSlots<=0;
                    return (
                      <div key={role.value} onClick={()=>!isDis&&toggleExtraRole(role.value)}
                        className="flex items-center gap-3 p-2.5 rounded-xl active:scale-98"
                        style={{ background:isSel?'rgba(233,69,96,0.12)':'rgba(255,255,255,0.03)',
                          border:`1px solid ${isSel?'rgba(233,69,96,0.4)':'rgba(255,255,255,0.06)'}`,
                          cursor:isDis?'not-allowed':'pointer',opacity:isDis?0.3:1 }}>
                        <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                          style={{ background:isSel?'#e94560':'transparent',border:`1.5px solid ${isSel?'#e94560':'rgba(255,255,255,0.2)'}` }}>
                          {isSel&&<span style={{ color:'white',fontSize:10,fontWeight:700 }}>✓</span>}
                        </div>
                        <span style={{ fontSize:18 }}>{role.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium" style={{ color:'#f5e6ca' }}>{role.label}</span>
                          <span className="text-xs ml-1" style={{ color:'rgba(245,230,202,0.35)' }}>{role.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color:'rgba(245,230,202,0.4)' }}>Mot de passe (optionnel)</label>
              <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}
                placeholder="Laisser vide pour partie publique"
                style={{ width:'100%',background:'#1a1a2e',border:'1px solid rgba(255,255,255,0.08)',color:'#f5e6ca',borderRadius:14,padding:'12px 14px',fontSize:15,outline:'none' }} />
            </div>
            <div className="rounded-xl p-3 text-xs"
              style={{ background:'rgba(233,69,96,0.08)',color:'rgba(245,230,202,0.5)',border:'1px solid rgba(233,69,96,0.15)' }}>
              Vous serez le <span style={{ color:'#e94560',fontWeight:700 }}>Narrateur</span> de cette partie.
            </div>
            <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl font-bold text-white text-base active:scale-98"
              style={{ background:'linear-gradient(135deg,#e94560 0%,#c73652 100%)',border:'none',cursor:'pointer',
                boxShadow:'0 4px 20px rgba(233,69,96,0.3)',opacity:loading?0.7:1 }}>
              {loading?'Création...':'Créer la partie'}
            </button>
          </form>
        )}
        {/* JOIN BY CODE */}
        {tab === 'join' && (
          <form onSubmit={joinByCode} className="p-4 space-y-4">
            <div className="text-center py-4">
              <span style={{ fontSize:48 }}>🔑</span>
              <p className="text-sm mt-2" style={{ color:'rgba(245,230,202,0.4)' }}>Entrez le code partagé par le narrateur</p>
            </div>
            <div>
              <label className="block text-xs mb-1.5 uppercase tracking-wider text-center" style={{ color:'rgba(245,230,202,0.4)' }}>Code de la partie</label>
              <input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())}
                placeholder="W3LF42" maxLength={6} required autoComplete="off"
                style={{ width:'100%',background:'#1a1a2e',border:'1px solid rgba(255,255,255,0.08)',color:'#f5e6ca',borderRadius:14,padding:'16px 14px',fontSize:22,textAlign:'center',letterSpacing:'0.3em',fontFamily:'monospace',outline:'none' }} />
            </div>
            <div>
              <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color:'rgba(245,230,202,0.4)' }}>Mot de passe (si requis)</label>
              <input type="password" value={joinPassword} onChange={e=>setJoinPassword(e.target.value)}
                placeholder="Laisser vide si aucun"
                style={{ width:'100%',background:'#1a1a2e',border:'1px solid rgba(255,255,255,0.08)',color:'#f5e6ca',borderRadius:14,padding:'12px 14px',fontSize:15,outline:'none' }} />
            </div>
            <button type="submit" disabled={loading||joinCode.length<4} className="w-full py-4 rounded-2xl font-bold text-white text-base active:scale-98"
              style={{ background:'linear-gradient(135deg,#e94560 0%,#c73652 100%)',border:'none',cursor:'pointer',
                boxShadow:'0 4px 20px rgba(233,69,96,0.3)',opacity:(loading||joinCode.length<4)?0.5:1 }}>
              {loading?'Connexion...':'Rejoindre la partie'}
            </button>
          </form>
        )}
      </div>
      {/* Password bottom sheet */}
      {passwordPrompt&&(
        <div className="fixed inset-0 z-50 flex items-end" style={{ background:'rgba(0,0,0,0.75)' }}
          onClick={()=>setPasswordPrompt(null)}>
          <div className="w-full rounded-t-3xl p-6 animate-slide-up"
            style={{ background:'#1a1a2e',border:'1px solid rgba(255,255,255,0.08)' }}
            onClick={e=>e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background:'rgba(255,255,255,0.15)' }} />
            <h3 className="font-bold text-base mb-1" style={{ color:'#f5e6ca' }}>🔒 Partie protégée</h3>
            <p className="text-xs mb-4" style={{ color:'rgba(245,230,202,0.4)' }}>Entrez le mot de passe pour rejoindre</p>
            <input type="password" value={browsePassword} onChange={e=>setBrowsePassword(e.target.value)}
              placeholder="Mot de passe" autoFocus
              onKeyDown={e=>{if(e.key==='Enter'){joinRoom(passwordPrompt,browsePassword);setPasswordPrompt(null);}}}
              style={{ width:'100%',background:'#0f0f1a',border:'1px solid rgba(255,255,255,0.1)',color:'#f5e6ca',borderRadius:14,padding:'12px 14px',fontSize:15,outline:'none',marginBottom:12 }} />
            <div className="flex gap-3">
              <button onClick={()=>{setPasswordPrompt(null);setBrowsePassword('');}}
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{ background:'rgba(255,255,255,0.06)',color:'rgba(245,230,202,0.6)',border:'none',cursor:'pointer' }}>
                Annuler
              </button>
              <button onClick={()=>{joinRoom(passwordPrompt,browsePassword);setPasswordPrompt(null);}}
                className="flex-[2] py-3 rounded-xl text-sm font-bold text-white"
                style={{ background:'#e94560',border:'none',cursor:'pointer' }}>
                Rejoindre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
