import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../lib/api';

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { data: isAuth, isLoading } = useQuery({
    queryKey: ['admin', 'auth'],
    queryFn: adminApi.checkAuth,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
          role="status"
          aria-label="Checking authentication"
        />
      </div>
    );
  }

  if (!isAuth) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
