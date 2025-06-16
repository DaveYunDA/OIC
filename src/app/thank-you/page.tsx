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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 p-4">
      <div className="container max-w-2xl mx-auto p-8 rounded-2xl shadow-xl bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-200">
        <h1 className="text-4xl font-bold text-teal-700 mb-6 text-center">Thank You!</h1>
        <p className="text-gray-800 mb-6 text-lg text-center leading-relaxed">
          Thank you for completing the survey. Your feedback is greatly appreciated.
        </p>
        <div className="flex justify-center">
          <Button 
            onClick={handleLogout} 
            variant="outline"
            className="bg-teal-600 hover:bg-teal-700 text-white border-teal-600 hover:border-teal-700 px-8 py-2"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}

