// =============================================
// Baseline — Shared Tracking & Data Layer
// =============================================
// Load this in <head> of every page:
// <script src="/shared/tracking.js"></script>

// ----- META PIXEL (replace YOUR_PIXEL_ID) -----
// !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
// n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
// n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
// t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
// document,'script','https://connect.facebook.net/en_US/fbevents.js');
// fbq('init', 'YOUR_PIXEL_ID');
// fbq('track', 'PageView');

// ----- GA4 (replace G-YOUR_ID) -----
// window.dataLayer = window.dataLayer || [];
// function gtag(){dataLayer.push(arguments);}
// gtag('js', new Date());
// gtag('config', 'G-YOUR_ID');
// NOTE: also add this to <head>:
// <script async src="https://www.googletagmanager.com/gtag/js?id=G-YOUR_ID"></script>


// ----- UTM PARSING -----
function getUtmParams() {
  var params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_content: params.get('utm_content') || '',
    utm_term: params.get('utm_term') || ''
  };
}


// ----- SUPABASE WAITLIST SUBMISSION -----
// Replace YOUR_PROJECT and YOUR_ANON_KEY before going live.
var SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
var SUPABASE_KEY = 'YOUR_ANON_KEY';

function submitWaitlist(email, protocol) {
  var utms = getUtmParams();

  var payload = {
    email: email,
    protocol: protocol,
    source: utms.utm_source || 'direct',
    utm_source: utms.utm_source,
    utm_medium: utms.utm_medium,
    utm_campaign: utms.utm_campaign,
    utm_content: utms.utm_content,
    utm_term: utms.utm_term
  };

  // Uncomment when Supabase is ready:
  // return fetch(SUPABASE_URL + '/rest/v1/waitlist', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'apikey': SUPABASE_KEY,
  //     'Authorization': 'Bearer ' + SUPABASE_KEY,
  //     'Prefer': 'return=minimal'
  //   },
  //   body: JSON.stringify(payload)
  // });

  console.log('Waitlist payload:', payload);
  return Promise.resolve();
}


// ----- FORM HANDLER -----
// Call from each page: handleSubmit(event, 'heroForm', 'recover')
function handleSubmit(e, formId, protocol) {
  e.preventDefault();
  var wrap = document.getElementById(formId);
  var email = wrap.querySelector('.email-input').value;

  submitWaitlist(email, protocol);

  // Fire Meta pixel Lead event
  if (typeof fbq !== 'undefined') {
    fbq('track', 'Lead', { content_name: protocol + '_waitlist' });
  }

  // Fire GA4 sign_up event
  if (typeof gtag !== 'undefined') {
    gtag('event', 'sign_up', { method: 'waitlist', protocol: protocol });
  }

  wrap.classList.add('submitted');
}
