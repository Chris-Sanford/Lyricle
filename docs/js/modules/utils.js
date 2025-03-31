import { CONFIG } from './state.js';

export function debugLog(message) {
  if (CONFIG.debugMode) {
    console.log(`DEBUG: ${message}`);
  }
}

export function isMobileDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const mobileRegex = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i;
  
  const hasTouchScreen = (
    ('maxTouchPoints' in navigator && navigator.maxTouchPoints > 1) || 
    ('msMaxTouchPoints' in navigator && navigator.msMaxTouchPoints > 1)
  );
  
  const smallScreen = window.innerWidth < 768;
  
  return mobileRegex.test(userAgent) || hasTouchScreen || smallScreen;
}

export function sanitizeInput(input) {
  return input
    .replace(/([^a-zA-Z0-9\s\u00C0-\u017F])/g, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s/g, '');
}

export function getPercentageCorrect(input, secret) {
  const inputChars = input.split('');
  const secretChars = secret.split('');
  let correctChars = 0;

  for (const char of inputChars) {
    const index = secretChars.indexOf(char);
    if (index !== -1) {
      secretChars.splice(index, 1);
      correctChars++;
    }
  }

  return correctChars / secret.length;
}

export function getDayInt() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start + (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export function calculateOptimizedLyricBoxWidth(lyricContent, customBuffer = 6) {
  const div = document.createElement('div');
  div.style.visibility = 'hidden';
  div.style.fontSize = 'min(1.3em, 60px)';
  div.style.width = 'max-content';
  div.innerText = lyricContent;
  document.body.appendChild(div);
  const width = div.clientWidth;
  div.remove();
  
  let widthBuffer = customBuffer;
  if (lyricContent.length < 5 || /[ftsrl]$/i.test(lyricContent.trim())) {
    widthBuffer += 1;
  }
  
  return width + widthBuffer;
}

export function setLyricBoxBorderBottomStyle(lyricBox, params) {
  const defaultStyle = '4px solid rgba(255, 255, 255, 0.99)';
  const parent = lyricBox.parentElement;
  if (!parent) return;

  try {
    const currentStyle = parent.style.borderBottom || defaultStyle;
    const [width, , rgba] = currentStyle.split(' ');
    const currentValues = rgba.match(/\(([^)]+)\)/)[1].split(',').map(v => v.trim());

    const newStyle = `${params.width || width} solid rgba(${
      params.color1 ?? currentValues[0]}, ${
      params.color2 ?? currentValues[1]}, ${
      params.color3 ?? currentValues[2]}, ${
      params.opacity ?? currentValues[3]})`;

    parent.style.borderBottom = newStyle;
  } catch (e) {
    parent.style.borderBottom = defaultStyle;
  }
} 