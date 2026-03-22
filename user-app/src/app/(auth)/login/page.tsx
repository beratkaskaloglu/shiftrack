"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const theme = useThemeStore((s) => s.theme);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const isDark = theme === "dark";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Kullanıcı adı ve şifre gereklidir.");
      return;
    }

    try {
      await login({ username: username.trim(), password });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş başarısız. Lütfen tekrar deneyin.");
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-between px-6 py-10 ${
        isDark ? "bg-[#333333]" : "bg-white"
      }`}
    >
      {/* Top spacer */}
      <div />

      {/* Main content */}
      <div className="w-full max-w-sm flex flex-col items-center gap-10">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-[#007FE2] rounded-2xl flex items-center justify-center shadow-lg">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M8 8h16v3H8V8zm0 6.5h10v3H8v-3zm0 6.5h13v3H8v-3z"
                fill="white"
              />
            </svg>
          </div>
          <h1
            className="text-3xl font-bold text-[#007FE2] tracking-tight font-nunito"
          >
            ShiftTrack
          </h1>
          <p className={`text-sm font-light ${isDark ? "text-[#CCCCCC]" : "text-[#808080]"}`}>
            Arvato Workforce Tracking
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
          {/* Username */}
          <div className="flex flex-col gap-1">
            <div
              className={`flex items-center gap-3 border-b-2 pb-2 transition-colors ${
                isDark ? "border-[#808080]" : "border-[#CCCCCC]"
              } focus-within:border-[#007FE2]`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="text-[#808080] flex-shrink-0"
              >
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kullanıcı Adı"
                autoCapitalize="none"
                autoComplete="username"
                className={`flex-1 bg-transparent outline-none text-base font-normal placeholder:text-[#808080] ${
                  isDark ? "text-white" : "text-[#333333]"
                }`}
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <div
              className={`flex items-center gap-3 border-b-2 pb-2 transition-colors ${
                isDark ? "border-[#808080]" : "border-[#CCCCCC]"
              } focus-within:border-[#007FE2]`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="text-[#808080] flex-shrink-0"
              >
                <rect
                  x="5"
                  y="11"
                  width="14"
                  height="10"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M8 11V7a4 4 0 018 0v4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="16" r="1.5" fill="currentColor" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifre"
                autoComplete="current-password"
                className={`flex-1 bg-transparent outline-none text-base font-normal placeholder:text-[#808080] ${
                  isDark ? "text-white" : "text-[#333333]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-[#808080] hover:text-[#007FE2] transition-colors p-1"
                aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path
                      d="M10.5 10.677A3 3 0 0113.322 13.5M6.362 6.368C4.865 7.485 3.679 9.04 3 12c1.5 6 9 8 9 8s2.09-.523 4-1.998M9 5.4C9.94 5.145 10.96 5 12 5c5 0 8.5 4.5 9 7-.23 1.13-.7 2.23-1.36 3.18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 12c1.5-6 9-8 9-8s7.5 2 9 8c-1.5 6-9 8-9 8s-7.5-2-9-8z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div className="flex justify-end -mt-3">
            <button
              type="button"
              className="text-sm text-[#007FE2] font-semibold hover:underline"
            >
              Şifremi Unuttum
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-[#D11A4C]/10 border border-[#D11A4C]/30 rounded-lg px-4 py-3">
              <p className="text-[#D11A4C] text-sm font-normal">{error}</p>
            </div>
          )}

          {/* Login button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#007FE2] text-white font-bold text-base py-4 rounded-xl shadow-md active:opacity-80 disabled:opacity-60 transition-opacity mt-2"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="white"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="white"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Giriş yapılıyor...
              </span>
            ) : (
              "Giriş Yap"
            )}
          </button>
        </form>
      </div>

      {/* Version */}
      <p className={`text-xs font-light ${isDark ? "text-[#808080]" : "text-[#CCCCCC]"}`}>
        v1.0.0
      </p>
    </div>
  );
}
