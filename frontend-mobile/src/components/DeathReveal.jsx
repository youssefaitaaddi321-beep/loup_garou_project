import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { ROLE_LABELS, ROLE_ICONS, isWolfRole } from '../constants/roles';

export default function DeathReveal({ onClose }) {
  const { state } = useGame();
  const [visible, setVisible]       = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const deaths = state.deathReveal?.deaths || [];

  useEffect(() => { setTimeout(() => setVisible(true), 50); }, []);
  useEffect(() => { setVisible(false); setTimeout(() => setVisible(true), 100); }, [currentIndex]);

  const getCauseText = (cause) => ({
    LOUPS:     'Tué par les loups',
    SORCIERE:  'Empoisonné par la Sorcière',
    LOUP_BLANC:'Éliminé par le Loup Blanc',
    AMOUR:     'Mort de chagrin',
  }[cause] || 'Cause inconnue');

  if (deaths.length === 0) {
    return (
      <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center px-6"
        style={{ background:'rgba(0,0,0,0.97)', transition:'opacity 0.5s', opacity:visible?1:0 }}>
        <div style={{ fontSize:72 }} className="mb-5">✨</div>
        <p className="text-2xl font-bold mb-2 text-center" style={{ color:'#f5e6ca' }}>Le village est sauf !</p>
        <p className="text-sm mb-10" style={{ color:'rgba(245,230,202,0.4)' }}>Personne n'est mort cette nuit</p>
        <button onClick={onClose}
          className="px-10 py-4 rounded-2xl font-bold text-white text-base active:scale-98"
          style={{ background:'#e94560',border:'none',cursor:'pointer',boxShadow:'0 4px 20px rgba(233,69,96,0.4)' }}>
          Commencer la journée
        </button>
      </div>
    );
  }

  const current = deaths[currentIndex];
  const isLast  = currentIndex === deaths.length - 1;
  const wolf    = isWolfRole(current?.role);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center px-6"
      style={{ background:'rgba(0,0,0,0.98)', transition:'opacity 0.5s', opacity:visible?1:0 }}>
      {/* Dots */}
      {deaths.length > 1 && (
        <div className="flex gap-1.5 mb-12">
          {deaths.map((_,i) => (
            <div key={i} className="h-2 rounded transition-all duration-300"
              style={{ width:i===currentIndex?24:8, background:i===currentIndex?'#e94560':'#333' }} />
          ))}
        </div>
      )}

      <div style={{ fontSize:80 }} className="mb-5">💀</div>

      <p className="text-xs uppercase tracking-[0.2em] mb-3 text-center" style={{ color:'rgba(245,230,202,0.35)' }}>
        {getCauseText(current?.cause)}
      </p>
      <p className="text-4xl font-bold mb-2 text-center" style={{ color:'#f5e6ca', letterSpacing:'-0.02em' }}>
        {current?.name}
      </p>

      {/* Role reveal */}
      <div className="mt-5 mb-12 rounded-2xl px-8 py-4 text-center"
        style={{ background:wolf?'rgba(127,29,29,0.3)':'rgba(30,58,138,0.2)',
          border:`1px solid ${wolf?'#7f1d1d':'#1e3a8a'}` }}>
        <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color:'rgba(245,230,202,0.4)' }}>Rôle révélé</p>
        <div className="flex items-center gap-3 justify-center">
          <span style={{ fontSize:32 }}>{ROLE_ICONS[current?.role] || '❓'}</span>
          <span className="text-xl font-bold" style={{ color:wolf?'#fca5a5':'#93c5fd' }}>
            {ROLE_LABELS[current?.role] || current?.role}
          </span>
        </div>
      </div>

      {isLast ? (
        <button onClick={onClose}
          className="px-10 py-4 rounded-2xl font-bold text-white text-base active:scale-98"
          style={{ background:'#e94560',border:'none',cursor:'pointer',boxShadow:'0 4px 20px rgba(233,69,96,0.4)' }}>
          Commencer la journée
        </button>
      ) : (
        <button onClick={() => setCurrentIndex(i => i+1)}
          className="px-10 py-4 rounded-2xl font-semibold text-base active:scale-98"
          style={{ background:'#1a1a2e',color:'#f5e6ca',border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer' }}>
          Suivant ({currentIndex+1}/{deaths.length})
        </button>
      )}
    </div>
  );
}
