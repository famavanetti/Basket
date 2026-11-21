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
/* accesso al database senza password staff, via REST (le regole lasciano leggere solo 'persone' e aggiungere righe a 'accessi') */
function cfg(){return window.FB_CONFIG||{}}
function base(){var c=cfg();return c.projectId?'https://firestore.googleapis.com/v1/projects/'+c.projectId+'/databases/(default)/documents':''}
function fsParse(f){if(!f)return null;if('stringValue' in f)return f.stringValue;if('integerValue' in f)return+f.integerValue;if('doubleValue' in f)return f.doubleValue;if('booleanValue' in f)return f.booleanValue;if('arrayValue' in f)return(f.arrayValue.values||[]).map(fsParse);if('mapValue' in f){var o={},m=f.mapValue.fields||{};Object.keys(m).forEach(function(k){o[k]=fsParse(m[k])});return o}return null}
function fsVal(v){if(v==null)return{nullValue:null};if(typeof v==='number')return Number.isInteger(v)?{integerValue:String(v)}:{doubleValue:v};if(typeof v==='boolean')return{booleanValue:v};if(Array.isArray(v))return{arrayValue:{values:v.map(fsVal)}};return{stringValue:String(v)}}
function restRefresh(){var b=base();if(!b||!cfg().apiKey||navigator.onLine===false)return Promise.resolve(false);
 return fetch(b+'/persone?pageSize=300&key='+encodeURIComponent(cfg().apiKey)).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()}).then(function(j){var l=(j.documents||[]).map(function(d){var o={},f=d.fields||{};Object.keys(f).forEach(function(k){o[k]=fsParse(f[k])});o.id=d.name.split('/').pop();return o});Sv(PK,{list:l,ts:Date.now(),empty:l.length?0:1});return true}).catch(function(){return false})}
function restFlush(q){var b=base();if(!b)return Promise.reject();var ws=q.map(function(e){var f={};Object.keys(e).forEach(function(k){f[k]=fsVal(e[k])});return{update:{name:'projects/'+cfg().projectId+'/databases/(default)/documents/accessi/r'+Date.now().toString(36)+Math.random().toString(36).slice(2,8),fields:f}}});
 var parts=[];for(var i=0;i<ws.length;i+=100)parts.push(ws.slice(i,i+100));
 return parts.reduce(function(p,w){return p.then(function(){return fetch(b+':commit?key='+encodeURIComponent(cfg().apiKey),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({writes:w})}).then(function(r){if(!r.ok)throw new Error(r.status)})})},Promise.resolve())}
/* elenco persone dal cloud (copia locale per l'uso offline) */
function refresh(){return restRefresh().then(function(ok){return ok||refresh_()})}
function refresh_(){if(!window.rbSync||!rbSync.on||!rbSync.db)return Promise.resolve(false);
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
function flush(){if(fl||navigator.onLine===false)return;var q=J(QK,[]);if(!q.length)return;fl=true;var n0=q.length;
 restFlush(q).then(function(){Sv(QK,J(QK,[]).slice(n0));fl=false},function(){fl=false;flush_(q)})}
function flush_(q){if(fl||!window.rbSync||!rbSync.on||!rbSync.db)return;fl=true;
 rbSync.db().then(function(db){var n=q.length,b=db.batch(),c=db.collection('accessi');q.forEach(function(e){b.set(c.doc(),e)});return b.commit().then(function(){var cur=J(QK,[]);Sv(QK,cur.slice(n))})}).catch(function(){}).then(function(){fl=false})}
/* limitazione per squadra: chi ha squadre assegnate vede e modifica solo l'anagrafica di quelle squadre */
function lbl(x){return((x.squadra||'')+' '+(x.genere||'')).trim().replace(/\s+/g,' ')}
function myTeams(){if(page()==='admin.html')return null;var w=who();return w&&w.teams&&w.teams.length?w.teams:null}
function inScope(x,t){if(!x||x.tipo==='societa')return false;var l=lbl(x);return t.indexOf(l)>=0||(x.tipo==='staff'&&!l)}
function scope(list){var t=myTeams();if(!t)return list;return list.filter(function(x){return x&&(x.tipo==='societa'||inScope(x,t))})}
function nz(s){return String(s==null?'':s).toLowerCase().replace(/[^a-z0-9]/g,'')}
function teamOk(name){var t=myTeams();if(!t)return true;var n=nz(name);return t.some(function(x){var m=nz(x);return n&&m&&(n.indexOf(m)>=0||m.indexOf(n)>=0)})}
function need(){if(!who())location.replace('accesso.html?next='+encodeURIComponent(page()+location.search))}
function pageLog(){var w=who();if(!w)return;touch();var k='rb_pl_'+page(),t=+sessionStorage.getItem(k)||0;if(Date.now()-t<20*60000)return;try{sessionStorage.setItem(k,Date.now())}catch(e){}log('pagina','')}
window.rbAcl={scope:scope,teamOk:teamOk,myTeams:myTeams,who:who,persons:persons,pdata:pdata,refresh:refresh,login:login,loginAnon:loginAnon,logout:logout_,log:log,flush:flush,need:need,pin:pin,sha:sha};
if(typeof window.anagGet==='function'&&typeof window.anagPut==='function'){var _ag=window.anagGet,_ap=window.anagPut;
 window.anagGet=function(){return scope(_ag())};
 window.anagPut=function(a){var t=myTeams();if(!t)return _ap(a);var keep=_ag().filter(function(x){return!(x&&(inScope(x,t)))});return _ap(keep.concat((a||[]).filter(function(x){return inScope(x,t)})))}}
/* sostituisce richiediLogin() e logout() di app.js: oltre al PIN dello staff serve la persona identificata */
if(typeof window.isAuth==='function'){window.richiediLogin=function(){if(!isAuth())location.replace('index.html');else need()};
 window.logout=function(){try{logout_()}catch(e){}try{localStorage.removeItem('rb_auth')}catch(e){}location.replace('index.html')}}
addEventListener('load',function(){if(page()!=='accesso.html'&&page()!=='admin.html')pageLog();setTimeout(flush,2000)});
addEventListener('online',flush);
})();
