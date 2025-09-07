// 1️⃣ Replace this with your Firebase web config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// 2️⃣ Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// 3️⃣ Email login
document.getElementById("emailSignIn").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;
      document.getElementById("status").innerText = `Signed in as ${user.email}`;
    })
    .catch(error => {
      document.getElementById("status").innerText = error.message;
    });
});

// 4️⃣ Email registration
document.getElementById("emailRegister").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;
      document.getElementById("status").innerText = `Registered as ${user.email}`;
    })
    .catch(error => {
      document.getElementById("status").innerText = error.message;
    });
});
