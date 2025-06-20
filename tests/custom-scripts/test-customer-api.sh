#!/bin/bash

# Base URL
BASE_URL="http://localhost:3000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Testing Customer Management API"
echo "==============================="

# Test 1: Get all customers (should be empty initially)
echo -e "\n${GREEN}Test 1: GET /customers${NC}"
curl -X GET "$BASE_URL/customers" \
  -b cookies.txt \
  -H "Content-Type: application/json" | jq '.'

# Test 2: Create a new customer
echo -e "\n${GREEN}Test 2: POST /customers${NC}"
CUSTOMER_RESPONSE=$(curl -X POST "$BASE_URL/customers" \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ABC Corporation",
    "email": "contact@abc.com",
    "phone": "+1-555-0123",
    "website": "https://abc.com",
    "contactName": "John Doe",
    "contactEmail": "john@abc.com",
    "contactPhone": "+1-555-0124",
    "planType": "PROFESSIONAL",
    "notes": "Important client",
    "tags": ["enterprise", "priority"],
    "enabledPlatforms": ["twitter", "linkedin"]
  }')

echo "$CUSTOMER_RESPONSE" | jq '.'
CUSTOMER_ID=$(echo "$CUSTOMER_RESPONSE" | jq -r '.id')

if [ "$CUSTOMER_ID" != "null" ]; then
    echo -e "\n${GREEN}Created customer with ID: $CUSTOMER_ID${NC}"
    
    # Test 3: Get customer by ID
    echo -e "\n${GREEN}Test 3: GET /customers/$CUSTOMER_ID${NC}"
    curl -X GET "$BASE_URL/customers/$CUSTOMER_ID" \
      -b cookies.txt \
      -H "Content-Type: application/json" | jq '.'
    
    # Test 4: Update customer
    echo -e "\n${GREEN}Test 4: PUT /customers/$CUSTOMER_ID${NC}"
    curl -X PUT "$BASE_URL/customers/$CUSTOMER_ID" \
      -b cookies.txt \
      -H "Content-Type: application/json" \
      -d '{
        "phone": "+1-555-9999",
        "notes": "Updated notes - VIP client"
      }' | jq '.'
    
    # Test 5: Deactivate customer
    echo -e "\n${GREEN}Test 5: POST /customers/$CUSTOMER_ID/deactivate${NC}"
    curl -X POST "$BASE_URL/customers/$CUSTOMER_ID/deactivate" \
      -b cookies.txt \
      -H "Content-Type: application/json" | jq '.'
    
    # Test 6: Activate customer
    echo -e "\n${GREEN}Test 6: POST /customers/$CUSTOMER_ID/activate${NC}"
    curl -X POST "$BASE_URL/customers/$CUSTOMER_ID/activate" \
      -b cookies.txt \
      -H "Content-Type: application/json" | jq '.'
    
    # Test 7: Change plan
    echo -e "\n${GREEN}Test 7: PUT /customers/$CUSTOMER_ID/plan${NC}"
    curl -X PUT "$BASE_URL/customers/$CUSTOMER_ID/plan" \
      -b cookies.txt \
      -H "Content-Type: application/json" \
      -d '{
        "newPlan": "ENTERPRISE",
        "reason": "Upgraded due to increased usage"
      }' | jq '.'
    
    # Test 8: Get platforms
    echo -e "\n${GREEN}Test 8: GET /customers/$CUSTOMER_ID/platforms${NC}"
    curl -X GET "$BASE_URL/customers/$CUSTOMER_ID/platforms" \
      -b cookies.txt \
      -H "Content-Type: application/json" | jq '.'
    
    # Test 9: Update platform config
    echo -e "\n${GREEN}Test 9: PUT /customers/$CUSTOMER_ID/platforms/twitter${NC}"
    curl -X PUT "$BASE_URL/customers/$CUSTOMER_ID/platforms/twitter" \
      -b cookies.txt \
      -H "Content-Type: application/json" \
      -d '{
        "clientId": "twitter-client-123",
        "clientSecret": "twitter-secret-456"
      }' | jq '.'
    
    # Test 10: Pause platform
    echo -e "\n${GREEN}Test 10: POST /customers/$CUSTOMER_ID/platforms/twitter/pause${NC}"
    curl -X POST "$BASE_URL/customers/$CUSTOMER_ID/platforms/twitter/pause" \
      -b cookies.txt \
      -H "Content-Type: application/json" \
      -d '{
        "reason": "Temporary suspension requested by client",
        "resumeDate": "2025-07-01T00:00:00Z"
      }' | jq '.'
    
    # Test 11: Resume platform
    echo -e "\n${GREEN}Test 11: POST /customers/$CUSTOMER_ID/platforms/twitter/resume${NC}"
    curl -X POST "$BASE_URL/customers/$CUSTOMER_ID/platforms/twitter/resume" \
      -b cookies.txt \
      -H "Content-Type: application/json" | jq '.'
    
    # Test 12: Get history
    echo -e "\n${GREEN}Test 12: GET /customers/$CUSTOMER_ID/history${NC}"
    curl -X GET "$BASE_URL/customers/$CUSTOMER_ID/history" \
      -b cookies.txt \
      -H "Content-Type: application/json" | jq '.'
    
    # Test 13: Get all customers with filters
    echo -e "\n${GREEN}Test 13: GET /customers?search=ABC&status=ACTIVE${NC}"
    curl -X GET "$BASE_URL/customers?search=ABC&status=ACTIVE" \
      -b cookies.txt \
      -H "Content-Type: application/json" | jq '.'
    
else
    echo -e "\n${RED}Failed to create customer${NC}"
fi

echo -e "\n${GREEN}Testing completed!${NC}"