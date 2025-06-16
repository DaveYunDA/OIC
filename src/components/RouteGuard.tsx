'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface RouteGuardProps {
  children: React.ReactNode;
}

export default function RouteGuard({ children }: RouteGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = localStorage.getItem('currentUser');
        if (!user) {
          console.log('No user found in localStorage, redirecting to login');
          router.push('/login');
          return;
        }

        // 验证用户数据格式
        const userData = JSON.parse(user);
        if (!userData.id || !userData.username) {
          console.log('Invalid user data, redirecting to login');
          localStorage.removeItem('currentUser');
          router.push('/login');
          return;
        }

        console.log('User authenticated:', userData.username);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('currentUser');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // 已经重定向到登录页面
  }

  return <>{children}</>;
}
