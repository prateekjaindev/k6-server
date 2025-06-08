import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const searchDuration = new Trend('search_duration');
const errorRate = new Rate('errors');

// Search terms for the demo site
const searchTerms = [
  'test', 'k6', 'load', 'testing', 'performance',
  'api', 'http', 'metrics', 'dashboard', 'report'
];

// Test configuration
export const options = {
  scenarios: {
    search_load: {
      executor: 'constant-vus',
      vus: 5,
      duration: '1m',
      gracefulStop: '10s',
    },
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '20s', target: 10 },
        { duration: '10s', target: 0 },
      ],
      startTime: '1m',
      gracefulStop: '10s',
    },
  },
  thresholds: {
    'search_duration': ['p(95)<1000', 'p(99)<2000'],
    'http_req_duration': ['p(95)<1500'],
    'http_req_failed': ['rate<0.1'],
  },
  tags: { project: 'project_c' },
};

// Helper function to generate random search query
function generateSearchQuery() {
  const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  const page = Math.floor(Math.random() * 3) + 1; // pages 1-3
  
  return {
    s: term,
    page: page,
  };
}

// Test execution
export default function () {
  const baseUrl = 'https://test.k6.io';
  
  // Generate search URL with random parameters
  const searchQuery = generateSearchQuery();
  const searchUrl = `${baseUrl}/?${new URLSearchParams(searchQuery).toString()}`;
  
  // Execute search
  const startTime = new Date();
  const res = http.get(searchUrl);
  const endTime = new Date() - startTime;
  
  // Record metrics
  searchDuration.add(endTime);
  
  // Validate response
  const checks = check(res, {
    'search status 200': (r) => r.status === 200,
    'has search results': (r) => {
      try {
        return r.body.includes('Search results for') ||
               r.body.includes('No results found') ||
               r.body.includes('Page not found');
      } catch (e) {
        return false;
      }
    },
  });
  
  if (!checks) {
    errorRate.add(1);
  }
  
  // Random sleep between 1-3 seconds to simulate user think time
  sleep(1 + Math.random() * 2);
  
  // 30% chance to view a specific page
  if (Math.random() < 0.3) {
    const pages = [
      '/about',
      '/contact',
      '/documentation',
      '/pricing',
      '/features'
    ];
    const page = pages[Math.floor(Math.random() * pages.length)];
    const pageRes = http.get(`${baseUrl}${page}`);
    check(pageRes, {
      'page status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
    sleep(0.5 + Math.random());
  }
}
