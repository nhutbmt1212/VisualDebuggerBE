# Database Seeding Guide

## Quick Start

To seed your database with sample data, run:

```bash
npx prisma db seed
```

## Sample Data Created

### Users (3)
- **admin@visualdebugger.com** (Admin User)
  - Password: `password123`
  - Has 1 project: E-Commerce Platform

- **developer@example.com** (John Developer)
  - Password: `password123`
  - Has 2 projects: Mobile App Backend, Analytics Dashboard

- **tester@example.com** (Jane Tester)
  - Password: `password123`
  - No projects

### Projects (3)
1. **E-Commerce Platform** (Owner: admin@visualdebugger.com)
   - API Key: `vd_ecommerce_prod_key_12345`
   - Environment: Production
   - Has 1 debug session with 2 events

2. **Mobile App Backend** (Owner: developer@example.com)
   - API Key: `vd_mobile_api_key_67890`
   - Environment: Development
   - Has 1 debug session with 1 error event

3. **Analytics Dashboard** (Owner: developer@example.com)
   - API Key: `vd_analytics_key_abcdef`
   - No sessions yet

### Debug Sessions (2)
- Production session for E-Commerce Platform
- Development session for Mobile App Backend

### Debug Events (3)
- Function call event (processCheckout)
- HTTP request event (POST /api/checkout)
- Error event (ValidationError)

## Usage

After seeding, you can:
1. Login to the dashboard with any of the sample user credentials
2. Use the project API keys to test SDK integration
3. View existing debug sessions and events
4. Test real-time WebSocket connections

## Re-seeding

The seed script clears all existing data before creating new sample data. To re-seed:

```bash
npx prisma db seed
```

**Warning**: This will delete all existing data in the database!
