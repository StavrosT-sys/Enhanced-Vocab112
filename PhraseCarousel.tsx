/**
 * PhraseCarousel Component
 * Swipeable phrase practice with audio playback and translation reveal
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Volume2, 
  ChevronLeft, 
  ChevronRight,
  Languages,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { speakPhrase } from '@/lib/audioUtils';
import { highlightPhrase } from '@/lib/phraseHighlighter';
import { toast } from 'sonner';

export interface PhraseData {
  english: string;
  portuguese?: string;
  highlighted?: string[]; // Words to highlight
}

interface PhraseCarouselProps {
  phrases: string[] | PhraseData[];
  highlightWords?: string[];
  onComplete?: () => void;
  showTranslations?: boolean;
}

type ReviewStatus = 'confident' | 'needs-practice' | null;

export function PhraseCarousel({
  phrases,
  highlightWords = [],
  onComplete,
  showTranslations = true,
}: PhraseCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [phraseStatuses, setPhraseStatuses] = useState<Record<number, ReviewStatus>>({});

  // Convert string arrays to PhraseData objects
  const normalizedPhrases: PhraseData[] = phrases.map(phrase => 
    typeof phrase === 'string' 
      ? { english: phrase, highlighted: highlightWords }
      : { ...phrase, highlighted: phrase.highlighted || highlightWords }
  );

  const currentPhrase = normalizedPhrases[currentIndex];
  const isLastPhrase = currentIndex === normalizedPhrases.length - 1;
  const isFirstPhrase = currentIndex === 0;

  // Calculate progress
  const completedCount = Object.values(phraseStatuses).filter(s => s !== null).length;
  const progress = (completedCount / normalizedPhrases.length) * 100;

  const goToNext = () => {
    if (currentIndex < normalizedPhrases.length - 1) {
      setDirection('right');
      setCurrentIndex(prev => prev + 1);
      setShowTranslation(false);
    } else if (onComplete) {
      onComplete();
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setDirection('left');
      setCurrentIndex(prev => prev - 1);
      setShowTranslation(false);
    }
  };

  const handlePlayAudio = async () => {
    if (isPlayingAudio) return;

    setIsPlayingAudio(true);
    try {
      await speakPhrase(currentPhrase.english);
    } catch (error) {
      toast.error('Audio playback failed');
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const handleSwipe = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      goToPrevious();
    } else if (info.offset.x < -threshold) {
      goToNext();
    }
  };

  const markPhraseStatus = (status: ReviewStatus) => {
    setPhraseStatuses(prev => ({ ...prev, [currentIndex]: status }));
    
    if (status === 'confident') {
      toast.success('Ótimo! 🎉', { duration: 1500 });
    } else {
      toast.info('Vamos praticar mais!', { duration: 1500 });
    }
    
    // Auto-advance after marking
    setTimeout(() => {
      goToNext();
    }, 500);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      goToNext();
    } else if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === ' ') {
      e.preventDefault();
      setShowTranslation(prev => !prev);
    } else if (e.key === 'Enter') {
      handlePlayAudio();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, showTranslation]);

  const variants = {
    enter: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? -1000 : 1000,
      opacity: 0,
    }),
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Progress Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              Frase {currentIndex + 1} de {normalizedPhrases.length}
            </Badge>
            {phraseStatuses[currentIndex] === 'confident' && (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle className="w-3 h-3 mr-1" />
                Confiante
              </Badge>
            )}
            {phraseStatuses[currentIndex] === 'needs-practice' && (
              <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                <XCircle className="w-3 h-3 mr-1" />
                Precisa praticar
              </Badge>
            )}
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {Math.round(progress)}% completo
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-1.5 flex-wrap">
          {normalizedPhrases.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDirection(idx > currentIndex ? 'right' : 'left');
                setCurrentIndex(idx);
                setShowTranslation(false);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? 'bg-primary w-6'
                  : phraseStatuses[idx] === 'confident'
                  ? 'bg-green-500'
                  : phraseStatuses[idx] === 'needs-practice'
                  ? 'bg-orange-500'
                  : 'bg-muted'
              }`}
              aria-label={`Go to phrase ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Phrase Card */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'tween', duration: 0.3 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleSwipe}
            className="absolute inset-0"
          >
            <Card className="h-full border-2 hover:shadow-lg transition-shadow">
              <CardContent className="p-8 h-full flex flex-col justify-between">
                {/* Main Content */}
                <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                  {/* English Phrase */}
                  <div className="text-center space-y-4 w-full">
                    <div className="text-2xl leading-relaxed text-foreground">
                      {currentPhrase.highlighted && currentPhrase.highlighted.length > 0 
                        ? highlightPhrase(currentPhrase.english, currentPhrase.highlighted)
                        : currentPhrase.english
                      }
                    </div>
                    
                    {/* Audio Button */}
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handlePlayAudio}
                      disabled={isPlayingAudio}
                      className="mx-auto"
                    >
                      <Volume2 className={`w-5 h-5 mr-2 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                      {isPlayingAudio ? 'Reproduzindo...' : 'Ouvir Frase'}
                    </Button>
                  </div>

                  {/* Translation Section */}
                  {showTranslations && currentPhrase.portuguese && (
                    <AnimatePresence>
                      {showTranslation && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="w-full max-w-xl mx-auto p-6 bg-secondary/20 rounded-lg border border-secondary"
                        >
                          <div className="flex items-start gap-3">
                            <Languages className="w-5 h-5 text-secondary-foreground flex-shrink-0 mt-0.5" />
                            <p className="text-lg text-secondary-foreground">
                              {currentPhrase.portuguese}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}

                  {/* Show Translation Button */}
                  {showTranslations && currentPhrase.portuguese && !showTranslation && (
                    <Button
                      variant="ghost"
                      onClick={() => setShowTranslation(true)}
                      className="mx-auto"
                    >
                      <Languages className="w-4 h-4 mr-2" />
                      Mostrar Tradução
                    </Button>
                  )}
                </div>

                {/* Review Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-6 border-t">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => markPhraseStatus('needs-practice')}
                    className="border-orange-500/50 hover:bg-orange-500/10"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Preciso Praticar
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => markPhraseStatus('confident')}
                    className="border-green-500/50 hover:bg-green-500/10"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Já Sei!
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goToPrevious}
          disabled={isFirstPhrase}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          <p>Deslize ou use as setas ← →</p>
          <p className="text-xs mt-1">Espaço = Tradução | Enter = Áudio</p>
        </div>

        <Button
          variant="outline"
          onClick={goToNext}
          disabled={false} // Can always go forward (will complete if last)
        >
          {isLastPhrase ? 'Concluir' : 'Próxima'}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
