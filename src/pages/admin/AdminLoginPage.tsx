import React, { useState, useEffect } from 'react';
import { Shield, KeyRound, User, ArrowRight, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLoginPageProps {
  onLoginSuccess?: () => void;
  onSuccess?: () => void;
  onBackToCatalog?: () => void;
  onBackToPublic?: () => void;
}

const STORAGE_KEY_USER = 'cloeast_admin_saved_username';
const STORAGE_KEY_PASS = 'cloeast_admin_saved_password';
const STORAGE_KEY_REMEMBER = 'cloeast_admin_remember_me';

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onSuccess,
  onBackToCatalog,
  onBackToPublic,
}) => {
  const handleSuccess = () => (onLoginSuccess || onSuccess)?.();
  const handleBack = () => (onBackToCatalog || onBackToPublic)?.();

  const { login } = useAuth();
  const [identifier, setIdentifier] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_USER) || 'cloeastbatim';
  });
  const [password, setPassword] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_PASS) || '';
  });
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_REMEMBER) !== 'false';
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync to localStorage if rememberMe is enabled
  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEY_USER);
    const savedPass = localStorage.getItem(STORAGE_KEY_PASS);
    if (savedUser) setIdentifier(savedUser);
    if (savedPass) setPassword(savedPass);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Harap masukkan username dan kata sandi.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const result = await login(identifier, password);
    setIsLoading(false);

    if (result.success) {
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEY_USER, identifier.trim());
        localStorage.setItem(STORAGE_KEY_PASS, password);
        localStorage.setItem(STORAGE_KEY_REMEMBER, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEY_USER);
        localStorage.removeItem(STORAGE_KEY_PASS);
        localStorage.setItem(STORAGE_KEY_REMEMBER, 'false');
      }
      handleSuccess();
    } else {
      setErrorMessage(result.error || 'Autentikasi gagal.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F3EE] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <button
            onClick={handleBack}
            className="text-2xl font-bold tracking-widest text-[#151515] uppercase font-heading hover:opacity-80 transition-opacity"
          >
            CLO.EAST
          </button>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Shield className="w-4 h-4 text-[#6D6D68]" />
            <p className="text-xs uppercase tracking-widest text-[#6D6D68] font-medium">
              Administrator Portal
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-3xl p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#151515] tracking-tight">
              Masuk ke Dashboard
            </h2>
            <p className="text-xs text-[#6D6D68] mt-1">
              Gunakan akun administrator terverifikasi untuk mengelola katalog dan stok.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#151515] mb-1.5">
                Username / Email Admin
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#6D6D68] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Username admin"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F3F3EE] border border-[#DCDCD5] focus:border-[#151515] focus:bg-white rounded-xl text-sm text-[#151515] focus:outline-hidden transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#151515] mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#6D6D68] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F3F3EE] border border-[#DCDCD5] focus:border-[#151515] focus:bg-white rounded-xl text-sm text-[#151515] focus:outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md border-[#DCDCD5] text-[#151515] focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-[#6D6D68] hover:text-[#151515] transition-colors">
                  Ingat login di browser ini (Cache)
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3 bg-[#151515] text-[#F8F8F4] hover:bg-[#2A2A2A] rounded-xl text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk Administrator</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <button
            onClick={handleBack}
            className="text-xs text-[#6D6D68] hover:text-[#151515] transition-colors"
          >
            &larr; Kembali ke Katalog Publik
          </button>
        </div>
      </div>
    </div>
  );
};
