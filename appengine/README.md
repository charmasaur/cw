# Frontend

Flask server for the frontend (accepts crossword images, sends them to the backend for
extraction, then serves the crossword interface).

The Dockerfile encapsulates the main part of the server. It assumes access to environent variable
`FIREBASE_CONFIG` (a JSON string with the config dict to pass to `firebase.initializeApp`, more on
this below), and `PORT` (port on which the server will run).

The Firebase config should look something like:
```
{
  apiKey: "<API key>",
  authDomain: "<project>.firebaseapp.com",
  databaseURL: "https://<project>.firebaseio.com",
  projectId: "<project>",
  storageBucket: "<project>.appspot.com",
  messagingSenderId: "<id>"
}
```

To make auth work properly, you'll need a Firebase and Google Cloud project. In the Google Cloud
console, make sure that the API key is restricted to HTTP referrers "localhost",
"<project>.firebaseapp.com", and "<project>.herokuapp.com" (or wherever it's going to be hosted),
and that the only API in the API restrictions is the "Identity Toolkit API". In the Firebase
console, make sure "<project>.firebaseapp.com", "<project>.herokuapp.com" (or wherever it's going to
be hosted), and "localhost" are authorised domains in the "Authentication -> Sign-in method"
section.
