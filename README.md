# Note Pilot COSC345 project an interactive "LLM powererd" study dashboard.

## Description:
Note pilot is a study dashboard focused on helping users learn faster and more efficiently using LLMs in a more safer and reliable manner. Unlike regular chatbot sessions, we use lecture pdfs to generate study content based on those specific lectures such as flash-cards, exam style questions, summaries etc. 


## To run dev build
1. ```
    npm install 

2. ```
    npm run dev
    ```


## Tech Stack
| Category | Tools |
| :--- | :--- |
| **Framework** | ![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) |
| **Language** | ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) |
| **Styling** | ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white) |
| **Database** | ![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white) ![Postgres](https://img.shields.io/badge/supabase-black.svg?style=for-the-badge&logo=supabase&logoColor=green) |
| **Deployment** | ![Vercel](https://img.shields.io/badge/vercel-black?style=for-the-badge&logo=vercel&logoColor=white) |


# Architecture

### Authentication & Authorization
Originally, the project utilized a simple HTTP-only cookie validated against the database on every request. To improve scalability and latency, we transitioned to a **Hybrid JWT Model**:
* **Access Token:** Short-lived JWT validated server-side for speed.
* **Refresh Token:** Long-lived token used to rotate access tokens, maintaining security without sacrificing user experience.

### Study Material generation
* **User uploads lecture pdf:** text data is extracted and stored in a relational database. This data is used as context when prompting our LLMs, for the various features we delivered.
