# Note Pilot an "LLM-powered" study dashboard.

![E2E Tests](https://github.com/NkaLight/Note_Pilot/actions/workflows/playwright.yml/badge.svg)

## Description:
Note pilot is a study dashboard focused on helping users learn faster and more efficiently using LLMs in a more safer and reliable manner. Unlike regular chatbot sessions, lecture pdfs are used to generate study content based on those specific lectures such as flash-cards, exam style questions, summaries etc. 




## Tech Stack
| Category | Tools |
| :--- | :--- |
| **Framework** | ![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) |
| **Language** | ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) |
| **Styling** | ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white) |
| **Database** | ![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white) ![Postgres](https://img.shields.io/badge/supabase-black.svg?style=for-the-badge&logo=supabase&logoColor=green) |
| **Deployment** | ![Vercel](https://img.shields.io/badge/vercel-black?style=for-the-badge&logo=vercel&logoColor=white) |


## Live Deployment
https://note-pilot-nu.vercel.app

## Core Features
- AI study content generation from uploaded lecture notes
- Secure authentication with dual token system (JWT + opaque token)
- Password reset with one-time cryptographic tokens via Mailjet
- E2E tested with Playwright against a containerized PostgreSQL.

## Testing
- E2E: Playwright with containerized database via Docker
- Unit: Jest

# Architecture

### Authentication & Authorization
Originally, the project utilized a simple HTTP-only cookie validated against the database on every request. To improve scalability and latency, the system uses a **Hybrid JWT Model**:
* **Access Token:** Short-lived JWT validated server-side for speed.
* **Refresh Token:** Long-lived token used to rotate access tokens, maintaining security without sacrificing user experience.

### Study Material generation
* **User uploads lecture pdf:** text data is extracted and stored in a relational database. This data is used as context when prompting the LLM, for the various features delivered.
