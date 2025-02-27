# Job Search Agent

An intelligent automated system designed to monitor company career pages and notify users of relevant job opportunities in real-time.

## Features

- Automated job monitoring using AI-powered web navigation
- Real-time notifications via email, Slack, and more
- Customizable search profiles with flexible job title matching
- Smart duplicate detection and filtering
- Configurable notification preferences with quiet hours
- Modern, responsive web interface

## Prerequisites

- Node.js 18+
- PostgreSQL
- OpenAI API key (for intelligent job matching)

## Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/job-search-agent.git
cd job-search-agent
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your configuration values.

4. Set up the database:

```bash
npm run prisma:generate
npm run prisma:migrate
```

## Running the Application

1. Start the web application:

```bash
npm run dev
```

2. Start the job scanner service:

```bash
npm run scanner
```

## Development

- `npm run dev` - Start the development server
- `npm run build` - Build the production application
- `npm run start` - Start the production server
- `npm run lint` - Run linting
- `npm run prisma:studio` - Open Prisma Studio for database management

## Architecture

The application consists of several key components:

- Next.js web application for the user interface
- Job scanner service for monitoring career pages
- Prisma ORM for database management
- LangChain and Puppeteer for intelligent web navigation
- Notification service for multi-channel alerts

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
