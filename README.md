# Voice Summarizer

This Expo React Native app records voice clips and summarizes them using a Whisper API. It also integrates Firebase Authentication for user accounts and manages a free trial of 30 recording minutes.

## Setup

1. **Install dependencies**
   ```sh
   npm install
   ```

2. **Configure environment variables**
   Set the following variables for Expo in `.env` or your shell before running the app. They are referenced in `app.config.js`.
   - `RUNPOD_ENDPOINT` – URL to the Whisper endpoint.
   - `RUNPOD_API_KEY` – API key for the endpoint.
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`

3. **Start the project**
   ```sh
   npm start
   ```

Expo will launch the development server where you can run the app on iOS, Android or the web.
