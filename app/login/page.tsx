"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { 
  Shield, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  Sun, 
  Moon, 
  Globe, 
  ShieldCheck, 
  UserPlus, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import Logo from '@/components/Logo';

type AuthTab = 'login' | 'request' | 'forgot';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Extra tabs form state
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<'ES' | 'EN'>('EN'); // Por defecto en Inglés

  React.useEffect(() => {
    const savedLang = localStorage.getItem('app_lang');
    if (savedLang === 'es') {
      setLanguage('ES');
    } else {
      setLanguage('EN');
    }

    // Leer tema global unificado de la página principal
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        setSuccessMsg(language === 'ES' ? '¡Sesión iniciada con éxito! Redirigiendo...' : 'Login successful! Redirecting...');
        
        // Consultar el rol del perfil
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        const role = profile?.role;
        setTimeout(() => {
          if (role === 'super_admin') {
            router.push('/admin');
          } else if (role === 'company_admin') {
            router.push('/empresa');
          } else if (role === 'creator') {
            router.push('/creador');
          } else {
            router.push('/simulador');
          }
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || (language === 'ES' ? 'Error al iniciar sesión. Revisa tus credenciales.' : 'Login failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    setTimeout(() => {
      setLoading(false);
      setSuccessMsg(
        language === 'ES' 
          ? 'Solicitud enviada correctamente. Un administrador revisará tu solicitud.' 
          : 'Access request sent successfully. An admin will review your account.'
      );
      setEmail('');
      setFullName('');
      setCompanyName('');
    }, 1000);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      setSuccessMsg(
        language === 'ES' 
          ? 'Enlace de recuperación enviado a tu correo electrónico.' 
          : 'Password reset link sent to your email.'
      );
    } catch (err: any) {
      setErrorMsg(err.message || (language === 'ES' ? 'Error al enviar el correo de recuperación.' : 'Failed to send recovery email.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center p-4 transition-colors duration-300 relative ${
      darkMode 
        ? 'bg-[#0b0f19] text-slate-100' 
        : 'bg-[#ecf0f1] text-slate-900'
    }`}>

      {/* Floating Top-Left "Back to Main Page" Button */}
      <Link 
        href="/"
        className={`absolute top-6 left-6 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold shadow-md transition-all ${
          darkMode
            ? 'bg-[#131926] border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            : 'bg-white border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300'
        }`}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{language === 'ES' ? 'Volver al Inicio' : 'Back to Home'}</span>
      </Link>

      {/* Floating Centered Card */}
      <div className={`w-full max-w-md rounded-2xl p-8 sm:p-10 shadow-xl transition-all duration-300 border ${
        darkMode 
          ? 'bg-[#131926] border-slate-800/80 shadow-slate-950/50' 
          : 'bg-white border-slate-200/80'
      }`}>
        
        {/* Header Section with Clickable Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <Link href="/" className="mb-3 hover:opacity-90 transition-opacity" title={language === 'ES' ? 'Volver a la página principal' : 'Back to main page'}>
            <Logo size="lg" isDark={darkMode} />
          </Link>
          <p className={`text-xs font-semibold mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Training Platform
          </p>
        </div>

        {/* Tab Selection */}
        <div className={`grid grid-cols-3 gap-1 p-1 mb-6 rounded-xl text-xs font-bold transition-colors ${
          darkMode ? 'bg-[#0f1420] text-slate-400' : 'bg-slate-100 text-slate-500'
        }`}>
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2 rounded-lg transition-all ${
              activeTab === 'login' 
                ? darkMode 
                  ? 'bg-[#1e2638] text-blue-400 shadow-sm' 
                  : 'bg-white text-blue-600 shadow-sm' 
                : darkMode 
                  ? 'hover:text-slate-200' 
                  : 'hover:text-slate-800'
            }`}
          >
            {language === 'ES' ? 'Ingreso' : 'Login'}
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('request'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2 rounded-lg transition-all ${
              activeTab === 'request' 
                ? darkMode 
                  ? 'bg-[#1e2638] text-blue-400 shadow-sm' 
                  : 'bg-white text-blue-600 shadow-sm' 
                : darkMode 
                  ? 'hover:text-slate-200' 
                  : 'hover:text-slate-800'
            }`}
          >
            {language === 'ES' ? 'Solicitar' : 'Request'}
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('forgot'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2 rounded-lg transition-all ${
              activeTab === 'forgot' 
                ? darkMode 
                  ? 'bg-[#1e2638] text-blue-400 shadow-sm' 
                  : 'bg-white text-blue-600 shadow-sm' 
                : darkMode 
                  ? 'hover:text-slate-200' 
                  : 'hover:text-slate-800'
            }`}
          >
            {language === 'ES' ? 'Recuperar' : 'Forgot'}
          </button>
        </div>

        {/* Toast / Alert Feedback Messages */}
        {errorMsg && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs font-semibold text-red-600 dark:text-red-400 mb-6 flex items-start gap-2.5 shadow-sm">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-6 flex items-start gap-2.5 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: LOGIN FORM */}
        {activeTab === 'login' && (
          <form className="space-y-4" onSubmit={handleLogin}>
            
            {/* Email Input */}
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {language === 'ES' ? 'Correo Electrónico' : 'Email Address'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  className="block w-full rounded-xl pl-10 pr-4 py-3 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label htmlFor="password" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {language === 'ES' ? 'Contraseña' : 'Password'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full rounded-xl pl-10 pr-11 py-3 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Options Row */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" 
                />
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                  {language === 'ES' ? 'Recordarme 30 días' : 'Remember me for 30 days'}
                </span>
              </label>
              
              <button
                type="button"
                onClick={() => setActiveTab('forgot')}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {language === 'ES' ? '¿Olvidaste contraseña?' : 'Forgot password?'}
              </button>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold text-sm py-3.5 shadow-lg shadow-blue-500/25 transition duration-200 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span>{language === 'ES' ? 'Ingresando...' : 'Logging in...'}</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{language === 'ES' ? 'Iniciar Sesión' : 'Login'}</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: REQUEST ACCESS FORM */}
        {activeTab === 'request' && (
          <form className="space-y-4" onSubmit={handleRequestAccess}>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'ES' ? 'Nombre Completo' : 'Full Name'}
              </label>
              <input
                type="text"
                required
                className="block w-full rounded-xl px-4 py-3 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Carlos Mendoza"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'ES' ? 'Correo Corporativo' : 'Work Email'}
              </label>
              <input
                type="email"
                required
                className="block w-full rounded-xl px-4 py-3 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="carlos@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'ES' ? 'Empresa / Organización' : 'Company / Organization'}
              </label>
              <input
                type="text"
                required
                className="block w-full rounded-xl px-4 py-3 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="AccessTech Solutions"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold text-sm py-3.5 shadow-lg shadow-blue-500/25 transition duration-200 disabled:opacity-50 mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{language === 'ES' ? 'Enviar Solicitud' : 'Submit Access Request'}</span>
            </button>
          </form>
        )}

        {/* TAB 3: FORGOT PASSWORD FORM */}
        {activeTab === 'forgot' && (
          <form className="space-y-4" onSubmit={handleForgotPassword}>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'ES' 
                ? 'Ingresa tu correo registrado y te enviaremos las instrucciones para restablecer tu contraseña.' 
                : 'Enter your registered email and we will send instructions to reset your password.'
              }
            </p>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'ES' ? 'Correo Electrónico' : 'Email Address'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  className="block w-full rounded-xl pl-10 pr-4 py-3 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold text-sm py-3.5 shadow-lg shadow-blue-500/25 transition duration-200 disabled:opacity-50 mt-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{language === 'ES' ? 'Enviar Enlace' : 'Send Reset Link'}</span>
            </button>
          </form>
        )}

        {/* Footer Links & SSL Badge */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/80 text-center space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'ES' ? '¿No tienes acceso todavía?' : "Don't have access?"}{' '}
            <button 
              type="button"
              onClick={() => setActiveTab('request')}
              className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {language === 'ES' ? 'Solicita tu cuenta' : 'Request access'}
            </button>
          </p>

          <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure system with SSL encryption</span>
          </div>
        </div>

      </div>

    </div>
  );
}
