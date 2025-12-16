# Environment Setup Guide

This guide explains how to configure the environment variables required for the Dorna Adventure backend application.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Variables](#environment-variables)
3. [Database Configuration](#database-configuration)
4. [Storage Configuration](#storage-configuration)
5. [Payment Configuration](#payment-configuration)
6. [Email Configuration](#email-configuration)
7. [SMS Configuration](#sms-configuration)
8. [Security Configuration](#security-configuration)
9. [Development vs Production](#development-vs-production)

## Quick Start

1. Create a `.env` file in the `/backend` directory:
   ```bash
   cd backend
   touch .env
   ```

2. Copy the template below and fill in your values:
   ```bash
   cp .env.example .env  # If .env.example exists
   # OR manually copy the template from this guide
   ```

3. Update the `.env` file with your actual credentials.

4. Never commit the `.env` file to version control. It's already in `.gitignore`.

## Environment Variables

### Complete .env Template

```properties
# Database Configuration
DB_URL=jdbc:postgresql://localhost:5432/dorna_adventure_db
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password

# Cloudflare R2 Storage (or S3-compatible storage)
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY=your_r2_access_key
R2_SECRET_KEY=your_r2_secret_key
R2_BUCKET_NAME=dorna-adventure
R2_PUBLIC_URL_PREFIX=https://your-bucket-url.r2.dev/

# Stripe Payment
STRIPE_API_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_CURRENCY=ron

# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-specific-password

# Twilio SMS (Optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# JWT Security
JWT_SECRET_KEY=your-256-bit-secret-key-here
JWT_EXPIRATION_MS=86400000
```

## Database Configuration

### PostgreSQL Setup

The application uses PostgreSQL as its primary database.

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_URL` | JDBC connection URL | `jdbc:postgresql://localhost:5432/dorna_adventure_db` |
| `DB_USERNAME` | Database username | `api_account` |
| `DB_PASSWORD` | Database password | `your_secure_password` |

#### Local Development Setup

1. Install PostgreSQL (version 14 or higher recommended)

2. Create the database:
   ```bash
   createdb dorna_adventure_db
   ```

3. Create a database user:
   ```sql
   CREATE USER api_account WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE dorna_adventure_db TO api_account;
   ```

4. Update your `.env` file with the credentials.

#### Production Setup

For production, use a managed PostgreSQL service like:
- AWS RDS
- Google Cloud SQL
- Azure Database for PostgreSQL
- DigitalOcean Managed Databases

Update the `DB_URL` to point to your production database:
```properties
DB_URL=jdbc:postgresql://your-prod-db-host:5432/dorna_adventure_db
```

### JPA Configuration

The application uses these JPA settings (configured in `application.properties`):

- **DDL Auto**: `update` (automatically updates schema)
  - For production, consider using `validate` with Flyway/Liquibase
- **Show SQL**: `false` by default (set `JPA_SHOW_SQL=true` for debugging)
- **Dialect**: PostgreSQL

## Storage Configuration

### Cloudflare R2 (S3-Compatible)

The application uses Cloudflare R2 for file storage (activities images, etc.).

#### Required Variables

| Variable | Description | How to Get |
|----------|-------------|------------|
| `R2_ACCOUNT_ID` | Cloudflare account ID | Cloudflare Dashboard → R2 → Overview |
| `R2_ACCESS_KEY` | R2 API access key | Cloudflare Dashboard → R2 → Manage R2 API Tokens |
| `R2_SECRET_KEY` | R2 API secret key | Generated with access key |
| `R2_BUCKET_NAME` | Bucket name | Create in R2 Dashboard |
| `R2_PUBLIC_URL_PREFIX` | Public URL for files | R2 Bucket Settings → Public URL |

#### Setup Steps

1. **Create Cloudflare R2 Bucket**:
   - Go to Cloudflare Dashboard → R2
   - Create a new bucket named `dorna-adventure`
   - Enable public access if needed

2. **Generate API Tokens**:
   - Go to R2 → Manage R2 API Tokens
   - Create a new API token with:
     - Read & Write permissions
     - Scope: All buckets or specific bucket

3. **Get Public URL**:
   - Go to your bucket settings
   - Enable public access domain
   - Copy the public URL

4. **Update .env**:
   ```properties
   R2_ACCOUNT_ID=abc123...
   R2_ACCESS_KEY=xyz789...
   R2_SECRET_KEY=secret456...
   R2_BUCKET_NAME=dorna-adventure
   R2_PUBLIC_URL_PREFIX=https://pub-abc123.r2.dev/
   ```

#### Alternative: AWS S3

If using AWS S3 instead of R2, the configuration is compatible:

```properties
R2_ACCOUNT_ID=not-used-for-s3
R2_ACCESS_KEY=your_aws_access_key_id
R2_SECRET_KEY=your_aws_secret_access_key
R2_BUCKET_NAME=your-s3-bucket-name
R2_PUBLIC_URL_PREFIX=https://your-bucket.s3.amazonaws.com/
```

Update the S3 client configuration in the code to use AWS endpoints.

## Payment Configuration

### Stripe Setup

The application uses Stripe for payment processing.

#### Required Variables

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `STRIPE_API_KEY` | Secret API key | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Stripe Dashboard → Developers → Webhooks |
| `STRIPE_PUBLISHABLE_KEY` | Public API key | Stripe Dashboard → Developers → API Keys |
| `STRIPE_CURRENCY` | Currency code | `ron`, `usd`, `eur`, etc. |

#### Setup Steps

1. **Create Stripe Account**:
   - Sign up at https://stripe.com
   - Complete account verification

2. **Get API Keys**:
   - Go to Stripe Dashboard → Developers → API Keys
   - Copy the "Secret key" (starts with `sk_test_` for test mode)
   - Copy the "Publishable key" (starts with `pk_test_` for test mode)

3. **Set Up Webhooks**:
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/payments/webhook`
   - Select events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
   - Copy the webhook signing secret (starts with `whsec_`)

4. **Update .env**:
   ```properties
   STRIPE_API_KEY=sk_test_51ABC...
   STRIPE_WEBHOOK_SECRET=whsec_123...
   STRIPE_PUBLISHABLE_KEY=pk_test_51XYZ...
   STRIPE_CURRENCY=ron
   ```

#### Test vs Live Mode

**Test Mode** (Development):
```properties
STRIPE_API_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Live Mode** (Production):
```properties
STRIPE_API_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

Test cards: https://stripe.com/docs/testing

## Email Configuration

### SMTP Setup

The application sends emails for:
- Email verification
- Password reset
- Booking confirmations
- Payment confirmations

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MAIL_HOST` | SMTP server host | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP server port | `587` (TLS) or `465` (SSL) |
| `MAIL_USERNAME` | Email address | `your-email@gmail.com` |
| `MAIL_PASSWORD` | Email password or app password | `app-specific-password` |

#### Gmail Setup

1. **Enable 2-Factor Authentication**:
   - Go to Google Account → Security
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Go to Google Account → Security → App passwords
   - Create new app password for "Mail"
   - Copy the 16-character password

3. **Update .env**:
   ```properties
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=abcd efgh ijkl mnop
   ```

#### Other SMTP Providers

**SendGrid**:
```properties
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=your-sendgrid-api-key
```

**Mailgun**:
```properties
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USERNAME=postmaster@your-domain.mailgun.org
MAIL_PASSWORD=your-mailgun-password
```

**AWS SES**:
```properties
MAIL_HOST=email-smtp.us-east-1.amazonaws.com
MAIL_PORT=587
MAIL_USERNAME=your-ses-smtp-username
MAIL_PASSWORD=your-ses-smtp-password
```

## SMS Configuration

### Twilio Setup (Optional)

SMS functionality is optional and used for:
- Two-factor authentication (2FA) codes
- Booking notifications

#### Required Variables

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `TWILIO_ACCOUNT_SID` | Account SID | Twilio Console → Account Info |
| `TWILIO_AUTH_TOKEN` | Auth Token | Twilio Console → Account Info |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | Twilio Console → Phone Numbers |

#### Setup Steps

1. **Create Twilio Account**:
   - Sign up at https://www.twilio.com
   - Verify your account

2. **Get Credentials**:
   - Go to Twilio Console
   - Copy "Account SID" and "Auth Token"

3. **Get Phone Number**:
   - Go to Phone Numbers → Manage → Buy a number
   - Purchase a phone number with SMS capabilities

4. **Update .env**:
   ```properties
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

#### Skipping SMS

If you don't need SMS functionality, leave these empty:
```properties
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

The application will skip SMS-related features.

## Security Configuration

### JWT Configuration

JWT tokens are used for authentication.

#### Required Variables

| Variable | Description | Recommended Value |
|----------|-------------|-------------------|
| `JWT_SECRET_KEY` | Secret key for signing tokens | 256-bit random string (64 hex chars) |
| `JWT_EXPIRATION_MS` | Token expiration in milliseconds | `86400000` (24 hours) |

#### Generate JWT Secret

**Linux/Mac**:
```bash
openssl rand -hex 32
```

**Online Generator**:
- Visit https://www.random.org/strings/
- Generate a 64-character hexadecimal string

**Example**:
```properties
JWT_SECRET_KEY=5bbd61428183312fd0650d07de88dbd3b35aa6d6a91ee089ce3715e27844f78e
JWT_EXPIRATION_MS=86400000
```

#### Token Expiration Options

| Duration | Milliseconds | Use Case |
|----------|--------------|----------|
| 1 hour | 3600000 | High security |
| 24 hours | 86400000 | Standard (recommended) |
| 7 days | 604800000 | Long-lived sessions |
| 30 days | 2592000000 | Remember me |

## Development vs Production

### Development Environment

```properties
# Database - Local PostgreSQL
DB_URL=jdbc:postgresql://localhost:5432/dorna_adventure_db
DB_USERNAME=api_account
DB_PASSWORD=devpassword

# Stripe - Test Mode
STRIPE_API_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email - Development SMTP
MAIL_HOST=smtp.gmail.com
MAIL_USERNAME=dev-email@gmail.com

# JWT - Shorter expiration for testing
JWT_EXPIRATION_MS=3600000

# Show SQL queries
JPA_SHOW_SQL=true
```

### Production Environment

```properties
# Database - Managed PostgreSQL
DB_URL=jdbc:postgresql://prod-db-host.aws.com:5432/dorna_adventure_db
DB_USERNAME=prod_api_account
DB_PASSWORD=strong_production_password

# Stripe - Live Mode
STRIPE_API_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Email - Production SMTP (SendGrid, Mailgun, etc.)
MAIL_HOST=smtp.sendgrid.net
MAIL_USERNAME=apikey

# JWT - Standard expiration
JWT_EXPIRATION_MS=86400000

# Hide SQL queries
JPA_SHOW_SQL=false
```

### Environment-Specific Configuration

You can use Spring profiles for environment-specific settings:

1. Create `application-dev.properties` and `application-prod.properties`

2. Set active profile:
   ```bash
   # Development
   export SPRING_PROFILES_ACTIVE=dev

   # Production
   export SPRING_PROFILES_ACTIVE=prod
   ```

3. Run with profile:
   ```bash
   mvn spring-boot:run -Dspring-boot.run.profiles=prod
   ```

## Security Best Practices

1. **Never commit .env file**:
   - Already in `.gitignore`
   - Use `.env.example` as template (without real values)

2. **Use strong passwords**:
   - Database: At least 16 characters, mixed case, numbers, symbols
   - JWT Secret: 256-bit random string

3. **Rotate credentials regularly**:
   - Change database passwords quarterly
   - Rotate API keys if compromised

4. **Use environment-specific credentials**:
   - Different credentials for dev/staging/production
   - Never use production credentials in development

5. **Secure credential storage**:
   - Use secret management services in production (AWS Secrets Manager, Vault, etc.)
   - Never log sensitive credentials

6. **Limit permissions**:
   - Database user: Only necessary permissions
   - API keys: Minimum required scope

## Verification

After setting up your `.env` file, verify the configuration:

1. **Check file exists**:
   ```bash
   ls -la .env
   ```

2. **Run the application**:
   ```bash
   mvn spring-boot:run
   ```

3. **Check logs for successful connections**:
   - Database connection established
   - No credential errors

4. **Test endpoints**:
   ```bash
   curl http://localhost:8080/api/auth/health
   ```

## Troubleshooting

### Database Connection Issues

**Error**: `Connection refused`
- **Solution**: Ensure PostgreSQL is running: `sudo systemctl start postgresql`

**Error**: `Authentication failed`
- **Solution**: Verify `DB_USERNAME` and `DB_PASSWORD` are correct

**Error**: `Database does not exist`
- **Solution**: Create database: `createdb dorna_adventure_db`

### Email Issues

**Error**: `AuthenticationFailedException`
- **Solution**: Generate app-specific password for Gmail

**Error**: `Could not connect to SMTP host`
- **Solution**: Check `MAIL_HOST` and `MAIL_PORT`, ensure firewall allows outbound SMTP

### Stripe Issues

**Error**: `No API key provided`
- **Solution**: Set `STRIPE_API_KEY` in `.env`

**Error**: `Invalid API key`
- **Solution**: Verify you're using the correct test/live key

### Storage Issues

**Error**: `Access Denied`
- **Solution**: Check R2 API keys have correct permissions

**Error**: `Bucket not found`
- **Solution**: Verify `R2_BUCKET_NAME` matches your R2 bucket

## Support

For issues with:
- **Database**: Check PostgreSQL logs
- **Stripe**: Check Stripe Dashboard → Developers → Logs
- **Email**: Check SMTP provider logs
- **Application**: Check Spring Boot logs

---

For more information, see:
- [README.md](README.md) - Project overview
- [ARCHITECTURE.md](ARCHITECTURE.md) - Architecture details
