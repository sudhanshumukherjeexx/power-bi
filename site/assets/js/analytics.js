/* Privacy-respecting page-view counts (Cloudflare Web Analytics), loaded only when a site token is configured in
   content/site.json (the build then adds <meta name="pbi-analytics"> and this script). Cookieless and aggregate.
   It never runs when:
     - the learner opted out on the progress page (localStorage pbi-analytics-off), or
     - the browser sends Do Not Track or Global Privacy Control, or
     - the page is a local preview, or
     - the address carries a search (#q=, ?q=), so search text can't reach the beacon.
   Nothing about progress, answers, notes or imports is ever sent: none of it is in a URL. See PRIVACY.md. */
(function(){
'use strict';
var m=document.querySelector('meta[name="pbi-analytics"]');if(!m)return;
var parts=(m.getAttribute('content')||'').split(':');if(parts[0]!=='cloudflare'||!/^[a-f0-9]{32}$/.test(parts[1]||''))return;
try{if(localStorage.getItem('pbi-analytics-off')==='1')return}catch(e){}
if(navigator.globalPrivacyControl===true||navigator.doNotTrack==='1'||window.doNotTrack==='1')return;
if(location.protocol!=='https:'||/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname))return;
if(/(^|[#?&])q=/.test(location.hash+location.search))return;
var s=document.createElement('script');
s.defer=true;s.src='https://static.cloudflareinsights.com/beacon.min.js';
/* spa:false: count page loads only, never in-page navigation (which is where search terms live) */
s.setAttribute('data-cf-beacon',JSON.stringify({token:parts[1],spa:false}));
document.head.appendChild(s);
})();
