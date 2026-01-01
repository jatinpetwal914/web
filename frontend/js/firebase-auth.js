// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDzwO5jRLjcJ8ipb_3Elh6cJO6L_f-gMnI",
  authDomain: "website-2230b.firebaseapp.com",
  projectId: "website-2230b",
  storageBucket: "website-2230b.firebasestorage.app",
  messagingSenderId: "69779424762",
  appId: "1:69779424762:web:9ea398ff9920a0cfae9043",
  measurementId: "G-50S2F1KDS6"
};

// Initialize Firebase
if (!window.firebase) {
  console.error('Firebase SDK not found. Make sure compat scripts are loaded before this file.');
} else if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const nameInput = document.getElementById('name'); // For registration
const btnLogin = document.getElementById('btnLogin');
const btnSignup = document.getElementById('btnSignup'); 
const btnReset = document.getElementById('btnReset'); // For password reset
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const authMessage = document.getElementById('authMessage');
const rememberMeCheckbox = document.getElementById('rememberMe');

// Validation Regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Helper: Show Message (plain text)
function showMessage(msg, isError = false) {
  if (!authMessage) {
      const form = document.querySelector('form');
      if(form) {
          let msgDiv = document.getElementById('authMessage');
          if(!msgDiv) {
              msgDiv = document.createElement('div');
              msgDiv.id = 'authMessage';
              msgDiv.style.marginTop = '12px';
              msgDiv.style.fontWeight = '600';
              form.appendChild(msgDiv);
          }
          msgDiv.textContent = msg;
          msgDiv.style.color = isError ? '#b00020' : '#0b6623';
      } else {
          alert(msg);
      }
      return;
  }
  authMessage.textContent = msg;
  authMessage.style.color = isError ? '#b00020' : '#0b6623';
}

// Helper: build direct link to Firebase Authentication settings for this project
function firebaseAuthConsoleLink() {
  const pid = (firebaseConfig && firebaseConfig.projectId) ? firebaseConfig.projectId : null;
  if (!pid) return 'https://console.firebase.google.com/';
  return `https://console.firebase.google.com/project/${pid}/authentication/settings`;
}

// Helper: Loading State
function setLoading(isLoading) {
  const btn = btnLogin || btnSignup || btnReset || document.querySelector('form button[type="submit"]');
  if (btn) {
    btn.disabled = isLoading;
    const originalText = btn.getAttribute('data-text') || btn.textContent;
    if(!btn.getAttribute('data-text')) btn.setAttribute('data-text', originalText);
    
    btn.textContent = isLoading ? 'Processing...' : btn.getAttribute('data-text');
    btn.style.opacity = isLoading ? '0.7' : '1';
    btn.style.cursor = isLoading ? 'not-allowed' : 'pointer';
  }
}

// Helper: Toggle Password Visibility
function setupPasswordToggle() {
    const passwordFields = document.querySelectorAll('input[type="password"]');
    passwordFields.forEach(input => {
        if (input.nextElementSibling && input.nextElementSibling.classList.contains('password-toggle')) return;

        const toggleBtn = document.createElement('i');
        toggleBtn.className = 'fa-solid fa-eye password-toggle';
        toggleBtn.style.position = 'absolute';
        toggleBtn.style.right = '15px';
        toggleBtn.style.top = '50%';
        toggleBtn.style.transform = 'translateY(-50%)';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.color = '#aaa';
        toggleBtn.style.zIndex = '10';

        input.parentElement.style.position = 'relative';
        input.parentElement.appendChild(toggleBtn);

        toggleBtn.addEventListener('click', () => {
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            toggleBtn.className = type === 'password' ? 'fa-solid fa-eye password-toggle' : 'fa-solid fa-eye-slash password-toggle';
        });
    });
}

// Password Strength Checker
function checkPasswordStrength(password) {
    let score = 0;
    let feedback = [];

    if (password.length >= 8) score++;
    else feedback.push("At least 8 chars");

    if (/[A-Z]/.test(password)) score++;
    else feedback.push("1 Uppercase");

    if (/[a-z]/.test(password)) score++;
    else feedback.push("1 Lowercase");

    if (/[0-9]/.test(password)) score++;
    else feedback.push("1 Number");

    if (/[@$!%*?&]/.test(password)) score++;
    else feedback.push("1 Special Char");

    return { score, feedback };
}

// Real-time Validation for Signup
function setupRealTimeValidation() {
    if (!passwordInput || !registerForm) return;

    if (!document.getElementById('password-strength-container')) {
        const container = document.createElement('div');
        container.id = 'password-strength-container';
        container.style.marginTop = '10px';
        container.style.fontSize = '0.85rem';
        
        const bars = document.createElement('div');
        bars.style.display = 'flex';
        bars.style.gap = '5px';
        bars.style.marginBottom = '5px';
        
        for (let i = 0; i < 5; i++) {
            const bar = document.createElement('div');
            bar.className = 'strength-bar';
            bar.style.height = '4px';
            bar.style.flex = '1';
            bar.style.backgroundColor = '#ddd';
            bar.style.borderRadius = '2px';
            bar.style.transition = 'background-color 0.3s';
            bars.appendChild(bar);
        }
        
        const text = document.createElement('div');
        text.id = 'password-feedback-text';
        text.style.color = '#666';

        container.appendChild(bars);
        container.appendChild(text);
        
        passwordInput.parentElement.after(container);
    }

    passwordInput.addEventListener('input', () => {
        const val = passwordInput.value;
        const result = checkPasswordStrength(val);
        const bars = document.querySelectorAll('.strength-bar');
        const text = document.getElementById('password-feedback-text');
        const btn = registerForm.querySelector('button[type="submit"]') || btnSignup;

        bars.forEach(bar => bar.style.backgroundColor = '#ddd');

        let color = '#ff4d4d'; // Red
        if (result.score >= 3) color = '#ffad33'; // Orange
        if (result.score === 5) color = '#28a745'; // Green

        for (let i = 0; i < result.score; i++) {
            bars[i].style.backgroundColor = color;
        }

        if (result.score < 5) {
            text.textContent = "Weak: " + result.feedback.join(", ");
            text.style.color = '#ff4d4d';
            if(btn) btn.disabled = true;
        } else {
            text.textContent = "Strong Password";
            text.style.color = '#28a745';
            if(btn) btn.disabled = false;
        }
    });
}

// --- Login Logic ---
async function handleLogin(e) {
    if(e) e.preventDefault();
    
    const email = emailInput?.value?.trim();
    const password = passwordInput?.value;
    const rememberMe = rememberMeCheckbox?.checked;

    if (!email || !password) return showMessage('Please enter both email and password', true);
    if (!emailRegex.test(email)) return showMessage('Please enter a valid email address', true);

    setLoading(true);
    showMessage('');

    try {
        // Set Persistence
        await auth.setPersistence(rememberMe ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION);

        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Check Email Verification
        if (!user.emailVerified) {
             showMessage('Please verify your email address. Check your inbox.', true);
             // Optionally resend verification email here if requested
             // await user.sendEmailVerification();
             auth.signOut();
             setLoading(false);
             return;
        }

        // Update Firestore Last Login
        await db.collection('users').doc(user.uid).update({
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(err => console.log('Firestore update error (likely ignored due to rules):', err));

        showMessage('Login successful! Redirecting...', false);
        
        // Store basic session info in LocalStorage for UI speed (optional, since Firebase handles it)
        localStorage.setItem('user', JSON.stringify({ 
            uid: user.uid, 
            email: user.email,
            displayName: user.displayName 
        }));
        // also store an id token for legacy API endpoints
        const idToken = await user.getIdToken();
        localStorage.setItem('token', idToken);

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);

    } catch (error) {
        console.error("Login Error:", error);
        let msg = "Login failed. Please try again.";
        switch (error.code) {
            case 'auth/invalid-email': msg = "Invalid email address."; break;
            case 'auth/user-disabled': msg = "This account has been disabled."; break;
            case 'auth/user-not-found': msg = "No account found with this email."; break;
            case 'auth/wrong-password': msg = "Incorrect password."; break;
            case 'auth/too-many-requests': msg = "Too many failed attempts. Try again later."; break;
        }
        showMessage(msg, true);
        setLoading(false);
    }
}
// Handle common sign-in finalization steps for a user object
async function handleSignInResult(user) {
    if (!user) return;
    try {
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            await userRef.set({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                role: 'user',
                status: 'active'
            });
        } else {
            await userRef.update({ lastLogin: firebase.firestore.FieldValue.serverTimestamp() }).catch(()=>{});
        }

        const idToken = await user.getIdToken();
        localStorage.setItem('token', idToken);
        localStorage.setItem('user', JSON.stringify({ uid: user.uid, email: user.email, displayName: user.displayName }));

        showMessage('Login successful! Redirecting...', false);
        setTimeout(() => { window.location.href = 'index.html'; }, 900);
    } catch (e) {
        console.error('Error finalizing sign-in:', e);
        showMessage('Sign-in succeeded but finalizing user failed. Try reloading.', true);
    }
}

// Sign in with Google (popup preferred; falls back to redirect when necessary)
async function handleGoogleSignIn(e) {
    if (e) e.preventDefault();
    const btn = document.getElementById('btnGoogle');
    if (btn) { btn.disabled = true; btn.style.opacity = 0.7; }
    setLoading(true);
    showMessage('');

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    try {
        // Try popup first (better UX). If popup fails due to environment, try redirect.
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        await handleSignInResult(user);
        return;
    } catch (err) {
        console.warn('Popup sign-in failed, attempting redirect if appropriate:', err);
        // Handle known popup errors
        if (err && (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request')) {
            // User closed popup; inform and stop
            let msg = 'Sign-in popup was closed.';
            if (err.code === 'auth/popup-blocked') msg = 'Popup blocked by browser. Try allowing popups or use Sign in with Google again (redirect).';
            showMessage(msg, true);
            return;
        }

        // If operation not supported or environment blocks popups, fallback to redirect
        if (err && (err.code === 'auth/operation-not-supported-in-this-environment' || err.code === 'auth/internal-error')) {
            try {
                showMessage('Redirecting to Google sign-in...', false);
                await auth.signInWithRedirect(provider);
                return;
            } catch (rErr) {
                console.error('Redirect sign-in failed:', rErr);
                let msg = 'Google sign-in failed. Please check your network or try again.';
                if (rErr && rErr.code === 'auth/unauthorized-domain') {
                    const host = window.location.host || window.location.hostname;
                    msg = `This domain (${host}) is not authorized for OAuth. Add it to Firebase Console > Authentication > Authorized domains: ${firebaseAuthConsoleLink()}`;
                }
                if (rErr && rErr.code === 'auth/operation-not-allowed') msg = 'Google sign-in not enabled in Firebase Console. Enable the Google provider under Authentication.';
                showMessage(msg, true);
                return;
            }
        }

        // Unauthorized domain (developer configuration issue) or other failures
        if (err && err.code === 'auth/unauthorized-domain') {
            const host = window.location.host || window.location.hostname;
            showMessage(`This domain (${host}) is not authorized for OAuth operations. Add it under Authentication → Authorized domains in Firebase Console: ${firebaseAuthConsoleLink()}`, true);
            return;
        }

        if (err && err.code === 'auth/operation-not-allowed') {
            showMessage('Google sign-in is not enabled for this Firebase project. Enable it in Firebase Console > Authentication > Sign-in method.', true);
            return;
        }

        // Generic fallback message
        console.error('Unhandled Google sign-in error:', err);
        showMessage('Google sign-in failed. Please try again or use email/password.', true);
    } finally {
        if (btn) { btn.disabled = false; btn.style.opacity = 1; }
        setLoading(false);
    }
}
// --- Signup Logic ---
async function handleSignup(e) {
    if(e) e.preventDefault();

    const email = emailInput?.value?.trim();
    const password = passwordInput?.value;
    const name = nameInput?.value?.trim();

    if (!email || !password || !name) return showMessage('All fields are required', true);
    if (!emailRegex.test(email)) return showMessage('Invalid email format', true);
    
    const strength = checkPasswordStrength(password);
    if (strength.score < 5) {
        return showMessage('Password is not strong enough.', true);
    }

    setLoading(true);
    showMessage('Creating your account...', false);

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Update Profile
        await user.updateProfile({ displayName: name });

        // Create Firestore User Document
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: user.email,
            displayName: name,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            role: 'user', // Default role
            status: 'active'
        });

        // Send Verification Email
        await user.sendEmailVerification();

        showMessage('Account created! Please verify your email before logging in.', false);
        
        // Sign out immediately so they can't access until verified
        await auth.signOut();

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);

    } catch (error) {
        console.error("Signup Error:", error);
        let msg = "Registration failed.";
        switch (error.code) {
            case 'auth/email-already-in-use': msg = "Email is already registered. Please login."; break;
            case 'auth/invalid-email': msg = "Invalid email address."; break;
            case 'auth/weak-password': msg = "Password is too weak."; break;
        }
        showMessage(msg, true);
        setLoading(false);
    }
}

// --- Forgot Password Logic ---
async function handleForgotPassword(e) {
    if(e) e.preventDefault();
    
    const email = emailInput?.value?.trim();
    if (!email || !emailRegex.test(email)) return showMessage('Please enter a valid email address', true);

    setLoading(true);
    showMessage('Sending reset link...', false);

    try {
        await auth.sendPasswordResetEmail(email);
        showMessage('Password reset email sent! Check your inbox.', false);
        emailInput.value = '';
    } catch (error) {
        console.error("Reset Error:", error);
        let msg = "Failed to send reset email.";
        if (error.code === 'auth/user-not-found') msg = "No account found with this email.";
        showMessage(msg, true);
    } finally {
        setLoading(false);
    }
}

// --- Logout Logic ---
function logout() {
    auth.signOut().then(() => {
        localStorage.removeItem('user'); // Clear UI cache
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error('Logout error:', error);
    });
}

// Initialize based on page
document.addEventListener('DOMContentLoaded', () => {
    setupPasswordToggle();

    // Login Page
    if (loginForm) {
        btnLogin?.addEventListener('click', handleLogin);
        btnGoogle?.addEventListener('click', handleGoogleSignIn);

        // Process redirect result (if using signInWithRedirect previously)
        auth.getRedirectResult().then(result => {
            if (result && result.user) {
                // finalize sign-in
                handleSignInResult(result.user);
            }
        }).catch(err => {
            console.warn('Redirect sign-in result error:', err);
            if (err && err.code === 'auth/unauthorized-domain') {
                showMessage('Google sign-in not allowed from this domain. Add this domain to Firebase Console > Authentication > Authorized domains.', true);
            }
            if (err && err.code === 'auth/operation-not-allowed') {
                showMessage('Google sign-in is not enabled for this Firebase project. Enable it in Firebase Console > Authentication > Sign-in method.', true);
            }
        });

        // Real-time validation for Login
        const validateLoginInput = () => {
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const isValid = email && password && emailRegex.test(email);
            if (btnLogin) {
                btnLogin.disabled = !isValid;
                btnLogin.style.opacity = isValid ? '1' : '0.7';
                btnLogin.style.cursor = isValid ? 'pointer' : 'not-allowed';
            }
        };

        emailInput.addEventListener('input', validateLoginInput);
        passwordInput.addEventListener('input', validateLoginInput);
        validateLoginInput();
    }

    // Register Page
    if (registerForm) {
        setupRealTimeValidation();
        registerForm.addEventListener('submit', handleSignup);
    }

    // Forgot Password Page
    if (forgotPasswordForm) {
        btnReset?.addEventListener('click', handleForgotPassword);
    }
});

// Keep id token updated locally for legacy backend compatibility
auth.onIdTokenChanged(async (user) => {
    if (user) {
        const t = await user.getIdToken();
        localStorage.setItem('token', t);
    } else {
        localStorage.removeItem('token');
    }
});

// Expose logout to window
window.logout = logout;
