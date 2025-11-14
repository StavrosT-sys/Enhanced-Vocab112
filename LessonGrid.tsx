/**
 * LessonGrid Component
 * Visual 16-week calendar with hover effects and progress tracking
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Lock, 
  Play,
  BookOpen,
  RotateCcw
} from 'lucide-react';
import type { Lesson } from '@/types/lesson';

interface LessonGridProps {
  lessons: Lesson[];
  completedLessons: number[];
  currentLesson?: number;
  onLessonClick: (lessonDay: number) => void;
  allowSkip?: boolean; // If false, lessons must be completed sequentially
}

export function LessonGrid({
  lessons,
  completedLessons,
  currentLesson,
  onLessonClick,
  allowSkip = false,
}: LessonGridProps) {
  
  // Group lessons by week
  const weekGroups = useMemo(() => {
    const groups: Lesson[][] = [];
    for (let week = 1; week <= 16; week++) {
      const weekLessons = lessons.filter(l => l.week === week);
      groups.push(weekLessons);
    }
    return groups;
  }, [lessons]);

  const getDifficultyColor = (lesson: Lesson) => {
    // Map grammar complexity to difficulty
    const day = lesson.day;
    if (day <= 28) return 'from-green-500/20 to-green-600/20 border-green-500/30'; // A1
    if (day <= 56) return 'from-blue-500/20 to-blue-600/20 border-blue-500/30'; // A2
    if (day <= 84) return 'from-orange-500/20 to-orange-600/20 border-orange-500/30'; // B1
    return 'from-purple-500/20 to-purple-600/20 border-purple-500/30'; // B2
  };

  const getLevelBadge = (lesson: Lesson) => {
    const day = lesson.day;
    if (day <= 28) return { label: 'A1', color: 'bg-green-500' };
    if (day <= 56) return { label: 'A2', color: 'bg-blue-500' };
    if (day <= 84) return { label: 'B1', color: 'bg-orange-500' };
    return { label: 'B2', color: 'bg-purple-500' };
  };

  const isLessonCompleted = (day: number) => completedLessons.includes(day);
  const isLessonCurrent = (day: number) => day === currentLesson;
  const isLessonLocked = (day: number) => {
    if (allowSkip) return false;
    // Lesson is locked if previous lesson isn't completed
    if (day === 1) return false;
    return !isLessonCompleted(day - 1);
  };

  const getLessonIcon = (lesson: Lesson) => {
    if (lesson.is_review) return <RotateCcw className="w-4 h-4" />;
    if (isLessonCompleted(lesson.day)) return <CheckCircle2 className="w-4 h-4" />;
    if (isLessonCurrent(lesson.day)) return <Play className="w-4 h-4" />;
    if (isLessonLocked(lesson.day)) return <Lock className="w-4 h-4" />;
    return <BookOpen className="w-4 h-4" />;
  };

  return (
    <div className="space-y-8">
      {weekGroups.map((weekLessons, weekIndex) => {
        const week = weekIndex + 1;
        const weekComplete = weekLessons.every(l => isLessonCompleted(l.day));
        const weekProgress = weekLessons.filter(l => isLessonCompleted(l.day)).length;
        
        return (
          <div key={week} className="space-y-4">
            {/* Week Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold text-foreground">
                  Semana {week}
                </h3>
                {weekComplete && (
                  <Badge className="bg-green-500 text-white">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Completa
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {weekProgress} / {weekLessons.length} lições
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${(weekProgress / weekLessons.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Lesson Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {weekLessons.map((lesson, index) => {
                const completed = isLessonCompleted(lesson.day);
                const current = isLessonCurrent(lesson.day);
                const locked = isLessonLocked(lesson.day);
                const level = getLevelBadge(lesson);

                return (
                  <motion.div
                    key={lesson.day}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={`
                        relative overflow-hidden cursor-pointer transition-all duration-300
                        hover:shadow-lg hover:-translate-y-1
                        ${completed ? 'border-2 border-green-500' : ''}
                        ${current ? 'border-2 border-primary ring-2 ring-primary/20' : ''}
                        ${locked ? 'opacity-50 cursor-not-allowed' : ''}
                        ${!completed && !locked && !current ? 'hover:border-primary/50' : ''}
                      `}
                      onClick={() => !locked && onLessonClick(lesson.day)}
                    >
                      {/* Background Gradient */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${getDifficultyColor(lesson)} opacity-50`} />

                      <CardContent className="relative p-4 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`
                              p-2 rounded-lg
                              ${completed ? 'bg-green-500/20 text-green-600' : ''}
                              ${current ? 'bg-primary/20 text-primary' : ''}
                              ${locked ? 'bg-muted text-muted-foreground' : ''}
                              ${!completed && !locked && !current ? 'bg-muted/50' : ''}
                            `}>
                              {getLessonIcon(lesson)}
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Dia {lesson.day}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${level.color} text-white border-none`}
                                >
                                  {level.label}
                                </Badge>
                                {lesson.is_review && (
                                  <Badge variant="secondary" className="text-xs">
                                    Revisão
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className="font-semibold text-sm line-clamp-2 text-foreground min-h-[2.5rem]">
                          {lesson.title}
                        </h4>

                        {/* Stats */}
                        {!lesson.is_review && (
                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                            <span>{lesson.new_words?.length || 0} palavras</span>
                            <span>{lesson.phrases?.length || 0} frases</span>
                          </div>
                        )}

                        {/* Locked Overlay */}
                        {locked && (
                          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                            <div className="text-center">
                              <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-xs text-muted-foreground">
                                Complete Dia {lesson.day - 1}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Current Indicator */}
                        {current && (
                          <div className="absolute top-2 right-2">
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="w-3 h-3 bg-primary rounded-full"
                            />
                          </div>
                        )}

                        {/* Completed Checkmark */}
                        {completed && (
                          <div className="absolute top-2 right-2">
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
