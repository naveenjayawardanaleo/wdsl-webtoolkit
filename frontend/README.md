# WDSL WebToolkit Frontend

This directory contains a minimal React + Vite frontend for testing the WDSL WebToolkit backend.

## How to use

1. Install Node.js and npm if not already installed.
2. From this directory, run:
   ```bash
   npm install
   npm run dev
   ```
3. Open the local Vite URL shown in the terminal.

## What it does

- Displays a URL input form
- Sends the URL to `http://localhost:5000/api/analyze`
- Shows the JSON response from the backend

## Notes

- The backend should be running on `localhost:5000`
- If `npm` is unavailable, install Node.js from https://nodejs.org
