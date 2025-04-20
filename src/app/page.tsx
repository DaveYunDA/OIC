'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,

} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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


const questionSchema = z.object({
  id: z.string(),
  text: z.string(),
  type: z.enum(['ranking']),
  options: z.array(z.string()).optional(),
});

type Question = z.infer<typeof questionSchema>;

const formSchema = z.object({
  answers: z.record(z.any()),
});

function arrayShuffle(array: any[]): any[] {
  let currentIndex = array.length, randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

function SortableItem(props: {
  id: string, option: string, index: number, questionId: string, form: any, ranking: string[]
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: props.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: 10,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center space-x-2 p-3 bg-muted rounded-md shadow-sm cursor-move"
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <span>{props.option}</span>
    </li>
  );
}

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [surveyQuestions, setSurveyQuestions] = useState<Question[]>([
    {
      id: 'Q1 Lottery win',
      text:
        'Lottery win: If you won a lot of money on the lottery (assuming you’re now 18), what would you do first? ' +
        'Drag the options into your preferred order (top = Most Likely, bottom = Least Likely).',
      type: 'ranking',
      options: [
        'Go out and celebrate, celebrate, celebrate!',
        'Buy that car, big house, and those other luxuries you’ve always wanted',
        'Pay off the debts of family & friends and support a charity close to your heart',
        'Invest it in your education',
        'Set up your own business',
        'Get financial advice – invest wisely in a secure savings plan and give some to parents/family for safe‑keeping',
      ],
    },
    {
      id: 'Q2 Dinner guest',
      text:
        'Dinner guest: Who would you prefer as a dinner guest (living or dead) from the list below? ' +
        'Drag the options into your preferred order (top = Most Prefer, bottom = Most Avoid).',
      type: 'ranking',
      options: [
        'A well‑known celebrity or social media star',
        'A rich and successful entrepreneur/businessperson',
        'A campaigner for human rights or spiritual / religious leader',
        'A president, prime minister, or world leader',
        'A close friend or family member',
        'A Nobel prize‑winning academic or chancellor/professor of a top university',
      ],
    },
    {
      id: 'Q3 Gift from relative',
      text:
        'Gift from relative: What would you prefer to receive from a relative as a gift, assuming they have a budget of £200? ' +
        'Drag the options into your preferred order (top = Best Gift, bottom = Worst).',
      type: 'ranking',
      options: [
        'A contribution to a fundraiser for a charity of your choice',
        'A voucher for some books, tutoring or resources to help with your academic studies',
        'A treat of your choice (e.g. meal out, day at a theme park, ticket for a sports event/concert/festival)',
        'Money for your savings account',
        'Something you can show off to your friends (e.g. new trainers, watch, designer item)',
        'A ticket to a seminar or workshop on how to set up a successful business',
      ],
    },
    {
      id: 'Q4 Inspirational quotes',
      text:
        'Inspirational quotes: Which of these sayings and quotes is most likely to inspire you? ' +
        'Drag the options into your preferred order (top = Most Inspiring, bottom = Least Inspiring).',
      type: 'ranking',
      options: [
        'Always look before you leap - carefulness costs you nothing, but carelessness may cost you your life',
        'Be kind whenever possible. It is always possible',
        'The great thing about learning and knowledge is that no-one can ever take it away from you',
        'Life is short, so have fun and enjoy it to the fullest',
        'A leader is one who knows the way, goes the way, and shows the way',
        'In order to become rich, you must believe you can do it, and take action to reach your goals',
      ],
    },
    {
      id: 'Q5 Dating app',
      text:
        'Dating app: Assume you’re around 10 years older, ready to settle down, single but looking for a partner for life - apart from looks/attractiveness, which of the following traits would appeal most? ' +
        'Drag the options into your preferred order (top = Most Important, bottom = Least Important).',
      type: 'ranking',
      options: [
        'Intelligence - someone intellectually stimulating who can challenge me and who I can learn from',
        'Funny, entertaining, exciting, and with a good sense of humour',
        'Ambitious, decisive, a natural leader who is driven to be the best',
        'Kind, caring, tolerant and supportive',
        'A wealthy person with a nice house/car etc, but who is also good with money',
        'Loyal, faithful, honest, organised, and reliable',
      ],
    },
    {
      id: 'Q6 School speech',
      text:
        'School speech: Imagine you have advanced in life and have made some big achievements. Your school wants to invite you back to give a speech to the students. You are being introduced by your head teacher. How would you like to be described? ' +
        'Drag the options into your preferred order (top = Closest to how you would like to be remembered, bottom = Furthest away).',
      type: 'ranking',
      options: [
        'A fun person who lived life on the edge',
        'A trustworthy and reliable person with high integrity. They played by the rules and delivered on their word',
        'A successful leader who drove themselves to the top',
        'A caring person who put others first and made a positive difference to those in need',
        'A great businessperson who made it to the rich list',
        'An inspirational scholar whose research and discoveries led to great progress in their specialist field',
      ],
    },
    {
      id: 'Q7 Vandalised statue',
      text:
        'Vandalised statue: The image shows a war memorial defaced. Answer truthfully - personally, I find this image: ' +
        'Drag the options into your preferred order (top = Most Accurate description of my feelings, bottom = Least Accurate).',
      type: 'ranking',
      options: [
        'Stupid and annoying - this statue has been part of the community for a long time, why change it now? Is this legal?',
        'Funny - I wish I’d done this!',
        'Wasteful - this is going to cost a lot of money and time to put right',
        'Disrespectful - this man must have been a great leader who sacrificed a lot; he deserves to be honoured',
        'Degrading and cruel – the poor man would be devastated to see this if he were alive today',
        'Confusing – why has this been vandalised? I’d like to do more research on this',
      ],
    },
    {
      id: 'Q8 School yearbook',
      text:
        'School yearbook: On leaving your school or college, which quote and class vote would you be most pleased to receive? ' +
        'Drag the options into your preferred order (top = Closest to how you would like to be seen, bottom = Furthest away).',
      type: 'ranking',
      options: [
        'Most supportive, helpful team player and all-round good person. Most likely to make a positive difference to others’ lives',
        'Cheekiest but funniest class member. Most likely to be an entertainer or media star, or to surprise us all!',
        'Best attendance and behaviour - loved by all the teachers! Most likely to be a model citizen for the community and a good family person.',
        'Head pupil and class leader - most likely to be CEO or leader of their chosen profession',
        'Top of the class and super brainy – most likely to be professor in their chosen field at a top university',
        'Whatever you wanted, they found it for you – at a price. Most likely to be a rich and successful entrepreneur or businessperson',
      ],
    },
    {
      id: 'Q9 Raising children',
      text:
        'Raising children: Imagine you’re a parent of school-age children. What key advice would you give them on their first day? ' +
        'Drag the options into your preferred order (top = Closest to what you’re most likely to ask, bottom = Least likely).',
      type: 'ranking',
      options: [
        'Make the most of the learning opportunities and learn all you can.',
        'The most important thing is to have fun and enjoy it!',
        'Prove that you’re the best - strive for success and you’ll win!',
        'Always be kind to others and be a friend to everyone.',
        'Make sure you stay out of trouble and always listen to your teachers – they know best.',
        'Think of this as an investment – the hard work will pay off in the future.',
      ],
    },
    {
      id: 'Q10 Annual appraisal',
      text:
        'Annual appraisal: Which comment would you be most pleased to receive from your boss/manager on your performance appraisal when you begin your career? ' +
        'Drag the options into your preferred order (top = Most Pleased, bottom = Least Pleased).',
      type: 'ranking',
      options: [
        'Very driven and ambitious with leadership qualities',
        'Great fun to work with and sets a positive team spirit',
        'Reliable and conscientious, delivers on their promises',
        'Super-bright, a good problem solver who picks new information up quickly',
        'Kind, supportive team member – popular and always happy to help out',
        'Very commercial, cost‑conscious, adds value, brings in income – money‑maker with great earning potential',
      ],
    },
  ]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [ranking, setRanking] = useState<string[]>([]); // State for the ranking
  const { toast } = useToast();
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const [showNextError, setShowNextError] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: undefined, // Let each question handle its own validation
    defaultValues: {
      answers: {},
    },
  });

  const currentQuestion = surveyQuestions[currentQuestionIndex] ?? {
    id: '',
    text: '',
    type: 'ranking',
    options: [],
  };


  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  useEffect(() => {
    // Load draft from localStorage
    if (typeof window !== 'undefined') {
      const savedDraft = localStorage.getItem('surveyDraft');
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          form.reset({ answers: parsedDraft });
        } catch (e) {
          console.error('Failed to parse survey draft:', e);
        }
      }

      const submittedStatus = localStorage.getItem('submitted');
      if (submittedStatus === 'true') {
        setSubmitted(true);
      }
    }
  }, [form, router]);

  useEffect(() => {
    // Save draft to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('surveyDraft', JSON.stringify(form.getValues().answers));
    }
  }, [form.watch('answers')]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('surveyDraft');
    localStorage.removeItem('submitted');
    setIsAuthenticated(false);
    router.push('/login');
  };

  const validateCurrentAnswer = () => {
    if (!currentQuestion || !currentQuestion.id) {
      return true; // Skip validation if there's no question or question ID
    }

    const currentAnswer = form.getValues().answers[currentQuestion.id];
    let isValid = true;

    if (currentQuestion.type === 'ranking') {
      isValid = Array.isArray(currentAnswer) && currentAnswer.length === currentQuestion.options?.length;
    }

    return isValid;
  };

  const goToNextQuestion = () => {
    if (!validateCurrentAnswer()) {
      setShowNextError(true);
      toast({
        title: "Error",
        description: "Please rank all options before proceeding.",
      });
      return;
    }

    setAnswerSubmitted(true);
    setShowNextError(false);
    setCurrentQuestionIndex((prevIndex) => Math.min(prevIndex + 1, surveyQuestions.length - 1));
  };


  const goToPreviousQuestion = () => {
    setAnswerSubmitted(true);
    setShowNextError(false);
    setCurrentQuestionIndex((prevIndex) => Math.max(prevIndex - 1, 0));
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

  const submitSurvey = useCallback(() => {
    // Validate all answers before submission
    for (const question of surveyQuestions) {
      const answer = form.getValues().answers[question.id];
      if (question.type === 'ranking') {
        if (!Array.isArray(answer) || answer.length !== question.options?.length) {
          toast({
            title: "Error",
            description: "Please rank all options before submitting.",
          });
          return;
        }
      }
    }

    handleSubmit();
  }, [handleSubmit, form, surveyQuestions, toast]);

  useEffect(() => {
    if (submitted) {
      router.push('/thank-you');
    }
  }, [submitted, router]);

  useEffect(() => {
    if (currentQuestion?.type === 'ranking' && currentQuestion.options) {
      // Initialize ranking with shuffled options only once when the question loads
      const shuffledOptions = arrayShuffle([...currentQuestion.options]);
      setRanking(shuffledOptions);
      form.setValue(`answers.${currentQuestion?.id}`, shuffledOptions, {
        shouldValidate: true,
        shouldDirty: true,
      });

    }
  }, [currentQuestion, form]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = ranking.indexOf(active.id as string);
      const newIndex = ranking.indexOf(over.id as string);

      if (oldIndex !== -1 && newIndex !== -1) {
        const updatedRanking = arrayMove(ranking, oldIndex, newIndex);
        setRanking([...updatedRanking]);
        form.setValue(`answers.${currentQuestion?.id}`, updatedRanking, { shouldValidate: true, shouldDirty: true });
      }
    }
  };

  useEffect(() => {
    const isAnswered = validateCurrentAnswer();
    setAnswerSubmitted(isAnswered);

    if (currentQuestionIndex === surveyQuestions.length - 1 && isAnswered) {
      setIsSubmitEnabled(true);
    } else {
      setIsSubmitEnabled(false);
    }
  }, [currentQuestionIndex, surveyQuestions, form, validateCurrentAnswer]);

  if (!isAuthenticated) {
    return null;
  }

  if (submitted) {
    router.push('/thank-you');
  }

  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">No survey questions available.</h1>
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>
    );
  }

  const progress = ((currentQuestionIndex + 1) / surveyQuestions.length) * 100;

  return (
    <>
      <Toaster />
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-secondary to-gray-200 p-4">
        <div className="container max-w-3xl mx-auto mt-8 backdrop-blur-sm bg-white/30 rounded-3xl shadow-lg">
          <h1 className="text-3xl font-extrabold text-primary text-center mb-6 pt-4">
            SurveySwift
          </h1>
          <Progress value={progress} className="mb-4" />
          <Card className="w-full bg-white/70 shadow-md backdrop-blur-sm border border-gray-300">
            <CardHeader className="bg-gray-100/80 rounded-t-md">
              <CardTitle className="text-xl font-semibold text-gray-800">
                Question {currentQuestionIndex + 1} of {surveyQuestions.length}
              </CardTitle>
              <CardDescription className="text-md text-gray-600">
                {currentQuestion.text}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-8">
                  <div className="rounded-lg bg-white/50 p-6">
                    <FormItem>
                      <FormControl>
                        {currentQuestion.type === 'ranking' && currentQuestion.options && (
                          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext
                              items={ranking}
                              strategy={verticalListSortingStrategy}
                            >
                              <ul className="space-y-3">
                                {ranking.map((option: any, index: number) => (
                                  <SortableItem key={option} id={option} option={option} index={index} questionId={currentQuestion?.id} form={form} ranking={ranking} />
                                ))}
                              </ul>
                            </SortableContext>
                          </DndContext>
                        )}
                      </FormControl>
                      <FormMessage />

                    </FormItem>
                    <FormItem>
                      <FormControl>


                      </FormControl>
                    </FormItem>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="secondary"
              className="bg-gray-500 hover:bg-gray-700 text-white"
              onClick={goToPreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              Previous

            </Button>
            {currentQuestionIndex === surveyQuestions.length - 1 ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    disabled={!isSubmitEnabled}
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
                    <AlertDialogCancel className="text-gray-700 hover:bg-gray-200 focus:ring-2 focus:ring-gray-300">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={submitSurvey}
                      className="bg-primary hover:bg-teal-700 text-white font-bold focus:ring-2 focus:ring-teal-300"
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
                className={cn(
                  'bg-primary hover:bg-teal-700 text-white font-bold',
                  !answerSubmitted && 'opacity-50 cursor-not-allowed'
                )}
                disabled={!answerSubmitted}
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
