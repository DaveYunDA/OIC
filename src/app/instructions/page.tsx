'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";

export default function InstructionsPage() {
  const router = useRouter();

  const handleStart = () => {
    router.push('/');
  };

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