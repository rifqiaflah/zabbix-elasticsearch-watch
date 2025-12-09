"""
Zabbix to Elasticsearch Data Collector
======================================
Script Python untuk mengambil data dari Zabbix 7.0 API 
dan menyimpannya ke Elasticsearch.

Requirements:
    pip install requests elasticsearch python-dotenv

Usage:
    python zabbix_collector.py

Environment Variables (buat file .env):
    ZABBIX_URL=http://your-zabbix-server/api_jsonrpc.php
    ZABBIX_TOKEN=your_zabbix_api_token
    ELASTIC_URL=http://your-elasticsearch:9200
    ELASTIC_USERNAME=elastic
    ELASTIC_PASSWORD=your_password
"""

import os
import json
import time
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

import requests
from elasticsearch import Elasticsearch
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('zabbix_collector.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class ZabbixAPI:
    """Zabbix 7.0 API Client"""
    
    def __init__(self, url: str, token: str):
        self.url = url
        self.token = token
        self.headers = {
            'Content-Type': 'application/json-rpc',
            'Authorization': f'Bearer {token}'
        }
    
    def _request(self, method: str, params: Dict = None) -> Any:
        """Make API request to Zabbix"""
        payload = {
            'jsonrpc': '2.0',
            'method': method,
            'params': params or {},
            'id': 1
        }
        
        try:
            response = requests.post(
                self.url,
                headers=self.headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            
            if 'error' in result:
                raise Exception(f"Zabbix API Error: {result['error']}")
            
            return result.get('result')
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error: {e}")
            raise
    
    def get_hosts(self) -> List[Dict]:
        """Get all monitored hosts with their status"""
        params = {
            'output': ['hostid', 'host', 'name', 'status'],
            'selectInterfaces': ['ip', 'dns'],
            'filter': {'status': 0}  # Only enabled hosts
        }
        return self._request('host.get', params)
    
    def get_host_items(self, hostids: List[str]) -> Dict[str, Dict]:
        """Get CPU, RAM, and network items for hosts"""
        # Get CPU usage
        cpu_params = {
            'output': ['itemid', 'hostid', 'lastvalue', 'name'],
            'hostids': hostids,
            'search': {'key_': 'system.cpu.util'},
            'searchWildcardsEnabled': True
        }
        cpu_items = self._request('item.get', cpu_params)
        
        # Get Memory usage
        mem_params = {
            'output': ['itemid', 'hostid', 'lastvalue', 'name'],
            'hostids': hostids,
            'search': {'key_': 'vm.memory.util'},
            'searchWildcardsEnabled': True
        }
        mem_items = self._request('item.get', mem_params)
        
        # Get Network In
        net_in_params = {
            'output': ['itemid', 'hostid', 'lastvalue', 'name'],
            'hostids': hostids,
            'search': {'key_': 'net.if.in'},
            'searchWildcardsEnabled': True
        }
        net_in_items = self._request('item.get', net_in_params)
        
        # Get Network Out
        net_out_params = {
            'output': ['itemid', 'hostid', 'lastvalue', 'name'],
            'hostids': hostids,
            'search': {'key_': 'net.if.out'},
            'searchWildcardsEnabled': True
        }
        net_out_items = self._request('item.get', net_out_params)
        
        # Organize by hostid
        result = {}
        for hostid in hostids:
            result[hostid] = {
                'cpu': 0,
                'ram': 0,
                'bandwidth_in': 0,
                'bandwidth_out': 0
            }
        
        for item in cpu_items:
            hostid = item['hostid']
            if hostid in result:
                try:
                    result[hostid]['cpu'] = float(item.get('lastvalue', 0))
                except ValueError:
                    pass
        
        for item in mem_items:
            hostid = item['hostid']
            if hostid in result:
                try:
                    result[hostid]['ram'] = float(item.get('lastvalue', 0))
                except ValueError:
                    pass
        
        for item in net_in_items:
            hostid = item['hostid']
            if hostid in result:
                try:
                    result[hostid]['bandwidth_in'] = float(item.get('lastvalue', 0))
                except ValueError:
                    pass
        
        for item in net_out_items:
            hostid = item['hostid']
            if hostid in result:
                try:
                    result[hostid]['bandwidth_out'] = float(item.get('lastvalue', 0))
                except ValueError:
                    pass
        
        return result
    
    def get_problems(self) -> List[Dict]:
        """Get current active problems"""
        params = {
            'output': ['eventid', 'objectid', 'name', 'severity', 'clock', 'acknowledged'],
            'recent': True,
            'sortfield': ['eventid'],
            'sortorder': 'DESC',
            'selectHosts': ['hostid', 'name']
        }
        problems = self._request('problem.get', params)
        
        # Map severity numbers to names
        severity_map = {
            '0': 'not_classified',
            '1': 'information',
            '2': 'warning',
            '3': 'average',
            '4': 'high',
            '5': 'disaster'
        }
        
        for problem in problems:
            problem['severity'] = severity_map.get(str(problem.get('severity', 0)), 'not_classified')
            hosts = problem.get('hosts', [])
            problem['host'] = hosts[0]['name'] if hosts else 'Unknown'
        
        return problems
    
    def get_host_availability(self, hostids: List[str]) -> Dict[str, str]:
        """Check host availability (up/down)"""
        params = {
            'output': ['hostid', 'available'],
            'hostids': hostids
        }
        interfaces = self._request('hostinterface.get', params)
        
        availability = {}
        for interface in interfaces:
            hostid = interface['hostid']
            # available: 0=unknown, 1=available, 2=unavailable
            is_up = interface.get('available', '0') == '1'
            availability[hostid] = 'up' if is_up else 'down'
        
        return availability


class ElasticClient:
    """Elasticsearch Client for storing monitoring data"""
    
    def __init__(self, url: str, username: str = None, password: str = None):
        auth = (username, password) if username and password else None
        self.client = Elasticsearch(
            url,
            basic_auth=auth,
            verify_certs=False,
            request_timeout=30
        )
        self._ensure_indices()
    
    def _ensure_indices(self):
        """Create required indices if they don't exist"""
        indices = {
            'zabbix-hosts': {
                'mappings': {
                    'properties': {
                        'hostid': {'type': 'keyword'},
                        'host': {'type': 'keyword'},
                        'name': {'type': 'text'},
                        'status': {'type': 'keyword'},
                        'cpu': {'type': 'float'},
                        'ram': {'type': 'float'},
                        'bandwidth_in': {'type': 'float'},
                        'bandwidth_out': {'type': 'float'},
                        'timestamp': {'type': 'date'}
                    }
                }
            },
            'zabbix-problems': {
                'mappings': {
                    'properties': {
                        'eventid': {'type': 'keyword'},
                        'objectid': {'type': 'keyword'},
                        'name': {'type': 'text'},
                        'severity': {'type': 'keyword'},
                        'clock': {'type': 'keyword'},
                        'host': {'type': 'text'},
                        'acknowledged': {'type': 'boolean'},
                        'timestamp': {'type': 'date'}
                    }
                }
            },
            'server-status': {
                'mappings': {
                    'properties': {
                        'total': {'type': 'integer'},
                        'up': {'type': 'integer'},
                        'down': {'type': 'integer'},
                        'percentage': {'type': 'float'},
                        'timestamp': {'type': 'date'}
                    }
                }
            }
        }
        
        for index_name, settings in indices.items():
            if not self.client.indices.exists(index=index_name):
                self.client.indices.create(index=index_name, body=settings)
                logger.info(f"Created index: {index_name}")
    
    def store_hosts(self, hosts: List[Dict]):
        """Store host data to Elasticsearch"""
        timestamp = datetime.utcnow().isoformat()
        
        for host in hosts:
            host['timestamp'] = timestamp
            self.client.index(
                index='zabbix-hosts',
                id=f"{host['hostid']}_{timestamp[:10]}",
                body=host
            )
        
        logger.info(f"Stored {len(hosts)} hosts to Elasticsearch")
    
    def store_problems(self, problems: List[Dict]):
        """Store problem data to Elasticsearch"""
        timestamp = datetime.utcnow().isoformat()
        
        for problem in problems:
            problem['timestamp'] = timestamp
            self.client.index(
                index='zabbix-problems',
                id=problem['eventid'],
                body=problem
            )
        
        logger.info(f"Stored {len(problems)} problems to Elasticsearch")
    
    def store_server_status(self, status: Dict):
        """Store server status summary"""
        status['timestamp'] = datetime.utcnow().isoformat()
        self.client.index(
            index='server-status',
            body=status
        )
        logger.info(f"Stored server status: {status}")
    
    def get_security_logs(self, size: int = 100) -> List[Dict]:
        """Query logs for bruteforce and DDoS detection"""
        query = {
            'size': size,
            'sort': [{'@timestamp': {'order': 'desc'}}],
            'query': {
                'bool': {
                    'should': [
                        {'match': {'event.outcome': 'failure'}},
                        {'wildcard': {'message': '*Failed password*'}},
                        {'wildcard': {'message': '*authentication failure*'}},
                        {'match': {'message': 'HTTP'}}
                    ],
                    'minimum_should_match': 1
                }
            }
        }
        
        try:
            # Adjust index pattern based on your setup
            result = self.client.search(index='filebeat-*,syslog-*', body=query)
            return [hit['_source'] for hit in result['hits']['hits']]
        except Exception as e:
            logger.warning(f"Could not fetch security logs: {e}")
            return []


class ZabbixCollector:
    """Main collector that orchestrates data collection"""
    
    def __init__(self):
        # Load configuration
        self.zabbix = ZabbixAPI(
            url=os.getenv('ZABBIX_URL', 'http://localhost/api_jsonrpc.php'),
            token=os.getenv('ZABBIX_TOKEN', '')
        )
        
        self.elastic = ElasticClient(
            url=os.getenv('ELASTIC_URL', 'http://localhost:9200'),
            username=os.getenv('ELASTIC_USERNAME'),
            password=os.getenv('ELASTIC_PASSWORD')
        )
        
        self.interval = int(os.getenv('COLLECT_INTERVAL', 60))
    
    def collect_and_store(self):
        """Main collection routine"""
        try:
            logger.info("Starting data collection...")
            
            # Get hosts
            hosts = self.zabbix.get_hosts()
            hostids = [h['hostid'] for h in hosts]
            
            if not hostids:
                logger.warning("No hosts found in Zabbix")
                return
            
            # Get metrics for hosts
            metrics = self.zabbix.get_host_items(hostids)
            availability = self.zabbix.get_host_availability(hostids)
            
            # Combine host data with metrics
            enriched_hosts = []
            up_count = 0
            down_count = 0
            
            for host in hosts:
                hostid = host['hostid']
                host_metrics = metrics.get(hostid, {})
                status = availability.get(hostid, 'down')
                
                enriched_host = {
                    'hostid': hostid,
                    'host': host['host'],
                    'name': host['name'],
                    'status': status,
                    'cpu': host_metrics.get('cpu', 0),
                    'ram': host_metrics.get('ram', 0),
                    'bandwidth_in': host_metrics.get('bandwidth_in', 0),
                    'bandwidth_out': host_metrics.get('bandwidth_out', 0)
                }
                enriched_hosts.append(enriched_host)
                
                if status == 'up':
                    up_count += 1
                else:
                    down_count += 1
            
            # Store hosts
            self.elastic.store_hosts(enriched_hosts)
            
            # Get and store problems
            problems = self.zabbix.get_problems()
            self.elastic.store_problems(problems)
            
            # Store server status
            total = len(hosts)
            server_status = {
                'total': total,
                'up': up_count,
                'down': down_count,
                'percentage': (up_count / total * 100) if total > 0 else 0
            }
            self.elastic.store_server_status(server_status)
            
            logger.info(f"Collection complete - Total: {total}, Up: {up_count}, Down: {down_count}")
            
        except Exception as e:
            logger.error(f"Collection error: {e}")
            raise
    
    def run(self):
        """Run the collector in a loop"""
        logger.info(f"Starting Zabbix Collector (interval: {self.interval}s)")
        
        while True:
            try:
                self.collect_and_store()
            except Exception as e:
                logger.error(f"Error in collection cycle: {e}")
            
            time.sleep(self.interval)


def main():
    """Entry point"""
    print("""
    ╔═══════════════════════════════════════════════════════════╗
    ║         Zabbix to Elasticsearch Data Collector            ║
    ║                       v1.0.0                              ║
    ╚═══════════════════════════════════════════════════════════╝
    
    Configuration:
    - Create a .env file with the following variables:
      ZABBIX_URL=http://your-zabbix-server/api_jsonrpc.php
      ZABBIX_TOKEN=your_zabbix_api_token
      ELASTIC_URL=http://your-elasticsearch:9200
      ELASTIC_USERNAME=elastic (optional)
      ELASTIC_PASSWORD=your_password (optional)
      COLLECT_INTERVAL=60 (seconds)
    
    Starting collector...
    """)
    
    collector = ZabbixCollector()
    collector.run()


if __name__ == '__main__':
    main()
