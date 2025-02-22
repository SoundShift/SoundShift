Guide

1. Install Dependencies

---

Before running the project, install all required dependencies:

    npm install

Additionally, navigate to the 'functions/' directory and install its dependencies:

    cd functions
    npm install

2. Local Development Setup

---

Ensure you have Firebase CLI installed:

    npm install -g firebase-tools

Then, log in to Firebase:

    firebase login

This step is required to authenticate your local development environment.

5. Start the Next.js App

---

In a new terminal window, navigate back to the root directory and run:

    npx next dev

6. Notes

---

- If Firebase authentication issues occur, ensure you are logged in by running `firebase login`.
