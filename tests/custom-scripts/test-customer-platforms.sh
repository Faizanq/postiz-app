#!/bin/bash

echo "Testing Customer Platforms Feature"
echo "================================="

# Test 1: Fetch integrations endpoint
echo -e "\n1. Testing /integrations endpoint:"
curl -s http://localhost:3000/v1/integrations | jq '.social[] | {identifier, name}' | head -20

# Test 2: Check if customer creation with platforms works
echo -e "\n\n2. Creating a test customer with platforms:"

# First login to get the token
AUTH_RESPONSE=$(curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "test123"
  }')

TOKEN=$(echo $AUTH_RESPONSE | jq -r '.access_token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "Failed to get auth token. Make sure you have a test user created."
  exit 1
fi

echo "Got auth token: ${TOKEN:0:20}..."

# Create customer with platforms
echo -e "\n3. Creating customer with multiple platforms enabled:"
curl -X POST http://localhost:3000/v1/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Platform Customer",
    "email": "platforms@test.com",
    "planType": "PROFESSIONAL",
    "enabledPlatforms": ["x", "linkedin", "facebook", "instagram"],
    "notes": "Testing dynamic platform loading"
  }' | jq

echo -e "\n\nTest complete!"