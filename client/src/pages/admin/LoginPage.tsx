import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useMutation, useQuery } from '@tanstack/react-query';
import { adminLoginSchema, type AdminLoginValues } from '@invitation/shared';
import { adminApi } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';

export default function LoginPage() {
  const navigate = useNavigate();

  const { data: isAuth, isLoading: checkingAuth } = useQuery({
    queryKey: ['admin', 'auth'],
    queryFn: adminApi.checkAuth,
    retry: false,
  });

  useEffect(() => {
    if (isAuth) navigate('/admin', { replace: true });
  }, [isAuth, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginValues>({
    resolver: zodResolver(adminLoginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: adminApi.login,
    onSuccess: () => {
      queryClient.setQueryData(['admin', 'auth'], true);
      navigate('/admin', { replace: true });
    },
  });

  const onSubmit = (values: AdminLoginValues) => loginMutation.mutate(values);

  if (checkingAuth) {
    return (
      <div className="admin-page min-h-screen flex items-center justify-center" style={{ background: '#FDFAF5' }}>
        <div className="w-6 h-6 rounded-full animate-spin" style={{ border: '2px solid rgba(184,146,74,0.3)', borderTopColor: '#B8924A' }} role="status" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="admin-page min-h-screen flex items-center justify-center px-4" style={{ background: '#FDFAF5' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        {/* Branding */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(184,146,74,0.1)', border: '1px solid rgba(184,146,74,0.25)' }}>
            <svg className="w-4 h-4" style={{ color: '#B8924A' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <p className="font-sans font-semibold text-sm leading-none" style={{ color: '#2A1F1A' }}>Guest Admin</p>
            <p className="font-sans text-xs mt-0.5" style={{ color: 'rgba(42,31,26,0.55)' }}>B & S · Wedding 2026</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl shadow-sm" style={{ background: '#FFFFFF', border: '1px solid rgba(184,146,74,0.2)' }}>
          <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(184,146,74,0.12)' }}>
            <h1 className="font-sans font-semibold text-base" style={{ color: '#2A1F1A' }}>Sign in</h1>
            <p className="font-sans text-sm mt-0.5" style={{ color: 'rgba(42,31,26,0.55)' }}>Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-6 space-y-4" aria-label="Admin login form">
            {loginMutation.isError && (
              <div className="rounded-lg px-3 py-2.5" style={{ background: 'rgba(196,132,140,0.08)', border: '1px solid rgba(196,132,140,0.25)' }} role="alert">
                <p className="text-sm font-sans" style={{ color: '#9B4A55' }}>Invalid credentials. Please try again.</p>
              </div>
            )}

            <div>
              <label htmlFor="admin-username" className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: 'rgba(42,31,26,0.55)' }}>
                Username
              </label>
              <input
                id="admin-username"
                type="text"
                autoComplete="username"
                aria-required="true"
                aria-invalid={!!errors.username}
                aria-describedby={errors.username ? 'admin-username-error' : undefined}
                {...register('username')}
                className="w-full rounded-lg px-3 py-2.5 text-sm font-sans placeholder-gray-400 outline-none transition-all"
                style={{ background: '#FDFAF5', border: '1px solid rgba(184,146,74,0.3)', color: '#2A1F1A' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#B8924A')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(184,146,74,0.3)')}
                placeholder="admin"
              />
              {errors.username && (
                <p id="admin-username-error" className="mt-1 text-xs font-sans" style={{ color: '#9B4A55' }} role="alert">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: 'rgba(42,31,26,0.55)' }}>
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                aria-required="true"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'admin-password-error' : undefined}
                {...register('password')}
                className="w-full rounded-lg px-3 py-2.5 text-sm font-sans placeholder-gray-400 outline-none transition-all"
                style={{ background: '#FDFAF5', border: '1px solid rgba(184,146,74,0.3)', color: '#2A1F1A' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#B8924A')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(184,146,74,0.3)')}
                placeholder="••••••••"
              />
              {errors.password && (
                <p id="admin-password-error" className="mt-1 text-xs font-sans" style={{ color: '#9B4A55' }} role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full text-white font-sans font-semibold text-sm py-2.5 px-6 rounded-lg transition-all focus:outline-none mt-1 disabled:cursor-not-allowed"
              style={{
                background: loginMutation.isPending ? 'rgba(42,31,26,0.55)' : '#2A1F1A',
                opacity: loginMutation.isPending ? 0.8 : 1,
              }}
              onMouseEnter={e => { if (!loginMutation.isPending) e.currentTarget.style.background = '#B8924A'; }}
              onMouseLeave={e => { if (!loginMutation.isPending) e.currentTarget.style.background = '#2A1F1A'; }}
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid rgba(255,255,255,0.35)', borderTopColor: 'white' }} aria-hidden="true" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
