const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordToggle = document.getElementById('passwordToggle');
const rememberMe = document.getElementById('rememberMe');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const passwordStrength = document.getElementById('passwordStrength');
const strengthProgress = document.getElementById('strengthProgress');
const strengthText = document.getElementById('strengthText');
const loginButton = document.getElementById('loginButton');
const signupButton = document.getElementById('signupButton');
const signupNameInput = document.getElementById('signupName');
const signupEmailInput = document.getElementById('signupEmail');
const signupPasswordInput = document.getElementById('signupPassword');
const signupConfirmPasswordInput = document.getElementById('signupConfirmPassword');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const registerText = document.getElementById('registerText');
const loginText = document.getElementById('loginText');
const toast = document.getElementById('toast');
const toastIcon = document.getElementById('toastIcon');
const toastTitle = document.getElementById('toastTitle');
const toastMessage = document.getElementById('toastMessage');
const toastClose = document.getElementById('toastClose');
const pageLoader = document.getElementById('pageLoader');
const forgotPassword = document.getElementById('forgotPassword');
const registerLink = document.getElementById('registerLink');
const loginLink = document.getElementById('loginLink');
const googleLogin = document.getElementById('googleLogin');
const facebookLogin = document.getElementById('facebookLogin');
const installAppButton = document.getElementById('installAppButton');
const isLocalFrontend = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_BASE = window.BITEORA_API_BASE || (isLocalFrontend && window.location.port !== '5000'
  ? 'http://127.0.0.1:5000'
  : '');
let deferredInstallPrompt = null;
let googleClientId = '';

window.addEventListener('load', () => {
  setTimeout(() => pageLoader && pageLoader.classList.add('hidden'), 800);
});

async function loadGoogleSignIn() {
  try {
    const response = await fetch(`${API_BASE}/api/google-config`);
    const config = await response.json();
    googleClientId = config.clientId || '';
    initializeGoogleButton();
  } catch (error) {
    googleClientId = '';
  }
}

loadGoogleSignIn();

function initializeGoogleButton() {
  if (!googleLogin || !googleClientId) {
    if (googleLogin) googleLogin.style.display = 'none';
    return;
  }

  const render = () => {
    if (!window.google?.accounts?.id) return false;

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredential
    });
    googleLogin.innerHTML = '';
    window.google.accounts.id.renderButton(googleLogin, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: 260
    });
    return true;
  };

  if (render()) return;
  const retry = window.setInterval(() => {
    if (render()) window.clearInterval(retry);
  }, 100);
  window.setTimeout(() => window.clearInterval(retry), 10000);
}

async function handleGoogleCredential({ credential }) {
  try {
    const response = await fetch(`${API_BASE}/api/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential })
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Google login failed.');

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', data.user.email);
    localStorage.setItem('userName', data.user.name || getNameFromEmail(data.user.email));
    window.location.href = 'dashboard.html';
  } catch (error) {
    showToast('Google login failed', error.message || 'Unable to sign in with Google.', '!');
  }
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  if (installAppButton) {
    installAppButton.textContent = 'Install App';
  }
});

if (installAppButton) {
  const apkDownloadUrl = installAppButton.dataset.downloadUrl || 'https://yourdomain.com/biteora.apk';

  installAppButton.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      installAppButton.textContent = 'Installed';
      return;
    }

    window.open(apkDownloadUrl, '_blank', 'noopener,noreferrer');
  });
}

function toggleAuthForm(mode) {
  const showLogin = mode === 'login';

  if (loginForm) loginForm.style.display = showLogin ? 'block' : 'none';
  if (signupForm) signupForm.style.display = showLogin ? 'none' : 'block';

  if (authTitle) authTitle.textContent = showLogin ? 'Welcome Back!' : 'Create Your Account';
  if (authSubtitle) authSubtitle.textContent = showLogin ? 'Sign in to continue ordering your favorite food.' : 'Join Biteora and start ordering delicious meals.';

  if (registerText) registerText.style.display = showLogin ? 'block' : 'none';
  if (loginText) loginText.style.display = showLogin ? 'none' : 'block';

  if (showLogin && emailInput) {
    emailInput.focus();
  }
  if (!showLogin && signupNameInput) {
    signupNameInput.focus();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  toggleAuthForm('login');

  const savedEmail = localStorage.getItem('userEmail');
  const demoEmail = 'admin@biteora.com';
  const demoPassword = 'admin123';

  if (emailInput) emailInput.value = savedEmail || demoEmail;
  if (passwordInput) passwordInput.value = savedEmail ? (localStorage.getItem('userPassword') || '') : demoPassword;
  if (rememberMe && localStorage.getItem('rememberMe') === 'true') {
    rememberMe.checked = true;
  }
});

if (passwordToggle) {
  passwordToggle.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    passwordToggle.textContent = isPassword ? '🙈' : '👁';
    passwordToggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
  });
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return password.length >= 6;
}

if (passwordInput) {
  passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    if (!password.length) {
      passwordStrength.style.display = 'none';
      strengthProgress.style.width = '0%';
      return;
    }

    passwordStrength.style.display = 'block';
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) {
      strengthProgress.style.width = '30%';
      strengthProgress.style.background = '#ff4d4d';
      strengthText.textContent = 'Weak password';
    } else if (strength <= 4) {
      strengthProgress.style.width = '65%';
      strengthProgress.style.background = '#ffae42';
      strengthText.textContent = 'Medium password';
    } else {
      strengthProgress.style.width = '100%';
      strengthProgress.style.background = '#42d982';
      strengthText.textContent = 'Strong password';
    }
  });
}

function clearErrors() {
  emailError.textContent = '';
  passwordError.textContent = '';
}

function getNameFromEmail(email) {
  const username = email.split('@')[0];
  if (!username) return 'Biteora User';
  return username.replace(/[._-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

let toastTimer;
function showToast(title, message, icon = '✓') {
  if (!toast) return;
  toastTitle.textContent = title;
  toastMessage.textContent = message;
  toastIcon.textContent = icon;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 4000);
}

if (toastClose) {
  toastClose.addEventListener('click', () => toast.classList.remove('show'));
}

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    let valid = true;

    if (!email) {
      emailError.textContent = 'Please enter your email address.';
      valid = false;
    } else if (!validateEmail(email)) {
      emailError.textContent = 'Please enter a valid email address.';
      valid = false;
    }

    if (!password) {
      passwordError.textContent = 'Please enter your password.';
      valid = false;
    } else if (!validatePassword(password)) {
      passwordError.textContent = 'Password must contain at least 6 characters.';
      valid = false;
    }

    if (!valid) {
      showToast('Error', 'Please correct the highlighted fields.', '!');
      return;
    }

    loginButton.disabled = true;
    loginButton.innerHTML = '<span>Signing in...</span><span>⏳</span>';

    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Login failed.');
      }

      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', data.user.name || getNameFromEmail(email));
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userPassword', password);
      if (rememberMe.checked) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }

      showToast('Welcome to Biteora!', 'Login successful. Opening your dashboard...', '✓');
      setTimeout(() => window.location.href = 'dashboard.html', 1000);
    } catch (error) {
      showToast('Login failed', error.message || 'Unable to sign in.', '!');
      if (emailError) emailError.textContent = 'Please use a valid account.';
    } finally {
      loginButton.disabled = false;
      loginButton.innerHTML = '<span>Login to Biteora</span><span class="button-arrow">→</span>';
    }
  });
}

if (forgotPassword) {
  forgotPassword.addEventListener('click', (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();

    if (!email) {
      showToast('Forgot Password', 'Enter your email address first.', '!');
      emailInput.focus();
      return;
    }

    if (!validateEmail(email)) {
      showToast('Invalid Email', 'Please enter a valid email address.', '!');
      emailInput.focus();
      return;
    }

    showToast('Password Reset', 'A reset link would be sent to your email.', '✓');
  });
}

if (registerLink) {
  registerLink.addEventListener('click', (event) => {
    event.preventDefault();
    toggleAuthForm('signup');
  });
}

if (loginLink) {
  loginLink.addEventListener('click', (event) => {
    event.preventDefault();
    toggleAuthForm('login');
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = signupNameInput.value.trim();
    const email = signupEmailInput.value.trim();
    const password = signupPasswordInput.value.trim();
    const confirmPassword = signupConfirmPasswordInput.value.trim();

    const nameError = document.getElementById('signupNameError');
    const emailErrorField = document.getElementById('signupEmailError');
    const passwordErrorField = document.getElementById('signupPasswordError');
    const confirmErrorField = document.getElementById('signupConfirmPasswordError');

    nameError.textContent = '';
    emailErrorField.textContent = '';
    passwordErrorField.textContent = '';
    confirmErrorField.textContent = '';

    let valid = true;

    if (!name || name.length < 2) {
      nameError.textContent = 'Please enter your full name.';
      valid = false;
    }

    if (!email) {
      emailErrorField.textContent = 'Please enter your email address.';
      valid = false;
    } else if (!validateEmail(email)) {
      emailErrorField.textContent = 'Please enter a valid email address.';
      valid = false;
    }

    if (!password) {
      passwordErrorField.textContent = 'Please create a password.';
      valid = false;
    } else if (!validatePassword(password)) {
      passwordErrorField.textContent = 'Password must contain at least 6 characters.';
      valid = false;
    }

    if (!confirmPassword) {
      confirmErrorField.textContent = 'Please confirm your password.';
      valid = false;
    } else if (password !== confirmPassword) {
      confirmErrorField.textContent = 'Passwords do not match.';
      valid = false;
    }

    if (!valid) {
      showToast('Sign up failed', 'Please correct the highlighted fields.', '!');
      return;
    }

    signupButton.disabled = true;
    signupButton.innerHTML = '<span>Creating account...</span><span>⏳</span>';

    try {
      const response = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Registration failed.');
      }

      signupForm.reset();
      emailInput.value = email;
      toggleAuthForm('login');
      showToast('Account created', 'You can now log in with your new account.', '✓');
    } catch (error) {
      showToast('Registration failed', error.message || 'Unable to create account.', '!');
      if (emailErrorField) emailErrorField.textContent = 'Please use a different email or try again.';
    } finally {
      signupButton.disabled = false;
      signupButton.innerHTML = '<span>Create Account</span><span class="button-arrow">→</span>';
    }
  });
}

if (googleLogin) {
  googleLogin.addEventListener('click', () => {
    if (!googleClientId) showToast('Google login unavailable', 'Google Client ID is not configured.', '!');
  });
}

if (facebookLogin) {
  facebookLogin.addEventListener('click', () => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', 'facebook@biteora.com');
    localStorage.setItem('userName', 'Facebook User');
    window.location.href = 'dashboard.html';
  });
}
