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
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-MLJNQT488S');
// NOTE: also add this to <head>:
// <script async src="https://www.googletagmanager.com/gtag/js?id=G-MLJNQT488S"></script>


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
var SUPABASE_URL = 'https://ttdflvmphpbuvfeeuwzo.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0ZGZsdm1waHBidXZmZWV1d3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MzA3MTQsImV4cCI6MjA5MTQwNjcxNH0.b7Te8Y9ni7iuI5ACRTuhWN_8xPd83HbYfs-Ahsla9lw';

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

  return fetch(SUPABASE_URL + '/rest/v1/waitlist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(payload)
  });

  console.log('Waitlist payload:', payload);
  return Promise.resolve();
}


// ----- FORM HANDLER -----
// Call from each page: handleSubmit(event, 'heroForm', 'recover')
function handleSubmit(e, formId, protocol) {
  e.preventDefault();
  var wrap = document.getElementById(formId);
  var email = wrap.querySelector('.email-input').value;

  submitWaitlist(email, protocol).then(function (res) {
    if (!res.ok) return;
    try {
      fetch(SUPABASE_URL + '/functions/v1/send-welcome-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + SUPABASE_KEY
        },
        body: JSON.stringify({ email: email, protocol: protocol })
      }).catch(function (err) {
        console.error(err);
      });
    } catch (err) {
      console.error(err);
    }
  });

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
