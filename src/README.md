# Firebase Studio

This is a NextJS starter in Firebase Studio.

## Getting Started

To run the project locally, follow these steps.

### 1. Install Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

### 2. Set Up Firebase

This project uses Firebase for the database and other services.

1.  **Create a Firebase Project:** Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project (or use one you already have).
2.  **Create a Web App:** Inside your Firebase project, go to Project Settings (click the ⚙️ icon). In the "General" tab, under "Your apps", click the web icon (`</>`) to register a new web app.
3.  **Get Config Keys:** After registering, Firebase will show you a `firebaseConfig` object with your project's credentials. You'll need these keys.
4.  **Set Environment Variables:**
    *   Find the `.env` file in the project.
    *   Open the `.env` file and paste the values from your `firebaseConfig` object.

Your `.env` file should look something like this:

```
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
# ...and so on
```

### 3. Configure Firestore Rules

For development, you need to set rules that allow open access to your database. **This step is crucial for the app to work.**

1.  In the Firebase Console, go to **Build > Cloud Firestore**.
2.  Click the **"Rules"** tab.
3.  Replace the existing rules with the following:
    ```javascript
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Allow read and write access for development purposes.
        // WARNING: This is insecure and should not be used in production.
        match /{document=**} {
          allow read, write: if true;
        }
      }
    }
    ```
4.  Click **Publish**.

This rule allows anyone to read from or write to your database. This is necessary for development since authentication has been removed, but you **must** secure your database before going to production.

### 4. Run the Development Server

Now you're ready to start the app!

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) in your browser to see the result.
