import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode
} from "react";

export type SaloraButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type SaloraButtonSize = "small" | "medium" | "large";
export type SaloraStatusTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";
type LegacyTone = "neutral" | "gold" | "success" | "danger";

const legacyToneMap: Record<LegacyTone, SaloraButtonVariant> = {
  neutral: "secondary",
  gold: "primary",
  success: "outline",
  danger: "destructive"
};

type SaloraButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: SaloraButtonVariant;
  tone?: LegacyTone;
  size?: SaloraButtonSize;
  loading?: boolean;
};

export function SaloraButton({
  className = "",
  variant,
  tone,
  size = "medium",
  loading = false,
  children,
  disabled,
  ...props
}: SaloraButtonProps) {
  const resolvedVariant = variant ?? (tone ? legacyToneMap[tone] : "secondary");

  return (
    <button
      {...props}
      className={`salora-button ${className}`}
      data-size={size}
      data-variant={resolvedVariant}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
    >
      {loading ? <span aria-hidden="true" className="salora-button__spinner" /> : null}
      <span>{children}</span>
    </button>
  );
}

export function SaloraIconButton({
  label,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      aria-label={label}
      title={props.title ?? label}
      className={`salora-icon-button ${className}`}
    >
      {children}
    </button>
  );
}

export function SaloraBadge({
  className = "",
  tone = "neutral",
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: SaloraStatusTone | LegacyTone }) {
  const resolvedTone: SaloraStatusTone = tone === "gold" ? "brand" : tone;

  return (
    <span {...props} className={`salora-badge ${className}`} data-tone={resolvedTone}>
      {children}
    </span>
  );
}

export function SaloraSurface({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={`salora-surface ${className}`}>
      {children}
    </div>
  );
}

type SaloraFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  description?: string;
  error?: string;
};

export function SaloraField({
  id,
  label,
  description,
  error,
  required,
  className = "",
  ...props
}: SaloraFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="salora-field">
      <label htmlFor={id} className="salora-field__label">
        {label}
        {required ? <span aria-hidden="true" className="salora-field__required">*</span> : null}
      </label>
      {description ? <p id={descriptionId} className="salora-field__description">{description}</p> : null}
      <input
        {...props}
        id={id}
        required={required}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        className={`salora-field__control ${className}`}
      />
      {error ? <p id={errorId} role="alert" className="salora-field__error">{error}</p> : null}
    </div>
  );
}

export function SaloraAlert({
  title,
  children,
  tone = "info",
  className = ""
}: {
  title: string;
  children?: ReactNode;
  tone?: Exclude<SaloraStatusTone, "brand">;
  className?: string;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`salora-alert ${className}`}
      data-tone={tone}
    >
      <p className="salora-alert__title">{title}</p>
      {children ? <div className="salora-alert__body">{children}</div> : null}
    </div>
  );
}

export function SaloraSkeleton({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} aria-hidden="true" className={`salora-skeleton ${className}`} />;
}

export function SaloraEmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
}) {
  return (
    <SaloraSurface className="grid place-items-center px-6 py-12 text-center">
      <div className="max-w-md">
        {icon ? (
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-[var(--border-brand)] bg-[var(--brand)]/10 text-[var(--brand-hover)]">
            {icon}
          </div>
        ) : null}
        <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">{description}</p>
        {action || secondaryAction ? (
          <div className="mt-5 flex flex-wrap justify-center gap-3">{action}{secondaryAction}</div>
        ) : null}
      </div>
    </SaloraSurface>
  );
}

export function SaloraTableRegion({
  label,
  children,
  className = ""
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={`salora-table-region ${className}`}
    >
      {children}
    </div>
  );
}
