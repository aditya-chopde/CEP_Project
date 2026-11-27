# Cyber Suraksha

Cyber Suraksha is a React/Vite frontend with an Express API for cyber-fraud
awareness, quizzes, helplines, and reporting.

## Deploy on Render

This repository includes a Render Blueprint in `render.yaml`, which deploys
the frontend and API together as one web service.

1. Push this repository to GitHub.
2. In Render, choose **New +** → **Blueprint**.
3. Connect GitHub and select `CEP_Project`.
4. Review the `cyber-suraksha` web service and choose **Apply**.
5. Wait for the deployment to finish, then open its `onrender.com` URL.

Render builds the Vite frontend and starts the Express server. The server serves
the frontend and API from the same origin. Render sets `NODE_ENV=production`;
no other environment variables are required for the single-service setup.

For local development, set `CLIENT_ORIGIN=http://localhost:5173` in
`Backend/server/.env` if needed, then run `npm --prefix Backend/server run dev`
and `npm --prefix frontend/client run dev` in separate terminals.
