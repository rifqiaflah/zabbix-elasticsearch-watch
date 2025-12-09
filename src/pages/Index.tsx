import { Server, ServerCrash, MonitorCheck, Activity, RefreshCw, Database, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RealtimeClock from '@/components/dashboard/RealtimeClock';
import StatsCard from '@/components/dashboard/StatsCard';
import ServerStatusBar from '@/components/dashboard/ServerStatusBar';
import LogPanel from '@/components/dashboard/LogPanel';
import ProblemPanel from '@/components/dashboard/ProblemPanel';
import SecurityChart from '@/components/dashboard/SecurityChart';
import HostTable from '@/components/dashboard/HostTable';
import { useMonitoringData } from '@/hooks/useMonitoringData';
import { cn } from '@/lib/utils';

const Index = () => {
  const { data, isLoading, refetch } = useMonitoringData(30000);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <MonitorCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Server Monitor</h1>
                <p className="text-sm text-muted-foreground">Zabbix & Elasticsearch Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <RealtimeClock />
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Server"
            value={data.serverStatus.total}
            subtitle="Monitored hosts"
            icon={Server}
            variant="glow"
          />
          <StatsCard
            title="Server Up"
            value={data.serverStatus.up}
            subtitle="Running normally"
            icon={Activity}
            variant="success"
          />
          <StatsCard
            title="Server Down"
            value={data.serverStatus.down}
            subtitle="Needs attention"
            icon={ServerCrash}
            variant="destructive"
          />
          <StatsCard
            title="Active Problems"
            value={data.problems.length}
            subtitle="Zabbix alerts"
            icon={Shield}
            variant={data.problems.length > 0 ? 'warning' : 'success'}
          />
        </div>

        {/* Status Bar */}
        <ServerStatusBar
          up={data.serverStatus.up}
          down={data.serverStatus.down}
          total={data.serverStatus.total}
        />

        {/* Charts and Logs Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SecurityChart data={data.securityStats} />
          <ProblemPanel problems={data.problems} />
        </div>

        {/* Logs Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LogPanel
            logs={data.logs.filter(l => l.type === 'bruteforce' || l.type === 'ddos')}
            title="Security Threats"
            icon={<Shield className="w-4 h-4 text-destructive" />}
          />
          <LogPanel
            logs={data.logs}
            title="Elasticsearch Logs"
            icon={<Database className="w-4 h-4 text-primary" />}
          />
        </div>

        {/* Host Table */}
        <HostTable hosts={data.hosts} />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Server Monitoring Dashboard • Zabbix 7.0 + Elasticsearch</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
