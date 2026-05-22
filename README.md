# Note Pilot an "LLM-powered" study dashboard.

![E2E Tests](https://github.com/NkaLight/Note_Pilot/actions/workflows/playwright.yml/badge.svg)

## Description:
Note pilot is a study dashboard focused on helping users learn faster and more efficiently using LLMs in a reliable manner. Unlike regular chatbot sessions, lecture pdfs are used to generate study content based on those specific lectures such as flash-cards, exam style questions, summaries etc. 




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
The application consists of a number of moving parts:
- **Next.js** application hosted on Vercel
- **Python microservice** hosted on HuggingFace Space
  - Python microservice performs the pdf-to-text extraction(the fastest of all the libs), chunking and vectorization on upload pdf and user query. Before I used AWS ECS so I can say I used AWS but then AWS charged me $0.2 last month so I switched to this free service.
- **Embedding model** hosted on the google servers AI-studio
  - Vectorizes the chunks.
- **LLM reflex agent** hosted on OpenRouter.(OpenRouter picks and chooses whichever model to use)
  - Consumes the built prompt with all the necessary context and returns text data to be rendered by Next.js application.

The application is designed to be as agnostic as possible as to which LLM is used as for my use case the value of how good the model performs is more tied to prompting techniques and RAG strategies.    


### Current major limitation
I have setup configs for getting a simple RAG setup working which you can test on the application hosted [here](https://note-pilot-nu.vercel.app). Whilst I have moved from naive context fetching directly from user input to Hypothetical Document Embeddings **I still lack an empirical evaluation framework**. Upstream adjustments (like switching to HyDE, decreasing/increasing vector dimensions, switching to dynamic chunking based on lecture sections) are all currently **guided by theoretical benchmarks from literature** rather than **deterministic, project-specific metrics**.

The **GOAL** now is to integrate an evaluation framework (such as RAGAS, TruLens or establish my own) to quantitatively measure context precision, context recall, and faithfulness against user queries.