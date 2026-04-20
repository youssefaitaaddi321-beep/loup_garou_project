// ─── Shared role constants ─────────────────────────────────────
// Single source of truth for all role metadata across the app.

export const ROLE_LABELS = {
  LOUP_GAROU: 'Loup-Garou',
  VILLAGEOIS: 'Villageois',
  VOYANTE: 'Voyante',
  SORCIERE: 'Sorcière',
  CHASSEUR: 'Chasseur',
  CUPIDON: 'Cupidon',
  PETITE_FILLE: 'Petite Fille',
  CAPITAINE: 'Capitaine',
  SALVATEUR: 'Salvateur',
  IDIOT_DU_VILLAGE: 'Idiot du Village',
  LOUP_BLANC: 'Loup Blanc',
};

export const ROLE_ICONS = {
  LOUP_GAROU: '🐺',
  VILLAGEOIS: '🧑‍🌾',
  VOYANTE: '🔮',
  SORCIERE: '🧙',
  CHASSEUR: '🏹',
  CUPIDON: '💘',
  PETITE_FILLE: '👧',
  CAPITAINE: '⚔️',
  SALVATEUR: '🛡️',
  IDIOT_DU_VILLAGE: '🤡',
  LOUP_BLANC: '🤍',
};

export const ROLE_TEAM = {
  LOUP_GAROU: 'wolf',
  LOUP_BLANC: 'wolf',
  VILLAGEOIS: 'village',
  VOYANTE: 'village',
  SORCIERE: 'village',
  CHASSEUR: 'village',
  SALVATEUR: 'village',
  IDIOT_DU_VILLAGE: 'village',
  CAPITAINE: 'village',
  CUPIDON: 'village',
  PETITE_FILLE: 'village',
};

export const PHASE_LABELS = {
  LOBBY: 'Lobby',
  NUIT: 'Nuit',
  JOUR: 'Jour',
  VOTE: 'Vote',
  TERMINE: 'Terminé',
};

export const isWolfRole = (role) =>
  role === 'LOUP_GAROU' || role === 'LOUP_BLANC';

export const getRoleColor = (role) => {
  if (isWolfRole(role)) return { color: '#fca5a5', bg: 'rgba(127,29,29,0.2)' };
  return { color: '#93c5fd', bg: 'rgba(30,58,138,0.15)' };
};
