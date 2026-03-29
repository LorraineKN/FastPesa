# Instant Kenya Aid

## Description
Instant Kenya Aid is a digital platform designed to **facilitate emergency aid and donations in Kenya**.  
It streamlines contributions via mobile payments and provides multi-role access for administrators and users.

**Problem:** Manual and slow processes delay emergency assistance and donations.  
**Solution:** This app automates aid distribution and payment tracking, ensuring timely support.  
**Target Users:** Donors, Administrators, and Beneficiaries.

## Screenshots
<!-- Add images of key features -->
![Dashboard](path/to/screenshot1.png)
![MPesa Payment Flow](path/to/screenshot2.png)
![User Roles](path/to/screenshot3.png)

## Live Demo
- Frontend: [Instant Kenya Aid](https://instant-kenya-aid.lovable.app/)  
- Test accounts:
  - **Admin:** admin@example.com / password123
  - **User:** user@example.com / password123

## About
Instant Kenya Aid allows:
- Secure and automated mobile donations via M-Pesa Daraja API
- Multi-role system for administrators and users
- Tracking of donations and disbursements in real time
- Comprehensive backend API for management and reporting

## Technologies Used

### Frontend
- React
- TailwindCSS
- Axios

### Backend
- Java 21 / Spring Boot
- Spring Security
- Spring Data JPA / Hibernate

### Database
- PostgreSQL

### Tools & APIs
- M-Pesa Daraja API
- Swagger for API documentation
- Docker (optional for deployment)
- Postman for testing

## Collaborators
| Name | Role |
|------|------|
| [Your Name] | Project Lead / Backend |
| [Collaborator 2] | Frontend Developer |
| [Collaborator 3] | QA / Documentation |
<!-- Add up to 6 collaborators -->

## Setup & Running Instructions

### Prerequisites
- Node.js >= 18
- Java 21
- Maven
- PostgreSQL
- [Optional] Docker

### Frontend Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/instant-kenya-aid.git
cd instant-kenya-aid/frontend

# Install dependencies
npm install

# Run the frontend
npm start
```
Frontend will be available at: `http://localhost:3000`

### Backend Setup
```bash
cd ../backend

# Build the Spring Boot application
mvn clean install

# Run the application
mvn spring-boot:run
```
Backend API will be available at: `http://localhost:8080/api`

### Environment Variables
Copy the `.env.example` to `.env` and fill in the details:
```bash
cp .env.example .env
```

**.env Example:**
```dotenv
# Database Configuration
DB_USERNAME=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=emergency_wallet

# JWT Configuration
JWT_SECRET=your-very-secure-secret-key-that-is-at-least-32-characters-long-change-this
JWT_EXPIRATION=86400000

# M-Pesa Daraja API Configuration
MPESA_CONSUMER_KEY=your_consumer_key_from_safaricom
MPESA_CONSUMER_SECRET=your_consumer_secret_from_safaricom
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey_from_safaricom
MPESA_CALLBACK_URL=https://your-domain.com/api/callbacks/mpesa
MPESA_STK_CALLBACK_URL=https://your-domain.com/api/callbacks/stk

# Environment: sandbox or production
MPESA_ENV=sandbox

# Demo Mode: true for simulation, false for real Daraja API
DEMO_MODE=true

# Server Configuration
SERVER_PORT=8080
SERVER_SERVLET_CONTEXT_PATH=/api

# Logging
LOG_LEVEL=INFO
```

### API Documentation
Access full backend documentation here: [Swagger API Docs](https://novaapi.pegien.co.ke/swagger-ui/index.html)

### Running URLs
- Frontend: `https://instant-kenya-aid.lovable.app/`
- Backend API: `http://localhost:8080/api`

## Key Features
- Multi-role system with Admin and User access
- Secure payments via M-Pesa Daraja API
- Real-time donation tracking and reporting
- Clean and maintainable codebase

## Notes
- Ensure PostgreSQL is running before starting the backend
- Test accounts are provided for demo purposes
- Code is fully commented and follows best practices

