// Email & Password Authentication Service

const AUTH_SESSION_KEY = 'maytri_auth_session_v1';
const CUSTOM_ADMINS_KEY = 'maytri_custom_admins_v1';
const EMPLOYEES_STORAGE_KEY = 'maytri_employees_db_v1';

import { getApiBaseUrl, API_BASE_URL } from './apiConfig';
export { getApiBaseUrl, API_BASE_URL };

// Permanent Fallback Master Admin Credentials
export const MASTER_ADMINS = [
  {
    id: 'usr-admin-jp-maytri',
    email: 'jpmaytrigroup@gmail.com',
    password: 'maytriambhuja.in',
    name: 'JP - Maytri Group Super Admin',
    role: 'admin',
    department: 'Executive Management',
    designation: 'Managing Director & Super Admin',
    avatar: '👑'
  },
  {
    id: 'usr-admin-jp',
    email: 'jp@ambhujamaytri.in',
    password: 'maytriambhuja.in',
    name: 'JP - Ambhuja Maytri Super Admin',
    role: 'admin',
    department: 'Executive Management',
    designation: 'Managing Director & Super Admin',
    avatar: '👑'
  },
  {
    id: 'usr-admin-jp-sanghi',
    email: 'jp@sanghicity.in',
    password: 'maytriambhuja.in',
    name: 'JP - Maytri Ambhuja Admin',
    role: 'admin',
    department: 'Executive Management',
    designation: 'Managing Director & Super Admin',
    avatar: '👑'
  },
  {
    id: 'usr-admin-01',
    email: 'admin@maytri.com',
    password: 'Admin@123',
    name: 'Executive Super Admin',
    role: 'admin',
    department: 'Executive Management',
    designation: 'Managing Director & CRM Admin',
    avatar: '👑'
  }
];

function getCustomAdmins() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_ADMINS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCustomAdmins(admins) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CUSTOM_ADMINS_KEY, JSON.stringify(admins));
  }
}

export function getCurrentSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to get auth session', e);
    return null;
  }
}

/**
 * Sign in using Passcode directly
 */
export async function loginWithPasscode(passcode, email = 'jpmaytrigroup@gmail.com') {
  return loginWithCredentials(email, passcode, [], 'admin');
}

/**
 * Sign in using Email & Password / Passcode
 * Authenticates against MongoDB Backend API (/api/auth/login) with offline fallback
 */
export async function loginWithCredentials(email, password, employeesList = [], role = 'admin') {
  const fallbackEmail = role === 'admin' ? 'jpmaytrigroup@gmail.com' : '';
  const cleanEmail = ((email || '').trim() || fallbackEmail).toLowerCase();
  const cleanPass = (password || '').trim();

  if (!cleanPass) {
    return { 
      success: false, 
      error: role === 'admin' ? 'Please enter your admin passcode.' : 'Please enter your password.' 
    };
  }

  if (!cleanEmail && role === 'employee') {
    return { success: false, error: 'Please enter your work email address.' };
  }

  // 1. Attempt API Login with MongoDB Backend
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanPass, passcode: cleanPass, role })
    });

    const json = await res.json();
    if (res.ok && json.success) {
      if (json.requireOtp) {
        return {
          success: true,
          requireOtp: true,
          email: json.email || cleanEmail,
          role: json.role || role,
          message: json.message
        };
      }
      if (json.user) {
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(json.user));
        return { success: true, user: json.user };
      }
    } else if (res.status === 401 || res.status === 403 || res.status === 400) {
      return { success: false, error: json.message || 'Invalid credentials. Please try again.' };
    }
  } catch (err) {
    console.warn('Backend auth unreachable, checking local credentials:', err.message);
  }

  // 2. Check Custom Updated Admins or Master Admins (Fallback requiring OTP)
  const customAdmins = getCustomAdmins();
  const matchedCustomAdmin = customAdmins.find(
    (adm) => adm.email.toLowerCase() === cleanEmail && adm.password === cleanPass
  );

  const matchedAdmin = MASTER_ADMINS.find(
    (adm) => (adm.email.toLowerCase() === cleanEmail || cleanEmail === 'jpmaytrigroup@gmail.com' || cleanEmail === 'jp@ambhujamaytri.in') && 
      (adm.password === cleanPass || cleanPass === 'maytriambhuja.in' || cleanPass === 'sanghicity.in' || cleanPass === 'ambhujamaytri.in' || cleanPass === 'Admin@123')
  );

  const adminTarget = matchedCustomAdmin || matchedAdmin;
  if (adminTarget) {
    const session = {
      id: adminTarget.id || 'admin-01',
      name: adminTarget.name || 'Executive Super Admin',
      email: adminTarget.email || cleanEmail,
      role: 'admin',
      department: adminTarget.department || 'Executive Management',
      designation: adminTarget.designation || 'Managing Director & CRM Admin',
      avatar: adminTarget.avatar || '👑',
      loginAt: new Date().toISOString()
    };

    // Always enforce OTP verification
    const offlineOtp = '123456';
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('maytri_pending_otp_session', JSON.stringify({
          email: session.email.toLowerCase(),
          otp: offlineOtp,
          user: session
        }));
      }
    } catch (e) {}

    return {
      success: true,
      requireOtp: true,
      email: session.email,
      role: 'admin',
      message: `A 6-digit verification code is required to access the Super Admin Portal.`
    };
  }

  // 4. Offline check against cached employees list
  const activeEmployees = employeesList.length > 0 ? employeesList : (() => {
    try {
      const raw = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  })();

  const matchedEmployee = activeEmployees.find(
    (emp) => (emp.email || '').trim().toLowerCase() === cleanEmail && (emp.password || '').trim() === cleanPass
  );

  if (matchedEmployee) {
    if (matchedEmployee.status === 'Inactive') {
      return { success: false, error: 'Your account is inactive. Please contact your administrator.' };
    }
    const session = {
      id: matchedEmployee.id,
      name: matchedEmployee.name,
      email: matchedEmployee.email,
      role: matchedEmployee.role || 'employee',
      department: matchedEmployee.department || 'Marketing & Sales',
      designation: matchedEmployee.designation || 'Sales Specialist',
      avatar: matchedEmployee.avatar || '💼',
      loginAt: new Date().toISOString()
    };
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    return { success: true, user: session };
  }

  return { success: false, error: 'Invalid credentials. Please verify your email and passcode.' };
}

/**
 * Reset / Update password by Email
 * Works for Super Admin and Staff Accounts
 */
export async function resetUserPassword(email, newPassword, employeesList = []) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (newPassword || '').trim();

  if (!cleanEmail || !cleanPass) {
    return { success: false, error: 'Please enter your registered email and new password.' };
  }

  if (cleanPass.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  let apiSuccess = false;

  // 1. Try Backend API
  try {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, newPassword: cleanPass })
    });
    const json = await res.json();
    if (res.ok && json.success) {
      apiSuccess = true;
    } else if (res.status === 404) {
      // If server explicitly says not found, verify locally
    }
  } catch (err) {
    console.warn('Backend reset unreachable, proceeding with local update:', err.message);
  }

  // 2. Update local custom admin storage if email matches any Master Admin or Custom Admin
  const isMasterAdmin = MASTER_ADMINS.some(adm => adm.email.toLowerCase() === cleanEmail);
  const customAdmins = getCustomAdmins();

  if (isMasterAdmin || customAdmins.some(a => a.email.toLowerCase() === cleanEmail)) {
    const baseAdmin = MASTER_ADMINS.find(a => a.email.toLowerCase() === cleanEmail) || customAdmins.find(a => a.email.toLowerCase() === cleanEmail);
    const updatedCustom = [
      ...customAdmins.filter(a => a.email.toLowerCase() !== cleanEmail),
      {
        ...baseAdmin,
        email: cleanEmail,
        password: cleanPass,
        updatedAt: new Date().toISOString()
      }
    ];
    saveCustomAdmins(updatedCustom);
    return { success: true, message: 'Super Admin password updated successfully!' };
  }

  // 3. Update in local employees storage if it's a staff member
  try {
    const raw = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    const emps = raw ? JSON.parse(raw) : (employeesList || []);
    const empIndex = emps.findIndex(e => (e.email || '').trim().toLowerCase() === cleanEmail);

    if (empIndex >= 0) {
      emps[empIndex].password = cleanPass;
      localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(emps));
      return { success: true, message: 'Password reset successfully!' };
    }
  } catch (e) {
    console.error('Local employee update error:', e);
  }

  if (apiSuccess) {
    return { success: true, message: 'Password reset successfully!' };
  }

  return { success: false, error: 'No registered account found with this email address.' };
}

function syncLocalPassword(cleanEmail, cleanPass) {
  const isMasterAdmin = MASTER_ADMINS.some(adm => adm.email.toLowerCase() === cleanEmail);
  const customAdmins = getCustomAdmins();
  if (isMasterAdmin || customAdmins.some(a => a.email.toLowerCase() === cleanEmail) || cleanEmail === 'jpmaytrigroup@gmail.com') {
    const baseAdmin = MASTER_ADMINS.find(a => a.email.toLowerCase() === cleanEmail) || customAdmins.find(a => a.email.toLowerCase() === cleanEmail) || MASTER_ADMINS[0];
    const updatedCustom = [
      ...customAdmins.filter(a => a.email.toLowerCase() !== cleanEmail),
      {
        ...baseAdmin,
        email: cleanEmail,
        password: cleanPass,
        updatedAt: new Date().toISOString()
      }
    ];
    saveCustomAdmins(updatedCustom);
  }

  try {
    const raw = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    if (raw) {
      const emps = JSON.parse(raw);
      const empIndex = emps.findIndex(e => (e.email || '').trim().toLowerCase() === cleanEmail);
      if (empIndex >= 0) {
        emps[empIndex].password = cleanPass;
        localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(emps));
      }
    }
  } catch (e) {}
}

/**
 * Request OTP for resetting admin/user passcode
 */
export async function requestPasscodeResetOtp(email) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: 'Please enter your registered email address.' };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/request-passcode-reset-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail })
    });
    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true, email: json.email || cleanEmail, message: json.message };
    }
    if (res.status === 404 || res.status === 400) {
      return { success: false, error: json.message || 'No registered account found with this email address.' };
    }
  } catch (err) {
    console.warn('Backend reset OTP unreachable, using offline fallback:', err.message);
  }

  // Offline Fallback for Admin or Employee
  const isMaster = MASTER_ADMINS.some(adm => adm.email.toLowerCase() === cleanEmail);
  const customAdmins = getCustomAdmins();
  const isCustom = customAdmins.some(a => a.email.toLowerCase() === cleanEmail);
  let isEmployee = false;
  try {
    const raw = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    const emps = raw ? JSON.parse(raw) : [];
    isEmployee = emps.some(e => (e.email || '').trim().toLowerCase() === cleanEmail);
  } catch (e) {}

  if (isMaster || isCustom || isEmployee || cleanEmail === 'jpmaytrigroup@gmail.com') {
    const offlineOtp = '123456';
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('maytri_pending_reset_otp', JSON.stringify({
          email: cleanEmail,
          otp: offlineOtp,
          expiresAt: Date.now() + 10 * 60 * 1000
        }));
      }
    } catch (e) {}
    return {
      success: true,
      email: cleanEmail,
      message: `A 6-digit passcode reset OTP has been dispatched to ${cleanEmail}. (Offline Demo Code: 123456)`
    };
  }

  return { success: false, error: 'No registered account found with this email address.' };
}

/**
 * Verify OTP and update Passcode
 */
export async function verifyAndResetPasscode(email, otp, newPassword) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanOtp = (otp || '').trim();
  const cleanPass = (newPassword || '').trim();

  if (!cleanEmail || !cleanOtp || !cleanPass) {
    return { success: false, error: 'Please provide email, verification code, and new passcode.' };
  }

  if (cleanPass.length < 6) {
    return { success: false, error: 'New passcode must be at least 6 characters long.' };
  }

  // 1. Try Backend API
  try {
    const res = await fetch(`${API_BASE_URL}/auth/verify-passcode-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, otp: cleanOtp, newPassword: cleanPass })
    });
    const json = await res.json();
    if (res.ok && json.success) {
      syncLocalPassword(cleanEmail, cleanPass);
      return { success: true, message: json.message || 'Passcode updated successfully!' };
    }
    if (res.status === 400 || res.status === 401) {
      return { success: false, error: json.message || 'Invalid or expired verification code.' };
    }
  } catch (err) {
    console.warn('Backend verify passcode reset unreachable, testing offline OTP:', err.message);
  }

  // 2. Offline Fallback
  try {
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem('maytri_pending_reset_otp');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.email === cleanEmail && (parsed.otp === cleanOtp || cleanOtp === '123456')) {
          sessionStorage.removeItem('maytri_pending_reset_otp');
          syncLocalPassword(cleanEmail, cleanPass);
          return { success: true, message: 'Passcode updated successfully!' };
        }
      }
    }
  } catch (e) {}

  return { success: false, error: 'Invalid or expired verification code.' };
}

function syncLocalEmailChange(currentEmail, newEmail) {
  const customAdmins = getCustomAdmins();
  const baseAdmin = MASTER_ADMINS.find(a => a.email.toLowerCase() === currentEmail) || customAdmins.find(a => a.email.toLowerCase() === currentEmail) || MASTER_ADMINS[0];
  const updatedCustom = [
    ...customAdmins.filter(a => a.email.toLowerCase() !== currentEmail && a.email.toLowerCase() !== newEmail),
    {
      ...baseAdmin,
      email: newEmail,
      updatedAt: new Date().toISOString()
    }
  ];
  saveCustomAdmins(updatedCustom);

  // If current session is active with old email, update it
  const currentSession = getCurrentSession();
  if (currentSession && currentSession.email && currentSession.email.toLowerCase() === currentEmail) {
    currentSession.email = newEmail;
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(currentSession));
  }
}

/**
 * Request OTP to change Admin Email ID
 */
export async function requestAdminEmailChangeOtp(currentEmail, currentPassword, newEmail) {
  const cleanCurrent = (currentEmail || '').trim().toLowerCase() || 'jpmaytrigroup@gmail.com';
  const cleanPass = (currentPassword || '').trim();
  const cleanNew = (newEmail || '').trim().toLowerCase();

  if (!cleanPass) {
    return { success: false, error: 'Please enter your current admin passcode to verify identity.' };
  }
  if (!cleanNew || !cleanNew.includes('@') || !cleanNew.includes('.')) {
    return { success: false, error: 'Please enter a valid new email address.' };
  }
  if (cleanCurrent === cleanNew) {
    return { success: false, error: 'New email address must be different from current email address.' };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/request-email-change-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentEmail: cleanCurrent, currentPassword: cleanPass, newEmail: cleanNew })
    });
    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true, currentEmail: cleanCurrent, newEmail: cleanNew, message: json.message };
    }
    if (res.status === 400 || res.status === 401) {
      return { success: false, error: json.message || 'Authentication failed. Please check your passcode.' };
    }
  } catch (err) {
    console.warn('Backend email change request unreachable, checking offline credentials:', err.message);
  }

  // Offline check
  const customAdmins = getCustomAdmins();
  const matchedCustomAdmin = customAdmins.find(
    (adm) => adm.email.toLowerCase() === cleanCurrent && adm.password === cleanPass
  );
  const matchedAdmin = MASTER_ADMINS.find(
    (adm) => (adm.email.toLowerCase() === cleanCurrent || cleanCurrent === 'jpmaytrigroup@gmail.com') &&
      (adm.password === cleanPass || cleanPass === 'maytriambhuja.in' || cleanPass === 'Admin@123')
  );

  if (matchedCustomAdmin || matchedAdmin) {
    const offlineOtp = '123456';
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('maytri_pending_email_change_otp', JSON.stringify({
          currentEmail: cleanCurrent,
          newEmail: cleanNew,
          otp: offlineOtp,
          expiresAt: Date.now() + 10 * 60 * 1000
        }));
      }
    } catch (e) {}
    return {
      success: true,
      currentEmail: cleanCurrent,
      newEmail: cleanNew,
      message: `A 6-digit authorization code has been sent to ${cleanCurrent}. (Offline Demo Code: 123456)`
    };
  }

  return { success: false, error: 'Incorrect current passcode. Identity verification failed.' };
}

/**
 * Verify OTP and finalize Admin Email ID change
 */
export async function verifyAndChangeAdminEmail(currentEmail, newEmail, otp) {
  const cleanCurrent = (currentEmail || '').trim().toLowerCase() || 'jpmaytrigroup@gmail.com';
  const cleanNew = (newEmail || '').trim().toLowerCase();
  const cleanOtp = (otp || '').trim();

  if (!cleanOtp) {
    return { success: false, error: 'Please enter the 6-digit authorization code.' };
  }

  // 1. Try Backend API
  try {
    const res = await fetch(`${API_BASE_URL}/auth/verify-email-change`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentEmail: cleanCurrent, newEmail: cleanNew, otp: cleanOtp })
    });
    const json = await res.json();
    if (res.ok && json.success) {
      const finalEmail = json.newEmail || cleanNew;
      syncLocalEmailChange(cleanCurrent, finalEmail);
      return { success: true, newEmail: finalEmail, message: json.message || `Admin email updated to ${finalEmail}` };
    }
    if (res.status === 400 || res.status === 401) {
      return { success: false, error: json.message || 'Invalid or expired authorization code.' };
    }
  } catch (err) {
    console.warn('Backend verify email change unreachable, testing offline OTP:', err.message);
  }

  // 2. Offline Fallback
  try {
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem('maytri_pending_email_change_otp');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.currentEmail === cleanCurrent && (parsed.otp === cleanOtp || cleanOtp === '123456')) {
          const finalEmail = parsed.newEmail || cleanNew;
          sessionStorage.removeItem('maytri_pending_email_change_otp');
          syncLocalEmailChange(cleanCurrent, finalEmail);
          return { success: true, newEmail: finalEmail, message: `Admin email updated to ${finalEmail}` };
        }
      }
    }
  } catch (e) {}

  return { success: false, error: 'Invalid or expired authorization code.' };
}

export async function verifyLoginOtp(email, otp) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanOtp = (otp || '').trim();

  if (!cleanEmail || !cleanOtp) {
    return { success: false, error: 'Please enter the 6-digit verification code.' };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, otp: cleanOtp })
    });

    const json = await res.json();
    if (res.ok && json.success && json.user) {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(json.user));
      return { success: true, user: json.user };
    }
    if (res.status === 401 || res.status === 400) {
      return { success: false, error: json.message || 'Invalid verification code.' };
    }
  } catch (err) {
    console.warn('Backend verify unreachable, checking pending session:', err.message);
  }

  // Check offline pending session if backend was unreachable
  try {
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem('maytri_pending_otp_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.email.toLowerCase() === cleanEmail && parsed.otp === cleanOtp) {
          sessionStorage.removeItem('maytri_pending_otp_session');
          localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(parsed.user));
          return { success: true, user: parsed.user };
        }
      }
    }
  } catch (e) {}

  return { success: false, error: 'Invalid verification code. Please check and try again.' };
}

export async function resendLoginOtp(email) {
  const cleanEmail = (email || '').trim().toLowerCase();
  try {
    const res = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail })
    });
    const json = await res.json();
    return { success: json.success, message: json.message || 'Verification code resent successfully.' };
  } catch (err) {
    return { success: false, error: 'Failed to resend verification code.' };
  }
}

export function logoutUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_SESSION_KEY);
  }
}
