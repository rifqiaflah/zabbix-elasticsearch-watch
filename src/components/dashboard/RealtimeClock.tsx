import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const RealtimeClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="flex items-center gap-4 bg-secondary/50 rounded-lg px-6 py-3 border border-border">
      <Clock className="w-5 h-5 text-primary animate-pulse-ring" />
      <div className="flex flex-col">
        <span className="font-mono text-2xl font-bold text-primary tracking-wider">
          {formatTime(time)}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDate(time)}
        </span>
      </div>
    </div>
  );
};

export default RealtimeClock;
