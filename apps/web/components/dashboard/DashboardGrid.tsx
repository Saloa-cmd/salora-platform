import type { ReactNode } from "react";

type DashboardGridProps = {
  children: ReactNode;
  columns?: "metrics" | "two" | "three";
};

const columnClass = {
  metrics: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  two: "grid-cols-1 xl:grid-cols-2",
  three: "grid-cols-1 md:grid-cols-2 2xl:grid-cols-3"
};

export function DashboardGrid({ children, columns = "two" }: DashboardGridProps) {
  return <div className={`grid gap-4 ${columnClass[columns]}`}>{children}</div>;
}
