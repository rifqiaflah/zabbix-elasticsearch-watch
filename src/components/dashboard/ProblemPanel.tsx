import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AlertOctagon, CheckCircle2 } from 'lucide-react';
import { ZabbixProblem } from '@/types/monitoring';
import { cn } from '@/lib/utils';

interface ProblemPanelProps {
  problems: ZabbixProblem[];
}

const ProblemPanel = ({ problems }: ProblemPanelProps) => {
  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      disaster: 'bg-destructive text-destructive-foreground',
      high: 'bg-destructive/80 text-destructive-foreground',
      average: 'bg-warning text-warning-foreground',
      warning: 'bg-warning/80 text-warning-foreground',
      information: 'bg-primary/80 text-primary-foreground',
      not_classified: 'bg-muted text-muted-foreground',
    };
    return colors[severity] || colors.not_classified;
  };

  const getSeverityBorder = (severity: string) => {
    const borders: Record<string, string> = {
      disaster: 'border-l-destructive',
      high: 'border-l-destructive/80',
      average: 'border-l-warning',
      warning: 'border-l-warning/80',
      information: 'border-l-primary',
      not_classified: 'border-l-muted',
    };
    return borders[severity] || borders.not_classified;
  };

  const formatTime = (clock: string) => {
    const date = new Date(parseInt(clock) * 1000);
    return date.toLocaleString('id-ID', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card variant="glass" className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertOctagon className="w-4 h-4 text-destructive" />
          Zabbix Problems
          <Badge 
            variant="outline" 
            className={cn(
              "ml-auto text-xs",
              problems.length > 0 ? "border-destructive text-destructive" : "border-success text-success"
            )}
          >
            {problems.length} active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4 scrollbar-thin">
          <div className="space-y-2">
            {problems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-success">
                <CheckCircle2 className="w-12 h-12 mb-2 opacity-50" />
                <span className="text-sm">No active problems</span>
              </div>
            ) : (
              problems.map((problem) => (
                <div
                  key={problem.eventid}
                  className={cn(
                    "p-3 rounded-lg bg-secondary/50 border border-border/50 border-l-4",
                    getSeverityBorder(problem.severity),
                    "hover:bg-secondary/80 transition-colors duration-200",
                    "animate-fade-in"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={cn("text-xs", getSeverityColor(problem.severity))}>
                          {problem.severity.toUpperCase()}
                        </Badge>
                        {problem.acknowledged && (
                          <Badge variant="outline" className="text-xs border-success text-success">
                            ACK
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1 line-clamp-2">
                        {problem.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Host: {problem.host}</span>
                        <span>•</span>
                        <span className="font-mono">{formatTime(problem.clock)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ProblemPanel;
