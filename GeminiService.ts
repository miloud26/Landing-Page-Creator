
import { GoogleGenAI } from "@google/genai";
import { LandingPageContent } from "./types";

function cleanArabicText(text: string): string {
  if (!text) return "";
  return text.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

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
 * إعادة توليد صورة واحدة باستخدام مفتاح API مقدم من المستخدم
 */
export async function regenerateSingleImage(
  apiKey: string,
  prompt: string, 
  currentImage: string, 
  allProductImages: string[] = []
): Promise<string | null> {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const referenceImages = allProductImages.length > 0 ? allProductImages : [currentImage];
    const imageParts = referenceImages.map(img => ({
      inlineData: { data: img.split(',')[1], mimeType: "image/jpeg" }
    }));

    const parts: any[] = [
      { 
        text: `STRICT PRODUCT FIDELITY & MASTERPIECE PROTOCOL.
        1. PRODUCT: Must be 100% identical to the reference images.
        2. SCENE: "${prompt}".
        3. CINEMATIC: Use dramatic lighting (Rim light, God rays), exciting composition, 8k resolution.
        4. ARTISTRY: Beyond imagination, luxury studio photography, elegant and clean.
        5. PERSPECTIVE: Show the FULL object clearly.
        6. TECHNICAL: 1:1 SQUARE, high fidelity, professional grade.` 
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
    throw e;
  }
}

/**
 * تحليل وتصميم الصفحة بالكامل باستخدام مفتاح API مقدم من المستخدم
 */
export async function analyzeAndDesignFromImage(
  apiKey: string,
  productImages: string[], 
  notesContext: string = "",
  variantsContext: string = "",
  onProgress?: (step: string) => void
): Promise<LandingPageContent> {
  const ai = new GoogleGenAI({ apiKey });
  const imageParts = productImages.map(img => ({
    inlineData: { mimeType: "image/jpeg", data: img.split(',')[1] },
  }));

  onProgress?.("تحليل المنتج وبناء استراتيجية الفخامة المطلقة...");
  
  const researchResponse = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [
      {
        parts: [
          ...imageParts,
          {
            text: `Role: Ultra-Luxury Brand Strategist.
            TASK: 
            1. Analyze product.
            2. Sections:
               - Variants: Process this input for colors and sizes: "${variantsContext}". Colors must have hex values.
               - Notes: Integrate these user notes into a "Special Insight" or "Commitment" section: "${notesContext}".
               - Reviews: 3 unique reviews from ALGERIAN customers.
               - FAQ: 4-5 entries.
            3. ARABIC: Sophisticated, eloquent, high line-height.

            Return JSON ONLY:
            {
              "strategyInsights": { "atmosphere": { "primaryColor": "#0f172a", "mood": "Cinematic Luxury" } },
              "copy": {
                "hero": { "headline": "...", "subheadline": "...", "cta": "احصل عليه الآن" },
                "problem": { "title": "...", "pains": ["...", "...", "..."] },
                "solution": { "title": "...", "explanation": "..." },
                "variants": { "title": "خيارات الفخامة", "items": [{"label": "أحمر ملكي", "value": "#ff0000", "type": "color"}] },
                "notes": { "title": "ملاحظات هامة", "content": "..." },
                "visualBenefits": { "title": "لماذا هذا الابتكار؟", "items": [{ "title": "...", "description": "..." }] },
                "socialProof": { "title": "ثقة زبائننا في الجزائر", "reviews": [{ "name": "ياسين دحماني", "comment": "..." }] },
                "faqs": { "title": "الأسئلة الشائعة", "items": [{ "question": "...", "answer": "..." }] }
              },
              "imagePrompts": {
                 "hero": "Cinematic exciting ultra-luxury masterpiece reveal of the product, dramatic lighting, 8k.",
                 "problem": "Realistic gritty high-contrast photo of intense pain/struggle, moody lighting.",
                 "solution": "Pristine luxury studio shot showing the FULL PRODUCT clearly and entirely, clean background.",
                 "benefitPrompts": [
                    "Cinematic professional shot showing the FULL product from a sophisticated dynamic angle.",
                    "Studio shot of the FULL product clearly displayed, luxury vibe."
                 ]
              }
            }`
          }
        ],
      },
    ],
    config: { tools: [{ googleSearch: {} }] }
  });

  const textResponse = researchResponse.text || "";
  const jsonMatch = textResponse.match(/```json\s*([\s\S]*?)\s*```/);
  if (!jsonMatch) throw new Error("Strategy Engine Failed.");
  
  const plan = JSON.parse(jsonMatch[1]);

  onProgress?.("توليد الصور السينمائية (خيالية)...");
  
  const safeGenerate = async (prompt: string, idx: number) => {
    try {
      const result = await regenerateSingleImage(apiKey, prompt, productImages[idx % productImages.length], productImages);
      return result || productImages[idx % productImages.length]; 
    } catch (e) {
      console.warn("Sub-image generation failed, falling back to original.");
      return productImages[idx % productImages.length];
    }
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
    hero: { headline: plan.copy.hero.headline, subheadline: plan.copy.hero.subheadline, cta: plan.copy.hero.cta, imageUrl: heroImg },
    problem: { title: plan.copy.problem.title, pains: plan.copy.problem.pains, imageUrl: problemImg },
    solution: { title: plan.copy.solution.title, explanation: plan.copy.solution.explanation, imageUrl: solutionImg },
    variants: plan.copy.variants,
    notes: plan.copy.notes,
    visualBenefits: { 
      title: plan.copy.visualBenefits?.title || "لماذا نحن؟", 
      items: (plan.copy.visualBenefits?.items || []).map((it: any, i: number) => ({ 
        ...it, 
        id: String(i), 
        imageUrl: benefitImages[i] || productImages[i % productImages.length] 
      })) 
    },
    socialProof: { 
      title: plan.copy.socialProof.title, 
      reviews: (plan.copy.socialProof.reviews || []).slice(0, 3).map((r: any, i: number) => ({ 
        ...r, id: String(i), avatar: generateLocalAvatar(r.name) 
      })), 
      verification: "مراجعات موثقة" 
    },
    faqs: {
      title: plan.copy.faqs?.title || "الأسئلة الشائعة",
      items: (plan.copy.faqs?.items || []).map((f: any, i: number) => ({ ...f, id: String(i) }))
    },
    offer: { price: "", oldPrice: "", urgency: "", cta: plan.copy.hero.cta, ctaLink: "#", guarantees: [], imageUrl: "" },
    sources: []
  } as LandingPageContent;
}
