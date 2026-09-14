import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Vault, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      toast('Welcome back to MindVault!', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b11] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-card rounded-3xl border border-white/10 p-8 sm:p-10 shadow-2xl relative z-10">
        {/* Logo and header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-blue-600/30 border border-blue-400/40 mb-4">
            <Vault className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">MindVault</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            "Your knowledge. Your life. One intelligent place."
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs mb-5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            icon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2"
          >
            Sign In to Vault
          </Button>
        </form>

        {/* Switch to Register */}
        <div className="text-center mt-6 pt-6 border-t border-white/5">
          <p className="text-xs text-slate-400">
            Don't have a vault yet?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default Login;
