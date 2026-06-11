"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Coffee, AlertCircle, ChevronRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus email input on mount for accessibility
    emailInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include", // Important for HTTP-only cookies
        body: JSON.stringify({
          email: email.trim(),
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Show safe error message
        setError("Invalid email or password. Please try again.");
        return;
      }

      // Success - redirect to control tower
      // The HTTP-only cookie is automatically stored by the browser
      router.push("/control-tower");
      router.refresh();
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0a0805] to-[#050505] flex items-center justify-center px-4">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#C9A45C]/5 rounded-full blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-[#9CAF88]/5 rounded-full blur-3xl" aria-hidden="true" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex justify-center mb-4"
          >
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.03] border border-[#C9A45C]/15 backdrop-blur-xl">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C9A45C]/20">
                <Coffee className="h-4 w-4 text-[#C9A45C]" aria-hidden="true" />
              </div>
              <span className="text-sm font-semibold tracking-[0.24em] text-[#F5EFE3]">SALORA</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="text-3xl md:text-4xl font-semibold text-[#F5EFE3] mb-2 tracking-tight">
              Control Tower
            </h1>
            <p className="text-[#9C9387] text-sm">
              Sign in to your SALORA administrative dashboard
            </p>
          </motion.div>
        </div>

        {/* Login Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-5"
        >
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-red-950/30 border border-red-900/50 backdrop-blur-xl"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-red-200">{error}</p>
            </motion.div>
          )}

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-[#F5EFE3] mb-2">
              Email Address
            </label>
            <input
              ref={emailInputRef}
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="admin@salora.cafe"
              className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border border-[#C9A45C]/20 text-[#F5EFE3] placeholder-[#9C9387] focus:outline-none focus:border-[#C9A45C]/50 focus:ring-1 focus:ring-[#C9A45C]/30 disabled:opacity-50 transition"
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-[#F5EFE3] mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border border-[#C9A45C]/20 text-[#F5EFE3] placeholder-[#9C9387] focus:outline-none focus:border-[#C9A45C]/50 focus:ring-1 focus:ring-[#C9A45C]/30 disabled:opacity-50 transition"
            />
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-6 px-4 py-3 rounded-lg font-semibold text-black bg-gradient-to-r from-[#C9A45C] to-[#E7D3A1] hover:shadow-[0_0_80px_rgba(201,164,92,0.16)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-4 w-4 border-2 border-black border-t-transparent rounded-full"
                />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </motion.button>
        </motion.form>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 pt-6 border-t border-[#C9A45C]/10 text-center text-xs text-[#9C9387]"
        >
          <p>SALORA Admin Access • Secure Authentication</p>
        </motion.div>
      </motion.div>

      {/* Skip to main link for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only">
        Skip to main content
      </a>
    </main>
  );
}
