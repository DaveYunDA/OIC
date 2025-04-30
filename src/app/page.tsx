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
import { ArrowRight } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from "lucide-react";
import { DragEndEvent } from '@dnd-kit/core';
import { calculateScores } from '@/lib/scoring';

interface Question {
  id: string;
  text: string;
  type: "radio-with-other" | "text" | "ranking" | "instructions";
  required: boolean;
  options?: Array<string | { text: string; tag: string }>;
  description?: string;
  instructionContent?: InstructionContent;
}

interface Section {
  id: string;
  title: string;
  questions: Question[];
}

interface FormValues {
  answers: Record<string, {
    value: string;
    otherValue?: string;
  }>;
}

interface InstructionBulletPoint {
  text: string;
  description?: string;
  boldItems?: Array<{
    text: string;
    description: string;
  }>;
}

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
        id: 'Q3',
        text: 'Your usual country of residence',
        type: 'radio-with-other',
        required: true,
        options: ['China', 'Australia', 'US', 'UK', 'Other'],
      },
      {
        id: 'Q5',
        text: 'Your age',
        type: 'radio-with-other',
        required: true,
        options: ['13+', '14+', '15+', '16+', '17+', '18+', '19+', 'Other'],
      },
      {
        id: 'Q7',
        text: 'Which school year are you in?',
        type: 'radio-with-other',
        required: true,
        options: ['Year 9', 'Year 10', 'Year 11', 'Year 12', 'Other'],
      },
      {
        id: 'Q9',
        text: 'In which country is your school located?',
        type: 'radio-with-other',
        required: true,
        options: ['Australia', 'UK', 'China', 'US', 'Canada', 'Other'],
      },
      {
        id: 'Q11',
        text: "Your parent's email",
        type: 'text',
        required: true,
      },
      {
        id: 'Q12',
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
        id: 'Q13',
        text: 'If you won a lot of money on the lottery (assuming you\'re now 18), what would you do first?',
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
        id: 'Q14',
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
        id: 'Q15',
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
        id: 'Q16',
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
        id: 'Q17',
        text: "Assume you're around 10 years older, ready to settle down, single but looking for a partner for life – apart from looks/attractiveness, which of the following traits would appeal most?",
        description: "Rank in order from 1 (Most Important) to 6 (Least Important).",
        type: "ranking",
        required: true,
        options: [
          { text: "Funny, entertaining, exciting, and with a good sense of humour", tag: "H" },
          { text: "Ambitious, decisive, a natural leader who is driven to be the best", tag: "L" },
          { text: "Kind, caring, tolerant and supportive", tag: "F" },
          { text: "Intelligence – someone intellectually stimulating who can challenge me and who I can learn from", tag: "A" },
          { text: "A wealthy person with a nice house/car etc, but who is also good with money", tag: "P" },
          { text: "Loyal, faithful, honest, organised, and reliable", tag: "S" }
        ],
      },
      {
        id: 'Q18',
        text: "Imagine you have advanced in life and have made some big achievements. Your school wants to invite you back to give a speech to the students. You are being introduced by your head teacher. How would you like to be described? ",
        description: "Rank in order from 1 (Closest to you) to 6 (Furthest).",
        type: 'ranking',
        required: true,
        options: [
          { text: "A fun person who lived life on the edge", tag: 'H' },
          { text: "A successful leader who drove themselves to the top", tag: 'L' },
          { text: "A caring person who put others first and made a positive difference to those in need", tag: 'A' },
          { text: "An inspirational scholar whose research and discoveries led to great progress in their specialist field", tag: 'S' },
          { text: "A great businessperson who made it to the rich list", tag: 'P' },
          { text: "A trustworthy and reliable person with high integrity. They played by the rules and delivered on their word", tag: 'F' }
        ],
      },
      {
        id: 'Q19',
        text: "The image shows a war memorial defaced",
        description: "Rank the feelings from 1 (Most Accurate) to 6 (Least Accurate)",
        type: "ranking",
        required: true,
        options: [
          { text: "Funny – I wish I'd done this!", tag: "H" },
          { text: "Disrespectful – this man must have been a great leader who sacrificed a lot; he deserves to be honoured", tag: "L" },
          { text: "Degrading and Cruel – the poor man would be devastated to see this if he were alive today", tag: "F" },
          { text: "Confusing – why has this been vandalised? I'd like to do more research on this", tag: "S" },
          { text: "Wasteful – this is going to cost a lot of money and time to put right", tag: "P" },
          { text: "Stupid and annoying - this statue has been part of the community for a long time, why change it now? Is this legal?", tag: "A" }
        ],
      },
      {
        id: 'Q20',
        text: "On leaving your school or college, which quote and class vote would you be most pleased to receive?",
        description: "Rank from 1 (Closest) to 6 (Furthest).",
        type: 'ranking',
        required: true,
        options: [
          { text: "Cheekiest but funniest class member. Most likely to be an entertainer or media star, or to surprise us all!", tag: 'H' },
          { text: "Head pupil and class leader – most likely to be CEO or leader of their chosen profession", tag: 'L' },
          { text: "Most supportive, helpful team player and all-round good person. Most likely to make a positive difference to others' lives", tag: 'A' },
          { text: "Top of the class and super brainy – most likely to be professor in their chosen field at a top university", tag: 'S' },
          { text: "Whatever you wanted, they found it for you – at a price. Most likely to be a rich and successful entrepreneur or businessperson", tag: 'P' },
          { text: "Best attendance and behaviour - loved by all the teachers! Most likely to be a model citizen for the community and a good family person.", tag: 'F' }
        ],
      },
      {
        id: 'Q21',
        text: "Imagine you're a parent of school age children. What key advice would you give them on their first day?",
        description: "Rank from 1 (Most Likely to say) to 6 (Least Likely).",
        type: 'ranking',
        required: true,
        options: [
          { text: "The most important thing is to have fun and enjoy it", tag: 'H' },
          { text: "Prove that you're the best – strive for success and you'll win!", tag: 'L' },
          { text: "Always be kind to others and be a friend to everyone.", tag: 'A' },
          { text: "Make the most of the learning opportunities and learn all you can.", tag: 'S' },
          { text: "Think of this as an investment – the hard work will pay off in the future.", tag: 'P' },
          { text: "Make sure you stay out of trouble and always listen to your teachers – they know best.", tag: 'F' }
        ],
      },
      {
        id: 'Q22',
        text: "Which comment would you be most pleased to receive by your boss/manager on your performance appraisal when you begin your career.",
        description: "Rank from 1 (Most Pleased) to 6 (Least Pleased).",
        type: 'ranking',
        required: true,
        options: [
          { text: "Great fun to work with and sets a positive team spirit", tag: 'H' },
          { text: "A natural leader who drives the team forward", tag: 'L' },
          { text: "Kind, supportive team member – popular and always happy to help out", tag: 'A' },
          { text: "Super-bright, a good problem solver who picks new information up quickly", tag: 'S' },
          { text: "Very commercial, cost-conscious, adds value, brings in income money-maker and with great earning potential", tag: 'P' },
          { text: "Reliable and conscientious, delivers on their promises", tag: 'F' }
        ],
      },
    ],
  },
  {
    id: 'section3',
    title: 'YOUR INTERESTS',
    questions: [
      {
        id: 'Q23',
        text: 'When visiting a book shop or library, which section would you prefer to visit?',
        description: 'Rank in order from 1 (First Choice) to 6 (Last Choice).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'Arts, music, film & literature', tag: 'H' },
          { text: 'Business, politics & leadership', tag: 'L' },
          { text: 'Well-being, psychology & self-help', tag: 'A' },
          { text: 'Nature, geography, sports & the outdoors', tag: 'F' },
          { text: 'Other non-fiction books, guides & manuals (e.g. revision guides, IT & computing, planning events, etc.)', tag: 'P' },
          { text: 'Science – either fiction or non-fiction', tag: 'S' }
        ],
      },
      {
        id: 'Q24',
        text: 'Which podcast category are you most likely to tap into?',
        description: 'Rank in order from 1 (First Choice) to 6 (Last Choice).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'Comedy', tag: 'H' },
          { text: 'Business & leadership', tag: 'L' },
          { text: 'Social issues and current affairs', tag: 'A' },
          { text: 'Sports and outdoor pursuits', tag: 'F' },
          { text: 'Organisation, productivity and/or managing money', tag: 'P' },
          { text: 'Science, research & discovery', tag: 'S' }
        ],
      },
      {
        id: 'Q25',
        text: 'If you were asked to design and deliver a workshop, which would you be best qualified for?',
        description: 'Rank in order from 1 (First Choice) to 6 (Last Choice).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'Something creative – photography, design, or music', tag: 'H' },
          { text: 'How to persuade and influence people', tag: 'L' },
          { text: 'Improving interpersonal skills', tag: 'A' },
          { text: 'An outdoor exercise programme or coaching session for your favourite sport', tag: 'F' },
          { text: 'Managing your money and time', tag: 'P' },
          { text: 'Improve problem-solving and analytical skills', tag: 'S' }
        ],
      },
      {
        id: 'Q26',
        text: 'Ideal day out',
        description: 'Rank in order from 1 (First Choice) to 6 (Last Choice).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'An art gallery, a cinema, the theatre – something entertaining', tag: 'H' },
          { text: 'I\'d love to do a competitive group challenge (e.g. an escape room) where I lead the group to success!', tag: 'L' },
          { text: 'A party or social gathering with my friends and where I can meet new people', tag: 'A' },
          { text: 'A wildlife park or trek around a nature reserve', tag: 'F' },
          { text: 'Anything that is good value for money, booked in advance and well organised (ideally by me!)', tag: 'P' },
          { text: 'A science or history museum or historical site', tag: 'S' }
        ],
      },
      {
        id: 'Q27',
        text: 'What hobby or skill have you always wanted to try or develop if you had the time?',
        description: 'Rank in order from 1 (First Choice) to 6 (Last Choice).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'Baking, a new art form, creative writing, a craft, photography or learning a new musical instrument', tag: 'H' },
          { text: 'Practice my debating and influencing skills or try my hand at public speaking', tag: 'L' },
          { text: 'Voluntary work or team activity where I can work with and support others', tag: 'A' },
          { text: 'I\'d love to learn a new sport, or try an outdoors activity', tag: 'F' },
          { text: 'Develop my IT and/or budget management skills (e.g. learn a new software package or financial system)', tag: 'P' },
          { text: 'Research that niche topic I\'ve always been meaning to look into', tag: 'S' }
        ],
      },
      {
        id: 'Q28',
        text: 'What kind of holiday do you most prefer?',
        description: 'Rank in order from 1 (First Choice) to 6 (Last Choice).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'Nothing too formal - I\'m up for a surprise. A relaxed atmosphere where I can do stuff in my own time (e.g. daydream, listen to my music, write, draw etc.) would be ideal!', tag: 'H' },
          { text: 'A city break where I can explore – the holiday\'s not for relaxing - it\'s for adventure', tag: 'L' },
          { text: 'A resort, venue or hotel with social events and activities where I can people watch, mix and make new friends.', tag: 'A' },
          { text: 'Somewhere outdoors – a rural area where I can hike and do other physical activities', tag: 'F' },
          { text: 'Somewhere I\'ve been before which is safe and guaranteed to be great. Otherwise, I\'d plan the whole trip – I need to make sure everything\'s set up in advance', tag: 'P' },
          { text: 'Somewhere new where I can learn about the culture, history and language', tag: 'S' }
        ],
      },
      {
        id: 'Q29',
        text: 'Which group of TV shows are you most likely to watch?',
        description: 'Rank in order from 1 (First Choice) to 6 (Last Choice).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'A show where I can watch people create things or showcase their talents (e.g. Interior Design Challenge, Young Musician of the Year)', tag: 'H' },
          { text: 'Business shows where I can watch how the professionals work (e.g. Dragon\'s Den, The Apprentice, Start Up)', tag: 'L' },
          { text: 'A reality or game show where I can watch people solve problems, build relationships and work as a team  (e.g. The Crystal Maze, Big Brother, Traitors, The Mole)', tag: 'A' },
          { text: 'Wildlife, nature or survival skills documentaries where I can see people work outdoors or with plants and animals (e.g. Blue Planet, Life on Earth, The Farm)', tag: 'F' },
          { text: 'An investigative programme about consumers rights and illegal activity (e.g. Watchdog, Scam Interceptors, Crimewatch)', tag: 'P' },
          { text: 'A quiz show where I can test my knowledge (e.g. Mastermind, University Challenge)', tag: 'S' }
        ],
      },
      {
        id: 'Q30',
        text: 'Which type of workplace would you prefer to work in?',
        description: 'Rank in order from 1 (First Choice) to 6 (Last Choice).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'A workplace that is has a more informal, flexible and less conventional or creative atmosphere - I work best outside of a set structure', tag: 'H' },
          { text: 'Somewhere that allows me to demonstrate my leadership, selling, and management skills', tag: 'L' },
          { text: 'A friendly and open environment where I can interact with others and/or work as a team', tag: 'A' },
          { text: 'A workplace that values technical or practical skills and/or where I can go outside and am not stuck in an office all day', tag: 'F' },
          { text: 'I need a structured place with clear expectations and standards where I can use my organisational skills', tag: 'P' },
          { text: 'Somewhere which values analytical skills and intellect which allows me to work independently to research and solve problems.', tag: 'S' }
        ],
      },
      {
        id: 'Q31',
        text: 'Assuming money/income is not a key issue for you, which of the following is closest to your dream career? ',
        description: 'Rank in order from 1 (First Choice) to 6 (Last Choice).',
        type: 'ranking',
        required: true,
        options: [
          { text: 'Designer or Artist (including actor, musician, writer/author)', tag: 'H' },
          { text: 'Businessperson, entrepreneur or sales/marketing director', tag: 'L' },
          { text: 'Healthcare, public sector or charity worker', tag: 'A' },
          { text: 'Professional sportsperson, armed forces or police officer', tag: 'F' },
          { text: 'Lawyer, accountant or IT professional', tag: 'P' },
          { text: 'Researcher in your chosen field', tag: 'S' }
        ],
      },
      {
        id: 'Q32_1',
        text: 'Practicality is more important than how something looks',
        description: 'Choose one box to tick that you agree with most. Try and avoid the neutral option if possible.',
        type: 'radio-with-other',
        required: true,
        options: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
      },
      {
        id: 'Q32_2',
        text: 'I dislike schedules – I prefer being flexible than too organised',
        description: 'Choose one box to tick that you agree with most. Try and avoid the neutral option if possible.',
        type: 'radio-with-other',
        required: true,
        options: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
      },
      {
        id: 'Q32_3',
        text: 'I value my intellect over my interpersonal skills',
        description: 'Choose one box to tick that you agree with most. Try and avoid the neutral option if possible.',
        type: 'radio-with-other',
        required: true,
        options: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
      },
      {
        id: 'Q32_4',
        text: 'I enjoy persuading and influencing people',
        description: 'Choose one box to tick that you agree with most. Try and avoid the neutral option if possible.',
        type: 'radio-with-other',
        required: true,
        options: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
      },
      {
        id: 'Q32_5',
        text: "I'm better with people than I am with practical tasks and equipment",
        description: "Choose one box to tick that you agree with most. Try and avoid the neutral option if possible.",
        type: "radio-with-other",
        required: true,
        options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
      },
      {
        id: 'Q32_6',
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
        id: 'Q33_1',
        text: 'I like to keep my feelings to myself rather than sharing them with everyone (EI)',
        description: 'Choose one box to tick to rate your agreement with each statement. Avoid using the neutral/middle option if possible.',
        type: 'radio-with-other',
        required: true,
        options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
      },
      {
        id: 'Q33_2',
        text: "I'm often the person my friends rely on to organise things (PJ)",
        description: "Choose one box to tick to rate your agreement with each statement. Avoid using the neutral/middle option if possible.",
        type: "radio-with-other",
        required: true,
        options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
      },
      {
        id: 'Q33_3',
        text: "After a busy week, I'd rather relax by spending time with my friends than on my own (IE)",
        description: "Choose one box to tick to rate your agreement with each statement. Avoid using the neutral/middle option if possible.",
        type: "radio-with-other",
        required: true,
        options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
      },
      {
        id: 'Q33_4',
        text: 'I prefer learning about facts and details rather than theories and ideas (NS)',
        description: 'Choose one box to tick to rate your agreement with each statement. Avoid using the neutral/middle option if possible.',
        type: 'radio-with-other',
        required: true,
        options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
      },
      {
        id: 'Q33_5',
        text: "It's important to show kindness and respect for people, even if you don't like or understand them (TF)",
        description: "Choose one box to tick to rate your agreement with each statement. Avoid using the neutral/middle option if possible.",
        type: "radio-with-other",
        required: true,
        options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
      },
      {
        id: 'Q33_6',
        text: 'I tend to plan and start tasks early rather than leaving them to the last minute (PJ)',
        description: 'Choose one box to tick to rate your agreement with each statement. Avoid using the neutral/middle option if possible.',
        type: 'radio-with-other',
        required: true,
        options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
      },
      {
        id: 'Q33_7',
        text: "I am more concerned about fairness over people's feelings (FT)",
        description: "Choose one box to tick to rate your agreement with each statement. Avoid using the neutral/middle option if possible.",
        type: "radio-with-other",
        required: true,
        options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
      },
      {
        id: 'Q33_8',
        text: "I think it's better to be imaginative than practical (SN)",
        description: "Choose one box to tick to rate your agreement with each statement. Avoid using the neutral/middle option if possible.",
        type: "radio-with-other",
        required: true,
        options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
      },
      {
        id: 'Q33_9',
        text: 'I find pre-planned events and schedules restricting (JP)',
        description: 'Choose one box to tick to rate your agreement with each statement. Avoid using the neutral/middle option if possible.',
        type: 'radio-with-other',
        required: true,
        options: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
      },
      {
        id: 'Q33_10',
        text: 'I prefer to have a close friendship with less people than a broad relationship with many people (EI)',
        description: 'Choose one box to tick to rate your agreement with each statement. Avoid using the neutral/middle option if possible.',
        type: 'radio-with-other',
        required: true,
        options: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
      },
      {
        id: 'Q33_11',
        text: "I dislike it when fiction writers don't say exactly what they mean (NS)",
        description: "Choose one box to tick to rate your agreement with each statement. Avoid using the neutral/middle option if possible.",
        type: "radio-with-other",
        required: true,
        options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
      },
      {
        id: 'Q33_12',
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
        id: 'Q34',
        text: 'Practice Question',
        description: `There has been a 30% drop in use of the food canteen/restaurant within one of the high schools in your area over the past six months.
You have been asked to make some suggestions to solve the problem. List as many potential ideas as you can. Remember to come up with a range of different ideas – no matter how silly they seem!`,
        type: 'text',
        required: true,
      },
      {
        id: 'Q35',
        text: 'Please read the following problem',
        description: `Assume that you have a 13-year-old cousin who is feeling really sad because their school head-teacher (a 40 year old woman) is leaving. She had only started working at the school less than a year ago. Everyone seemed to like her a lot, and she was doing a great job. But now, she's leaving all of a sudden, and nobody knows why - it's a total mystery!`,
        type: 'text',
        required: true,
      },
      {
        id: 'Q36',
        text: 'Please read the following problem',
        description: 'Due to the increasing popularity of summer music festivals since Covid, last year "Harmony Fest" launched in a brand-new location following this gap in the market. However, many of the attendees complained about how bad it was, and this year, ticket sales are down by 40%. ',
        type: 'text',
        required: true,
      },
      {
        id: 'Q37',
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
        id: 'Q38',
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
        id: 'Q39',
        text: 'What are your most favourite subjects and why?',
        type: 'text',
        required: true,
      },
      {
        id: 'Q40',
        text: 'What are your least favourite subjects and why?',
        type: 'text',
        required: true,
      },
      {
        id: 'Q41',
        text: 'How do you spend your spare/leisure time?',
        description: 'Do you have anything you found particularly easy or difficult in general?',
        type: 'text',
        required: true,
      },
      {
        id: 'Q42',
        text: 'If money / family circumstances / location were no object, what would be your ideal career?',
        type: 'text',
        required: true,
      },
      {
        id: 'Q43',
        text: 'What are your parental expectations/hopes for your career choice?',
        type: 'text',
        required: true,
      },
      {
        id: 'Q44',
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
    const user = localStorage.getItem('currentUser');
    if (!user) {
      router.push('/login');
      return;
    }
    setIsAuthenticated(true);
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
      form.reset({ answers: {} });
      // 如果这个问题已经有答案了，就显示答案
      if (answers[currentQuestion.id]) {
        form.setValue(`answers.${currentQuestion.id}`, answers[currentQuestion.id]);
      }
    }
  }, [currentQuestionIndex, currentSectionIndex, currentQuestion?.id]);

  const handleAnswerChange = (questionId: string, value: string, otherValue?: string) => {
    const newAnswer = { value, otherValue };
    setAnswers(prev => ({
      ...prev,
      [questionId]: newAnswer
    }));
    form.setValue(`answers.${questionId}`, newAnswer);
  };

  const validateCurrentAnswer = () => {
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

  const goToNextQuestion = () => {
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
    
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentQuestionIndex(0);
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
      // 1. 检查用户
      const userString = localStorage.getItem('currentUser');
      if (!userString) {
        toast({
          title: "错误",
          description: "用户未登录"
        });
        return;
      }
      
      // 2. 解析用户数据
      let user;
      try {
        user = JSON.parse(userString);
        console.log("用户数据:", user);
      } catch (e) {
        console.error("解析用户数据失败:", e);
        toast({
          title: "错误",
          description: "用户数据无效"
        });
        return;
      }
      
      // 3. 计算得分
      const scores = calculateScores(answers);
      console.log("计算得分:", scores);
      
      // 4. 准备提交的数据
      const actualData = {
        user_id: user.id,
        answers: JSON.stringify(answers),
        scores: JSON.stringify(scores),
        created_at: new Date().toISOString()
      };
      
      console.log("准备提交数据:", actualData);
      
      // 5. 执行插入操作
      try {
        const result = await supabase
          .from('survey_results')
          .insert([actualData]);
          
        if (result.error) {
          console.error("数据插入错误:", result.error);
          toast({
            title: "数据保存失败",
            description: `错误信息: ${result.error.message}`
          });
          return;
        }
        
        console.log("数据插入成功:", result.data);
        handleSubmit();
      } catch (dbError) {
        console.error("执行数据库操作时发生异常:", dbError);
        toast({
          title: "数据库操作异常",
          description: dbError instanceof Error ? dbError.message : "未知错误"
        });
      }
    } catch (e) {
      console.error("提交过程中发生错误:", e);
      toast({
        title: "提交错误",
        description: e instanceof Error ? e.message : "未知错误"
      });
    }
  }, [answers, toast]);

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
        <div className="container max-w-3xl mx-auto mt-8 backdrop-blur-sm bg-white/30 rounded-3xl shadow-lg">
          <h1 className="text-3xl font-extrabold text-primary text-center mb-6 pt-4">
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

          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={goToPreviousQuestion}
              disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
              className="bg-gray-500 hover:bg-gray-700 text-white"
            >
              Previous
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
    </>
  );
}
