import React, { useState, useEffect } from 'react';
import { Lock, Mail, ArrowRight, Eye, EyeOff, Fingerprint, ShieldCheck, Globe, Sun, Moon, ArrowLeft, Send, CheckCircle2, Check } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { needsPasswordChange, changePassword, validatePassword, resetPassword } from '../services/authService';

interface LoginPageProps {
  onLoginSuccess: (role: 'user' | 'admin', email: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  initialView?: 'login' | 'change-password' | 'forgot-password' | 'check-email';
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, isDarkMode, onToggleTheme, initialView }) => {
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStep, setAuthStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  // New States
  const [view, setView] = useState<'login' | 'change-password' | 'forgot-password' | 'check-email'>(initialView || 'login');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const steps = [
    "Verifying Credentials",
    "Establishing Connection",
    "Loading Dashboard",
    "Access Granted"
  ];

  // Remember Me logic
  const [rememberMe, setRememberMe] = useState(localStorage.getItem('ie_remember_me') === 'true');

  useEffect(() => {
    if (initialView) setView(initialView);
    const savedEmail = localStorage.getItem('ie_saved_email');
    if (savedEmail && rememberMe) setEmail(savedEmail);
  }, [initialView, rememberMe]);

  useEffect(() => {
    if (isAuthenticating) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => onLoginSuccess(role, email), 300);
            return 100;
          }
          return prev + 2.5;
        });
      }, 30);

      const stepInterval = setInterval(() => {
        setAuthStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 500);

      return () => {
        clearInterval(interval);
        clearInterval(stepInterval);
      };
    }
  }, [isAuthenticating, role, email, onLoginSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAuthenticating(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        throw signInError;
      }
      if (data.user) {
        if (rememberMe) {
          localStorage.setItem('ie_remember_me', 'true');
          localStorage.setItem('ie_saved_email', email);
        } else {
          localStorage.removeItem('ie_remember_me');
          localStorage.removeItem('ie_saved_email');
        }

        const needsChange = await needsPasswordChange();
        if (needsChange) {
          setIsAuthenticating(false);
          setProgress(0);
          setAuthStep(0);
          setView('change-password');
          return;
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      let errorMessage = 'Invalid email or password';
      
      // Handle specific error cases
      if (err.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (err.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and confirm your account.';
      } else if (err.message?.includes('Too many requests')) {
        errorMessage = 'Too many login attempts. Please wait a moment and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      if (rememberMe) {
        localStorage.setItem('ie_remember_me', 'true');
        localStorage.setItem('ie_saved_email', email);
      } else {
        localStorage.removeItem('ie_remember_me');
        localStorage.removeItem('ie_saved_email');
      }

      setError(errorMessage);
      setIsAuthenticating(false);
      setProgress(0);
      setAuthStep(0);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    setIsProcessing(true);
    try {
      await changePassword(newPassword);
      
      // Wait for metadata to propagate
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsProcessing(false);

      // Update successful, log them in via animation
      setView('login');
      setIsAuthenticating(true);
    } catch (err: any) {
      console.error('Password change error:', err);
      setError(err.message || 'Failed to update password');
      setIsProcessing(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setIsProcessing(true);
    try {
      await resetPassword(email);
      setIsProcessing(false);
      setView('check-email');
    } catch (err: any) {
      setError(err.message || 'Error sending password reset email');
      setIsProcessing(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[200] ${isDarkMode ? 'bg-[#020617]' : 'bg-slate-50'} flex items-center justify-center p-2 sm:p-4 lg:p-6 font-sans overflow-hidden transition-colors duration-300`}>
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/assets/cover.avif)' }}
        ></div>
        {/* Dark overlay for better contrast */}
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/70' : 'bg-white/70'} backdrop-blur-sm transition-colors duration-300`}></div>
      </div>

      {/* Background Ambience */}
      <div className="fixed inset-0 opacity-20 pointer-events-none z-[1]">
        <div className={`absolute top-0 left-1/4 w-[40vw] h-[40vw] ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-400/30'} blur-[15vw] rounded-full`}></div>
        <div className={`absolute bottom-0 right-1/4 w-[40vw] h-[40vw] ${isDarkMode ? 'bg-indigo-600/20' : 'bg-indigo-400/30'} blur-[15vw] rounded-full`}></div>
      </div>

      {/* Theme Toggle Button - Top Right */}
      <button
        onClick={onToggleTheme}
        className={`fixed top-6 right-6 z-[210] w-12 h-12 rounded-full ${isDarkMode ? 'bg-slate-800/80 hover:bg-slate-700' : 'bg-white/80 hover:bg-white'} backdrop-blur-xl border ${isDarkMode ? 'border-white/10' : 'border-slate-200'} flex items-center justify-center ${isDarkMode ? 'text-yellow-400' : 'text-slate-700'} transition-all shadow-lg hover:scale-110`}
        title="Toggle Theme"
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Cinematic Main Container */}
      <div className={`w-full max-w-6xl max-h-[95vh] lg:h-auto lg:max-h-[85vh] ${isDarkMode ? 'bg-[#0A0F1E]/95' : 'bg-white/95'} backdrop-blur-xl rounded-[2rem] lg:rounded-[3rem] shadow-[0_0_100px_-20px_rgba(0,0,0,0.8)] flex flex-col lg:flex-row overflow-hidden border ${isDarkMode ? 'border-white/10' : 'border-slate-300'} animate-in fade-in zoom-in-95 duration-700 relative z-10`}>

        {/* Left Panel: Integrated Console Area */}
        <div className={`w-full lg:w-[420px] ${isDarkMode ? 'bg-[#0A0F1E]/90' : 'bg-slate-50/90'} backdrop-blur-2xl shrink-0 relative border-b lg:border-b-0 lg:border-r ${isDarkMode ? 'border-white/10' : 'border-slate-300'} flex flex-col p-6 sm:p-8 lg:p-10 z-10 overflow-hidden`}>

          {view === 'login' && !isAuthenticating && (
            <div className="flex-1 flex flex-col justify-center min-h-0 animate-in slide-in-from-left-6 duration-500">
              <div className="mb-6 lg:mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <p className={`text-[8px] font-black uppercase tracking-[0.3em] ${role === 'admin' ? 'text-indigo-400' : 'text-blue-500'}`}>
                    {role === 'admin' ? 'ADMIN ACCESS' : 'USER ACCESS'}
                  </p>
                  <div className="h-[1px] flex-1 bg-white/5"></div>
                </div>

                <h2 className={`text-2xl lg:text-4xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} tracking-tighter leading-[0.85] mb-5`}>
                  The Smarter <br /> <span className={`${isDarkMode ? 'text-slate-600' : 'text-slate-400'} italic`}>Way to Track.</span>
                </h2>

                {/* Modern Access Level Switcher */}
                <div className={`flex p-1 ${isDarkMode ? 'bg-black/40 border-white/5' : 'bg-slate-100 border-slate-200'} border rounded-xl w-fit backdrop-blur-md`}>
                  <button
                    onClick={() => setRole('user')}
                    className={`px-4 lg:px-5 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg transition-all ${role === 'user' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' : `${isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`
                      }`}
                  >
                    User
                  </button>
                  <button
                    onClick={() => setRole('admin')}
                    className={`px-4 lg:px-5 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg transition-all ${role === 'admin' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : `${isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`
                      }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
                {error && (
                  <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'} border flex items-start gap-2`}>
                    <ShieldCheck size={14} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] font-bold text-red-500 leading-relaxed">{error}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className={`text-[8px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-600'} uppercase tracking-[0.2em] ml-1`}>Email Address</label>
                  <div className="relative group">
                    <Mail size={14} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-600 group-focus-within:text-blue-500' : 'text-slate-400 group-focus-within:text-blue-600'} transition-colors`} />
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={`w-full ${isDarkMode ? 'bg-black/40 border-white/10 text-white placeholder:text-slate-700 focus:border-blue-500/50 focus:bg-black/60' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-slate-50'} border rounded-xl pl-12 pr-4 py-3 lg:py-3.5 text-[11px] font-medium outline-none transition-all`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-[8px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-600'} uppercase tracking-[0.2em] ml-1`}>Password</label>
                  <div className="relative group">
                    <Lock size={14} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-600 group-focus-within:text-blue-500' : 'text-slate-400 group-focus-within:text-blue-600'} transition-colors`} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={`w-full ${isDarkMode ? 'bg-black/40 border-white/10 text-white placeholder:text-slate-700 focus:border-blue-500/50 focus:bg-black/60' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-slate-50'} border rounded-xl pl-12 pr-14 py-3 lg:py-3.5 text-[11px] font-medium outline-none transition-all`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-5 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-600 hover:text-white' : 'text-slate-400 hover:text-slate-900'} transition-colors`}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  <div className="flex justify-between items-center px-1 pt-0.5">
                    <label 
                      onClick={() => setRememberMe(!rememberMe)}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <div className={`w-3.5 h-3.5 rounded border ${isDarkMode ? 'border-white/10' : 'border-slate-300'} flex items-center justify-center transition-all ${rememberMe ? 'bg-blue-600 border-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]' : ''}`}>
                        {rememberMe && <Check size={8} className="text-white" />}
                      </div>
                      <span className={`text-[8px] font-bold ${isDarkMode ? 'text-slate-600 group-hover:text-slate-400' : 'text-slate-500 group-hover:text-slate-700'} uppercase tracking-wide transition-colors`}>Remember Me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => { setError(''); setView('forgot-password'); }}
                      className={`text-[8px] font-bold ${isDarkMode ? 'text-slate-600 hover:text-blue-500' : 'text-slate-500 hover:text-blue-600'} uppercase tracking-wide transition-colors`}
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full py-4 lg:py-4.5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-[0_15px_30px_-5px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 group mt-2 border border-blue-400/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {isAuthenticating ? 'Authenticating...' : 'Login'} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </div>
          )}

          {view === 'change-password' && !isAuthenticating && (
            <div className="flex-1 flex flex-col justify-center min-h-0 animate-in slide-in-from-right-6 duration-500">
              <div className="mb-6 lg:mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <p className={`text-[8px] font-black uppercase tracking-[0.3em] text-orange-500`}>
                    SECURITY UPDATE REQUIRED
                  </p>
                  <div className="h-[1px] flex-1 bg-white/5"></div>
                </div>

                <h2 className={`text-2xl lg:text-4xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} tracking-tighter leading-[0.85] mb-3`}>
                  Change <br /> <span className={`${isDarkMode ? 'text-slate-600' : 'text-slate-400'} italic`}>Password.</span>
                </h2>
                <p className={`text-[9px] ${isDarkMode ? 'text-slate-500' : 'text-slate-600'} font-bold uppercase tracking-[0.1em] mt-4 leading-relaxed`}>
                  For your security, please change your temporary password to continue.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 lg:space-y-5">
                {error && (
                  <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'} border flex items-start gap-2`}>
                    <ShieldCheck size={14} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] font-bold text-red-500 leading-relaxed">{error}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className={`text-[8px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-600'} uppercase tracking-[0.2em] ml-1`}>New Password</label>
                  <div className="relative group">
                    <Lock size={14} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-600 group-focus-within:text-blue-500' : 'text-slate-400 group-focus-within:text-blue-600'} transition-colors`} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className={`w-full ${isDarkMode ? 'bg-black/40 border-white/10 text-white placeholder:text-slate-700 focus:border-blue-500/50 focus:bg-black/60' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-slate-50'} border rounded-xl pl-12 pr-14 py-3 lg:py-3.5 text-[11px] font-medium outline-none transition-all`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-5 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-600 hover:text-white' : 'text-slate-400 hover:text-slate-900'} transition-colors`}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-[8px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-600'} uppercase tracking-[0.2em] ml-1`}>Confirm Password</label>
                  <div className="relative group">
                    <ShieldCheck size={14} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-600 group-focus-within:text-blue-500' : 'text-slate-400 group-focus-within:text-blue-600'} transition-colors`} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={`w-full ${isDarkMode ? 'bg-black/40 border-white/10 text-white placeholder:text-slate-700 focus:border-blue-500/50 focus:bg-black/60' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-slate-50'} border rounded-xl pl-12 pr-14 py-3 lg:py-3.5 text-[11px] font-medium outline-none transition-all`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-4 lg:py-4.5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-[0_15px_30px_-5px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 group mt-2 border border-blue-400/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {isProcessing ? 'Updating...' : 'Update Password'} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </div>
          )}

          {view === 'forgot-password' && !isAuthenticating && (
            <div className="flex-1 flex flex-col justify-center min-h-0 animate-in slide-in-from-right-6 duration-500">
              <button
                onClick={() => { setError(''); setView('login'); }}
                className={`mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500 hover:text-white' : 'text-slate-500 hover:text-slate-900'} transition-colors w-fit`}
              >
                <ArrowLeft size={14} /> Back to Login
              </button>

              <div className="mb-6 lg:mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <p className={`text-[8px] font-black uppercase tracking-[0.3em] text-blue-500`}>
                    ACCOUNT RECOVERY
                  </p>
                  <div className="h-[1px] flex-1 bg-white/5"></div>
                </div>

                <h2 className={`text-2xl lg:text-4xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} tracking-tighter leading-[0.85] mb-3`}>
                  Reset <br /> <span className={`${isDarkMode ? 'text-slate-600' : 'text-slate-400'} italic`}>Password.</span>
                </h2>
                <p className={`text-[9px] ${isDarkMode ? 'text-slate-500' : 'text-slate-600'} font-bold uppercase tracking-[0.1em] mt-4 leading-relaxed`}>
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4 lg:space-y-5">
                {error && (
                  <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'} border flex items-start gap-2`}>
                    <ShieldCheck size={14} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] font-bold text-red-500 leading-relaxed">{error}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className={`text-[8px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-600'} uppercase tracking-[0.2em] ml-1`}>Email Address</label>
                  <div className="relative group">
                    <Mail size={14} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-600 group-focus-within:text-blue-500' : 'text-slate-400 group-focus-within:text-blue-600'} transition-colors`} />
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={`w-full ${isDarkMode ? 'bg-black/40 border-white/10 text-white placeholder:text-slate-700 focus:border-blue-500/50 focus:bg-black/60' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-slate-50'} border rounded-xl pl-12 pr-4 py-3 lg:py-3.5 text-[11px] font-medium outline-none transition-all`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-4 lg:py-4.5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-[0_15px_30px_-5px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 group mt-2 border border-blue-400/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {isProcessing ? 'Sending...' : 'Send Reset Link'} <Send size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </div>
          )}

          {view === 'check-email' && !isAuthenticating && (
            <div className="flex-1 flex flex-col justify-center items-center text-center animate-in zoom-in-95 duration-500 py-10">
              <div className="relative mb-8 lg:mb-12">
                <div className={`w-32 h-32 lg:w-40 lg:h-40 rounded-3xl border ${isDarkMode ? 'border-white/5 bg-black/40' : 'border-slate-200 bg-slate-50'} flex items-center justify-center relative overflow-hidden shadow-inner group`}>
                  <CheckCircle2 size={64} className={`transition-colors duration-500 text-green-500`} />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-transparent opacity-30"></div>
                </div>
              </div>

              <h2 className={`text-2xl lg:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} tracking-tighter leading-[0.85] mb-4`}>
                Check your <br /> <span className={`text-green-500 italic`}>Email.</span>
              </h2>
              <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} font-bold uppercase tracking-[0.1em] max-w-[250px] leading-relaxed mx-auto`}>
                We've sent a password reset link to {email}. Please check your inbox and spam folder.
              </p>

              <button
                onClick={() => setView('login')}
                className={`mt-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-500 hover:text-white' : 'text-slate-500 hover:text-slate-900'} transition-colors`}
              >
                <ArrowLeft size={14} /> Back to Login
              </button>
            </div>
          )}

          {isAuthenticating && (
            /* Secure Transition Stage */
            <div className="flex-1 flex flex-col justify-center items-center text-center animate-in zoom-in-95 duration-500 py-10">
              <div className="relative mb-8 lg:mb-12">
                <div className={`w-32 h-32 lg:w-40 lg:h-40 rounded-3xl border ${isDarkMode ? 'border-white/5 bg-black/40' : 'border-slate-200 bg-slate-50'} flex items-center justify-center relative overflow-hidden shadow-inner group`}>
                  <Fingerprint size={64} className={`transition-colors duration-500 ${role === 'admin' ? 'text-indigo-500' : 'text-blue-500'} animate-pulse`} />
                  <div className={`absolute top-0 left-0 w-full h-1.5 transition-colors duration-500 ${role === 'admin' ? 'bg-indigo-500 shadow-[0_0_20px_#6366f1]' : 'bg-blue-600 shadow-[0_0_20px_#2563eb]'} animate-scan-slow`}></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent opacity-30"></div>
                </div>
              </div>

              <div className="space-y-2">
                <p className={`text-xs lg:text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} uppercase tracking-[0.4em]`}>{steps[authStep]}</p>
                <p className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-600' : 'text-slate-500'} uppercase tracking-widest`}>Authenticating...</p>
              </div>

              <div className="w-56 lg:w-64 mt-8 lg:mt-12 space-y-4 lg:space-y-5">
                <div className={`w-full ${isDarkMode ? 'bg-black/60 border-white/5' : 'bg-slate-100 border-slate-200'} h-2 rounded-full overflow-hidden border p-[2px]`}>
                  <div
                    className={`h-full transition-all duration-300 rounded-full shadow-[0_0_10px_currentColor] ${role === 'admin' ? 'bg-indigo-600 text-indigo-400' : 'bg-blue-600 text-blue-400'}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center px-1">
                  <span className={`text-[10px] font-black ${isDarkMode ? 'text-slate-600' : 'text-slate-500'} uppercase tracking-[0.2em]`}>Loading</span>
                  <span className={`text-xs font-black ${role === 'admin' ? 'text-indigo-500' : 'text-blue-500'}`}>{Math.floor(progress)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Industrial Vision Area */}
        <div className={`flex-1 relative hidden lg:flex flex-col p-8 lg:p-10 overflow-hidden ${isDarkMode ? 'bg-[#020617]/80' : 'bg-gradient-to-br from-slate-50/80 to-blue-50/80'} backdrop-blur-xl shrink`}>
          {/* Background Decoration */}
          <div className="absolute inset-0 z-0">
            <div className={`absolute left-[15%] top-[-10%] bottom-[-10%] w-[1px] ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-300/30'}`}></div>
            <div className={`absolute right-[12%] top-[-10%] bottom-[-10%] w-[1px] ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-200/30'}`}></div>
            <div className={`absolute inset-0 ${isDarkMode ? 'opacity-[0.05]' : 'opacity-[0.03]'} bg-[radial-gradient(#000000_1px,transparent_1px)] bg-[size:40px_40px]`}></div>
          </div>

          <div className="relative z-10 h-full flex flex-col justify-between">
            {/* Removed Global Telemetry Node section */}

            {/* Cinematic Hero Branding */}
            <div className="relative flex-1 flex flex-col justify-center min-h-0">
              <div className="absolute inset-0 pointer-events-none z-0 flex flex-col justify-center">
                <div className="space-y-[-1rem] lg:space-y-[-1.5rem] opacity-40 select-none">
                  <h3 className={`text-[5rem] xl:text-[7rem] font-black ${isDarkMode ? 'text-white/10' : 'text-slate-900/10'} leading-none tracking-tighter`}>INNOVATING</h3>
                  <h3 className={`text-[5rem] xl:text-[7rem] font-black ${isDarkMode ? 'text-white/[0.12]' : 'text-slate-900/[0.12]'} leading-none tracking-tighter ml-16 italic`}>THE</h3>
                  <h3 className={`text-[5rem] xl:text-[7rem] font-black ${isDarkMode ? 'text-white/[0.08]' : 'text-slate-900/[0.08]'} leading-none tracking-tighter ml-8`}>FUTURE</h3>
                </div>
              </div>

              {/* IE Core Narrative */}
              <div className="relative z-10 ml-6 max-w-sm mt-4 lg:mt-6">
                <div className="absolute -left-5 top-0 bottom-0 w-1 bg-blue-600 rounded-full shadow-[0_0_15px_#2563eb]"></div>
                <div className="flex items-center gap-3 mb-2 lg:mb-3">
                  <span className="text-[9px] lg:text-[10px] font-black text-blue-400 uppercase tracking-[0.5em]">System Overview</span>
                </div>
                <h4 className={`text-xl lg:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} uppercase tracking-tight leading-[1] mb-3 lg:mb-4`}>
                  Industrial <br /> Engineering Hub.
                </h4>
                <p className={`text-[8px] lg:text-[9px] ${isDarkMode ? 'text-slate-500' : 'text-slate-600'} font-bold uppercase tracking-[0.2em] leading-relaxed`}>
                  Track and manage engineering projects from concept to completion. Monitor style development, coordinate teams, and ensure timely delivery across all production plants.
                </p>
              </div>
            </div>

            {/* Removed SCADA-Style System Diagnostics section */}
          </div>
        </div>
      </div>

      {/* Footer - Fixed at bottom center of entire screen */}
      <div className="fixed bottom-0 left-0 right-0 z-[201] flex justify-center items-center gap-3 py-4">
        <img
          src="/assets/Mas-Logo-Vector.avif"
          alt="MAS Logo"
          className="h-5 w-auto object-contain opacity-70"
        />
        <span className={`text-[10px] font-black ${isDarkMode ? 'text-slate-700' : 'text-slate-500'} uppercase tracking-widest`}>© 2026 IE_DIGITAL</span>
      </div>

      <style>{`
        @keyframes scan-slow {
          0% { transform: translateY(0); }
          100% { transform: translateY(112px); }
        }
        .animate-scan-slow {
          animation: scan-slow 4s ease-in-out infinite alternate;
        }
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </div>
  );
};
