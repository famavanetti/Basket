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
})();
