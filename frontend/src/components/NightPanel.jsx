import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { ROLE_LABELS } from '../constants/roles';

const ROLE_NIGHT_LABELS = {
  LOUP_GAROU:   { label: 'Loups-Garous',  icon: '🐺', border: '#7f1d1d', bg: 'rgba(127,29,29,0.15)' },
  LOUP_BLANC:   { label: 'Loup Blanc',    icon: '🤍', border: '#475569', bg: 'rgba(71,85,105,0.15)' },
  VOYANTE:      { label: 'Voyante',        icon: '🔮', border: '#6d28d9', bg: 'rgba(109,40,217,0.15)' },
  SORCIERE:     { label: 'Sorcière',       icon: '🧙', border: '#065f46', bg: 'rgba(6,95,70,0.15)' },
  SALVATEUR:    { label: 'Salvateur',      icon: '🛡️', border: '#134e4a', bg: 'rgba(19,78,74,0.15)' },
  CUPIDON:      { label: 'Cupidon',        icon: '💘', border: '#9d174d', bg: 'rgba(157,23,77,0.15)' },
  PETITE_FILLE: { label: 'Petite Fille',   icon: '👧', border: '#be185d', bg: 'rgba(190,24,93,0.1)' },
};

export default function NightPanel({ roomId, send, calledRole, nightResult, onDone }) {
  const { state } = useGame();
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [selectedLovers, setSelectedLovers] = useState([]);
  const [done, setDone] = useState(false);
  const [seerReveal, setSeerReveal] = useState(null);
  const [witchAction, setWitchAction] = useState(null);

  const myRole = state.myRole;
  const isMyTurn = calledRole && (
    myRole === calledRole ||
    (calledRole === 'LOUP_GAROU' && (myRole === 'LOUP_GAROU' || myRole === 'LOUP_BLANC'))
  );

  // Only show alive players in action lists (bug fix #17)
  const alivePlayers = state.room?.players?.filter(p => p.alive && !p.narrator) || [];
  const wolves = alivePlayers.filter(p =>
    p.role === 'LOUP_GAROU' || p.role === 'LOUP_BLANC'
  );
  const nonWolves = alivePlayers.filter(p =>
    p.role !== 'LOUP_GAROU' && p.role !== 'LOUP_BLANC'
  );
  const me = state.player;

  const nightVictimName = state.nightCall?.nightVictimName;
  const nightVictimId   = state.nightCall?.nightVictimId;
  const witchLifeUsed   = state.nightCall?.witchLifeUsed;
  const witchDeathUsed  = state.nightCall?.witchDeathUsed;
  const isLoupBlancNight = state.nightCall?.isLoupBlancNight;

  useEffect(() => {
    setSelectedTarget(null);
    setSelectedLovers([]);
    setDone(false);
    setSeerReveal(null);
    setWitchAction(null);
  }, [calledRole]);

  useEffect(() => {
    if (nightResult?.type === 'SEER_REVEAL') {
      setSeerReveal(nightResult);
    }
  }, [nightResult]);

  const confirmWolvesTarget = () => {
    if (!selectedTarget) return;
    send('/night/wolves-target', { roomId, targetId: selectedTarget, wolfId: me?.id });
    // Don't set done yet — wait for all wolves to vote
  };

  const confirmSeer = () => {
    if (!selectedTarget || !me?.id) return;
    send('/night/seer-action', {
      roomId,
      targetId: selectedTarget,
      seerUserId: me.id,
    });
  };

  const confirmSalvateur = () => {
    if (!selectedTarget) return;
    send('/night/salvateur-protect', { roomId, targetId: selectedTarget });
    setDone(true);
    onDone?.();
  };

  const witchSave = () => {
    send('/night/witch-save', { roomId });
    setWitchAction('saved');
    setDone(true);
    onDone?.();
  };

  const witchKill = () => {
    if (!selectedTarget) return;
    send('/night/witch-kill', { roomId, targetId: selectedTarget });
    setWitchAction('killed');
    setDone(true);
    onDone?.();
  };

  const witchPass = () => {
    send('/night/witch-pass', { roomId });
    setDone(true);
    onDone?.();
  };

  const toggleLover = (id) => {
    setSelectedLovers(prev =>
      prev.includes(id)
        ? prev.filter(l => l !== id)
        : prev.length < 2 ? [...prev, id] : prev
    );
  };

  const confirmCupidon = () => {
    if (selectedLovers.length !== 2) return;
    send('/night/cupidon-link', {
      roomId,
      lover1Id: selectedLovers[0],
      lover2Id: selectedLovers[1],
    });
    setDone(true);
    onDone?.();
  };

  const confirmLoupBlanc = () => {
    if (!selectedTarget) return;
    send('/night/loup-blanc-kill', { roomId, targetId: selectedTarget });
    setDone(true);
    onDone?.();
  };

  const loupBlancPass = () => {
    send('/night/loup-blanc-pass', { roomId });
    setDone(true);
    onDone?.();
  };

  if (!calledRole || !isMyTurn) return null;

  const meta = ROLE_NIGHT_LABELS[calledRole] || { label: calledRole, icon: '❓', border: '#444', bg: 'rgba(0,0,0,0.1)' };

  return (
    <div className="fixed right-0 top-0 h-full w-[300px] z-50 bg-[#0f0f1a] flex flex-col transition-transform duration-300"
      style={{ borderLeft: `2px solid ${meta.border}` }}>

      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1a1a2e] flex items-center gap-3 flex-shrink-0"
        style={{ background: meta.bg }}>
        <span className="text-3xl">{meta.icon}</span>
        <div>
          <p className="text-[#f5e6ca] font-semibold text-sm">{meta.label}</p>
          <p className="text-[#888] text-xs">C'est votre tour</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">

        {done ? (
          <div className="text-center pt-10">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-[#f5e6ca] font-medium mb-1">Action effectuée</p>
            <p className="text-[#888] text-sm">En attente du narrateur...</p>
          </div>
        ) : (
          <>
            {/* LOUPS */}
            {calledRole === 'LOUP_GAROU' && (
              <div>
                <p className="text-[#888] text-xs mb-2">Vos congénères:</p>
                {wolves.map(w => (
                  <div key={w.id} className="flex items-center gap-2 bg-[rgba(127,29,29,0.3)] border border-[#7f1d1d] rounded-xl px-3 py-2 mb-1.5">
                    <div className="w-6 h-6 rounded-full bg-[#7f1d1d] flex items-center justify-center text-[10px] font-bold text-[#fca5a5] flex-shrink-0">
                      {w.username?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-[#fca5a5] text-sm font-medium">{w.username}</span>
                    {w.id === me?.id && <span className="text-[#888] text-[10px] ml-auto">(vous)</span>}
                  </div>
                ))}

                {/* Wolf vote result */}
                {nightResult?.type === 'WOLVES_TIE' && (
                  <div className="bg-[rgba(120,53,15,0.3)] border border-[#b45309] rounded-xl p-3 text-center my-3">
                    <p className="text-[#fcd34d] text-sm font-semibold">⚖️ Égalité !</p>
                    <p className="text-[#888] text-xs mt-1">Personne n'est attaqué cette nuit</p>
                  </div>
                )}

                {nightResult?.type === 'WOLVES_TARGET' && (
                  <div className="bg-[rgba(127,29,29,0.3)] border border-[#ef4444] rounded-xl p-3 text-center my-3">
                    <p className="text-[#fca5a5] text-sm font-semibold">🐺 Cible choisie</p>
                    <p className="text-[#f5e6ca] text-base font-bold mt-1">{nightResult.targetName}</p>
                  </div>
                )}

                {/* Show other wolves' votes */}
                {nightResult?.type === 'WOLF_VOTE' && (
                  <div className="bg-[rgba(255,255,255,0.04)] border border-[#1a1a2e] rounded-xl p-2.5 my-2">
                    <p className="text-[#888] text-xs">
                      <span className="text-[#fca5a5] font-medium">{nightResult.wolfName}</span> a voté
                      {' — '}<span className="text-[#f5e6ca]">{nightResult.votesCount}/{nightResult.totalWolves}</span> votes
                    </p>
                  </div>
                )}

                {!done && nightResult?.type !== 'WOLVES_TARGET' && nightResult?.type !== 'WOLVES_TIE' && (
                  <>
                    <p className="text-[#888] text-xs mt-3 mb-2">Votez pour votre victime:</p>
                    {nonWolves.map(p => (
                      <div key={p.id} onClick={() => setSelectedTarget(p.id)}
                        className={`flex items-center gap-2 rounded-xl px-3 py-2 mb-1.5 cursor-pointer transition-all ${
                          selectedTarget === p.id
                            ? 'bg-[rgba(127,29,29,0.3)] border border-[#ef4444]'
                            : 'bg-[rgba(255,255,255,0.04)] border border-[#1a1a2e]'
                        }`}>
                        <div className="w-6 h-6 rounded-full bg-[#1a1a2e] flex items-center justify-center text-[10px] font-bold text-[#f5e6ca] flex-shrink-0">
                          {p.username?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-[#f5e6ca] text-sm">{p.username}</span>
                        {selectedTarget === p.id && <span className="ml-auto text-[#ef4444] text-xs">Cible ✓</span>}
                      </div>
                    ))}
                    <button onClick={confirmWolvesTarget} disabled={!selectedTarget}
                      className={`w-full mt-2 border-none rounded-xl py-2.5 font-bold text-sm ${
                        selectedTarget ? 'bg-[#7f1d1d] text-[#fca5a5] cursor-pointer' : 'bg-[#333] text-[#666] cursor-not-allowed'
                      }`}>Voter pour cette cible</button>
                  </>
                )}

                {(nightResult?.type === 'WOLVES_TARGET' || nightResult?.type === 'WOLVES_TIE') && !done && (
                  <button onClick={() => { setDone(true); onDone?.(); }}
                    className="w-full mt-3 bg-[#7f1d1d] text-[#fca5a5] border-none rounded-xl py-2.5 text-sm font-semibold cursor-pointer">
                    Fermer les yeux
                  </button>
                )}
              </div>
            )}

            {/* LOUP BLANC — solo kill night */}
            {calledRole === 'LOUP_BLANC' && (
              <div>
                {isLoupBlancNight ? (
                  <>
                    <p className="text-[#888] text-xs mb-2">C'est votre nuit spéciale. Choisissez un loup à éliminer:</p>
                    {wolves.filter(w => w.id !== me?.id).map(p => (
                      <div key={p.id} onClick={() => setSelectedTarget(p.id)}
                        className={`flex items-center gap-2 rounded-xl px-3 py-2 mb-1.5 cursor-pointer transition-all ${
                          selectedTarget === p.id
                            ? 'bg-[rgba(71,85,105,0.3)] border border-[#64748b]'
                            : 'bg-[rgba(255,255,255,0.04)] border border-[#1a1a2e]'
                        }`}>
                        <div className="w-6 h-6 rounded-full bg-[#1a1a2e] flex items-center justify-center text-[10px] font-bold text-[#f5e6ca] flex-shrink-0">
                          {p.username?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-[#f5e6ca] text-sm">{p.username}</span>
                        {selectedTarget === p.id && <span className="ml-auto text-[#cbd5e1] text-xs">Cible ✓</span>}
                      </div>
                    ))}
                    <button onClick={confirmLoupBlanc} disabled={!selectedTarget}
                      className={`w-full mt-2 border-none rounded-xl py-2.5 font-bold text-sm ${
                        selectedTarget ? 'bg-[rgba(71,85,105,0.5)] text-[#cbd5e1] cursor-pointer' : 'bg-[#333] text-[#666] cursor-not-allowed'
                      }`}>🤍 Éliminer ce loup</button>
                    <button onClick={loupBlancPass}
                      className="w-full mt-2 bg-[rgba(255,255,255,0.04)] text-[#888] border border-[#1a1a2e] rounded-xl py-2.5 text-sm cursor-pointer">
                      Passer cette nuit
                    </button>
                  </>
                ) : (
                  <div className="text-center pt-8">
                    <div className="text-4xl mb-3">🤍</div>
                    <p className="text-[#f5e6ca] font-medium mb-1">Ce n'est pas votre nuit spéciale</p>
                    <p className="text-[#555] text-sm mb-4">Vous pourrez agir la nuit prochaine</p>
                    <button onClick={() => { send('/night/loup-blanc-pass', { roomId }); setDone(true); onDone?.(); }}
                      className="w-full bg-[rgba(71,85,105,0.3)] text-[#cbd5e1] border-none rounded-xl py-2.5 text-sm font-medium cursor-pointer">
                      Fermer les yeux
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* VOYANTE */}
            {calledRole === 'VOYANTE' && (
              <div>
                {seerReveal ? (
                  <div className="text-center pt-5">
                    <div className="text-4xl mb-3">🔮</div>
                    <p className="text-[#888] text-xs mb-1">Votre vision révèle...</p>
                    <p className="text-[#f5e6ca] font-bold text-lg mb-3">{seerReveal.targetName}</p>
                    <div className={`inline-block px-5 py-2 rounded-xl font-bold text-sm border ${
                      seerReveal.role === 'LOUP_GAROU' || seerReveal.role === 'LOUP_BLANC'
                        ? 'bg-[rgba(127,29,29,0.4)] text-[#fca5a5] border-[#ef4444]'
                        : 'bg-[rgba(30,58,138,0.4)] text-[#93c5fd] border-[#3b82f6]'
                    }`}>
                      {seerReveal.role === 'LOUP_GAROU' ? '🐺 Loup-Garou !'
                       : seerReveal.role === 'LOUP_BLANC' ? '🤍 Loup Blanc !'
                       : `✨ ${ROLE_LABELS[seerReveal.role] || seerReveal.role}`}
                    </div>
                    <p className="text-[#555] text-xs mt-4">Gardez cette information secrète...</p>
                    <button onClick={() => { setDone(true); onDone?.(); }}
                      className="w-full mt-4 bg-[#3b0764] text-[#c4b5fd] border-none rounded-xl py-2.5 text-sm font-semibold cursor-pointer">
                      Fermer les yeux
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-[#888] text-xs mb-2">Choisissez un joueur à espionner:</p>
                    {alivePlayers.filter(p => p.id !== me?.id).map(p => (
                      <div key={p.id} onClick={() => setSelectedTarget(p.id)}
                        className={`flex items-center gap-2 rounded-xl px-3 py-2 mb-1.5 cursor-pointer transition-all ${
                          selectedTarget === p.id
                            ? 'bg-[rgba(109,40,217,0.2)] border border-[#7c3aed]'
                            : 'bg-[rgba(255,255,255,0.04)] border border-[#1a1a2e]'
                        }`}>
                        <div className="w-6 h-6 rounded-full bg-[#1a1a2e] flex items-center justify-center text-[10px] font-bold text-[#f5e6ca] flex-shrink-0">
                          {p.username?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-[#f5e6ca] text-sm">{p.username}</span>
                      </div>
                    ))}
                    <button onClick={confirmSeer} disabled={!selectedTarget}
                      className={`w-full mt-2 border-none rounded-xl py-2.5 font-bold text-sm ${
                        selectedTarget ? 'bg-[#3b0764] text-[#c4b5fd] cursor-pointer' : 'bg-[#333] text-[#666] cursor-not-allowed'
                      }`}>🔮 Regarder la carte</button>
                  </>
                )}
              </div>
            )}

            {/* SORCIERE */}
            {calledRole === 'SORCIERE' && (
              <div>
                {nightVictimName ? (
                  <div className="bg-[rgba(127,29,29,0.25)] border border-[#7f1d1d] rounded-xl p-3 text-center mb-3">
                    <p className="text-[#fca5a5] text-xs mb-1">Les loups ont attaqué...</p>
                    <p className="text-[#f5e6ca] font-bold text-base">{nightVictimName}</p>
                  </div>
                ) : (
                  <div className="bg-[rgba(255,255,255,0.04)] border border-[#1a1a2e] rounded-xl p-3 text-center mb-3">
                    <p className="text-[#555] text-sm">Personne n'a été attaqué cette nuit</p>
                  </div>
                )}

                {!witchLifeUsed && nightVictimName && (
                  <button onClick={witchSave}
                    className="w-full mb-2 bg-[rgba(6,95,70,0.4)] text-[#6ee7b7] border border-[#065f46] rounded-xl p-3 font-bold text-sm cursor-pointer text-left">
                    🧪 Potion de vie
                    <span className="block text-xs font-normal opacity-70 mt-0.5">Sauver {nightVictimName}</span>
                  </button>
                )}
                {witchLifeUsed && (
                  <div className="mb-2 px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[#1a1a2e]">
                    <p className="text-[#555] text-xs">Potion de vie déjà utilisée</p>
                  </div>
                )}

                {!witchDeathUsed && (
                  <div className="mb-2">
                    <p className="text-[#888] text-xs mb-1.5">Potion de mort — choisir une cible:</p>
                    {alivePlayers.filter(p => p.id !== nightVictimId).map(p => (
                      <div key={p.id} onClick={() => setSelectedTarget(p.id)}
                        className={`flex items-center gap-2 rounded-xl px-3 py-2 mb-1 cursor-pointer transition-all ${
                          selectedTarget === p.id
                            ? 'bg-[rgba(127,29,29,0.25)] border border-[#ef4444]'
                            : 'bg-[rgba(255,255,255,0.04)] border border-[#1a1a2e]'
                        }`}>
                        <div className="w-6 h-6 rounded-full bg-[#1a1a2e] flex items-center justify-center text-[10px] font-bold text-[#f5e6ca] flex-shrink-0">
                          {p.username?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-[#f5e6ca] text-sm">{p.username}</span>
                      </div>
                    ))}
                    <button onClick={witchKill} disabled={!selectedTarget}
                      className={`w-full mt-1.5 border rounded-xl py-2.5 font-bold text-sm ${
                        selectedTarget
                          ? 'bg-[rgba(127,29,29,0.4)] text-[#fca5a5] border-[#7f1d1d] cursor-pointer'
                          : 'bg-[#1a1a2e] text-[#555] border-[#333] cursor-not-allowed'
                      }`}>☠️ Utiliser la potion de mort</button>
                  </div>
                )}
                {witchDeathUsed && (
                  <div className="mb-2 px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[#1a1a2e]">
                    <p className="text-[#555] text-xs">Potion de mort déjà utilisée</p>
                  </div>
                )}

                <button onClick={witchPass}
                  className="w-full mt-1 bg-[rgba(255,255,255,0.04)] text-[#888] border border-[#1a1a2e] rounded-xl py-2.5 text-sm cursor-pointer">
                  Fermer les yeux
                </button>
              </div>
            )}

            {/* SALVATEUR */}
            {calledRole === 'SALVATEUR' && (
              <div>
                <p className="text-[#888] text-xs mb-2">Choisissez un joueur à protéger:</p>
                {alivePlayers.map(p => (
                  <div key={p.id} onClick={() => setSelectedTarget(p.id)}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 mb-1.5 cursor-pointer transition-all ${
                      selectedTarget === p.id
                        ? 'bg-[rgba(19,78,74,0.3)] border border-[#0f766e]'
                        : 'bg-[rgba(255,255,255,0.04)] border border-[#1a1a2e]'
                    }`}>
                    <div className="w-6 h-6 rounded-full bg-[#1a1a2e] flex items-center justify-center text-[10px] font-bold text-[#f5e6ca] flex-shrink-0">
                      {p.username?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-[#f5e6ca] text-sm">{p.username}</span>
                    {p.id === me?.id && <span className="text-[#888] text-[10px] ml-auto">(vous)</span>}
                  </div>
                ))}
                <button onClick={confirmSalvateur} disabled={!selectedTarget}
                  className={`w-full mt-2 border rounded-xl py-2.5 font-bold text-sm ${
                    selectedTarget
                      ? 'bg-[rgba(19,78,74,0.5)] text-[#5eead4] border-[#0f766e] cursor-pointer'
                      : 'bg-[#1a1a2e] text-[#555] border-[#333] cursor-not-allowed'
                  }`}>🛡️ Protéger ce joueur</button>
              </div>
            )}

            {/* CUPIDON */}
            {calledRole === 'CUPIDON' && (
              <div>
                <p className="text-[#888] text-xs mb-2">
                  Choisissez 2 joueurs à lier ({selectedLovers.length}/2):
                </p>
                {alivePlayers.map(p => {
                  const isSelected = selectedLovers.includes(p.id);
                  const isDisabled = !isSelected && selectedLovers.length >= 2;
                  return (
                    <div key={p.id} onClick={() => !isDisabled && toggleLover(p.id)}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 mb-1.5 transition-all ${
                        isDisabled ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'
                      } ${isSelected
                        ? 'bg-[rgba(157,23,77,0.25)] border border-[#db2777]'
                        : 'bg-[rgba(255,255,255,0.04)] border border-[#1a1a2e]'
                      }`}>
                      <div className="w-6 h-6 rounded-full bg-[#1a1a2e] flex items-center justify-center text-[10px] font-bold text-[#f5e6ca] flex-shrink-0">
                        {p.username?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-[#f5e6ca] text-sm">{p.username}</span>
                      {isSelected && <span className="ml-auto text-sm">💘</span>}
                    </div>
                  );
                })}
                {selectedLovers.length === 2 && (
                  <div className="bg-[rgba(157,23,77,0.15)] border border-[#9d174d] rounded-xl p-2.5 text-center my-2.5">
                    <p className="text-[#f9a8d4] text-sm">
                      {alivePlayers.find(p => p.id === selectedLovers[0])?.username}
                      <span className="mx-2">💘</span>
                      {alivePlayers.find(p => p.id === selectedLovers[1])?.username}
                    </p>
                  </div>
                )}
                <button onClick={confirmCupidon} disabled={selectedLovers.length !== 2}
                  className={`w-full mt-2 border rounded-xl py-2.5 font-bold text-sm ${
                    selectedLovers.length === 2
                      ? 'bg-[rgba(157,23,77,0.4)] text-[#f9a8d4] border-[#9d174d] cursor-pointer'
                      : 'bg-[#1a1a2e] text-[#555] border-[#333] cursor-not-allowed'
                  }`}>💘 Lier ces deux joueurs</button>
              </div>
            )}

            {/* PETITE FILLE */}
            {calledRole === 'PETITE_FILLE' && (
              <div className="text-center pt-5">
                <div className="text-4xl mb-3">👁️</div>
                <p className="text-[#f5e6ca] font-medium mb-1">Vous entrouvrez les yeux...</p>
                <div className="bg-[rgba(255,255,255,0.04)] border border-[#1a1a2e] rounded-xl p-3 mb-3">
                  <p className="text-[#888] text-xs mb-1.5">Loups actifs cette nuit:</p>
                  {wolves.length > 0 ? wolves.map(w => (
                    <div key={w.id} className="text-[#fca5a5] text-sm py-0.5">
                      {w.username} 🐺
                    </div>
                  )) : (
                    <p className="text-[#555] text-xs">Aucun loup visible</p>
                  )}
                </div>
                <p className="text-[#555] text-xs mb-3">
                  Attention — si les loups vous repèrent, vous êtes éliminée !
                </p>
                <button onClick={() => { setDone(true); onDone?.(); }}
                  className="w-full bg-[rgba(157,23,77,0.3)] text-[#f9a8d4] border border-[#9d174d] rounded-xl py-2.5 text-sm font-semibold cursor-pointer">
                  Refermer les yeux
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
