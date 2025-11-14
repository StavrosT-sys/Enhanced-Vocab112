/**
 * StreakCalendar Component
 * GitHub-style contribution calendar showing study streak
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Calendar } from 'lucide-react';

interface StreakData {
  date: string; // ISO date string
  lessonsCompleted: number;
  wordsLearned: number;
}

interface StreakCalendarProps {
  streakData: StreakData[];
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
}

export function StreakCalendar({
  streakData,
  currentStreak,
  longestStreak,
  totalDays,
}: StreakCalendarProps) {
  // Generate last 90 days
  const calendarDays = useMemo(() => {
    const days: Array<{ date: Date; count: number; intensity: number }> = [];
    const today = new Date();
    
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dateStr = date.toISOString().split('T')[0];
      const dayData = streakData.find(d => d.date === dateStr);
      const count = dayData?.lessonsCompleted || 0;
      
      // Intensity levels: 0 (none), 1 (low), 2 (medium), 3 (high)
      let intensity = 0;
      if (count > 0) intensity = 1;
      if (count >= 2) intensity = 2;
      if (count >= 4) intensity = 3;
      
      days.push({ date, count, intensity });
    }
    
    return days;
  }, [streakData]);

  // Group by weeks
  const weeks = useMemo(() => {
    const weekGroups: typeof calendarDays[] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weekGroups.push(calendarDays.slice(i, i + 7));
    }
    return weekGroups;
  }, [calendarDays]);

  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 0: return 'bg-muted';
      case 1: return 'bg-primary/30';
      case 2: return 'bg-primary/60';
      case 3: return 'bg-primary';
      default: return 'bg-muted';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <CardTitle>Sequência de Estudo</CardTitle>
          </div>
          {currentStreak > 0 && (
            <Badge className="bg-orange-500 text-white">
              <Flame className="w-3 h-3 mr-1 fill-current" />
              {currentStreak} {currentStreak === 1 ? 'dia' : 'dias'}
            </Badge>
          )}
        </div>
        <CardDescription>
          Últimos 90 dias de atividade
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">{currentStreak}</div>
            <div className="text-xs text-muted-foreground">Atual</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">{longestStreak}</div>
            <div className="text-xs text-muted-foreground">Recorde</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">{totalDays}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto">
          <div className="inline-flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <motion.div
                    key={dayIndex}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: (weekIndex * 7 + dayIndex) * 0.01 }}
                    className="group relative"
                  >
                    <div
                      className={`w-3 h-3 rounded-sm ${getIntensityColor(day.intensity)} 
                        transition-all duration-200 hover:ring-2 hover:ring-primary hover:scale-125`}
                      title={`${formatDate(day.date)}: ${day.count} ${day.count === 1 ? 'lição' : 'lições'}`}
                    />
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                      px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg
                      opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity
                      whitespace-nowrap z-10 border">
                      <div className="font-semibold">{formatDate(day.date)}</div>
                      <div>
                        {day.count === 0 
                          ? 'Sem atividade' 
                          : `${day.count} ${day.count === 1 ? 'lição' : 'lições'}`
                        }
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Menos</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <div className="w-3 h-3 rounded-sm bg-primary/30" />
            <div className="w-3 h-3 rounded-sm bg-primary/60" />
            <div className="w-3 h-3 rounded-sm bg-primary" />
          </div>
          <span>Mais</span>
        </div>

        {/* Motivational Message */}
        {currentStreak === 0 && (
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Complete uma lição hoje para começar sua sequência! 🔥
            </p>
          </div>
        )}
        {currentStreak > 0 && currentStreak < 7 && (
          <div className="text-center p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Continue assim! Você está construindo um ótimo hábito! 💪
            </p>
          </div>
        )}
        {currentStreak >= 7 && currentStreak < 30 && (
          <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <p className="text-sm text-green-700 dark:text-green-300">
              Incrível! {currentStreak} dias seguidos! Você é dedicado! 🌟
            </p>
          </div>
        )}
        {currentStreak >= 30 && (
          <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <p className="text-sm text-purple-700 dark:text-purple-300">
              LENDÁRIO! {currentStreak} dias! Você é uma inspiração! 🏆
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
