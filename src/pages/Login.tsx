import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, Key, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, agent, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const savedCode = localStorage.getItem('saved_activation_code');
    if (savedCode) {
      setActivationCode(savedCode);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && agent) {
      navigate('/dashboard');
    }
  }, [agent, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password, activationCode);

    if (error) {
      toast({
        title: 'Login Failed',
        description: error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome Back!',
        description: 'Login successful',
      });
      navigate('/dashboard');
    }

    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#ffffff' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#6a4cff' }} />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: '#ffffff' }}
    >
      {/* Vignette overlay */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.08) 100%)'
        }}
      />
      
      {/* Bokeh blobs */}
      <div 
        className="absolute rounded-full pointer-events-none"
        style={{
          top: '-8%',
          left: '-8%',
          width: '320px',
          height: '320px',
          background: '#c7b8ff',
          opacity: 0.15,
          filter: 'blur(80px)',
        }}
      />
      <div 
        className="absolute rounded-full pointer-events-none"
        style={{
          top: '15%',
          right: '-12%',
          width: '280px',
          height: '280px',
          background: '#8a63ff',
          opacity: 0.12,
          filter: 'blur(60px)',
        }}
      />
      <div 
        className="absolute rounded-full pointer-events-none"
        style={{
          bottom: '-5%',
          left: '8%',
          width: '260px',
          height: '260px',
          background: '#5ee6c5',
          opacity: 0.18,
          filter: 'blur(70px)',
        }}
      />
      <div 
        className="absolute rounded-full pointer-events-none"
        style={{
          bottom: '25%',
          right: '5%',
          width: '200px',
          height: '200px',
          background: '#2fd3b0',
          opacity: 0.1,
          filter: 'blur(50px)',
        }}
      />
      <div 
        className="absolute rounded-full pointer-events-none"
        style={{
          top: '55%',
          left: '-5%',
          width: '180px',
          height: '180px',
          background: '#c7b8ff',
          opacity: 0.08,
          filter: 'blur(40px)',
        }}
      />

      {/* Login Card Container */}
      <div 
        className="w-full max-w-sm relative z-10"
        style={{
          animation: 'slideUp 0.5s ease-out',
        }}
      >
        {/* Login Card Box */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 18px 45px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.06)',
            padding: '32px 24px',
          }}
        >
          {/* Brand Title */}
          <div className="flex flex-col items-center mb-8">
            <h1 
              className="text-3xl font-bold mb-2"
              style={{
                background: 'linear-gradient(to right, #6a4cff, #22d3a6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Agent Panel
            </h1>
            <p style={{ color: '#7a7f99', fontSize: '14px' }}>
              Sign in to continue
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className="text-sm font-medium"
                style={{ color: '#1a1a2e' }}
              >
                Email
              </label>
              <div className="relative">
                <Mail 
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" 
                  style={{ color: '#9aa0a6' }} 
                />
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-12 pl-11 pr-4 text-sm outline-none transition-all"
                  style={{
                    background: '#f4f5f7',
                    borderRadius: '14px',
                    border: '1px solid rgba(0,0,0,0.08)',
                    color: '#1a1a2e',
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 0 0 3px rgba(82,113,255,0.25)';
                    e.target.style.borderColor = 'rgba(82,113,255,0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'none';
                    e.target.style.borderColor = 'rgba(0,0,0,0.08)';
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label 
                htmlFor="password" 
                className="text-sm font-medium"
                style={{ color: '#1a1a2e' }}
              >
                Password
              </label>
              <div className="relative">
                <Lock 
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" 
                  style={{ color: '#9aa0a6' }} 
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-12 pl-11 pr-11 text-sm outline-none transition-all"
                  style={{
                    background: '#f4f5f7',
                    borderRadius: '14px',
                    border: '1px solid rgba(0,0,0,0.08)',
                    color: '#1a1a2e',
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 0 0 3px rgba(82,113,255,0.25)';
                    e.target.style.borderColor = 'rgba(82,113,255,0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'none';
                    e.target.style.borderColor = 'rgba(0,0,0,0.08)';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                  style={{ color: '#9aa0a6' }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Activation Code Field */}
            <div className="space-y-2">
              <label 
                htmlFor="activationCode" 
                className="text-sm font-medium"
                style={{ color: '#1a1a2e' }}
              >
                Activation Code
              </label>
              <div className="relative">
                <Key 
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" 
                  style={{ color: '#9aa0a6' }} 
                />
                <input
                  id="activationCode"
                  type="text"
                  placeholder="Enter activation code"
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value)}
                  required
                  className="w-full h-12 pl-11 pr-4 text-sm outline-none transition-all"
                  style={{
                    background: '#f4f5f7',
                    borderRadius: '14px',
                    border: '1px solid rgba(0,0,0,0.08)',
                    color: '#1a1a2e',
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 0 0 3px rgba(82,113,255,0.25)';
                    e.target.style.borderColor = 'rgba(82,113,255,0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'none';
                    e.target.style.borderColor = 'rgba(0,0,0,0.08)';
                  }}
                />
              </div>
              {localStorage.getItem('saved_activation_code') && (
                <p className="text-xs" style={{ color: '#7a7f99' }}>
                  Code saved from previous login
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-12 font-semibold text-white relative overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
              style={{
                borderRadius: '16px',
                background: 'linear-gradient(to right, #5b4bff, #20d3a1)',
                boxShadow: '0 12px 30px rgba(32,211,161,0.25), 0 12px 30px rgba(91,75,255,0.20)',
                marginTop: '24px',
              }}
            >
              {/* Glossy highlight line */}
              <div 
                className="absolute top-0 left-0 right-0 h-[1px]"
                style={{
                  background: 'linear-gradient(to right, rgba(255,255,255,0.35), rgba(255,255,255,0.15), rgba(255,255,255,0.35))',
                }}
              />
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer Text */}
          <p 
            className="text-center text-sm mt-6"
            style={{ color: '#7a7f99' }}
          >
            Contact admin for account creation
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        input::placeholder {
          color: #9aa0a6;
        }
      `}</style>
    </div>
  );
}
