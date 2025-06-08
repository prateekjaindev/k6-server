import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

// Custom metrics
const pageLoadSuccess = new Counter('page_load_success');
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  scenarios: {
    navigation_test: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '5s', target: 2 },
        { duration: '10s', target: 3 },
        { duration: '5s', target: 0 },
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.3'],
  },
  tags: { project: 'project_b' },
};

// Test execution
export default function () {
  const baseUrl = 'https://test.k6.io';
  
  // 1. Load main page
  const mainPage = http.get(baseUrl);
  if (!check(mainPage, { 'main page status 200': (r) => r.status === 200 })) {
    errorRate.add(1);
    return;
  }
  
  pageLoadSuccess.add(1);
  
  // 2. Randomly visit different pages
  const pages = [
    '/about',
    '/contact',
    '/documentation',
    '/pricing',
    '/features',
    '/news.php'
  ];
  
  // Visit 1-3 random pages
  const pagesToVisit = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < pagesToVisit; i++) {
    const page = pages[Math.floor(Math.random() * pages.length)];
    const pageRes = http.get(`${baseUrl}${page}`);
    
    check(pageRes, {
      [`${page} status 200`]: (r) => r.status === 200,
    }) || errorRate.add(1);
    
    // Random sleep between page visits (1-3 seconds)
    sleep(1 + Math.random() * 2);
  }
}
