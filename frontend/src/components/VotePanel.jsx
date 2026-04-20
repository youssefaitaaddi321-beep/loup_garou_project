import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ROLE_LABELS } from '../constants/roles';

export default function VotePanel({ roomId, send }) {
  const { state, dispatch } = useGame();
  const [selected, setSelected] = useState(null);
  const isNarrator = state.player?.narrator;
  const alivePlayers = state.room?.players?.filter(p => p.alive && !p.narrator) || [];
  const totalVoters = alivePlayers.length;

  const getVoteCount = (playerId) =>
    state.votes.filter(v => v.targetId === playerId).length;

  const getVoterNames = (playerId) =>
    state.votes
      .filter(v => v.targetId === playerId)
      .map(v => {
        const voter = state.room?.players?.find(p => p.id === v.voterId);
        return voter?.username || '?';
      });

  const castVote = () => {
    if (!selected || state.hasVoted) return;
    send('/game/vote', {
      roomId,
      voterId: state.player?.id,
      targetId: selected,
    });
    dispatch({ type: 'SET_VOTED' });
    setSelected(null);
  };

  const topVoted = [...alivePlayers].sort(
    (a, b) => getVoteCount(b.id) - getVoteCount(a.id)
  );

  const voteResult = state.voteResult;

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">

      {/* Vote result overlay */}
      {voteResult && (
        <div className="absolute inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#0f0f1a] border border-[#e94560] rounded-2xl p-6 text-center max-w-sm w-full">
            {voteResult.result === 'TIE' ? (
              <>
                <div className="text-4xl mb-3">⚖️</div>
                <h3 className="text-lg font-bold text-[#f5e6ca] mb-1">Égalité !</h3>
                <p className="text-[#888] text-sm mb-4">Personne n'est éliminé ce tour.</p>
              </>
            ) : voteResult.result === 'IDIOT_SURVIVES' ? (
              <>
                <div className="text-4xl mb-3">🤡</div>
                <h3 className="text-lg font-bold text-[#f5e6ca] mb-1">Idiot du Village !</h3>
                <p className="text-[#fcd34d] font-bold text-xl mb-2">{voteResult.eliminatedName}</p>
                <p className="text-[#888] text-sm mb-4">survit mais perd son droit de vote !</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-3">⚖️</div>
                <h3 className="text-lg font-bold text-[#f5e6ca] mb-1">Résultat du vote</h3>
                <p className="text-[#e94560] font-bold text-xl mb-1">{voteResult.eliminatedName}</p>
                {voteResult.role && (
                  <p className="text-[#888] text-xs mb-2">
                    C'était un(e) {ROLE_LABELS[voteResult.role] || voteResult.role}
                  </p>
                )}
                <p className="text-[#888] text-sm mb-4">a été désigné par le village</p>
              </>
            )}
            {isNarrator ? (
              <button onClick={() => dispatch({ type: 'CLEAR_VOTE_RESULT' })}
                className="w-full bg-[#e94560] hover:bg-[#c73652] text-white py-2 rounded-xl text-sm font-medium transition-colors">
                Confirmer
              </button>
            ) : (
              <p className="text-xs text-[#888] opacity-40">En attente du narrateur...</p>
            )}
          </div>
        </div>
      )}

      <div className="p-4 overflow-y-auto flex-1 space-y-3">

        {/* Vote status header */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[#f5e6ca]">Votes exprimés</p>
          <span className="text-sm font-bold text-[#e94560]">{state.votes.length} / {totalVoters}</span>
        </div>

        {/* Overall progress bar */}
        <div className="w-full bg-[#0f0f1a] rounded-full h-1.5 mb-2">
          <div className="bg-[#e94560] h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${totalVoters > 0 ? (state.votes.length / totalVoters) * 100 : 0}%` }} />
        </div>

        {/* Player vote bars */}
        {topVoted.map(player => {
          const count = getVoteCount(player.id);
          const percent = totalVoters > 0 ? (count / totalVoters) * 100 : 0;
          const voters = getVoterNames(player.id);
          const isSelected = selected === player.id;
          const isMe = player.id === state.player?.id;

          return (
            <div key={player.id}
              onClick={() => !state.hasVoted && !isNarrator && setSelected(isSelected ? null : player.id)}
              className={`relative bg-[#0f0f1a] rounded-xl p-3 overflow-hidden transition-all ${
                state.hasVoted ? 'cursor-default' : 'cursor-pointer hover:bg-[#1a1a2e]'
              } ${isSelected ? 'ring-2 ring-[#e94560]' : ''} ${isMe ? 'opacity-60' : ''}`}>
              <div className="absolute inset-0 bg-[#e94560] opacity-10 transition-all duration-700 rounded-xl"
                style={{ width: `${percent}%` }} />
              <div className="relative flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#16213e] flex items-center justify-center text-xs font-bold text-[#f5e6ca] flex-shrink-0">
                  {player.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#f5e6ca] truncate">{player.username}</span>
                    {isMe && <span className="text-xs text-[#888] opacity-40">(vous)</span>}
                  </div>
                  {voters.length > 0 && (
                    <p className="text-xs text-[#888] opacity-50 truncate">Voté par: {voters.join(', ')}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {count > 0 && <span className="text-[#e94560] font-bold text-sm">{count}</span>}
                  {isSelected && (
                    <span className="text-[10px] bg-[#e94560] text-white px-2 py-0.5 rounded-full">Sélectionné</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Cast vote button */}
        {!isNarrator && !state.hasVoted && selected && (
          <button onClick={castVote}
            className="w-full bg-[#e94560] hover:bg-[#c73652] text-white font-bold py-3 rounded-xl transition-colors text-sm mt-2">
            Voter contre {alivePlayers.find(p => p.id === selected)?.username}
          </button>
        )}

        {!isNarrator && state.hasVoted && (
          <div className="text-center py-3">
            <p className="text-sm text-[#888] opacity-50">Vote enregistré — en attente des autres joueurs...</p>
          </div>
        )}

        {/* Narrator close vote */}
        {isNarrator && (
          <button onClick={() => send('/narrator/close-vote', { roomId })}
            className="w-full bg-[#16213e] hover:bg-[#1a1a2e] text-[#f5e6ca] font-medium py-2.5 rounded-xl transition-colors text-sm border border-[#333] mt-2">
            Clore le vote et révéler le résultat
          </button>
        )}
      </div>
    </div>
  );
}
