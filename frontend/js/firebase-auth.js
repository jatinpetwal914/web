// Firebase Email/Password authentication for the login page
// IMPORTANT: Replace the firebaseConfig values with your project's config
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_PROJECT.firebaseapp.com",
  projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket: "REPLACE_WITH_YOUR_PROJECT.appspot.com",
  messagingSenderId: "REPLACE_WITH_SENDER_ID",
  appId: "REPLACE_WITH_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btnLogin');
const btnSignup = document.getElementById('btnSignup');
const authMessage = document.getElementById('authMessage');

function showMessage(msg, isError = false) {
  if (!authMessage) return;
  authMessage.textContent = msg;
  authMessage.style.color = isError ? '#b00020' : '#0b6623';
}

function setLoading(enabled) {
  if (btnLogin) btnLogin.disabled = enabled;
  if (btnSignup) btnSignup.disabled = enabled;
}

async function handleLogin() {
  const email = emailInput?.value?.trim();
  const password = passwordInput?.value ?? '';
  if (!email || !password) return showMessage('Please enter email and password', true);

  setLoading(true);
  showMessage('Signing in...');
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    showMessage('Login successful');
    // Optionally persist a token or user info for your app
    user.getIdToken().then((token) => {
      localStorage.setItem('firebaseToken', token);
      localStorage.setItem('user', JSON.stringify({ uid: user.uid, email: user.email }));
      setTimeout(() => (window.location.href = 'index.html'), 600);
    });
  } catch (err) {
    showMessage(err.message || 'Login failed', true);
    console.error('Login error', err);
  } finally {
    setLoading(false);
  }
}

async function handleSignup() {
  const email = emailInput?.value?.trim();
  const password = passwordInput?.value ?? '';
  if (!email || !password) return showMessage('Please enter email and password', true);
  if (password.length < 6) return showMessage('Password must be at least 6 characters', true);

  setLoading(true);
  showMessage('Creating account...');
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    showMessage('Signup successful — logged in');
    user.getIdToken().then((token) => {
      localStorage.setItem('firebaseToken', token);
      localStorage.setItem('user', JSON.stringify({ uid: user.uid, email: user.email }));
      setTimeout(() => (window.location.href = 'index.html'), 800);
    });
  } catch (err) {
    showMessage(err.message || 'Signup failed', true);
    console.error('Signup error', err);
  } finally {
    setLoading(false);
  }
}

if (btnLogin) btnLogin.addEventListener('click', handleLogin);
if (btnSignup) btnSignup.addEventListener('click', handleSignup);

// Optional: react to auth state changes (useful if user is already logged in)
auth.onAuthStateChanged((user) => {
  if (user) {
    // User is signed in — you can redirect if desired
    // console.log('User is signed in:', user.email);
  }
});
