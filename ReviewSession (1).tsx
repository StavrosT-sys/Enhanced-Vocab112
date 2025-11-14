/**
 * ReviewSession Component
 * Spaced repetition review session with quality rating
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  Zap,
  Volume2,
  Trophy,
  RotateCcw
} from 'lucide-react';
import { 
  SpacedRepetitionSystem, 
  ReviewQuality,
  type ReviewCard 
} from '@/lib/spacedRepetition';
import { speakWord } from '@/lib/audioUtils';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface ReviewSessionProps {
  onComplete?: (cardsReviewed: number) => void;
  maxCards?: number;
}

export function ReviewSession({
  onComplete,
  maxCards = 20,
}: ReviewSessionProps) {
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [reviewCount, setReviewCount] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });

  useEffect(() => {
    const dueCards = SpacedRepetitionSystem.getDueCards();
    const sessionCards = dueCards.slice(0, Math.min(maxCards, dueCards.length));
    setCards(sessionCards);

    if (sessionCards.length === 0) {
      setSessionComplete(true);
    }
  }, [maxCards]);

  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;
  const cardsReviewed = currentIndex;

  const handlePlayAudio = async () => {
    if (currentCard) {
      await speakWord(currentCard.word);
    }
  };

  const handleReview = (quality: ReviewQuality) => {
    if (!currentCard) return;

    // Update card in system
    SpacedRepetitionSystem.reviewCard(currentCard.word, quality);

    // Update local counts
    const qualityNames = ['again', 'hard', 'good', 'easy'] as const;
    setReviewCount(prev => ({
      ...prev,
      [qualityNames[quality]]: prev[qualityNames[quality]] + 1,
    }));

    // Show feedback
    if (quality === ReviewQuality.AGAIN) {
      toast.error('Não se preocupe! Você verá esta palavra novamente em breve.', { duration: 2000 });
    } else if (quality === ReviewQuality.EASY) {
      toast.success('Excelente! Palavra dominada! 🌟', { duration: 2000 });
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.6 }
      });
    }

    // Move to next card
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      setSessionComplete(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      onComplete?.(cards.length);
    }
  };

  const restartSession = () => {
    const dueCards = SpacedRepetitionSystem.getDueCards();
    const sessionCards = dueCards.slice(0, Math.min(maxCards, dueCards.length));
    setCards(sessionCards);
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionComplete(false);
    setReviewCount({ again: 0, hard: 0, good: 0, easy: 0 });
  };

  if (cards.length === 0 && !sessionComplete) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">
            Sem Revisões Pendentes!
          </h2>
          <p className="text-muted-foreground">
            Parabéns! Você está em dia com suas revisões.
          </p>
          <p className="text-sm text-muted-foreground">
            Continue completando lições para adicionar mais palavras à fila de revisão.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (sessionComplete) {
    const totalReviewed = reviewCount.again + reviewCount.hard + reviewCount.good + reviewCount.easy;
    const successRate = totalReviewed > 0
      ? Math.round(((reviewCount.good + reviewCount.easy) / totalReviewed) * 100)
      : 0;

    return (
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-4">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto" />
            <h2 className="text-3xl font-bold text-foreground">
              Sessão de Revisão Completa!
            </h2>
            <div className="text-6xl font-bold text-primary">
              {successRate}%
            </div>
            <p className="text-lg text-muted-foreground">
              Você revisou {totalReviewed} {totalReviewed === 1 ? 'palavra' : 'palavras'}
            </p>
          </div>

          {/* Stats Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <div className="text-2xl font-bold text-red-600">
                {reviewCount.again}
              </div>
              <div className="text-sm text-muted-foreground">Repetir</div>
            </div>
            <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <div className="text-2xl font-bold text-orange-600">
                {reviewCount.hard}
              </div>
              <div className="text-sm text-muted-foreground">Difícil</div>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="text-2xl font-bold text-blue-600">
                {reviewCount.good}
              </div>
              <div className="text-sm text-muted-foreground">Bom</div>
            </div>
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="text-2xl font-bold text-green-600">
                {reviewCount.easy}
              </div>
              <div className="text-sm text-muted-foreground">Fácil</div>
            </div>
          </div>

          {/* Motivational Message */}
          {successRate >= 80 && (
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20 text-center">
              <p className="text-green-700 dark:text-green-300 font-semibold">
                Excelente! Sua retenção está ótima! 🌟
              </p>
            </div>
          )}
          {successRate >= 50 && successRate < 80 && (
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20 text-center">
              <p className="text-blue-700 dark:text-blue-300 font-semibold">
                Bom trabalho! Continue praticando! 💪
              </p>
            </div>
          )}
          {successRate < 50 && (
            <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20 text-center">
              <p className="text-orange-700 dark:text-orange-300 font-semibold">
                Continue se esforçando! A prática leva à perfeição! 📚
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={restartSession}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Nova Sessão
            </Button>
            <Button
              size="lg"
              onClick={() => onComplete?.(totalReviewed)}
            >
              Voltar ao Painel
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
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <Badge variant="outline">
                  Palavra {currentIndex + 1} de {cards.length}
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground">
                {cardsReviewed} revisadas
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Review Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <Card 
            className="cursor-pointer select-none"
            onClick={() => !showAnswer && setShowAnswer(true)}
          >
            <CardContent className="p-8 min-h-[400px] flex flex-col items-center justify-center">
              {!showAnswer ? (
                /* Question Side */
                <div className="text-center space-y-6 w-full">
                  <div className="space-y-4">
                    <h2 className="text-5xl font-bold text-primary">
                      {currentCard.word}
                    </h2>
                    <Badge variant="secondary">
                      Lição {currentCard.lessonDay}
                    </Badge>
                  </div>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayAudio();
                    }}
                  >
                    <Volume2 className="w-5 h-5 mr-2" />
                    Ouvir Pronuncia
                  </Button>

                  <p className="text-lg text-muted-foreground mt-8">
                    Você se lembra desta palavra?
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Clique para revelar a resposta
                  </p>
                </div>
              ) : (
                /* Answer Side */
                <div className="text-center space-y-6 w-full">
                  <div className="space-y-4">
                    <h2 className="text-4xl font-bold text-foreground">
                      {currentCard.word}
                    </h2>
                    {/* TODO: Get definition and translation from dictionary */}
                    <div className="max-w-xl mx-auto space-y-2">
                      <p className="text-xl text-muted-foreground">
                        [Definição em inglês]
                      </p>
                      <p className="text-xl text-secondary-foreground">
                        [Tradução em português]
                      </p>
                    </div>
                  </div>

                  <div className="pt-8">
                    <p className="text-sm text-muted-foreground mb-4">
                      Quão bem você lembrou desta palavra?
                    </p>

                    {/* Quality Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        size="lg"
                        className="border-red-500/50 hover:bg-red-500/10 h-auto py-4"
                        onClick={() => handleReview(ReviewQuality.AGAIN)}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <XCircle className="w-5 h-5" />
                          <span>Repetir</span>
                          <span className="text-xs text-muted-foreground">
                            Não lembrei
                          </span>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        size="lg"
                        className="border-orange-500/50 hover:bg-orange-500/10 h-auto py-4"
                        onClick={() => handleReview(ReviewQuality.HARD)}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <ThumbsUp className="w-5 h-5 rotate-180" />
                          <span>Difícil</span>
                          <span className="text-xs text-muted-foreground">
                            Com esforço
                          </span>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        size="lg"
                        className="border-blue-500/50 hover:bg-blue-500/10 h-auto py-4"
                        onClick={() => handleReview(ReviewQuality.GOOD)}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Bom</span>
                          <span className="text-xs text-muted-foreground">
                            Lembrei bem
                          </span>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        size="lg"
                        className="border-green-500/50 hover:bg-green-500/10 h-auto py-4"
                        onClick={() => handleReview(ReviewQuality.EASY)}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Zap className="w-5 h-5" />
                          <span>Fácil</span>
                          <span className="text-xs text-muted-foreground">
                            Muito fácil
                          </span>
                        </div>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Instructions */}
      <Card>
        <CardContent className="p-4">
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Repetir:</strong> Não consegui lembrar (verá novamente hoje)</p>
            <p><strong>Difícil:</strong> Lembrei com dificuldade (revisão em 1 dia)</p>
            <p><strong>Bom:</strong> Lembrei sem problemas (revisão em 3+ dias)</p>
            <p><strong>Fácil:</strong> Muito fácil de lembrar (revisão em 7+ dias)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
