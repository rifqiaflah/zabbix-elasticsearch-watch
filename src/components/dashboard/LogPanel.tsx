import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertTriangle, AlertCircle, Info, Shield, Zap } from 'lucide-react';
import { ElasticLog } from '@/types/monitoring';
import { cn } from '@/lib/utils';

interface LogPanelProps {
  logs: ElasticLog[];
  title: string;
  icon?: React.ReactNode;
}

const LogPanel = ({ logs, title, icon }: LogPanelProps) => {
  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      default:
        return <Info className="w-4 h-4 text-primary" />;
    }
  };

  const getLevelBadge = (level: string) => {
    const variants: Record<string, string> = {
      critical: 'bg-destructive/20 text-destructive border-destructive/30',
      error: 'bg-destructive/20 text-destructive border-destructive/30',
      warning: 'bg-warning/20 text-warning border-warning/30',
      info: 'bg-primary/20 text-primary border-primary/30',
    };
    return variants[level] || variants.info;
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'bruteforce':
        return <Shield className="w-3 h-3 text-destructive" />;
      case 'ddos':
        return <Zap className="w-3 h-3 text-warning" />;
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Card variant="glass" className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon || <FileText className="w-4 h-4 text-primary" />}
          {title}
          <Badge variant="outline" className="ml-auto text-xs">
            {logs.length} entries
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4 scrollbar-thin">
          <div className="space-y-2">
            {logs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No logs available
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={cn(
                    "p-3 rounded-lg bg-secondary/50 border border-border/50",
                    "hover:bg-secondary/80 transition-colors duration-200",
                    "animate-fade-in"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {getLevelIcon(log.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full border", getLevelBadge(log.level))}>
                          {log.level.toUpperCase()}
                        </span>
                        {log.type && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            {getTypeIcon(log.type)}
                            {log.type}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto font-mono">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm font-mono text-foreground/90 break-all">
                        {log.message}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        Source: {log.source}
                      </span>
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

export default LogPanel;
