'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';

export default function InstructionsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      const user = localStorage.getItem('currentUser');
      const authToken = localStorage.getItem('authToken');
      
      if (!user || !authToken) {
        console.log("未认证用户访问指导页面，跳转到登录页");
        router.push('/login');
        return;
      }
      
      try {
        const userData = JSON.parse(user);
        const tokenData = JSON.parse(authToken);
        
        // 检查会话是否过期
        const currentTime = Date.now();
        const tokenTime = tokenData.timestamp;
        const sessionTimeout = 24 * 60 * 60 * 1000; // 24小时超时
        
        if (currentTime - tokenTime > sessionTimeout) {
          throw new Error("会话已过期");
        }
        
        // 验证用户是否仍然存在
        const { data: userExists, error } = await supabase
          .from('users')
          .select('id')
          .eq('id', userData.id)
          .eq('username', userData.username)
          .single();
          
        if (error || !userExists) {
          throw new Error("用户验证失败");
        }
        
        setIsAuthenticated(true);
      } catch (e) {
        console.error("认证检查失败:", e);
        localStorage.clear();
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, [router]);

  const handleStart = () => {
    if (isAuthenticated) {
      router.push('/');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // 将会重定向到登录页
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="max-w-3xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8">Instructions</h1>
        
        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold mb-3">Welcome to the Assessment</h2>
            <p className="mb-4">
              Please read the following instructions carefully before starting:
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Assessment Information</h2>
            <ul className="list-disc pl-6 space-y-3">
              <li>The assessment should take approximately 60 - 120 minutes.</li>
              <li>There is no right or wrong answer. Just be yourself and give truthful answers.</li>
              <li>It will help you to know yourself better.</li>
              <li>You can save your answers and come back another time, if you are unable to complete in one go.</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Button 
            onClick={handleStart}
            className="px-8 py-6 text-lg"
          >
            Start Assessment
          </Button>
        </div>
      </div>
    </div>
  );
}