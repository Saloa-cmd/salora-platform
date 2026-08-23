export type LoginLocale = "ar" | "en";

const loginErrorMessages = {
  invalidPayload: {
    ar: "تحقق من صيغة البريد الإلكتروني وكلمة المرور.",
    en: "Check the email address and password format."
  },
  invalidCredentials: {
    ar: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    en: "The email or password is incorrect."
  },
  rateLimited: {
    ar: "محاولات دخول كثيرة. انتظر قليلًا ثم أعد المحاولة.",
    en: "Too many sign-in attempts. Wait briefly, then try again."
  },
  unavailable: {
    ar: "خدمة تسجيل الدخول غير متاحة مؤقتًا، لذلك لم يتم التحقق من بياناتك. حاول بعد قليل.",
    en: "Sign-in is temporarily unavailable, so your credentials were not checked. Try again shortly."
  },
  unexpected: {
    ar: "تعذر إكمال تسجيل الدخول. حاول مجددًا بعد قليل.",
    en: "Sign-in could not be completed. Try again shortly."
  }
} as const;

export function loginErrorMessage(status: number, locale: LoginLocale): string {
  if (status === 400) return loginErrorMessages.invalidPayload[locale];
  if (status === 401) return loginErrorMessages.invalidCredentials[locale];
  if (status === 429) return loginErrorMessages.rateLimited[locale];
  if (status === 503) return loginErrorMessages.unavailable[locale];
  return loginErrorMessages.unexpected[locale];
}
