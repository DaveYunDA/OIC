'use client';

import {Button} from '@/components/ui/button';
import {useRouter} from 'next/navigation';
import {useEffect} from 'react';

export default function ThankYouPage() {
  const router = useRouter();

  useEffect(() => {
    const submitted = localStorage.getItem('submitted');
    if (!submitted) {
      router.push('/');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('submitted');
    router.push('/login');
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-secondary">
      <div className="container max-w-2xl mx-auto p-8 rounded-lg shadow-md bg-card">
        <h1 className="text-3xl font-bold text-primary mb-4">Thank You!</h1>
        <p className="text-gray-700 mb-4">
          Thank you for completing the survey. Your feedback is greatly appreciated.
        </p>
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>
    </div>
  );
}

