import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '10s', target: 5 },  // Ramp-up to 5 users
    { duration: '20s', target: 10 },  // Stay at 10 users
    { duration: '10s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],  // 95% of requests should be below 1000ms
    http_req_failed: ['rate<0.1'],      // Less than 10% failed requests
  },
  tags: { project: 'project_a' },
};

// Test execution
export default function () {
  const baseUrl = 'https://test.k6.io';
  
  // Test 1: Fetch main page
  const mainPage = http.get(`${baseUrl}/`);
  check(mainPage, {
    'main page status 200': (r) => r.status === 200,
    'has welcome text': (r) => r.body.includes('Welcome to the k6.io demo site!'),
  }) || errorRate.add(1);

  // Random sleep between requests
  sleep(Math.random() * 2);
  
  // Test 2: Get news page (50% of the time)
  if (Math.random() > 0.5) {
    const news = http.get(`${baseUrl}/news.php`);
    check(news, {
      'news page status 200': (r) => r.status === 200,
      'has news content': (r) => r.body.includes('Latest News'),
    }) || errorRate.add(1);
    sleep(1);
  }
}