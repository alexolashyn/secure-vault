# Secure Vault

## Development

### Prerequisites
- Node.js 20.x
- npm

### Installation
```bash
npm install
```

### Running the application
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

### Testing
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

### Linting
```bash
npm run lint
```

## Git Hooks (Husky)

This project uses Husky for git hooks. The pre-commit hook runs:
- Linting (`npm run lint`)
- Tests (`npm test`)

The hooks are automatically installed when you run `npm install`.

## CI/CD

This project uses GitHub Actions for continuous integration. The CI workflow runs on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

The CI workflow:
- Checks out the code
- Sets up Node.js 20.x
- Installs dependencies
- Runs linter
- Runs tests
- Builds the project


### Environment Variables

Create a `.env` file in the root directory with your environment variables:

```env
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
MINIO_ENDPOINT=your_minio_endpoint
MINIO_ACCESS_KEY=your_minio_access_key
MINIO_SECRET_KEY=your_minio_secret_key
MINIO_BUCKET=your_bucket_name
```