import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ROLE_LABELS } from '../constants/roles';

export default function VotePanel({ roomId, send }) {
  const { state, dispatch } = useGame();
  const [selected, setSelected] = useState(null);
  const isNarrator   = state.player?.narrator;
  const alivePlayers = state.room?.players?.filter(p => p.alive && !p.narrator) || [];
  const totalVoters  = alivePlayers.length;

  const getVoteCount = (id) => state.votes.filter(v => v.targetId === id).length;
  const getVoterNames = (id) => state.votes.filter(v => v.targetId === id)
    .map(v => state.room?.players?.find(p => p.id === v.voterId)?.username || '?');

  const castVote = () => {
    if (!selected || state.hasVoted) return;
    send('/game/vote', { roomId, voterId: state.player?.id, targetId: selected });
    dispatch({ type: 'SET_VOTED' });
    setSelected(null);
  };

  const topVoted  = [...alivePlayers].sort((a,b) => getVoteCount(b.id) - getVoteCount(a.id));
  const voteResult = state.voteResult;

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* Vote result overlay */}
      {voteResult && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-5"
          style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="rounded-3xl p-6 text-center w-full max-w-xs animate-fade-in"
            style={{ background: '#0f0f1a', border: '1px solid #e94560' }}>
            {voteResult.result === 'TIE' ? (
              <>
                <div style={{ fontSize: 44 }} className="mb-3">⚖️</div>
                <h3 className="text-lg font-bold mb-1" style={{ color: '#f5e6ca' }}>Égalité !</h3>
                <p className="text-sm mb-5" style={{ color: 'rgba(245,230,202,0.5)' }}>Personne n'est éliminé.</p>
              </>
            ) : voteResult.result === 'IDIOT_SURVIVES' ? (
              <>
                <div style={{ fontSize: 44 }} className="mb-3">🤡</div>
                <h3 className="text-lg font-bold mb-1" style={{ color: '#f5e6ca' }}>Idiot du Village !</h3>
                <p className="text-xl font-bold mb-1" style={{ color: '#fcd34d' }}>{voteResult.eliminatedName}</p>
                <p className="text-sm mb-5" style={{ color: 'rgba(245,230,202,0.5)' }}>survit mais perd son vote !</p>
              </>
            ) : (
              <>
                <div style={{ fontSize: 44 }} className="mb-3">⚖️</div>
                <h3 className="text-base font-bold mb-2" style={{ color: 'rgba(245,230,202,0.6)' }}>Résultat du vote</h3>
                <p className="text-2xl font-bold mb-1" style={{ color: '#e94560' }}>{voteResult.eliminatedName}</p>
                {voteResult.role && <p className="text-xs mb-1" style={{ color: 'rgba(245,230,202,0.4)' }}>C'était un(e) {ROLE_LABELS[voteResult.role]}</p>}
                <p className="text-sm mb-5" style={{ color: 'rgba(245,230,202,0.5)' }}>a été désigné par le village</p>
              </>
            )}
            {isNarrator ? (
              <button onClick={() => dispatch({ type: 'CLEAR_VOTE_RESULT' })}
                className="w-full py-3 rounded-2xl font-bold text-white active:scale-98"
                style={{ background: '#e94560', border: 'none', cursor: 'pointer' }}>
                Confirmer
              </button>
            ) : (
              <p className="text-xs" style={{ color: 'rgba(245,230,202,0.25)' }}>En attente du narrateur...</p>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium" style={{ color: '#f5e6ca' }}>⚖️ Vote du village</p>
          <span className="text-sm font-bold" style={{ color: '#e94560' }}>
            {state.votes.length} / {totalVoters}
          </span>
        </div>
        <div className="w-full rounded-full h-1.5" style={{ background: '#0f0f1a' }}>
          <div className="h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${totalVoters>0?(state.votes.length/totalVoters)*100:0}%`,
              background: 'linear-gradient(90deg, #e94560, #c73652)' }} />
        </div>
      </div>

      {/* Player list */}
      <div className="flex-1 overflow-y-auto scroll-smooth px-4 pb-4 space-y-2">
        {topVoted.map(player => {
          const count   = getVoteCount(player.id);
          const percent = totalVoters > 0 ? (count / totalVoters) * 100 : 0;
          const voters  = getVoterNames(player.id);
          const isSel   = selected === player.id;
          const isMe    = player.id === state.player?.id;
          return (
            <div key={player.id}
              onClick={() => !state.hasVoted && !isNarrator && setSelected(isSel ? null : player.id)}
              className="relative rounded-2xl p-3 overflow-hidden transition-all"
              style={{ background: '#0f0f1a',
                outline: isSel ? '2px solid #e94560' : 'none',
                cursor: state.hasVoted || isNarrator ? 'default' : 'pointer',
                opacity: isMe ? 0.6 : 1 }}>
              {/* fill bar */}
              <div className="absolute inset-0 rounded-2xl transition-all duration-700"
                style={{ width: `${percent}%`, background: 'rgba(233,69,96,0.12)' }} />
              <div className="relative flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: '#16213e', color: '#f5e6ca' }}>
                  {player.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium truncate" style={{ color: '#f5e6ca' }}>{player.username}</span>
                    {isMe && <span className="text-[10px]" style={{ color: 'rgba(245,230,202,0.3)' }}>(vous)</span>}
                  </div>
                  {voters.length > 0 && (
                    <p className="text-xs truncate" style={{ color: 'rgba(245,230,202,0.35)' }}>
                      Voté par: {voters.join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {count > 0 && <span className="font-bold text-sm" style={{ color: '#e94560' }}>{count}</span>}
                  {isSel && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#e94560', color: 'white' }}>✓</span>}
                </div>
              </div>
            </div>
          );
        })}

        {/* Vote action */}
        {!isNarrator && !state.hasVoted && selected && (
          <button onClick={castVote}
            className="w-full py-4 rounded-2xl font-bold text-white text-sm active:scale-98"
            style={{ background: 'linear-gradient(135deg,#e94560 0%,#c73652 100%)', border:'none', cursor:'pointer',
              boxShadow: '0 4px 20px rgba(233,69,96,0.3)' }}>
            Voter contre {alivePlayers.find(p => p.id === selected)?.username}
          </button>
        )}
        {!isNarrator && state.hasVoted && (
          <div className="text-center py-4">
            <p className="text-sm" style={{ color: 'rgba(245,230,202,0.35)' }}>
              ✓ Vote enregistré — en attente...
            </p>
          </div>
        )}
        {isNarrator && (
          <button onClick={() => send('/narrator/close-vote', { roomId })}
            className="w-full py-3.5 rounded-2xl font-medium text-sm active:scale-98"
            style={{ background: '#1a1a2e', color: '#f5e6ca', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
            Clore le vote et révéler le résultat
          </button>
        )}
      </div>
    </div>
  );
}
