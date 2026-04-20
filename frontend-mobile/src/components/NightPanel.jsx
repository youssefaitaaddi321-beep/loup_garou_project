import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { ROLE_LABELS } from '../constants/roles';

const ROLE_META = {
  LOUP_GAROU:   { label:'Loups-Garous', icon:'🐺', border:'#7f1d1d', bg:'rgba(127,29,29,0.2)' },
  LOUP_BLANC:   { label:'Loup Blanc',   icon:'🤍', border:'#475569', bg:'rgba(71,85,105,0.2)' },
  VOYANTE:      { label:'Voyante',      icon:'🔮', border:'#6d28d9', bg:'rgba(109,40,217,0.2)' },
  SORCIERE:     { label:'Sorcière',     icon:'🧙', border:'#065f46', bg:'rgba(6,95,70,0.2)' },
  SALVATEUR:    { label:'Salvateur',    icon:'🛡️', border:'#134e4a', bg:'rgba(19,78,74,0.2)' },
  CUPIDON:      { label:'Cupidon',      icon:'💘', border:'#9d174d', bg:'rgba(157,23,77,0.2)' },
  PETITE_FILLE: { label:'Petite Fille', icon:'👧', border:'#be185d', bg:'rgba(190,24,93,0.15)' },
};

export default function NightPanel({ roomId, send, calledRole, nightResult, onDone }) {
  const { state } = useGame();
  const [selectedTarget, setSelectedTarget]   = useState(null);
  const [selectedLovers, setSelectedLovers]   = useState([]);
  const [done, setDone]                       = useState(false);
  const [seerReveal, setSeerReveal]           = useState(null);
  const [witchAction, setWitchAction]         = useState(null);

  const myRole = state.myRole;
  const isMyTurn = calledRole && (
    myRole === calledRole ||
    (calledRole === 'LOUP_GAROU' && (myRole === 'LOUP_GAROU' || myRole === 'LOUP_BLANC'))
  );

  const alivePlayers = state.room?.players?.filter(p => p.alive && !p.narrator) || [];
  const wolves       = alivePlayers.filter(p => p.role==='LOUP_GAROU' || p.role==='LOUP_BLANC');
  const nonWolves    = alivePlayers.filter(p => p.role!=='LOUP_GAROU' && p.role!=='LOUP_BLANC');
  const me           = state.player;
  const nightVictimName  = state.nightCall?.nightVictimName;
  const nightVictimId    = state.nightCall?.nightVictimId;
  const witchLifeUsed    = state.nightCall?.witchLifeUsed;
  const witchDeathUsed   = state.nightCall?.witchDeathUsed;
  const isLoupBlancNight = state.nightCall?.isLoupBlancNight;

  useEffect(() => { setSelectedTarget(null); setSelectedLovers([]); setDone(false); setSeerReveal(null); setWitchAction(null); }, [calledRole]);
  useEffect(() => { if (nightResult?.type==='SEER_REVEAL') setSeerReveal(nightResult); }, [nightResult]);

  const confirmWolvesTarget = () => { if(!selectedTarget)return; send('/night/wolves-target',{roomId,targetId:selectedTarget,wolfId:me?.id}); };
  const confirmSeer = () => { if(!selectedTarget||!me?.id)return; send('/night/seer-action',{roomId,targetId:selectedTarget,seerUserId:me.id}); };
  const confirmSalvateur = () => { if(!selectedTarget)return; send('/night/salvateur-protect',{roomId,targetId:selectedTarget}); setDone(true); onDone?.(); };
  const witchSave = () => { send('/night/witch-save',{roomId}); setWitchAction('saved'); setDone(true); onDone?.(); };
  const witchKill = () => { if(!selectedTarget)return; send('/night/witch-kill',{roomId,targetId:selectedTarget}); setWitchAction('killed'); setDone(true); onDone?.(); };
  const witchPass = () => { send('/night/witch-pass',{roomId}); setDone(true); onDone?.(); };
  const toggleLover = (id) => setSelectedLovers(prev => prev.includes(id)?prev.filter(l=>l!==id):prev.length<2?[...prev,id]:prev);
  const confirmCupidon = () => { if(selectedLovers.length!==2)return; send('/night/cupidon-link',{roomId,lover1Id:selectedLovers[0],lover2Id:selectedLovers[1]}); setDone(true); onDone?.(); };
  const confirmLoupBlanc = () => { if(!selectedTarget)return; send('/night/loup-blanc-kill',{roomId,targetId:selectedTarget}); setDone(true); onDone?.(); };
  const loupBlancPass = () => { send('/night/loup-blanc-pass',{roomId}); setDone(true); onDone?.(); };

  if (!calledRole || !isMyTurn) return null;
  const meta = ROLE_META[calledRole] || { label:calledRole, icon:'❓', border:'#444', bg:'rgba(0,0,0,0.2)' };

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background:'rgba(0,0,0,0.6)' }}>
      <div className="w-full rounded-t-3xl overflow-hidden animate-slide-up"
        style={{ background:'#0f0f1a', border:`2px solid ${meta.border}`, borderBottom:'none', maxHeight:'85vh', display:'flex', flexDirection:'column' }}>
        {/* Handle + Header */}
        <div className="px-5 pt-3 pb-4 flex-shrink-0" style={{ background: meta.bg }}>
          <div className="w-10 h-1 rounded-full mx-auto mb-3" style={{ background:'rgba(255,255,255,0.2)' }} />
          <div className="flex items-center gap-3">
            <span style={{ fontSize:32 }}>{meta.icon}</span>
            <div>
              <p className="font-bold text-base" style={{ color:'#f5e6ca' }}>{meta.label}</p>
              <p className="text-xs" style={{ color:'rgba(245,230,202,0.5)' }}>C'est votre tour</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scroll-smooth p-5">
          {done ? (
            <div className="text-center pt-6 pb-10">
              <div style={{ fontSize:48 }}>✅</div>
              <p className="font-medium mt-3 mb-1" style={{ color:'#f5e6ca' }}>Action effectuée</p>
              <p className="text-sm" style={{ color:'rgba(245,230,202,0.4)' }}>En attente du narrateur...</p>
            </div>
          ) : (
            <>
              {/* LOUPS */}
              {calledRole==='LOUP_GAROU'&&(
                <div>
                  <p className="text-xs mb-2" style={{ color:'rgba(245,230,202,0.5)' }}>Vos congénères:</p>
                  {wolves.map(w=>(
                    <div key={w.id} className="flex items-center gap-2 rounded-2xl px-3 py-2.5 mb-1.5"
                      style={{ background:'rgba(127,29,29,0.3)',border:'1px solid #7f1d1d' }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background:'#7f1d1d',color:'#fca5a5' }}>
                        {w.username?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-medium" style={{ color:'#fca5a5' }}>{w.username}</span>
                      {w.id===me?.id&&<span className="text-[10px] ml-auto" style={{ color:'rgba(245,230,202,0.4)' }}>(vous)</span>}
                    </div>
                  ))}
                  {nightResult?.type==='WOLVES_TIE'&&(
                    <div className="rounded-2xl p-3 text-center my-3"
                      style={{ background:'rgba(120,53,15,0.3)',border:'1px solid #b45309' }}>
                      <p className="text-sm font-semibold" style={{ color:'#fcd34d' }}>⚖️ Égalité !</p>
                      <p className="text-xs mt-1" style={{ color:'rgba(245,230,202,0.5)' }}>Personne n'est attaqué</p>
                    </div>
                  )}
                  {nightResult?.type==='WOLVES_TARGET'&&(
                    <div className="rounded-2xl p-3 text-center my-3"
                      style={{ background:'rgba(127,29,29,0.3)',border:'1px solid #ef4444' }}>
                      <p className="text-sm font-semibold" style={{ color:'#fca5a5' }}>🐺 Cible choisie</p>
                      <p className="text-base font-bold mt-1" style={{ color:'#f5e6ca' }}>{nightResult.targetName}</p>
                    </div>
                  )}
                  {nightResult?.type==='WOLF_VOTE'&&(
                    <div className="rounded-2xl p-2.5 my-2" style={{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)' }}>
                      <p className="text-xs" style={{ color:'rgba(245,230,202,0.6)' }}>
                        <span style={{ color:'#fca5a5',fontWeight:600 }}>{nightResult.wolfName}</span> a voté —{' '}
                        <span style={{ color:'#f5e6ca' }}>{nightResult.votesCount}/{nightResult.totalWolves}</span> votes
                      </p>
                    </div>
                  )}
                  {!done&&nightResult?.type!=='WOLVES_TARGET'&&nightResult?.type!=='WOLVES_TIE'&&(
                    <>
                      <p className="text-xs mt-4 mb-2" style={{ color:'rgba(245,230,202,0.5)' }}>Votez pour votre victime:</p>
                      {nonWolves.map(p=>(
                        <div key={p.id} onClick={()=>setSelectedTarget(p.id)}
                          className="flex items-center gap-2 rounded-2xl px-3 py-2.5 mb-1.5 active:scale-98"
                          style={{ background:selectedTarget===p.id?'rgba(127,29,29,0.3)':'rgba(255,255,255,0.04)',
                            border:`1px solid ${selectedTarget===p.id?'#ef4444':'rgba(255,255,255,0.08)'}`,cursor:'pointer' }}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background:'#1a1a2e',color:'#f5e6ca' }}>
                            {p.username?.[0]?.toUpperCase()}
                          </div>
                          <span className="text-sm" style={{ color:'#f5e6ca' }}>{p.username}</span>
                          {selectedTarget===p.id&&<span className="ml-auto text-xs" style={{ color:'#ef4444' }}>Cible ✓</span>}
                        </div>
                      ))}
                      <button onClick={confirmWolvesTarget} disabled={!selectedTarget}
                        className="w-full mt-3 py-3.5 rounded-2xl font-bold text-sm active:scale-98"
                        style={{ background:selectedTarget?'#7f1d1d':'rgba(255,255,255,0.06)',
                          color:selectedTarget?'#fca5a5':'rgba(255,255,255,0.2)',border:'none',cursor:selectedTarget?'pointer':'not-allowed' }}>
                        Voter pour cette cible
                      </button>
                    </>
                  )}
                  {(nightResult?.type==='WOLVES_TARGET'||nightResult?.type==='WOLVES_TIE')&&!done&&(
                    <button onClick={()=>{setDone(true);onDone?.();}}
                      className="w-full mt-3 py-3.5 rounded-2xl font-semibold text-sm active:scale-98"
                      style={{ background:'rgba(127,29,29,0.3)',color:'#fca5a5',border:'1px solid #7f1d1d',cursor:'pointer' }}>
                      Fermer les yeux
                    </button>
                  )}
                </div>
              )}

              {/* LOUP BLANC */}
              {calledRole==='LOUP_BLANC'&&(
                <div>
                  {isLoupBlancNight?(
                    <>
                      <p className="text-xs mb-2" style={{ color:'rgba(245,230,202,0.5)' }}>C'est votre nuit spéciale. Choisissez un loup à éliminer:</p>
                      {wolves.filter(w=>w.id!==me?.id).map(p=>(
                        <div key={p.id} onClick={()=>setSelectedTarget(p.id)}
                          className="flex items-center gap-2 rounded-2xl px-3 py-2.5 mb-1.5 active:scale-98"
                          style={{ background:selectedTarget===p.id?'rgba(71,85,105,0.3)':'rgba(255,255,255,0.04)',
                            border:`1px solid ${selectedTarget===p.id?'#64748b':'rgba(255,255,255,0.08)'}`,cursor:'pointer' }}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background:'#1a1a2e',color:'#f5e6ca' }}>{p.username?.[0]?.toUpperCase()}</div>
                          <span className="text-sm" style={{ color:'#f5e6ca' }}>{p.username}</span>
                          {selectedTarget===p.id&&<span className="ml-auto text-xs" style={{ color:'#cbd5e1' }}>Cible ✓</span>}
                        </div>
                      ))}
                      <button onClick={confirmLoupBlanc} disabled={!selectedTarget}
                        className="w-full mt-3 py-3.5 rounded-2xl font-bold text-sm active:scale-98"
                        style={{ background:selectedTarget?'rgba(71,85,105,0.5)':'rgba(255,255,255,0.06)',
                          color:selectedTarget?'#cbd5e1':'rgba(255,255,255,0.2)',border:'none',cursor:selectedTarget?'pointer':'not-allowed' }}>
                        🤍 Éliminer ce loup
                      </button>
                      <button onClick={loupBlancPass} className="w-full mt-2 py-3 rounded-2xl text-sm active:scale-98"
                        style={{ background:'rgba(255,255,255,0.04)',color:'rgba(245,230,202,0.5)',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer' }}>
                        Passer cette nuit
                      </button>
                    </>
                  ):(
                    <div className="text-center pt-6 pb-4">
                      <div style={{ fontSize:44 }}>🤍</div>
                      <p className="font-medium mt-3 mb-1" style={{ color:'#f5e6ca' }}>Ce n'est pas votre nuit spéciale</p>
                      <p className="text-sm mb-5" style={{ color:'rgba(245,230,202,0.4)' }}>Vous pourrez agir la nuit prochaine</p>
                      <button onClick={()=>{send('/night/loup-blanc-pass',{roomId});setDone(true);onDone?.();}}
                        className="w-full py-3.5 rounded-2xl font-medium text-sm active:scale-98"
                        style={{ background:'rgba(71,85,105,0.3)',color:'#cbd5e1',border:'none',cursor:'pointer' }}>
                        Fermer les yeux
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* VOYANTE */}
              {calledRole==='VOYANTE'&&(
                <div>
                  {seerReveal?(
                    <div className="text-center pt-4 pb-4">
                      <div style={{ fontSize:44 }}>🔮</div>
                      <p className="text-xs mt-3 mb-1" style={{ color:'rgba(245,230,202,0.5)' }}>Votre vision révèle...</p>
                      <p className="font-bold text-xl mb-3" style={{ color:'#f5e6ca' }}>{seerReveal.targetName}</p>
                      <div className="inline-block px-6 py-2.5 rounded-2xl font-bold text-sm"
                        style={{ background:seerReveal.role==='LOUP_GAROU'||seerReveal.role==='LOUP_BLANC'?'rgba(127,29,29,0.4)':'rgba(30,58,138,0.4)',
                          color:seerReveal.role==='LOUP_GAROU'||seerReveal.role==='LOUP_BLANC'?'#fca5a5':'#93c5fd',
                          border:`1px solid ${seerReveal.role==='LOUP_GAROU'||seerReveal.role==='LOUP_BLANC'?'#ef4444':'#3b82f6'}` }}>
                        {seerReveal.role==='LOUP_GAROU'?'🐺 Loup-Garou !':seerReveal.role==='LOUP_BLANC'?'🤍 Loup Blanc !':
                          `✨ ${ROLE_LABELS[seerReveal.role]||seerReveal.role}`}
                      </div>
                      <p className="text-xs mt-4" style={{ color:'rgba(245,230,202,0.3)' }}>Gardez cette information secrète...</p>
                      <button onClick={()=>{setDone(true);onDone?.();}}
                        className="w-full mt-5 py-3.5 rounded-2xl font-semibold text-sm active:scale-98"
                        style={{ background:'#3b0764',color:'#c4b5fd',border:'none',cursor:'pointer' }}>
                        Fermer les yeux
                      </button>
                    </div>
                  ):(
                    <>
                      <p className="text-xs mb-2" style={{ color:'rgba(245,230,202,0.5)' }}>Choisissez un joueur à espionner:</p>
                      {alivePlayers.filter(p=>p.id!==me?.id).map(p=>(
                        <div key={p.id} onClick={()=>setSelectedTarget(p.id)}
                          className="flex items-center gap-2 rounded-2xl px-3 py-2.5 mb-1.5 active:scale-98"
                          style={{ background:selectedTarget===p.id?'rgba(109,40,217,0.2)':'rgba(255,255,255,0.04)',
                            border:`1px solid ${selectedTarget===p.id?'#7c3aed':'rgba(255,255,255,0.08)'}`,cursor:'pointer' }}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background:'#1a1a2e',color:'#f5e6ca' }}>{p.username?.[0]?.toUpperCase()}</div>
                          <span className="text-sm" style={{ color:'#f5e6ca' }}>{p.username}</span>
                        </div>
                      ))}
                      <button onClick={confirmSeer} disabled={!selectedTarget}
                        className="w-full mt-3 py-3.5 rounded-2xl font-bold text-sm active:scale-98"
                        style={{ background:selectedTarget?'#3b0764':'rgba(255,255,255,0.06)',
                          color:selectedTarget?'#c4b5fd':'rgba(255,255,255,0.2)',border:'none',cursor:selectedTarget?'pointer':'not-allowed' }}>
                        🔮 Regarder la carte
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* SORCIERE */}
              {calledRole==='SORCIERE'&&(
                <div>
                  <div className="rounded-2xl p-3 text-center mb-3"
                    style={{ background:nightVictimName?'rgba(127,29,29,0.25)':'rgba(255,255,255,0.04)',
                      border:`1px solid ${nightVictimName?'#7f1d1d':'rgba(255,255,255,0.08)'}` }}>
                    {nightVictimName?(
                      <>
                        <p className="text-xs mb-1" style={{ color:'#fca5a5' }}>Les loups ont attaqué...</p>
                        <p className="font-bold text-base" style={{ color:'#f5e6ca' }}>{nightVictimName}</p>
                      </>
                    ):(
                      <p className="text-sm" style={{ color:'rgba(245,230,202,0.4)' }}>Personne n'a été attaqué</p>
                    )}
                  </div>
                  {!witchLifeUsed&&nightVictimName&&(
                    <button onClick={witchSave}
                      className="w-full mb-2 rounded-2xl p-3.5 font-bold text-sm text-left active:scale-98"
                      style={{ background:'rgba(6,95,70,0.4)',color:'#6ee7b7',border:'1px solid #065f46',cursor:'pointer' }}>
                      🧪 Potion de vie
                      <span className="block text-xs font-normal opacity-70 mt-0.5">Sauver {nightVictimName}</span>
                    </button>
                  )}
                  {witchLifeUsed&&(
                    <div className="mb-2 px-3 py-2 rounded-xl" style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-xs" style={{ color:'rgba(245,230,202,0.3)' }}>Potion de vie déjà utilisée</p>
                    </div>
                  )}
                  {!witchDeathUsed&&(
                    <div className="mb-2">
                      <p className="text-xs mb-1.5" style={{ color:'rgba(245,230,202,0.5)' }}>Potion de mort — choisir une cible:</p>
                      {alivePlayers.filter(p=>p.id!==nightVictimId).map(p=>(
                        <div key={p.id} onClick={()=>setSelectedTarget(p.id)}
                          className="flex items-center gap-2 rounded-2xl px-3 py-2.5 mb-1 active:scale-98"
                          style={{ background:selectedTarget===p.id?'rgba(127,29,29,0.25)':'rgba(255,255,255,0.04)',
                            border:`1px solid ${selectedTarget===p.id?'#ef4444':'rgba(255,255,255,0.08)'}`,cursor:'pointer' }}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background:'#1a1a2e',color:'#f5e6ca' }}>{p.username?.[0]?.toUpperCase()}</div>
                          <span className="text-sm" style={{ color:'#f5e6ca' }}>{p.username}</span>
                        </div>
                      ))}
                      <button onClick={witchKill} disabled={!selectedTarget}
                        className="w-full mt-2 py-3.5 rounded-2xl font-bold text-sm active:scale-98"
                        style={{ background:selectedTarget?'rgba(127,29,29,0.4)':'rgba(255,255,255,0.04)',
                          color:selectedTarget?'#fca5a5':'rgba(245,230,202,0.3)',
                          border:`1px solid ${selectedTarget?'#7f1d1d':'rgba(255,255,255,0.06)'}`,
                          cursor:selectedTarget?'pointer':'not-allowed' }}>
                        ☠️ Utiliser la potion de mort
                      </button>
                    </div>
                  )}
                  {witchDeathUsed&&(
                    <div className="mb-2 px-3 py-2 rounded-xl" style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-xs" style={{ color:'rgba(245,230,202,0.3)' }}>Potion de mort déjà utilisée</p>
                    </div>
                  )}
                  <button onClick={witchPass}
                    className="w-full mt-1 py-3 rounded-2xl text-sm active:scale-98"
                    style={{ background:'rgba(255,255,255,0.04)',color:'rgba(245,230,202,0.5)',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer' }}>
                    Fermer les yeux
                  </button>
                </div>
              )}

              {/* SALVATEUR */}
              {calledRole==='SALVATEUR'&&(
                <div>
                  <p className="text-xs mb-2" style={{ color:'rgba(245,230,202,0.5)' }}>Choisissez un joueur à protéger:</p>
                  {alivePlayers.map(p=>(
                    <div key={p.id} onClick={()=>setSelectedTarget(p.id)}
                      className="flex items-center gap-2 rounded-2xl px-3 py-2.5 mb-1.5 active:scale-98"
                      style={{ background:selectedTarget===p.id?'rgba(19,78,74,0.3)':'rgba(255,255,255,0.04)',
                        border:`1px solid ${selectedTarget===p.id?'#0f766e':'rgba(255,255,255,0.08)'}`,cursor:'pointer' }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background:'#1a1a2e',color:'#f5e6ca' }}>{p.username?.[0]?.toUpperCase()}</div>
                      <span className="text-sm" style={{ color:'#f5e6ca' }}>{p.username}</span>
                      {p.id===me?.id&&<span className="text-[10px] ml-auto" style={{ color:'rgba(245,230,202,0.4)' }}>(vous)</span>}
                    </div>
                  ))}
                  <button onClick={confirmSalvateur} disabled={!selectedTarget}
                    className="w-full mt-3 py-3.5 rounded-2xl font-bold text-sm active:scale-98"
                    style={{ background:selectedTarget?'rgba(19,78,74,0.5)':'rgba(255,255,255,0.06)',
                      color:selectedTarget?'#5eead4':'rgba(255,255,255,0.2)',
                      border:`1px solid ${selectedTarget?'#0f766e':'rgba(255,255,255,0.08)'}`,
                      cursor:selectedTarget?'pointer':'not-allowed' }}>
                    🛡️ Protéger ce joueur
                  </button>
                </div>
              )}

              {/* CUPIDON */}
              {calledRole==='CUPIDON'&&(
                <div>
                  <p className="text-xs mb-2" style={{ color:'rgba(245,230,202,0.5)' }}>
                    Choisissez 2 joueurs à lier ({selectedLovers.length}/2):
                  </p>
                  {alivePlayers.map(p=>{
                    const isSel=selectedLovers.includes(p.id);
                    const isDis=!isSel&&selectedLovers.length>=2;
                    return (
                      <div key={p.id} onClick={()=>!isDis&&toggleLover(p.id)}
                        className="flex items-center gap-2 rounded-2xl px-3 py-2.5 mb-1.5 active:scale-98"
                        style={{ background:isSel?'rgba(157,23,77,0.25)':'rgba(255,255,255,0.04)',
                          border:`1px solid ${isSel?'#db2777':'rgba(255,255,255,0.08)'}`,
                          cursor:isDis?'not-allowed':'pointer',opacity:isDis?0.3:1 }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background:'#1a1a2e',color:'#f5e6ca' }}>{p.username?.[0]?.toUpperCase()}</div>
                        <span className="text-sm" style={{ color:'#f5e6ca' }}>{p.username}</span>
                        {isSel&&<span className="ml-auto text-base">💘</span>}
                      </div>
                    );
                  })}
                  {selectedLovers.length===2&&(
                    <div className="rounded-2xl p-3 text-center my-3"
                      style={{ background:'rgba(157,23,77,0.15)',border:'1px solid #9d174d' }}>
                      <p className="text-sm" style={{ color:'#f9a8d4' }}>
                        {alivePlayers.find(p=>p.id===selectedLovers[0])?.username}
                        <span className="mx-2">💘</span>
                        {alivePlayers.find(p=>p.id===selectedLovers[1])?.username}
                      </p>
                    </div>
                  )}
                  <button onClick={confirmCupidon} disabled={selectedLovers.length!==2}
                    className="w-full mt-3 py-3.5 rounded-2xl font-bold text-sm active:scale-98"
                    style={{ background:selectedLovers.length===2?'rgba(157,23,77,0.4)':'rgba(255,255,255,0.06)',
                      color:selectedLovers.length===2?'#f9a8d4':'rgba(255,255,255,0.2)',
                      border:`1px solid ${selectedLovers.length===2?'#9d174d':'rgba(255,255,255,0.08)'}`,
                      cursor:selectedLovers.length===2?'pointer':'not-allowed' }}>
                    💘 Lier ces deux joueurs
                  </button>
                </div>
              )}

              {/* PETITE FILLE */}
              {calledRole==='PETITE_FILLE'&&(
                <div className="text-center pt-4 pb-4">
                  <div style={{ fontSize:44 }}>👁️</div>
                  <p className="font-medium mt-3 mb-1" style={{ color:'#f5e6ca' }}>Vous entrouvrez les yeux...</p>
                  <div className="rounded-2xl p-3 mb-3 mt-3" style={{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-xs mb-2" style={{ color:'rgba(245,230,202,0.5)' }}>Loups actifs cette nuit:</p>
                    {wolves.length>0?wolves.map(w=>(
                      <div key={w.id} className="text-sm py-0.5" style={{ color:'#fca5a5' }}>{w.username} 🐺</div>
                    )):(
                      <p className="text-xs" style={{ color:'rgba(245,230,202,0.3)' }}>Aucun loup visible</p>
                    )}
                  </div>
                  <p className="text-xs mb-4" style={{ color:'rgba(245,230,202,0.3)' }}>
                    Attention — si les loups vous repèrent, vous êtes éliminée !
                  </p>
                  <button onClick={()=>{setDone(true);onDone?.();}}
                    className="w-full py-3.5 rounded-2xl font-semibold text-sm active:scale-98"
                    style={{ background:'rgba(157,23,77,0.3)',color:'#f9a8d4',border:'1px solid #9d174d',cursor:'pointer' }}>
                    Refermer les yeux
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
