/**
 * MultiTypeQuiz Component
 * Multiple quiz types: Multiple Choice, Fill-in-Blank, Listening, Matching
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  XCircle, 
  Volume2,
  Lightbulb,
  Trophy,
  RotateCcw
} from 'lucide-react';
import { speakWord } from '@/lib/audioUtils';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export type QuizType = 'multiple-choice' | 'fill-blank' | 'listening' | 'matching';

export interface QuizWord {
  word: string;
  definition?: string;
  portuguese?: string;
  example?: string;
}

interface QuizQuestion {
  type: QuizType;
  word: QuizWord;
  correctAnswer: string;
  options?: string[]; // For multiple choice
  sentence?: string; // For fill-in-blank (with ___ placeholder)
}

interface MultiTypeQuizProps {
  words: QuizWord[];
  questionsPerRound?: number;
  onComplete?: (score: number, total: number) => void;
  quizTypes?: QuizType[];
}

export function MultiTypeQuiz({
  words,
  questionsPerRound = 10,
  onComplete,
  quizTypes = ['multiple-choice', 'fill-blank', 'listening'],
}: MultiTypeQuizProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { answer: string; correct: boolean }>>({});
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);

  // Generate questions
  useEffect(() => {
    const generated = generateQuestions(words, questionsPerRound, quizTypes);
    setQuestions(generated);
  }, [words, questionsPerRound, quizTypes]);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const score = Object.values(answers).filter(a => a.correct).length;

  const generateQuestions = (
    wordList: QuizWord[],
    count: number,
    types: QuizType[]
  ): QuizQuestion[] => {
    const shuffled = [...wordList].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, wordList.length));

    return selected.map(word => {
      const type = types[Math.floor(Math.random() * types.length)];
      
      switch (type) {
        case 'multiple-choice':
          return generateMultipleChoice(word, wordList);
        case 'fill-blank':
          return generateFillBlank(word);
        case 'listening':
          return generateListening(word, wordList);
        default:
          return generateMultipleChoice(word, wordList);
      }
    });
  };

  const generateMultipleChoice = (word: QuizWord, allWords: QuizWord[]): QuizQuestion => {
    const wrongOptions = allWords
      .filter(w => w.word !== word.word && w.portuguese)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.portuguese!);
    
    const options = [...wrongOptions, word.portuguese!].sort(() => Math.random() - 0.5);

    return {
      type: 'multiple-choice',
      word,
      correctAnswer: word.portuguese!,
      options,
    };
  };

  const generateFillBlank = (word: QuizWord): QuizQuestion => {
    const sentence = word.example || `The ___ is important.`;
    return {
      type: 'fill-blank',
      word,
      correctAnswer: word.word.toLowerCase(),
      sentence: sentence.replace(new RegExp(word.word, 'gi'), '___'),
    };
  };

  const generateListening = (word: QuizWord, allWords: QuizWord[]): QuizQuestion => {
    const wrongOptions = allWords
      .filter(w => w.word !== word.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.word);
    
    const options = [...wrongOptions, word.word].sort(() => Math.random() - 0.5);

    return {
      type: 'listening',
      word,
      correctAnswer: word.word.toLowerCase(),
      options,
    };
  };

  const playListeningQuestion = async () => {
    if (currentQuestion.type === 'listening') {
      await speakWord(currentQuestion.word.word);
    }
  };

  const checkAnswer = (answer: string) => {
    const correct = answer.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();
    setIsCorrect(correct);
    setShowResult(true);

    answers[currentIndex] = { answer, correct };
    setAnswers({ ...answers });

    if (correct) {
      toast.success('Correto! 🎉', { duration: 1500 });
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } else {
      toast.error('Incorreto. Tente novamente!', { duration: 1500 });
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer('');
      setShowResult(false);
      setIsCorrect(false);
    } else {
      setQuizComplete(true);
      onComplete?.(score, questions.length);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setAnswers({});
    setUserAnswer('');
    setShowResult(false);
    setQuizComplete(false);
    const generated = generateQuestions(words, questionsPerRound, quizTypes);
    setQuestions(generated);
  };

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Carregando quiz...</p>
        </CardContent>
      </Card>
    );
  }

  if (quizComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-4">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto" />
            <h2 className="text-3xl font-bold text-foreground">Quiz Completo!</h2>
            <div className="text-6xl font-bold text-primary">
              {percentage}%
            </div>
            <p className="text-lg text-muted-foreground">
              Você acertou {score} de {questions.length} questões
            </p>
            
            {percentage === 100 && (
              <p className="text-green-600 font-semibold">
                Perfeito! Você dominou todas as palavras! 🌟
              </p>
            )}
            {percentage >= 70 && percentage < 100 && (
              <p className="text-blue-600 font-semibold">
                Ótimo trabalho! Continue assim! 💪
              </p>
            )}
            {percentage >= 50 && percentage < 70 && (
              <p className="text-orange-600 font-semibold">
                Bom esforço! Um pouco mais de prática! 📚
              </p>
            )}
            {percentage < 50 && (
              <p className="text-red-600 font-semibold">
                Continue praticando! Você vai melhorar! 🎯
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" size="lg" onClick={restartQuiz}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button size="lg" onClick={() => onComplete?.(score, questions.length)}>
              Continuar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                Questão {currentIndex + 1} de {questions.length}
              </Badge>
              <span className="text-sm font-medium">
                Pontuação: {score}/{questions.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {currentQuestion.type === 'multiple-choice' && 'Escolha a Tradução'}
                  {currentQuestion.type === 'fill-blank' && 'Complete a Frase'}
                  {currentQuestion.type === 'listening' && 'Quiz de Audição'}
                </CardTitle>
                <Badge>
                  {currentQuestion.type === 'multiple-choice' && '📝'}
                  {currentQuestion.type === 'fill-blank' && '✍️'}
                  {currentQuestion.type === 'listening' && '🎧'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Multiple Choice */}
              {currentQuestion.type === 'multiple-choice' && (
                <div className="space-y-4">
                  <div className="text-center p-6 bg-muted/50 rounded-lg">
                    <h3 className="text-3xl font-bold text-foreground">
                      {currentQuestion.word.word}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Qual é a tradução em português?
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {currentQuestion.options?.map((option, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="lg"
                        className={`justify-start text-left h-auto py-4 ${
                          showResult && option === currentQuestion.correctAnswer
                            ? 'border-green-500 bg-green-500/10'
                            : showResult && userAnswer === option && !isCorrect
                            ? 'border-red-500 bg-red-500/10'
                            : ''
                        }`}
                        onClick={() => {
                          if (!showResult) {
                            setUserAnswer(option);
                            checkAnswer(option);
                          }
                        }}
                        disabled={showResult}
                      >
                        {option}
                        {showResult && option === currentQuestion.correctAnswer && (
                          <CheckCircle2 className="ml-auto w-5 h-5 text-green-600" />
                        )}
                        {showResult && userAnswer === option && !isCorrect && (
                          <XCircle className="ml-auto w-5 h-5 text-red-600" />
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fill in the Blank */}
              {currentQuestion.type === 'fill-blank' && (
                <div className="space-y-4">
                  <div className="p-6 bg-muted/50 rounded-lg">
                    <p className="text-lg text-foreground leading-relaxed">
                      {currentQuestion.sentence}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Input
                      placeholder="Digite sua resposta..."
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && userAnswer && !showResult) {
                          checkAnswer(userAnswer);
                        }
                      }}
                      disabled={showResult}
                      className="text-lg"
                    />

                    {!showResult && (
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={() => checkAnswer(userAnswer)}
                        disabled={!userAnswer.trim()}
                      >
                        Verificar Resposta
                      </Button>
                    )}
                  </div>

                  {showResult && (
                    <div className={`p-4 rounded-lg ${
                      isCorrect ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                    }`}>
                      <p className="text-sm font-medium">
                        {isCorrect ? '✓ Correto!' : `✗ A resposta correta é: "${currentQuestion.correctAnswer}"`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Listening Quiz */}
              {currentQuestion.type === 'listening' && (
                <div className="space-y-4">
                  <div className="text-center p-6 bg-muted/50 rounded-lg space-y-4">
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={playListeningQuestion}
                    >
                      <Volume2 className="w-5 h-5 mr-2" />
                      Ouvir Palavra
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Ouça a palavra e selecione a opção correta
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {currentQuestion.options?.map((option, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="lg"
                        className={`h-auto py-4 ${
                          showResult && option.toLowerCase() === currentQuestion.correctAnswer
                            ? 'border-green-500 bg-green-500/10'
                            : showResult && userAnswer === option && !isCorrect
                            ? 'border-red-500 bg-red-500/10'
                            : ''
                        }`}
                        onClick={() => {
                          if (!showResult) {
                            setUserAnswer(option);
                            checkAnswer(option);
                          }
                        }}
                        disabled={showResult}
                      >
                        {option}
                        {showResult && option.toLowerCase() === currentQuestion.correctAnswer && (
                          <CheckCircle2 className="ml-2 w-5 h-5 text-green-600" />
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Hint */}
              {!showResult && currentQuestion.word.definition && (
                <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Dica:</strong> {currentQuestion.word.definition}
                  </p>
                </div>
              )}

              {/* Next Button */}
              {showResult && (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleNext}
                >
                  {currentIndex < questions.length - 1 ? 'Próxima Questão' : 'Ver Resultado'}
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
