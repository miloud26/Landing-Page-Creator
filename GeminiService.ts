
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
 * توليد صور فوتوغرافية احترافية باستخدام Pro Image Preview
 */
export async function regenerateSingleImage(
  prompt: string, 
  currentImage: string, 
  allProductImages: string[] = []
): Promise<string | null> {
  try {
    // Always create a fresh instance before API call using process.env.API_KEY directly
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const referenceImages = allProductImages.length > 0 ? allProductImages : [currentImage];
    const imageParts = referenceImages.map(img => ({
      inlineData: { data: img.split(',')[1], mimeType: "image/jpeg" }
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          ...imageParts,
          { text: `High-end commercial product photography. ${prompt}. Ultra-realistic, 4k, cinematic lighting, studio background, luxury aesthetic. Maintain 100% product identity.` }
        ]
      },
      config: {
        imageConfig: { aspectRatio: "1:1", imageSize: "1K" }
      }
    });

    // Access candidates directly and find the inlineData part as per guidelines
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e: any) {
    console.error("Pro Image Generation Error:", e);
    return null;
  }
}

/**
 * تحليل استراتيجي عميق باستخدام Pro Preview لضمان لغة تسويقية فاخرة
 */
export async function analyzeAndDesignFromImage(
  productImages: string[], 
  notesContext: string = "",
  variantsContext: string = "",
  onProgress?: (step: string) => void
): Promise<LandingPageContent> {
  // Fresh instance using process.env.API_KEY directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imageParts = productImages.map(img => ({
    inlineData: { mimeType: "image/jpeg", data: img.split(',')[1] },
  }));

  onProgress?.("تحليل المكونات البصرية للمنتج (Pro Engine)...");
  
  const researchResponse = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [
      {
        parts: [
          ...imageParts,
          {
            text: `Role: Master Brand Strategist for Ultra-Luxury Goods.
            Create a high-conversion landing page in ARABIC.
            Style: Minimalist, prestigious, and extremely persuasive.
            Context: Variants: ${variantsContext}, Notes: ${notesContext}.
            
            Return JSON ONLY:
            {
              "strategyInsights": { "atmosphere": { "primaryColor": "#0f172a", "mood": "Cinematic Luxury" } },
              "copy": {
                "hero": { "headline": "...", "subheadline": "...", "cta": "اكتشف الفخامة" },
                "problem": { "title": "...", "pains": ["...", "...", "..."] },
                "solution": { "title": "...", "explanation": "..." },
                "variants": { "title": "إصدارات حصرية", "items": [{"label": "...", "value": "#000", "type": "color"}] },
                "notes": { "title": "معلومات تهمك", "content": "..." },
                "visualBenefits": { "title": "لماذا نانو براند؟", "items": [{ "title": "...", "description": "..." }] },
                "socialProof": { "title": "شهادات التميز", "reviews": [{ "name": "...", "comment": "..." }] },
                "faqs": { "title": "تساؤلات شائعة", "items": [{ "question": "...", "answer": "..." }] }
              },
              "imagePrompts": {
                 "hero": "Dramatic product reveal in a dark luxury studio.",
                 "problem": "Subtle artistic expression of discomfort.",
                 "solution": "Masterpiece shot of the product.",
                 "benefitPrompts": ["Macro detail shot.", "Elegance in motion."]
              }
            }`
          }
        ],
      }
    ],
    config: { 
      thinkingConfig: { thinkingBudget: 4000 },
      responseMimeType: "application/json"
    }
  });

  // Extracting text output using the .text property (not a method)
  const plan = JSON.parse(researchResponse.text.trim());

  onProgress?.("توليد المشاهد البصرية الاحترافية (Pro)...");
  
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
      title: plan.copy.visualBenefits?.title || "التفاصيل", 
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
