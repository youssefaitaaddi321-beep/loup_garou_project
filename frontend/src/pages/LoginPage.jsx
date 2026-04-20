import { useState } from 'react';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [focused, setFocused] = useState(false);
  const valid = username.trim().length >= 2;

  const handle = (e) => {
    e.preventDefault();
    if (valid) onLogin(username.trim());
  };

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'space-between', padding:'40px 24px 32px', background:'linear-gradient(160deg,#0a0a0f 0%,#0f0f1a 60%,#0a0a0f 100%)' }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', width:'100%', maxWidth:360 }}>

        {/* Logo */}
        <div style={{ position:'relative', marginBottom:28 }}>
          <div style={{ width:96, height:96, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'radial-gradient(circle,#1a1a2e 0%,#0f0f1a 70%)', border:'1px solid rgba(233,69,96,0.2)', boxShadow:'0 0 60px 20px rgba(233,69,96,0.1),0 0 120px 40px rgba(233,69,96,0.05)' }}>
            <span style={{ fontSize:46 }}>🐺</span>
          </div>
        </div>

        <h1 style={{ fontSize:38, fontWeight:800, color:'#f5e6ca', letterSpacing:'-0.02em', marginBottom:4 }}>Loup-Garou</h1>
        <p style={{ fontSize:13, color:'rgba(245,230,202,0.3)', letterSpacing:'0.08em', marginBottom:40 }}>Le jeu de déduction sociale</p>

        <form onSubmit={handle} style={{ width:'100%' }}>
          <label style={{ display:'block', color:'rgba(245,230,202,0.4)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>
            Votre pseudonyme
          </label>
          <div style={{ borderRadius:14, overflow:'hidden', border:`1.5px solid ${focused?'#e94560':'rgba(245,230,202,0.08)'}`, background:'#1a1a2e', marginBottom:14, boxShadow: focused?'0 0 0 3px rgba(233,69,96,0.12)':'none', transition:'all 0.2s' }}>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="ex: Pierre, Marie..."
              minLength={2} maxLength={20} required
              autoComplete="off" autoCapitalize="off"
              style={{ width:'100%', background:'transparent', border:'none', outline:'none', color:'#f5e6ca', fontSize:16, padding:'14px 16px' }}
            />
          </div>
          <button type="submit" disabled={!valid}
            style={{ width:'100%', padding:'15px', borderRadius:14, fontWeight:700, fontSize:16, border:'none', cursor: valid?'pointer':'not-allowed', background: valid?'linear-gradient(135deg,#e94560,#c73652)':'rgba(255,255,255,0.06)', color: valid?'white':'rgba(255,255,255,0.2)', boxShadow: valid?'0 4px 24px rgba(233,69,96,0.35)':'none', transition:'all 0.2s' }}>
            Entrer dans le village
          </button>
        </form>
      </div>
      <p style={{ fontSize:11, color:'rgba(245,230,202,0.18)', textAlign:'center' }}>6 à 16 joueurs · réseau local</p>
    </div>
  );
}
