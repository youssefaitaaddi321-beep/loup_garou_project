import { useState } from 'react';
import { useGame } from '../context/GameContext';

export default function ChasseurPanel({ roomId, send, onDone }) {
  const { state } = useGame();
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);

  const chasseurId = state.chasseurShot?.chasseurId;
  const isChasseur = state.player?.id === chasseurId;
  const isNarrator = state.player?.narrator;
  const alivePlayers = state.room?.players?.filter(p => p.alive && !p.narrator && p.id !== chasseurId) || [];

  // Only the chasseur and narrator see this panel
  if (!isChasseur && !isNarrator) return null;

  const confirmShot = () => {
    if (!selected) return;
    send('/night/chasseur-shot', { roomId, targetId: selected });
    setDone(true);
    setTimeout(() => onDone?.(), 2000);
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.92)' }}>
      <div className="w-full max-w-sm bg-[#0f0f1a] border border-[#78350f] rounded-2xl overflow-hidden">

        <div className="bg-[rgba(120,53,15,0.3)] px-5 py-4 border-b border-[#1a1a2e] flex items-center gap-3">
          <span className="text-3xl">🏹</span>
          <div>
            <p className="text-[#fcd34d] font-bold text-base">
              {isChasseur ? 'Votre dernière flèche' : `${state.chasseurShot?.chasseurName} — Chasseur`}
            </p>
            <p className="text-[#888] text-xs">
              {isChasseur ? 'Vous avez été éliminé. Choisissez votre cible !' : 'Le chasseur doit tirer sa dernière flèche'}
            </p>
          </div>
        </div>

        <div className="p-4">
          {done ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-[#f5e6ca] font-semibold">Flèche tirée !</p>
              <p className="text-[#888] text-sm mt-1">La cible a été touchée...</p>
            </div>
          ) : (
            <>
              <p className="text-[#888] text-xs mb-3">
                {isChasseur ? 'Choisissez qui emporter avec vous :' : 'En attente du choix du chasseur...'}
              </p>
              {(isChasseur || isNarrator) && alivePlayers.map(p => (
                <div key={p.id} onClick={() => isChasseur && setSelected(p.id)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 mb-1.5 transition-all ${
                    isChasseur ? 'cursor-pointer' : 'cursor-default'
                  } ${selected === p.id
                    ? 'bg-[rgba(120,53,15,0.3)] border border-[#b45309]'
                    : 'bg-[rgba(255,255,255,0.04)] border border-[#1a1a2e]'
                  }`}>
                  <div className="w-6 h-6 rounded-full bg-[#1a1a2e] flex items-center justify-center text-[10px] font-bold text-[#f5e6ca] flex-shrink-0">
                    {p.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-[#f5e6ca] text-sm">{p.username}</span>
                  {selected === p.id && <span className="ml-auto text-[#fcd34d] text-xs">🎯 Cible</span>}
                </div>
              ))}
              {isChasseur && (
                <button onClick={confirmShot} disabled={!selected}
                  className={`w-full mt-3 border-none rounded-xl py-2.5 font-bold text-sm cursor-pointer ${
                    selected ? 'bg-[#78350f] text-[#fcd34d]' : 'bg-[#333] text-[#666] cursor-not-allowed'
                  }`}>
                  🏹 Tirer la flèche
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
