'use client';

import { useRouter } from 'next/navigation';

export default function QuestionsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Assessment Questions</h1>
        
        {/* 临时占位内容 */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <p className="text-lg text-gray-700">
            Questions will be displayed here.
          </p>
        </div>
      </div>
    </div>
  );
} 