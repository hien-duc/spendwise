# SpendWise API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All API endpoints require JWT authentication. Include the JWT token in the Authorization header:
```
Using supabase auth with email
Authorization: Bearer <token>
```

## Error Responses
All endpoints may return these error responses:
- `401` - Unauthorized (missing or invalid token)
- `500` - Internal Server Error

## Endpoints

### Categories

#### GET `/categories`
Get all categories for the authenticated user.

**Response**: Array of categories
```json
[
  {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "type": "expense|income|investment",
    "icon": "string",
    "color": "string"
  }
]
```

#### POST `/categories`
Create a new category.

**Request Body**:
```json
{
  "name": "string",
  "description": "string",
  "type": "expense|income|investment",
  "icon": "string",
  "color": "string"
}
```

### Financial Goals

#### GET `/financial/financial-goals`
Get all financial goals for the authenticated user.

**Response**: Array of financial goals
```json
[
  {
    "id": "uuid",
    "name": "string",
    "target_amount": "decimal",
    "current_amount": "decimal",
    "deadline": "date",
    "status": "in_progress|completed|cancelled"
  }
]
```

#### POST `/financial/financial-goals`
Create a new financial goal.

**Request Body**:
```json
{
  "name": "string",
  "target_amount": "decimal",
  "current_amount": "decimal",
  "deadline": "date",
  "status": "in_progress|completed|cancelled"
}
```

#### PUT `/financial/financial-goals/:id`
Update a financial goal.

#### DELETE `/financial/financial-goals/:id`
Delete a financial goal.

### Fixed Costs

#### GET `/financial/fixed-costs`
Get all fixed costs for the authenticated user.

**Response**: Array of fixed costs
```json
[
  {
    "id": "uuid",
    "category_id": "uuid",
    "amount": "decimal",
    "frequency": "daily|weekly|monthly|yearly",
    "start_date": "date",
    "end_date": "date|null",
    "note": "string",
    "is_active": "boolean",
    "last_generated_date": "date|null"
  }
]
```

#### POST `/financial/fixed-costs`
Create a new fixed cost.

**Request Body**:
```json
{
  "category_id": "uuid",
  "amount": "decimal",
  "frequency": "daily|weekly|monthly|yearly",
  "start_date": "date",
  "end_date": "date|null",
  "note": "string",
  "is_active": "boolean"
}
```

#### PUT `/financial/fixed-costs/:id`
Update a fixed cost.

#### DELETE `/financial/fixed-costs/:id`
Delete a fixed cost.

### Periodic Income

#### GET `/financial/periodic-income`
Get all periodic income entries for the authenticated user.

**Response**: Array of periodic income entries
```json
[
  {
    "id": "uuid",
    "category_id": "uuid",
    "amount": "decimal",
    "frequency": "daily|weekly|monthly|yearly",
    "start_date": "date",
    "end_date": "date|null",
    "note": "string",
    "is_active": "boolean",
    "last_generated_date": "date|null"
  }
]
```

#### POST `/financial/periodic-income`
Create a new periodic income entry.

**Request Body**:
```json
{
  "category_id": "uuid",
  "amount": "decimal",
  "frequency": "daily|weekly|monthly|yearly",
  "start_date": "date",
  "end_date": "date|null",
  "note": "string",
  "is_active": "boolean"
}
```

#### PUT `/financial/periodic-income/:id`
Update a periodic income entry.

#### DELETE `/financial/periodic-income/:id`
Delete a periodic income entry.

### Fixed Investments

#### GET `/financial/fixed-investments`
Get all fixed investments for the authenticated user.

**Response**: Array of fixed investments
```json
[
  {
    "id": "uuid",
    "category_id": "uuid",
    "amount": "decimal",
    "frequency": "daily|weekly|monthly|yearly",
    "start_date": "date",
    "end_date": "date|null",
    "expected_return_rate": "decimal",
    "investment_type": "string",
    "note": "string",
    "is_active": "boolean",
    "last_generated_date": "date|null"
  }
]
```

#### POST `/financial/fixed-investments`
Create a new fixed investment.

**Request Body**:
```json
{
  "category_id": "uuid",
  "amount": "decimal",
  "frequency": "daily|weekly|monthly|yearly",
  "start_date": "date",
  "end_date": "date|null",
  "expected_return_rate": "decimal",
  "investment_type": "string",
  "note": "string",
  "is_active": "boolean"
}
```

#### PUT `/financial/fixed-investments/:id`
Update a fixed investment.

#### DELETE `/financial/fixed-investments/:id`
Delete a fixed investment.

### Transactions

#### GET `/transactions`
Get all transactions for the authenticated user.

**Response**: Array of transactions
```json
[
  {
    "id": "uuid",
    "category_id": "uuid",
    "amount": "decimal",
    "description": "string",
    "type": "income|expense|investment",
    "date": "date",
    "categories": {
      "id": "uuid",
      "name": "string",
      "type": "string",
      "color": "string",
      "icon": "string"
    }
  }
]
```

#### POST `/transactions`
Create a new transaction.

**Request Body**:
```json
{
  "category_id": "uuid",
  "amount": "decimal",
  "description": "string",
  "type": "income|expense|investment",
  "date": "date"
}
```

#### PUT `/transactions/:id`
Update a transaction.

#### DELETE `/transactions/:id`
Delete a transaction.

### Transaction Generation

#### POST `/financial/generate-transactions`
Generate recurring transactions from fixed costs, periodic income, and fixed investments.

**Response**:
```json
{
  "message": "string",
  "latest_transactions": [
    {
      "id": "uuid",
      "category_id": "uuid",
      "amount": "decimal",
      "description": "string",
      "type": "income|expense|investment",
      "date": "date"
    }
  ]
}
```

### Reports

#### GET `/reports/monthly`
Get monthly financial report.

**Query Parameters**:
- `year` (required): Year for the report (integer)
- `month` (required): Month for the report (1-12)

**Response**:
```json
{
  "total_income": "decimal",
  "total_expense": "decimal",
  "net_savings": "decimal",
  "categories": [
    {
      "category_id": "uuid",
      "category_name": "string",
      "total_amount": "decimal"
    }
  ]
}
```

#### GET `/reports/all-time`
Get all-time balance report.

**Response**:
```json
{
  "total_income": "decimal",
  "total_expense": "decimal",
  "total_investments": "decimal",
  "net_worth": "decimal",
  "savings_rate": "decimal"
}
```

### Trends

#### GET `/trends/yearly`
Get yearly transaction trends.

**Query Parameters**:
- `type` (optional): Filter by transaction type (income|expense)

**Response**:
```json
[
  {
    "year": "integer",
    "month": "integer",
    "total_amount": "decimal",
    "transaction_count": "integer",
    "average_amount": "decimal"
  }
]
```

#### GET `/trends/category`
Get category-wise spending trends.

**Query Parameters**:
- `year` (required): Year for the trends
- `month` (required): Month for the trends (1-12)

**Response**:
```json
[
  {
    "category_id": "uuid",
    "category_name": "string",
    "total_amount": "decimal",
    "percentage": "decimal"
  }
]
```

### Profiles

#### GET `/profiles`
Get current user's profile.

**Response**:
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "theme_color": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### PUT `/profiles`
Update current user's profile.

**Request Body**:
```json
{
  "name": "string",
  "theme_color": "string"
}
```

#### DELETE `/profiles`
Delete current user's profile.

## Database Schema

### Categories Table
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  icon VARCHAR(255),
  color VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Financial Goals Table
```sql
CREATE TABLE financial_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) DEFAULT 0,
  deadline DATE,
  status VARCHAR(50) DEFAULT 'in_progress',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Fixed Costs Table
```sql
CREATE TABLE fixed_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  category_id UUID REFERENCES categories(id),
  amount DECIMAL(12,2) NOT NULL,
  frequency VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  note TEXT,
  is_active BOOLEAN DEFAULT true,
  last_generated_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Periodic Income Table
```sql
CREATE TABLE periodic_income (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  category_id UUID REFERENCES categories(id),
  amount DECIMAL(12,2) NOT NULL,
  frequency VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  note TEXT,
  is_active BOOLEAN DEFAULT true,
  last_generated_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Fixed Investments Table
```sql
CREATE TABLE fixed_investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  category_id UUID REFERENCES categories(id),
  amount DECIMAL(12,2) NOT NULL,
  frequency VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  expected_return_rate DECIMAL(5,2),
  investment_type VARCHAR(255) NOT NULL,
  note TEXT,
  is_active BOOLEAN DEFAULT true,
  last_generated_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  category_id UUID REFERENCES categories(id),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security Features
1. JWT-based authentication
2. User-specific data isolation
3. Row-level security in database
4. Input validation for all endpoints
5. Secure error handling

## Environment Variables
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
PORT=3000 (optional, defaults to 3000)
NODE_ENV=development|production
```

## Dependencies
- express
- @supabase/supabase-js
- express-validator
- cors
- dotenv
- swagger-ui-express

## Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env`
4. Start the server: `npm start`

## API Testing
Run the test suite:
```bash
node test-api.js
```

## Additional Notes
- All dates should be in ISO 8601 format (YYYY-MM-DD)
- All decimal values should have at most 2 decimal places
- Category IDs are required for transactions and recurring entries
- Frequencies can be: daily, weekly, monthly, yearly
- Transaction types can be: income, expense, investment

## Database Functions

### Transaction Generation
```sql
-- Generate transactions from fixed costs
schedule_recurring_transactions()
  - Generates transactions from fixed costs, periodic income, and fixed investments
  - Updates last_generated_date for each source

-- Get monthly report
get_monthly_report(user_id_param UUID, year_param INT, month_param INT)
  - Returns monthly financial summary
  - Includes category-wise breakdown

-- Get all-time balance
get_all_time_balance_report(user_id_param UUID)
  - Returns total income, expenses, investments
  - Calculates net worth and savings rate

-- Get yearly trends
get_yearly_trends(user_id_param UUID, type_param TEXT)
  - Returns monthly transaction trends
  - Includes count and averages
```

## Scheduled Tasks
1. Daily transaction generation from recurring sources
2. Monthly report generation
3. Trend analysis updates

## Data Flow
1. User creates recurring entries (fixed costs, income, investments)
2. System generates transactions daily based on frequency
3. Reports and trends are updated automatically
4. User can view financial status through various endpoints

## Performance Considerations
1. Indexes on frequently queried columns
2. Materialized views for complex reports
3. Caching for frequently accessed data
4. Batch processing for transaction generation

## Security Measures
1. JWT-based authentication
2. User data isolation
3. Input validation
4. SQL injection prevention
5. Rate limiting
6. Row-level security
7. Audit logging

## Error Handling
1. Validation errors (400)
2. Authentication errors (401)
3. Authorization errors (403)
4. Not found errors (404)
5. Server errors (500)

## Rate Limiting
- 100 requests per minute per user
- 1000 requests per hour per user

## Caching Strategy
1. Reports cached for 1 hour
2. Trends cached for 24 hours
3. Profile data cached for 15 minutes

## Monitoring
1. Request/response times
2. Error rates
3. Database performance
4. API usage patterns
5. Authentication failures

## Development Guidelines
1. Follow REST principles
2. Use proper HTTP methods
3. Validate all inputs
4. Handle all errors gracefully
5. Document all changes
6. Write tests for new features

## Testing
1. Unit tests for business logic
2. Integration tests for API endpoints
3. Load tests for performance
4. Security tests for vulnerabilities

## Deployment
1. Environment configuration
2. Database migrations
3. API versioning
4. Rollback procedures
5. Monitoring setup

## Future Enhancements
1. GraphQL API
2. Real-time updates
3. Advanced analytics
4. Machine learning predictions
5. Mobile app support
