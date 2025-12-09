import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Activity } from 'lucide-react';

interface ServerStatusBarProps {
  up: number;
  down: number;
  total: number;
}

const ServerStatusBar = ({ up, down, total }: ServerStatusBarProps) => {
  const upPercentage = total > 0 ? (up / total) * 100 : 0;
  const downPercentage = total > 0 ? (down / total) * 100 : 0;

  return (
    <Card variant="glass">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="w-4 h-4 text-primary" />
          Server Status Hari Ini
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative h-8 rounded-full overflow-hidden bg-secondary">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-success to-success/80 transition-all duration-500"
              style={{ width: `${upPercentage}%` }}
            />
            <div
              className="absolute right-0 top-0 h-full bg-gradient-to-l from-destructive to-destructive/80 transition-all duration-500"
              style={{ width: `${downPercentage}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono font-bold text-sm">
                {upPercentage.toFixed(1)}% Online
              </span>
            </div>
          </div>
          
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
              <span className="text-muted-foreground">Up:</span>
              <span className="font-bold text-success">{up}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
              <span className="text-muted-foreground">Down:</span>
              <span className="font-bold text-destructive">{down}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServerStatusBar;
