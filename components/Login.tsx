// src/components/Login.tsx
'use client';
import React, { useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import Button from '@/components/Button';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError('Invalid email or password');
        setIsSubmitting(false);
        return;
      }

      onLogin();
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen">
      <NavBar currentPage="tournament-tools" hideButtons={true} />
      <div className="w-full max-w-screen-xl mx-auto px-4 flex-grow flex items-center justify-center">
        <div className="p-6 bg-[var(--card-background)] rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-xl font-bold text-[var(--card-title)] mb-4 text-center">Login</h2>
          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
          
          <form onSubmit={handleLogin} className="mb-6">
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-[var(--card-text)]">
                Email
              </label>
              <div className="h-[59px] flex items-center">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="p-2 h-[42px] w-full border-1 border-[var(--form-border)] rounded-md bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-[var(--card-text)]">
                Password
              </label>
              <div className="h-[59px] flex items-center">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="p-2 h-[42px] w-full border-1 border-[var(--form-border)] rounded-md bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;