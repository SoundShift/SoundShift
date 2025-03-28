# 🎵 SoundShift

SoundShift is an intelligent music recommendation platform designed to enhance user
experience by leveraging user feedback for personalized music suggestions. Our system
integrates real time preference learning with temporal weighting to adapt recommendations
based on recent user interactions while also utilizing a direct feedback interface.

## 🚀 Features

- 🎵 Music recommendation
- ▶️ Stream music in-app
- 📁 Dynamic routing with Next.js
- 🎨 Responsive design with Tailwind CSS
- ☁️ Firebase integration (Auth, Firestore, and Hosting)

## 🛠 Tech Stack

- **Frontend Framework:** [Next.js](https://nextjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Authentication & Backend:** [Firebase](https://firebase.google.com/)
- **Language:** TypeScript

## 🧪 Getting Started

### 1. Clone the repo

   git clone https://github.com/SoundShift/SoundShift.git
   cd Soundshift

### 2. Install Dependencies

   ---

   Before running the project, install all required dependencies:

      npm install

   Additionally, navigate to the 'functions/' directory and install its dependencies:

      cd functions
      npm install

### 3. Local Development Setup

   ---

   Ensure you have Firebase CLI installed:

      npm install -g firebase-tools

   Then, log in to Firebase:

      firebase login

   This step is required to authenticate your local development environment.

### 4. Start the Next.js App

   ---

   In a new terminal window, navigate back to the root directory and run:

      npx next dev

### 5. Notes

   ---

   - If Firebase authentication issues occur, ensure you are logged in by running `firebase login`.
