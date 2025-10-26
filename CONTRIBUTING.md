# Contributing to Pricy

Thank you for your interest in contributing to Pricy! This document provides guidelines and instructions for contributing.

## License

This project is licensed under **AGPL-3.0**. By contributing, you agree that your contributions will be licensed under the same license.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain a positive community

## Getting Started

### Prerequisites

- Node.js 24.10.0 or higher
- pnpm 10.19.0 or higher
- Docker and Docker Compose
- Git

### Development Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/Pricey.git
cd Pricey
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

4. **Start infrastructure services**

```bash
pnpm docker:dev
```

5. **Run database migrations**

```bash
pnpm db:migrate
pnpm db:seed
```

6. **Start development servers**

```bash
pnpm dev
```

## Development Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

Example: `feature/receipt-upload`, `fix/ocr-parsing`

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Test additions/updates
- `chore:` - Build process or auxiliary tool changes

Example:

```
feat(api): add receipt upload endpoint
fix(ocr): improve text extraction accuracy
docs(readme): update installation instructions
```

### Code Style

- **TypeScript**: Use strict mode, avoid `any`
- **Formatting**: We use Prettier - run `pnpm format` before committing
- **Linting**: We use ESLint - run `pnpm lint` before committing
- **Type Safety**: Run `pnpm typecheck` to verify TypeScript types

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @pricy/api-gateway build
```

## Pull Request Process

1. **Create a feature branch** from `develop`

```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**
   - Write clear, concise code
   - Add tests for new functionality
   - Update documentation as needed
   - Ensure all tests pass
   - Follow the code style guidelines

3. **Commit your changes**

```bash
git add .
git commit -m "feat: add your feature"
```

4. **Push to your fork**

```bash
git push origin feature/your-feature-name
```

5. **Open a Pull Request**
   - Use a clear title and description
   - Reference any related issues
   - Ensure CI checks pass
   - Request review from maintainers

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] No merge conflicts
- [ ] CI checks passing

## Project Structure

```
Pricy/
├── apps/
│   ├── api-gateway/    # Fastify API
│   └── web/            # Next.js frontend (Phase 1)
├── packages/
│   ├── database/       # Prisma schema & client
│   ├── types/          # Shared TypeScript types
│   ├── ui/             # Shared UI components
│   └── config/         # Shared configurations
├── docker/             # Docker configurations
└── docs/               # Documentation
```

## Working with the Monorepo

### Installing Dependencies

```bash
# Install all dependencies
pnpm install

# Install for specific workspace
pnpm --filter @pricy/api-gateway add fastify
```

### Running Commands

```bash
# Run dev for all apps
pnpm dev

# Run dev for specific app
pnpm --filter @pricy/api-gateway dev

# Run command in all workspaces
pnpm -r exec <command>
```

### Database Changes

```bash
# Create a new migration
pnpm db:migrate

# Reset database
pnpm db:reset

# Open Prisma Studio
pnpm db:studio
```

## AGPL-3.0 Compliance

- **All source files** must include the AGPL-3.0 header
- **Network services** must provide source code access
- **Modifications** must remain open source
- See [LICENSE.md](LICENSE.md) for full terms

### Required Header

Add this to the top of every source file:

```typescript
/**
 * [File description]
 * Copyright (C) 2025 Matthias Wallner-Géhri
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
```

## Getting Help

- **Documentation**: Check the [docs](docs/) folder
- **Issues**: Search existing issues or open a new one
- **Discussions**: Use GitHub Discussions for questions

## Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to Pricy! 🎉
