# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (runs on 0.0.0.0 with turbopack)
- **Build**: `npm run build`
- **Lint & Type check**: `npm run lint` (runs Biome lint + TypeScript check)
- **Format**: `npm run format` (Biome formatter)

## Architecture Overview

This is a Next.js 15 application using the App Router with TypeScript, designed for AI-powered image processing and IP character generation.

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **Linting**: Biome + ESLint
- **Development**: Stagewise toolbar integration

### Key Directories
- `src/app/`: Next.js App Router pages and layouts
- `src/components/`: Reusable React components (business logic + UI components)
- `src/lib/`: Utility functions and API integrations
- `public/`: Static assets (all image references are relative to public root)

### Core Functionality
- **AI API Integration**: Centralized in `src/lib/ai-api.ts` for IP character generation
- **Image Processing**: Handles file uploads, validation, and AI-powered transformations
- **Component Architecture**: Uses shadcn/ui base components with custom business components

## Development Guidelines

### Code Style
- Use TypeScript with strict type checking
- Follow Biome formatting rules (double quotes, 2-space indentation)
- UI components use Tailwind CSS + shadcn/ui
- All image assets in `public/` directory

### Project Rules (from rules.mdc.md)
- Record tasks in `todo.md` files within component directories
- Use Chinese/English comments for business logic
- Commit messages must clearly describe changes
- No sensitive information (API keys, tokens) in commits
- Branch strategy: feature/xxx, fix/xxx, refactor/xxx branches with PR reviews

### AI API Configuration
- API endpoint: `https://ismaque.org/v1/images/edits`
- Model: `gpt-image-1`
- Supports image-to-image generation with prompts
- Handles both File uploads and base64 strings