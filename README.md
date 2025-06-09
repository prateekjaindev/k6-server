# k6 Load Testing Framework

This repository contains load testing scripts and workflows for running distributed load tests using k6 and GitHub Actions.

## Test Scripts

### 1. Project A - Basic Website Load Test (`project_a.js`)

**Purpose**: Tests basic website functionality and response times.

**Test Flow**:
1. Fetches the main page (100% of VUs)
2. 50% chance to fetch the news page
3. Measures response times and success rates

**Configuration**:
- Ramp up: 10s to 5 VUs
- Load: 20s at 10 VUs
- Ramp down: 10s to 0 VUs
- Thresholds:
  - 95% of requests < 1000ms
  - <10% failed requests

### 2. Project B - Website Navigation Test (`project_b.js`)

**Purpose**: Simulates user navigation through the website.

**Test Flow**:
1. Visits the main page
2. Randomly navigates to 1-3 different pages
3. 30% chance to visit the cart page
4. Measures page load times and success rates

**Configuration**:
- Ramp up: 5s to 2 VUs
- Load: 10s at 3 VUs
- Ramp down: 5s to 0 VUs
- Thresholds:
  - 95% of requests < 2000ms
  - <30% failed requests

## How to Run Tests

### Prerequisites
- GitHub repository with workflow secrets configured:
  - `EC2_HOST`: EC2 instance hostname/IP
  - `EC2_SSH_KEY`: SSH private key for EC2 access
  - `K6_PROMETHEUS_URL`: Prometheus remote write URL
  - `K6_PROMETHEUS_ID`: Prometheus username (if required)
  - `K6_PROMETHEUS_PASSWORD`: Prometheus password (if required)

### Installation on EC2

To install k6 on an EC2 instance (Ubuntu/Debian), run the following commands:

```bash
# Update package lists
sudo apt update && sudo apt install -y gnupg software-properties-common

# Add the k6 repository key
curl -s https://dl.k6.io/key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/k6-archive-keyring.gpg

# Add the k6 repository
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list

# Update package lists again
sudo apt update

# Install k6
sudo apt install k6
```

Verify the installation by checking the k6 version:
```bash
k6 version
```

### Running Tests
1. Navigate to the "Actions" tab in your GitHub repository
2. Select "Run Load Test" workflow
3. Choose the test script and configure parameters:
   - `script_name`: Select test script (project_a.js or project_b.js)
   - `vu_count`: Number of virtual users (default: 10)
   - `duration`: Test duration (e.g., 30s, 1m, 5m)
4. Click "Run workflow"

## Repository Structure

```
.
├── .github/
│   └── workflows/
│       └── k6-loadtest.yml    # GitHub Actions workflow
├── k6-scripts/                # k6 test scripts
│   ├── project_a.js          # Basic website load test
│   └── project_b.js          # Website navigation test
└── README.md                 # This file
```

## Monitoring

Tests output metrics to Prometheus for visualization in Grafana. The following metrics are collected:
- HTTP request duration
- Request success/failure rates
- Virtual user count
- Iteration counts
- Custom metrics defined in each test

## Customization

To add a new test:
1. Create a new `.js` file in the `k6-scripts` directory
2. Follow the pattern of existing tests
3. Add the script name to the workflow file choices

## License

This project is open source and available under the [MIT License](LICENSE).
