
export const formatIDR = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const generateNotaNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `TINI-${year}${month}-${random}`;
};

export const playNotificationSound = () => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const playTone = (freq: number, start: number, duration: number) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.2, start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(start);
    osc.stop(start + duration);
  };

  playTone(880, audioCtx.currentTime, 0.5);
  playTone(1108.73, audioCtx.currentTime + 0.1, 0.5);
};

export const sendWhatsAppMessage = (phone: string, message: string) => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
  const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

export const showPushNotification = async (title: string, body: string) => {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png' });
  } else if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      new Notification(title, { body, icon: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png' });
    }
  }
};

/**
 * CLOUD SYNC SERVICE (JSONBLOB)
 * Allows for a free, keyless online database simulation.
 */
const CLOUD_API_URL = 'https://jsonblob.com/api/jsonBlob';

export const createCloudBin = async (data: any): Promise<string | null> => {
  try {
    const response = await fetch(CLOUD_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    });
    const location = response.headers.get('Location');
    if (location) {
      const parts = location.split('/');
      return parts[parts.length - 1];
    }
    return null;
  } catch (err) {
    console.error("Cloud creation failed", err);
    return null;
  }
};

export const updateCloudBin = async (binId: string, data: any): Promise<boolean> => {
  try {
    const response = await fetch(`${CLOUD_API_URL}/${binId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.ok;
  } catch (err) {
    console.error("Cloud update failed", err);
    return false;
  }
};

export const getCloudBin = async (binId: string): Promise<any | null> => {
  try {
    const response = await fetch(`${CLOUD_API_URL}/${binId}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (response.ok) return await response.json();
    return null;
  } catch (err) {
    console.error("Cloud fetch failed", err);
    return null;
  }
};
