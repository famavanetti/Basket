/* Sincronizzazione online (Firebase Firestore). Se FB_CONFIG è vuoto non fa nulla. */
(function(){
var C=window.FB_CONFIG,S=window.rbSync={on:false,st:''};
if(!C||!C.apiKey)return;
S.on=true;
var base='https://www.gstatic.com/firebasejs/10.12.2/',P=null,db=null,GK='referto_archivio_v1',AKEY='rb_anagrafica_v1',CL={},cbs=[],started=false;
function load(src){return new Promise(function(ok,ko){var t=document.createElement('script');t.src=src;t.crossOrigin='anonymous';t.onload=ok;t.onerror=function(){ko(new Error('load'))};document.head.appendChild(t)})}
function badge(){if(/referto\.html/.test(location.pathname))return;var b=document.getElementById('rbcloud');
 if(!b){b=document.createElement('div');b.id='rbcloud';b.style.cssText='position:fixed;right:8px;bottom:calc(8px + env(safe-area-inset-bottom,0px));font:600 11px Montserrat,system-ui,sans-serif;background:#0b1233e6;color:#eef1fb;border:1px solid #2a3570;border-radius:12px;padding:3px 9px;z-index:50;pointer-events:none';document.body.appendChild(b)}
 b.textContent=S.st==='ok'?(navigator.onLine?'☁ sincronizzato':'☁ offline: dati salvati sul dispositivo'):S.st==='err'?'☁ non collegato':'☁ connessione…'}
addEventListener('online',function(){badge();S.pushAll();S.anagPush()});addEventListener('offline',badge);
function login(){if(sessionStorage.getItem('rb_nologin'))return Promise.reject(new Error('nologin'));
 var pw=prompt('Password staff per la sincronizzazione online (si chiede una sola volta su questo dispositivo):');
 if(!pw){sessionStorage.setItem('rb_nologin','1');return Promise.reject(new Error('nologin'))}
 return firebase.auth().signInWithEmailAndPassword(C.email,pw).catch(function(e){alert('Password errata o account non valido.');throw e})}
function init(){if(P)return P;S.st='';
 P=load(base+'firebase-app-compat.js').then(function(){return load(base+'firebase-auth-compat.js')}).then(function(){return load(base+'firebase-firestore-compat.js')}).then(function(){
  firebase.initializeApp(C);db=firebase.firestore();try{db.enablePersistence({synchronizeTabs:true}).catch(function(){})}catch(e){}
  return new Promise(function(ok){var un=firebase.auth().onAuthStateChanged(function(u){un();ok(u)})})
 }).then(function(u){return u||login()}).then(function(u){S.st='ok';badge();return u},function(e){S.st='err';badge();throw e});
 return P}
S.ready=init;
function docId(u){return String(u).replace(/[\/\s]+/g,'_').slice(0,200)}
/* ---- partite ---- */
S.pushGame=function(it){return init().then(function(){var o=JSON.parse(JSON.stringify(it));delete o.cl;if(JSON.stringify(o).length>900000)delete o.html;return db.collection('partite').doc(docId(o.uid)).set(o)})};
function mark(id,uid){try{var a=JSON.parse(localStorage.getItem(GK)||'[]');a.forEach(function(x){if(x.id===id){x.cl=1;x.uid=uid}});localStorage.setItem(GK,JSON.stringify(a))}catch(e){}}
S.pushAll=function(){var a;try{a=JSON.parse(localStorage.getItem(GK)||'[]')}catch(e){a=[]}
 return Promise.all(a.filter(function(x){return!x.cl}).map(function(it){if(!it.uid)it.uid='o'+it.id+'|'+it.a+'|'+it.b+'|'+it.d;return S.pushGame(it).then(function(){mark(it.id,it.uid)})})).catch(function(){})};
S.watchGames=function(cb){return init().then(function(){db.collection('partite').onSnapshot(function(s){var r=[];s.docChanges().forEach(function(c){if(c.type!=='removed')r.push(c.doc.data())});if(r.length)cb(r)},function(){})}).catch(function(){})};
S.delGame=function(uid){return init().then(function(){return db.collection('partite').doc(docId(uid)).delete()}).catch(function(){})};
/* ---- anagrafica (una persona = un documento, chiave = tipo+squadra+genere+cognome+nome) ---- */
function an(s){return String(s==null?'':s).toLowerCase().replace(/[^a-z0-9]/g,'')}
function akey(x){return'p_'+[x.tipo,an(x.squadra),an(x.genere),an(x.cognome),an(x.nome)].join('_')}
function strip(x){return{tipo:x.tipo||'giocatore',squadra:x.squadra||'',genere:x.genere||'',cognome:x.cognome||'',nome:x.nome||'',numero:x.numero==null?'':String(x.numero),ruolo:x.ruolo||'',lic:x.lic||''}}
function sig(x){return JSON.stringify(strip(x))}
function aget(){try{var a=JSON.parse(localStorage.getItem(AKEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
S.anagPush=function(){return init().then(function(){var cur={},c=db.collection('anagrafica'),now=Date.now();aget().forEach(function(x){cur[akey(x)]=x});
 Object.keys(cur).forEach(function(k){var s=sig(cur[k]);if(CL[k]!==s){CL[k]=s;c.doc(k).set(Object.assign(strip(cur[k]),{del:0,u:now}))}});
 Object.keys(CL).forEach(function(k){if(!cur[k]&&CL[k]!==null){CL[k]=null;c.doc(k).set({del:1,u:now})}})}).catch(function(){})};
S.anagStart=function(cb){if(cb)cbs.push(cb);if(started)return;started=true;
 init().then(function(){db.collection('anagrafica').onSnapshot(function(s){var map={},ch=false;aget().forEach(function(x){map[akey(x)]=x});
  s.forEach(function(d){var k=d.id,v=d.data(),l=map[k];
   if(v.del){if(l&&CL[k]===sig(l)){delete map[k];ch=true}if(!l||CL[k]===undefined)CL[k]=null;return}
   var sg=sig(v);
   if(!l){map[k]=Object.assign({id:'x'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)},strip(v));CL[k]=sg;ch=true}
   else if(sig(l)!==sg){if(CL[k]===undefined||CL[k]===sig(l)){map[k]=Object.assign({id:l.id},strip(v));CL[k]=sg;ch=true}}
   else CL[k]=sg});
  if(ch){try{localStorage.setItem(AKEY,JSON.stringify(Object.keys(map).map(function(k){return map[k]})))}catch(e){}cbs.forEach(function(f){try{f()}catch(e){}})}
  if(!s.metadata.fromCache)S.anagPush()},function(){})}).catch(function(){})};
/* ---- scadenze (nascita, visita medica, tesseramento): dati sensibili.
   Sul cloud vanno SOLO CIFRATE sul dispositivo (AES-GCM 256, chiave derivata dal codice dello staff con PBKDF2).
   Senza il codice il contenuto della collezione 'scadenze' non e' leggibile, nemmeno per chi accede a Firebase. ---- */
var SCS='rb_scadenze_v1',SCKS='rb_sck_v1',SCL={},SK=null,SKID='',scStarted=false,scSynced=false,scUnsub=null;
function sby(s){return new TextEncoder().encode(s)}
function b64(b){var a=new Uint8Array(b),s='';for(var i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return btoa(s)}
function ub64(s){var t=atob(s),a=new Uint8Array(t.length);for(var i=0;i<t.length;i++)a[i]=t.charCodeAt(i);return a}
function scRd(){try{var o=JSON.parse(localStorage.getItem(SCS)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{}}catch(e){return{}}}
function scWr(o){try{localStorage.setItem(SCS,JSON.stringify(o))}catch(e){}}
function ssig(e){return JSON.stringify([e.n||'',e.v||'',e.t||''])}
function sent(p){return{n:p.n||'',v:p.v||'',t:p.t||''}}
function sder(pass,salt){return crypto.subtle.importKey('raw',sby(pass),'PBKDF2',false,['deriveKey']).then(function(m){return crypto.subtle.deriveKey({name:'PBKDF2',salt:salt,iterations:250000,hash:'SHA-256'},m,{name:'AES-GCM',length:256},true,['encrypt','decrypt'])})}
function senc(key,obj){var iv=crypto.getRandomValues(new Uint8Array(12));return crypto.subtle.encrypt({name:'AES-GCM',iv:iv},key,sby(JSON.stringify(obj))).then(function(ct){return{iv:b64(iv),ct:b64(ct)}})}
function sdec(key,d){return crypto.subtle.decrypt({name:'AES-GCM',iv:ub64(d.iv)},key,ub64(d.ct)).then(function(p){return JSON.parse(new TextDecoder().decode(p))})}
function sid(k){return crypto.subtle.digest('SHA-256',sby('sc|'+k)).then(function(h){var a=new Uint8Array(h),s='';for(var i=0;i<16;i++)s+=('0'+a[i].toString(16)).slice(-2);return'd'+s})}
function skLoad(){try{var o=JSON.parse(localStorage.getItem(SCKS)||'null');if(!o||!o.jwk)return Promise.resolve(false);
 return crypto.subtle.importKey('jwk',o.jwk,{name:'AES-GCM'},true,['encrypt','decrypt']).then(function(k){SK=k;SKID=o.kid;return true},function(){return false})}catch(e){return Promise.resolve(false)}}
function skSet(key,kid){SK=key;SKID=kid;return crypto.subtle.exportKey('jwk',key).then(function(j){try{localStorage.setItem(SCKS,JSON.stringify({kid:kid,jwk:j}))}catch(e){}})}
function scNote(){cbs.forEach(function(f){try{f()}catch(e){}})}
function scMeta(pass){var salt=crypto.getRandomValues(new Uint8Array(16)),kid=b64(crypto.getRandomValues(new Uint8Array(9)));
 return sder(pass,salt).then(function(k){return senc(k,{ok:1}).then(function(chk){return{key:k,kid:kid,meta:{salt:b64(salt),kid:kid,chk:chk,u:Date.now()}}})})}
function scListen(){if(scStarted||!SK)return;scStarted=true;scSynced=false;
 init().then(function(){scUnsub=db.collection('scadenze').onSnapshot(function(s){var meta=null,docs=[];s.forEach(function(d){if(d.id==='meta')meta=d.data();else docs.push(d)});
  if(!SK)return;
  if(meta&&meta.kid!==SKID){S.scLock();scNote();return}
  var cur=scRd();
  Promise.all(Object.keys(cur).map(function(k){return sid(k).then(function(i){return[i,k]})})).then(function(pr){var i2k={};pr.forEach(function(p){i2k[p[0]]=p[1]});
   return Promise.all(docs.map(function(d){var v=d.data();if(v.del)return{id:d.id,del:1};return sdec(SK,v).then(function(p){return{id:d.id,p:p}},function(){return null})})).then(function(rs){
    var map=scRd(),ch=false;
    rs.forEach(function(r){if(!r)return;
     if(r.del){var k=i2k[r.id];if(k){if(map[k]&&SCL[k]===ssig(map[k])){delete map[k];ch=true}if(!map[k]||SCL[k]===undefined)SCL[k]=null}return}
     var p=r.p,k=p.k,sg=ssig(p),l=map[k];
     if(!l){map[k]=sent(p);SCL[k]=sg;ch=true}
     else if(ssig(l)!==sg){if(SCL[k]===undefined||SCL[k]===ssig(l)){map[k]=sent(p);SCL[k]=sg;ch=true}}
     else SCL[k]=sg});
    if(ch){scWr(map);scNote()}
    scSynced=true;if(!s.metadata.fromCache)S.scPush()})})
 },function(){scStarted=false})}).catch(function(){scStarted=false})}
S.scOn=function(){return!!SK};
S.scPush=function(){if(!SK||!scSynced)return Promise.resolve();
 return init().then(function(){var cur=scRd(),c=db.collection('scadenze'),now=Date.now(),jobs=[];
  Object.keys(cur).forEach(function(k){var e=cur[k];if(!(e.n||e.v||e.t))return;var sg=ssig(e);
   if(SCL[k]!==sg){SCL[k]=sg;jobs.push(Promise.all([sid(k),senc(SK,{k:k,n:e.n||'',v:e.v||'',t:e.t||''})]).then(function(r){return c.doc(r[0]).set({iv:r[1].iv,ct:r[1].ct,del:0,u:now})}))}});
  Object.keys(SCL).forEach(function(k){var e=cur[k];if((!e||!(e.n||e.v||e.t))&&SCL[k]!==null){SCL[k]=null;jobs.push(sid(k).then(function(i){return c.doc(i).set({del:1,u:now})}))}});
  return Promise.all(jobs)}).catch(function(){})};
function scGetMeta(n){return db.collection('scadenze').doc('meta').get({source:'server'}).catch(function(e){var m=String(e&&e.message||'');
 if(n>0&&e&&(e.code==='unavailable'||/offline/i.test(m)))return new Promise(function(r){setTimeout(r,1500)}).then(function(){return scGetMeta(n-1)});throw e})}
/* attiva su questo dispositivo: con un codice gia' esistente si unisce; se non esiste ancora serve crearlo (pass2 = ripetizione) */
S.scEnable=function(pass,pass2){
 if(!window.crypto||!crypto.subtle)return Promise.reject(new Error('Questo browser non supporta la cifratura (serve https).'));
 if(!pass)return Promise.reject(new Error('Inserisci il codice.'));
 return init().then(function(){return scGetMeta(3)},function(){throw new Error('Sincronizzazione online non disponibile.')})
 .then(function(m){
  if(m.exists){var d=m.data();return sder(pass,ub64(d.salt)).then(function(k){return sdec(k,d.chk).then(function(){return skSet(k,d.kid)},function(){throw new Error('Codice errato.')})}).then(function(){scListen();return'joined'})}
  if(pass2===undefined)throw new Error('NUOVO');
  if(String(pass).length<12)throw new Error('Il codice deve avere almeno 12 caratteri.');
  if(pass!==pass2)throw new Error('I due codici non coincidono.');
  return scMeta(pass).then(function(r){return db.collection('scadenze').doc('meta').set(r.meta).then(function(){return skSet(r.key,r.kid)})}).then(function(){scListen();return'created'})
 },function(e){var c=e&&e.code,m=String(e&&e.message||'');if(/^Sincroniz|^Questo browser|^Inserisci/.test(m))throw e;
  if(c==='permission-denied')throw new Error('Firebase rifiuta l\'accesso alla collezione "scadenze": pubblica le regole aggiornate (con scadenze) e controlla che l\'email nelle regole sia quella dell\'account staff.');
  if(c==='unavailable'||c==='deadline-exceeded'||/offline/i.test(m))throw new Error('Firestore non raggiungibile ('+(c||'offline')+'): controlla internet, VPN o blocco pubblicità e riprova.');
  throw new Error('Errore Firebase'+(c?' ('+c+')':'')+': '+m.slice(0,120))})};
/* cambia il codice: ricifra tutto con una nuova chiave; gli altri dispositivi dovranno reinserire il codice */
S.scChange=function(pass,pass2){
 if(!SK)return Promise.reject(new Error('Prima attiva la sincronizzazione.'));
 if(String(pass||'').length<12)return Promise.reject(new Error('Il codice deve avere almeno 12 caratteri.'));
 if(pass!==pass2)return Promise.reject(new Error('I due codici non coincidono.'));
 return init().then(function(){return scMeta(pass)}).then(function(r){var cur=scRd(),c=db.collection('scadenze'),ks=Object.keys(cur).filter(function(k){var e=cur[k];return e.n||e.v||e.t});
  return Promise.all(ks.map(function(k){return Promise.all([sid(k),senc(r.key,{k:k,n:cur[k].n||'',v:cur[k].v||'',t:cur[k].t||''})])})).then(function(rows){
   var b=db.batch(),now=Date.now();b.set(c.doc('meta'),r.meta);rows.forEach(function(x){b.set(c.doc(x[0]),{iv:x[1].iv,ct:x[1].ct,del:0,u:now})});
   return b.commit().then(function(){return skSet(r.key,r.kid)}).then(function(){ks.forEach(function(k){SCL[k]=ssig(cur[k])});return'changed'})})})};
/* disattiva su questo dispositivo: dimentica la chiave (i dati locali restano, il cloud non viene toccato) */
S.scLock=function(){SK=null;SKID='';scStarted=false;scSynced=false;SCL={};try{localStorage.removeItem(SCKS)}catch(e){}if(scUnsub){try{scUnsub()}catch(e){}scUnsub=null}};
S.scReady=(window.crypto&&crypto.subtle)?skLoad():Promise.resolve(false);
var _as=S.anagStart;S.anagStart=function(cb){var r=_as(cb);S.scReady.then(function(ok){if(ok)scListen()});return r};
addEventListener('online',function(){S.scPush()});
})();
