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

  const onSubmit = (values: AdminLoginValues) => {
    loginMutation.mutate(values);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" aria-label="Loading" role="status" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gold-500/10 border border-gold-400/40 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="font-serif text-2xl text-white mb-1">Admin Panel</h1>
          <p className="text-gray-400 font-sans text-sm">Sign in to manage your event</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="bg-gray-900 border border-white/10 rounded-2xl p-6 space-y-4"
          aria-label="Admin login form"
        >
          {loginMutation.isError && (
            <div className="bg-red-500/10 border border-red-400/30 rounded-lg px-4 py-3" role="alert">
              <p className="text-red-400 text-sm font-sans">Invalid credentials. Please try again.</p>
            </div>
          )}

          <div>
            <label htmlFor="admin-username" className="block text-sm font-medium font-sans text-gray-300 mb-1.5">
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
              className="w-full bg-gray-800 border border-gray-700 focus:border-gold-400 rounded-lg px-4 py-2.5 text-white font-sans text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors"
              placeholder="admin"
            />
            {errors.username && (
              <p id="admin-username-error" className="mt-1 text-xs text-red-400 font-sans" role="alert">
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium font-sans text-gray-300 mb-1.5">
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
              className="w-full bg-gray-800 border border-gray-700 focus:border-gold-400 rounded-lg px-4 py-2.5 text-white font-sans text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors"
              placeholder="••••••••"
            />
            {errors.password && (
              <p id="admin-password-error" className="mt-1 text-xs text-red-400 font-sans" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-gold-500 hover:bg-gold-400 disabled:bg-gold-500/50 text-gray-950 font-sans font-semibold text-sm py-2.5 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed mt-2"
          >
            {loginMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" aria-hidden="true" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
