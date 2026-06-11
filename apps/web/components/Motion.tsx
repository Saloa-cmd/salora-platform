"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { PropsWithChildren } from "react";

interface FadeInProps extends PropsWithChildren {
  delay?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, className }: FadeInProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: reduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

export function HeroMotion({ children, className }: PropsWithChildren<{ className?: string }>) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98, y: 18 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
