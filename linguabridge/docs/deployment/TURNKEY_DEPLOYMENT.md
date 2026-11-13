# LinguaBridge deployment

For the current translation and extension setup, use [Full-page translation setup and release checklist](FULL_TRANSLATION_SETUP.md). It lists the required keys, services, build steps, extension reload steps, and remaining coverage work.

The root `vercel.json` builds the static Next.js web app only. The Fastify API runs on Railway using the workspace Dockerfile, and the optional Python voice inference service needs its own host and validated model files. The SQL migration creates database tables but the API's dynamically issued keys, quota, and translation cache state remains process-local; setting `DATABASE_URL` alone does not make the API horizontally scalable.
