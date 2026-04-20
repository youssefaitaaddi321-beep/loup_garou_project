import { useGame } from '../context/GameContext';
import { ROLE_LABELS } from '../constants/roles';

export default function NightSummary({ roomId, send, onClose }) {
  const { state } = useGame();
  const summary = state.nightSummary;
  if (!summary) return null;
  const deaths = summary.deaths || [];

  return (
    <div className="fixed inset-0 z-[60] flex items-end" style={{ background:'rgba(0,0,0,0.85)' }}>
      <div className="w-full rounded-t-3xl overflow-hidden animate-slide-up"
        style={{ background:'#0f0f1a', border:'1px solid rgba(255,255,255,0.08)', borderBottom:'none', maxHeight:'85vh', display:'flex', flexDirection:'column' }}>
        {/* Handle + Header */}
        <div className="px-5 pt-3 pb-4 flex-shrink-0" style={{ background:'#1a1a2e', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-10 h-1 rounded-full mx-auto mb-3" style={{ background:'rgba(255,255,255,0.15)' }} />
          <div className="flex items-center gap-3">
            <span style={{ fontSize:28 }}>🌙</span>
            <div>
              <p className="font-bold text-sm" style={{ color:'#f5e6ca' }}>Résumé de la nuit</p>
              <p className="text-xs" style={{ color:'rgba(245,230,202,0.4)' }}>Ce qui s'est passé cette nuit</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scroll-smooth p-4 space-y-2.5">

          {/* Wolf attack */}
          <div className="rounded-2xl px-4 py-3" style={{ background:'rgba(127,29,29,0.2)',border:'1px solid #7f1d1d' }}>
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color:'rgba(245,230,202,0.4)' }}>Attaque des loups</p>
            <p className="font-semibold text-sm" style={{ color:'#fca5a5' }}>
              {summary.wolfVictimName ? `🐺 ${summary.wolfVictimName} a été attaqué` : 'Aucune attaque cette nuit'}
            </p>
          </div>

          {summary.salvateurSaved&&(
            <div className="rounded-2xl px-4 py-3" style={{ background:'rgba(19,78,74,0.2)',border:'1px solid #0f766e' }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color:'rgba(245,230,202,0.4)' }}>Protection du Salvateur</p>
              <p className="font-semibold text-sm" style={{ color:'#5eead4' }}>🛡️ {summary.wolfVictimName} a été protégé(e) !</p>
            </div>
          )}
          {summary.witchSaved&&(
            <div className="rounded-2xl px-4 py-3" style={{ background:'rgba(6,95,70,0.2)',border:'1px solid #065f46' }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color:'rgba(245,230,202,0.4)' }}>Potion de vie</p>
              <p className="font-semibold text-sm" style={{ color:'#6ee7b7' }}>🧪 {summary.savedVictimName||'La victime'} a été sauvé(e)</p>
            </div>
          )}
          {summary.witchKillName&&(
            <div className="rounded-2xl px-4 py-3" style={{ background:'rgba(127,29,29,0.2)',border:'1px solid #991b1b' }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color:'rgba(245,230,202,0.4)' }}>Potion de mort</p>
              <p className="font-semibold text-sm" style={{ color:'#fca5a5' }}>☠️ {summary.witchKillName} a été empoisonné(e)</p>
            </div>
          )}
          {summary.protectedName&&!summary.salvateurSaved&&(
            <div className="rounded-2xl px-4 py-3" style={{ background:'rgba(19,78,74,0.2)',border:'1px solid #0f766e' }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color:'rgba(245,230,202,0.4)' }}>Protection du Salvateur</p>
              <p className="font-semibold text-sm" style={{ color:'#5eead4' }}>🛡️ {summary.protectedName} a été protégé(e)</p>
            </div>
          )}
          {summary.loupBlancKillName&&(
            <div className="rounded-2xl px-4 py-3" style={{ background:'rgba(71,85,105,0.2)',border:'1px solid #475569' }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color:'rgba(245,230,202,0.4)' }}>Loup Blanc</p>
              <p className="font-semibold text-sm" style={{ color:'#cbd5e1' }}>🤍 {summary.loupBlancKillName} a été éliminé par le Loup Blanc</p>
            </div>
          )}

          {/* Deaths */}
          <div className="rounded-2xl px-4 py-3" style={{ background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color:'rgba(245,230,202,0.4)' }}>Morts ce matin</p>
            {deaths.length===0?(
              <p className="font-semibold text-sm" style={{ color:'#6ee7b7' }}>✨ Personne n'est mort cette nuit !</p>
            ):deaths.map((d,i)=>(
              <div key={i} className={`flex items-center gap-2.5 py-2 ${i<deaths.length-1?'border-b':''}`}
                style={{ borderColor:'rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize:18 }}>💀</span>
                <div>
                  <p className="font-semibold text-sm" style={{ color:'#f5e6ca' }}>{d.name}</p>
                  <p className="text-xs" style={{ color:'rgba(245,230,202,0.4)' }}>
                    {ROLE_LABELS[d.role]||d.role} ·{' '}
                    {d.cause==='LOUPS'?'Tué par les loups':d.cause==='SORCIERE'?'Empoisonné':d.cause==='LOUP_BLANC'?'Loup Blanc':d.cause==='AMOUR'?'Mort de chagrin':'Cause inconnue'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 flex gap-3 flex-shrink-0" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onClose}
            className="flex-1 py-3 rounded-2xl text-sm font-medium active:scale-98"
            style={{ background:'rgba(255,255,255,0.06)',color:'rgba(245,230,202,0.6)',border:'none',cursor:'pointer' }}>
            Fermer
          </button>
          <button onClick={()=>{send('/narrator/reveal-deaths',{roomId});onClose();}}
            className="flex-[2] py-3 rounded-2xl text-sm font-bold text-white active:scale-98"
            style={{ background:'#e94560',border:'none',cursor:'pointer',boxShadow:'0 4px 16px rgba(233,69,96,0.3)' }}>
            Révéler les morts au village
          </button>
        </div>
      </div>
    </div>
  );
}
