export type P36ActivationCandidate = {
  slug: string;
  nameAr: string;
  nameEn: string;
  categoryAr: string;
  approvedPrice: number;
  imagePath: string;
  imageSha256: string;
  altAr: string;
  altEn: string;
};

/**
 * Owner-approved P36 input manifest.
 *
 * This is review evidence for the Preview workflow, not a catalog runtime
 * fallback and not permission to mutate Production. Product IDs and the final
 * storage records must be resolved server-side before ACTIVATE117.
 */
export const p36ActivationCandidates: P36ActivationCandidate[] = [
  { slug: "bahr", nameAr: "بحر", nameEn: "Bahr", categoryAr: "الكوكتيلات الباردة", approvedPrice: 1.7, imagePath: "/products/p36-media-candidates/bahr.webp", imageSha256: "521081801771e6c3ecdb8b00778809b982e7292ba4bd26a7ef27832a9f32a555", altAr: "مشروب بحر الأزرق البارد بخلفية سالورا الداكنة", altEn: "Bahr blue cold drink on SALORA's dark backdrop" },
  { slug: "brazilian-lemonade", nameAr: "ليمونادة برازيلية", nameEn: "Brazilian Lemonade", categoryAr: "الكوكتيلات الباردة", approvedPrice: 1.4, imagePath: "/products/p36-media-candidates/brazilian-lemonade.webp", imageSha256: "a232c4e3a48bf062f5386b41618220675c462fa964afbe9e7ba0a53ba5c7be38", altAr: "ليمونادة برازيلية كريمية بالليمون الأخضر", altEn: "Creamy Brazilian lemonade with fresh lime" },
  { slug: "khayal", nameAr: "خيال", nameEn: "Khayal", categoryAr: "الكوكتيلات الباردة", approvedPrice: 1.8, imagePath: "/products/p36-media-candidates/khayal.webp", imageSha256: "1d175dad00a2a739281dd3b7d8385e407620ef03ab2ed51040c2cc360a5a6d77", altAr: "مشروب خيال البارد بطبقات التوت البنفسجية", altEn: "Khayal cold drink with purple berry layers" },
  { slug: "pina-colada", nameAr: "بينا كولادا", nameEn: "Piña Colada", categoryAr: "الكوكتيلات الباردة", approvedPrice: 1.7, imagePath: "/products/p36-media-candidates/pina-colada.webp", imageSha256: "a6cad05e0eac60dae6aea8ef55f0664698a9d9f4da051538371b2bcf05ab8020", altAr: "بينا كولادا باردة بالأناناس وجوز الهند", altEn: "Cold piña colada with pineapple and coconut" },
  { slug: "awar-qalb", nameAr: "عوار قلب", nameEn: "Awar Qalb", categoryAr: "الميلك شيك", approvedPrice: 1.9, imagePath: "/products/p36-media-candidates/awar-qalb.webp", imageSha256: "0192882374b795bd25a93e9035499cfffb3ea32c172d329bb4fe281fdc48281e", altAr: "مخفوق عوار قلب بطبقات الفاكهة الملونة", altEn: "Awar Qalb shake with colorful fruit layers" },
  { slug: "strawberry-milkshake", nameAr: "ميلك شيك فراولة", nameEn: "Strawberry Milkshake", categoryAr: "الميلك شيك", approvedPrice: 1.6, imagePath: "/products/p36-media-candidates/strawberry-milkshake.webp", imageSha256: "7f54ed72d9b9c313d5400716bd6c39abc4cd52fa11b415aa3d3109643444d880", altAr: "ميلك شيك فراولة كريمي", altEn: "Creamy strawberry milkshake" },
  { slug: "berry-detox", nameAr: "ديتوكس التوت بالستيفيا", nameEn: "Berry Detox with Stevia", categoryAr: "قائمة الصحة", approvedPrice: 1.6, imagePath: "/products/p36-media-candidates/berry-detox.webp", imageSha256: "d78ce65dc878d609bc29975503c47d317a494e754f766127eb2e6100e7889abd", altAr: "مشروب ديتوكس التوت البارد المحلى بالستيفيا", altEn: "Cold berry detox drink sweetened with stevia" },
  { slug: "protein-shake", nameAr: "مخفوق البروتين", nameEn: "Protein Shake", categoryAr: "قائمة الصحة", approvedPrice: 2, imagePath: "/products/p36-media-candidates/protein-shake.webp", imageSha256: "153490c1f7dea7409afe8cf174e4d20165c6f079afb94f5fc001dda50daee91c", altAr: "مخفوق بروتين كريمي", altEn: "Creamy protein shake" },
  { slug: "peanut-butter-latte", nameAr: "لاتيه زبدة الفول السوداني", nameEn: "Peanut Butter Latte", categoryAr: "قهوة سالورا المميزة", approvedPrice: 1.7, imagePath: "/products/p36-media-candidates/peanut-butter-latte.webp", imageSha256: "66794573da8fe32af8fc973f65d3a658f70b9558f2b8808525ee78cd554a68e8", altAr: "لاتيه زبدة الفول السوداني البارد", altEn: "Cold peanut butter latte" },
  { slug: "pistachio-espresso", nameAr: "إسبريسو فستق", nameEn: "Pistachio Espresso", categoryAr: "قهوة سالورا المميزة", approvedPrice: 1.4, imagePath: "/products/p36-media-candidates/pistachio-espresso.webp", imageSha256: "d49d1312ef9a055e4070fb3149356d0a6bf4ea4cd83dbc03f4944787d2fa3065", altAr: "إسبريسو فستق بطبقة كريمية", altEn: "Pistachio espresso with a creamy layer" },
  { slug: "pistachio-spanish-latte", nameAr: "سبانش فستق", nameEn: "Pistachio Spanish Latte", categoryAr: "قهوة سالورا المميزة", approvedPrice: 1.8, imagePath: "/products/p36-media-candidates/pistachio-spanish-latte.webp", imageSha256: "fa4d6a3d7d400d5486ced694c5ecba10927d8883e3ab6c8eb6b89ccd4332608e", altAr: "سبانش لاتيه فستق بارد", altEn: "Cold pistachio Spanish latte" },
  { slug: "salora-cappuccino", nameAr: "كابتشينو سالورا", nameEn: "SALORA Cappuccino", categoryAr: "قهوة سالورا المميزة", approvedPrice: 1.5, imagePath: "/products/p36-media-candidates/salora-cappuccino.webp", imageSha256: "59b541e02b2f0b027f24752d216b303f8f24240089b21d5b99261244aeeaac0c", altAr: "كابتشينو سالورا بفن لاتيه", altEn: "SALORA cappuccino with latte art" },
  { slug: "salora-latte", nameAr: "لاتيه سالورا ساخن أو بارد", nameEn: "SALORA Latte — Hot or Iced", categoryAr: "قهوة سالورا المميزة", approvedPrice: 1.6, imagePath: "/products/p36-media-candidates/salora-latte.webp", imageSha256: "a4cef9cc7151dafc27acb4d64340df76f80da403155f986a0ddbb9db31155115", altAr: "لاتيه سالورا المميز فوق الثلج", altEn: "SALORA signature latte over ice" }
];

/** Read-only ID evidence resolved from the connected Supabase project on 2026-08-29. */
export const p36CandidateProductIds: Record<string, string> = {
  "awar-qalb": "40618f76-dfb7-4576-9386-f973346b6a92",
  "bahr": "7f4ee000-59a1-4ceb-bf6a-d9a9af16b872",
  "berry-detox": "fd8c0d89-8c93-456a-a365-d7b71f481f27",
  "brazilian-lemonade": "0d762997-9d23-4866-bd50-98d8db053906",
  "khayal": "210bd34b-d3a2-4bc2-8ea5-0d83c046a708",
  "peanut-butter-latte": "953cf1e6-b4af-4941-8bb4-b4773b4762cf",
  "pina-colada": "d44d75c4-8105-409d-b2c9-165479b7b488",
  "pistachio-espresso": "a275370f-c02c-4b71-8511-5588ddefc905",
  "pistachio-spanish-latte": "87ccb75e-8b97-4b77-9ee1-9e67adcb9f91",
  "protein-shake": "33236a03-f900-4026-b388-526e2339de7e",
  "salora-cappuccino": "a8ede0f9-e0f4-484d-b1d4-8d795e88d0e6",
  "salora-latte": "26dcae32-7fc1-4874-a6fd-d57e1fcaabed",
  "strawberry-milkshake": "c6d14269-e3b6-482a-a38c-8f52569f4e60"
};

export const p36PriceApproval = {
  source: "SALORA owner message",
  approvedAt: "2026-08-29",
  currency: "OMR",
  precision: 3,
  productionBaselinePrice: 0
} as const;
