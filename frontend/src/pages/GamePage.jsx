import { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { ROLE_LABELS, ROLE_TEAM, PHASE_LABELS, ROLE_ICONS, isWolfRole, getRoleColor } from '../constants/roles';
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
  const [message, setMessage] = useState('');
  const [chatTab, setChatTab] = useState('public');
  const [showRoleCard, setShowRoleCard] = useState(false);
  const [roleCardDismissed, setRoleCardDismissed] = useState(false);
  const [showNightSummary, setShowNightSummary] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatEndRef = useRef(null);

  const isNarrator = state.player?.narrator;
  const phase = state.phase || state.room?.phase;
  const alivePlayers = state.room?.players?.filter(p => p.alive && !p.narrator) || [];
  const allPlayers = state.room?.players?.filter(p => !p.narrator) || [];
  const isVotePhase = phase === 'VOTE';
  const isNightPhase = phase === 'NUIT';
  const isGameOver = phase === 'TERMINE';
  const nightCall = state.nightCall;
  const nightResult = state.nightResult;

  const canSeeWolvesChat = state.myRole === 'LOUP_GAROU' || state.myRole === 'LOUP_BLANC' || isNarrator;
  const messages = chatTab === 'wolves' ? state.wolvesMessages : state.messages;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, state.wolvesMessages]);

  useEffect(() => {
    if (state.myRole && !roleCardDismissed && !isNarrator) {
      setShowRoleCard(true);
    }
  }, [state.myRole]);

  useEffect(() => {
    if (phase !== 'VOTE') dispatch({ type: 'RESET_VOTES' });
  }, [phase]);

  useEffect(() => {
    if (state.nightSummary && isNarrator) setShowNightSummary(true);
  }, [state.nightSummary]);

  useEffect(() => {
    if (state.narratorAlert?.type === 'ROLE_ACTING') {
      const timer = setTimeout(() => dispatch({ type: 'CLEAR_NARRATOR_ALERT' }), 30000);
      return () => clearTimeout(timer);
    }
  }, [state.narratorAlert]);

  // Track unread messages when chat is closed
  useEffect(() => {
    if (!showChat) {
      setUnreadCount(prev => prev + 1);
    }
  }, [state.messages.length, state.wolvesMessages.length]);

  useEffect(() => {
    if (showChat) setUnreadCount(0);
  }, [showChat]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    const dest = chatTab === 'wolves' ? '/chat/wolves' : '/chat/public';
    send(dest, {
      roomId, senderId: state.player?.id,
      senderName: state.player?.username, message: message.trim(),
    });
    setMessage('');
  };

  const narratorAction = (action, extra = {}) => {
    send(`/narrator/${action}`, { roomId, ...extra });
  };

  // ===== CHAT DRAWER (shared by both player and narrator) =====
  const ChatDrawer = () => (
    <>
      {/* Chat toggle button */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="absolute bottom-4 left-4 z-40 bg-[#1a1a2e] border border-[#333] text-[#f5e6ca] rounded-full px-4 py-2.5 text-sm font-medium cursor-pointer flex items-center gap-2 shadow-lg hover:bg-[#16213e] transition-colors"
      >
        💬 Chat
        {unreadCount > 0 && !showChat && (
          <span className="bg-[#e94560] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat drawer */}
      <div className={`absolute bottom-0 left-0 right-0 z-30 bg-[#0f0f1a] border-t border-[#333] transition-transform duration-300 ${
        showChat ? 'translate-y-0' : 'translate-y-full'
      }`} style={{ height: '45%' }}>

        {/* Drawer header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#1a1a2e] bg-[#1a1a2e] flex-shrink-0">
          <div className="flex items-center gap-1">
            <button onClick={() => setChatTab('public')} className={`px-3 py-1.5 text-xs rounded-lg border-none cursor-pointer ${
              chatTab === 'public' ? 'bg-[#e94560]/20 text-[#e94560]' : 'text-[#555] bg-transparent'
            }`}>Public</button>
            {canSeeWolvesChat && (
              <button onClick={() => setChatTab('wolves')} className={`px-3 py-1.5 text-xs rounded-lg border-none cursor-pointer ${
                chatTab === 'wolves' ? 'bg-[#ef4444]/20 text-[#ef4444]' : 'text-[#555] bg-transparent'
              }`}>Loups 🐺</button>
            )}
          </div>
          <button onClick={() => setShowChat(false)} className="text-[#555] hover:text-[#888] text-lg cursor-pointer bg-transparent border-none">
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="overflow-y-auto p-3 flex flex-col gap-2" style={{ height: 'calc(100% - 90px)' }}>
          {messages.length === 0 && (
            <p className="text-center text-[#333] text-xs mt-4">
              {chatTab === 'wolves' ? 'Canal des loups-garous...' : 'La discussion commence...'}
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.senderId === state.player?.id ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="w-6 h-6 rounded-full bg-[#16213e] flex items-center justify-center text-[9px] font-bold text-[#f5e6ca] flex-shrink-0">
                {msg.senderName?.[0]?.toUpperCase()}
              </div>
              <div className={`max-w-[75%] flex flex-col ${msg.senderId === state.player?.id ? 'items-end' : 'items-start'}`}>
                <span className="text-[9px] text-[#555] mb-0.5">{msg.senderName} · {msg.time}</span>
                <div className={`px-2.5 py-1.5 rounded-xl text-xs text-[#f5e6ca] ${
                  msg.senderId === state.player?.id
                    ? 'bg-[rgba(233,69,96,0.2)] border border-[rgba(233,69,96,0.3)]'
                    : 'bg-[#16213e] border border-[#1a1a2e]'
                }`}>{msg.message}</div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-2 border-t border-[#1a1a2e] flex gap-2">
          <input value={message} onChange={e => setMessage(e.target.value)}
            placeholder={isNightPhase && !isNarrator && chatTab === 'public' ? "Silence... c'est la nuit" : 'Votre message...'}
            disabled={isNightPhase && !isNarrator && chatTab === 'public'}
            className={`flex-1 bg-[#16213e] border border-[#1a1a2e] text-[#f5e6ca] rounded-lg px-3 py-1.5 text-xs outline-none ${
              isNightPhase && !isNarrator && chatTab === 'public' ? 'opacity-30' : ''
            }`} />
          <button type="submit"
            disabled={isNightPhase && !isNarrator && chatTab === 'public'}
            className={`bg-[#e94560] text-white border-none rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
              isNightPhase && !isNarrator && chatTab === 'public' ? 'opacity-30' : ''
            }`}>Envoyer</button>
        </form>
      </div>
    </>
  );

  return (
    <div className="h-screen bg-[#0a0a0f] flex flex-col overflow-hidden">

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
        <NightPanel roomId={roomId} send={send}
          calledRole={nightCall?.calledRole} nightResult={nightResult}
          onDone={() => dispatch({ type: 'CLEAR_NIGHT_CALL' })} />
      )}
      {state.chasseurShot && (
        <ChasseurPanel roomId={roomId} send={send}
          onDone={() => dispatch({ type: 'CLEAR_CHASSEUR_SHOT' })} />
      )}

      {/* Narrator role status alert */}
      {isNarrator && state.narratorAlert && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[55]">
          <div className={`px-6 py-3 rounded-2xl border shadow-lg text-center ${
            state.narratorAlert.type === 'ROLE_ACTING'
              ? 'bg-[#1e3a8a]/90 border-[#3b82f6] text-[#93c5fd] animate-pulse'
              : 'bg-[#064e3b]/90 border-[#10b981] text-[#6ee7b7]'
          }`}>
            <p className="text-sm font-semibold">{state.narratorAlert.message}</p>
            {state.narratorAlert.type === 'ROLE_ACTION_DONE' && (
              <button onClick={() => dispatch({ type: 'CLEAR_NARRATOR_ALERT' })}
                className="mt-2 text-xs bg-white/10 hover:bg-white/20 px-4 py-1 rounded-lg transition-colors border-none cursor-pointer text-inherit">
                OK
              </button>
            )}
          </div>
        </div>
      )}

      {isGameOver && (
        <EndScreen roomId={roomId} />
      )}

      {/* ===== HEADER ===== */}
      <div className="bg-[#1a1a2e] border-b border-[#0f0f1a] px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button onClick={() => setShowSidebar(!showSidebar)}
            className="sm:hidden text-[#888] text-lg flex-shrink-0 bg-transparent border-none cursor-pointer">☰</button>
          <span className="text-[#e94560] font-bold text-sm sm:text-base truncate">🐺 {state.room?.name}</span>
          <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
            isNightPhase ? 'bg-[#1e3a8a] text-[#93c5fd]' :
            phase === 'JOUR' ? 'bg-[#78350f] text-[#fcd34d]' :
            phase === 'VOTE' ? 'bg-[#7f1d1d] text-[#fca5a5]' :
            isGameOver ? 'bg-[#064e3b] text-[#6ee7b7]' :
            'bg-[#1a1a2e] text-[#888]'
          }`}>{PHASE_LABELS[phase] || phase}</span>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[#f5e6ca] text-xs sm:text-sm font-medium">{state.player?.username}</p>
          {state.myRole && !isNarrator && (
            <p className="text-[#e94560] text-[10px] sm:text-xs cursor-pointer"
               onClick={() => setShowRoleCard(true)}>
              {ROLE_LABELS[state.myRole]} — Voir ma carte
            </p>
          )}
          {isNarrator && <p className="text-[#555] text-[10px] sm:text-xs">Narrateur</p>}
        </div>
      </div>

      {/* Notification banner */}
      {state.notification && (
        <div className="bg-[#16213e] border-b border-[#e94560] px-4 py-2 text-center text-[#f5e6ca] text-xs sm:text-sm italic flex-shrink-0">
          {state.notification}
        </div>
      )}

      {/* Eliminated banner */}
      {state.eliminated && (
        <div className="bg-[rgba(127,29,29,0.4)] border-b border-[#7f1d1d] px-4 py-2 text-center text-[#fca5a5] text-xs sm:text-sm flex-shrink-0">
          <span className="font-bold">{state.eliminated.playerName}</span> a été éliminé !
          {state.eliminated.role && ` C'était un(e) ${ROLE_LABELS[state.eliminated.role] || state.eliminated.role}.`}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">

        {/* ===== PLAYERS SIDEBAR (left, for both) ===== */}
        {!isNarrator && (
          <div className={`
            ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
            sm:translate-x-0 transition-transform duration-200
            absolute sm:relative z-30 sm:z-auto
            w-44 sm:w-40 bg-[#0f0f1a] border-r border-[#1a1a2e] flex flex-col h-full
          `}>
            <p className="text-[10px] text-[#555] px-3 pt-2.5 pb-1.5 uppercase tracking-wider">
              Joueurs ({alivePlayers.length})
            </p>
            <div className="overflow-y-auto flex-1">
              {allPlayers.map(player => {
                const isDead = !player.alive;
                const isAnonymous = isNightPhase;
                return (
                  <div key={player.id} className={`flex items-center gap-2 px-3 py-1.5 border-b border-[#0f0f1a] ${isDead ? 'opacity-30' : ''}`}>
                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${
                      isDead ? 'bg-[#1a1a2e] text-[#333]' : isAnonymous ? 'bg-[#1a1a2e] text-[#555]' : 'bg-[#16213e] text-[#f5e6ca]'
                    }`}>
                      {isDead ? '💀' : isAnonymous ? '?' : player.username?.[0]?.toUpperCase()}
                    </div>
                    <span className={`text-xs truncate ${isDead ? 'text-[#333] line-through' : isAnonymous ? 'text-[#555]' : 'text-[#f5e6ca]'}`}>
                      {isDead ? player.username : isAnonymous ? '???' : player.username}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mobile sidebar backdrop */}
        {showSidebar && !isNarrator && (
          <div className="sm:hidden fixed inset-0 bg-black/50 z-20" onClick={() => setShowSidebar(false)} />
        )}

        {/* ===== MAIN AREA ===== */}
        <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">

          {/* ======== PLAYER MAIN ZONE ======== */}
          {!isNarrator && (
            <>
              {isVotePhase ? (
                <VotePanel roomId={roomId} send={send} />
              ) : isNightPhase ? (
                !nightCall?.calledRole && (
                  <div className="flex-1 flex flex-col items-center justify-center bg-[#050508]">
                    <div className="text-6xl mb-4">🌙</div>
                    <p className="text-[#f5e6ca] text-xl font-semibold mb-2">Silence... c'est la nuit</p>
                    <p className="text-[#333] text-sm">Fermez les yeux et attendez</p>
                  </div>
                )
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6">
                  <div className="text-5xl mb-4">{phase === 'JOUR' ? '☀️' : '🐺'}</div>
                  <p className="text-[#f5e6ca] text-lg font-semibold mb-2">
                    {phase === 'JOUR' ? 'Le jour se lève sur le village' : 'Bienvenue dans la partie'}
                  </p>
                  <p className="text-[#555] text-sm mb-6 text-center max-w-sm">
                    {phase === 'JOUR'
                      ? 'Discutez avec les autres villageois pour trouver les loups-garous'
                      : 'La partie va bientôt commencer...'}
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-w-md w-full">
                    {alivePlayers.map(p => (
                      <div key={p.id} className="flex flex-col items-center gap-1.5 bg-[#16213e] rounded-xl p-3 border border-[#1a1a2e]">
                        <div className="w-10 h-10 rounded-full bg-[#1a1a2e] flex items-center justify-center text-sm font-bold text-[#f5e6ca]">
                          {p.username?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-[11px] text-[#f5e6ca] truncate w-full text-center">{p.username}</span>
                      </div>
                    ))}
                  </div>
                  {allPlayers.filter(p => !p.alive).length > 0 && (
                    <div className="mt-6 w-full max-w-md">
                      <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Éliminés</p>
                      <div className="flex flex-wrap gap-2">
                        {allPlayers.filter(p => !p.alive).map(p => (
                          <span key={p.id} className="text-xs text-[#555] bg-[#0f0f1a] px-2.5 py-1 rounded-lg border border-[#1a1a2e] line-through">
                            💀 {p.username}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <ChatDrawer />
            </>
          )}

          {/* ======== NARRATOR MAIN ZONE ======== */}
          {isNarrator && (
            <>
              {isVotePhase ? (
                <VotePanel roomId={roomId} send={send} />
              ) : (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">

                  {/* Phase buttons — always visible */}
                  <div className="mb-6">
                    <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Changer de phase</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => narratorAction('phase', { phase: 'NUIT' })}
                        className="bg-[#1e3a8a] text-[#93c5fd] border-none rounded-xl px-5 py-2.5 text-sm font-semibold cursor-pointer flex items-center gap-2">
                        🌙 Nuit
                      </button>
                      <button onClick={() => narratorAction('phase', { phase: 'JOUR' })}
                        className="bg-[#78350f] text-[#fcd34d] border-none rounded-xl px-5 py-2.5 text-sm font-semibold cursor-pointer flex items-center gap-2">
                        ☀️ Jour
                      </button>
                      <button onClick={() => narratorAction('phase', { phase: 'VOTE' })}
                        className="bg-[#7f1d1d] text-[#fca5a5] border-none rounded-xl px-5 py-2.5 text-sm font-semibold cursor-pointer flex items-center gap-2">
                        ⚖️ Vote
                      </button>
                    </div>
                  </div>

                  {/* Night: Call role buttons */}
                  {isNightPhase && (
                    <div className="mb-6">
                      <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Appeler les rôles</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          { role: 'CUPIDON',      label: 'Cupidon',      icon: '💘', bg: 'bg-[rgba(157,23,77,0.3)]',  color: 'text-[#f9a8d4]', border: 'border-[#9d174d]' },
                          { role: 'LOUP_GAROU',   label: 'Les Loups',    icon: '🐺', bg: 'bg-[rgba(127,29,29,0.4)]',  color: 'text-[#fca5a5]', border: 'border-[#7f1d1d]' },
                          { role: 'LOUP_BLANC',   label: 'Loup Blanc',   icon: '🤍', bg: 'bg-[rgba(71,85,105,0.3)]',  color: 'text-[#cbd5e1]', border: 'border-[#475569]' },
                          { role: 'PETITE_FILLE', label: 'Petite Fille', icon: '👧', bg: 'bg-[rgba(157,23,77,0.2)]',  color: 'text-[#fbcfe8]', border: 'border-[#be185d]' },
                          { role: 'VOYANTE',      label: 'La Voyante',   icon: '🔮', bg: 'bg-[rgba(109,40,217,0.3)]', color: 'text-[#c4b5fd]', border: 'border-[#6d28d9]' },
                          { role: 'SORCIERE',     label: 'La Sorcière',  icon: '🧙', bg: 'bg-[rgba(6,95,70,0.3)]',    color: 'text-[#6ee7b7]', border: 'border-[#065f46]' },
                          { role: 'SALVATEUR',    label: 'Le Salvateur', icon: '🛡️', bg: 'bg-[rgba(19,78,74,0.3)]',   color: 'text-[#5eead4]', border: 'border-[#134e4a]' },
                        ].filter(({ role }) => {
                          // Only show roles that exist in this game
                          const gameRoles = allPlayers.map(p => p.role);
                          if (role === 'LOUP_GAROU') return gameRoles.includes('LOUP_GAROU') || gameRoles.includes('LOUP_BLANC');
                          return gameRoles.includes(role);
                        }).map(({ role, label, icon, bg, color, border }) => (
                          <button key={role}
                            onClick={() => send('/narrator/call-role', { roomId, role })}
                            className={`${bg} ${color} border ${border} rounded-xl px-4 py-3 text-sm font-medium cursor-pointer text-left flex items-center gap-2 hover:brightness-125 transition-all`}>
                            <span className="text-lg">{icon}</span>
                            {label}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => send('/narrator/night-summary', { roomId })}
                        className="mt-3 bg-[#1a1a2e] text-[#f5e6ca] border border-[#333] rounded-xl px-5 py-2.5 text-sm font-semibold cursor-pointer flex items-center gap-2 hover:bg-[#16213e] transition-colors">
                        📋 Résumé de la nuit
                      </button>
                    </div>
                  )}

                  {/* Announcements */}
                  <div className="mb-6">
                    <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Annonces rapides</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { msg: 'La nuit tombe sur le village...', icon: '🌙' },
                        { msg: 'Le jour se lève...', icon: '☀️' },
                        { msg: 'Votez maintenant !', icon: '⚖️' },
                        { msg: 'Un joueur a été éliminé.', icon: '💀' },
                      ].map(({ msg, icon }) => (
                        <button key={msg} onClick={() => narratorAction('announce', { message: msg })}
                          className="bg-[rgba(255,255,255,0.05)] text-[#888] border border-[#1a1a2e] rounded-xl px-4 py-2 text-xs cursor-pointer hover:bg-[rgba(255,255,255,0.1)] hover:text-[#f5e6ca] transition-colors flex items-center gap-1.5">
                          <span>{icon}</span> {msg}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Eliminate */}
                  <div className="mb-6">
                    <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Éliminer un joueur</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {alivePlayers.map(p => (
                        <button key={p.id} onClick={() => narratorAction('eliminate', { playerId: p.id })}
                          className="bg-[rgba(255,255,255,0.03)] text-[#888] border border-[#1a1a2e] rounded-xl px-4 py-2.5 text-sm cursor-pointer text-left
                            hover:bg-[rgba(127,29,29,0.3)] hover:text-[#fca5a5] hover:border-[#7f1d1d] transition-colors">
                          {p.username}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              <ChatDrawer />
            </>
          )}
        </div>

        {/* ===== NARRATOR PLAYERS SIDEBAR (right) ===== */}
        {isNarrator && (
          <div className="hidden sm:flex w-48 lg:w-52 bg-[#0f0f1a] border-l border-[#1a1a2e] flex-col flex-shrink-0">
            <p className="text-[10px] text-[#e94560] px-3 pt-2.5 pb-1.5 uppercase tracking-wider font-bold">
              Joueurs & Rôles
            </p>
            <div className="overflow-y-auto flex-1 px-2 pb-3">
              {allPlayers.map(p => {
                const rc = getRoleColor(p.role);
                const isDead = !p.alive;
                return (
                  <div key={p.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg mb-1 ${isDead ? 'opacity-30' : ''}`}
                    style={{ background: isDead ? 'rgba(255,255,255,0.02)' : rc.bg }}>
                    <div className="w-7 h-7 rounded-full bg-[#0f0f1a] flex items-center justify-center text-[10px] font-bold text-[#f5e6ca] flex-shrink-0">
                      {isDead ? '💀' : (ROLE_ICONS[p.role] || p.username?.[0]?.toUpperCase())}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${isDead ? 'text-[#555] line-through' : 'text-[#f5e6ca]'}`}>
                        {p.username}
                      </p>
                      <p className="text-[10px]" style={{ color: isDead ? '#444' : rc.color }}>
                        {isDead ? 'Mort' : (ROLE_LABELS[p.role] || 'Sans rôle')}
                      </p>
                    </div>
                    {p.alive && (
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isWolfRole(p.role) ? 'bg-[#ef4444]' : 'bg-[#3b82f6]'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}