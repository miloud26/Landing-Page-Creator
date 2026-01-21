
import { Review, Benefit, DetailItem } from './types';

export const HERO_TEXT = {
  title: "وداعاً لآلام الظهر والرقبة أثناء القيادة إلى الأبد!",
  subtitle: "استمتع براحة فائقة ودعم مثالي لعمودك الفقري مع مسند أرمادا الفاخر المصمم خصيصاً للرحلات الطويلة.",
  cta: "اطلب الآن - خصم لفترة محدودة"
};

// Fixed: Replaced 'imageIndex' with 'imageUrl' to align with the Benefit interface in types.ts
export const BENEFITS: Benefit[] = [
  {
    id: '1',
    title: "رغوة الذاكرة عالية الكثافة",
    description: "تتكيف تماماً مع شكل جسمك لامتصاص الصدمات وتخفيف الضغط عن الفقرات.",
    imageUrl: "https://picsum.photos/seed/benefit1/400/500"
  },
  {
    id: '2',
    title: "تصميم مريح (Ergonomic)",
    description: "يدعم المنحنى الطبيعي للرقبة وأسفل الظهر لتقليل التعب والإجهاد العضلي.",
    imageUrl: "https://picsum.photos/seed/benefit2/400/500"
  },
  {
    id: '3',
    title: "نسيج مسامي مضاد للتعرق",
    description: "يسمح بمرور الهواء للحفاظ على برودة الظهر والرقبة حتى في أطول الرحلات.",
    imageUrl: "https://picsum.photos/seed/benefit3/400/500"
  }
];

// Fixed: Replaced 'imageIndex' with 'imageUrl' to align with the DetailItem interface in types.ts
export const PRODUCT_DETAILS: DetailItem[] = [
  {
    id: '1',
    label: "حزام تثبيت قابل للتعديل ليناسب جميع مقاعد السيارات",
    description: "نظام تثبيت مرن وسهل الاستخدام",
    imageUrl: "https://picsum.photos/seed/detail1/400/400"
  },
  {
    id: '2',
    label: "غطاء خارجي فاخر قابل للإزالة والغسل بسهولة",
    description: "نظافة دائمة وراحة متواصلة",
    imageUrl: "https://picsum.photos/seed/detail2/400/400"
  }
];

export const REVIEWS: Review[] = [
  {
    id: '1',
    name: "أحمد منصور",
    rating: 5,
    comment: "كنت أعاني من آلام شديدة بعد العمل. مسند أرمادا غير تجربتي تماماً، أنصح به بشدة لكل سائق.",
    avatar: "https://picsum.photos/seed/user1/100/100"
  },
  {
    id: '2',
    name: "سارة الجاسم",
    rating: 5,
    comment: "جودة الخامة ممتازة والتوصيل كان سريعاً جداً. مريح جداً للرقبة.",
    avatar: "https://picsum.photos/seed/user2/100/100"
  }
];

export const OFFER = {
  price: "299 ر.س",
  oldPrice: "450 ر.س",
  urgency: "متبقي 7 قطع فقط في المخزون!",
  guarantee: "ضمان استرجاع لمدة 14 يوم - الدفع عند الاستلام"
};
