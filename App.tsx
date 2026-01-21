
import React, { useState, useRef, useEffect } from 'react';
// تصحيح الاستيراد: حذف الامتدادات الخاطئة ليتعرف عليها Vite تلقائياً
import { analyzeAndDesignFromImage, regenerateSingleImage } from './GeminiService';
import { LandingPageContent } from './types';
import html2canvas from 'html2canvas';

const App: React.FC = () => {
  const [productImages, setProductImages] = useState<string[]>([]);
  const [notesContext, setNotesContext] = useState<string>("");
  const [variantsContext, setVariantsContext] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStepText, setCurrentStepText] = useState("");
  const [content, setContent] = useState<LandingPageContent | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [apiKey, setApiKey] = useState<string>("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('user_gemini_api_key');
      if (savedKey) setApiKey(savedKey);
    } catch (e) {
      console.warn("LocalStorage access denied or unavailable.");
    }
  }, []);

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    try {
      localStorage.setItem('user_gemini_api_key', val);
    } catch (e) {
      console.error("Failed to save API key to storage.");
    }
  };

  const EditableText = ({ 
    value, 
    onSave, 
    className = "",
    placeholder = "..."
  }: { 
    value: string, 
    onSave: (val: string) => void, 
    className?: string,
    placeholder?: string
  }) => {
    const [localValue, setLocalValue] = useState(value || "");
    const isEditing = useRef(false);

    useEffect(() => {
      if (!isEditing.current) setLocalValue(value || "");
    }, [value]);

    return (
      <div 
        contentEditable 
        suppressContentEditableWarning
        onFocus={() => { isEditing.current = true; }}
        onBlur={(e) => {
          isEditing.current = false;
          const val = e.currentTarget.innerText || "";
          setLocalValue(val);
          onSave(val);
        }}
        className={`hover:bg-slate-500/5 transition-all outline-none min-h-[1.2em] cursor-text block leading-[2.0] ${className} ${!localValue ? 'text-slate-300 italic' : ''}`}
        style={{ direction: 'rtl', letterSpacing: '0', wordSpacing: '0' }}
      >
        {localValue || placeholder}
      </div>
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const readers = Array.from(files).map((file: File) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });
      Promise.all(readers).then(results => {
        setProductImages(prev => [...prev, ...results]);
      });
    }
  };

  const handleReset = () => {
    if (window.confirm("هل تريد البدء من جديد؟")) {
      setProductImages([]);
      setNotesContext("");
      setVariantsContext("");
      setContent(null);
      setIsProcessing(false);
      setCurrentStepText("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const startDesignProcess = async () => {
    if (!apiKey.trim()) {
      alert("يرجى إدخال مفتاح API الخاص بك أولاً.");
      return;
    }
    if (productImages.length === 0) {
      alert("ارفع صور المنتج أولاً.");
      return;
    }
    setIsProcessing(true);
    setCurrentStepText("تحليل المنتج وبناء استراتيجية الفخامة...");
    try {
      const result = await analyzeAndDesignFromImage(apiKey, productImages, notesContext, variantsContext, setCurrentStepText);
      setContent(result);
    } catch (error: any) {
      console.error(error);
      alert("حدث خطأ. تأكد من صحة مفتاح الـ API وصلاحية الصور.");
    } finally {
      setIsProcessing(false);
      setCurrentStepText("");
    }
  };

  const handleRegenerateImage = async (sectionKey: string, prompt: string, currentImg: string, index?: number) => {
    if (!content || !apiKey) return;
    setIsProcessing(true);
    setCurrentStepText("إعادة ابتكار المشهد الفني...");
    try {
      const newUrl = await regenerateSingleImage(apiKey, prompt, currentImg, productImages);
      if (!newUrl) return;

      const newContent = { ...content };
      if (sectionKey === 'hero') newContent.hero.imageUrl = newUrl;
      else if (sectionKey === 'problem') newContent.problem.imageUrl = newUrl;
      else if (sectionKey === 'solution') newContent.solution.imageUrl = newUrl;
      else if (sectionKey === 'benefit' && index !== undefined) newContent.visualBenefits.items[index].imageUrl = newUrl;
      setContent(newContent);
    } catch (err: any) { 
      console.error(err);
      alert("فشل في التوليد. تحقق من المفتاح.");
    } finally { setIsProcessing(false); setCurrentStepText(""); }
  };

  const handleDownload = async () => {
    if (!captureRef.current) return;
    setDownloading(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      const canvas = await html2canvas(captureRef.current, { 
        scale: 2.0, useCORS: true, backgroundColor: "#ffffff", width: 800
      });
      const link = document.createElement('a');
      link.download = `brand-vision-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (err) { console.error(err); } finally { setDownloading(false); }
  };

  const themeColor = content?.strategyInsights?.atmosphere?.primaryColor || '#0f172a';

  const LuxuryCTA = ({ value, onSave }: { value: string, onSave: (v: string) => void }) => (
    <div 
      className="group relative w-full overflow-hidden rounded-full transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] cursor-pointer"
      style={{ backgroundColor: themeColor }}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40 pointer-events-none" />
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      <div className="py-12 px-10 flex items-center justify-center gap-6">
        <EditableText 
          value={value} 
          onSave={onSave} 
          className="text-[52px] font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]" 
        />
        <svg className="w-16 h-16 text-white/40 group-hover:translate-x-[-8px] transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020202] text-slate-100 font-['Cairo'] flex flex-col lg:flex-row overflow-hidden" dir="rtl">
      
      <aside className="w-full lg:w-[380px] bg-[#080808] border-l border-white/5 p-8 flex flex-col overflow-y-auto no-scrollbar shrink-0 z-50 shadow-2xl">
        <header className="mb-10">
          <h1 className="text-2xl font-black text-white">نانو براند <span className="text-xs font-bold text-white/30 uppercase tracking-widest block">Luxury Engine</span></h1>
        </header>

        <div className="space-y-8 flex-1">
          <div className="space-y-3 p-5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">مفتاح API الخاص بك</label>
              <div className={`w-2 h-2 rounded-full ${apiKey ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'}`} />
            </div>
            <input 
              type="password"
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="لصق مفتاح Gemini هنا..."
              className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-xs text-white placeholder:text-white/10 focus:outline-none focus:border-emerald-500/30 transition-all font-mono"
            />
            <p className="text-[9px] text-white/20 text-center">يتم الحفظ تلقائياً في متصفحك</p>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">صور المنتج</label>
            <div className="grid grid-cols-4 gap-2">
              {productImages.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-white/5">
                  <img src={img} className="w-full h-full object-cover grayscale opacity-40" alt="" />
                </div>
              ))}
              <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-lg border border-dashed border-white/10 flex items-center justify-center text-white/20 hover:text-white bg-white/5 text-2xl transition-colors hover:bg-white/10">+</button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" multiple />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">الألوان والمقاسات</label>
            <textarea value={variantsContext} onChange={(e) => setVariantsContext(e.target.value)} placeholder="مثال: أحمر، أسود، مقاس L..." className="w-full h-20 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-white/20 transition-all resize-none" />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">ملاحظات إضافية</label>
            <textarea value={notesContext} onChange={(e) => setNotesContext(e.target.value)} placeholder="مثال: توصيل مجاني، ضمان سنة..." className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-white/20 transition-all resize-none" />
          </div>

          <button 
            onClick={startDesignProcess} 
            disabled={isProcessing || productImages.length === 0 || !apiKey} 
            className="group relative w-full h-20 bg-white text-black font-black rounded-full shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-4 text-lg transition-all overflow-hidden"
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-black/5 to-transparent" />
            {isProcessing ? <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" /> : 'ابتكار البراند الفاخر'}
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
          {content && (
            <button 
              onClick={handleDownload} 
              disabled={downloading} 
              className="w-full h-16 bg-white/10 text-white font-black rounded-full hover:bg-white/20 transition-all flex items-center justify-center gap-3"
            >
              {downloading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '💾 تحميل التصميم'}
            </button>
          )}
          <button onClick={handleReset} className="w-full py-4 text-xs font-black text-white/20 uppercase hover:text-white transition-colors">↺ مسح البيانات</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto flex justify-center bg-[#000000] no-scrollbar py-10">
        {content ? (
          <div ref={captureRef} id="capture-area" className="bg-white text-slate-900 flex flex-col shadow-2xl origin-top">
            
            <header className="relative pt-12 pb-16 text-center bg-white flex flex-col">
              <div className="px-12 space-y-10 mb-16">
                <EditableText value={content.hero.headline} onSave={(v) => setContent({...content, hero: {...content.hero, headline: v}})} className="text-[82px] font-black leading-[1.3] tracking-tighter" />
                <EditableText value={content.hero.subheadline} onSave={(v) => setContent({...content, hero: {...content.hero, subheadline: v}})} className="text-[34px] text-slate-400 font-bold leading-[2.1] px-6" />
              </div>
              <div className="relative overflow-hidden aspect-square bg-slate-50 w-full rounded-[60px] px-2">
                <img src={content.hero.imageUrl} className="w-full h-full object-cover rounded-[52px]" crossOrigin="anonymous" alt="Hero" />
              </div>
              <div className="mt-16 px-12">
                <LuxuryCTA 
                  value={content.hero.cta} 
                  onSave={(v) => setContent({...content, hero: {...content.hero, cta: v}})} 
                />
              </div>
            </header>

            <section className="py-28 bg-[#0c111d] text-white text-center">
              <div className="px-12 mb-16">
                <EditableText value={content.problem.title} onSave={(v) => setContent({...content, problem: {...content.problem, title: v}})} className="text-[64px] font-black text-red-500 tracking-tight leading-[1.4]" />
              </div>
              <div className="relative aspect-square bg-black w-full rounded-[60px] px-2">
                <img src={content.problem.imageUrl} className="w-full h-full object-cover rounded-[52px] brightness-75 contrast-125" crossOrigin="anonymous" alt="Problem" />
              </div>
              <div className="space-y-12 px-12 mt-20">
                {content.problem.pains.map((p, i) => (
                  <div key={i} className="text-[40px] font-bold text-white/40 border-b border-white/5 pb-12 flex items-center justify-center gap-8">
                    <span className="w-7 h-7 rounded-full bg-red-600 shrink-0" />
                    <EditableText value={p} onSave={(v) => {
                      const newPains = [...content.problem.pains]; newPains[i] = v; setContent({...content, problem: {...content.problem, pains: newPains}});
                    }} className="leading-[2.0]" />
                  </div>
                ))}
              </div>
            </section>

            <section className="py-28 bg-white">
              <div className="text-center mb-24 px-12">
                <EditableText value={content.visualBenefits.title} onSave={(v) => setContent({...content, visualBenefits: {...content.visualBenefits, title: v}})} className="text-[52px] font-black tracking-[0.2em] uppercase leading-[1.6]" />
                <div className="w-32 h-2 bg-slate-100 mx-auto mt-8 rounded-full" />
              </div>
              <div className="space-y-36">
                {content.visualBenefits.items.map((item, idx) => (
                  <div key={item.id} className="flex flex-col">
                    <div className="relative aspect-square overflow-hidden bg-slate-50 w-full rounded-[60px] px-2">
                      <img src={item.imageUrl} className="w-full h-full object-cover rounded-[52px]" crossOrigin="anonymous" alt={item.title} />
                    </div>
                    <div className="text-center px-12 mt-16">
                      <EditableText value={item.title} onSave={(v) => {
                        const ni = [...content.visualBenefits.items]; ni[idx].title = v; setContent({...content, visualBenefits: {...content.visualBenefits, items: ni}});
                      }} className="text-[54px] font-black mb-8 tracking-tighter leading-[1.4]" />
                      <EditableText value={item.description} onSave={(v) => {
                        const ni = [...content.visualBenefits.items]; ni[idx].description = v; setContent({...content, visualBenefits: {...content.visualBenefits, items: ni}});
                      }} className="text-[32px] text-slate-400 font-bold leading-[2.2]" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="py-28 px-12 bg-[#fafafa]">
              <div className="text-center mb-20">
                <EditableText value={content.socialProof.title} onSave={(v) => setContent({...content, socialProof: {...content.socialProof, title: v}})} className="text-[28px] font-black block opacity-20 tracking-[0.5em] uppercase leading-[1.6]" />
              </div>
              <div className="space-y-16">
                {content.socialProof.reviews.map((r, i) => (
                  <div key={r.id} className="bg-white p-16 rounded-[60px] shadow-sm border border-slate-100 text-right">
                    <div className="flex items-center justify-between mb-12">
                      <div className="flex gap-2 text-yellow-400 text-4xl">★★★★★</div>
                      <EditableText value={r.name} onSave={(v) => {
                        const nr = [...content.socialProof.reviews]; nr[i].name = v; setContent({...content, socialProof: {...content.socialProof, reviews: nr}});
                      }} className="text-[42px] font-black" />
                    </div>
                    <EditableText value={r.comment} onSave={(v) => {
                      const nr = [...content.socialProof.reviews]; nr[i].comment = v; setContent({...content, socialProof: {...content.socialProof, reviews: nr}});
                    }} className="text-[34px] font-bold text-slate-500 leading-[2.1]" />
                  </div>
                ))}
              </div>
            </section>

            <footer className="py-32 px-12 bg-[#0c111d] text-center relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/10 blur-[120px] pointer-events-none" />
              <div className="relative z-10">
                <LuxuryCTA 
                  value={content?.hero?.cta || "اطلب الآن"} 
                  onSave={(v) => content && setContent({...content, hero: {...content.hero, cta: v}})} 
                />
                <p className="text-white/20 mt-20 text-[26px] font-bold tracking-[0.2em] uppercase leading-[2.0]">Luxury Brand Engine &bull; Nano Brand</p>
              </div>
            </footer>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center max-w-md py-48">
            <div className="text-[140px] mb-16 grayscale opacity-10">✦</div>
            <h2 className="text-5xl font-black mb-10 text-white tracking-tighter leading-[1.4]">الابتكار البصري المطلق</h2>
            <p className="text-2xl font-bold text-white/20 leading-[2.2] px-10">أدخل مفتاح الـ API ثم ارفع صور المنتج لتفعيل محرك "نانو براند" وتوليد تجربة بيع سينمائية.</p>
          </div>
        )}
      </main>

      {isProcessing && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 relative mb-12">
            <div className="absolute inset-0 border-2 border-white/5 rounded-full" />
            <div className="absolute inset-0 border-t-2 border-white rounded-full animate-spin" />
          </div>
          <p className="text-2xl font-black text-white tracking-widest uppercase mb-4 animate-pulse">{currentStepText}</p>
          <p className="text-xs text-white/20 font-bold tracking-[0.3em] uppercase">Nano Brand AI Processing</p>
        </div>
      )}
    </div>
  );
};

export default App;
