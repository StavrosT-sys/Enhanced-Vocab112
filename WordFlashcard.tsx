/**
 * WordFlashcard Component
 * Interactive flashcard for vocabulary learning with flip animation, audio, and progress tracking
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Volume2, 
  Check, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  Star,
  StarOff
} from 'lucide-react';
import { speakWord, speakTranslation } from '@/lib/audioUtils';
import { toast } from 'sonner';

export interface WordData {
  word: string;
  definition?: string;
  portuguese?: string;
  pronunciation?: string;
  partOfSpeech?: string;
  example?: string;
}

interface WordFlashcardProps {
  word: WordData;
  index: number;
  total: number;
  isLearned?: boolean;
  onMarkLearned?: (word: string, learned: boolean) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  showNavigation?: boolean;
}

type CardFace = 'word' | 'definition' | 'translation';

export function WordFlashcard({
  word,
  index,
  total,
  isLearned = false,
  onMarkLearned,
  onNext,
  onPrevious,
  showNavigation = true,
}: WordFlashcardProps) {
  const [currentFace, setCurrentFace] = useState<CardFace>('word');
  const [isFlipping, setIsFlipping] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const flipToNext = () => {
    if (isFlipping) return;
    
    setIsFlipping(true);
    setTimeout(() => {
      if (currentFace === 'word') {
        setCurrentFace('definition');
      } else if (currentFace === 'definition') {
        setCurrentFace('translation');
      } else {
        setCurrentFace('word');
      }
      setIsFlipping(false);
    }, 150);
  };

  const handlePlayAudio = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlayingAudio) return;

    setIsPlayingAudio(true);
    try {
      if (currentFace === 'word' || currentFace === 'definition') {
        await speakWord(word.word);
      } else if (currentFace === 'translation' && word.portuguese) {
        await speakTranslation(word.portuguese);
      }
    } catch (error) {
      toast.error('Audio playback failed');
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const handleToggleLearned = () => {
    onMarkLearned?.(word.word, !isLearned);
    toast.success(
      isLearned 
        ? `"${word.word}" marcado como não aprendido` 
        : `"${word.word}" marcado como aprendido! 🎉`,
      { duration: 2000 }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      flipToNext();
    } else if (e.key === 'ArrowRight' && onNext) {
      onNext();
    } else if (e.key === 'ArrowLeft' && onPrevious) {
      onPrevious();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {index + 1} / {total}
          </Badge>
          {isLearned && (
            <Badge className="bg-secondary text-secondary-foreground">
              <Check className="w-3 h-3 mr-1" />
              Aprendido
            </Badge>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="flex-1 mx-4 h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((index + 1) / total) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <span className="text-sm text-muted-foreground">
          {Math.round(((index + 1) / total) * 100)}%
        </span>
      </div>

      {/* Flashcard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className="relative cursor-pointer select-none hover:shadow-lg transition-shadow border-2"
          onClick={flipToNext}
          onKeyDown={handleKeyPress}
          tabIndex={0}
          role="button"
          aria-label={`Flashcard for word: ${word.word}. Press space to flip.`}
        >
          <CardContent className="p-8 min-h-[400px] flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentFace}
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full text-center space-y-6"
              >
                {/* Word Face */}
                {currentFace === 'word' && (
                  <>
                    <div className="space-y-4">
                      <h2 className="text-6xl font-bold text-primary">
                        {word.word}
                      </h2>
                      {word.pronunciation && (
                        <p className="text-xl text-muted-foreground">
                          /{word.pronunciation}/
                        </p>
                      )}
                      {word.partOfSpeech && (
                        <Badge variant="secondary" className="text-sm">
                          {word.partOfSpeech}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-8">
                      Clique para ver a definição
                    </p>
                  </>
                )}

                {/* Definition Face */}
                {currentFace === 'definition' && (
                  <>
                    <div className="space-y-4">
                      <h3 className="text-3xl font-semibold text-foreground">
                        {word.word}
                      </h3>
                      <div className="max-w-xl mx-auto space-y-4">
                        {word.definition && (
                          <p className="text-xl text-foreground leading-relaxed">
                            {word.definition}
                          </p>
                        )}
                        {word.example && (
                          <div className="pt-4 border-t border-muted">
                            <p className="text-sm text-muted-foreground mb-2">
                              Example:
                            </p>
                            <p className="text-base italic text-muted-foreground">
                              "{word.example}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-8">
                      Clique para ver a tradução
                    </p>
                  </>
                )}

                {/* Translation Face */}
                {currentFace === 'translation' && (
                  <>
                    <div className="space-y-4">
                      <h3 className="text-3xl font-semibold text-foreground">
                        {word.word}
                      </h3>
                      <div className="max-w-xl mx-auto space-y-4">
                        {word.portuguese && (
                          <p className="text-2xl font-medium text-secondary-foreground">
                            {word.portuguese}
                          </p>
                        )}
                        {word.definition && (
                          <p className="text-base text-muted-foreground">
                            {word.definition}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-8">
                      Clique para voltar
                    </p>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Audio Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4"
              onClick={handlePlayAudio}
              disabled={isPlayingAudio}
              aria-label="Play pronunciation"
            >
              <Volume2 className={`w-5 h-5 ${isPlayingAudio ? 'text-primary animate-pulse' : ''}`} />
            </Button>

            {/* Flip Indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {['word', 'definition', 'translation'].map((face) => (
                <div
                  key={face}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    currentFace === face ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            {/* Rotate Icon */}
            <RotateCcw className="absolute top-4 left-4 w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        {/* Navigation */}
        {showNavigation && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onPrevious}
              disabled={!onPrevious}
              aria-label="Previous word"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onNext}
              disabled={!onNext}
              aria-label="Next word"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Mark as Learned */}
        <Button
          variant={isLearned ? "default" : "outline"}
          onClick={handleToggleLearned}
          className="flex-1"
        >
          {isLearned ? (
            <>
              <Star className="w-4 h-4 mr-2 fill-current" />
              Palavra Aprendida
            </>
          ) : (
            <>
              <StarOff className="w-4 h-4 mr-2" />
              Marcar como Aprendido
            </>
          )}
        </Button>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="text-center text-xs text-muted-foreground space-y-1">
        <p>Atalhos: Espaço = Virar | ← → = Navegar</p>
      </div>
    </div>
  );
}
