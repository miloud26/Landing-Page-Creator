
import { GoogleGenAI } from "@google/genai";
import { LandingPageContent } from "./types";

function toBase64(str: string): string {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
  } catch (e) {
    console.error("Base64 encoding failed:", e);
    return "";
  }
}

function generateLocalAvatar(name: string): string {
  const colors = ['#0f172a', '#334155', '#475569', '#1e293b'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const initial = (name && name.length > 0 ? name[0] : '?').toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="${color}" />
    <text x="50" y="65" font-family="Cairo, Arial, sans-serif" font-size="40" font-weight="700" fill="white" text-anchor="middle">${initial}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${toBase64(svg)}`;
}

/**
 * إعادة توليد صورة واحدة باستخدام الموديل المستقر
 */
export async function regenerateSingleImage(
  prompt: string, 
  currentImage: string, 
  allProductImages: string[] = []
): Promise<string | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const referenceImages = allProductImages.length > 0 ? allProductImages : [currentImage];
    const imageParts = referenceImages.map(img => ({
      inlineData: { data: img.split(',')[1], mimeType: "image/jpeg" }
    }));

    const parts: any[] = [
      { 
        text: `STRICT PRODUCT FIDELITY PROTOCOL.
        IMAGE PROMPT: "${prompt}".
        STYLE: Ultra-luxury, cinematic studio lighting, 8k, professional photography.
        REQUIREMENT: Product must be exactly as shown in references.` 
      },
      ...imageParts
    ];

    const imgResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts },
      config: { imageConfig: { aspectRatio: "1:1" } } 
    });
    
    const part = imgResponse.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return part ? `data:image/png;base64,${part.inlineData.data}` : null;
  } catch (e: any) {
    console.error("Image Generation Error:", e);
    return null;
  }
}

/**
 * تحليل وتصميم الصفحة باستخدام gemini-3-flash لضمان أعلى استقرار
 */
export async function analyzeAndDesignFromImage(
  productImages: string[], 
  notesContext: string = "",
  variantsContext: string = "",
  onProgress?: (step: string) => void
): Promise<LandingPageContent> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const imageParts = productImages.map(img => ({
    inlineData: { mimeType: "image/jpeg", data: img.split(',')[1] },
  }));

  onProgress?.("تحليل المنتج وبناء استراتيجية البيع (Flash Engine)...");
  
  const researchResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          ...imageParts,
          {
            text: `Role: Luxury E-commerce Copywriter & Strategist.
            Build a high-converting Landing Page in ARABIC for this product.
            User Notes: ${notesContext}
            Variants: ${variantsContext}
            
            Return JSON ONLY:
            {
              "strategyInsights": { "atmosphere": { "primaryColor": "#0f172a", "mood": "Luxury" } },
              "copy": {
                "hero": { "headline": "...", "subheadline": "...", "cta": "اطلب الآن" },
                "problem": { "title": "...", "pains": ["...", "...", "..."] },
                "solution": { "title": "...", "explanation": "..." },
                "variants": { "title": "الخيارات المتاحة", "items": [{"label": "...", "value": "#000", "type": "color"}] },
                "notes": { "title": "تنبيه هام", "content": "..." },
                "visualBenefits": { "title": "لماذا تختارنا؟", "items": [{ "title": "...", "description": "..." }] },
                "socialProof": { "title": "آراء الزبائن", "reviews": [{ "name": "...", "comment": "..." }] },
                "faqs": { "title": "الأسئلة الشائعة", "items": [{ "question": "...", "answer": "..." }] }
              },
              "imagePrompts": {
                 "hero": "Luxury studio reveal, dramatic lighting.",
                 "problem": "Moody photography representing the problem.",
                 "solution": "Clean professional product shot.",
                 "benefitPrompts": ["Close up detail.", "Lifestyle display."]
              }
            }`
          }
        ],
      }
    ]
  });

  const textResponse = researchResponse.text || "";
  const jsonMatch = textResponse.match(/```json\s*([\s\S]*?)\s*```/) || [null, textResponse];
  const plan = JSON.parse(jsonMatch[1] || textResponse);

  onProgress?.("توليد الصور السينمائية عالية الدقة...");
  
  const safeGenerate = async (prompt: string, idx: number) => {
    const result = await regenerateSingleImage(prompt, productImages[idx % productImages.length], productImages);
    return result || productImages[idx % productImages.length];
  };

  const [heroImg, problemImg, solutionImg] = await Promise.all([
    safeGenerate(plan.imagePrompts.hero, 0),
    safeGenerate(plan.imagePrompts.problem, 1),
    safeGenerate(plan.imagePrompts.solution, 2)
  ]);

  const benefitImages = await Promise.all(
    (plan.imagePrompts.benefitPrompts || []).map((p: string, i: number) => safeGenerate(p, i + 3))
  );

  return {
    strategyInsights: plan.strategyInsights,
    hero: { ...plan.copy.hero, imageUrl: heroImg },
    problem: { ...plan.copy.problem, imageUrl: problemImg },
    solution: { ...plan.copy.solution, imageUrl: solutionImg },
    variants: plan.copy.variants,
    notes: plan.copy.notes,
    visualBenefits: { 
      title: plan.copy.visualBenefits?.title || "المزايا", 
      items: (plan.copy.visualBenefits?.items || []).map((it: any, i: number) => ({ 
        ...it, id: String(i), imageUrl: benefitImages[i] || productImages[0]
      })) 
    },
    socialProof: { 
      ...plan.copy.socialProof,
      reviews: (plan.copy.socialProof.reviews || []).map((r: any, i: number) => ({ 
        ...r, id: String(i), avatar: generateLocalAvatar(r.name) 
      }))
    },
    faqs: {
      title: plan.copy.faqs?.title || "الأسئلة",
      items: (plan.copy.faqs?.items || []).map((f: any, i: number) => ({ ...f, id: String(i) }))
    },
    offer: { price: "", oldPrice: "", urgency: "", cta: plan.copy.hero.cta, guarantees: [], imageUrl: "" }
  } as LandingPageContent;
}
