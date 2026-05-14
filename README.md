# Job Portal Backend (TopCV Clone)

A boilerplate for a Job Portal system built with NestJS, Prisma, and PostgreSQL, following Domain-Driven Design (DDD) and Clean Architecture principles.

## Features

- **Authentication**: JWT-based auth with Role-based Access Control (CANDIDATE, RECRUITER, ADMIN).
- **User Management**: Profile management and account status.
- **Job Management**: Create, list, update, and search jobs (Recruiters).
- **Applications**: Send applications with CVs and cover letters.
- **Bookmarks**: Bookmark jobs for later.
- **CV Management**: Manage personal CVs with Experience, Education, and Skills.

## Tech Stack

- **Framework**: [NestJS](https://nestjs.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: PostgreSQL
- **Architecture**: DDD & Clean Architecture
- **Documentation**: Swagger/OpenAPI

## Getting Started

### Prerequisites

- Node.js (v18+)
- Docker (optional, for DB)

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Setup `.env` file from `.env.example`
4. Run Prisma migrations: `npx prisma migrate dev`

### Running

```bash
# development
npm run start:dev

# production
npm run start:prod
```

### API Documentation

Go to `http://localhost:3000/api/v1/docs` after starting the server.

## Project Structure

```
src/
├── common/             # Shared utilities, decorators, guards, filters
├── infrastructure/     # Global infrastructure (Redis, Kafka - optional)
├── modules/
│   ├── auth/           # Authentication & Security
│   ├── user/           # User & Profile management
│   ├── job/            # Job postings & Search
│   ├── cv/             # CV management
│   ├── application/    # Job application process
│   └── bookmark/       # Job bookmarking
└── main.ts             # Application entry point
```

## License

MIT
