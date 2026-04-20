import { useGame } from '../context/GameContext';
import { ROLE_LABELS } from '../constants/roles';

export default function NightSummary({ roomId, send, onClose }) {
  const { state } = useGame();
  const summary = state.nightSummary;
  if (!summary) return null;

  const deaths = summary.deaths || [];

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-5">
      <div className="bg-[#0f0f1a] border border-[#1a1a2e] rounded-2xl w-full max-w-md overflow-hidden">

        <div className="bg-[#1a1a2e] px-5 py-4 border-b border-[#0a0a0f] flex items-center gap-3">
          <span className="text-2xl">🌙</span>
          <div>
            <p className="text-[#f5e6ca] font-bold text-sm">Résumé de la nuit</p>
            <p className="text-[#555] text-xs">Ce qui s'est passé cette nuit</p>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-2.5">

          {/* Wolf target */}
          <div className="bg-[rgba(127,29,29,0.2)] border border-[#7f1d1d] rounded-xl px-3.5 py-2.5">
            <p className="text-[#888] text-[10px] uppercase tracking-wider mb-1">Attaque des loups</p>
            <p className="text-[#fca5a5] font-semibold text-sm">
              {summary.wolfVictimName
                ? `🐺 ${summary.wolfVictimName} a été attaqué`
                : 'Aucune attaque cette nuit'}
            </p>
          </div>

          {/* Salvateur saved */}
          {summary.salvateurSaved && (
            <div className="bg-[rgba(19,78,74,0.2)] border border-[#0f766e] rounded-xl px-3.5 py-2.5">
              <p className="text-[#888] text-[10px] uppercase tracking-wider mb-1">Protection du Salvateur</p>
              <p className="text-[#5eead4] font-semibold text-sm">
                🛡️ {summary.wolfVictimName} a été protégé(e) par le Salvateur !
              </p>
            </div>
          )}

          {/* Witch save */}
          {summary.witchSaved && (
            <div className="bg-[rgba(6,95,70,0.2)] border border-[#065f46] rounded-xl px-3.5 py-2.5">
              <p className="text-[#888] text-[10px] uppercase tracking-wider mb-1">Potion de vie</p>
              <p className="text-[#6ee7b7] font-semibold text-sm">
                🧪 {summary.savedVictimName || 'La victime'} a été sauvé(e)
              </p>
            </div>
          )}

          {/* Witch kill */}
          {summary.witchKillName && (
            <div className="bg-[rgba(127,29,29,0.2)] border border-[#991b1b] rounded-xl px-3.5 py-2.5">
              <p className="text-[#888] text-[10px] uppercase tracking-wider mb-1">Potion de mort</p>
              <p className="text-[#fca5a5] font-semibold text-sm">
                ☠️ {summary.witchKillName} a été empoisonné(e)
              </p>
            </div>
          )}

          {/* Salvateur protection info */}
          {summary.protectedName && !summary.salvateurSaved && (
            <div className="bg-[rgba(19,78,74,0.2)] border border-[#0f766e] rounded-xl px-3.5 py-2.5">
              <p className="text-[#888] text-[10px] uppercase tracking-wider mb-1">Protection du Salvateur</p>
              <p className="text-[#5eead4] font-semibold text-sm">
                🛡️ {summary.protectedName} a été protégé(e)
              </p>
            </div>
          )}

          {/* Loup Blanc kill */}
          {summary.loupBlancKillName && (
            <div className="bg-[rgba(71,85,105,0.2)] border border-[#475569] rounded-xl px-3.5 py-2.5">
              <p className="text-[#888] text-[10px] uppercase tracking-wider mb-1">Loup Blanc</p>
              <p className="text-[#cbd5e1] font-semibold text-sm">
                🤍 {summary.loupBlancKillName} a été éliminé par le Loup Blanc
              </p>
            </div>
          )}

          {/* Deaths this morning */}
          <div className="bg-black/30 border border-[#1a1a2e] rounded-xl px-3.5 py-2.5">
            <p className="text-[#888] text-[10px] uppercase tracking-wider mb-2">Morts ce matin</p>
            {deaths.length === 0 ? (
              <p className="text-[#6ee7b7] font-semibold text-sm">✨ Personne n'est mort cette nuit !</p>
            ) : deaths.map((d, i) => (
              <div key={i} className={`flex items-center gap-2 py-1 ${i < deaths.length - 1 ? 'border-b border-[#1a1a2e]' : ''}`}>
                <span className="text-base">💀</span>
                <div>
                  <p className="text-[#f5e6ca] font-semibold text-sm">{d.name}</p>
                  <p className="text-[#555] text-[10px]">
                    {ROLE_LABELS[d.role] || d.role} ·{' '}
                    {d.cause === 'LOUPS' ? 'Tué par les loups' :
                     d.cause === 'SORCIERE' ? 'Empoisonné par la sorcière' :
                     d.cause === 'LOUP_BLANC' ? 'Éliminé par le Loup Blanc' :
                     d.cause === 'AMOUR' ? 'Mort de chagrin (amour)' :
                     'Cause inconnue'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-1">
            <button onClick={onClose}
              className="flex-1 bg-[rgba(255,255,255,0.05)] text-[#888] border border-[#1a1a2e] rounded-xl py-2.5 text-sm font-medium cursor-pointer">
              Fermer
            </button>
            <button onClick={() => { send('/narrator/reveal-deaths', { roomId }); onClose(); }}
              className="flex-[2] bg-[#e94560] text-white border-none rounded-xl py-2.5 text-sm font-bold cursor-pointer">
              Révéler les morts au village
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
