# Dorna Adventure - Backend

A modern, feature-based backend application for managing adventure tourism activities, bookings, and payments built with Spring Boot and following Domain-Driven Design principles.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Domain Structure](#domain-structure)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Development](#development)
- [Testing](#testing)
- [Documentation](#documentation)

## Overview

The Dorna Adventure Backend is a comprehensive RESTful API service that manages:

- User authentication and authorization with JWT tokens
- Activity catalog and management
- Customer booking workflows
- Employee scheduling and work hours
- Payment processing via Stripe
- Email notifications
- SMS notifications via Twilio
- File storage with AWS S3-compatible services (R2)
- Two-factor authentication (2FA) support

## Architecture

This application follows a **Feature-Based Domain-Driven Design (DDD)** structure where each domain is organized as a self-contained module with its own layers.

### Key Architectural Principles

1. **Domain-Driven Design**: Code is organized by business domains rather than technical layers
2. **Separation of Concerns**: Business logic is separated from infrastructure concerns
3. **Service Layer Pattern**: Complex business logic is encapsulated in dedicated service classes
4. **Repository Pattern**: Data access is abstracted through Spring Data JPA repositories
5. **DTO Pattern**: Data transfer between layers uses dedicated DTO classes
6. **Validation Services**: Domain validation logic is centralized in dedicated validation services

For detailed architecture information, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Domain Structure

The application is organized into the following business domains:

### 1. Authentication (`domain.auth`)
- User registration and login
- JWT token generation and validation
- Password reset functionality
- Two-factor authentication (2FA)
- Email verification

### 2. Booking (`domain.booking`)
- Customer booking creation and management
- Guest and authenticated user bookings
- Booking status workflow (PENDING, CONFIRMED, COMPLETED, CANCELLED)
- Payment status tracking (UNPAID, DEPOSIT_PAID, FULLY_PAID)
- Booking validation and business rules

### 3. Employee (`domain.employee`)
- Employee CRUD operations
- Work hour tracking
- Employee scheduling
- Validation of employee data
- Username uniqueness checks

### 4. Payment (`domain.payment`)
- Stripe payment integration
- Payment intent creation
- Payment status tracking (PENDING, COMPLETED, FAILED, REFUNDED)
- Cash payment recording
- Payment type handling (DEPOSIT, REMAINING, FULL)
- Webhook handling for payment events

### 5. Activity (`domain.activity`)
- Activity catalog management
- Activity CRUD operations
- Participant limits and pricing
- Activity availability management
- Image upload and management

### 6. Settings (`domain.settings`)
- Application configuration
- Email settings
- SMS settings
- Payment settings
- System-wide preferences

### 7. User (`domain.user`)
- User profile management
- User repository and data access
- User role management (ADMIN, EMPLOYEE, CUSTOMER)

## Technology Stack

### Core Framework
- **Spring Boot 4.0.0** - Application framework
- **Java 21** - Programming language
- **Maven** - Dependency management and build tool

### Database
- **PostgreSQL** - Primary database
- **Spring Data JPA** - Data access layer
- **Hibernate** - ORM framework

### Security
- **Spring Security** - Authentication and authorization
- **JWT (jjwt 0.13.0)** - Token-based authentication
- **TOTP** - Two-factor authentication

### External Services
- **Stripe (31.0.0)** - Payment processing
- **AWS SDK S3 (2.20.26)** - File storage (R2 compatible)
- **Twilio (11.2.0)** - SMS notifications
- **Spring Mail** - Email notifications

### Development Tools
- **Lombok** - Reduce boilerplate code
- **Spring Boot DevTools** - Development utilities
- **Spring Boot Actuator** - Monitoring and management

### Testing
- **JUnit 5** - Testing framework
- **Mockito** - Mocking framework
- **Spring Boot Test** - Integration testing support
- **AssertJ** - Fluent assertions

## Getting Started

### Prerequisites

- Java 21 or higher
- Maven 3.8 or higher
- PostgreSQL 14 or higher
- Stripe account (for payment processing)
- AWS S3 or compatible storage (R2)
- SMTP server (for email)
- Twilio account (for SMS, optional)

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd dorna-adventure/backend
```

2. Set up environment variables:
Create a `.env` file in the backend directory. See [ENV_SETUP.md](ENV_SETUP.md) for detailed configuration.

3. Set up the database:
```bash
createdb dorna_adventure
```

4. Build the project:
```bash
mvn clean install
```

5. Run the application:
```bash
mvn spring-boot:run
```

The application will start on `http://localhost:8080`.

### Database Migrations

The application uses JPA's automatic schema generation during development. For production deployments, consider using a migration tool like Flyway or Liquibase.

## Development

### Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/ro/atm/backend/
│   │   │   ├── common/           # Shared components
│   │   │   │   ├── config/       # Configuration classes
│   │   │   │   ├── constants/    # Application constants
│   │   │   │   └── exception/    # Custom exceptions
│   │   │   ├── domain/           # Business domains
│   │   │   │   ├── activity/
│   │   │   │   ├── auth/
│   │   │   │   ├── booking/
│   │   │   │   ├── employee/
│   │   │   │   ├── payment/
│   │   │   │   ├── settings/
│   │   │   │   └── user/
│   │   │   └── infrastructure/   # Infrastructure services
│   │   │       ├── email/
│   │   │       ├── sms/
│   │   │       └── storage/
│   │   └── resources/
│   │       └── application.properties
│   └── test/
│       └── java/ro/atm/backend/
│           └── domain/           # Domain tests
├── pom.xml
└── README.md
```

### Domain Package Structure

Each domain follows a consistent structure:

```
domain/<domain-name>/
├── controller/          # REST API endpoints
├── dto/                 # Data Transfer Objects
├── entity/              # JPA entities
├── mapper/              # Entity-DTO mappers
├── repository/          # Data access repositories
└── service/             # Business logic services
```

### Running Tests

```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=BookingValidationServiceTest

# Run tests with coverage
mvn clean test jacoco:report
```

### Code Quality

The project follows standard Java conventions:
- Use meaningful variable and method names
- Write comprehensive JavaDoc for public APIs
- Keep methods focused and small
- Follow SOLID principles
- Write tests for business logic

## Testing

The project includes comprehensive unit tests demonstrating best practices:

### Example Test Files
- `BookingValidationServiceTest` - Booking validation logic
- `EmployeeValidationServiceTest` - Employee validation with custom exceptions
- `PaymentServiceTest` - Payment business logic with external service mocking

### Testing Patterns Used
- JUnit 5 with `@ExtendWith(MockitoExtension.class)`
- Mockito for dependency mocking
- `@Mock` and `@InjectMocks` annotations
- Standard JUnit assertions
- `@DisplayName` for readable test descriptions
- `@BeforeEach` for test setup

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - Detailed architecture documentation
- [ENV_SETUP.md](ENV_SETUP.md) - Environment variable configuration guide
- [API Documentation] - Coming soon (Swagger/OpenAPI)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/enable-2fa` - Enable 2FA
- `POST /api/auth/verify-2fa` - Verify 2FA code

### Bookings
- `GET /api/bookings` - List all bookings (admin)
- `GET /api/bookings/my` - Get user's bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/{id}` - Get booking details
- `PUT /api/bookings/{id}` - Update booking
- `DELETE /api/bookings/{id}` - Cancel booking

### Activities
- `GET /api/activities` - List all activities
- `POST /api/activities` - Create activity (admin)
- `GET /api/activities/{id}` - Get activity details
- `PUT /api/activities/{id}` - Update activity (admin)
- `DELETE /api/activities/{id}` - Delete activity (admin)

### Employees
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create employee
- `GET /api/employees/{id}` - Get employee details
- `PUT /api/employees/{id}` - Update employee
- `DELETE /api/employees/{id}` - Delete employee
- `GET /api/employees/{id}/work-hours` - Get work hours

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `GET /api/payments/booking/{bookingId}` - Get booking payments
- `POST /api/payments/{bookingId}/mark-cash` - Mark remaining as cash
- `POST /api/payments/{bookingId}/record-cash` - Record cash payment
- `POST /api/payments/webhook` - Stripe webhook handler

### Settings
- `GET /api/settings` - Get all settings
- `PUT /api/settings/{key}` - Update setting

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the project conventions
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

[Specify your license here]

## Contact

[Your contact information or team contact]

---

Built with Spring Boot and Domain-Driven Design principles.
