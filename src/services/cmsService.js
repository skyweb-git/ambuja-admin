import { API_BASE_URL } from './apiConfig';
const CONTENT_STORAGE_KEY = 'maytri_website_content_v1';
const CMS_CHANNEL_NAME = 'maytri_cms_sync_channel';

let broadcastChannel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CMS_CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel not supported', e);
}

export const DEFAULT_CONTENT = {
  hero: {
    eyebrowBadge: 'MAYTRI GROUP',
    reraNumber: 'P02400007647',
    title: 'Exclusive Villa Township in Hyderabad',
    subheading: 'Spacious Villas with Picturesque Pathways & Rich Finishes',
    description: 'Surrounded by pristine landscapes and tree-lined avenues, experience an eco-friendly lifestyle designed for comfortable community living.',
    startingPrice: '₹3.8 Cr*',
    tokenAdvance: '₹5 Lakhs',
    highlights: [
      { title: '4.5 Acres', subtitle: 'Dedicated Green Park' },
      { title: 'Spacious Villas', subtitle: 'Picturesque Pathways' },
      { title: 'Rich Finishes', subtitle: 'Premium Living' },
      { title: 'All Age Groups', subtitle: 'Inclusive Villa Spaces' }
    ]
  },
  about: {
    sectionTitle: 'Where Nature Meets Architectural Opulence',
    tagline: 'A Masterpiece of Luxury Living in Shamshabad',
    description1: 'Nestled amidst 35+ acres of verdant serenity, Maytri Ambhuja is Hyderabad’s pinnacle luxury villa community crafted for discerning global citizens.',
    description2: 'Strategically located minutes from Shamshabad & ORR Exit 12, each villa is an epitome of timeless contemporary architecture with 100% Vaastu compliance.',
    totalVillas: '150+ Luxury Villas',
    totalAcres: '35+ Acres Township',
    clubhouseSize: '90,000 Sq.Ft Clubhouse'
  },
  clubhouse: {
    title: 'The Grand Ambhuja Clubhouse',
    tagline: '90,000 Sq.Ft of Resort-Class Leisure & Wellness',
    description: 'An architectural marvel offering 30+ bespoke luxury amenities including infinity pools, private 4K preview theatres, Olympic multi-sport arenas, and Ayurvedic spas.'
  },
  contact: {
    phone: '+91 98490 12345',
    whatsapp: '+91 98490 12345',
    email: 'info@ambhujamaytri.in',
    infoEmail: 'info@ambhujamaytri.in',
    websiteUrl: 'https://www.maytriambhuja.in',
    siteAddress: 'Maytri Ambhuja, Near ORR Exit 12, Shamshabad - Sanghi Nagar Road, Hyderabad, Telangana 501511',
    officeHours: 'Monday – Sunday: 9:30 AM – 7:30 PM'
  },
  brochure: {
    url: '/assets/maytri-ambhuja-brochure.pdf',
    modalTitle: 'Download Maytri Ambhuja Brochure',
    modalDesc: 'Receive the official villa township brochure featuring master plan details, 90,000 sq.ft clubhouse features, and 222 & 300 SQ YD floor plans.'
  },
  amenitiesSection: {
    eyebrowTag: 'RESORT-STYLE CONVENIENCES',
    title: 'Amenities',
    subtitle: 'A comprehensive suite of modern lifestyle, wellness, sports, and daily conveniences curated for all age groups.',
    items: [
      { name: 'Playing Area', category: 'Recreation', img: '', iconName: 'Gamepad2' },
      { name: 'Swimming Pool', category: 'Wellness', img: '', iconName: 'Waves' },
      { name: 'Club House', category: 'Community', img: '', iconName: 'Building2' },
      { name: 'Grocery Store', category: 'Convenience', img: '', iconName: 'ShoppingBag' },
      { name: 'Gym', category: 'Fitness', img: '', iconName: 'Dumbbell' },
      { name: 'Indoor Games', category: 'Leisure', img: '', iconName: 'Dices' },
      { name: 'Jogging Track', category: 'Fitness', img: '', iconName: 'Footprints' },
      { name: 'Intercom System', category: 'Security', img: '', iconName: 'PhoneCall' },
      { name: 'High-Speed Lifts', category: 'Infrastructure', img: '', iconName: 'ArrowUpDown' },
      { name: '4.5 Acre Central Park', category: 'Nature', img: '', iconName: 'Trees' },
      { name: '24/7 Security & CCTV', category: 'Safety', img: '', iconName: 'ShieldCheck' },
      { name: 'Tennis Court', category: 'Sports', img: '', iconName: 'Trophy' },
      { name: 'Badminton & Shuttle', category: 'Sports', img: '', iconName: 'Activity' },
      { name: 'Squash Arena', category: 'Sports', img: '', iconName: 'Target' },
      { name: 'Grand Banquets', category: 'Celebration', img: '', iconName: 'PartyPopper' },
      { name: 'ATM & Banking Kiosk', category: 'Convenience', img: '', iconName: 'CreditCard' }
    ]
  },
  projectsSection: {
    eyebrowTag: 'LANDMARK DEVELOPMENTS',
    title: 'Our Projects',
    subtitle: 'Explore premier master-planned townships and signature villa communities developed with unmatched luxury, architectural brilliance, and strategic connectivity.',
    items: [
      {
        id: 'ambhuja',
        title: 'Maytri Ankura',
        tagline: 'Open Plots',
        location: 'Maheshwaram, Shamshabad Airport, Hyderabad',
        status: 'Ready for VIP Booking',
        image: 'https://res.cloudinary.com/s8b4ps7b/image/upload/v1789725505/maytri_ambhuja/gallery/project_img_0.jpg',
        buttonText: 'For More Info',
        specs: [],
        features: []
      },
      {
        id: 'palms',
        title: 'Maytri Susheela Kuteer',
        tagline: 'Luxury Flats',
        location: 'Vanasthalipuram, Injapur, Hyderabad',
        status: 'Phase 1 Fast Selling',
        image: 'https://res.cloudinary.com/s8b4ps7b/image/upload/v1789728586/maytri_ambhuja/gallery/project_img_1.jpg',
        buttonText: 'For More Info',
        specs: [],
        features: []
      }
    ]
  },
  theme: {
    presetName: 'Oceanic Sapphire (Default)',
    accentColor: '#0284c7',
    accentGlow: '#38bdf8',
    accentSubtle: '#e0f2fe',
    darkPrimary: '#0b132b',
    darkNavy: '#111c36',
    darkNavyLight: '#1c2847',
    pageBg: '#f8f9fb',
    surfaceBg: '#ffffff',
    surfaceSubtle: '#f1f3f7',
    textColor: '#111c36',
    textMuted: '#52637f',
    borderColor: '#e2e6ed'
  },
  customThemes: []
};

export function getLocalContent() {
  if (typeof window === 'undefined') return DEFAULT_CONTENT;
  try {
    const raw = localStorage.getItem(CONTENT_STORAGE_KEY);
    if (!raw) return DEFAULT_CONTENT;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONTENT,
      ...parsed,
      customThemes: Array.isArray(parsed?.customThemes) ? parsed.customThemes : [],
      theme: {
        ...DEFAULT_CONTENT.theme,
        ...(parsed?.theme || {})
      }
    };
  } catch (e) {
    return DEFAULT_CONTENT;
  }
}

export async function fetchContentFromAPI() {
  try {
    const res = await fetch(`${API_BASE_URL}/content`);
    if (!res.ok) throw new Error('Failed to fetch content');
    const json = await res.json();
    if (json.success && json.data) {
      const merged = {
        ...DEFAULT_CONTENT,
        ...json.data,
        theme: {
          ...DEFAULT_CONTENT.theme,
          ...(json.data?.theme || {})
        }
      };
      localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn('API content fetch failed, using local storage:', err.message);
  }
  return getLocalContent();
}

export async function saveContentToAPI(contentData) {
  try {
    localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(contentData));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'CONTENT_UPDATED', content: contentData });
    }

    const res = await fetch(`${API_BASE_URL}/content`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contentData)
    });
    return await res.json();
  } catch (err) {
    console.error('API content save error:', err.message);
    return { success: false, message: err.message };
  }
}

export async function fetchAllMedia() {
  try {
    const res = await fetch(`${API_BASE_URL}/media`);
    if (!res.ok) throw new Error('Failed to fetch media');
    return await res.json();
  } catch (err) {
    console.warn('Media fetch failed:', err.message);
    return { success: false, data: [] };
  }
}

export async function uploadMediaToAPI(mediaPayload) {
  try {
    const res = await fetch(`${API_BASE_URL}/media/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mediaPayload)
    });
    const result = await res.json();
    if (broadcastChannel && result.success) {
      broadcastChannel.postMessage({ type: 'MEDIA_UPDATED', media: result.data });
    }
    return result;
  } catch (err) {
    console.error('Media upload error:', err.message);
    return { success: false, message: err.message };
  }
}

export async function deleteMediaFromAPI(key) {
  try {
    const res = await fetch(`${API_BASE_URL}/media/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
    const result = await res.json();
    if (broadcastChannel && result.success) {
      broadcastChannel.postMessage({ type: 'MEDIA_UPDATED', key, deleted: true });
    }
    return result;
  } catch (err) {
    console.error('Delete media error:', err.message);
    return { success: false, message: err.message };
  }
}
