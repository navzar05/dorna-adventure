# Architecture Documentation

## Table of Contents

1. [Overview](#overview)
2. [Feature-Based DDD Structure](#feature-based-ddd-structure)
3. [Package Organization](#package-organization)
4. [Service Layer Design](#service-layer-design)
5. [Exception Handling Strategy](#exception-handling-strategy)
6. [Constants Usage](#constants-usage)
7. [Separation of Concerns](#separation-of-concerns)
8. [Design Patterns](#design-patterns)
9. [Data Flow](#data-flow)
10. [Security Architecture](#security-architecture)

## Overview

The Dorna Adventure backend follows a **Feature-Based Domain-Driven Design (DDD)** architecture. Rather than organizing code by technical layers (controllers, services, repositories), we organize by business domains (booking, payment, employee, etc.). Each domain is self-contained with its own layers.

### Why Feature-Based DDD?

- **High Cohesion**: Related code stays together
- **Easy Navigation**: Find all booking-related code in one place
- **Clear Boundaries**: Each domain has clear responsibilities
- **Scalability**: Easy to add new domains without affecting existing ones
- **Team Collaboration**: Different teams can work on different domains independently
- **Maintainability**: Changes to one domain rarely affect others

## Feature-Based DDD Structure

### Domain Organization

```
src/main/java/ro/atm/backend/
├── common/                     # Shared components across domains
│   ├── config/                 # Configuration classes
│   ├── constants/              # Application-wide constants
│   └── exception/              # Custom exception classes
├── domain/                     # Business domains
│   ├── activity/
│   ├── auth/
│   ├── booking/
│   ├── employee/
│   ├── payment/
│   ├── settings/
│   └── user/
└── infrastructure/             # Infrastructure services
    ├── email/
    ├── sms/
    └── storage/
```

### Standard Domain Structure

Each domain follows this consistent structure:

```
domain/<domain-name>/
├── controller/          # REST API endpoints
│   └── *Controller.java
├── dto/                 # Data Transfer Objects
│   ├── *Request.java
│   ├── *Response.java
│   └── *DTO.java
├── entity/              # JPA entities (database models)
│   └── *.java
├── mapper/              # Entity-DTO mappers
│   └── *Mapper.java
├── repository/          # Spring Data JPA repositories
│   └── *Repository.java
└── service/             # Business logic services
    ├── *Service.java
    └── *ValidationService.java
```

## Package Organization

### 1. Common Package (`common/`)

Houses shared components used across multiple domains.

#### Configuration (`config/`)
- **CorsConfig**: Cross-Origin Resource Sharing configuration
- **JwtAuthenticationFilter**: JWT token validation filter
- **SecurityConfig**: Spring Security configuration
- **ApplicationConfig**: General application configuration

#### Constants (`constants/`)
- **BookingConstants**: Booking-related constants (deadlines, limits)
- **PaymentConstants**: Payment-related constants (minimums, fees)
- **EmployeeConstants**: Employee-related constants
- **EmailConstants**: Email template constants
- **ValidationConstants**: Validation rules and patterns

Example:
```java
public class BookingConstants {
    public static final int MAX_PARTICIPANTS_PER_BOOKING = 20;
    public static final int MIN_BOOKING_ADVANCE_HOURS = 24;
    public static final int PAYMENT_DEADLINE_DAYS = 7;
}
```

#### Exceptions (`exception/`)
- **GlobalExceptionHandler**: Centralized exception handling
- Custom exceptions for each domain
- Standardized error responses

### 2. Domain Package (`domain/`)

Each domain is a self-contained module representing a business capability.

#### Domain: Authentication (`auth/`)

Handles user authentication, registration, and security.

**Key Components:**
- `AuthController`: Login, register, password reset endpoints
- `AuthenticationService`: Authentication logic
- `JwtService`: JWT token generation and validation
- `User` entity: User model with roles and credentials

**Responsibilities:**
- User registration with email verification
- Login with JWT token generation
- Password reset functionality
- Two-factor authentication (2FA)
- Token refresh mechanism

#### Domain: Booking (`booking/`)

Manages the booking lifecycle for activities.

**Key Components:**
- `BookingController`: Booking CRUD endpoints
- `BookingService`: Core booking business logic
- `BookingValidationService`: Booking validation rules
- `Booking` entity: Booking model with status and payment tracking

**Responsibilities:**
- Create bookings for authenticated and guest users
- Validate participant counts and activity availability
- Track booking status (PENDING, CONFIRMED, COMPLETED, CANCELLED)
- Track payment status (UNPAID, DEPOSIT_PAID, FULLY_PAID)
- Enforce payment deadlines
- Calculate deposit and remaining amounts

**Business Rules:**
- Bookings require payment within deadline
- Participant count must be within activity limits
- Status transitions follow defined workflow
- Deposit calculation based on activity pricing

#### Domain: Employee (`employee/`)

Manages employee records and work schedules.

**Key Components:**
- `EmployeeController`: Employee CRUD endpoints
- `EmployeeService`: Employee management logic
- `EmployeeValidationService`: Employee data validation
- `WorkHours` entity: Work hour tracking

**Responsibilities:**
- Create and manage employee records
- Track work hours and schedules
- Validate employee data
- Ensure username uniqueness
- Manage employee-activity assignments

#### Domain: Payment (`payment/`)

Handles payment processing and tracking.

**Key Components:**
- `PaymentController`: Payment endpoints
- `PaymentService`: Payment business logic
- `StripePaymentService`: Stripe API integration
- `Payment` entity: Payment record model

**Responsibilities:**
- Create Stripe payment intents
- Process card payments
- Record cash payments
- Handle payment webhooks
- Update booking payment status
- Track payment history

**Service Separation:**
- `PaymentService`: Business logic (what to pay, when, status updates)
- `StripePaymentService`: Infrastructure (how to interact with Stripe API)

#### Domain: Activity (`activity/`)

Manages the activity catalog.

**Key Components:**
- `ActivityController`: Activity CRUD endpoints
- `ActivityService`: Activity management logic
- `Activity` entity: Activity model

**Responsibilities:**
- Create and update activities
- Set participant limits and pricing
- Manage activity images
- Define deposit requirements
- Track activity availability

#### Domain: Settings (`settings/`)

Manages application-wide settings.

**Key Components:**
- `SettingsController`: Settings endpoints
- `SettingsService`: Settings management
- `Setting` entity: Key-value settings storage

**Responsibilities:**
- Store configuration values
- Manage email settings
- Manage SMS settings
- System-wide preferences

#### Domain: User (`user/`)

Manages user profiles and user-related operations.

**Key Components:**
- `UserController`: User profile endpoints
- `UserService`: User management logic
- `UserRepository`: User data access

**Responsibilities:**
- User profile management
- User role management
- User search and filtering

### 3. Infrastructure Package (`infrastructure/`)

Contains implementations of infrastructure concerns.

#### Email Service (`email/`)
- Email sending via SMTP
- Template-based emails
- Verification emails
- Booking confirmations
- Password reset emails

#### SMS Service (`sms/`)
- SMS sending via Twilio
- Notification messages
- 2FA codes

#### Storage Service (`storage/`)
- File upload to S3/R2
- Image management
- URL generation

## Service Layer Design

### Service Types

#### 1. Core Services
Main business logic services for each domain.

**Example: BookingService**
```java
@Service
@RequiredArgsConstructor
public class BookingService {
    private final BookingRepository bookingRepository;
    private final BookingValidationService validationService;
    private final ActivityService activityService;

    public BookingDTO createBooking(CreateBookingRequest request) {
        // 1. Validate request
        validationService.validateBookingData(request);

        // 2. Get activity and validate participants
        Activity activity = activityService.getActivity(request.getActivityId());
        validationService.validateParticipantCount(activity, request.getParticipants());

        // 3. Create booking
        Booking booking = buildBooking(request, activity);

        // 4. Save and return
        return BookingMapper.toDTO(bookingRepository.save(booking));
    }
}
```

**Characteristics:**
- Orchestrates business operations
- Calls validation services
- Interacts with repositories
- May call other domain services
- Handles transactions

#### 2. Validation Services
Dedicated services for domain validation logic.

**Example: BookingValidationService**
```java
@Service
@RequiredArgsConstructor
public class BookingValidationService {
    private final BookingRepository bookingRepository;

    public void validateParticipantCount(Activity activity, int participants) {
        if (participants < activity.getMinParticipants() ||
            participants > activity.getMaxParticipants()) {
            throw new ValidationException("Invalid participant count");
        }
    }

    public boolean canAcceptPayment(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new BookingNotFoundException(bookingId));

        return booking.getStatus() == BookingStatus.CONFIRMED &&
               booking.getPaymentStatus() != PaymentStatus.FULLY_PAID &&
               !isPaymentDeadlinePassed(booking);
    }
}
```

**Characteristics:**
- Focused on validation logic
- Can query repositories for validation
- Throws specific exceptions
- Reusable validation methods
- Improves testability

#### 3. Infrastructure Services
Services that interact with external systems.

**Example: StripePaymentService**
```java
@Service
@RequiredArgsConstructor
public class StripePaymentService {

    public PaymentIntent createPaymentIntent(Booking booking, BigDecimal amount) {
        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(convertToStripeAmount(amount))
                .setCurrency("ron")
                .putMetadata("bookingId", booking.getId().toString())
                .build();

            return PaymentIntent.create(params);
        } catch (StripeException e) {
            throw new PaymentException("Failed to create payment intent", e);
        }
    }
}
```

**Characteristics:**
- Encapsulates external API calls
- Handles API-specific errors
- Converts between domain and API models
- No business logic

### Service Layer Benefits

1. **Single Responsibility**: Each service has one clear purpose
2. **Testability**: Easy to mock dependencies
3. **Reusability**: Validation logic can be reused
4. **Maintainability**: Changes isolated to specific services
5. **Clarity**: Easy to understand what each service does

## Exception Handling Strategy

### Custom Exception Hierarchy

```
RuntimeException
├── BusinessException (abstract)
│   ├── BookingNotFoundException
│   ├── EmployeeNotFoundException
│   ├── ActivityNotFoundException
│   ├── PaymentException
│   ├── UsernameAlreadyExistsException
│   └── ValidationException
└── InfrastructureException (abstract)
    ├── EmailSendException
    ├── SmsSendException
    └── FileStorageException
```

### Exception Structure

```java
public class BookingNotFoundException extends RuntimeException {
    private final Long bookingId;

    public BookingNotFoundException(Long bookingId) {
        super("Booking not found with ID: " + bookingId);
        this.bookingId = bookingId;
    }
}
```

### Global Exception Handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BookingNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleBookingNotFound(
            BookingNotFoundException ex) {
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            ValidationException ex) {
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse(ex.getMessage(), ex.getField()));
    }
}
```

### Exception Handling Benefits

1. **Consistent Error Responses**: All exceptions handled uniformly
2. **Clear Error Messages**: Descriptive messages for debugging
3. **Proper HTTP Status Codes**: RESTful error responses
4. **Type Safety**: Compile-time checking of exception handling
5. **Separation**: Business exceptions vs infrastructure exceptions

## Constants Usage

### Purpose of Constants

Constants centralize configuration values and magic numbers, making the codebase more maintainable.

### Constant Organization

```java
// Domain-specific constants
public class BookingConstants {
    // Booking limits
    public static final int MAX_PARTICIPANTS_PER_BOOKING = 20;
    public static final int MIN_PARTICIPANTS_PER_BOOKING = 1;

    // Time limits
    public static final int MIN_BOOKING_ADVANCE_HOURS = 24;
    public static final int PAYMENT_DEADLINE_DAYS = 7;
    public static final int CANCELLATION_DEADLINE_HOURS = 48;

    // Deposit
    public static final BigDecimal DEFAULT_DEPOSIT_PERCENTAGE = new BigDecimal("0.30");
}
```

### Benefits

1. **Single Source of Truth**: Change value in one place
2. **Type Safety**: Compile-time checking
3. **Discoverability**: Easy to find available constants
4. **Documentation**: Constants document business rules
5. **Consistency**: Same values used everywhere

## Separation of Concerns

### Layered Architecture Within Domains

```
Controller Layer (Presentation)
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Data Access)
    ↓
Database
```

### Responsibilities by Layer

#### Controller Layer
- Handle HTTP requests/responses
- Validate request format
- Call service methods
- Return appropriate status codes
- **NO business logic**

```java
@PostMapping
public ResponseEntity<BookingDTO> createBooking(@RequestBody CreateBookingRequest request) {
    BookingDTO booking = bookingService.createBooking(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(booking);
}
```

#### Service Layer
- Implement business logic
- Coordinate operations
- Validate business rules
- Handle transactions
- **NO HTTP concerns**

```java
@Transactional
public BookingDTO createBooking(CreateBookingRequest request) {
    validationService.validateBookingData(request);
    // Business logic here
    return BookingMapper.toDTO(savedBooking);
}
```

#### Repository Layer
- Data access only
- Query database
- Use Spring Data JPA
- **NO business logic**

```java
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserId(Long userId);
    List<Booking> findByStatus(BookingStatus status);
}
```

### Infrastructure vs Business Logic

#### Business Logic (in domain services)
- What operations are allowed
- When operations can happen
- Business rules and validations
- State transitions

#### Infrastructure (in infrastructure services)
- How to send emails
- How to process payments with Stripe
- How to upload files to S3
- How to send SMS

**Example Separation:**

```java
// PaymentService (Business Logic)
public PaymentIntentResponse createPaymentIntent(PaymentIntentRequest request) {
    // Business logic: what amount, what type, validation
    Booking booking = bookingRepository.findById(request.getBookingId())
        .orElseThrow(() -> new BookingNotFoundException(request.getBookingId()));

    BigDecimal amount = calculatePaymentAmount(booking, request.getPaymentType());

    // Delegate to infrastructure service
    PaymentIntent paymentIntent = stripePaymentService.createPaymentIntent(booking, amount);

    // Business logic: save payment record
    Payment payment = savePaymentRecord(booking, amount, paymentIntent);

    return buildResponse(payment, paymentIntent);
}

// StripePaymentService (Infrastructure)
public PaymentIntent createPaymentIntent(Booking booking, BigDecimal amount) {
    // Infrastructure: how to call Stripe API
    PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
        .setAmount(convertToStripeAmount(amount))
        .setCurrency("ron")
        .build();

    return PaymentIntent.create(params);
}
```

## Design Patterns

### 1. Repository Pattern
- Spring Data JPA repositories
- Abstract data access
- Type-safe queries

### 2. Service Pattern
- Business logic encapsulation
- Transaction management
- Dependency injection

### 3. DTO Pattern
- Data transfer between layers
- Validation at boundaries
- Decoupling from entities

### 4. Mapper Pattern
- Convert between entities and DTOs
- Centralize mapping logic
- Static utility methods

### 5. Strategy Pattern
- Payment type handling
- Notification sending
- File storage backends

### 6. Dependency Injection
- Constructor injection via Lombok
- Testable components
- Loose coupling

## Data Flow

### Typical Request Flow

```
1. Client Request
   ↓
2. Controller receives HTTP request
   ↓
3. Controller validates request format
   ↓
4. Controller calls Service method
   ↓
5. Service validates business rules (via ValidationService)
   ↓
6. Service performs business logic
   ↓
7. Service calls Repository for data access
   ↓
8. Repository queries Database
   ↓
9. Database returns results
   ↓
10. Repository returns Entity
    ↓
11. Service processes Entity
    ↓
12. Service returns DTO
    ↓
13. Controller returns HTTP response
    ↓
14. Client receives response
```

### Example: Create Booking Flow

```
POST /api/bookings
   ↓
BookingController.createBooking()
   ↓
BookingService.createBooking()
   ↓
BookingValidationService.validateBookingData()
   ↓
ActivityService.getActivity()
   ↓
BookingValidationService.validateParticipantCount()
   ↓
BookingRepository.save()
   ↓
BookingMapper.toDTO()
   ↓
Return BookingDTO
```

## Security Architecture

### Authentication Flow

1. User submits credentials
2. AuthenticationService validates credentials
3. JwtService generates JWT token
4. Token returned to client
5. Client includes token in subsequent requests
6. JwtAuthenticationFilter validates token
7. Security context populated with user details

### Authorization

- **Role-based access control (RBAC)**
- Roles: ADMIN, EMPLOYEE, CUSTOMER
- Method-level security with `@PreAuthorize`
- Endpoint-level security in SecurityConfig

### Security Configuration

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) {
    http
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**").permitAll()
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .anyRequest().authenticated()
        )
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
}
```

## Conclusion

This architecture provides:

- **Modularity**: Clear domain boundaries
- **Maintainability**: Easy to locate and modify code
- **Testability**: Services are independently testable
- **Scalability**: Easy to add new domains
- **Clarity**: Consistent structure across domains
- **Separation**: Business logic separate from infrastructure

The feature-based DDD approach ensures the codebase remains organized and maintainable as the application grows.
