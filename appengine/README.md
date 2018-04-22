# App Engine frontend
App engine server for the frontend (accepts crossword images, sends them to the backend for
extraction, then serves the crossword interface).

You'll need to put Flask in a lib/ directory:
pip install -t lib flask

You can deploy using deploy.sh.

For a little bit of extra security I've left the "init_firebase.js" script out of the repo. It should be static/js/init_firebase.js, and look something like:
~~~~
var config = {
  apiKey: "<API key>",
  authDomain: "<project>.firebaseapp.com",
  databaseURL: "https://<project>.firebaseio.com",
  projectId: "<project>",
  storageBucket: "<project>.appspot.com",
  messagingSenderId: "<id>"
};
firebase.initializeApp(config);
~~~~
Also, in the app engine console make sure the API key is restricted to HTTP referrers "localhost" and "<project>.firebaseapp.com". In the firebase console make sure "<project>.firebaseapp.com", "<project>.appspot.com" and "localhost" are authorized domains in the "Authentication -> Sign-in method" section.
