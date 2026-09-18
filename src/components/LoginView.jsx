import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  KeyRound,
  ArrowLeft,
  Key,
  RefreshCw,
  Briefcase,
  Crown
} from 'lucide-react';
import { 
  loginWithCredentials, 
  resetUserPassword, 
  verifyLoginOtp, 
  resendLoginOtp,
  requestPasscodeResetOtp,
  verifyAndResetPasscode,
  requestAdminEmailChangeOtp,
  verifyAndChangeAdminEmail
} from '../services/authService';

export default function LoginView({ onLoginSuccess, employees = [] }) {
  // Role selection: 'admin' | 'employee'
  const [loginRole, setLoginRole] = useState('admin');
  const [isSecurityMode, setIsSecurityMode] = useState(false);
  const [securitySubTab, setSecuritySubTab] = useState('reset'); // 'reset' | 'email'
  const [resetStep, setResetStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP & Set New Passcode
  const [emailChangeStep, setEmailChangeStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP & Update Email
  const [isOtpMode, setIsOtpMode] = useState(false);
  
  // Admin Login States (default jpmaytrigroup@gmail.com)
  const [adminEmail, setAdminEmail] = useState('jpmaytrigroup@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  
  // Admin Email Change States
  const [currentAdminPasscode, setCurrentAdminPasscode] = useState('');
  const [showCurrentAdminPasscode, setShowCurrentAdminPasscode] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [emailChangeOtp, setEmailChangeOtp] = useState('');
  const [emailChangeOtpLoading, setEmailChangeOtpLoading] = useState(false);
  const [emailChangeVerifyLoading, setEmailChangeVerifyLoading] = useState(false);
  const [emailChangeCountdown, setEmailChangeCountdown] = useState(60);

  // Employee Login States
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeePassword, setEmployeePassword] = useState('');

  // Common UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Active target email for OTP verification
  const [activeTargetEmail, setActiveTargetEmail] = useState('jpmaytrigroup@gmail.com');

  // Login OTP states
  const [otpValue, setOtpValue] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);

  // Reset Password states
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetOtpLoading, setResetOtpLoading] = useState(false);
  const [resetVerifyLoading, setResetVerifyLoading] = useState(false);
  const [resetCountdown, setResetCountdown] = useState(60);

  // Countdown timer for Login Resend OTP
  useEffect(() => {
    let timer = null;
    if (isOtpMode && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOtpMode, resendCountdown]);

  // Countdown timer for Reset Passcode OTP
  useEffect(() => {
    let timer = null;
    if (isSecurityMode && securitySubTab === 'reset' && resetStep === 2 && resetCountdown > 0) {
      timer = setInterval(() => {
        setResetCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSecurityMode, securitySubTab, resetStep, resetCountdown]);

  // Countdown timer for Email Change OTP
  useEffect(() => {
    let timer = null;
    if (isSecurityMode && securitySubTab === 'email' && emailChangeStep === 2 && emailChangeCountdown > 0) {
      timer = setInterval(() => {
        setEmailChangeCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSecurityMode, securitySubTab, emailChangeStep, emailChangeCountdown]);

  // Handle switching role tabs
  const handleRoleChange = (role) => {
    setLoginRole(role);
    setIsOtpMode(false);
    setIsSecurityMode(false);
    setSecuritySubTab('reset');
    setResetStep(1);
    setEmailChangeStep(1);
    setError('');
    setSuccessMessage('');
    setOtpValue('');
  };

  // Submit credentials (Step 1)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const isAdm = loginRole === 'admin';
    const emailToUse = isAdm 
      ? ((adminEmail || '').trim() || 'jpmaytrigroup@gmail.com')
      : (employeeEmail || '').trim();
    const passToUse = isAdm ? adminPassword.trim() : employeePassword.trim();

    if (!isAdm && !emailToUse) {
      setError('Please enter your work email address.');
      return;
    }

    if (!passToUse) {
      setError(isAdm ? 'Please enter the admin passcode.' : 'Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await loginWithCredentials(emailToUse, passToUse, employees, loginRole);
      if (res.requireOtp) {
        const destEmail = res.email || emailToUse;
        setActiveTargetEmail(destEmail);
        setIsOtpMode(true);
        setOtpValue('');
        setResendCountdown(60);
        setSuccessMessage(res.message || `A 6-digit verification code was emailed to ${destEmail}.`);
      } else if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Invalid credentials. Please verify and try again.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit OTP (Step 2)
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpValue.trim() || otpValue.trim().length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    const targetEmail = activeTargetEmail || (loginRole === 'admin' ? 'jpmaytrigroup@gmail.com' : employeeEmail);

    setOtpLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await verifyLoginOtp(targetEmail, otpValue.trim());
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Invalid or expired verification code.');
      }
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || resendLoading) return;
    const targetEmail = activeTargetEmail || (loginRole === 'admin' ? 'jpmaytrigroup@gmail.com' : employeeEmail);
    
    setResendLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await resendLoginOtp(targetEmail);
      if (res.success) {
        setResendCountdown(60);
        setSuccessMessage(res.message || `New verification code dispatched to ${targetEmail}.`);
      } else {
        setError(res.error || 'Failed to resend code.');
      }
    } catch (err) {
      setError(err.message || 'Could not resend OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  // --- Passcode Reset Handlers (OTP Verified) ---
  const handleRequestResetOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const emailToTarget = resetEmail.trim();
    if (!emailToTarget) {
      setError('Please enter your registered email address.');
      return;
    }

    setResetOtpLoading(true);
    try {
      const res = await requestPasscodeResetOtp(emailToTarget);
      if (res.success) {
        setResetStep(2);
        setResetCountdown(60);
        setSuccessMessage(`A 6-digit security OTP was sent to ${emailToTarget}.`);
      } else {
        setError(res.error || 'Failed to send passcode reset OTP. Please check your email.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while requesting passcode reset OTP.');
    } finally {
      setResetOtpLoading(false);
    }
  };

  const handleVerifyAndResetPasscode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const emailToTarget = resetEmail.trim() || (loginRole === 'admin' ? adminEmail : employeeEmail);
    if (!resetOtp.trim() || resetOtp.trim().length < 6) {
      setError('Please enter the 6-digit security OTP.');
      return;
    }

    if (!newPassword.trim() || newPassword.length < 6) {
      setError('New passcode must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passcode and confirm passcode do not match.');
      return;
    }

    setResetVerifyLoading(true);
    try {
      const res = await verifyAndResetPasscode(emailToTarget, resetOtp.trim(), newPassword.trim());
      if (res.success) {
        setSuccessMessage(res.message || 'Passcode updated successfully! You can now sign in with your new passcode.');
        if (loginRole === 'admin') {
          setAdminPassword(newPassword.trim());
        } else {
          setEmployeePassword(newPassword.trim());
        }
        setIsSecurityMode(false);
        setResetStep(1);
        setResetOtp('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(res.error || 'Failed to update passcode. Please check the OTP code and try again.');
      }
    } catch (err) {
      setError(err.message || 'Verification error. Please try again.');
    } finally {
      setResetVerifyLoading(false);
    }
  };

  const handleResendResetOtp = async () => {
    if (resetCountdown > 0 || resetOtpLoading) return;
    const emailToTarget = resetEmail.trim() || (loginRole === 'admin' ? adminEmail : employeeEmail);
    setResetOtpLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await requestPasscodeResetOtp(emailToTarget);
      if (res.success) {
        setResetCountdown(60);
        setSuccessMessage(`A 6-digit security OTP was sent to ${emailToTarget}.`);
      } else {
        setError(res.error || 'Failed to resend code.');
      }
    } catch (err) {
      setError(err.message || 'Could not resend OTP.');
    } finally {
      setResetOtpLoading(false);
    }
  };

  // --- Admin Email Change Handlers (OTP Verified) ---
  const handleRequestEmailChangeOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const currEmail = (adminEmail || '').trim() || 'jpmaytrigroup@gmail.com';
    const currPass = currentAdminPasscode.trim();
    const newMail = newAdminEmail.trim();

    if (!currPass) {
      setError('Please enter your current admin passcode to verify identity.');
      return;
    }
    if (!newMail || !newMail.includes('@') || !newMail.includes('.')) {
      setError('Please provide a valid new email address.');
      return;
    }
    if (currEmail.toLowerCase() === newMail.toLowerCase()) {
      setError('New email address must be different from current email address.');
      return;
    }

    setEmailChangeOtpLoading(true);
    try {
      const res = await requestAdminEmailChangeOtp(currEmail, currPass, newMail);
      if (res.success) {
        setEmailChangeStep(2);
        setEmailChangeCountdown(60);
        setSuccessMessage(`A 6-digit security OTP was sent to ${currEmail}.`);
      } else {
        setError(res.error || 'Authentication failed. Please verify your passcode.');
      }
    } catch (err) {
      setError(err.message || 'Failed to request email change OTP.');
    } finally {
      setEmailChangeOtpLoading(false);
    }
  };

  const handleVerifyEmailChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const currEmail = (adminEmail || '').trim() || 'jpmaytrigroup@gmail.com';
    const newMail = newAdminEmail.trim();
    const otp = emailChangeOtp.trim();

    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit authorization code.');
      return;
    }

    setEmailChangeVerifyLoading(true);
    try {
      const res = await verifyAndChangeAdminEmail(currEmail, newMail, otp);
      if (res.success) {
        const updatedEmail = res.newEmail || newMail;
        setAdminEmail(updatedEmail);
        setSuccessMessage(res.message || `Admin email successfully updated to ${updatedEmail}! You can now sign in with your new email.`);
        setIsSecurityMode(false);
        setEmailChangeStep(1);
        setCurrentAdminPasscode('');
        setNewAdminEmail('');
        setEmailChangeOtp('');
      } else {
        setError(res.error || 'Invalid or expired authorization code.');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify email change.');
    } finally {
      setEmailChangeVerifyLoading(false);
    }
  };

  const handleResendEmailChangeOtp = async () => {
    if (emailChangeCountdown > 0 || emailChangeOtpLoading) return;
    const currEmail = (adminEmail || '').trim() || 'jpmaytrigroup@gmail.com';
    setEmailChangeOtpLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await requestAdminEmailChangeOtp(currEmail, currentAdminPasscode.trim(), newAdminEmail.trim());
      if (res.success) {
        setEmailChangeCountdown(60);
        setSuccessMessage(res.message || `New authorization code dispatched to ${currEmail}.`);
      } else {
        setError(res.error || 'Failed to resend authorization code.');
      }
    } catch (err) {
      setError(err.message || 'Could not resend authorization code.');
    } finally {
      setEmailChangeOtpLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-backdrop-glow" />

      <div className="login-card">
        {/* Brand Header */}
        <div className="login-header">
          <div className="login-brand-icon" style={{ background: 'transparent', padding: 0, width: 'auto', height: 'auto', marginBottom: '0.75rem' }}>
            <img
              src="/ambhuja-logo-dark.png"
              alt="Maytri Ambhuja"
              style={{ height: '70px', width: 'auto', maxWidth: '220px', objectFit: 'contain' }}
            />
          </div>
          <h1 className="login-brand-title">MAYTRI AMBHUJA</h1>
          <p className="login-brand-tagline">Maytri Ambhuja CRM &amp; Admin Portal</p>
        </div>

        {/* Role Selector Tabs (Admin vs Employee) */}
        {!isOtpMode && !isSecurityMode && (
          <div className="login-role-tabs">
            <button
              type="button"
              className={`login-role-btn ${loginRole === 'admin' ? 'active' : ''}`}
              onClick={() => handleRoleChange('admin')}
            >
              <Crown size={16} />
              <span>Admin Portal</span>
            </button>
            <button
              type="button"
              className={`login-role-btn ${loginRole === 'employee' ? 'active' : ''}`}
              onClick={() => handleRoleChange('employee')}
            >
              <Briefcase size={16} />
              <span>Employee Portal</span>
            </button>
          </div>
        )}

        {/* Role & Security Banner */}
        <div className={`login-role-info-banner ${loginRole === 'admin' ? 'admin' : 'employee'}`}>
          <div className="role-info-header">
            <span className="role-badge">
              <ShieldCheck size={15} />
              <span>
                {isOtpMode 
                  ? 'Step 2: Enter 6-Digit Email OTP' 
                  : isSecurityMode
                    ? 'Security & Password Setup'
                    : loginRole === 'admin'
                      ? 'Admin Passcode Authentication'
                      : 'Employee & Staff Authentication'}
              </span>
            </span>
          </div>
          <p className="role-info-desc">
            {isOtpMode ? (
              <>
                We have sent a 6-digit one-time passcode to <strong style={{ color: '#000' }}>{activeTargetEmail}</strong>. Please enter the code below to complete sign-in.
              </>
            ) : isSecurityMode ? (
              'Enter your registered email address to set or update your password.'
            ) : loginRole === 'admin' ? (
              <>
                Enter your admin passcode below. A one-time verification OTP will be sent directly to <strong style={{ color: '#000' }}>{adminEmail || 'jpmaytrigroup@gmail.com'}</strong>.
              </>
            ) : (
              'Enter your registered work email and password. A verification OTP will be sent directly to your email.'
            )}
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div style={{
            background: '#ecfdf5',
            border: '1.5px solid #a7f3d0',
            color: '#065f46',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            lineHeight: 1.4,
            marginBottom: '0.75rem'
          }}>
            <CheckCircle2 size={18} className="flex-shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="login-error-alert" role="alert" style={{ marginBottom: '0.75rem' }}>
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isOtpMode ? (
          /* Step 2: Login OTP 2FA Verification Form */
          <form onSubmit={handleOtpSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="otp-input" style={{ textAlign: 'center', display: 'block', fontSize: '0.9rem', fontWeight: 700 }}>
                Enter 6-Digit OTP Code sent to {activeTargetEmail}
              </label>
              <div className="login-input-wrap" style={{ justifyContent: 'center' }}>
                <Key size={18} className="login-input-icon" />
                <input
                  id="otp-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  className="form-input login-input"
                  style={{
                    textAlign: 'center',
                    fontSize: '1.5rem',
                    letterSpacing: '0.55em',
                    fontWeight: '800',
                    fontFamily: 'monospace',
                    padding: '0.75rem 1rem 0.75rem 2.5rem'
                  }}
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary login-submit-btn"
              disabled={otpLoading || otpValue.length < 6}
            >
              {otpLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Verifying OTP...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>{loginRole === 'admin' ? 'Verify OTP & Enter Admin Dashboard' : 'Verify OTP & Enter Employee Desk'}</span>
                </>
              )}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.85rem' }}>
              <button
                type="button"
                onClick={() => {
                  setIsOtpMode(false);
                  setOtpValue('');
                  setError('');
                  setSuccessMessage('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={15} />
                <span>Back to {loginRole === 'admin' ? 'Passcode' : 'Login'}</span>
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCountdown > 0 || resendLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'none',
                  border: 'none',
                  color: resendCountdown > 0 ? '#94a3b8' : '#0d9488',
                  fontWeight: 700,
                  cursor: resendCountdown > 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {resendLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Resending...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    <span>{resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : isSecurityMode ? (
          /* Security Panel with 2-Tab Pill Sub-Selector */
          <div>
            {/* 2-Tab Pill Selector (Reset Passcode vs Change Admin Email) */}
            <div className="login-role-tabs" style={{ marginBottom: '1.25rem' }}>
              <button
                type="button"
                className={`login-role-btn ${securitySubTab === 'reset' ? 'active' : ''}`}
                onClick={() => {
                  setSecuritySubTab('reset');
                  setError('');
                }}
              >
                <Key size={16} />
                <span>Reset Passcode</span>
              </button>
              <button
                type="button"
                className={`login-role-btn ${securitySubTab === 'email' ? 'active' : ''}`}
                onClick={() => {
                  setSecuritySubTab('email');
                  setError('');
                }}
              >
                <Mail size={16} />
                <span>Change Admin Email</span>
              </button>
            </div>

            {securitySubTab === 'reset' ? (
              /* --- TAB 1: RESET PASSCODE --- */
              resetStep === 1 ? (
                /* Step 1: Enter Email & Request OTP */
                <form onSubmit={handleRequestResetOtp} className="login-form">
                  <div className="form-group">
                    <label className="form-label" htmlFor="reset-email">
                      Registered Admin Work Email
                    </label>
                    <div className="login-input-wrap">
                      <Mail size={17} className="login-input-icon" />
                      <input
                        id="reset-email"
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="jpmaytrigroup@gmail.com"
                        className="form-input login-input"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary login-submit-btn"
                    disabled={resetOtpLoading}
                  >
                    {resetOtpLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Sending Security OTP...</span>
                      </>
                    ) : (
                      <>
                        <Key size={16} />
                        <span>Send Security OTP to Email</span>
                      </>
                    )}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '0.85rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setSuccessMessage('');
                        setIsSecurityMode(false);
                        setResetStep(1);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      className="hover:underline"
                    >
                      <ArrowLeft size={15} />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: Enter OTP & New Passcode */
                <form onSubmit={handleVerifyAndResetPasscode} className="login-form">
                  <div className="form-group">
                    <label className="form-label" htmlFor="reset-otp" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700 }}>
                      Enter 6-Digit Security OTP sent to {resetEmail || (loginRole === 'admin' ? adminEmail : employeeEmail)}
                    </label>
                    <div className="login-input-wrap">
                      <Key size={18} className="login-input-icon" />
                      <input
                        id="reset-otp"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        required
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="• • • • • •"
                        className="form-input login-input"
                        style={{
                          textAlign: 'center',
                          fontSize: '1.4rem',
                          letterSpacing: '0.45em',
                          fontWeight: '800',
                          fontFamily: 'monospace'
                        }}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="new-password">
                      New Passcode (Min. 6 characters)
                    </label>
                    <div className="login-input-wrap">
                      <Lock size={17} className="login-input-icon" />
                      <input
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new passcode"
                        className="form-input login-input"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="confirm-password">
                      Confirm New Passcode
                    </label>
                    <div className="login-input-wrap">
                      <Lock size={17} className="login-input-icon" />
                      <input
                        id="confirm-password"
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new passcode"
                        className="form-input login-input"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary login-submit-btn"
                    disabled={resetVerifyLoading || resetOtp.length < 6}
                  >
                    {resetVerifyLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Verifying OTP &amp; Updating...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        <span>Verify OTP &amp; Set New Passcode</span>
                      </>
                    )}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '0.85rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setSuccessMessage('');
                        setIsSecurityMode(false);
                        setResetStep(1);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      className="hover:underline"
                    >
                      <ArrowLeft size={15} />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </form>
              )
            ) : (
              /* --- TAB 2: CHANGE ADMIN EMAIL --- */
              emailChangeStep === 1 ? (
                /* Step 1: Passcode Verification & New Email Input */
                <form onSubmit={handleRequestEmailChangeOtp} className="login-form">
                  <div className="form-group">
                    <label className="form-label" htmlFor="current-admin-email">
                      Current Admin Email ID
                    </label>
                    <div className="login-input-wrap">
                      <Mail size={17} className="login-input-icon" />
                      <input
                        id="current-admin-email"
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="jpmaytrigroup@gmail.com"
                        className="form-input login-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="current-admin-passcode">
                      Current Admin Passcode
                    </label>
                    <div className="login-input-wrap">
                      <Lock size={17} className="login-input-icon" />
                      <input
                        id="current-admin-passcode"
                        type={showCurrentAdminPasscode ? 'text' : 'password'}
                        required
                        value={currentAdminPasscode}
                        onChange={(e) => setCurrentAdminPasscode(e.target.value)}
                        placeholder="Enter current passcode"
                        className="form-input login-input"
                        autoFocus
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowCurrentAdminPasscode(!showCurrentAdminPasscode)}
                        aria-label={showCurrentAdminPasscode ? "Hide passcode" : "Show passcode"}
                      >
                        {showCurrentAdminPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="new-admin-email">
                      New Desired Admin Email ID
                    </label>
                    <div className="login-input-wrap">
                      <Mail size={17} className="login-input-icon" />
                      <input
                        id="new-admin-email"
                        type="email"
                        required
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        placeholder="e.g. admin@sanghicity.in"
                        className="form-input login-input"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary login-submit-btn"
                    disabled={emailChangeOtpLoading}
                  >
                    {emailChangeOtpLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Requesting OTP...</span>
                      </>
                    ) : (
                      <>
                        <Key size={16} />
                        <span>Request Authorization OTP</span>
                      </>
                    )}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '0.85rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setSuccessMessage('');
                        setIsSecurityMode(false);
                        setEmailChangeStep(1);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      className="hover:underline"
                    >
                      <ArrowLeft size={15} />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: 6-Digit OTP Verification */
                <form onSubmit={handleVerifyEmailChange} className="login-form">
                  <div className="form-group">
                    <label className="form-label" htmlFor="email-change-otp" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700 }}>
                      Enter 6-Digit Security OTP sent to {adminEmail}
                    </label>
                    <div className="login-input-wrap">
                      <Key size={18} className="login-input-icon" />
                      <input
                        id="email-change-otp"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        required
                        value={emailChangeOtp}
                        onChange={(e) => setEmailChangeOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="• • • • • •"
                        className="form-input login-input"
                        style={{
                          textAlign: 'center',
                          fontSize: '1.4rem',
                          letterSpacing: '0.45em',
                          fontWeight: '800',
                          fontFamily: 'monospace'
                        }}
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary login-submit-btn"
                    disabled={emailChangeVerifyLoading || emailChangeOtp.length < 6}
                  >
                    {emailChangeVerifyLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Verifying &amp; Updating Email...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        <span>Verify OTP &amp; Update Admin Email</span>
                      </>
                    )}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '0.85rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setSuccessMessage('');
                        setIsSecurityMode(false);
                        setEmailChangeStep(1);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      className="hover:underline"
                    >
                      <ArrowLeft size={15} />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </form>
              )
            )}
          </div>
        ) : (
          /* Step 1: Main Login Form (Admin or Employee) */
          <form onSubmit={handleSubmit} className="login-form">
            {loginRole === 'admin' ? (
              /* Admin Form */
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="admin-password">
                    Admin Passcode
                  </label>
                  <div className="login-input-wrap">
                    <Lock size={17} className="login-input-icon" />
                    <input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter admin passcode"
                      className="form-input login-input"
                      autoComplete="current-password"
                      autoFocus
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary login-submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Verifying Passcode...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify Passcode &amp; Request OTP</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setSuccessMessage('');
                      setSecuritySubTab('reset');
                      setResetStep(1);
                      setEmailChangeStep(1);
                      setResetEmail(adminEmail || 'jpmaytrigroup@gmail.com');
                      setIsSecurityMode(true);
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}
                    className="hover:underline"
                  >
                    Forgot passcode or need to change admin email?
                  </button>
                </div>
              </>
            ) : (
              /* Employee Form */
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="employee-email">
                    Employee Work Email
                  </label>
                  <div className="login-input-wrap">
                    <Mail size={17} className="login-input-icon" />
                    <input
                      id="employee-email"
                      type="email"
                      required
                      value={employeeEmail}
                      onChange={(e) => setEmployeeEmail(e.target.value)}
                      placeholder="e.g. employee@maytri.com"
                      className="form-input login-input"
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="employee-password">
                    Employee Password
                  </label>
                  <div className="login-input-wrap">
                    <Lock size={17} className="login-input-icon" />
                    <input
                      id="employee-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={employeePassword}
                      onChange={(e) => setEmployeePassword(e.target.value)}
                      placeholder="Enter employee password"
                      className="form-input login-input"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary login-submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In &amp; Request OTP</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setSuccessMessage('');
                      setSecuritySubTab('reset');
                      setResetStep(1);
                      setResetEmail(employeeEmail);
                      setIsSecurityMode(true);
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}
                    className="hover:underline"
                  >
                    Forgot / Reset Password?
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        <div className="login-footer-note">
          <span>Protected Real Estate Portal • Telangana RERA P02400007647</span>
        </div>
      </div>
    </div>
  );
}
