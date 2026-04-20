import { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { ROLE_LABELS, PHASE_LABELS, ROLE_ICONS, isWolfRole, getRoleColor } from '../constants/roles';
import RoleCard from '../components/RoleCard';
import VotePanel from '../components/VotePanel';
import NightPanel from '../components/NightPanel';
import NightSummary from '../components/NightSummary';
import DeathReveal from '../components/DeathReveal';
import EndScreen from '../components/EndScreen';
import ChasseurPanel from '../components/ChasseurPanel';

export default function GamePage({ roomId }) {
  const { state, dispatch } = useGame();
  const { send } = useWebSocket(roomId);
  const [message, setMessage]           = useState('');
  const [activeTab, setActiveTab]       = useState('game');   // game | chat | players | narrator
  const [chatTab, setChatTab]           = useState('public');
  const [showRoleCard, setShowRoleCard] = useState(false);
  const [roleCardDismissed, setRoleCardDismissed] = useState(false);
  const [showNightSummary, setShowNightSummary]   = useState(false);
  const [unreadChat, setUnreadChat]     = useState(0);
  const chatEndRef = useRef(null);

  const isNarrator  = state.player?.narrator;
  const phase       = state.phase || state.room?.phase;
  const alivePlayers = state.room?.players?.filter(p => p.alive && !p.narrator) || [];
  const allPlayers   = state.room?.players?.filter(p => !p.narrator) || [];
  const isVotePhase  = phase === 'VOTE';
  const isNightPhase = phase === 'NUIT';
  const isGameOver   = phase === 'TERMINE';
  const nightCall    = state.nightCall;
  const nightResult  = state.nightResult;
  const canSeeWolvesChat = isWolfRole(state.myRole) || isNarrator;
  const messages     = chatTab === 'wolves' ? state.wolvesMessages : state.messages;

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);
  useEffect(() => { if (state.myRole && !roleCardDismissed && !isNarrator) setShowRoleCard(true); }, [state.myRole]);
  useEffect(() => { if (phase !== 'VOTE') dispatch({ type: 'RESET_VOTES' }); }, [phase]);
  useEffect(() => { if (state.nightSummary && isNarrator) setShowNightSummary(true); }, [state.nightSummary]);
  useEffect(() => {
    if (state.narratorAlert?.type === 'ROLE_ACTING') {
      const t = setTimeout(() => dispatch({ type: 'CLEAR_NARRATOR_ALERT' }), 30000);
      return () => clearTimeout(t);
    }
  }, [state.narratorAlert]);
  useEffect(() => {
    if (activeTab !== 'chat') setUnreadChat(prev => prev + 1);
  }, [state.messages.length, state.wolvesMessages.length]);
  useEffect(() => { if (activeTab === 'chat') setUnreadChat(0); }, [activeTab]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    send(chatTab === 'wolves' ? '/chat/wolves' : '/chat/public', {
      roomId, senderId: state.player?.id, senderName: state.player?.username, message: message.trim(),
    });
    setMessage('');
  };
  const narratorAction = (action, extra = {}) => send(`/narrator/${action}`, { roomId, ...extra });

  const phaseStyle = () => {
    if (isNightPhase) return { bg: '#1e3a8a', color: '#93c5fd' };
    if (phase === 'JOUR') return { bg: '#78350f', color: '#fcd34d' };
    if (phase === 'VOTE') return { bg: '#7f1d1d', color: '#fca5a5' };
    if (isGameOver)       return { bg: '#064e3b', color: '#6ee7b7' };
    return { bg: '#1a1a2e', color: '#888' };
  };
  const ps = phaseStyle();

  // Bottom nav tabs
  const navTabs = isNarrator
    ? [
        { key: 'game',     icon: '🎮', label: 'Contrôles' },
        { key: 'players',  icon: '👥', label: 'Joueurs' },
        { key: 'chat',     icon: '💬', label: 'Chat', badge: unreadChat },
      ]
    : [
        { key: 'game',     icon: isNightPhase ? '🌙' : '☀️', label: 'Village' },
        { key: 'players',  icon: '👥', label: 'Joueurs' },
        { key: 'chat',     icon: '💬', label: 'Chat', badge: unreadChat },
      ];

  return (
    <div className="h-full flex flex-col safe-top safe-bottom" style={{ background: '#0a0a0f' }}>

      {/* ===== OVERLAYS ===== */}
      {showRoleCard && state.myRole && (
        <RoleCard role={state.myRole} username={state.player?.username}
          onClose={() => { setShowRoleCard(false); setRoleCardDismissed(true); }} />
      )}
      {isNarrator && showNightSummary && state.nightSummary && (
        <NightSummary roomId={roomId} send={send}
          onClose={() => { setShowNightSummary(false); dispatch({ type: 'CLEAR_NIGHT_SUMMARY' }); }} />
      )}
      {state.deathReveal && (
        <DeathReveal onClose={() => dispatch({ type: 'CLEAR_DEATH_REVEAL' })} />
      )}
      {isNightPhase && !isNarrator && (
        <NightPanel roomId={roomId} send={send} calledRole={nightCall?.calledRole}
          nightResult={nightResult} onDone={() => dispatch({ type: 'CLEAR_NIGHT_CALL' })} />
      )}
      {state.chasseurShot && (
        <ChasseurPanel roomId={roomId} send={send} onDone={() => dispatch({ type: 'CLEAR_CHASSEUR_SHOT' })} />
      )}
      {isNarrator && state.narratorAlert && (
        <div className="fixed top-14 left-0 right-0 z-[55] px-4">
          <div className={`px-4 py-3 rounded-2xl border text-center ${
            state.narratorAlert.type === 'ROLE_ACTING'
              ? 'animate-pulse-wolf'
              : ''
          }`} style={{
            background: state.narratorAlert.type==='ROLE_ACTING' ? 'rgba(30,58,138,0.95)' : 'rgba(6,78,59,0.95)',
            border: `1px solid ${state.narratorAlert.type==='ROLE_ACTING' ? '#3b82f6' : '#10b981'}`,
            color: state.narratorAlert.type==='ROLE_ACTING' ? '#93c5fd' : '#6ee7b7',
          }}>
            <p className="text-sm font-semibold">{state.narratorAlert.message}</p>
            {state.narratorAlert.type === 'ROLE_ACTION_DONE' && (
              <button onClick={() => dispatch({ type: 'CLEAR_NARRATOR_ALERT' })}
                className="mt-2 text-xs px-4 py-1 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                OK
              </button>
            )}
          </div>
        </div>
      )}
      {isGameOver && <EndScreen />}

      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
        style={{ background: '#0f0f1a', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-sm truncate" style={{ color: '#e94560' }}>🐺 {state.room?.name}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
            style={{ background: ps.bg, color: ps.color }}>
            {PHASE_LABELS[phase] || phase}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {state.myRole && !isNarrator && (
            <button onClick={() => setShowRoleCard(true)}
              className="text-xs px-2.5 py-1 rounded-xl active:scale-95"
              style={{ background: 'rgba(233,69,96,0.15)', color: '#e94560', border: 'none', cursor: 'pointer' }}>
              {ROLE_ICONS[state.myRole]} {ROLE_LABELS[state.myRole]}
            </button>
          )}
          <span className="text-xs font-medium" style={{ color: 'rgba(245,230,202,0.6)' }}>
            {state.player?.username}
          </span>
        </div>
      </div>

      {/* Notification banner */}
      {state.notification && (
        <div className="px-4 py-2 text-center text-xs italic flex-shrink-0"
          style={{ background: '#16213e', borderBottom: '1px solid rgba(233,69,96,0.3)', color: '#f5e6ca' }}>
          {state.notification}
        </div>
      )}
      {state.eliminated && (
        <div className="px-4 py-2 text-center text-xs flex-shrink-0"
          style={{ background: 'rgba(127,29,29,0.4)', borderBottom: '1px solid #7f1d1d', color: '#fca5a5' }}>
          <span className="font-bold">{state.eliminated.playerName}</span> a été éliminé !
          {state.eliminated.role && ` (${ROLE_LABELS[state.eliminated.role] || state.eliminated.role})`}
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 overflow-hidden">

        {/* VOTE PHASE — takes full screen regardless of tab */}
        {isVotePhase && <VotePanel roomId={roomId} send={send} />}

        {/* NON-VOTE content */}
        {!isVotePhase && (
          <>
            {/* ── GAME TAB ── */}
            {activeTab === 'game' && (
              <div className="h-full overflow-y-auto scroll-smooth">
                {isNarrator ? (
                  /* NARRATOR CONTROLS */
                  <div className="p-4 space-y-5">
                    {/* Phase switcher */}
                    <div>
                      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'rgba(245,230,202,0.3)' }}>Changer de phase</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { phase:'NUIT', icon:'🌙', label:'Nuit', bg:'#1e3a8a', color:'#93c5fd' },
                          { phase:'JOUR', icon:'☀️', label:'Jour', bg:'#78350f', color:'#fcd34d' },
                          { phase:'VOTE', icon:'⚖️', label:'Vote', bg:'#7f1d1d', color:'#fca5a5' },
                        ].map(({ phase:p, icon, label, bg, color }) => (
                          <button key={p} onClick={() => narratorAction('phase', { phase: p })}
                            className="py-3 rounded-2xl text-sm font-bold flex flex-col items-center gap-1 active:scale-95"
                            style={{ background: bg, color, border: 'none', cursor: 'pointer' }}>
                            <span style={{ fontSize: 20 }}>{icon}</span>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Night role calls */}
                    {isNightPhase && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'rgba(245,230,202,0.3)' }}>Appeler les rôles</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { role:'CUPIDON',      label:'Cupidon',      icon:'💘', bg:'rgba(157,23,77,0.3)',  color:'#f9a8d4', border:'#9d174d' },
                            { role:'LOUP_GAROU',   label:'Les Loups',    icon:'🐺', bg:'rgba(127,29,29,0.4)', color:'#fca5a5', border:'#7f1d1d' },
                            { role:'LOUP_BLANC',   label:'Loup Blanc',   icon:'🤍', bg:'rgba(71,85,105,0.3)', color:'#cbd5e1', border:'#475569' },
                            { role:'PETITE_FILLE', label:'Petite Fille', icon:'👧', bg:'rgba(157,23,77,0.2)', color:'#fbcfe8', border:'#be185d' },
                            { role:'VOYANTE',      label:'La Voyante',   icon:'🔮', bg:'rgba(109,40,217,0.3)',color:'#c4b5fd', border:'#6d28d9' },
                            { role:'SORCIERE',     label:'La Sorcière',  icon:'🧙', bg:'rgba(6,95,70,0.3)',   color:'#6ee7b7', border:'#065f46' },
                            { role:'SALVATEUR',    label:'Le Salvateur', icon:'🛡️', bg:'rgba(19,78,74,0.3)',  color:'#5eead4', border:'#134e4a' },
                          ].filter(({ role }) => {
                            const gameRoles = allPlayers.map(p => p.role);
                            if (role === 'LOUP_GAROU') return gameRoles.includes('LOUP_GAROU') || gameRoles.includes('LOUP_BLANC');
                            return gameRoles.includes(role);
                          }).map(({ role, label, icon, bg, color, border }) => (
                            <button key={role} onClick={() => send('/narrator/call-role', { roomId, role })}
                              className="py-3 px-3 rounded-2xl text-sm font-medium flex items-center gap-2 active:scale-95"
                              style={{ background: bg, color, border: `1px solid ${border}`, cursor: 'pointer' }}>
                              <span style={{ fontSize: 20 }}>{icon}</span>
                              {label}
                            </button>
                          ))}
                        </div>
                        <button onClick={() => send('/narrator/night-summary', { roomId })}
                          className="mt-2 w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-98"
                          style={{ background: '#1a1a2e', color: '#f5e6ca', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                          📋 Résumé de la nuit
                        </button>
                      </div>
                    )}
                    {/* Quick announcements */}
                    <div>
                      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'rgba(245,230,202,0.3)' }}>Annonces rapides</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { msg:'La nuit tombe sur le village...', icon:'🌙' },
                          { msg:'Le jour se lève...', icon:'☀️' },
                          { msg:'Votez maintenant !', icon:'⚖️' },
                          { msg:'Un joueur a été éliminé.', icon:'💀' },
                        ].map(({ msg, icon }) => (
                          <button key={msg} onClick={() => narratorAction('announce', { message: msg })}
                            className="py-2.5 px-3 rounded-xl text-xs flex items-center gap-1.5 active:scale-95"
                            style={{ background:'rgba(255,255,255,0.04)',color:'rgba(245,230,202,0.6)',border:'1px solid rgba(255,255,255,0.07)',cursor:'pointer',textAlign:'left' }}>
                            <span>{icon}</span> {msg}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Eliminate */}
                    <div>
                      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'rgba(245,230,202,0.3)' }}>Éliminer un joueur</p>
                      <div className="grid grid-cols-2 gap-2">
                        {alivePlayers.map(p => (
                          <button key={p.id} onClick={() => narratorAction('eliminate', { playerId: p.id })}
                            className="py-2.5 px-3 rounded-xl text-sm active:scale-95"
                            style={{ background:'rgba(255,255,255,0.03)',color:'rgba(245,230,202,0.6)',border:'1px solid rgba(255,255,255,0.06)',cursor:'pointer',textAlign:'left' }}>
                            {p.username}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* PLAYER GAME VIEW */
                  isNightPhase ? (
                    !nightCall?.calledRole && (
                      <div className="h-full flex flex-col items-center justify-center" style={{ background: '#050508' }}>
                        <div style={{ fontSize: 72 }}>🌙</div>
                        <p className="text-xl font-semibold mt-4 mb-2" style={{ color: '#f5e6ca' }}>Silence... c'est la nuit</p>
                        <p className="text-sm" style={{ color: '#333' }}>Fermez les yeux et attendez</p>
                      </div>
                    )
                  ) : (
                    <div className="p-4 flex flex-col items-center">
                      <div className="text-center mb-6 pt-4">
                        <div style={{ fontSize: 56 }}>{phase === 'JOUR' ? '☀️' : '🐺'}</div>
                        <p className="text-lg font-semibold mt-3 mb-1" style={{ color: '#f5e6ca' }}>
                          {phase === 'JOUR' ? 'Le jour se lève' : 'Bienvenue dans la partie'}
                        </p>
                        <p className="text-sm text-center" style={{ color: 'rgba(245,230,202,0.4)', maxWidth: 260 }}>
                          {phase === 'JOUR' ? 'Discutez pour trouver les loups-garous' : 'La partie va bientôt commencer...'}
                        </p>
                      </div>
                      {/* Alive players grid */}
                      <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
                        {alivePlayers.map(p => (
                          <div key={p.id} className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl"
                            style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                              style={{ background: '#16213e', color: '#f5e6ca' }}>
                              {p.username?.[0]?.toUpperCase()}
                            </div>
                            <span className="text-[11px] truncate w-full text-center" style={{ color: '#f5e6ca' }}>{p.username}</span>
                          </div>
                        ))}
                      </div>
                      {/* Dead players */}
                      {allPlayers.filter(p => !p.alive).length > 0 && (
                        <div className="mt-5 w-full max-w-sm">
                          <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'rgba(245,230,202,0.25)' }}>Éliminés</p>
                          <div className="flex flex-wrap gap-1.5">
                            {allPlayers.filter(p => !p.alive).map(p => (
                              <span key={p.id} className="text-xs px-2.5 py-1 rounded-lg"
                                style={{ color: '#555', background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.05)', textDecoration: 'line-through' }}>
                                💀 {p.username}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}

            {/* ── PLAYERS TAB ── */}
            {activeTab === 'players' && (
              <div className="h-full overflow-y-auto scroll-smooth p-4">
                <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: 'rgba(245,230,202,0.3)' }}>
                  {alivePlayers.length} joueur(s) en vie
                </p>
                {allPlayers.map(p => {
                  const isDead  = !p.alive;
                  const isAnon  = isNightPhase && !isNarrator;
                  const rc      = isNarrator ? getRoleColor(p.role) : null;
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-2xl mb-2"
                      style={{ background: isDead ? 'rgba(255,255,255,0.02)' : (rc ? rc.bg : '#1a1a2e'),
                        border: '1px solid rgba(255,255,255,0.05)', opacity: isDead ? 0.4 : 1 }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: isDead ? '#1a1a2e' : isAnon ? '#1a1a2e' : '#16213e',
                          color: isDead ? '#333' : '#f5e6ca' }}>
                        {isDead ? '💀' : isAnon ? '?' : (isNarrator ? (ROLE_ICONS[p.role] || p.username?.[0]?.toUpperCase()) : p.username?.[0]?.toUpperCase())}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate"
                          style={{ color: isDead ? '#555' : '#f5e6ca', textDecoration: isDead ? 'line-through' : 'none' }}>
                          {isDead ? p.username : isAnon ? '???' : p.username}
                        </p>
                        {isNarrator && (
                          <p className="text-xs" style={{ color: isDead ? '#444' : rc?.color }}>
                            {isDead ? 'Mort' : (ROLE_LABELS[p.role] || 'Sans rôle')}
                          </p>
                        )}
                      </div>
                      {isNarrator && p.alive && (
                        <div className={`w-2 h-2 rounded-full flex-shrink-0`}
                          style={{ background: isWolfRole(p.role) ? '#ef4444' : '#3b82f6' }} />
                      )}
                      {!isDead && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: 'rgba(5,150,105,0.15)', color: '#6ee7b7' }}>
                          Vivant
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── CHAT TAB ── */}
            {activeTab === 'chat' && (
              <div className="h-full flex flex-col">
                {/* Chat sub-tabs */}
                <div className="flex flex-shrink-0 px-4 pt-3 pb-0 gap-2">
                  <button onClick={() => setChatTab('public')}
                    className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
                    style={{ background: chatTab==='public'?'rgba(233,69,96,0.15)':'rgba(255,255,255,0.04)',
                      color: chatTab==='public'?'#e94560':'rgba(245,230,202,0.4)', border:'none', cursor:'pointer' }}>
                    💬 Public
                  </button>
                  {canSeeWolvesChat && (
                    <button onClick={() => setChatTab('wolves')}
                      className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
                      style={{ background: chatTab==='wolves'?'rgba(239,68,68,0.15)':'rgba(255,255,255,0.04)',
                        color: chatTab==='wolves'?'#ef4444':'rgba(245,230,202,0.4)', border:'none', cursor:'pointer' }}>
                      🐺 Loups
                    </button>
                  )}
                </div>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto scroll-smooth p-4 flex flex-col gap-2.5">
                  {messages.length === 0 && (
                    <p className="text-center text-xs mt-8" style={{ color: 'rgba(245,230,202,0.2)' }}>
                      {chatTab === 'wolves' ? 'Canal des loups-garous...' : 'La discussion commence...'}
                    </p>
                  )}
                  {messages.map((msg, i) => {
                    const isMe = msg.senderId === state.player?.id;
                    return (
                      <div key={i} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className="w-7 h-7 rounded-full bg-[#16213e] flex items-center justify-center text-[10px] font-bold text-[#f5e6ca] flex-shrink-0">
                          {msg.senderName?.[0]?.toUpperCase()}
                        </div>
                        <div className={`max-w-[78%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <span className="text-[9px] mb-0.5" style={{ color: 'rgba(245,230,202,0.3)' }}>
                            {msg.senderName} · {msg.time}
                          </span>
                          <div className="px-3 py-2 rounded-2xl text-xs" style={{ color: '#f5e6ca',
                            background: isMe ? 'rgba(233,69,96,0.2)' : '#16213e',
                            border: `1px solid ${isMe ? 'rgba(233,69,96,0.3)' : 'rgba(255,255,255,0.05)'}` }}>
                            {msg.message}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
                {/* Input */}
                <form onSubmit={sendMessage} className="px-4 pb-2 pt-2 flex gap-2 flex-shrink-0"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <input value={message} onChange={e => setMessage(e.target.value)}
                    placeholder={isNightPhase && !isNarrator && chatTab==='public' ? "Silence... c'est la nuit" : 'Votre message...'}
                    disabled={isNightPhase && !isNarrator && chatTab === 'public'}
                    style={{ flex:1, background:'#1a1a2e', border:'1px solid rgba(255,255,255,0.08)',
                      color:'#f5e6ca', borderRadius:14, padding:'10px 14px', fontSize:14, outline:'none',
                      opacity: isNightPhase&&!isNarrator&&chatTab==='public' ? 0.3 : 1 }} />
                  <button type="submit"
                    disabled={isNightPhase && !isNarrator && chatTab === 'public'}
                    className="px-4 rounded-xl text-sm font-semibold active:scale-95"
                    style={{ background:'#e94560', color:'white', border:'none', cursor:'pointer',
                      opacity: isNightPhase&&!isNarrator&&chatTab==='public' ? 0.3 : 1 }}>
                    ↑
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== BOTTOM NAV ===== */}
      <div className="flex-shrink-0 flex safe-bottom"
        style={{ background: '#0f0f1a', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {navTabs.map(({ key, icon, label, badge }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 relative transition-all active:scale-95"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer',
              borderTop: activeTab===key ? '2px solid #e94560' : '2px solid transparent' }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span className="text-[9px] font-medium"
              style={{ color: activeTab===key ? '#e94560' : 'rgba(245,230,202,0.35)' }}>
              {label}
            </span>
            {badge > 0 && key !== activeTab && (
              <span className="absolute top-2 right-[calc(50%-14px)] w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                style={{ background: '#e94560', color: 'white' }}>
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
