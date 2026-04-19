import { useEffect, useState } from 'react';

const ROLE_DATA = {
  LOUP_GAROU: {
    label: 'Loup-Garou', icon: '🐺',
    color: 'from-red-900 to-red-800 border-red-600', textColor: 'text-red-300',
    team: 'Loups', teamColor: 'bg-red-900 text-red-300',
    description: "Chaque nuit, vous vous réveillez avec vos congénères pour dévorer un villageois. Le jour, faites semblant d'être innocent.",
    ability: 'Éliminer un villageois chaque nuit',
    goal: 'Être en majorité face aux villageois',
  },
  VILLAGEOIS: {
    label: 'Villageois', icon: '🧑‍🌾',
    color: 'from-blue-900 to-blue-800 border-blue-600', textColor: 'text-blue-300',
    team: 'Village', teamColor: 'bg-blue-900 text-blue-300',
    description: "Vous n'avez aucun pouvoir spécial, mais votre vote est crucial. Observez, analysez et convainquez le village.",
    ability: 'Voter lors du conseil',
    goal: 'Éliminer tous les loups-garous',
  },
  VOYANTE: {
    label: 'Voyante', icon: '🔮',
    color: 'from-purple-900 to-purple-800 border-purple-600', textColor: 'text-purple-300',
    team: 'Village', teamColor: 'bg-blue-900 text-blue-300',
    description: "Chaque nuit, vous pouvez regarder la carte d'un joueur et découvrir son vrai rôle. Utilisez cette information avec sagesse.",
    ability: "Voir le rôle d'un joueur chaque nuit",
    goal: 'Éliminer tous les loups-garous',
  },
  SORCIERE: {
    label: 'Sorcière', icon: '🧙‍♀️',
    color: 'from-green-900 to-green-800 border-green-600', textColor: 'text-green-300',
    team: 'Village', teamColor: 'bg-blue-900 text-blue-300',
    description: "Vous possédez deux potions à usage unique : une potion de vie pour sauver la victime des loups, et une potion de mort pour éliminer n'importe qui.",
    ability: 'Potion de vie + potion de mort (1x chacune)',
    goal: 'Éliminer tous les loups-garous',
  },
  CHASSEUR: {
    label: 'Chasseur', icon: '🏹',
    color: 'from-yellow-900 to-yellow-800 border-yellow-600', textColor: 'text-yellow-300',
    team: 'Village', teamColor: 'bg-blue-900 text-blue-300',
    description: "Si vous êtes éliminé, vous pouvez tirer une dernière flèche et emporter quelqu'un avec vous dans la mort.",
    ability: 'Tuer un joueur à votre mort',
    goal: 'Éliminer tous les loups-garous',
  },
  CUPIDON: {
    label: 'Cupidon', icon: '💘',
    color: 'from-pink-900 to-pink-800 border-pink-600', textColor: 'text-pink-300',
    team: 'Village', teamColor: 'bg-blue-900 text-blue-300',
    description: "La première nuit, vous désignez deux joueurs qui tombent amoureux. S'ils sont séparés par la mort, l'autre meurt de chagrin.",
    ability: 'Lier deux joueurs en amour la 1ère nuit',
    goal: 'Survivre avec votre bien-aimé(e)',
  },
  PETITE_FILLE: {
    label: 'Petite Fille', icon: '👧',
    color: 'from-pink-900 to-pink-800 border-pink-500', textColor: 'text-pink-300',
    team: 'Village', teamColor: 'bg-blue-900 text-blue-300',
    description: "Vous pouvez espionner les loups pendant la nuit en entrouvrant les yeux. Mais attention — si les loups vous repèrent, ils peuvent vous dévorer.",
    ability: 'Espionner les loups la nuit (risqué)',
    goal: 'Éliminer tous les loups-garous',
  },
  CAPITAINE: {
    label: 'Capitaine', icon: '⚔️',
    color: 'from-orange-900 to-orange-800 border-orange-600', textColor: 'text-orange-300',
    team: 'Village', teamColor: 'bg-blue-900 text-blue-300',
    description: "Votre vote compte double lors du conseil du village. En cas d'égalité, c'est vous qui décidez. À votre mort, vous transmettez le titre.",
    ability: 'Vote double + départage les égalités',
    goal: 'Éliminer tous les loups-garous',
  },
  SALVATEUR: {
    label: 'Salvateur', icon: '🛡️',
    color: 'from-teal-900 to-teal-800 border-teal-600', textColor: 'text-teal-300',
    team: 'Village', teamColor: 'bg-blue-900 text-blue-300',
    description: "Chaque nuit, vous protégez un joueur de l'attaque des loups. Vous ne pouvez pas protéger la même personne deux nuits de suite.",
    ability: 'Protéger un joueur chaque nuit',
    goal: 'Éliminer tous les loups-garous',
  },
  IDIOT_DU_VILLAGE: {
    label: 'Idiot du Village', icon: '🤡',
    color: 'from-gray-800 to-gray-700 border-gray-500', textColor: 'text-gray-300',
    team: 'Village', teamColor: 'bg-blue-900 text-blue-300',
    description: "Si le village vote pour vous éliminer, vous survivez et révélez votre identité — mais vous perdez le droit de vote pour toujours.",
    ability: 'Survie si éliminé par vote (perd son vote)',
    goal: 'Éliminer tous les loups-garous',
  },
  LOUP_BLANC: {
    label: 'Loup Blanc', icon: '🤍',
    color: 'from-slate-800 to-slate-700 border-slate-400', textColor: 'text-slate-300',
    team: 'Solitaire', teamColor: 'bg-slate-800 text-slate-300',
    description: "Vous jouez avec les loups mais votre vrai objectif est de tous les éliminer. Une nuit sur deux, vous pouvez dévorer un autre loup.",
    ability: 'Éliminer un loup une nuit sur deux',
    goal: 'Être le dernier survivant',
  },
};

export default function RoleCard({ role, username, onClose }) {
  const [visible, setVisible] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const data = ROLE_DATA[role] || {
    label: role, icon: '❓', color: 'from-gray-900 to-gray-800 border-gray-600',
    textColor: 'text-gray-300', team: '?', teamColor: 'bg-gray-800 text-gray-300',
    description: 'Rôle inconnu.', ability: '?', goal: '?',
  };

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
  }, []);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-500 ${visible ? 'bg-opacity-80' : 'bg-opacity-0'}`}>
      <div className={`relative w-80 transition-all duration-700 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>

        {!revealed ? (
          <div onClick={() => setRevealed(true)}
            className="bg-[#1a1a2e] border-2 border-[#e94560] rounded-2xl p-8 text-center cursor-pointer hover:border-[#c73652] transition-colors select-none">
            <div className="text-6xl mb-4">🃏</div>
            <p className="text-[#f5e6ca] font-bold text-lg mb-1">{username}</p>
            <p className="text-[#888] text-sm mb-6">Votre rôle vous attend...</p>
            <div className="bg-[#e94560] text-white py-2 px-6 rounded-lg text-sm font-medium">
              Toucher pour révéler
            </div>
          </div>
        ) : (
          <div className={`bg-gradient-to-b ${data.color} border-2 rounded-2xl overflow-hidden`}>
            <div className="p-6 text-center border-b border-white/10">
              <div className="text-5xl mb-3">{data.icon}</div>
              <h2 className={`text-2xl font-bold ${data.textColor} mb-1`}>{data.label}</h2>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${data.teamColor}`}>
                Équipe {data.team}
              </span>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-[#f5e6ca] text-sm leading-relaxed">{data.description}</p>
              <div className="bg-black/30 rounded-xl p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-xs text-[#888] w-16 flex-shrink-0 pt-0.5">Pouvoir</span>
                  <span className={`text-xs font-medium ${data.textColor}`}>{data.ability}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs text-[#888] w-16 flex-shrink-0 pt-0.5">Objectif</span>
                  <span className="text-xs text-[#f5e6ca]">{data.goal}</span>
                </div>
              </div>
              <button onClick={onClose}
                className="w-full bg-black/40 hover:bg-black/60 text-[#f5e6ca] py-2.5 rounded-xl text-sm font-medium transition-colors mt-2">
                Commencer la partie
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
