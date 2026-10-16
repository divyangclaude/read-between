'use client';

import { useEffect, useRef, useState, ChangeEvent } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, Check, ChevronDown, CircleHelp, FlaskConical, ImagePlus, Leaf, LoaderCircle, ScanLine, ShieldCheck, Sparkles, Upload, X } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type Profile = { hairType: string; concern: string; scalp: string; priority: string };
type Analysis = { productName: string; ingredients: string[]; summary: string; confidence: string; notes: string[]; demo?: boolean };
const questions = [
  { key: 'hairType' as const, title: 'What does your hair look like?', sub: 'Hair texture helps put the formula in context.', options: ['Straight', 'Wavy', 'Curly', 'Coily'] },
  { key: 'concern' as const, title: 'What would you like help with?', sub: 'Choose the thing you care about most right now.', options: ['Frizz & flyaways', 'Dryness', 'Oily scalp', 'Breakage', 'Dandruff concerns', 'Everyday care'] },
  { key: 'scalp' as const, title: 'How does your scalp usually feel?', sub: 'This helps us flag ingredients worth checking—not diagnose a condition.', options: ['Comfortable', 'Sometimes sensitive', 'Often itchy or irritated'] },
  { key: 'priority' as const, title: 'What matters most in a formula?', sub: 'There is no universal best shampoo. Tell us your preference.', options: ['Performance', 'Gentle feel', 'Fragrance-free', 'Simple ingredients', 'Value for money'] },
];

const demoAnalysis: Analysis = {
  productName: 'Your shampoo, decoded',
  ingredients: ['Aqua / Water', 'Sodium Laureth Sulfate', 'Cocamidopropyl Betaine', 'Glycerin', 'Dimethicone', 'Citric Acid', 'Parfum / Fragrance'],
  summary: 'This is an illustrative result to demonstrate the experience. The actual formula has not been identified.',
  confidence: 'Demo only',
  notes: [
    'Glycerin is a humectant used to help attract and retain moisture.',
    'Cleansing surfactants remove oil and buildup; how they feel depends on the overall formula and use.',
    'Fragrance can be a concern for some sensitive users, but its presence alone does not mean a product is unsafe.'
  ],
  demo: true,
};

export default function Home() {
  const [mode, setMode] = useState<'home'|'analyse'>('home');
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>({hairType:'', concern:'', scalp:'', priority:''});
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [ingredientsText, setIngredientsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verdict, setVerdict] = useState<'BUY'|'CONSIDER'|'SKIP'>('CONSIDER');
  const fileRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.to('.hero-orb', { yPercent: 24, rotate: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });
      gsap.fromTo('.ingredient-slip', { y: 40, rotate: 3 }, { y: -20, rotate: -2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });
      gsap.fromTo('.reveal-line', { y: 28, opacity: .3 }, { y: 0, opacity: 1, stagger: .15, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.manifesto', start: 'top 78%' } });
      gsap.fromTo('.camera-shell', { scale: .88, rotate: -2 }, { scale: 1, rotate: 0, ease: 'none', scrollTrigger: { trigger: '.scan-cta', start: 'top 90%', end: 'top 30%', scrub: 1 } });
    }, heroRef);
    return () => ctx.revert();
  }, [mode]);

  const chooseFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Choose an image file such as JPG, PNG, or WEBP.'); return; }
    if (file.size > 12 * 1024 * 1024) { setError('That image is over 12 MB. Choose a smaller photo.'); return; }
    setError('');
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  };

  const startAnalysis = async () => {
    if (!image) { setError('Upload a clear photo of the shampoo label first.'); return; }
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/analyze', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ imageDataUrl: image, profile }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'We could not analyse this image.');
      setAnalysis(data);
      setIngredientsText((data.ingredients || []).join('\n'));
      setStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  const finalise = () => {
    const cleaned = ingredientsText.split(/\n|,/).map(x=>x.trim()).filter(Boolean);
    if (!cleaned.length) { setError('Add or confirm the ingredients before continuing.'); return; }
    setAnalysis(prev => prev ? {...prev, ingredients:cleaned, summary: prev.demo ? 'This is a demonstration analysis. No real product-specific evidence has been verified.' : prev.summary} : null);
    const p = profile;
    const sensitive = p.scalp === 'Often itchy or irritated' || p.scalp === 'Sometimes sensitive';
    const priority = p.priority === 'Fragrance-free';
    const hasFragrance = cleaned.some(x=>/parfum|fragrance/i.test(x));
    setVerdict(priority && hasFragrance ? 'CONSIDER' : sensitive && hasFragrance ? 'CONSIDER' : 'CONSIDER');
    setStep(5); setError('');
  };

  const reset = () => { setMode('home'); setImage(null); setFileName(''); setStep(0); setProfile({hairType:'',concern:'',scalp:'',priority:''}); setAnalysis(null); setIngredientsText(''); setError(''); window.scrollTo({top:0,behavior:'smooth'}); };
  const openAnalyse = () => { setMode('analyse'); setStep(0); window.scrollTo({top:0,behavior:'smooth'}); };
  const allAnswered = questions.every(q => profile[q.key].length > 0);

  return (
    <main ref={heroRef}>
      <header className="nav">
        <button className="wordmark" onClick={reset} aria-label="Read Between home"><span className="brand-mark">r.</span><span>read between</span></button>
        <div className="nav-right"><span className="nav-note"><span className="status-dot"/> INGREDIENT INTELLIGENCE</span><button className="nav-cta" onClick={openAnalyse}>Try the scanner <ArrowRight size={15}/></button></div>
      </header>

      {mode === 'home' ? <>
        <section className="hero">
          <div className="hero-grain"/>
          <div className="hero-copy">
            <p className="micro-label"><span className="status-dot"/> A CLOSER LOOK AT HAIR CARE</p>
            <h1>Every ingredient,<br/><em>read.</em></h1>
            <p className="hero-sub">Not just the front of the bottle.<br/>The small print.</p>
            <button className="round-link" onClick={openAnalyse}><span>Find out what’s inside</span><span className="round-arrow"><ArrowRight size={18}/></span></button>
          </div>
          <div className="hero-art" aria-label="Illustrated shampoo bottle and ingredient label">
            <div className="orb-glow"/>
            <div className="hero-orb">
              <div className="halo halo-one"/><div className="halo halo-two"/>
              <div className="bottle">
                <div className="bottle-cap"/><div className="bottle-neck"/><div className="bottle-body">
                  <div className="bottle-brand">FIELD<br/>NOTES</div><div className="bottle-rule"/><div className="bottle-small">DAILY WASH<br/>BOTANICAL SHAMPOO</div><div className="bottle-volume">250 ml</div>
                </div>
              </div>
              <div className="floating-leaf leaf-one">✳</div><div className="floating-leaf leaf-two">✳</div>
            </div>
            <div className="ingredient-slip"><div className="slip-top"><span>THE FORMULA</span><span>01 — 07</span></div><h3>Ingredients</h3><p>Aqua · Glycerin · Sodium Laureth Sulfate · Citric Acid · Parfum</p><div className="slip-bottom"><span>READ THE SMALL PRINT</span><ArrowDown size={13}/></div></div>
            <div className="art-caption">FORMULA STUDY <span>NO. 001</span></div>
          </div>
          <div className="hero-bottom"><span>SCROLL TO LOOK CLOSER</span><span className="scroll-line"/><span>01 / 02</span></div>
        </section>

        <section className="manifesto">
          <div className="manifesto-left"><span className="small-star">✳</span><span>THE LABEL IS ONLY THE BEGINNING</span></div>
          <div className="manifesto-copy"><h2 className="reveal-line">Marketing tells you<br/>what it promises.</h2><h2 className="reveal-line muted">The ingredients tell<br/><em>another story.</em></h2><p className="manifesto-desc reveal-line">We help you read between the claims, understand the formula, and decide what makes sense for your hair.</p></div>
          <div className="manifesto-foot"><span>LESS GUESSWORK.</span><span>MORE UNDERSTANDING.</span></div>
        </section>

        <section className="scan-cta">
          <div className="scan-cta-copy"><p className="micro-label"><span className="status-dot"/> YOUR ROUTINE, RECONSIDERED</p><h2>Bring the bottle.<br/><em>We’ll read the rest.</em></h2><p>One photo. A few quick questions. A clearer way to choose your next wash.</p><button className="cream-button" onClick={openAnalyse}>Analyse your shampoo <ArrowRight size={16}/></button><span className="privacy-note"><ShieldCheck size={14}/> Your photo is used for this analysis.</span></div>
          <button className="camera-shell" onClick={openAnalyse} aria-label="Open shampoo scanner"><div className="camera-corner tl"/><div className="camera-corner tr"/><div className="camera-corner bl"/><div className="camera-corner br"/><div className="camera-crosshair"><ScanLine size={34} strokeWidth={1}/></div><div className="camera-center"><div className="mini-bottle"><div className="mini-cap"/><div className="mini-label">rb.</div></div></div><div className="camera-instruction"><span className="live-dot"/> READY WHEN YOU ARE</div><span className="camera-open"><ArrowRight size={18}/></span></button>
          <div className="scan-bottom"><span>HAIR CARE, WITH CONTEXT.</span><span>SCROLL OR TAP TO BEGIN ↗</span></div>
        </section>
        <footer className="footer"><span className="wordmark"><span className="brand-mark">r.</span><span>read between</span></span><span>Curiosity looks good on you.</span><span>© 2026 READ BETWEEN</span></footer>
      </> : <section className="app-stage">
        <div className="app-topline"><button className="back-link" onClick={()=>step===0?setMode('home'):setStep(Math.max(0,step-1))}><ArrowLeft size={15}/> {step===0?'Back to home':'Previous step'}</button><span className="app-counter">{step===5?'YOUR RESULT':`HAIR CARE ANALYSIS · ${String(Math.min(step+1,5)).padStart(2,'0')} / 05`}</span><button className="exit-link" onClick={reset}><X size={15}/> Exit</button></div>
        <div className="app-content">
          {step===0 && <div className="upload-screen">
            <div className="upload-copy"><p className="micro-label"><span className="status-dot"/> START WITH THE LABEL</p><h1>Let’s look<br/><em>beyond the bottle.</em></h1><p>Upload a clear photo of your shampoo’s ingredient list. We’ll identify what we can—and tell you when we’re unsure.</p><div className="upload-tips"><span><Check size={14}/> Keep the text in focus</span><span><Check size={14}/> Include the full ingredient list</span><span><Check size={14}/> Front label helps identify the product</span></div></div>
            <div className={`drop-zone ${image?'has-image':''}`} onClick={()=>fileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files?.[0];if(f){const dt=new DataTransfer();dt.items.add(f);if(fileRef.current){fileRef.current.files=dt.files;fileRef.current.dispatchEvent(new Event('change',{bubbles:true}));}}}}>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={chooseFile} hidden/>
              {image ? <><img src={image} alt="Uploaded shampoo label preview" className="upload-preview"/><button className="remove-image" onClick={e=>{e.stopPropagation();setImage(null);setFileName('');}} aria-label="Remove image"><X size={16}/></button><div className="file-chip"><Check size={14}/>{fileName}</div></> : <><div className="upload-icon"><ImagePlus size={24}/></div><h3>Drop your label here</h3><p>or click to browse your photos</p><span className="upload-types">JPG, PNG OR WEBP · MAX 12 MB</span></>}
            </div>
            {error&&<p className="error-message">{error}</p>}
            <div className="upload-actions"><button className="text-button" onClick={()=>{setImage(null);setFileName('');setError('');}}>I’ll enter ingredients manually</button><button className="dark-button" onClick={()=>{if(image)startAnalysis();else {setStep(1);setAnalysis({...demoAnalysis});setIngredientsText(demoAnalysis.ingredients.join('\n'));}}}>{image?'Read this label':'Use a sample label'} <ArrowRight size={16}/></button></div>
          </div>}

          {step===1 && <div className="quiz-screen"><div className="quiz-intro"><p className="micro-label"><span className="status-dot"/> FIRST, A LITTLE CONTEXT</p><h1>Hair care is<br/><em>personal.</em></h1><p>Four quick questions help put the ingredients into context.</p><div className="quiz-progress"><span style={{width:'25%'}}/></div><span className="progress-label">YOUR PROFILE · 1 OF 4</span></div><div className="question-panel"><span className="question-index">QUESTION 01</span><h2>{questions[0].title}</h2><p>{questions[0].sub}</p><div className="option-grid">{questions[0].options.map(o=><button key={o} className={`option ${profile.hairType===o?'selected':''}`} onClick={()=>{setProfile({...profile,hairType:o});setStep(2)}}>{o}<ArrowRight size={15}/></button>)}</div><button className="skip-link" onClick={()=>setStep(2)}>Skip this question</button></div></div>}

          {(step===2||step===3) && <div className="quiz-screen"><div className="quiz-intro"><p className="micro-label"><span className="status-dot"/> FIRST, A LITTLE CONTEXT</p><h1>Hair care is<br/><em>personal.</em></h1><p>Four quick questions help put the ingredients into context.</p><div className="quiz-progress"><span style={{width:`${step===2?50:75}%`}}/></div><span className="progress-label">YOUR PROFILE · {step===2?'2':'3'} OF 4</span></div><div className="question-panel"><span className="question-index">QUESTION 0{step}</span><h2>{questions[step-1].title}</h2><p>{questions[step-1].sub}</p><div className="option-grid">{questions[step-1].options.map(o=><button key={o} className={`option ${profile[questions[step-1].key]===o?'selected':''}`} onClick={()=>setProfile({...profile,[questions[step-1].key]:o})}>{o}<ArrowRight size={15}/></button>)}</div><div className="question-actions"><button className="skip-link" onClick={()=>setStep(step+1)}>Skip</button><button className="dark-button" onClick={()=>setStep(step===2?3:4)}>{step===2?'Next question':'Continue'} <ArrowRight size={16}/></button></div></div></div>}

          {step===4 && <div className="confirm-screen"><p className="micro-label"><span className="status-dot"/> CHECK WHAT WE READ</p><h1>Small print.<br/><em>Clearer picture.</em></h1><p className="confirm-desc">AI can misread a label. Review the ingredient list and make corrections before we put it into context.</p>{analysis?.demo&&<div className="demo-notice"><CircleHelp size={17}/> Sample ingredients only. Replace these with the actual label before relying on a result.</div>}<div className="confirm-grid"><div className="confirm-image">{image?<img src={image} alt="Your uploaded product"/>:<div className="sample-label"><FlaskConical size={30}/><span>SAMPLE LABEL</span></div>}<span className="image-caption">{fileName||'Illustrative sample label'}</span></div><div className="confirm-form"><label htmlFor="ingredients">INGREDIENTS · ONE PER LINE</label><textarea id="ingredients" value={ingredientsText} onChange={e=>setIngredientsText(e.target.value)} rows={10} spellCheck={false}/><span className="field-help">Remove anything that wasn’t on your product label.</span><button className="dark-button full-button" onClick={finalise}>Confirm ingredients <ArrowRight size={16}/></button></div></div>{error&&<p className="error-message">{error}</p>}</div>}

          {step===5 && analysis && <div className="result-screen"><div className="result-head"><p className="micro-label"><span className="status-dot"/> YOUR FORMULA, DECODED</p><h1>Should you<br/><em>buy it?</em></h1><p className="result-desc">A considered recommendation, based on the information we could read and what you told us.</p></div><div className="verdict-card"><div className="verdict-top"><span className="verdict-label">YOUR VERDICT</span><span className="verdict-tag"><Sparkles size={13}/> PERSONAL FIT</span></div><div className="verdict-word">{analysis.demo?'DEMO':verdict}</div><p>{analysis.demo?'This is a sample result to show how recommendations will appear. No real product-specific analysis has been verified.':analysis.summary}</p><div className="verdict-foot"><span><ShieldCheck size={14}/> {analysis.demo?'Not a real recommendation':`AI confidence: ${analysis.confidence||'Unspecified'}`}</span><span>{analysis.ingredients.length} ingredients reviewed</span></div></div><div className="result-details"><div className="detail-column"><span className="detail-title">WHAT TO KNOW</span>{(analysis.notes||[]).map((n,i)=><div className="note-row" key={i}><span className="note-bullet">{String(i+1).padStart(2,'0')}</span><p>{n}</p></div>)}</div><div className="detail-column ingredient-column"><span className="detail-title">INGREDIENTS READ</span><div className="ingredient-tags">{analysis.ingredients.map((x,i)=><span key={`${x}-${i}`}>{x}</span>)}</div><span className="field-help">Ingredient effects depend on concentration, the complete formula, and how the product is used.</span></div></div><div className="result-disclaimer"><ShieldCheck size={16}/><p>For informed shopping, not medical advice. If you have persistent scalp symptoms or known allergies, consult a qualified professional and check the complete product label.</p></div><div className="result-actions"><button className="dark-button" onClick={reset}>Analyse another product <ArrowRight size={16}/></button><button className="text-button" onClick={()=>{setStep(4);window.scrollTo({top:0,behavior:'smooth'})}}>Edit ingredients</button></div></div>}
        </div>
        <footer className="app-footer"><span className="wordmark"><span className="brand-mark">r.</span><span>read between</span></span><span>Better informed, never fear-driven.</span><span>© 2026</span></footer>
      </section>}
    </main>
  );
}
