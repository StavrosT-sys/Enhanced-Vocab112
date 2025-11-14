/**
 * AnimatedProgressRing Component
 * Circular progress indicator with count-up animation
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

interface AnimatedProgressRingProps {
  current: number;
  total: number;
  label: string;
  sublabel?: string;
  color?: string;
  size?: number;
  strokeWidth?: number;
  duration?: number;
  icon?: React.ReactNode;
}

export function AnimatedProgressRing({
  current,
  total,
  label,
  sublabel,
  color = 'hsl(var(--primary))',
  size = 200,
  strokeWidth = 12,
  duration = 2,
  icon,
}: AnimatedProgressRingProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const percentage = Math.min((current / total) * 100, 100);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  // Animate the number count-up
  useEffect(() => {
    let start = 0;
    const end = current;
    const increment = end / (duration * 60); // 60fps
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [current, duration]);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6 flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
          {/* Background Circle */}
          <svg
            width={size}
            height={size}
            className="transform -rotate-90"
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="hsl(var(--muted))"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress Circle */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration, ease: 'easeOut' }}
            />
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {icon && <div className="mb-2 text-primary">{icon}</div>}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-foreground">
                {displayValue}
              </div>
              <div className="text-sm text-muted-foreground">
                de {total}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Label */}
        <div className="mt-4 text-center">
          <h3 className="text-lg font-semibold text-foreground">{label}</h3>
          {sublabel && (
            <p className="text-sm text-muted-foreground mt-1">{sublabel}</p>
          )}
          <div className="mt-2">
            <span className="text-2xl font-bold text-primary">
              {Math.round(percentage)}%
            </span>
            <span className="text-sm text-muted-foreground ml-1">completo</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
