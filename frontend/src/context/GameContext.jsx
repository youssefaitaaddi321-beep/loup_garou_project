import { createContext, useContext, useReducer } from 'react';

const GameContext = createContext(null);

const initialState = {
  player: null,
  room: null,
  phase: null,
  messages: [],
  wolvesMessages: [],
  votes: [],
  voteResult: null,
  notification: null,
  myRole: null,
  eliminated: null,
  hasVoted: false,
  nightCall: null,
  nightResult: null,
  nightSummary: null,
  deathReveal: null,
  winResult: null,
  chasseurShot: null,
  narratorAlert: null,
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_PLAYER':
      return { ...state, player: action.payload };
    case 'SET_ROOM':
      return { ...state, room: action.payload };
    case 'GAME_UPDATE': {
      const updatedPlayers = action.payload.players || [];
      const me = updatedPlayers.find(
        p => p.username === state.player?.username && !p.narrator
      );
      return {
        ...state,
        room: { ...state.room, ...action.payload },
        phase: action.payload.phase || state.phase,
        notification: action.payload.announcement || null,
        myRole: me?.role || state.myRole,
        winResult: action.payload.winResult || state.winResult,
      };
    }
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'ADD_WOLVES_MESSAGE':
      return { ...state, wolvesMessages: [...state.wolvesMessages, action.payload] };
    case 'VOTE_UPDATE':
      if (action.payload.result === 'CLOSED' || action.payload.result === 'TIE' || action.payload.result === 'IDIOT_SURVIVES') {
        return { ...state, voteResult: action.payload, votes: [] };
      }
      return {
        ...state,
        votes: [
          ...state.votes.filter(v => v.voterId !== action.payload.voterId),
          action.payload,
        ],
      };
    case 'SET_VOTED':
      return { ...state, hasVoted: true };
    case 'SET_ROLE':
      return { ...state, myRole: action.payload };
    case 'SET_ELIMINATED':
      return { ...state, eliminated: action.payload };
    case 'SET_NIGHT_CALL':
      if (action.payload?.type === 'CHASSEUR_SHOT') {
        return { ...state, chasseurShot: action.payload };
      }
      return {
        ...state,
        nightCall: action.payload,
        nightResult: null,
      };
    case 'SET_NIGHT_RESULT':
      return { ...state, nightResult: action.payload };
    case 'CLEAR_NIGHT_CALL':
      return { ...state, nightCall: null, nightResult: null };
    case 'SET_NIGHT_SUMMARY':
      return { ...state, nightSummary: action.payload };
    case 'CLEAR_NIGHT_SUMMARY':
      return { ...state, nightSummary: null };
    case 'SET_DEATH_REVEAL':
      return { ...state, deathReveal: action.payload };
    case 'CLEAR_DEATH_REVEAL':
      return { ...state, deathReveal: null, chasseurShot: null };
    case 'SET_CHASSEUR_SHOT':
      return { ...state, chasseurShot: action.payload };
    case 'CLEAR_CHASSEUR_SHOT':
      return { ...state, chasseurShot: null };
    case 'SET_NARRATOR_ALERT':
      return { ...state, narratorAlert: action.payload };
    case 'CLEAR_NARRATOR_ALERT':
      return { ...state, narratorAlert: null };
    case 'CLEAR_NOTIFICATION':
      return { ...state, notification: null };
    case 'CLEAR_VOTE_RESULT':
      return { ...state, voteResult: null };
    case 'RESET_VOTES':
      return { ...state, votes: [], hasVoted: false, voteResult: null };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}