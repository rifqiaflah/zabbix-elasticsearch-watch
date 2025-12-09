import { useState, useEffect } from 'react';
import { ServerStatus, ZabbixHost, ZabbixProblem, ElasticLog, SecurityStats } from '@/types/monitoring';

// Mock data generator for demo purposes
const generateMockData = () => {
  const now = new Date();
  
  // Server status
  const total = 25;
  const up = Math.floor(Math.random() * 5) + 20;
  const down = total - up;
  
  const serverStatus: ServerStatus = {
    total,
    up,
    down,
    percentage: (up / total) * 100,
  };

  // Zabbix hosts
  const hostNames = [
    { name: 'Web Server 01', host: 'web-srv-01.local' },
    { name: 'Database Master', host: 'db-master.local' },
    { name: 'Database Slave', host: 'db-slave-01.local' },
    { name: 'Redis Cache', host: 'redis-01.local' },
    { name: 'Load Balancer', host: 'lb-01.local' },
    { name: 'API Gateway', host: 'api-gw-01.local' },
    { name: 'File Server', host: 'file-srv.local' },
    { name: 'Backup Server', host: 'backup-srv.local' },
    { name: 'Monitoring Server', host: 'mon-srv.local' },
    { name: 'Mail Server', host: 'mail-srv.local' },
  ];

  const hosts: ZabbixHost[] = hostNames.map((h, idx) => ({
    hostid: `1000${idx}`,
    host: h.host,
    name: h.name,
    status: Math.random() > 0.1 ? 'up' : 'down',
    cpu: Math.random() * 100,
    ram: Math.random() * 100,
    bandwidthIn: Math.random() * 100 * 1024 * 1024,
    bandwidthOut: Math.random() * 50 * 1024 * 1024,
    lastCheck: now.toISOString(),
  }));

  // Zabbix problems
  const problemNames = [
    'High CPU utilization (over 90%)',
    'Memory usage is too high',
    'Disk space is low on /data',
    'Network interface down',
    'Service unavailable',
    'High I/O wait',
  ];

  const severities: Array<'disaster' | 'high' | 'average' | 'warning' | 'information'> = 
    ['disaster', 'high', 'average', 'warning', 'information'];

  const problems: ZabbixProblem[] = Array.from({ length: Math.floor(Math.random() * 5) }, (_, idx) => ({
    eventid: `5000${idx}`,
    objectid: `3000${idx}`,
    name: problemNames[Math.floor(Math.random() * problemNames.length)],
    severity: severities[Math.floor(Math.random() * severities.length)],
    clock: Math.floor(now.getTime() / 1000 - Math.random() * 3600).toString(),
    host: hostNames[Math.floor(Math.random() * hostNames.length)].name,
    acknowledged: Math.random() > 0.7,
  }));

  // Elastic logs
  const logMessages = [
    { msg: 'Failed password for root from 192.168.1.100 port 22', type: 'bruteforce' as const },
    { msg: 'authentication failure; logname= uid=0 euid=0', type: 'bruteforce' as const },
    { msg: 'HTTP flood detected from 10.0.0.50', type: 'ddos' as const },
    { msg: 'Connection established from 172.16.0.1', type: 'normal' as const },
    { msg: 'Failed password for invalid user admin', type: 'bruteforce' as const },
    { msg: 'HTTP request rate exceeded threshold', type: 'ddos' as const },
    { msg: 'System startup completed successfully', type: 'normal' as const },
    { msg: 'SSH session opened for user admin', type: 'normal' as const },
  ];

  const levels: Array<'info' | 'warning' | 'error' | 'critical'> = ['info', 'warning', 'error', 'critical'];

  const logs: ElasticLog[] = Array.from({ length: 15 }, (_, idx) => {
    const logData = logMessages[Math.floor(Math.random() * logMessages.length)];
    return {
      id: `log-${idx}`,
      timestamp: new Date(now.getTime() - idx * 60000 * Math.random() * 10).toISOString(),
      message: logData.msg,
      level: logData.type === 'bruteforce' || logData.type === 'ddos' 
        ? levels[Math.floor(Math.random() * 2) + 2] 
        : levels[Math.floor(Math.random() * 2)],
      source: `server-${Math.floor(Math.random() * 5) + 1}`,
      type: logData.type,
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Security stats for chart
  const securityStats: SecurityStats[] = Array.from({ length: 7 }, (_, idx) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - idx));
    return {
      date: date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
      bruteforce: Math.floor(Math.random() * 50) + 10,
      ddos: Math.floor(Math.random() * 30) + 5,
      total: 0,
    };
  }).map(s => ({ ...s, total: s.bruteforce + s.ddos }));

  return { serverStatus, hosts, problems, logs, securityStats };
};

export const useMonitoringData = (refreshInterval = 30000) => {
  const [data, setData] = useState(generateMockData());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // In production, replace with actual API calls
      // const response = await fetch('/api/monitoring');
      // const data = await response.json();
      
      // For demo, use mock data
      setData(generateMockData());
      setError(null);
    } catch (err) {
      setError('Failed to fetch monitoring data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { data, isLoading, error, refetch: fetchData };
};
