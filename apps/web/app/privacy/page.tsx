"use client";

import Link from "next/link";
import { useSaloraLocale } from "@/components/SaloraLocaleProvider";

export default function PrivacyPage() {
  const { isArabic } = useSaloraLocale();

  return (
    <main id="main-content" className="min-h-screen bg-[var(--background)] px-5 py-16 text-[var(--foreground)] sm:px-8">
      <article className="mx-auto max-w-3xl rounded-[var(--radius-modal)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-raised)] sm:p-10">
        <p className="text-sm font-semibold text-[var(--brand-hover)]">SALORA.CAFE</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{isArabic ? "الخصوصية والتحليلات" : "Privacy and analytics"}</h1>
        <p className="mt-5 leading-8 text-[var(--foreground-muted)]">
          {isArabic
            ? "التحليلات غير مفعّلة افتراضيًا. عند إيقافها لا يرسل الموقع أحداث استخدام ولا يخزنها، ولا يجمع عنوان IP أو معلومات المتصفح لهذا الغرض."
            : "Analytics are disabled by default. While disabled, the site sends and stores no usage events, and it does not collect IP addresses or browser details for analytics."}
        </p>
        <p className="mt-4 leading-8 text-[var(--foreground-muted)]">
          {isArabic
            ? "لن تُفعّل التحليلات قبل اعتماد الغرض والأساس القانوني ومدة الاحتفاظ وخيارات الموافقة. ستُنشر أي تغييرات جوهرية في هذه الصفحة قبل تفعيلها."
            : "Analytics will not be enabled until purpose, legal basis, retention and consent choices are approved. Material changes will be published here before activation."}
        </p>
        <Link className="mt-8 inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-[var(--brand)] px-5 font-semibold text-[var(--brand-foreground)]" href="/">
          {isArabic ? "العودة إلى سالورا" : "Back to SALORA"}
        </Link>
      </article>
    </main>
  );
}
