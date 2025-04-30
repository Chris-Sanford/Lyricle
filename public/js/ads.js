// Ads management script

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

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Initial check
  checkScreenSizeForAds();
  
  // Recheck on window resize
  window.addEventListener('resize', checkScreenSizeForAds);
}); 