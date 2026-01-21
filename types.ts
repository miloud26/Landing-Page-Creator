
export interface VisualMetadata {
  scale: number;
  position: string;
  rotation?: number; 
  blur?: string; 
  opacity?: number;
  zIndex?: number;
}

export interface Benefit {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  visualMetadata?: VisualMetadata;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  avatar: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface ProductVariant {
  id: string;
  label: string;
  value: string;
  type: 'color' | 'size' | 'material' | 'other';
}

export interface DetailItem {
  id: string;
  label: string;
  description: string;
  imageUrl: string;
  visualMetadata?: VisualMetadata;
}

export interface LandingPageContent {
  strategyInsights: {
    marketAnalysis: string;
    conversionLogic: string;
    atmosphere: {
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
      mood: string;
    };
  };
  hero: {
    headline: string;
    subheadline: string;
    cta: string;
    ctaLink?: string;
    imageUrl: string;
    visualMetadata?: VisualMetadata;
  };
  problem: {
    title: string;
    pains: string[];
    imageUrl: string; 
  };
  solution: {
    title: string;
    explanation: string;
    imageUrl: string; 
  };
  variants: {
    title: string;
    items: ProductVariant[];
  };
  notes?: {
    title: string;
    content: string;
  };
  usage: {
    title: string;
    description: string;
    lifestyleContext: string;
    imageUrl: string;
    visualMetadata?: VisualMetadata;
  };
  visualBenefits: {
    title: string;
    items: Benefit[];
  };
  productDetails: {
    title: string;
    items: DetailItem[];
  };
  socialProof: {
    title: string;
    reviews: Review[];
    verification: string;
  };
  faqs: {
    title: string;
    items: FAQItem[];
  };
  offer: {
    price: string;
    oldPrice: string;
    urgency: string;
    cta: string;
    ctaLink?: string;
    guarantees: string[];
    imageUrl: string;
    visualMetadata?: VisualMetadata;
  };
  sources?: Array<{ title?: string; uri?: string }>;
}

export type ResearchStep = 'idle' | 'analyzing' | 'researching' | 'designing' | 'completed';
