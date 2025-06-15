'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster } from '@/components/ui/toaster';
import { ArrowRight, Plus, X, Save } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from "lucide-react";
import { DragEndEvent } from '@dnd-kit/core';
import Image from 'next/image';

// 问卷问题类型定义
interface Question {
  id: string; // 问题唯一标识
  text: string; // 问题文本
  type: "radio-with-other" | "text" | "ranking" | "instructions"; // 问题类型
  required: boolean; // 是否必答
  options?: Array<string | { text: string; tag: string }>; // 选项列表
  description?: string; // 问题描述
  instructionContent?: InstructionContent; // 说明内容（仅说明类问题）
  image?: string; // 新增：图片路径
}

// 问卷分区类型定义
interface Section {
  id: string; // 分区唯一标识
  title: string; // 分区标题
  questions: Question[]; // 分区下的问题列表
}

// 表单值类型定义
interface FormValues {
  answers: Record<string, {
    value: string;
    otherValue?: string;
  }>;
}

// 说明内容的子弹点类型
interface InstructionBulletPoint {
  text: string;
  description?: string;
  boldItems?: Array<{
    text: string;
    description: string;
  }>;
}

// 说明内容类型定义
interface InstructionContent {
  mainText: string;
  boldText: string;
  continueText: string;
  timeSection: {
    text: string;
    boldTime: string;
    italicText: string;
    endText: string;
  };
  ideaSection: {
    text: string;
    boldWords: string[];
    endText: string;
  };
  bulletPoints: InstructionBulletPoint[];
  finalNote: {
    text: string;
    boldWord: string;
    continueText: string;
    boldTime: string;
    endText: string;
  };
}

// 说明组件：用于展示问卷说明内容
function Instructions({ content }: { content: InstructionContent }) {
  return (
    <div className="space-y-6 text-gray-800">
      <p className="text-lg">
        {content.mainText}
        <span className="font-bold">{content.boldText}</span>
        {content.continueText}
      </p>
      
      <p>
        {content.timeSection.text}
        <span className="font-bold">{content.timeSection.boldTime}</span>
        <span className="italic">{content.timeSection.italicText}</span>
        {content.timeSection.endText}
      </p>
      
      <p>
        {content.ideaSection.text}
        {content.ideaSection.boldWords.map((word, index) => (
          <span key={index}>
            <span className="font-bold">{word}</span>
            {index < content.ideaSection.boldWords.length - 1 ? ' and ' : ''}
          </span>
        ))}
        {content.ideaSection.endText}
      </p>
      
      <ul className="list-disc pl-6 space-y-2">
        {content.bulletPoints.map((point, index) => (
          <li key={index}>
            {point.boldItems ? (
              <>
                {point.text}
                {point.boldItems.map((item, i) => (
                  <span key={i}>
                    <span className="font-bold">{item.text}</span>
                    {item.description}
                  </span>
                ))}
              </>
            ) : (
              point.text
            )}
    </li>
        ))}
      </ul>
      
      <p>
        {content.finalNote.text}
        <span className="font-bold">{content.finalNote.boldWord}</span>
        {content.finalNote.continueText}
        <span className="font-bold">{content.finalNote.boldTime}</span>
        {content.finalNote.endText}
      </p>
    </div>
  );
}

// 多行文本输入组件
function MultiLineTextInput({ 
  questionId, 
  initialValue, 
  onChange 
}: { 
  questionId: string; 
  initialValue: string; 
  onChange: (lines: string[]) => void; 
}) {
  const [lines, setLines] = useState<string[]>(() => {
    if (initialValue && initialValue.trim()) {
      return initialValue.split('\n').filter(line => line.trim() !== '');
    }
    return [''];
  });

  // 当initialValue改变时更新lines状态
  useEffect(() => {
    if (initialValue && initialValue.trim()) {
      const newLines = initialValue.split('\n').filter(line => line.trim() !== '');
      setLines(newLines.length > 0 ? newLines : ['']);
    } else {
      setLines(['']);
    }
  }, [initialValue, questionId]); // 添加questionId作为依赖

  const addLine = () => {
    const newLines = [...lines, ''];
    setLines(newLines);
    onChange(newLines.filter(line => line.trim() !== '')); // 只传递非空行
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      const newLines = lines.filter((_, i) => i !== index);
      setLines(newLines);
      onChange(newLines.filter(line => line.trim() !== '')); // 只传递非空行
    }
  };

  const updateLine = (index: number, value: string) => {
    const newLines = [...lines];
    newLines[index] = value;
    setLines(newLines);
    onChange(newLines.filter(line => line.trim() !== '')); // 只传递非空行
  };

  return (
    <div className="space-y-3">
      {lines.map((line, index) => (
        <div key={`${questionId}-line-${index}`} className="flex items-center space-x-2">
          <Input
            value={line}
            onChange={(e) => updateLine(index, e.target.value)}
            placeholder={`Idea ${index + 1}`}
            className="flex-1"
          />
          {lines.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeLine(index)}
              className="p-2 hover:bg-red-50 hover:border-red-200"
            >
              <X className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addLine}
        className="flex items-center space-x-2 text-blue-600 hover:bg-blue-50 hover:border-blue-200"
      >
        <Plus className="h-4 w-4" />
        <span>Add another line</span>
      </Button>
    </div>
  );
}

const sections: Section[] = [
  {
    id: 'section1',
    title: 'ABOUT YOU',
    questions: [
      {
        id: 'Q1',
        text: 'Your first language',
        type: 'radio-with-other',
        required: true,
        options: ['English', 'Spanish', 'Chinese', 'Italian', 'French', 'Other'],
      },
      {
        id: 'Q2',
        text: 'Your usual country of residence',
        type: 'radio-with-other',
        required: true,
        options: ['China', 'Australia', 'US', 'UK', 'Other'],
      },
      {
        id: 'Q3',
        text: 'Your age',
        type: 'radio-with-other',
        required: true,
        options: ['13+', '14+', '15+', '16+', '17+', '18+', '19+', 'Other'],
      },
      {
        id: 'Q4',
        text: 'Which school year are you in?',
        type: 'radio-with-other',
        required: true,
        options: ['Year 9', 'Year 10', 'Year 11', 'Year 12', 'Other'],
      },
      {
        id: 'Q5',
        text: 'In which country is your school located?',
        type: 'radio-with-other',
        required: true,
        options: ['Australia', 'UK', 'China', 'US', 'Canada', 'Other'],
      },
      {
        id: 'Q6',
        text: "Your parent's email",
        type: 'text',
        required: true,
      },
      {
        id: 'Q7',
        text: "Your name",
        type: 'text',
        required: true,
      },
    ],
  },
  {
    id: 'section2',
    title: 'YOUR VALUES',
    questions: [
      {
        id: 'Q8',
        image: '/images/Q8.png',
        text: `If you won a lot of money on the lottery (assuming you're now 18), what would you do first?`,
        description: 'Rank in order from 1 (Most Likely) to 6 (Least Likely).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'Go out and celebrate, celebrate, celebrate!', tag: 'H' },
          { text: 'Buy that car, big house, and those other luxuries you\'ve always wanted', tag: 'P' },
          { text: 'Pay off the debts of family & friends and support a charity close to your heart', tag: 'A' },
          { text: 'Invest it in your education', tag: 'L' },
          { text: 'Set up your own business', tag: 'F' },
          { text: 'Get financial advice - invest wisely in a secure savings plan and give some to parents/family for safe-keeping', tag: 'S' }
        ],
      },
      {
        id: 'Q9',
        image: '/images/Q9.png',
        text: 'Who would you prefer as a dinner guest (living or dead)?',
        description: 'Rank in order from 1 (Most Prefer) to 6 (Most Avoid).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'A well-known celebrity or social media star', tag: 'H' },
          { text: 'A president, prime minister, or world leader', tag: 'L' },
          { text: 'A campaigner for human rights or spiritual/religious leader', tag: 'A' },
          { text: 'A Nobel prize winning academic or chancellor/professor of a top university', tag: 'S' },
          { text: 'A rich and successful entrepreneur/businessperson', tag: 'P' },
          { text: 'A close friend or family member', tag: 'F' }
        ],
      },
      {
        id: 'Q10',
        image: '/images/Q10.png',
        text: 'What would you prefer to receive from a relative as a gift, assuming a £200 budget?',
        description: 'Rank in order from 1 (Best Gift) to 6 (Worst).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'A treat of your choice (e.g. meal out, day at a theme park, ticket for a sports event/concert/festival)', tag: 'H' },
          { text: 'Something you can show off to your friends (e.g. new trainers, watch, designer item)', tag: 'P' },
          { text: 'A contribution to a fundraiser for a charity of your choice', tag: 'A' },
          { text: 'A voucher for some books, tutoring or resources to help with your academic studies', tag: 'S' },
          { text: 'A ticket to a seminar or workshop on how to set up a successful business', tag: 'L' },
          { text: 'Money for your savings account', tag: 'F' }
        ],
      },
      {
        id: 'Q11',
        image: '/images/Q11.png',
        text: 'Which of these sayings and quotes is most likely to inspire you?',
        description: 'Rank in order from 1 (Most Inspiring) to 6 (Least Inspiring).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'Life is short, so have fun and enjoy it to the fullest', tag: 'H' },
          { text: 'A leader is one who knows the way, goes the way, and shows the way', tag: 'L' },
          { text: 'Be kind whenever possible. It is always possible', tag: 'A' },
          { text: 'The great thing about learning and knowledge is that no-one can ever take it away from you', tag: 'S' },
          { text: 'In order to become rich, you must believe you can do it, and take action to reach your goals', tag: 'P' },
          { text: 'Always look before you leap - Carefulness costs you nothing, but carelessness may cost you your life', tag: 'F' }
        ],
      },
      {
        id: 'Q12',
        image: '/images/Q12.png',
        text: `Assume you're around 10 years older, ready to settle down, single but looking for a partner for life – apart from looks/attractiveness, which of the following traits would appeal most?`,
        description: 'Rank in order from 1 (Most Important) to 6 (Least Important).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'Funny, entertaining, exciting, and with a good sense of humour', tag: 'H' },
          { text: 'Ambitious, decisive, a natural leader who is driven to be the best', tag: 'L' },
          { text: 'Kind, caring, tolerant and supportive', tag: 'F' },
          { text: 'Intelligence – someone intellectually stimulating who can challenge me and who I can learn from', tag: 'A' },
          { text: 'A wealthy person with a nice house/car etc, but who is also good with money', tag: 'P' },
          { text: 'Loyal, faithful, honest, organised, and reliable', tag: 'S' }
        ],
      },
      {
        id: 'Q13',
        image: '/images/Q13.png',
        text: 'Imagine you have advanced in life and have made some big achievements. Your school wants to invite you back to give a speech to the students. You are being introduced by your head teacher. How would you like to be described?',
        description: 'Rank in order from 1 (Closest to you) to 6 (Furthest).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'A fun person who lived life on the edge', tag: 'H' },
          { text: 'A successful leader who drove themselves to the top', tag: 'L' },
          { text: 'A caring person who put others first and made a positive difference to those in need', tag: 'A' },
          { text: 'An inspirational scholar whose research and discoveries led to great progress in their specialist field', tag: 'S' },
          { text: 'A great businessperson who made it to the rich list', tag: 'P' },
          { text: 'A trustworthy and reliable person with high integrity. They played by the rules and delivered on their word', tag: 'F' }
        ],
      },
      {
        id: 'Q14',
        image: '/images/Q14.png',
        text: 'The image shows a war memorial defaced',
        description: 'Rank the feelings from 1 (Most Accurate) to 6 (Least Accurate)',
        type: 'ranking',
        required: true,
        options: [
          { text: 'Funny – I wish I\'d done this!', tag: 'H' },
          { text: 'Disrespectful – this man must have been a great leader who sacrificed a lot; he deserves to be honoured', tag: 'L' },
          { text: 'Degrading and Cruel – the poor man would be devastated to see this if he were alive today', tag: 'F' },
          { text: 'Confusing – why has this been vandalised? I\'d like to do more research on this', tag: 'S' },
          { text: 'Wasteful – this is going to cost a lot of money and time to put right', tag: 'P' },
          { text: 'Stupid and annoying - this statue has been part of the community for a long time, why change it now? Is this legal?', tag: 'A' }
        ],
      },
      {
        id: 'Q15',
        image: '/images/Q15.png',
        text: 'On leaving your school or college, which quote and class vote would you be most pleased to receive?',
        description: 'Rank from 1 (Closest) to 6 (Furthest).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'Cheekiest but funniest class member. Most likely to be an entertainer or media star, or to surprise us all!', tag: 'H' },
          { text: 'Head pupil and class leader – most likely to be CEO or leader of their chosen profession', tag: 'L' },
          { text: 'Most supportive, helpful team player and all-round good person. Most likely to make a positive difference to others\' lives', tag: 'A' },
          { text: 'Top of the class and super brainy – most likely to be professor in their chosen field at a top university', tag: 'S' },
          { text: 'Whatever you wanted, they found it for you – at a price. Most likely to be a rich and successful entrepreneur or businessperson', tag: 'P' },
          { text: 'Best attendance and behaviour - loved by all the teachers! Most likely to be a model citizen for the community and a good family person.', tag: 'F' }
        ],
      },
      {
        id: 'Q16',
        image: '/images/Q16.png',
        text: `Imagine you're a parent of school age children. What key advice would you give them on their first day?`,
        description: 'Rank from 1 (Most Likely to say) to 6 (Least Likely).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'The most important thing is to have fun and enjoy it', tag: 'H' },
          { text: 'Prove that you\'re the best – strive for success and you\'ll win!', tag: 'L' },
          { text: 'Always be kind to others and be a friend to everyone.', tag: 'A' },
          { text: 'Make the most of the learning opportunities and learn all you can.', tag: 'S' },
          { text: 'Think of this as an investment – the hard work will pay off in the future.', tag: 'P' },
          { text: 'Make sure you stay out of trouble and always listen to your teachers – they know best.', tag: 'F' }
        ],
      },
      {
        id: 'Q17',
        image: '/images/Q17.png',
        text: 'Which comment would you be most pleased to receive by your boss/manager on your performance appraisal when you begin your career.',
        description: 'Rank from 1 (Most Pleased) to 6 (Least Pleased).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'Great fun to work with and sets a positive team spirit', tag: 'H' },
          { text: 'A natural leader who drives the team forward', tag: 'L' },
          { text: 'Kind, supportive team member – popular and always happy to help out', tag: 'A' },
          { text: 'Super-bright, a good problem solver who picks new information up quickly', tag: 'S' },
          { text: 'Very commercial, cost-conscious, adds value, brings in income money-maker and with great earning potential', tag: 'P' },
          { text: 'Reliable and conscientious, delivers on their promises', tag: 'F' }
        ],
      },
    ],
  },
  {
    id: 'section3',
    title: 'YOUR INTERESTS',
    questions: [
      {
        id: 'Q18',
        image: '/images/Q18.png',
        text: 'When visiting a book shop or library, which section would you prefer to visit?',
        description: 'Rank in order from 1 (First Choice) to 6 (Last Choice).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'Arts, music, film & literature', tag: 'A'},
          { text: 'Business, politics & leadership', tag: 'E'},
          { text: 'Well-being, psychology & self-help', tag: 'S'},
          { text: 'Nature, geography, sports & the outdoors', tag: 'R'},
          { text: 'Other non-fiction books, guides & manuals (e.g. revision guides, IT & computing, planning events, etc.)', tag: 'C' },
          { text: 'Science – either fiction or non-fiction', tag: 'I' }
        ],
      },
      {
        id: 'Q19',
        image: '/images/Q19.png',
        text: 'Which podcast category are you most likely to tap into?',
        description: 'Rank in order from 1 (First Choice) to 6 (Last Choice).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'Comedy', tag: 'A' },
          { text: 'Business & leadership', tag: 'E' },
          { text: 'Social issues and current affairs', tag: 'S' },
          { text: 'Sports and outdoor pursuits', tag: 'R' },
          { text: 'Organisation, productivity and/or managing money', tag: 'C' },
          { text: 'Science, research & discovery', tag: 'I' }
        ],
      },
      {
        id: 'Q20',
        image: '/images/Q20.png',
        text: 'If you were asked to design and deliver a workshop, which would you be best qualified for?',
        description: 'Rank in order from 1 (First Choice) to 6 (Last Choice).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'Something creative – photography, design, or music', tag: 'A' },
          { text: 'How to persuade and influence people', tag: 'E' },
          { text: 'Improving interpersonal skills', tag: 'S' },
          { text: 'An outdoor exercise programme or coaching session for your favourite sport', tag: 'R' },
          { text: 'Managing your money and time', tag: 'C' },
          { text: 'Improve problem-solving and analytical skills', tag: 'I' }
        ],
      },
      {
        id: 'Q21',
        image: '/images/Q21.png',
        text: 'Ideal day out',
        description: 'Rank in order from 1 (First Choice) to 6 (Last Choice).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'An art gallery, a cinema, the theatre – something entertaining', tag: 'A' },
          { text: 'I\'d love to do a competitive group challenge (e.g. an escape room) where I lead the group to success!', tag: 'E' },
          { text: 'A party or social gathering with my friends and where I can meet new people', tag: 'S' },
          { text: 'A wildlife park or trek around a nature reserve', tag: 'R' },
          { text: 'Anything that is good value for money, booked in advance and well organised (ideally by me!)', tag: 'C' },
          { text: 'A science or history museum or historical site', tag: 'I' }
        ],
      },
      {
        id: 'Q22',
        image: '/images/Q22.png',
        text: 'What hobby or skill have you always wanted to try or develop if you had the time?',
        description: 'Rank in order from 1 (First Choice) to 6 (Last Choice).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'Baking, a new art form, creative writing, a craft, photography or learning a new musical instrument', tag: 'A' },
          { text: 'Practice my debating and influencing skills or try my hand at public speaking', tag: 'E' },
          { text: 'Voluntary work or team activity where I can work with and support others', tag: 'S' },
          { text: 'I\'d love to learn a new sport, or try an outdoors activity', tag: 'R' },
          { text: 'Develop my IT and/or budget management skills (e.g. learn a new software package or financial system)', tag: 'C' },
          { text: 'Research that niche topic I\'ve always been meaning to look into', tag: 'I' }
        ],
      },
      {
        id: 'Q23',
        image: '/images/Q23.png',
        text: 'What kind of holiday do you most prefer?',
        description: 'Rank in order from 1 (First Choice) to 6 (Last Choice).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'Nothing too formal - I\'m up for a surprise. A relaxed atmosphere where I can do stuff in my own time (e.g. daydream, listen to my music, write, draw etc.) would be ideal!', tag: 'A' },
          { text: 'A city break where I can explore – the holiday\'s not for relaxing - it\'s for adventure', tag: 'E' },
          { text: 'A resort, venue or hotel with social events and activities where I can people watch, mix and make new friends.', tag: 'S' },
          { text: 'Somewhere outdoors – a rural area where I can hike and do other physical activities', tag: 'R' },
          { text: 'Somewhere I\'ve been before which is safe and guaranteed to be great. Otherwise, I\'d plan the whole trip – I need to make sure everything\'s set up in advance', tag: 'C' },
          { text: 'Somewhere new where I can learn about the culture, history and language', tag: 'I' }
        ],
      },
      {
        id: 'Q24',
        image: '/images/Q24.png',
        text: 'Which group of TV shows are you most likely to watch?',
        description: 'Rank in order from 1 (First Choice) to 6 (Last Choice).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'A show where I can watch people create things or showcase their talents (e.g. Interior Design Challenge, Young Musician of the Year)', tag: 'A' },
          { text: 'Business shows where I can watch how the professionals work (e.g. Dragon\'s Den, The Apprentice, Start Up)', tag: 'E' },
          { text: 'A reality or game show where I can watch people solve problems, build relationships and work as a team  (e.g. The Crystal Maze, Big Brother, Traitors, The Mole)', tag: 'S' },
          { text: 'Wildlife, nature or survival skills documentaries where I can see people work outdoors or with plants and animals (e.g. Blue Planet, Life on Earth, The Farm)', tag: 'R' },
          { text: 'An investigative programme about consumers rights and illegal activity (e.g. Watchdog, Scam Interceptors, Crimewatch)', tag: 'C' },
          { text: 'A quiz show where I can test my knowledge (e.g. Mastermind, University Challenge)', tag: 'I' }
        ],
      },
      {
        id: 'Q25',
        image: '/images/Q25.png',
        text: 'Which type of workplace would you prefer to work in?',
        description: 'Rank in order from 1 (First Choice) to 6 (Last Choice).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'A workplace that is has a more informal, flexible and less conventional or creative atmosphere - I work best outside of a set structure', tag: 'A' },
          { text: 'Somewhere that allows me to demonstrate my leadership, selling, and management skills', tag: 'E' },
          { text: 'A friendly and open environment where I can interact with others and/or work as a team', tag: 'S' },
          { text: 'A workplace that values technical or practical skills and/or where I can go outside and am not stuck in an office all day', tag: 'R' },
          { text: 'I need a structured place with clear expectations and standards where I can use my organisational skills', tag: 'C' },
          { text: 'Somewhere which values analytical skills and intellect which allows me to work independently to research and solve problems.', tag: 'I' }
        ],
      },
      {
        id: 'Q26',
        image: '/images/Q26.png',
        text: 'Assuming money/income is not a key issue for you, which of the following is closest to your dream career? ',
        description: 'Rank in order from 1 (First Choice) to 6 (Last Choice).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'Designer or Artist (including actor, musician, writer/author)', tag: 'A' },
          { text: 'Businessperson, entrepreneur or sales/marketing director', tag: 'E' },
          { text: 'Healthcare, public sector or charity worker', tag: 'S' },
          { text: 'Professional sportsperson, armed forces or police officer', tag: 'R' },
          { text: 'Lawyer, accountant or IT professional', tag: 'C' },
          { text: 'Researcher in your chosen field', tag: 'I' }
        ],
      },
      {
        id: 'Q27',
        text: 'Practicality is more important than how something looks',
        description: 'Choose one box to tick that you agree with most. Try and avoid the neutral option if possible.',
        type: 'radio-with-other',
        required: true,
        options: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
      },
      {
        id: 'Q28',
        text: 'I dislike schedules – I prefer being flexible than too organised',
        description: 'Choose one box to tick that you agree with most. Try and avoid the neutral option if possible.',
        type: 'radio-with-other',
        required: true,
        options: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
      },
      {
        id: 'Q29',
        text: 'I value my intellect over my interpersonal skills',
        description: 'Choose one box to tick that you agree with most. Try and avoid the neutral option if possible.',
        type: 'radio-with-other',
        required: true,
        options: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
      },
      {
        id: 'Q30',
        text: 'I enjoy persuading and influencing people',
        description: 'Choose one box to tick that you agree with most. Try and avoid the neutral option if possible.',
        type: 'radio-with-other',
        required: true,
        options: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
      },
      {
        id: 'Q31',
        text: "I'm better with people than I am with practical tasks and equipment",
        description: "Choose one box to tick that you agree with most. Try and avoid the neutral option if possible.",
        type: "radio-with-other",
        required: true,
        options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
      },
      {
        id: 'Q32',
        text: "I'd rather follow instructions than give them",
        description: "Choose one box to tick that you agree with most. Try and avoid the neutral option if possible.",
        type: "radio-with-other",
        required: true,
        options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
      },
    ],
  },
  {
    id: 'section4',
    title: 'PERSONALITY & STYLE QUESTIONS',
    questions: [
      {
        id: 'Q33',
        text: 'I like to keep my feelings to myself rather than sharing them with everyone (EI)',
        description: 'Choose one box to tick to rate your agreement with each statement. Avoid using the neutral/middle option if possible.',
        type: 'radio-with-other',
        required: true,
        options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
      },
      {
        id: 'Q34',
        text: "I'm often the person my friends rely on to organise things (PJ)",
        description: "Choose one box to tick to rate your agreement with each statement. Avoid using the neutral/middle option if possible.",
        type: "radio-with-other",
        required: true,
        options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
      },
      {
        id: 'Q35',
        text: "After a busy week, I'd rather relax by spending time with my friends than on my own (IE)",
        description: "Choose one box to tick to rate your agreement with each statement. Avoid using the neutral/middle option if possible.",
        type: "radio-with-other",
        required: true,
        options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
      },
      {
        id: 'Q36',
        text: 'I prefer learning about facts and details rather than theories and ideas (NS)',
        description: 'Choose one box to tick to rate your agreement with each statement. Avoid using the neutral/middle option if possible.',
        type: 'radio-with-other',
        required: true,
        options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
      },
      {
        id: 'Q37',
        text: "It's important to show kindness and respect for people, even if you don't like or understand them (TF)",
        description: "Choose one box to tick to rate your agreement with each statement. Avoid using the neutral/middle option if possible.",
        type: "radio-with-other",
        required: true,
        options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
      },
      {
        id: 'Q38',
        text: 'I tend to plan and start tasks early rather than leaving them to the last minute (PJ)',
        description: 'Choose one box to tick to rate your agreement with each statement. Avoid using the neutral/middle option if possible.',
        type: 'radio-with-other',
        required: true,
        options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
      },
      {
        id: 'Q39',
        text: "I am more concerned about fairness over people's feelings (FT)",
        description: "Choose one box to tick to rate your agreement with each statement. Avoid using the neutral/middle option if possible.",
        type: "radio-with-other",
        required: true,
        options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
      },
      {
        id: 'Q40',
        text: "I think it's better to be imaginative than practical (SN)",
        description: "Choose one box to tick to rate your agreement with each statement. Avoid using the neutral/middle option if possible.",
        type: "radio-with-other",
        required: true,
        options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
      },
      {
        id: 'Q41',
        text: 'I find pre-planned events and schedules restricting (JP)',
        description: 'Choose one box to tick to rate your agreement with each statement. Avoid using the neutral/middle option if possible.',
        type: 'radio-with-other',
        required: true,
        options: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
      },
      {
        id: 'Q42',
        text: 'I prefer to have a close friendship with less people than a broad relationship with many people (EI)',
        description: 'Choose one box to tick to rate your agreement with each statement. Avoid using the neutral/middle option if possible.',
        type: 'radio-with-other',
        required: true,
        options: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
      },
      {
        id: 'Q43',
        text: "I dislike it when fiction writers don't say exactly what they mean (NS)",
        description: "Choose one box to tick to rate your agreement with each statement. Avoid using the neutral/middle option if possible.",
        type: "radio-with-other",
        required: true,
        options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
      },
      {
        id: 'Q44',
        text: 'When I have to decide something important, I tend to trust my head rather than follow my heart (FT)',
        description: 'Choose one box to tick to rate your agreement with each statement. Avoid using the neutral/middle option if possible.',
        type: 'radio-with-other',
        required: true,
        options: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
      },
    ],
  },
  {
    id: 'section5',
    title: 'LATERAL THINKING',
    questions: [
      {
        id: 'instructions',
        text: '',
        description: '',
        type: 'instructions',
        required: false,
        instructionContent: {
          mainText: 'This is a test of your ability to come up with solutions or ideas to different problem situations. You will be given ',
          boldText: 'three',
          continueText: ' situations for which you must generate as many ideas as possible.',
          timeSection: {
            text: 'These questions are untimed, but we suggest you spend around ',
            boldTime: '5 minutes',
            italicText: ' on each question (6 minutes if you are allowed extra time in your exams – e.g. English not your first language, dyslexia, other neurodiversity issues etc.)',
            endText: ' but you can stop at any time if you have run out of ideas.'
          },
          ideaSection: {
            text: 'Try to cover as many aspects of each problem or situation as possible, and try and come up with a range of different ideas – they can be as ',
            boldWords: ['wild', 'weird'],
            endText: ' as you like!'
          },
          bulletPoints: [
            { text: 'Write each answer on a separate line.' },
            { text: 'Be as wild, wacky or weird in your answers as you wish!' },
            {
              text: 'Work as quickly as you can – your answers will be scored for ',
              boldItems: [
                { text: 'Volume', description: ' (number) ' },
                { text: 'Variety', description: ' (breadth of answers) ' },
                { text: 'Vision', description: ' (originality)' }
              ]
            }
          ],
          finalNote: {
            text: 'Please complete the following ',
            boldWord: 'example',
            continueText: ' question for only ',
            boldTime: '3 minutes',
            endText: ', which will help get you into the right frame of mind before you complete the real questions.'
          }
        }
      },
      {
        id: 'Q45',
        text: 'Practice Question',
        description: `There has been a 30% drop in use of the food canteen/restaurant within one of the high schools in your area over the past six months.
You have been asked to make some suggestions to solve the problem. List as many potential ideas as you can. Remember to come up with a range of different ideas – no matter how silly they seem!`,
        type: 'text',
        required: true,
      },
      {
        id: 'Q46',
        text: 'Please read the following problem',
        description: `Assume that you have a 13-year-old cousin who is feeling really sad because their school head-teacher (a 40 year old woman) is leaving. She had only started working at the school less than a year ago. Everyone seemed to like her a lot, and she was doing a great job. But now, she's leaving all of a sudden, and nobody knows why - it's a total mystery!`,
        type: 'text',
        required: true,
      },
      {
        id: 'Q47',
        text: 'Please read the following problem',
        description: 'Due to the increasing popularity of summer music festivals since Covid, last year "Harmony Fest" launched in a brand-new location following this gap in the market. However, many of the attendees complained about how bad it was, and this year, ticket sales are down by 40%. ',
        type: 'text',
        required: true,
      },
      {
        id: 'Q48',
        text: 'Please read the following problem',
        description: "One of your relatives owns a chain of successful baker's shops selling traditional baked goods and sandwiches. The most recent shop they opened has proved to be a disaster.",
        type: 'text',
        required: true,
      },
    ],
  },
  {
    id: 'section6',
    title: 'YOUR STUDY STYLE AND CAREER',
    questions: [
      {
        id: 'Q49',
        text: 'If you had to choose one assessment method, which would you prefer?',
        type: 'radio-with-other',
        required: true,
        options: [
          'Write essays',
          'Take exams',
          'A combination of both'
        ],
      },
      {
        id: 'Q50',
        text: 'What are your most favourite subjects and why?',
        type: 'text',
        required: true,
      },
      {
        id: 'Q51',
        text: 'What are your least favourite subjects and why?',
        type: 'text',
        required: true,
      },
      {
        id: 'Q52',
        text: 'How do you spend your spare/leisure time?',
        description: 'Do you have anything you found particularly easy or difficult in general?',
        type: 'text',
        required: true,
      },
      {
        id: 'Q53',
        text: 'If money / family circumstances / location were no object, what would be your ideal career?',
        type: 'text',
        required: true,
      },
      {
        id: 'Q54',
        text: 'What are your parental expectations/hopes for your career choice?',
        type: 'text',
        required: true,
      },
      {
        id: 'Q55',
        text: "What are your parent(s)' current or previous careers/occupations?",
        description: 'And has this had any impact on you?',
        type: 'text',
        required: true,
      },
    ],
  },
];

function SortableItem({ id, children, index }: { id: string; children: React.ReactNode; index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-2 bg-white p-3 rounded-lg shadow-sm cursor-move hover:bg-gray-50 active:bg-gray-100 select-none touch-none"
    >
      <span className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full font-bold">
        {index + 1}
      </span>
      <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
      <span className="flex-1">{children}</span>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const [showNextError, setShowNextError] = useState(false);
  const [answers, setAnswers] = useState<Record<string, { value: string; otherValue?: string }>>({});
  const [surveyRecordId, setSurveyRecordId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 设置为 true 开启测试模式，false 关闭测试模式
  const isTestMode = true;

  // 检查问题是否已答
  const isQuestionAnswered = useCallback((questionId: string) => {
    const answer = answers[questionId];
    if (!answer) return false;
    
    const question = sections.flatMap(s => s.questions).find(q => q.id === questionId);
    if (!question) return false;

    if (question.type === 'text') {
      return (answer.value || '').trim() !== '';
    }
    
    if (question.type === 'radio-with-other') {
      if (answer.value === 'Other') {
        return (answer.otherValue || '').trim() !== '';
      }
      return !!answer.value;
    }

    if (question.type === 'ranking') {
      try {
        const parsedValue = JSON.parse(answer.value);
        return Array.isArray(parsedValue) && parsedValue.length === question.options?.length;
      } catch {
        return false;
      }
    }

    return true;
  }, [answers]);

  // 检查是否可以跳转到指定问题
  const canNavigateToQuestion = useCallback((sectionIndex: number, questionIndex: number) => {
    if (isTestMode) return true;
    
    // 如果是当前问题之前的题目，允许跳转
    if (sectionIndex < currentSectionIndex || 
        (sectionIndex === currentSectionIndex && questionIndex <= currentQuestionIndex)) {
      return true;
    }
    
    // 检查从当前位置到目标位置之前的所有题目是否都已答完
    for (let si = currentSectionIndex; si <= sectionIndex; si++) {
      const sectionQuestions = sections[si].questions;
      const startIdx = si === currentSectionIndex ? currentQuestionIndex : 0;
      const endIdx = si === sectionIndex ? questionIndex - 1 : sectionQuestions.length - 1;
      
      for (let qi = startIdx; qi <= endIdx; qi++) {
        if (!isQuestionAnswered(sectionQuestions[qi].id)) {
          return false;
        }
      }
    }
    
    return true;
  }, [currentSectionIndex, currentQuestionIndex, isTestMode, isQuestionAnswered]);

  const form = useForm<FormValues>({
    defaultValues: {
      answers: {},
    },
  });

  const currentSection = sections[currentSectionIndex];
  const currentQuestion = currentSection?.questions[currentQuestionIndex];
  const totalQuestions = sections.reduce((total, section) => total + section.questions.length, 0);
  const questionsBeforeCurrentSection = sections
    .slice(0, currentSectionIndex)
    .reduce((total, section) => total + section.questions.length, 0);
  const currentQuestionNumber = questionsBeforeCurrentSection + currentQuestionIndex + 1;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const initializeUser = async () => {
      const user = localStorage.getItem('currentUser');
      if (!user) {
        router.push('/login');
        return;
      }
      
      try {
        const userData = JSON.parse(user);
        setIsAuthenticated(true);
        
        // 尝试恢复进度
        const progressRecord = await restoreProgress(userData.id);
        if (progressRecord) {
          console.log("已恢复保存的进度:", progressRecord);
        } else {
          console.log("没有找到保存的进度，从第一题开始");
        }
      } catch (e) {
        console.error("初始化用户数据失败:", e);
        router.push('/login');
      }
    };

    initializeUser();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('surveyDraft');
    localStorage.removeItem('submitted');
    setIsAuthenticated(false);
    router.push('/login');
  };

  // 每次问题改变时重置表单状态
  useEffect(() => {
    if (currentQuestion) {
      // 如果这个问题已经有答案了，就显示答案
      if (answers[currentQuestion.id]) {
        console.log(`设置问题 ${currentQuestion.id} 的答案:`, answers[currentQuestion.id]);
        form.setValue(`answers.${currentQuestion.id}`, answers[currentQuestion.id]);
      } else {
        // 清空表单字段
        form.setValue(`answers.${currentQuestion.id}`, { value: '', otherValue: '' });
      }
    }
  }, [currentQuestionIndex, currentSectionIndex, currentQuestion?.id, answers, form]);

  const handleAnswerChange = (questionId: string, value: string, otherValue?: string) => {
    const newAnswer = { value, otherValue };
    setAnswers(prev => ({
      ...prev,
      [questionId]: newAnswer
    }));
    form.setValue(`answers.${questionId}`, newAnswer);
  };

  // 处理多行文本输入的函数
  const handleMultiLineTextChange = (questionId: string, lines: string[]) => {
    // 过滤掉空行，然后用换行符连接
    const filteredLines = lines.filter(line => line.trim() !== '');
    const newAnswer = { value: filteredLines.join('\n') };
    setAnswers(prev => ({
      ...prev,
      [questionId]: newAnswer
    }));
    form.setValue(`answers.${questionId}`, newAnswer);
  };

  // 计算当前步骤（全局问题编号）
  const getCurrentStep = () => {
    const questionsBeforeCurrentSection = sections
      .slice(0, currentSectionIndex)
      .reduce((total, section) => total + section.questions.length, 0);
    return questionsBeforeCurrentSection + currentQuestionIndex + 1;
  };

  // 保存进度到数据库
  const saveProgress = async (showToast = true) => {
    try {
      setIsLoading(true);
      
      const userString = localStorage.getItem('currentUser');
      if (!userString) {
        console.error("用户未登录 - localStorage中没有currentUser");
        toast({
          title: "Error",
          description: "User not logged in"
        });
        return false;
      }

      const user = JSON.parse(userString);
      console.log("=== SAVE PROGRESS DEBUG START ===");
      console.log("Raw user object:", user);
      console.log("User ID:", user.id);
      console.log("User ID type:", typeof user.id);
      
      // Validate user ID format (should be UUID)
      if (!user.id || typeof user.id !== 'string') {
        console.error("Invalid user ID:", user.id);
        toast({
          title: "Error",
          description: "Invalid user ID"
        });
        return false;
      }

      // Check if user ID looks like a UUID (basic validation)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(user.id)) {
        console.error("User ID is not a valid UUID format:", user.id);
        toast({
          title: "Error", 
          description: "Invalid user ID format"
        });
        return false;
      }

      const currentStep = getCurrentStep();

      console.log("=== CURRENT STEP CALCULATION DEBUG ===");
      console.log("currentSectionIndex:", currentSectionIndex);
      console.log("currentQuestionIndex:", currentQuestionIndex);
      console.log("sections.length:", sections.length);
      
      // Debug section calculation
      const questionsBeforeCurrentSection = sections
        .slice(0, currentSectionIndex)
        .reduce((total, section) => {
          console.log(`Section ${section.title}: ${section.questions.length} questions`);
          return total + section.questions.length;
        }, 0);
      
      console.log("questionsBeforeCurrentSection:", questionsBeforeCurrentSection);
      console.log("calculated currentStep:", questionsBeforeCurrentSection + currentQuestionIndex + 1);
      
      if (sections[currentSectionIndex] && sections[currentSectionIndex].questions[currentQuestionIndex]) {
        const currentQuestion = sections[currentSectionIndex].questions[currentQuestionIndex];
        console.log("Current question:", currentQuestion.id, "-", currentQuestion.text.substring(0, 50) + "...");
      }
      console.log("=== END CURRENT STEP DEBUG ===");

      // Ensure answers is properly formatted
      const answersToSave = Object.keys(answers).length > 0 ? answers : {};
      
      const progressData = {
        user_id: user.id,
        answers: JSON.stringify(answersToSave),
        current_step: currentStep,
        is_completed: false,
        last_saved_time: new Date().toISOString()
      };

      console.log("Current step:", currentStep);
      console.log("Answers to save:", answersToSave);
      console.log("Progress data:", progressData);
      console.log("Survey record ID:", surveyRecordId);

      let result;
      if (surveyRecordId) {
        // 更新现有记录
        console.log("Updating existing record with ID:", surveyRecordId);
        result = await supabase
          .from('survey_results')
          .update(progressData)
          .eq('id', surveyRecordId)
          .eq('user_id', user.id)
          .select();
      } else {
        // 查找是否已有未完成的记录
        console.log("Checking for existing incomplete record...");
        const existingResult = await supabase
          .from('survey_results')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_completed', false)
          .order('last_saved_time', { ascending: false })
          .limit(1);

        if (existingResult.data && existingResult.data.length > 0) {
          // 更新现有的未完成记录
          const existingId = existingResult.data[0].id;
          console.log("Updating existing incomplete record:", existingId);
          result = await supabase
            .from('survey_results')
            .update(progressData)
            .eq('id', existingId)
            .select();
          
          // 设置记录ID以便后续使用
          setSurveyRecordId(existingId);
        } else {
          // 创建新记录
          console.log("Creating new record with insert");
          result = await supabase
            .from('survey_results')
            .insert([progressData])
            .select();
            
          // 如果因为唯一约束失败，尝试再次查找并更新
          if (result.error && (result.error.code === '23505' || result.error.message?.includes('unique constraint'))) {
            console.log("Insert failed due to unique constraint, looking for existing record again");
            const retryExistingResult = await supabase
              .from('survey_results')
              .select('id')
              .eq('user_id', user.id)
              .eq('is_completed', false)
              .limit(1);
            
            if (retryExistingResult.data && retryExistingResult.data.length > 0) {
              const existingId = retryExistingResult.data[0].id;
              console.log("Found existing record on retry:", existingId, "- updating it");
              result = await supabase
                .from('survey_results')
                .update(progressData)
                .eq('id', existingId)
                .select();
              
              setSurveyRecordId(existingId);
            } else {
              console.error("Unique constraint error but no existing record found");
            }
          } else if (result.data && result.data.length > 0) {
            setSurveyRecordId(result.data[0].id);
          }
        }
      }

      console.log("Database operation result:", result);
      console.log("Result data:", result.data);
      console.log("Result error:", result.error);

      if (result.error) {
        console.error("Database save failed:", result.error);
        console.error("Error code:", result.error.code);
        console.error("Error message:", result.error.message);
        console.error("Error details:", result.error.details);
        
        // Provide more specific error messages
        let errorMessage = `Database error: ${result.error.message}`;
        if (result.error.code === '23503') {
          errorMessage = "User validation failed. Please log in again.";
        }
        
        toast({
          title: "Save Failed",
          description: errorMessage
        });
        return false;
      }

      // 如果是新创建的记录，保存记录ID
      if (result.data && result.data.length > 0) {
        const recordId = result.data[0].id;
        console.log("Setting survey record ID:", recordId);
        setSurveyRecordId(recordId);
      }

      console.log("=== DATA SAVED SUCCESSFULLY ===");

      if (showToast) {
        toast({
          title: "Success",
          description: "Progress saved successfully"
        });
      }

      return true;
    } catch (e) {
      console.error("Save progress exception:", e);
      toast({
        title: "Save Error",
        description: e instanceof Error ? e.message : "Unknown error"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 手动保存并退出
  const handleSaveAndExit = async () => {
    try {
      setIsLoading(true);
      console.log("开始保存并退出流程...");
      
      // 显示保存中的toast
      toast({
        title: "Saving...",
        description: "Please wait while we save your progress"
      });
      
      // 直接手动准备保存数据，而不是调用saveProgress
      // 这样可以确保我们使用当前的状态值
      const userString = localStorage.getItem('currentUser');
      if (!userString) {
        toast({
          title: "Error",
          description: "User not logged in"
        });
        setIsLoading(false);
        return;
      }
      
      const user = JSON.parse(userString);
      const currentStep = getCurrentStep(); // 计算当前步骤
      
      console.log("Current section:", currentSectionIndex, "Current question:", currentQuestionIndex);
      console.log("Current step for save & exit:", currentStep);
      
      const answersToSave = Object.keys(answers).length > 0 ? answers : {};
      
      const progressData = {
        user_id: user.id,
        answers: JSON.stringify(answersToSave),
        current_step: currentStep,
        is_completed: false,
        last_saved_time: new Date().toISOString()
      };
      
      console.log("Save & Exit data:", progressData);
      
      let result;
      if (surveyRecordId) {
        // 有记录ID，直接更新现有记录
        console.log("Save & Exit: Updating existing record with ID:", surveyRecordId);
        result = await supabase
          .from('survey_results')
          .update(progressData)
          .eq('id', surveyRecordId)
          .eq('user_id', user.id)
          .select();
      } else {
        // 没有记录ID，查找是否已有未完成的记录
        console.log("Save & Exit: Looking for existing incomplete record...");
        const existingResult = await supabase
          .from('survey_results')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_completed', false)
          .order('last_saved_time', { ascending: false })
          .limit(1);

        if (existingResult.data && existingResult.data.length > 0) {
          // 找到现有未完成记录，更新它
          const existingId = existingResult.data[0].id;
          console.log("Save & Exit: Found existing incomplete record:", existingId, "- updating it");
          result = await supabase
            .from('survey_results')
            .update(progressData)
            .eq('id', existingId)
            .select();
          
          // 设置记录ID以便后续使用
          setSurveyRecordId(existingId);
        } else {
          // 没有未完成记录，创建新记录
          console.log("Save & Exit: No incomplete record found, creating new one");
          result = await supabase
            .from('survey_results')
            .insert([progressData])
            .select();
            
          // 如果因为唯一约束失败，尝试再次查找并更新
          if (result.error && (result.error.code === '23505' || result.error.message?.includes('unique constraint'))) {
            console.log("Save & Exit: Insert failed due to unique constraint, looking for existing record again");
            const retryExistingResult = await supabase
              .from('survey_results')
              .select('id')
              .eq('user_id', user.id)
              .eq('is_completed', false)
              .limit(1);
            
            if (retryExistingResult.data && retryExistingResult.data.length > 0) {
              const existingId = retryExistingResult.data[0].id;
              console.log("Save & Exit: Found existing record on retry:", existingId, "- updating it");
              result = await supabase
                .from('survey_results')
                .update(progressData)
                .eq('id', existingId)
                .select();
              
              setSurveyRecordId(existingId);
            } else {
              console.error("Save & Exit: Unique constraint error but no existing record found");
            }
          } else if (result.data && result.data.length > 0) {
            setSurveyRecordId(result.data[0].id);
          }
        }
      }
      
      const success = !result.error;
      
      if (success) {
        console.log("数据保存成功，准备退出");
        
        // 延迟一下确保数据库操作完成
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 显示成功toast
        toast({
          title: "Progress Saved",
          description: "Your progress has been saved successfully"
        });
        
        // 再延迟一下让用户看到成功消息
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 保存成功后清除认证状态并跳转到登录页
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
        router.push('/login');
      } else {
        console.error("保存失败:", result.error);
        toast({
          title: "Save Failed",
          description: `Error: ${result.error?.message || result.error || "Unknown error"}`
        });
      }
    } catch (error) {
      console.error("保存并退出过程中出错:", error);
      toast({
        title: "Save Failed",
        description: "An error occurred while saving. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 恢复进度
  const restoreProgress = async (userId: string) => {
    try {
      console.log("开始恢复进度，用户ID:", userId);
      
      // First, clean up duplicate incomplete records - keep only the latest one
      const allIncompleteResult = await supabase
        .from('survey_results')
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', false)
        .order('last_saved_time', { ascending: false });

      if (allIncompleteResult.data && allIncompleteResult.data.length > 1) {
        console.log(`Found ${allIncompleteResult.data.length} incomplete records, cleaning up duplicates...`);
        
        // Keep the latest record, delete the rest
        const recordsToDelete = allIncompleteResult.data.slice(1);
        const idsToDelete = recordsToDelete.map(r => r.id);
        
        if (idsToDelete.length > 0) {
          const deleteResult = await supabase
            .from('survey_results')
            .delete()
            .in('id', idsToDelete);
          
          if (deleteResult.error) {
            console.error("Failed to clean up duplicate records:", deleteResult.error);
          } else {
            console.log(`Deleted ${idsToDelete.length} duplicate records`);
          }
        }
      }
      
      // Now get the single latest incomplete record
      const result = await supabase
        .from('survey_results')
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', false)
        .order('last_saved_time', { ascending: false })
        .limit(1);

      console.log("查询进度结果:", result);

      if (result.error) {
        console.error("查询进度失败:", result.error);
        return null;
      }

      if (result.data && result.data.length > 0) {
        const progressRecord = result.data[0];
        console.log("找到保存的进度记录:", progressRecord);
        
        // 恢复答案
        if (progressRecord.answers) {
          try {
            const savedAnswers = JSON.parse(progressRecord.answers);
            console.log("恢复的答案数据:", savedAnswers);
            setAnswers(savedAnswers);
          } catch (parseError) {
            console.error("解析保存的答案失败:", parseError);
          }
        }

        // 恢复当前步骤
        const currentStep = progressRecord.current_step || 1;
        let stepSectionIndex = 0;
        let stepQuestionIndex = 0;
        let questionsCount = 0;

        console.log("恢复到步骤:", currentStep);
        console.log("Total sections:", sections.length);

        // 找到对应的section和question index
        for (let sIndex = 0; sIndex < sections.length; sIndex++) {
          const sectionQuestionCount = sections[sIndex].questions.length;
          console.log(`Section ${sIndex}: ${sections[sIndex].title}, questions: ${sectionQuestionCount}`);
          
          if (questionsCount + sectionQuestionCount >= currentStep) {
            stepSectionIndex = sIndex;
            stepQuestionIndex = currentStep - questionsCount - 1;
            console.log(`Found at section ${sIndex}, question ${stepQuestionIndex} (step ${currentStep}, questions count ${questionsCount})`);
            break;
          }
          questionsCount += sectionQuestionCount;
        }
        
        // 边界检查，防止索引越界
        if (stepSectionIndex >= sections.length) {
          stepSectionIndex = sections.length - 1;
          stepQuestionIndex = sections[stepSectionIndex].questions.length - 1;
        }
        
        if (stepQuestionIndex >= sections[stepSectionIndex].questions.length) {
          stepQuestionIndex = sections[stepSectionIndex].questions.length - 1;
        }
        
        if (stepQuestionIndex < 0) stepQuestionIndex = 0;

        console.log("计算出的位置 - Section:", stepSectionIndex, "Question:", stepQuestionIndex);

        setCurrentSectionIndex(stepSectionIndex);
        setCurrentQuestionIndex(stepQuestionIndex);
        setSurveyRecordId(progressRecord.id);

        // Only show restoration toast if user has actually made progress (not first-time login)
        if (currentStep > 1) {
          toast({
            title: "Progress Restored",
            description: `Restored to question ${currentStep}. Continue your survey.`
          });
        }

        return progressRecord;
      } else {
        console.log("没有找到保存的进度记录");
        return null;
      }
    } catch (e) {
      console.error("恢复进度时发生错误:", e);
      return null;
    }
  };

  const validateCurrentAnswer = () => {
    if (isTestMode) return true; // 测试模式下跳过验证
    if (!currentQuestion) return true;
    
    const currentAnswer = answers[currentQuestion.id];
    
    if (currentQuestion.type === 'text') {
      return !currentQuestion.required || (currentAnswer?.value || '').trim() !== '';
    }
    
    if (currentQuestion.type === 'radio-with-other') {
      if (!currentAnswer?.value) return !currentQuestion.required;
      if (currentAnswer.value === 'Other') {
        return (currentAnswer.otherValue || '').trim() !== '';
      }
      return true;
    }

    if (currentQuestion.type === 'ranking') {
      if (!currentQuestion.required) return true;
      if (!currentAnswer?.value) return false;
      try {
        const parsedValue = JSON.parse(currentAnswer.value);
        return Array.isArray(parsedValue) && parsedValue.length === currentQuestion.options?.length;
      } catch {
        return false;
      }
    }
    
    return true;
  };

  const goToNextQuestion = async () => {
    if (!validateCurrentAnswer()) {
      setShowNextError(true);
      toast({
        title: "Error",
        description: currentQuestion.type === 'radio-with-other' && answers[currentQuestion.id]?.value === 'Other' 
          ? "Please specify your answer"
          : "This question is required.",
      });
      return;
    }

    setShowNextError(false);
    
    // 计算下一个问题的位置
    let nextQuestionIndex = currentQuestionIndex;
    let nextSectionIndex = currentSectionIndex;
    
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      nextQuestionIndex = currentQuestionIndex + 1;
    } else if (currentSectionIndex < sections.length - 1) {
      nextSectionIndex = currentSectionIndex + 1;
      nextQuestionIndex = 0;
    }
    
    // 先保存当前进度
    const currentStep = getCurrentStep() + 1; // 加1因为我们要保存"下一题"的位置
    console.log("Saving progress for next question - Section:", nextSectionIndex, "Question:", nextQuestionIndex, "Step:", currentStep);
    
    // 准备保存数据
    const userString = localStorage.getItem('currentUser');
    if (!userString) {
      toast({
        title: "Error",
        description: "User not logged in"
      });
      return;
    }
    
    const user = JSON.parse(userString);
    const answersToSave = Object.keys(answers).length > 0 ? answers : {};
    
    const progressData = {
      user_id: user.id,
      answers: JSON.stringify(answersToSave),
      current_step: currentStep,
      is_completed: false,
      last_saved_time: new Date().toISOString()
    };
    
    // 保存进度
    try {
      let result;
      if (surveyRecordId) {
        // 如果已有记录ID，直接更新
        console.log("Updating existing record with ID:", surveyRecordId);
        result = await supabase
          .from('survey_results')
          .update(progressData)
          .eq('id', surveyRecordId)
          .eq('user_id', user.id)
          .select();
      } else {
        // 没有记录ID，先查找是否已有未完成的记录
        console.log("Looking for existing incomplete record...");
        const existingResult = await supabase
          .from('survey_results')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_completed', false)
          .order('last_saved_time', { ascending: false })
          .limit(1);

        if (existingResult.data && existingResult.data.length > 0) {
          // 找到现有未完成记录，更新它
          const existingId = existingResult.data[0].id;
          console.log("Found existing incomplete record:", existingId, "- updating it");
          result = await supabase
            .from('survey_results')
            .update(progressData)
            .eq('id', existingId)
            .select();
          
          // 设置记录ID以便后续使用
          setSurveyRecordId(existingId);
        } else {
          // 没有未完成记录，尝试创建新记录
          console.log("No incomplete record found, creating new one");
          result = await supabase
            .from('survey_results')
            .insert([progressData])
            .select();
            
          // 如果因为唯一约束失败（可能是并发情况），尝试再次查找并更新
          if (result.error && (result.error.code === '23505' || result.error.message?.includes('unique constraint'))) {
            console.log("Insert failed due to unique constraint, looking for existing record again");
            const retryExistingResult = await supabase
              .from('survey_results')
              .select('id')
              .eq('user_id', user.id)
              .eq('is_completed', false)
              .limit(1);
            
            if (retryExistingResult.data && retryExistingResult.data.length > 0) {
              const existingId = retryExistingResult.data[0].id;
              console.log("Found existing record on retry:", existingId, "- updating it");
              result = await supabase
                .from('survey_results')
                .update(progressData)
                .eq('id', existingId)
                .select();
              
              setSurveyRecordId(existingId);
            } else {
              console.error("Unique constraint error but no existing record found");
            }
          } else if (result.data && result.data.length > 0) {
            setSurveyRecordId(result.data[0].id);
          }
        }
      }
    } catch (error) {
      console.error("Error saving progress:", error);
    }
    
    // 最后更新问题位置
    setCurrentQuestionIndex(nextQuestionIndex);
    if (nextSectionIndex !== currentSectionIndex) {
      setCurrentSectionIndex(nextSectionIndex);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      setCurrentQuestionIndex(sections[currentSectionIndex - 1].questions.length - 1);
    }
  };

  const handleSubmit = () => {
    localStorage.removeItem('surveyDraft');
    localStorage.setItem('submitted', 'true');
    setSubmitted(true);
    toast({
      title: "Success",
      description: "Survey submitted successfully",
    });
  };
  
  const submitSurvey = useCallback(async () => {
    try {
      // 1. Check user
      const userString = localStorage.getItem('currentUser');
      if (!userString) {
        toast({
          title: "Error",
          description: "User not logged in"
        });
        return;
      }
      
      // 2. Parse user data
      let user;
      try {
        user = JSON.parse(userString);
        console.log("User data:", user);
      } catch (e) {
        console.error("Failed to parse user data:", e);
        toast({
          title: "Error",
          description: "Invalid user data"
        });
        return;
      }
      
      // 3. Prepare submission data
      const actualData = {
        user_id: user.id,
        answers: JSON.stringify(answers),
        current_step: getCurrentStep(),
        is_completed: true, // Mark as completed
        last_saved_time: new Date().toISOString()
      };
      
      console.log("Preparing submission data:", actualData);
      
      // 4. Execute submission
      try {
        let result;
        if (surveyRecordId) {
          // Update existing record
          result = await supabase
            .from('survey_results')
            .update(actualData)
            .eq('id', surveyRecordId);
        } else {
          // Insert new record
          result = await supabase
            .from('survey_results')
            .insert([actualData]);
        }
          
        if (result.error) {
          console.error("Data submission error:", result.error);
          toast({
            title: "Submission Failed",
            description: `Error: ${result.error?.message || result.error || "Unknown error"}`
          });
          return;
        }
        
        console.log("Data submitted successfully:", result.data);
        handleSubmit();
      } catch (dbError) {
        console.error("Database operation exception:", dbError);
        toast({
          title: "Database Error",
          description: dbError instanceof Error ? dbError.message : "Unknown error"
        });
      }
    } catch (e) {
      console.error("Error during submission:", e);
      toast({
        title: "Submission Error",
        description: e instanceof Error ? e.message : "Unknown error"
      });
    }
  }, [answers, toast, surveyRecordId]);

  useEffect(() => {
    if (submitted) {
      router.push('/thank-you');
    }
  }, [submitted, router]); 
  
  if (!isAuthenticated || !currentQuestion) {
    return null;
  }
  
  const progress = (currentQuestionNumber / totalQuestions) * 100;

  const shouldShowQuestion = (question: any) => {
    if (!question.dependsOn) return true;
    
    const dependentAnswer = form.getValues().answers[question.dependsOn.questionId];
    return dependentAnswer === question.dependsOn.value;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && currentQuestion.options) {
      const currentOptions = currentQuestion.options;
      const oldIndex = currentOptions.findIndex(opt => 
        (typeof opt === "string" ? opt : opt.tag) === active.id
      );
      const newIndex = currentOptions.findIndex(opt => 
        (typeof opt === "string" ? opt : opt.tag) === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOptions = arrayMove(currentOptions, oldIndex, newIndex);
        const newOrder = newOptions.map(opt => 
          typeof opt === "string" ? opt : opt.tag
        );
        
        // 更新答案
        setAnswers(prev => ({
          ...prev,
          [currentQuestion.id]: {
            value: JSON.stringify(newOrder)
          }
        }));

        // 更新当前问题的选项顺序
        const updatedSections = sections.map(section => {
          if (section.questions.some(q => q.id === currentQuestion.id)) {
            return {
              ...section,
              questions: section.questions.map(q => {
                if (q.id === currentQuestion.id) {
                  return {
                    ...q,
                    options: newOptions
                  };
                }
                return q;
              })
            };
          }
          return section;
        });
        
        // 更新问题列表
        sections.splice(0, sections.length, ...updatedSections);
      }
    }
  };

  return (
    <>
      <Toaster />
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-secondary to-gray-200 p-4">
        <div className="container max-w-6xl mx-auto mt-8">
          <div className="flex gap-6">
            <div className="w-72 shrink-0">
              <div className="bg-white/90 rounded-lg shadow-lg p-4 max-h-[calc(100vh-8rem)] overflow-y-auto sticky top-8">
                <h3 className="text-lg font-semibold mb-4">Quick Navigation</h3>
                {sections.map((section, sIndex) => (
                  <div key={section.id} className="mb-6">
                    <h4 className="text-sm font-medium text-gray-600 mb-3 border-b border-gray-200 pb-1">{section.title}</h4>
                    <div className="space-y-2">
                      {section.questions.map((question, qIndex) => {
                        const isAnswered = answers[question.id]?.value;
                        const isCurrent = currentSectionIndex === sIndex && currentQuestionIndex === qIndex;
                        const canNavigate = isTestMode || 
                          sIndex < currentSectionIndex || 
                          (sIndex === currentSectionIndex && qIndex <= currentQuestionIndex) || 
                          isAnswered;
                        
                        // Calculate global question number
                        const questionsBeforeThisSection = sections
                          .slice(0, sIndex)
                          .reduce((total, sec) => total + sec.questions.length, 0);
                        const globalQuestionNumber = questionsBeforeThisSection + qIndex + 1;
                        
                        return (
                          <Button
                            key={question.id}
                            variant="ghost"
                            size="sm"
                            disabled={!canNavigate}
                            className={`w-full justify-start text-left text-sm px-3 py-2 rounded border hover:bg-gray-100 ${
                              isCurrent
                                ? 'bg-primary/10 text-primary border-primary'
                                : isAnswered
                                ? 'bg-green-50 border-green-200 text-green-700'
                                : 'border-gray-200'
                            }`}
                            onClick={() => {
                              if (canNavigate) {
                                setCurrentSectionIndex(sIndex);
                                setCurrentQuestionIndex(qIndex);
                              }
                            }}
                          >
                            <span className="inline-block w-8 text-center mr-2 font-medium">{globalQuestionNumber}</span>
                            <span className="truncate">{question.text.substring(0, 20)}{question.text.length > 20 ? '...' : ''}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 backdrop-blur-sm bg-white/30 rounded-3xl shadow-lg p-6">
              <h1 className="text-3xl font-extrabold text-primary text-center mb-6">
                SECTION {currentSectionIndex + 1} - {currentSection.title}
              </h1>
              <Progress value={progress} className="mb-4" />
              <Card className="w-full bg-white/70 shadow-md backdrop-blur-sm border border-gray-300">
                <CardHeader className="bg-gray-100/80 rounded-t-md">
                  {currentQuestion.type !== 'instructions' && (
                    <CardTitle className="text-xl font-semibold text-gray-800">
                      {currentQuestion.text}
                    </CardTitle>
                  )}
                  {currentQuestion.type !== 'instructions' && currentQuestion.description && (
                    <CardDescription className="mt-2 text-gray-600">
                      {currentQuestion.description}
                    </CardDescription>
                  )}
                  {currentQuestion.image && (
                    <div className="relative w-full mt-4">
                      <div className="relative w-full aspect-[16/9] max-h-[280px]">
                        <Image
                          src={`/images/${currentQuestion.image.split('/').pop()}`}
                          alt={`Question ${currentQuestion.id} image`}
                          fill
                          style={{ objectFit: 'contain' }}
                          priority
                        />
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-6">
                  <Form {...form}>
                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                      <FormField
                        control={form.control}
                        name={`answers.${currentQuestion.id}`}
                        render={({ field }) => (
                        <FormItem>
                          <FormControl>
                              {currentQuestion.type === 'instructions' ? (
                                <Instructions content={currentQuestion.instructionContent!} />
                              ) : currentQuestion.type === 'ranking' ? (
                                <DndContext
                                  sensors={sensors}
                                  collisionDetection={closestCenter}
                                  onDragEnd={handleDragEnd}
                                >
                                  <div className="space-y-2">
                                    <SortableContext
                                      items={(currentQuestion.options || []).map(opt => 
                                        typeof opt === "string" ? opt : opt.tag
                                      )}
                                      strategy={verticalListSortingStrategy}
                                    >
                                      {(currentQuestion.options || []).map((option, index) => {
                                        const tag = typeof option === "string" ? option : option.tag;
                                        const text = typeof option === "string" ? option : option.text;
                                        return (
                                          <SortableItem key={tag} id={tag} index={index}>
                                            {text}
                                          </SortableItem>
                                        );
                                      })}
                                    </SortableContext>
                                  </div>
                                </DndContext>
                              ) : currentQuestion.type === 'radio-with-other' ? (
                                <div className="space-y-4">
                                  <RadioGroup
                                    onValueChange={(value) => {
                                      handleAnswerChange(
                                        currentQuestion.id,
                                        value,
                                        value === 'Other' ? '' : undefined
                                      );
                                    }}
                                    value={answers[currentQuestion.id]?.value || ''}
                                    className="space-y-2"
                                  >
                                    {currentQuestion.options?.map((option) => {
                                      const optionText = typeof option === 'string' ? option : option.text;
                                      const optionValue = typeof option === 'string' ? option : option.tag;
                                      return (
                                        <div key={optionValue} className="flex items-center space-x-2">
                                          <RadioGroupItem value={optionValue} id={`${currentQuestion.id}-${optionValue}`} />
                                          <label 
                                            htmlFor={`${currentQuestion.id}-${optionValue}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                          >
                                            {optionText}
                                          </label>
                                        </div>
                                      );
                                    })}
                                  </RadioGroup>
                                  {answers[currentQuestion.id]?.value === 'Other' && (
                                    <Input
                                      value={answers[currentQuestion.id]?.otherValue || ''}
                                      onChange={(e) => {
                                        handleAnswerChange(
                                          currentQuestion.id,
                                          'Other',
                                          e.target.value
                                        );
                                      }}
                                      placeholder="Please specify"
                                      className="mt-2"
                                    />
                                  )}
                                </div>
                              ) : (
                                // 检查是否是需要多行输入的问题
                                ['Q45', 'Q46', 'Q47', 'Q48', 'Q50', 'Q51', 'Q52', 'Q53', 'Q54', 'Q55'].includes(currentQuestion.id) ? (
                                  <MultiLineTextInput
                                    questionId={currentQuestion.id}
                                    initialValue={answers[currentQuestion.id]?.value || ''}
                                    onChange={(lines) => handleMultiLineTextChange(currentQuestion.id, lines)}
                                  />
                                ) : (
                                  <Input
                                    value={answers[currentQuestion.id]?.value || ''}
                                    onChange={(e) => {
                                      handleAnswerChange(
                                        currentQuestion.id,
                                        e.target.value
                                      );
                                    }}
                                    type="text"
                                    placeholder="Enter your answer"
                                    className="w-full"
                                  />
                                )
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </CardContent>
              </Card>
              <div className="flex justify-between items-center mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={goToPreviousQuestion}
                  disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
                  className="bg-gray-500 hover:bg-gray-700 text-white"
                >
                  Previous
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveAndExit}
                  disabled={isLoading}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300 font-medium"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save & Exit
                    </>
                  )}
                </Button>

                {currentSectionIndex === sections.length - 1 && 
                 currentQuestionIndex === sections[sections.length - 1].questions.length - 1 ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        className="bg-primary hover:bg-teal-700 text-white font-bold"
                      >
                        Submit
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white text-gray-800">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to submit?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Once you submit, you will not be able to edit your responses.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="text-gray-700 hover:bg-gray-200">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={submitSurvey}
                          className="bg-primary hover:bg-teal-700 text-white font-bold"
                        >
                          Submit
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button
                    type="button"
                    onClick={goToNextQuestion}
                    className="bg-primary hover:bg-teal-700 text-white font-bold"
                    disabled={!validateCurrentAnswer()}
                  >
                    Next <ArrowRight className="ml-2" />
                  </Button>
                )}
              </div>
              <Button onClick={handleLogout} variant="outline" className="mt-4">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
