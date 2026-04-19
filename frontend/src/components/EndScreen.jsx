import { useGame } from '../context/GameContext';
import { ROLE_LABELS, ROLE_ICONS, isWolfRole } from '../constants/roles';

const WIN_DATA = {
  VILLAGE_WINS: {
    icon: '🏡',
    title: 'Le Village a gagné !',
    subtitle: 'Les loups-garous ont tous été éliminés.',
    bg: 'from-blue-900/80 to-blue-950/90',
    accent: 'text-blue-300',
  },
  LOUPS_WIN: {
    icon: '🐺',
    title: 'Les Loups ont gagné !',
    subtitle: 'Les loups-garous ont pris le contrôle du village.',
    bg: 'from-red-900/80 to-red-950/90',
    accent: 'text-red-300',
  },
  LOUP_BLANC_WINS: {
    icon: '🤍',
    title: 'Le Loup Blanc a gagné !',
    subtitle: 'Le loup solitaire est le dernier survivant.',
    bg: 'from-slate-800/80 to-slate-950/90',
    accent: 'text-slate-300',
  },
  LOVERS_WIN: {
    icon: '💘',
    title: 'Les Amoureux ont gagné !',
    subtitle: 'L\'amour triomphe de tout.',
    bg: 'from-pink-900/80 to-pink-950/90',
    accent: 'text-pink-300',
  },
};

export default function EndScreen() {
  const { state, dispatch } = useGame();
  const winResult = state.winResult || state.room?.winResult;
  const data = WIN_DATA[winResult] || WIN_DATA.VILLAGE_WINS;
  const allPlayers = state.room?.players?.filter(p => !p.narrator) || [];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.95)' }}>
      <div className="w-full max-w-md text-center">

        {/* Winner */}
        <div className="text-7xl mb-4">{data.icon}</div>
        <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${data.accent}`}>{data.title}</h1>
        <p className="text-[#888] text-sm mb-8">{data.subtitle}</p>

        {/* Player results */}
        <div className="bg-[#0f0f1a] border border-[#1a1a2e] rounded-2xl p-4 mb-6 text-left max-h-64 overflow-y-auto">
          <p className="text-[10px] text-[#555] uppercase tracking-wider mb-3">Révélation des rôles</p>
          {allPlayers.map(p => {
            const wolf = isWolfRole(p.role);
            return (
              <div key={p.id} className={`flex items-center gap-3 py-2 border-b border-[#1a1a2e] last:border-none ${!p.alive ? 'opacity-40' : ''}`}>
                <span className="text-lg">{ROLE_ICONS[p.role] || '❓'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${p.alive ? 'text-[#f5e6ca]' : 'text-[#555] line-through'}`}>
                    {p.username}
                  </p>
                  <p className={`text-xs ${wolf ? 'text-[#fca5a5]' : 'text-[#93c5fd]'}`}>
                    {ROLE_LABELS[p.role] || p.role}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  p.alive ? 'bg-[#064e3b] text-[#6ee7b7]' : 'bg-[#1a1a2e] text-[#555]'
                }`}>
                  {p.alive ? 'Vivant' : 'Mort'}
                </span>
              </div>
            );
          })}
        </div>

        <button onClick={() => {
          dispatch({ type: 'RESET' });
          window.location.reload();
        }} className="bg-[#e94560] text-white border-none rounded-xl px-8 py-3 text-sm font-bold cursor-pointer">
          Retour au menu
        </button>
      </div>
    </div>
  );
}
