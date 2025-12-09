import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Server, Cpu, MemoryStick, ArrowDownToLine, ArrowUpFromLine, Circle } from 'lucide-react';
import { ZabbixHost } from '@/types/monitoring';
import { cn } from '@/lib/utils';

interface HostTableProps {
  hosts: ZabbixHost[];
}

const HostTable = ({ hosts }: HostTableProps) => {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUsageColor = (value: number) => {
    if (value >= 90) return 'text-destructive';
    if (value >= 70) return 'text-warning';
    return 'text-success';
  };

  const getUsageBar = (value: number) => {
    let bgColor = 'bg-success';
    if (value >= 90) bgColor = 'bg-destructive';
    else if (value >= 70) bgColor = 'bg-warning';
    
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-500", bgColor)}
            style={{ width: `${Math.min(value, 100)}%` }}
          />
        </div>
        <span className={cn("font-mono text-sm", getUsageColor(value))}>
          {value.toFixed(1)}%
        </span>
      </div>
    );
  };

  return (
    <Card variant="glass">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Server className="w-4 h-4 text-primary" />
          Daftar Host Zabbix
          <Badge variant="outline" className="ml-auto text-xs">
            {hosts.length} hosts
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Host</TableHead>
                <TableHead className="text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Cpu className="w-3 h-3" /> CPU
                  </div>
                </TableHead>
                <TableHead className="text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MemoryStick className="w-3 h-3" /> RAM
                  </div>
                </TableHead>
                <TableHead className="text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <ArrowDownToLine className="w-3 h-3" /> In
                  </div>
                </TableHead>
                <TableHead className="text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <ArrowUpFromLine className="w-3 h-3" /> Out
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No hosts available
                  </TableCell>
                </TableRow>
              ) : (
                hosts.map((host) => (
                  <TableRow 
                    key={host.hostid} 
                    className="border-border hover:bg-secondary/50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Circle 
                          className={cn(
                            "w-3 h-3 fill-current",
                            host.status === 'up' ? 'text-success' : 'text-destructive'
                          )} 
                        />
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            host.status === 'up' 
                              ? 'border-success/50 text-success' 
                              : 'border-destructive/50 text-destructive'
                          )}
                        >
                          {host.status.toUpperCase()}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{host.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{host.host}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getUsageBar(host.cpu)}</TableCell>
                    <TableCell>{getUsageBar(host.ram)}</TableCell>
                    <TableCell>
                      <span className="font-mono text-sm text-primary">
                        {formatBytes(host.bandwidthIn)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm text-accent">
                        {formatBytes(host.bandwidthOut)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default HostTable;
