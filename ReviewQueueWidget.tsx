/**
 * ReviewQueueWidget Component
 * Shows words due for spaced repetition review
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Clock, 
  TrendingUp, 
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { SpacedRepetitionSystem } from '@/lib/spacedRepetition';

interface ReviewQueueWidgetProps {
  onStartReview?: () => void;
}

export function ReviewQueueWidget({ onStartReview }: ReviewQueueWidgetProps) {
  const stats = useMemo(() => SpacedRepetitionSystem.getStats(), []);
  const dueCards = useMemo(() => SpacedRepetitionSystem.getDueCards(), []);
  const upcomingCards = useMemo(() => SpacedRepetitionSystem.getUpcomingCards(7), []);

  const retentionRate = stats.totalCards > 0
    ? Math.round(((stats.masteredCards + stats.learningCards) / stats.totalCards) * 100)
    : 0;

  const hasDueReviews = stats.dueToday > 0;

  return (
    <Card className={hasDueReviews ? 'border-2 border-primary' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <CardTitle>Fila de Revisão</CardTitle>
          </div>
          {hasDueReviews && (
            <Badge variant="default" className="animate-pulse">
              <AlertCircle className="w-3 h-3 mr-1" />
              {stats.dueToday} {stats.dueToday === 1 ? 'palavra' : 'palavras'}
            </Badge>
          )}
        </div>
        <CardDescription>
          Sistema de repetição espaçada para retenção de longo prazo
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20"
          >
            <div className="text-3xl font-bold text-primary mb-1">
              {stats.dueToday}
            </div>
            <div className="text-sm text-muted-foreground">
              Revisões Hoje
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center p-4 bg-muted/50 rounded-lg"
          >
            <div className="text-3xl font-bold text-foreground mb-1">
              {stats.dueThisWeek}
            </div>
            <div className="text-sm text-muted-foreground">
              Esta Semana
            </div>
          </motion.div>
        </div>

        {/* Progress Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso de Aprendizado</span>
            <span className="font-semibold">{retentionRate}%</span>
          </div>

          <div className="space-y-2">
            {/* Mastered */}
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Dominadas</span>
                  <span className="font-medium">{stats.masteredCards}</span>
                </div>
                <Progress 
                  value={stats.totalCards > 0 ? (stats.masteredCards / stats.totalCards) * 100 : 0} 
                  className="h-2 bg-muted"
                  indicatorClassName="bg-green-500"
                />
              </div>
            </div>

            {/* Learning */}
            <div className="flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Aprendendo</span>
                  <span className="font-medium">{stats.learningCards}</span>
                </div>
                <Progress 
                  value={stats.totalCards > 0 ? (stats.learningCards / stats.totalCards) * 100 : 0} 
                  className="h-2 bg-muted"
                  indicatorClassName="bg-blue-500"
                />
              </div>
            </div>

            {/* New */}
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Novas</span>
                  <span className="font-medium">{stats.newCards}</span>
                </div>
                <Progress 
                  value={stats.totalCards > 0 ? (stats.newCards / stats.totalCards) * 100 : 0} 
                  className="h-2 bg-muted"
                  indicatorClassName="bg-orange-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Total Cards */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total de Palavras</span>
            <span className="text-xl font-bold text-foreground">
              {stats.totalCards}
            </span>
          </div>
        </div>

        {/* CTA Button */}
        {hasDueReviews ? (
          <Button 
            size="lg" 
            className="w-full" 
            onClick={onStartReview}
          >
            <Brain className="w-4 h-4 mr-2" />
            Começar Revisão ({stats.dueToday})
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">
              Parabéns! Sem revisões pendentes hoje!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {upcomingCards.length > 0 
                ? `Próximas revisões em breve` 
                : 'Continue completando lições para adicionar palavras à fila'
              }
            </p>
          </div>
        )}

        {/* Upcoming Reviews */}
        {upcomingCards.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Próximas Revisões
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
                const date = new Date();
                date.setDate(date.getDate() + dayOffset);
                const dateStr = date.toISOString().split('T')[0];
                
                const cardsOnDay = upcomingCards.filter(card => {
                  const cardDate = new Date(card.nextReview).toISOString().split('T')[0];
                  return cardDate === dateStr;
                }).length;

                return (
                  <div key={dayOffset} className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">
                      {date.toLocaleDateString('pt-BR', { weekday: 'short' })}
                    </div>
                    <div className={`text-sm font-medium rounded p-1 ${
                      cardsOnDay > 0 
                        ? 'bg-primary/20 text-primary' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {cardsOnDay || '-'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-center text-muted-foreground pt-2">
          💡 Revisões regulares aumentam a retenção em até 80%
        </div>
      </CardContent>
    </Card>
  );
}
