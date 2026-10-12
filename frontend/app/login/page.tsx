'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Eye, EyeOff, AlertCircle, LogIn, RefreshCw,
  ChevronDown, ChevronUp, Copy,
  FileText, Database, ShoppingCart, BarChart2,
} from 'lucide-react';
import { auth } from '@/lib/api';
import { useAuth } from '@/lib/auth';

/* ── unchanged auth data ──────────────────────────────────── */
const DEMO_ACCOUNTS = [
  { username: 'sp_puducherry',          password: 'demo123',  role: 'Approving Authority',   color: '#1a7a3c', bg: '#e8f5ee' },
  { username: 'dsp_north',              password: 'demo123',  role: 'Reviewer',              color: '#1F5A92', bg: '#e8f0fa' },
  { username: 'si_central',             password: 'demo123',  role: 'Initiator',             color: '#0B5D5E', bg: '#e0f2f2' },
  { username: 'procurement_officer',    password: 'demo123',  role: 'Procurement Officer',   color: '#d97706', bg: '#fff3e0' },
  { username: 'implementation_officer', password: 'demo123',  role: 'Implementation Officer',color: '#7e22ce', bg: '#f3e8ff' },
  { username: 'auditor',                password: 'demo123',  role: 'Auditor',               color: '#5F6B7A', bg: '#f1f5f9' },
  { username: 'admin',                  password: 'admin123', role: 'System Administrator',  color: '#c0392b', bg: '#fdf0ef' },
];

function makeCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [username,     setUsername]    = useState('sp_puducherry');
  const [password,     setPassword]    = useState('demo123');
  const [showPw,       setShowPw]      = useState(false);
  const [captchaText,  setCaptchaText] = useState('......');
  const [captchaInput, setCaptchaInput]= useState('');
  const [showAccounts, setShowAccounts]= useState(true);
  const [loading,      setLoading]     = useState(false);
  const [error,        setError]       = useState('');

  useEffect(() => { setCaptchaText(makeCaptcha()); }, []);

  const refreshCaptcha = () => { setCaptchaText(makeCaptcha()); setCaptchaInput(''); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaInput.trim()) { setError('Please enter the CAPTCHA code.'); return; }
    setLoading(true); setError('');
    try {
      const res = await auth.login(username, password);
      const meRes = await fetch('http://localhost:5001/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${res.token}` },
      });
      const me = await meRes.json();
      login(res.token, { ...res.user, permissions: me.permissions || [] });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
      refreshCaptcha();
    } finally { setLoading(false); }
  };

  const quickFill = (u: string, p: string) => {
    setUsername(u); setPassword(p); setCaptchaInput(captchaText); setError('');
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 10px 8px 32px',
    border: '1px solid #d1d5db', borderRadius: 5,
    fontSize: '0.85rem', outline: 'none',
    fontFamily: 'inherit', color: '#111827',
    boxSizing: 'border-box',
  };

  return (
    <>
      <style>{`
        html,body{margin:0;padding:0}

        /* ── Viewport-locked page grid ── */
        .lp{
          height:100dvh;
          min-height:100dvh;
          display:grid;
          grid-template-rows:auto minmax(0,1fr) auto;
          overflow:hidden;
          font-family:'Noto Sans','Segoe UI',sans-serif;
          background:#f0f4f8;
        }

        /* ── Main two-column grid ── */
        .lp-main{
          display:grid;
          grid-template-columns:minmax(0,1.5fr) minmax(540px,0.85fr);
          min-height:0;
          overflow:hidden;
        }

        /* ── Left hero: light background, photo anchored to bottom ── */
        .lp-hero{
          position:relative;
          background:#eef2f7;      /* plain light background — no photo here */
          overflow:hidden;
          display:flex;
          flex-direction:column;
          min-height:0;
        }

        /* Photo sits at the bottom of the hero, ~42% of height */
        .lp-hero-photo{
          position:absolute;
          bottom:0; left:0; right:0;
          width:100%;
          height:36%;
          object-fit:cover;
          object-position:center bottom;
          z-index:1;
          display:block;
        }

        /* Upward-fading gradient: white at top, transparent at bottom
           This softens the transition between light bg and the photo */
        .lp-hero-fade{
          position:absolute;
          bottom:0; left:0; right:0;
          height:42%;
          background:linear-gradient(
            to bottom,
            rgba(238,242,247,1)  0%,
            rgba(238,242,247,0.75) 25%,
            rgba(238,242,247,0.3)  60%,
            rgba(238,242,247,0)  100%
          );
          z-index:2;
          pointer-events:none;
        }

        /* Hero text content — above photo and fade */
        .lp-hero-content{
          position:relative;
          z-index:3;
          padding:48px clamp(32px,5vw,80px) 16px clamp(36px,6vw,96px);
          display:flex;
          flex-direction:column;
          flex:1;
          /* Constrain content to top ~60% so features stay clear of photo */
          justify-content:flex-start;
          max-height:62%;
          overflow:hidden;
        }

        /* Feature row: 4 items, single row, no wrap */
        .lp-features{
          display:grid;
          grid-template-columns:repeat(4,minmax(0,1fr));
          gap:0;
          max-width:720px;
          margin-top:20px;
          flex-shrink:0;
        }

        /* ── Right panel ── */
        .lp-right{
          background:#e8edf5;
          display:flex;
          align-items:flex-start;
          justify-content:center;
          padding:16px 28px 10px 12px;
          min-height:0;
          overflow:hidden;
        }

        /* Login card — scrolls internally only on very short viewports */
        .lp-card{
          background:white;
          border-radius:8px;
          border:1px solid #dde3ec;
          box-shadow:0 2px 20px rgba(11,42,71,0.13);
          width:min(100%,590px);
          max-height:calc(100% - 8px);
          overflow-y:auto;
          overflow-x:hidden;
          scrollbar-width:thin;
          flex-shrink:0;
        }

        /* Feature item */
        .lp-feat{
          display:flex;
          flex-direction:column;
          align-items:center;
          gap:6px;
          padding:10px 8px;
          border-right:1px solid #c8d4e0;
          text-align:center;
        }
        .lp-feat:last-child{border-right:none;}

        /* ── Tablet ── */
        @media(max-width:1100px){
          .lp-main{grid-template-columns:minmax(0,1.3fr) minmax(460px,0.8fr);}
        }
        @media(max-width:900px){
          .lp{height:auto;min-height:100svh;overflow:visible;}
          .lp-main{grid-template-columns:1fr;}
          .lp-hero{min-height:280px;height:280px;}
          .lp-hero-photo{height:65%;}
          .lp-hero-content{padding:24px 20px 16px;}
          .lp-features{grid-template-columns:repeat(2,1fr);}
          .lp-feat{border-right:none;border-bottom:1px solid #c8d4e0;}
          .lp-right{padding:20px 16px;background:#f5f7fa;}
          .lp-card{max-height:none;width:100%;}
        }
      `}</style>

      <div className="lp">

        {/* ══ HEADER ═══════════════════════════════════════════ */}
        <header style={{
          background:'white', borderBottom:'1px solid #e5e7eb',
          padding:'0 24px', height:68,
          display:'flex', alignItems:'center', gap:16,
          boxShadow:'0 1px 3px rgba(0,0,0,0.06)',
          flexShrink:0, zIndex:10,
        }}>
          <Image src="/prism-logo-icon.png" alt="Puducherry Police" width={48} height={48} style={{display:'block',flexShrink:0}} priority />
          <div style={{lineHeight:1.25}}>
            <div style={{fontSize:'0.9rem',fontWeight:800,color:'#0B2447'}}>PUDUCHERRY POLICE</div>
            <div style={{fontSize:'0.65rem',color:'#5F6B7A',fontFamily:'var(--font-tamil)'}}>புதுச்சேரி காவல் துறை</div>
            <div style={{fontSize:'0.56rem',color:'#9ca3af',letterSpacing:'0.07em'}}>SAFETY &nbsp;|&nbsp; SERVICE &nbsp;|&nbsp; COMMITMENT</div>
          </div>
          <div style={{width:1,height:40,background:'#e5e7eb',flexShrink:0,margin:'0 4px'}}/>
          <div style={{lineHeight:1.25}}>
            <div style={{fontSize:'1.25rem',fontWeight:900,letterSpacing:'-0.02em'}}>
              <span style={{color:'#0B2447'}}>PRISM</span><span style={{color:'#1F5A92'}}>-PY</span>
            </div>
            <div style={{fontSize:'0.64rem',color:'#5F6B7A',fontWeight:500}}>Police Proposal Retrieval, Intelligence &amp; Strategy Matrix</div>
            <div style={{fontSize:'0.58rem',color:'#9ca3af'}}>Intelligent Proposal Management &amp; Precedent Retrieval System</div>
          </div>
          <div style={{flex:1}}/>
          <div style={{background:'#fffbeb',border:'1px solid #f59e0b',borderRadius:4,padding:'4px 12px',textAlign:'center'}}>
            <div style={{fontSize:'0.7rem',fontWeight:800,color:'#92400e',letterSpacing:'0.04em'}}>SYNTHETIC DEMO</div>
            <div style={{fontSize:'0.56rem',color:'#b45309'}}>Not an official government application.</div>
          </div>
        </header>

        {/* ══ MAIN ═════════════════════════════════════════════ */}
        <div className="lp-main">

          {/* ── LEFT HERO ── */}
          <div className="lp-hero">

            {/* Building photo — BOTTOM portion only, z-index:1 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/pypolicebuild.png"
              alt="Puducherry Police Headquarters"
              className="lp-hero-photo"
            />

            {/* Soft upward fade — blends photo into light bg above */}
            <div className="lp-hero-fade" />

            {/* Hero text — sits on the LIGHT upper area, no photo behind it */}
            <div className="lp-hero-content">

              {/* Eyebrow */}
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                <div style={{width:26,height:2,background:'#C9A227',flexShrink:0}}/>
                <span style={{fontSize:'0.62rem',fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'#4a6080'}}>
                  Data-Driven Decisions for a Safer Puducherry
                </span>
              </div>

              {/* Main heading — TWO LINES, dark navy, wide container */}
              <h1 style={{
                fontSize:'clamp(30px,2.8vw,50px)',
                fontWeight:900,
                color:'#0B2A4A',
                lineHeight:1.1,
                margin:'0 0 14px',
                letterSpacing:'-0.02em',
                maxWidth:'760px',   /* wide enough to prevent 3-line break */
                whiteSpace:'normal',
              }}>
                Intelligent Proposal<br/>Management
              </h1>

              {/* Description — dark, wide */}
              <p style={{
                fontSize:'clamp(0.78rem,1vw,0.9rem)',
                color:'#334155',
                lineHeight:1.65,
                maxWidth:'700px',
                margin:'0 0 0',
              }}>
                PRISM-PY provides evidence-backed decision support for departmental
                proposals using historical precedents, policy intelligence, procurement
                information and institutional knowledge.
              </p>

              {/* Four features — ONE ROW always on desktop */}
              <div className="lp-features">
                {[
                  {icon:<FileText size={20}/>,    label:'Proposal\nIntelligence'},
                  {icon:<Database size={20}/>,    label:'Precedent\nRetrieval'},
                  {icon:<ShoppingCart size={20}/>,label:'Procurement\nIntelligence'},
                  {icon:<BarChart2 size={20}/>,   label:'Decision\nSupport'},
                ].map(({icon,label})=>(
                  <div key={label} className="lp-feat">
                    <div style={{color:'#0B2447'}}>{icon}</div>
                    <span style={{fontSize:'0.62rem',color:'#1a3050',fontWeight:700,lineHeight:1.3,whiteSpace:'pre-line'}}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>

            </div>{/* /hero-content */}
          </div>{/* /hero */}

          {/* ── RIGHT LOGIN PANEL ── */}
          <div className="lp-right">
            <div className="lp-card">

              {/* Card header */}
              <div style={{padding:'16px 24px 14px',borderBottom:'1px solid #e5e7eb',background:'#F8FAFD'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:42,height:42,borderRadius:'50%',background:'#EEF1F6',border:'1px solid #d1d5db',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B2447" strokeWidth="2">
                      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{fontSize:'1rem',fontWeight:800,color:'#0B2447'}}>Officer Sign In</div>
                    <div style={{fontSize:'0.72rem',color:'#6b7280'}}>Welcome back! Please login to continue.</div>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} style={{padding:'14px 24px 10px'}}>

                {/* User ID */}
                <div style={{marginBottom:10}}>
                  <label style={{display:'block',fontSize:'0.8rem',fontWeight:600,color:'#374151',marginBottom:4}}>
                    User ID <span style={{color:'#dc2626'}}>*</span>
                  </label>
                  <div style={{position:'relative'}}>
                    <span style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'#9ca3af',pointerEvents:'none'}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                    </span>
                    <input type="text" value={username} onChange={e=>setUsername(e.target.value)} required autoComplete="username" placeholder="Enter your department username"
                      style={inp}
                      onFocus={e=>(e.target.style.borderColor='#1F5A92')} onBlur={e=>(e.target.style.borderColor='#d1d5db')}/>
                  </div>
                </div>

                {/* Password */}
                <div style={{marginBottom:10}}>
                  <label style={{display:'block',fontSize:'0.8rem',fontWeight:600,color:'#374151',marginBottom:4}}>
                    Password <span style={{color:'#dc2626'}}>*</span>
                  </label>
                  <div style={{position:'relative'}}>
                    <span style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'#9ca3af',pointerEvents:'none'}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </span>
                    <input type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" placeholder="Enter your password"
                      style={{...inp,paddingRight:34}}
                      onFocus={e=>(e.target.style.borderColor='#1F5A92')} onBlur={e=>(e.target.style.borderColor='#d1d5db')}/>
                    <button type="button" onClick={()=>setShowPw(s=>!s)} aria-label="Toggle password"
                      style={{position:'absolute',right:9,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#9ca3af',padding:0,lineHeight:0}}>
                      {showPw?<EyeOff size={14}/>:<Eye size={14}/>}
                    </button>
                  </div>
                </div>

                {/* CAPTCHA — grid prevents overflow */}
                <div style={{marginBottom:13}}>
                  <label style={{display:'block',fontSize:'0.8rem',fontWeight:600,color:'#374151',marginBottom:4}}>
                    Enter CAPTCHA <span style={{color:'#dc2626'}}>*</span>
                  </label>
                  <div style={{display:'grid',gridTemplateColumns:'150px 1fr auto',gap:6,alignItems:'stretch'}}>
                    {/* CAPTCHA image box */}
                    <div style={{
                      display:'flex',alignItems:'center',justifyContent:'center',
                      background:'#f3f4f6',border:'1px solid #d1d5db',borderRadius:5,
                      padding:'5px 10px',userSelect:'none',
                      backgroundImage:'repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(0,0,0,0.025) 3px,rgba(0,0,0,0.025) 4px)',
                    }}>
                      {captchaText.split('').map((ch,i)=>(
                        <span key={i} style={{
                          fontSize:'1.1rem',fontWeight:800,lineHeight:1,
                          fontFamily:'Georgia,serif',
                          color:['#0B2447','#1F5A92','#c0392b','#1a7a3c','#7e22ce','#d97706'][i%6],
                          display:'inline-block',
                          transform:`rotate(${[-7,-3,5,-5,3,-4][i%6]}deg) translateY(${[1,-1,2,-2,1,0][i%6]}px)`,
                          marginRight:1,
                        }}>{ch}</span>
                      ))}
                    </div>
                    {/* CAPTCHA input */}
                    <input type="text" value={captchaInput} onChange={e=>setCaptchaInput(e.target.value)} placeholder="Enter CAPTCHA" required
                      style={{...inp,paddingLeft:10,minWidth:0}}
                      onFocus={e=>(e.target.style.borderColor='#1F5A92')} onBlur={e=>(e.target.style.borderColor='#d1d5db')}/>
                    {/* Refresh */}
                    <button type="button" onClick={refreshCaptcha} title="Refresh CAPTCHA"
                      style={{padding:'0 10px',background:'white',border:'1px solid #d1d5db',borderRadius:5,cursor:'pointer',color:'#1F5A92',display:'flex',alignItems:'center',gap:4,fontSize:'0.72rem',fontWeight:600,whiteSpace:'nowrap'}}>
                      <RefreshCw size={11}/> Refresh
                    </button>
                  </div>
                  <div style={{textAlign:'right',marginTop:4}}>
                    <button type="button" style={{background:'none',border:'none',fontSize:'0.72rem',color:'#1F5A92',cursor:'pointer',padding:0}}>
                      Forgot Password?
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error&&(
                  <div style={{display:'flex',gap:7,alignItems:'center',marginBottom:10,padding:'7px 10px',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:5,fontSize:'0.77rem',color:'#dc2626'}}>
                    <AlertCircle size={12}/>{error}
                  </div>
                )}

                {/* Sign In */}
                <button type="submit" disabled={loading}
                  style={{width:'100%',padding:'10px',background:loading?'#6b7280':'#0B2447',color:'white',border:'none',borderRadius:5,fontSize:'0.88rem',fontWeight:700,cursor:loading?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontFamily:'inherit',letterSpacing:'0.02em',transition:'background 0.15s'}}>
                  <LogIn size={15}/>{loading?'Signing In...':'Sign In'}
                </button>

                {/* OR */}
                <div style={{display:'flex',alignItems:'center',gap:8,margin:'11px 0'}}>
                  <div style={{flex:1,height:1,background:'#e5e7eb'}}/>
                  <span style={{fontSize:'0.68rem',color:'#9ca3af',fontWeight:600}}>OR</span>
                  <div style={{flex:1,height:1,background:'#e5e7eb'}}/>
                </div>

                {/* OTP */}
                <button type="button" onClick={()=>setError('OTP login is not available in the demo environment.')}
                  style={{width:'100%',padding:'9px',background:'white',color:'#374151',border:'1px solid #d1d5db',borderRadius:5,fontSize:'0.84rem',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontFamily:'inherit'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
                  Login with OTP (Registered Mobile)
                </button>
              </form>

              {/* Demonstration Accounts */}
              <div style={{borderTop:'1px solid #e5e7eb',background:'#F8FAFD'}}>
                <button type="button" onClick={()=>setShowAccounts(s=>!s)}
                  style={{width:'100%',padding:'11px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0B2447" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span style={{fontSize:'0.82rem',fontWeight:700,color:'#0B2447'}}>Demonstration Accounts</span>
                  </div>
                  {showAccounts?<ChevronUp size={13} color="#9ca3af"/>:<ChevronDown size={13} color="#9ca3af"/>}
                </button>

                {showAccounts&&(
                  <div style={{padding:'0 16px 14px'}}>
                    <table style={{width:'100%',borderCollapse:'collapse'}}>
                      <tbody>
                        {DEMO_ACCOUNTS.map(acc=>(
                          <tr key={acc.username} onClick={()=>quickFill(acc.username,acc.password)}
                            style={{cursor:'pointer',background:username===acc.username?'#EEF1F6':'transparent'}}
                            onMouseOver={e=>{if(username!==acc.username)(e.currentTarget as HTMLElement).style.background='#F3F4F6';}}
                            onMouseOut={e=>{if(username!==acc.username)(e.currentTarget as HTMLElement).style.background='transparent';}}>
                            <td style={{padding:'4px 6px',fontFamily:'var(--font-mono,monospace)',fontWeight:600,color:'#0B2447',fontSize:'0.76rem'}}>
                              {acc.username}
                            </td>
                            <td style={{padding:'4px 4px'}}>
                              <span style={{fontSize:'0.62rem',fontWeight:700,padding:'2px 8px',borderRadius:3,background:acc.bg,color:acc.color,whiteSpace:'nowrap'}}>
                                {acc.role}
                              </span>
                            </td>
                            <td style={{padding:'4px 3px',textAlign:'right'}}>
                              <button type="button" onClick={e=>{e.stopPropagation();quickFill(acc.username,acc.password);}}
                                style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',padding:'2px 3px'}}>
                                <Copy size={11}/>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p style={{fontSize:'0.6rem',color:'#9ca3af',marginTop:6,lineHeight:1.5}}>
                      Click a row to auto-fill credentials. Demonstration data only.
                    </p>
                  </div>
                )}
              </div>

            </div>{/* /card */}
          </div>{/* /right */}
        </div>{/* /main */}

        {/* ══ FOOTER ═══════════════════════════════════════════ */}
        <footer style={{background:'#0B2447',borderTop:'2px solid #C9A227',padding:'8px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:6,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:9}}>
            <Image src="/prism-logo-icon.png" alt="" width={24} height={24} style={{borderRadius:'50%',opacity:0.8}}/>
            <div>
              <div style={{fontSize:'0.73rem',fontWeight:700,color:'white'}}>PUDUCHERRY POLICE</div>
              <div style={{fontSize:'0.6rem',color:'rgba(255,255,255,0.5)'}}>Government of Puducherry</div>
            </div>
          </div>
          <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
            {['Website Policies','Privacy Policy','Terms of Use','Accessibility Statement','Help'].map(l=>(
              <a key={l} href="#" style={{fontSize:'0.68rem',color:'rgba(255,255,255,0.6)',textDecoration:'none'}}
                onMouseOver={e=>(e.currentTarget.style.color='white')}
                onMouseOut={e=>(e.currentTarget.style.color='rgba(255,255,255,0.6)')}>{l}</a>
            ))}
          </div>
          <div style={{textAlign:'right',fontSize:'0.66rem',color:'rgba(255,255,255,0.5)'}}>
            <div style={{color:'#fcd34d',fontWeight:700}}>PRISM-PY &nbsp;·&nbsp; © 2026</div>
            <div>For authorised departmental use only.</div>
          </div>
        </footer>

      </div>
    </>
  );
}
