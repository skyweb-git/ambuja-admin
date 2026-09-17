// Activity Log Service (Calls Completed & Emails Dispatched by Employees)

const CALL_LOGS_KEY = 'maytri_call_logs_v1';
const EMAIL_LOGS_KEY = 'maytri_email_logs_v1';
const CHANNEL_NAME = 'maytri_leads_sync_channel';

const INITIAL_CALL_LOGS = [];
const INITIAL_EMAIL_LOGS = [];

export const EMAIL_TEMPLATES = [
  {
    id: 'tpl-brochure',
    title: 'Digital Project Kit & Master Plan',
    subject: (name) => `Maytri Ambhuja Villa Township: Comprehensive Digital Kit for ${name || 'You'}`,
    body: (name, unit) => `Dear ${name || 'Sir/Madam'},

Thank you for your interest in Maytri Ambhuja, Hyderabad's premier luxury villa community near ORR Exit 12, Shamshabad.

We are pleased to share the complete project digital kit:
• Township Master Plan (4.5 Acres Central Park)
• 90,000 Sq.Ft Luxury Clubhouse & 16 Amenities
• Architectural Floor Plans for 222 SQ YD & 300 SQ YD East/West Facing Villas (${unit || 'Luxury Villas'})
• Official Telangana RERA Registration: P02400007647

Please let us know your preferred date and time for an exclusive guided walkthrough.

Warm regards,
Sales & Advisory Desk
Maytri Ambhuja Township
Phone: +91 98490 12345 | Web: www.ambhujamaytri.in`
  },
  {
    id: 'tpl-cost-sheet',
    title: 'Cost Sheet & Payment Milestone Plan',
    subject: (name) => `Official Pricing & Payment Schedule — Maytri Ambhuja`,
    body: (name, unit) => `Dear ${name || 'Valued Client'},

As requested during our discussion, here is the detailed pricing overview and payment milestone schedule for ${unit || 'Maytri Ambhuja Luxury Villas'}:

• All-inclusive pricing breakdown with base rate and clubhouse charges
• Construction linked payment milestones (10% booking advance, phased structure payments)
• Approved Home Loan Partners: SBI, HDFC Bank, ICICI Bank & Axis Bank

Our finance advisory team is available to assist you with custom payment schedules and loan pre-approvals.

Warm regards,
Maytri Ambhuja Sales Office`
  },
  {
    id: 'tpl-site-visit',
    title: 'VIP Site Visit Confirmation & Google Maps Pass',
    subject: (name) => `Confirmation: Your VIP Site Visit at Maytri Ambhuja`,
    body: (name, unit) => `Dear ${name || 'Sir/Madam'},

We are delighted to confirm your upcoming site visit to Maytri Ambhuja Villa Township!

📍 Site Location: Maytri Ambhuja, Near ORR Exit 12, Shamshabad - Sanghi Nagar Road, Hyderabad, Telangana 501511.
Google Maps Link: https://maps.google.com/?q=Maytri+Ambhuja+Hyderabad

Your dedicated relationship manager will receive you at the township experience center to give you and your family a personalized tour of the sample villa and clubhouse.

Looking forward to meeting you!

Warm regards,
Maytri Ambhuja Welcome Desk`
  }
];

let broadcastChannel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel error', e);
}

// ----------------- CALL LOGS -----------------
export function getCallLogs() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CALL_LOGS_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to get call logs', e);
    return [];
  }
}

export function logCall(callData) {
  const current = getCallLogs();
  const newCall = {
    id: callData.id || ('call-' + Date.now().toString(36)),
    leadId: callData.leadId || '',
    leadName: callData.leadName || 'Prospect',
    leadPhone: callData.leadPhone || '',
    employeeId: callData.employeeId || 'emp-unknown',
    employeeName: callData.employeeName || 'Staff Member',
    employeeDept: callData.employeeDept || 'Marketing & Sales',
    outcome: callData.outcome || 'Connected - Interested',
    duration: callData.duration || '2 mins 30 secs',
    durationSec: callData.durationSec || 150,
    notes: callData.notes || '',
    timestamp: new Date().toISOString()
  };

  const updated = [newCall, ...current];
  localStorage.setItem(CALL_LOGS_KEY, JSON.stringify(updated));

  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'CALLS_UPDATED', calls: updated, newCall });
  }

  // Sync with MongoDB API
  syncCallLogToAPI(newCall);

  return newCall;
}

// ----------------- EMAIL LOGS -----------------
export function getEmailLogs() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(EMAIL_LOGS_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to get email logs', e);
    return [];
  }
}

export function logEmail(emailData) {
  const current = getEmailLogs();
  const newMail = {
    id: emailData.id || ('mail-' + Date.now().toString(36)),
    leadId: emailData.leadId || '',
    leadName: emailData.leadName || 'Prospect',
    leadEmail: emailData.leadEmail || '',
    employeeId: emailData.employeeId || 'emp-unknown',
    employeeName: emailData.employeeName || 'Marketing Executive',
    templateType: emailData.templateType || 'Digital Project Kit & Master Plan',
    subject: emailData.subject || 'Maytri Ambhuja Villa Township Enquiry',
    preview: emailData.preview || (emailData.body ? emailData.body.substring(0, 120) + '...' : ''),
    body: emailData.body || '',
    status: 'Delivered',
    sentAt: new Date().toISOString()
  };

  const updated = [newMail, ...current];
  localStorage.setItem(EMAIL_LOGS_KEY, JSON.stringify(updated));

  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'EMAILS_UPDATED', emails: updated, newMail });
  }

  // Sync with MongoDB API
  syncEmailLogToAPI(newMail);

  return newMail;
}

// ---------------- MongoDB API Helpers ----------------
import { API_BASE_URL, getApiBaseUrl } from './apiConfig';

export async function fetchCallLogsFromAPI() {
  try {
    const res = await fetch(`${getApiBaseUrl()}/activity/calls`);
    if (!res.ok) throw new Error('API fetch calls failed');
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      localStorage.setItem(CALL_LOGS_KEY, JSON.stringify(json.data));
      return json.data;
    }
  } catch (err) {
    console.warn('Could not sync call logs from API:', err.message);
  }
  return getCallLogs();
}

export async function syncCallLogToAPI(callData) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/activity/calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(callData)
    });
    return await res.json();
  } catch (err) {
    console.warn('API call log save failed:', err.message);
    return null;
  }
}

export async function fetchEmailLogsFromAPI() {
  try {
    const res = await fetch(`${getApiBaseUrl()}/activity/emails`);
    if (!res.ok) throw new Error('API fetch emails failed');
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      localStorage.setItem(EMAIL_LOGS_KEY, JSON.stringify(json.data));
      return json.data;
    }
  } catch (err) {
    console.warn('Could not sync email logs from API:', err.message);
  }
  return getEmailLogs();
}

export async function syncEmailLogToAPI(emailData) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/activity/emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData)
    });
    return await res.json();
  } catch (err) {
    console.warn('API email log save failed:', err.message);
    return null;
  }
}
