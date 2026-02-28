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
      <div className="admin-page min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" role="status" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="admin-page min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        {/* Branding */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <p className="font-sans font-semibold text-gray-900 text-sm leading-none">Guest Admin</p>
            <p className="text-gray-500 font-sans text-xs mt-0.5">B & S · Wedding 2026</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <h1 className="font-sans font-semibold text-gray-900 text-base">Sign in</h1>
            <p className="text-gray-500 font-sans text-sm mt-0.5">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-6 space-y-4" aria-label="Admin login form">
            {loginMutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5" role="alert">
                <p className="text-red-700 text-sm font-sans">Invalid credentials. Please try again.</p>
              </div>
            )}

            <div>
              <label htmlFor="admin-username" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
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
                className="w-full bg-white border border-gray-300 focus:border-blue-500 rounded-lg px-3 py-2.5 text-gray-900 font-sans text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                placeholder="admin"
              />
              {errors.username && (
                <p id="admin-username-error" className="mt-1 text-xs text-red-600 font-sans" role="alert">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
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
                className="w-full bg-white border border-gray-300 focus:border-blue-500 rounded-lg px-3 py-2.5 text-gray-900 font-sans text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                placeholder="••••••••"
              />
              {errors.password && (
                <p id="admin-password-error" className="mt-1 text-xs text-red-600 font-sans" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/60 text-white font-sans font-semibold text-sm py-2.5 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed mt-1"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
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
