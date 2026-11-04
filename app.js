/* ====== CONFIGURAZIONE ======  Cambia qui il PIN dello staff.
   ATTENZIONE: è un PIN "di comodo": chi legge il codice lo vede. */
var PIN_CORRETTO='1234';
var AUTH_KEY='rb_auth', AUTH_GIORNI=14, ANAG_KEY='rb_anagrafica_v1';

function isAuth(){try{var t=+localStorage.getItem(AUTH_KEY);return t&&Date.now()-t<AUTH_GIORNI*864e5}catch(e){return false}}
function login(){try{localStorage.setItem(AUTH_KEY,Date.now())}catch(e){}}
function logout(){try{localStorage.removeItem(AUTH_KEY)}catch(e){}location.replace('index.html')}
function richiediLogin(){if(!isAuth())location.replace('index.html')}
function anagGet(){try{var a=JSON.parse(localStorage.getItem(ANAG_KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
function anagPut(a){try{localStorage.setItem(ANAG_KEY,JSON.stringify(a));return true}catch(e){return false}}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

if('serviceWorker' in navigator)addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})});

/* pulsante Installa */
var _dip=null;
addEventListener('beforeinstallprompt',function(e){e.preventDefault();_dip=e;var b=document.getElementById('install');if(b)b.style.display='block'});
function installa(){if(_dip){_dip.prompt();_dip=null;document.getElementById('install').style.display='none'}}
