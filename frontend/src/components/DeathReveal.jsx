import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { ROLE_LABELS, ROLE_ICONS, isWolfRole } from '../constants/roles';

export default function DeathReveal({ onClose }) {
  const { state } = useGame();
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const deaths = state.deathReveal?.deaths || [];

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
  }, []);

  useEffect(() => {
    setVisible(false);
    setTimeout(() => setVisible(true), 100);
  }, [currentIndex]);

  if (deaths.length === 0) {
    return (
      <div className={`fixed inset-0 z-[70] bg-black/95 flex flex-col items-center justify-center transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-6xl mb-5">✨</div>
        <p className="text-[#f5e6ca] text-2xl font-bold mb-2">Le village est sauf !</p>
        <p className="text-[#555] text-sm mb-8">Personne n'est mort cette nuit</p>
        <button onClick={onClose}
          className="bg-[#e94560] text-white border-none rounded-xl px-8 py-3 text-sm font-bold cursor-pointer">
          Commencer la journée
        </button>
      </div>
    );
  }

  const current = deaths[currentIndex];
  const isLast = currentIndex === deaths.length - 1;
  const wolf = isWolfRole(current?.role);

  const getCauseText = (cause) => {
    switch (cause) {
      case 'LOUPS': return 'Tué par les loups';
      case 'SORCIERE': return 'Empoisonné par la Sorcière';
      case 'LOUP_BLANC': return 'Éliminé par le Loup Blanc';
      case 'AMOUR': return 'Mort de chagrin';
      default: return 'Cause inconnue';
    }
  };

  return (
    <div className={`fixed inset-0 z-[70] bg-black/97 flex flex-col items-center justify-center transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>

      {/* Death counter dots */}
      {deaths.length > 1 && (
        <div className="flex gap-1.5 mb-10">
          {deaths.map((_, i) => (
            <div key={i} className={`h-2 rounded transition-all duration-300 ${
              i === currentIndex ? 'w-6 bg-[#e94560]' : 'w-2 bg-[#333]'
            }`} />
          ))}
        </div>
      )}

      <div className="text-7xl sm:text-8xl mb-4" style={{ filter: 'grayscale(0.3)' }}>💀</div>

      <p className="text-[#555] text-xs uppercase tracking-[0.15em] mb-2">
        {getCauseText(current?.cause)}
      </p>
      <p className="text-[#f5e6ca] text-3xl sm:text-4xl font-bold mb-1 text-center px-4">
        {current?.name}
      </p>

      {/* Role reveal */}
      <div className={`mt-4 mb-10 rounded-2xl px-7 py-3.5 text-center border ${
        wolf ? 'bg-[rgba(127,29,29,0.3)] border-[#7f1d1d]' : 'bg-[rgba(30,58,138,0.2)] border-[#1e3a8a]'
      }`}>
        <p className="text-[#888] text-[10px] uppercase tracking-wider mb-1.5">Rôle révélé</p>
        <div className="flex items-center gap-2.5 justify-center">
          <span className="text-3xl">{ROLE_ICONS[current?.role] || '❓'}</span>
          <span className={`text-xl font-bold ${wolf ? 'text-[#fca5a5]' : 'text-[#93c5fd]'}`}>
            {ROLE_LABELS[current?.role] || current?.role}
          </span>
        </div>
      </div>

      {isLast ? (
        <button onClick={onClose}
          className="bg-[#e94560] text-white border-none rounded-xl px-10 py-3 text-sm font-bold cursor-pointer">
          Commencer la journée
        </button>
      ) : (
        <button onClick={() => setCurrentIndex(i => i + 1)}
          className="bg-[#1a1a2e] text-[#f5e6ca] border border-[#333] rounded-xl px-10 py-3 text-sm font-semibold cursor-pointer">
          Suivant ({currentIndex + 1}/{deaths.length})
        </button>
      )}
    </div>
  );
}
