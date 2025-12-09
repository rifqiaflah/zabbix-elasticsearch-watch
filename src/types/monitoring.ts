export interface ServerStatus {
  total: number;
  up: number;
  down: number;
  percentage: number;
}

export interface ZabbixHost {
  hostid: string;
  host: string;
  name: string;
  status: 'up' | 'down';
  cpu: number;
  ram: number;
  bandwidthIn: number;
  bandwidthOut: number;
  lastCheck: string;
}

export interface ZabbixProblem {
  eventid: string;
  objectid: string;
  name: string;
  severity: 'disaster' | 'high' | 'average' | 'warning' | 'information' | 'not_classified';
  clock: string;
  host: string;
  acknowledged: boolean;
}

export interface ElasticLog {
  id: string;
  timestamp: string;
  message: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  source: string;
  type?: 'bruteforce' | 'ddos' | 'normal';
}

export interface SecurityStats {
  date: string;
  bruteforce: number;
  ddos: number;
  total: number;
}

export interface ApiConfig {
  zabbixUrl: string;
  zabbixToken: string;
  elasticUrl: string;
  elasticUsername: string;
  elasticPassword: string;
}
