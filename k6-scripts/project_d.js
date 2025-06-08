import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

// Custom metrics
const pageLoadSuccess = new Counter('page_load_success');
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  scenarios: {
    shop_test: {
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
  tags: { project: 'project_d' },
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
  
  // 2. Browse shop pages
  const shopPages = [
    '/shop/',
    '/product-category/clothing/',
    '/product-category/accessories/',
    '/product/flying-ninja/',
    '/product/happy-ninja/',
    '/product/ship-your-idea/'
  ];
  
  // Visit 1-2 random shop pages
  const pagesToVisit = Math.floor(Math.random() * 2) + 1;
  for (let i = 0; i < pagesToVisit; i++) {
    const page = shopPages[Math.floor(Math.random() * shopPages.length)];
    const pageRes = http.get(`${baseUrl}${page}`);
    
    check(pageRes, {
      [`${page} status 200`]: (r) => r.status === 200,
    }) || errorRate.add(1);
    
    // Random sleep between page visits (1-3 seconds)
    sleep(1 + Math.random() * 2);
  }
  
  // 3. View cart (30% chance)
  if (Math.random() < 0.3) {
    const cartRes = http.get(`${baseUrl}/cart/`);
    check(cartRes, {
      'cart page status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
    
    sleep(1 + Math.random());
  }
}
