'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function SaveExitPage() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const router = useRouter();

  const addDebugInfo = (info: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${info}`;
    console.log(logEntry);
    setDebugInfo(prev => [...prev, logEntry]);
  };

  useEffect(() => {
    addDebugInfo('SaveExit page loaded');
    
    // 检查是否有用户信息（调试用）
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      addDebugInfo('Warning: User still in localStorage, clearing...');
      localStorage.removeItem('currentUser');
    }
    
    // 移除自动跳转逻辑，让用户手动点击按钮
    addDebugInfo('Page ready, waiting for user action');
  }, [router]);

  const handleContinueToLogin = () => {
    addDebugInfo('Continue to Login button clicked');
    setIsRedirecting(true);
    try {
      addDebugInfo('Attempting router.push...');
      router.push('/login');
    } catch (error) {
      addDebugInfo(`Router push failed: ${error}`);
      console.error('Router push failed:', error);
      // 如果路由失败，使用 window.location
      try {
        addDebugInfo('Falling back to window.location...');
        window.location.href = '/login';
      } catch (locationError) {
        addDebugInfo(`Window.location failed: ${locationError}`);
        console.error('Window.location failed:', locationError);
      }
    }
  };

  // 在开发环境显示调试信息
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[450px]">        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl">
            Progress Saved Successfully
          </CardTitle>
          <CardDescription>
            Your survey progress has been saved. You can continue later.
          </CardDescription>
        </CardHeader>        <CardContent className="text-center">
          <div className="space-y-4">
            <Button 
              onClick={handleContinueToLogin}
              disabled={isRedirecting}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium"
            >
              {isRedirecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Redirecting...
                </>
              ) : (
                'Continue to Login'
              )}
            </Button>
          </div>
          
          {/* 调试信息 - 只在需要时显示 */}
          {isDevelopment && debugInfo.length > 0 && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500">
                Debug Info (Development Only)
              </summary>
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono max-h-32 overflow-y-auto">
                {debugInfo.map((info, index) => (
                  <div key={index}>{info}</div>
                ))}
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
