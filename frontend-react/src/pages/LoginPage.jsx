import { useState, useEffect } from 'react';
import { login } from '../services/api';
import { Lock, User, ShieldCheck, ArrowRight, Layers, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Clear any stale session tokens on visit; prefill remembered username if saved
  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    const remembered = localStorage.getItem('nexus_remembered_username');
    if (remembered) {
      setUsername(remembered);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const cleanUser = username.trim();
    if (!cleanUser) {
      setError('Please enter your username.');
      setIsLoading(false);
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      setIsLoading(false);
      return;
    }

    try {
      await login(cleanUser, password);
      if (rememberMe) {
        localStorage.setItem('nexus_remembered_username', cleanUser);
      } else {
        localStorage.removeItem('nexus_remembered_username');
      }
      window.location.href = '/dashboard';
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.statusText || 'Invalid username or password.';
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans selection:bg-indigo-600 selection:text-white">
      {/* Subtle Ambient Radial Lighting */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Top Header Branding */}
      <div className="text-center mb-8 relative z-10">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 shadow-inner mb-4">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Nexus CV &bull; Enterprise Recruitment Gateway</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Recruiter Sign In
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
          Access the candidate screening dashboard, pipeline analytics, and audit records.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-7 sm:p-8 backdrop-blur-xl shadow-2xl relative z-10">
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4" autoComplete="on">
          <div>
            <label htmlFor="username" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input 
                id="username"
                name="username"
                type="text" 
                autoComplete="username"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans"
                placeholder="Enter your recruiter username"
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="text-[11px] text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input 
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'} 
                autoComplete="current-password"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans"
                placeholder="Enter your password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                id="remember"
                name="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500/30 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs text-slate-400 hover:text-slate-300 transition-colors">
                Remember username
              </span>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 px-4 rounded-xl font-bold text-sm shadow-lg shadow-indigo-950 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 mt-2"
          >
            {isLoading ? 'Authenticating...' : 'Sign In to Dashboard'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Navigation Link to Portal */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-xs">
          <a 
            href="/careers" 
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            &larr; Go to Career Portal
          </a>
        </div>
      </div>

      {/* Security Guarantee Badge */}
      <div className="mt-8 flex items-center gap-2 text-xs text-slate-500 relative z-10">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>Protected by 256-bit HS256 JWT Authentication & BCrypt Hashing</span>
      </div>
    </div>
  );
}