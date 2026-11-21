/* Identità della persona (nome + PIN personale) e storico degli accessi. Condiviso da tutte le pagine. */
(function(){
var WK='rb_who',PK='rb_persone_v1',QK='rb_acclog_q',W=12*36e5;
function J(k,d){try{var v=JSON.parse(localStorage.getItem(k)||'null');return v==null?d:v}catch(e){return d}}
function Sv(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function who(){var w=J(WK,null);return w&&w.t&&Date.now()-w.t<W?w:null}
function pdata(){var d=J(PK,null);return d&&Array.isArray(d.list)?d:{list:[],ts:0,empty:0}}
function persons(){return pdata().list.filter(function(p){return p.active!==0})}
function sha(s){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)).then(function(b){return Array.prototype.map.call(new Uint8Array(b),function(x){return('0'+x.toString(16)).slice(-2)}).join('')})}
function pin(id,p){return sha(id+':'+p)}
function page(){return location.pathname.split('/').pop()||'index.html'}
/* elenco persone dal cloud (copia locale per l'uso offline) */
function refresh(){if(!window.rbSync||!rbSync.on||!rbSync.db)return Promise.resolve(false);
 return rbSync.db().then(function(db){return db.collection('persone').get({source:'server'}).catch(function(){return db.collection('persone').get()}).then(function(s){
  var l=[];s.forEach(function(d){var v=d.data();v.id=d.id;l.push(v)});Sv(PK,{list:l,ts:Date.now(),empty:(!l.length&&!s.metadata.fromCache)?1:0});return true})}).catch(function(){return false})}
function login(id,p){var pe=pdata().list.filter(function(x){return x.id===id&&x.active!==0})[0];if(!pe)return Promise.resolve(false);
 return pin(id,p).then(function(h){if(h!==pe.ph){log('PIN errato','tentativo per '+pe.name);return false}
  Sv(WK,{id:pe.id,name:pe.name,teams:pe.teams||[],t:Date.now()});log('accesso','');return true})}
function loginAnon(){Sv(WK,{id:'',name:'(non configurato)',teams:[],t:Date.now()})}
function logout_(){log('uscita','');try{localStorage.removeItem(WK)}catch(e){}}
function touch(){var w=J(WK,null);if(w&&w.t){w.t=Date.now();Sv(WK,w)}}
/* storico: si accoda sul dispositivo e parte appena c'è la rete */
function log(a,d){var w=J(WK,null)||{};var q=J(QK,[]);q.push({t:Date.now(),pid:w.id||'',name:w.name||'',page:page(),a:a,d:String(d||'').slice(0,200)});Sv(QK,q.slice(-500));setTimeout(flush,400)}
var fl=false;
function flush(){if(fl||!window.rbSync||!rbSync.on||!rbSync.db||navigator.onLine===false)return;var q=J(QK,[]);if(!q.length)return;fl=true;
 rbSync.db().then(function(db){var n=q.length,b=db.batch(),c=db.collection('accessi');q.forEach(function(e){b.set(c.doc(),e)});return b.commit().then(function(){var cur=J(QK,[]);Sv(QK,cur.slice(n))})}).catch(function(){}).then(function(){fl=false})}
function need(){if(!who())location.replace('accesso.html?next='+encodeURIComponent(page()+location.search))}
function pageLog(){var w=who();if(!w)return;touch();var k='rb_pl_'+page(),t=+sessionStorage.getItem(k)||0;if(Date.now()-t<20*60000)return;try{sessionStorage.setItem(k,Date.now())}catch(e){}log('pagina','')}
window.rbAcl={who:who,persons:persons,pdata:pdata,refresh:refresh,login:login,loginAnon:loginAnon,logout:logout_,log:log,flush:flush,need:need,pin:pin,sha:sha};
/* sostituisce richiediLogin() e logout() di app.js: oltre al PIN dello staff serve la persona identificata */
if(typeof window.isAuth==='function'){window.richiediLogin=function(){if(!isAuth())location.replace('index.html');else need()};
 window.logout=function(){try{logout_()}catch(e){}try{localStorage.removeItem('rb_auth')}catch(e){}location.replace('index.html')}}
addEventListener('load',function(){if(page()!=='accesso.html'&&page()!=='admin.html')pageLog();setTimeout(flush,2000)});
addEventListener('online',flush);
})();
