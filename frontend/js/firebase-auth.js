// This file uses the compat (global) Firebase SDK loaded in the page.
// login.html loads firebase-app-compat.js and firebase-auth-compat.js, so use global `firebase`.
const firebaseConfig = {
  apiKey: "AIzaSyDzwO5jRLjcJ8ipb_3Elh6cJO6L_f-gMnI",
  authDomain: "website-2230b.firebaseapp.com",
  projectId: "website-2230b",
  storageBucket: "website-2230b.firebasestorage.app",
  messagingSenderId: "69779424762",
  appId: "1:69779424762:web:9ea398ff9920a0cfae9043",
  measurementId: "G-50S2F1KDS6"
};

if (!window.firebase) {
  console.error('Firebase SDK not found. Make sure compat scripts are loaded before this file.');
}

if (window.firebase && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

const API_URL = '/api/auth';
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
    // Try Firebase first
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    showMessage('Login successful');
    const token = await user.getIdToken();
    localStorage.setItem('firebaseToken', token);
    localStorage.setItem('user', JSON.stringify({ uid: user.uid, email: user.email }));
    setTimeout(() => (window.location.href = 'index.html'), 600);
    return;
  } catch (err) {
    console.warn('Firebase login failed, attempting server login...', err?.message || err);
    // Fall back to server login (for accounts created via site register)
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await (res.headers.get('content-type') || '').includes('application/json') ? await res.json() : { message: await res.text().catch(()=>null) };
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showMessage('Login successful');
        setTimeout(() => (window.location.href = 'index.html'), 400);
        return;
      } else {
        showMessage(data.message || 'Login failed', true);
        console.error('Server login failed', data);
      }
    } catch (srvErr) {
      showMessage(srvErr.message || 'Login failed', true);
      console.error('Server login error', srvErr);
    }
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
  // Prefer server-side registration to keep data in MySQL (register.html uses server register).
  try {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: email.split('@')[0], email, password })
    });
    const data = await (res.headers.get('content-type') || '').includes('application/json') ? await res.json() : { message: await res.text().catch(()=>null) };
    if (res.ok) {
      // Store server token and user
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showMessage('Signup successful — logged in');
      setTimeout(() => (window.location.href = 'index.html'), 800);
      return;
    } else {
      // If server fails, try Firebase create as fallback
      showMessage(data.message || 'Server signup failed, trying Firebase...', true);
      console.warn('Server signup failed, trying Firebase: ', data);
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      const token = await user.getIdToken();
      localStorage.setItem('firebaseToken', token);
      localStorage.setItem('user', JSON.stringify({ uid: user.uid, email: user.email }));
      showMessage('Signup successful (Firebase) — logged in');
      setTimeout(() => (window.location.href = 'index.html'), 800);
      return;
    }
  } catch (err) {
    showMessage(err.message || 'Signup failed', true);
    console.error('Signup error', err);
  } finally {
    setLoading(false);
  }
}

if (btnLogin) btnLogin.addEventListener('click', handleLogin);
if (btnSignup) btnSignup.addEventListener('click', handleSignup);

auth.onAuthStateChanged((user) => {
  if (user) {
    // User is signed in
  }
});
