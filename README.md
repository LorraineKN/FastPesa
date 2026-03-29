# Instant Kenya Aid

## Description
The Emergency Wallet is a "phone-less" financial backup designed to ensure individuals (and their children) remain mobile and safe when their primary tools fail. It solves the critical gap when a user is stranded—due to a lost/stolen phone, dead battery, or being in an insecure area where flashing a smartphone is risky.

By decoupling M-Pesa access from a physical SIM card or email login, the platform provides a lightweight, memory-based way to pay for essential services like Matatus, Ubers, restaurants, or school supplies using only a username and passphrase.

Functionality
The system operates as a secure, secondary layer to a user's primary M-Pesa or bank account, focusing on high-speed, low-friction transactions for small, essential amounts (e.g., 1,000 to 5,000 KES).

Setup: Users pre-authorize a "Safety Pool" of funds and create a unique Username + PIN/Passphrase combination. This eliminates the need for email access or an OTP (which requires a working phone).

The "Stranger's Gadget" Protocol: In an emergency, the user accesses the platform via any available device—be it a merchant’s phone, a cyber café computer, or a school administrator’s tablet.

Kid-Friendly Access: Since minors cannot legally hold M-Pesa accounts, parents can create "Sub-Wallets" for their children. Students can pay for school items or emergency transport by simply providing their credentials to a registered merchant, with funds disbursed instantly via M-Pesa.

Security & Limits: To mitigate the risk of using public devices, the platform enforces strict transaction ceilings (e.g., max 5,000 KES) and uses session-clearing technology to ensure no credentials remain on the merchant’s device.

Merchant Integration: Merchants (Matatu drivers, shopkeepers, etc.) act as the interface. They initiate the request, the user inputs their PIN on the merchant's interface, and the funds are moved via M-Pesa to the merchant instantly, confirming the payment.

**Problem:** Manual and slow processes delay emergency assistance and donations.  
**Solution:** This app automates aid distribution and payment tracking, ensuring timely support.  
**Target Users:** Donors, Administrators, and Beneficiaries.

## Screenshots
<!-- Add images of key features -->
<img width="1600" height="804" alt="image" src="https://github.com/user-attachments/assets/b05d5b3c-6af2-47ed-b420-46bec6c7524b" />
<img width="1600" height="804" alt="image" src="https://github.com/user-attachments/assets/7213c919-4849-4bf6-8acd-a0bf62b1c0e4" />
<img width="1600" height="804" alt="image" src="https://github.com/user-attachments/assets/b7170b1b-f9c4-4272-a0b9-df64b40e340b" />
<img width="1600" height="804" alt="image" src="https://github.com/user-attachments/assets/ec570831-eb46-4b0d-a334-1e1364e6b5e9" />
<img width="1600" height="804" alt="image" src="https://github.com/user-attachments/assets/b3107273-e4e8-46ab-9a68-13be9435b6dd" />
<img width="1600" height="804" alt="image" src="https://github.com/user-attachments/assets/01977374-b8b1-4bf1-98b0-3be64d91b05c" />
<img width="1600" height="804" alt="image" src="https://github.com/user-attachments/assets/d82dcb32-18e1-424e-9720-43acb075566e" />
<img width="1600" height="804" alt="image" src="https://github.com/user-attachments/assets/2524a971-fac5-4945-b172-07f89200b50f" />






## Live Demo
- Frontend: [Instant Kenya Aid](https://instant-kenya-aid.lovable.app/)  
- Test accounts:
  - **User:** user@example.com / Password@123

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
git clone git@github.com:LorraineKN/FastPesa.git
cd FastPesa/FrontEnd

# Install dependencies
npm install

# Run the frontend
npm run start
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
Backend API will be available at: `http://localhost:8080/swagger-ui/index.html`

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
- Backend API: `https://novaapi.pegien.co.ke/swagger-ui/index.html`

## Key Features
- Multi-role system with Admin and User access
- Secure payments via M-Pesa Daraja API
- Real-time donation tracking and reporting
- Clean and maintainable codebase

## Notes
- Ensure PostgreSQL is running before starting the backend
- Test accounts are provided for demo purposes
- Code is fully commented and follows best practices

