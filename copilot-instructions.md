# SEPMS Project Instructions

Welcome to the **Smart Entrepreneurial Pitching & Matching System (SEPMS)** project. This is an AI-enhanced platform connecting entrepreneurs with investors.

## Tech Stack

- **Monorepo Manager**: `pnpm` workspaces
- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui
- **Mobile**: Flutter
- **Backend (API)**: Node.js, Express, TypeScript
- **AI Service**: Python, FastAPI
- **Database**: MongoDB Atlas (Transactional + Vector Search)
- **Auth**: Firebase Authentication
- **Media Storage**: Cloudinary

## Project Structure

- `apps/api`: Express backend (TypeScript)
- `apps/web`: Next.js web application
- `apps/mobile`: Flutter mobile application
- `services/ai`: Python AI processing service
- `packages/shared-types`: Common TypeScript definitions
- `docs`: SRS and API documentation

## Coding Guidelines

- **Global Tooling**: We use **Biome** for linting and formatting across the entire project (root-level config).
- **TypeScript**: Prefer TypeScript for all web and API code.
- **Path Aliases**: Use `@/*` for absolute imports in `apps/web` and `apps/api`.
- **Git Hooks**: **Husky** and **lint-staged** are configured to run `biome check --write` on pre-commit.

## Commands

- `pnpm install`: Install dependencies for all workspaces.
- `pnpm dev`: Start core services (API and Web) concurrently.
- `pnpm dev:all`: Start API, Web, AI Service, and Mobile.
- `pnpm lint`: Run linting/formatting checks via Biome.

## AI Service Interop

The API (Node.js) communicates with the AI Service (Python/FastAPI) via internal REST calls for heavy tasks like OCR, generating embeddings, and quality classification.
