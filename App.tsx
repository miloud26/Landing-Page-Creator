
import React, { useState, useRef, useEffect } from 'react';
import { analyzeAndDesignFromImage } from './GeminiService';
import { LandingPageContent } from './types';
import html2canvas from 'html2canvas';

// Removed redundant aistudio declaration as it conflicts with environmental types

const App: React.FC = () => {
  const [productImages, setProductImages] = useState<string[]>([]);
  const [notesContext, setNotesContext] = useState<string>("");
  const [variantsContext, setVariantsContext] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStepText, setCurrentStepText] = useState("");
  const [content, setContent] = useState<LandingPageContent | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [hasKey, setHasKey] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  // التحقق من وجود مفتاح مربوط عند التحميل
  useEffect(() => {
    const checkKeyStatus = async () => {
      // @ts-ignore - aistudio is provided by the environment
      if (window.aistudio) {
        // @ts-ignore
        const connected = await window.aistudio.hasSelectedApiKey();
        setHasKey(connected);
      }
    };
    checkKeyStatus();
  }, []);

  const handleConnectKey = async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      // Assume the key selection was successful as per guidelines to avoid race conditions
      setHasKey(true);
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
    return (
      <div 
        contentEditable 
        suppressContentEditableWarning
        onBlur={(e) => {
          const val = e.currentTarget.innerText || "";
          setLocalValue(val);
          onSave(val);
        }}
        className={`hover:bg-slate-500/5 transition-all outline-none min-h-[1.2em] cursor-text block ${className} ${!localValue ? 'text-slate-300 italic' : ''}`}
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

  const startDesignProcess = async () => {
    if (!hasKey) {
      handleConnectKey();
      return;
    }
    if (productImages.length === 0) {
      alert("يرجى رفع صور المنتج أولاً.");
      return;
    }
    setIsProcessing(true);
    setCurrentStepText("بدء محرك التحليل الاحترافي...");
    try {
      const result = await analyzeAndDesignFromImage(productImages, notesContext, variantsContext, setCurrentStepText);
      setContent(result);
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("Requested entity was not found")) {
        setHasKey(false);
        alert("فشل في المصادقة. يرجى إعادة ربط مفتاح API الخاص بك.");
      } else {
        alert("حدث خطأ في الاتصال. يرجى المحاولة لاحقاً.");
      }
    } finally {
      setIsProcessing(false);
      setCurrentStepText("");
    }
  };

  const handleDownload = async () => {
    if (!captureRef.current) return;
    setDownloading(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      const canvas = await html2canvas(captureRef.current, { scale: 2.0, useCORS: true, width: 800 });
      const link = document.createElement('a');
      link.download = `nano-brand-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) { console.error(err); } finally { setDownloading(false); }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-slate-100 font-['Cairo'] flex flex-col lg:flex-row overflow-hidden" dir="rtl">
      
      <aside className="w-full lg:w-[380px] bg-[#080808] border-l border-white/5 p-8 flex flex-col overflow-y-auto no-scrollbar shrink-0 z-50">
        <header className="mb-10 flex items-center justify-between">
          <h1 className="text-2xl font-black text-white">نانو براند</h1>
          <div className="flex items-center gap-2">
             <span className={`w-2 h-2 rounded-full ${hasKey ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 animate-pulse'}`} />
             <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{hasKey ? 'Connected' : 'Offline'}</span>
          </div>
        </header>

        <div className="space-y-8 flex-1">
          {/* قسم ربط المحرك */}
          {!hasKey && (
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
              <p className="text-xs font-bold text-white/40 leading-relaxed">لجعل التطبيق يعمل بجودة Pro وحسابك الخاص، يرجى ربط مفتاح API.</p>
              <button onClick={handleConnectKey} className="w-full py-3 bg-emerald-600/20 text-emerald-400 text-xs font-black rounded-xl border border-emerald-500/30 hover:bg-emerald-600/30 transition-all">ربط محرك نانو الذكي</button>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="block text-center text-[9px] text-white/20 hover:text-white transition-colors">عرض تعليمات الفوترة والـ API</a>
            </div>
          )}

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
            disabled={isProcessing || productImages.length === 0} 
            className="group relative w-full h-20 bg-white text-black font-black rounded-full shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-4 text-lg transition-all"
          >
            {isProcessing ? <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" /> : (!hasKey ? 'ربط المحرك أولاً' : 'ابتكار البراند الفاخر')}
          </button>
        </div>

        {content && (
          <div className="mt-8 pt-8 border-t border-white/5">
            <button 
              onClick={handleDownload} 
              disabled={downloading} 
              className="w-full h-16 bg-white/10 text-white font-black rounded-full hover:bg-white/20 transition-all flex items-center justify-center gap-3"
            >
              {downloading ? 'جاري التحميل...' : '💾 تحميل التصميم'}
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1 overflow-y-auto flex justify-center bg-[#000000] no-scrollbar py-10">
        {content ? (
          <div ref={captureRef} id="capture-area" className="bg-white text-slate-900 flex flex-col shadow-2xl origin-top">
             <header className="relative pt-12 pb-16 text-center px-12 space-y-10">
              <EditableText value={content.hero.headline} onSave={(v) => setContent({...content, hero: {...content.hero, headline: v}})} className="text-[82px] font-black leading-tight tracking-tighter" />
              <EditableText value={content.hero.subheadline} onSave={(v) => setContent({...content, hero: {...content.hero, subheadline: v}})} className="text-[34px] text-slate-400 font-bold" />
              <img src={content.hero.imageUrl} className="w-full rounded-[60px] aspect-square object-cover" crossOrigin="anonymous" alt="Hero" />
              <div className="w-full py-12 rounded-full text-white text-[52px] font-black flex items-center justify-center" style={{backgroundColor: content.strategyInsights.atmosphere.primaryColor}}>
                {content.hero.cta}
              </div>
            </header>

            <section className="py-28 bg-[#0c111d] text-white text-center px-12">
              <EditableText value={content.problem.title} onSave={(v) => setContent({...content, problem: {...content.problem, title: v}})} className="text-[64px] font-black text-red-500 mb-16" />
              <img src={content.problem.imageUrl} className="w-full rounded-[60px] aspect-square object-cover brightness-75 mb-20" crossOrigin="anonymous" alt="Problem" />
              <div className="space-y-12">
                {content.problem.pains.map((p, i) => (
                  <div key={i} className="text-[40px] font-bold text-white/40 border-b border-white/5 pb-12 flex items-center justify-center gap-8">
                    <span className="w-7 h-7 rounded-full bg-red-600 shrink-0" />
                    <EditableText value={p} onSave={(v) => {
                      const newPains = [...content.problem.pains]; newPains[i] = v; setContent({...content, problem: {...content.problem, pains: newPains}});
                    }} />
                  </div>
                ))}
              </div>
            </section>

            <section className="py-28 bg-white px-12">
              <EditableText value={content.visualBenefits.title} onSave={(v) => setContent({...content, visualBenefits: {...content.visualBenefits, title: v}})} className="text-[52px] font-black text-center mb-24 uppercase" />
              <div className="space-y-36">
                {content.visualBenefits.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-12">
                    <img src={item.imageUrl} className="w-full rounded-[60px] aspect-square object-cover" crossOrigin="anonymous" alt="" />
                    <div className="text-center">
                      <EditableText value={item.title} onSave={(v) => {
                        const ni = [...content.visualBenefits.items]; ni[idx].title = v; setContent({...content, visualBenefits: {...content.visualBenefits, items: ni}});
                      }} className="text-[54px] font-black mb-6" />
                      <EditableText value={item.description} onSave={(v) => {
                        const ni = [...content.visualBenefits.items]; ni[idx].description = v; setContent({...content, visualBenefits: {...content.visualBenefits, items: ni}});
                      }} className="text-[32px] text-slate-400 font-bold" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <footer className="py-32 px-12 bg-[#0c111d] text-center">
              <div className="w-full py-12 rounded-full text-white text-[52px] font-black flex items-center justify-center" style={{backgroundColor: content.strategyInsights.atmosphere.primaryColor}}>
                {content.hero.cta}
              </div>
              <p className="text-white/20 mt-20 text-[26px] font-bold">LUXURY PRO ENGINE • NANO BRAND</p>
            </footer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center max-w-md py-48 opacity-20">
            <div className="text-[140px] mb-16 grayscale">✦</div>
            <h2 className="text-5xl font-black mb-10 text-white tracking-tighter">الابتكار البصري PRO</h2>
            <p className="text-2xl font-bold text-white leading-relaxed">اربط محرك الـ API الخاص بك لتوليد تجربة بيع سينمائية بمواصفات عالمية.</p>
          </div>
        )}
      </main>

      {isProcessing && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 border-t-2 border-white rounded-full animate-spin mb-12" />
          <p className="text-2xl font-black text-white uppercase animate-pulse">{currentStepText}</p>
        </div>
      )}
    </div>
  );
};

export default App;
