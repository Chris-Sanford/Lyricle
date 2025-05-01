// Ads management script

// Flags to track ad state
let adsInitialized = false;
let gameFullyLoaded = false;
let howToPlayModalDismissed = false;

// Function to check if the screen size allows for vertical ads
function checkScreenSizeForAds() {
  const adContainers = document.querySelectorAll('.lyricle-ad-container');
  
  // Minimum width in pixels required to display ads comfortably
  const minimumScreenWidth = 1200;
  
  // Check if the window width is wide enough for ads
  if (window.innerWidth >= minimumScreenWidth) {
    // Show ads
    adContainers.forEach(container => {
      container.style.display = 'block';
    });
    
    // Apply padding to body to make space for ads
    document.body.style.paddingLeft = '160px';
    document.body.style.paddingRight = '160px';
    
    // For very large screens, adjust the positioning
    if (window.innerWidth >= 1400) {
      document.querySelector('.lyricle-ad-left').style.left = '20px';
      document.querySelector('.lyricle-ad-right').style.right = '20px';
      document.body.style.paddingLeft = '180px';
      document.body.style.paddingRight = '180px';
    }
  } else {
    // Hide ads
    adContainers.forEach(container => {
      container.style.display = 'none';
    });
    
    // Remove padding
    document.body.style.paddingLeft = '0';
    document.body.style.paddingRight = '0';
  }
}

// Function to check if all conditions for loading ads are met
function checkAndInitializeAds() {
  if (adsInitialized) {
    return; // Already initialized
  }
  
  // Only initialize ads if both conditions are met
  if (gameFullyLoaded && howToPlayModalDismissed) {
    console.log("All conditions met, initializing ads now");
    initializeAds();
  } else {
    console.log("Ads not initialized: gameLoaded=" + gameFullyLoaded + ", modalDismissed=" + howToPlayModalDismissed);
  }
}

// Function to initialize Google ads
function initializeAds() {
  if (adsInitialized) {
    return; // Prevent duplicate initialization
  }
  
  console.log("Initializing Google Ads");
  
  // Get all ad containers
  const adSlots = document.querySelectorAll('ins.adsbygoogle');
  
  // Initialize each ad slot
  adSlots.forEach(adSlot => {
    try {
      (adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("Error initializing ad:", e);
    }
  });
  
  adsInitialized = true;
}

// Create global functions that can be called from other modules
window.loadAdsWhenGameReady = function() {
  gameFullyLoaded = true;
  checkAndInitializeAds();
};

window.loadAdsWhenHowToPlayDismissed = function() {
  howToPlayModalDismissed = true;
  checkAndInitializeAds();
};

// Initialize screen size checks on page load
document.addEventListener('DOMContentLoaded', function() {
  // Initial check for ad container visibility
  checkScreenSizeForAds();
  
  // Recheck on window resize
  window.addEventListener('resize', checkScreenSizeForAds);
  
  // Note: We don't initialize ads here - will be done after game loads and modal is dismissed
}); 