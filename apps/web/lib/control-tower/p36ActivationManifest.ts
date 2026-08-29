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
  imageBytes: number;
};

/**
 * Owner-approved P36 input manifest.
 *
 * This is review evidence for the Preview workflow, not a catalog runtime
 * fallback and not permission to mutate Production. Product IDs and the final
 * storage records must be resolved server-side before ACTIVATE117.
 */
export const p36ActivationCandidates: P36ActivationCandidate[] = [
  { slug: "bahr", nameAr: "بحر", nameEn: "Bahr", categoryAr: "الكوكتيلات الباردة", approvedPrice: 1.7, imagePath: "/products/p36-media-candidates/bahr.webp", imageSha256: "521081801771e6c3ecdb8b00778809b982e7292ba4bd26a7ef27832a9f32a555", altAr: "مشروب بحر الأزرق البارد بخلفية سالورا الداكنة", altEn: "Bahr blue cold drink on SALORA's dark backdrop", imageBytes: 75842 },
  { slug: "brazilian-lemonade", nameAr: "ليمونادة برازيلية", nameEn: "Brazilian Lemonade", categoryAr: "الكوكتيلات الباردة", approvedPrice: 1.4, imagePath: "/products/p36-media-candidates/brazilian-lemonade.webp", imageSha256: "a232c4e3a48bf062f5386b41618220675c462fa964afbe9e7ba0a53ba5c7be38", altAr: "ليمونادة برازيلية كريمية بالليمون الأخضر", altEn: "Creamy Brazilian lemonade with fresh lime", imageBytes: 54394 },
  { slug: "khayal", nameAr: "خيال", nameEn: "Khayal", categoryAr: "الكوكتيلات الباردة", approvedPrice: 1.8, imagePath: "/products/p36-media-candidates/khayal-v2.webp", imageSha256: "2a6500a3e68783fa137f605305ed90d33f71b6121dbfc1b995936559f4c4b906", altAr: "مشروب خيال بارد بتدرج بنفسجي وعنابي محايد", altEn: "Khayal cold drink with a neutral violet and ruby gradient", imageBytes: 33350 },
  { slug: "pina-colada", nameAr: "بينا كولادا", nameEn: "Piña Colada", categoryAr: "الكوكتيلات الباردة", approvedPrice: 1.7, imagePath: "/products/p36-media-candidates/pina-colada.webp", imageSha256: "a6cad05e0eac60dae6aea8ef55f0664698a9d9f4da051538371b2bcf05ab8020", altAr: "بينا كولادا باردة بالأناناس وجوز الهند", altEn: "Cold piña colada with pineapple and coconut", imageBytes: 48852 },
  { slug: "awar-qalb", nameAr: "عوار قلب", nameEn: "Awar Qalb", categoryAr: "الميلك شيك", approvedPrice: 1.9, imagePath: "/products/p36-media-candidates/awar-qalb-v2.webp", imageSha256: "84d1b36478c6487592eea83dbd68fe0df1160c5048dc87e5638d1a1107774f36", altAr: "مخفوق عوار قلب بطبقات حمراء وذهبية وكريمية محايدة", altEn: "Awar Qalb shake with neutral red, gold and cream layers", imageBytes: 46406 },
  { slug: "strawberry-milkshake", nameAr: "ميلك شيك فراولة", nameEn: "Strawberry Milkshake", categoryAr: "الميلك شيك", approvedPrice: 1.6, imagePath: "/products/p36-media-candidates/strawberry-milkshake.webp", imageSha256: "7f54ed72d9b9c313d5400716bd6c39abc4cd52fa11b415aa3d3109643444d880", altAr: "ميلك شيك فراولة كريمي", altEn: "Creamy strawberry milkshake", imageBytes: 58944 },
  { slug: "berry-detox", nameAr: "ديتوكس التوت بالستيفيا", nameEn: "Berry Detox with Stevia", categoryAr: "قائمة الصحة", approvedPrice: 1.6, imagePath: "/products/p36-media-candidates/berry-detox.webp", imageSha256: "d78ce65dc878d609bc29975503c47d317a494e754f766127eb2e6100e7889abd", altAr: "مشروب ديتوكس التوت البارد المحلى بالستيفيا", altEn: "Cold berry detox drink sweetened with stevia", imageBytes: 74396 },
  { slug: "protein-shake", nameAr: "مخفوق البروتين", nameEn: "Protein Shake", categoryAr: "قائمة الصحة", approvedPrice: 2, imagePath: "/products/p36-media-candidates/protein-shake-v2.webp", imageSha256: "4c26bb78b2fa3755a04516c1d7ef0c6818306b7ccfb20d0f8e61fb76c03adced", altAr: "مخفوق بروتين كريمي محايد دون زينة", altEn: "Neutral creamy protein shake without garnish", imageBytes: 77840 },
  { slug: "peanut-butter-latte", nameAr: "لاتيه زبدة الفول السوداني", nameEn: "Peanut Butter Latte", categoryAr: "قهوة سالورا المميزة", approvedPrice: 1.7, imagePath: "/products/p36-media-candidates/peanut-butter-latte.webp", imageSha256: "66794573da8fe32af8fc973f65d3a658f70b9558f2b8808525ee78cd554a68e8", altAr: "لاتيه زبدة الفول السوداني البارد", altEn: "Cold peanut butter latte", imageBytes: 55910 },
  { slug: "pistachio-espresso", nameAr: "إسبريسو فستق", nameEn: "Pistachio Espresso", categoryAr: "قهوة سالورا المميزة", approvedPrice: 1.4, imagePath: "/products/p36-media-candidates/pistachio-espresso.webp", imageSha256: "d49d1312ef9a055e4070fb3149356d0a6bf4ea4cd83dbc03f4944787d2fa3065", altAr: "إسبريسو فستق بطبقة كريمية", altEn: "Pistachio espresso with a creamy layer", imageBytes: 53740 },
  { slug: "pistachio-spanish-latte", nameAr: "سبانش فستق", nameEn: "Pistachio Spanish Latte", categoryAr: "قهوة سالورا المميزة", approvedPrice: 1.8, imagePath: "/products/p36-media-candidates/pistachio-spanish-latte.webp", imageSha256: "fa4d6a3d7d400d5486ced694c5ecba10927d8883e3ab6c8eb6b89ccd4332608e", altAr: "سبانش لاتيه فستق بارد", altEn: "Cold pistachio Spanish latte", imageBytes: 63722 },
  { slug: "salora-cappuccino", nameAr: "كابتشينو سالورا", nameEn: "SALORA Cappuccino", categoryAr: "قهوة سالورا المميزة", approvedPrice: 1.5, imagePath: "/products/p36-media-candidates/salora-cappuccino.webp", imageSha256: "59b541e02b2f0b027f24752d216b303f8f24240089b21d5b99261244aeeaac0c", altAr: "كابتشينو سالورا بفن لاتيه", altEn: "SALORA cappuccino with latte art", imageBytes: 82296 },
  { slug: "salora-latte", nameAr: "لاتيه سالورا ساخن أو بارد", nameEn: "SALORA Latte — Hot or Iced", categoryAr: "قهوة سالورا المميزة", approvedPrice: 1.6, imagePath: "/products/p36-media-candidates/salora-latte.webp", imageSha256: "a4cef9cc7151dafc27acb4d64340df76f80da403155f986a0ddbb9db31155115", altAr: "لاتيه سالورا المميز فوق الثلج", altEn: "SALORA signature latte over ice", imageBytes: 44450 }
];

/** Read-only Product ID evidence resolved from the certified Production catalog on 2026-08-29. */
export const p36CandidateProductIds: Record<string, string> = {
  "awar-qalb": "244d1e2f-e205-4e80-97d1-a9c7cae43c9e",
  "bahr": "52ea6a0e-052b-42ea-b598-81ea4ed1c16b",
  "berry-detox": "a0a8ec9f-55f7-4b11-b05b-f00076c41921",
  "brazilian-lemonade": "78919560-e222-4ec0-9801-c9b32d8aef63",
  "khayal": "5faa2fa5-1f9f-4bef-8ead-d9f5d92f4092",
  "peanut-butter-latte": "2b97a184-2acb-477f-8c31-515d1a38af21",
  "pina-colada": "b8a35cd6-9d0e-494a-9a20-4de2c9cd9adb",
  "pistachio-espresso": "cf94df9a-fc48-4b39-936c-da1dd283e3bb",
  "pistachio-spanish-latte": "8cec6284-d407-4532-8b23-e76ec2754d08",
  "protein-shake": "e5724212-63d3-4a6f-94d3-08c61b0367b9",
  "salora-cappuccino": "3a310521-70fa-4022-a586-44965829b61e",
  "salora-latte": "33f0c30c-4fa4-4414-9100-659855f59a2d",
  "strawberry-milkshake": "4ba0b509-a7b6-4301-a8d6-fbc90911c599"
};

export const p36PriceApproval = {
  source: "SALORA owner-approved 13-item pricing table",
  approvedAt: "2026-08-27",
  currency: "OMR",
  precision: 3,
  productionBaselinePrice: 0
} as const;

export const p36MediaSpecification = {
  status: "APPROVED",
  mimeType: "image/webp",
  width: 1200,
  height: 1200,
  aspectRatio: "1:1",
  colorSpace: "sRGB",
  productionPublished: false
} as const;

/** Owner approval evidence. This approves the reviewed bytes only; it is not Production write authority. */
export const p36MediaApproval = {
  token: "APPROVE13MEDIA",
  approvedAt: "2026-08-29T11:49:10Z",
  approvedBy: "SALORA Owner",
  source: "Owner approval in the P36 continuation conversation",
  approvedAssetCount: 13,
  productionUploadAuthorized: true,
  productionUploadApprovedAt: "2026-08-29T12:15:05Z",
  productionPublished: false
} as const;

export const p36ProductionDataPrepApproval = {
  token: "AUTHORIZE-P36-PRODUCTION-DATA-PREP",
  approvedAt: "2026-08-29T12:15:05Z",
  approvedBy: "SALORA Owner",
  source: "Owner approval in the P36 continuation conversation",
  scope: ["UPLOAD_APPROVED_MEDIA", "CREATE_PRODUCT_IMAGES", "APPLY_APPROVED_PRICES"],
  activationAuthorized: false,
  revisionPublishAuthorized: false
} as const;
