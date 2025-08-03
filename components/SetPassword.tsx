'use client';
import React, { useState, useEffect } from 'react';
import Footer from '@/components/Footer';
import NavBar from '@/components/NavBar';
import Button from '@/components/Button';
import { supabase } from '@/utils/supabaseClient';
import { useRouter } from 'next/navigation';

const SetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUserStatus = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        router.push('/');
        return;
      }

      setIsLoading(false);
    };

    checkUserStatus();
  }, [router]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      router.push('/');
    } catch (err) {
      console.error('Set password error:', err);
      setError('An error occurred while setting your password');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center min-h-screen">
        <NavBar currentPage="set-password" hideButtons={true} />
        <div className="w-full max-w-screen-xl mx-auto px-4 flex-grow flex items-center justify-center">
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen">
      <NavBar currentPage="set-password" hideButtons={true} />
      <div className="w-full max-w-screen-xl mx-auto px-4 flex-grow flex items-center justify-center">
        <div className="p-6 bg-[var(--card-background)] rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-xl font-bold text-[var(--card-title)] mb-4 text-center">
            Set Your Password
          </h2>
          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
          
          <form onSubmit={handleSetPassword} className="mb-6">
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-[var(--card-text)]">
                New Password
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

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--card-text)]">
                Confirm New Password
              </label>
              <div className="h-[59px] flex items-center">
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              {isSubmitting ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SetPasswordPage;