/* Calendario del campionato: importa da Excel/CSV o testo incollato, o inserisci a mano. Condiviso da referto.html e referto_tiri.html */
(function(){
var K='rb_cal_v1',KM='rb_cal_me',st={q:'',who:null,msg:''},cfg=null,el=null;
function get(){try{var a=JSON.parse(localStorage.getItem(K)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
function save(a){try{localStorage.setItem(K,JSON.stringify(a))}catch(e){alert('Memoria piena')}}
function norm(s){return String(s==null?'':s).toLowerCase().replace(/[^a-z0-9]/g,'')}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function iso(y,m,d){y=+y;if(y<100)y+=2000;m=+m;d=+d;if(m<1||m>12||d<1||d>31)return'';return y+'-'+('0'+m).slice(-2)+'-'+('0'+d).slice(-2)}
function toDate(v){
 if(v instanceof Date&&!isNaN(v))return v.getFullYear()+'-'+('0'+(v.getMonth()+1)).slice(-2)+'-'+('0'+v.getDate()).slice(-2);
 if(typeof v==='number'&&v>30000&&v<80000){var d=new Date(Math.round((v-25569)*864e5));return d.getUTCFullYear()+'-'+('0'+(d.getUTCMonth()+1)).slice(-2)+'-'+('0'+d.getUTCDate()).slice(-2)}
 var s=String(v==null?'':v),m=s.match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);if(m)return iso(m[3],m[2],m[1]);
 m=s.match(/(\d{4})-(\d{2})-(\d{2})/);if(m)return iso(m[1],m[2],m[3]);return''}
function isDateCell(v){return!!toDate(v)&&!(typeof v==='string'&&v.length>25)}
function isTime(v){return/^\d{1,2}[:.]\d{2}$/.test(String(v).trim())}
function splitVs(s){var m=String(s).split(/\s+(?:-|–|—|vs\.?|v)\s+|\s*\/\/\s*/i);return m.length===2&&m[0].trim()&&m[1].trim()?[m[0].trim(),m[1].trim()]:null}
function parseRows(rows){
 var out=[],hc=-1,cd=-1,ch=-1,ca=-1,i,j;
 for(i=0;i<Math.min(rows.length,15)&&hc<0;i++){var r=rows[i].map(function(c){return String(c==null?'':c).toLowerCase()}),a=-1,b=-1,d=-1;
  r.forEach(function(c,k){if(/casa|home|squadra\s*(1|a)\b|prima/.test(c))a=k;else if(/ospit|trasf|away|squadra\s*(2|b)\b|second/.test(c))b=k;if(/^(data|giorno|date)/.test(c))d=k});
  if(a>=0&&b>=0){hc=i;ch=a;ca=b;cd=d}}
 for(i=hc+1;i<rows.length;i++){var r=rows[i];if(!r||!r.length)continue;var g=null,dt='';
  if(hc>=0){var h=String(r[ch]==null?'':r[ch]).trim(),a2=String(r[ca]==null?'':r[ca]).trim();if(h&&a2){dt=cd>=0?toDate(r[cd]):'';if(!dt)for(j=0;j<r.length;j++){dt=toDate(r[j]);if(dt)break}g={d:dt,h:h,a:a2}}}
  else{var tx=[];for(j=0;j<r.length;j++){var c=r[j];if(c==null||String(c).trim()==='')continue;if(!dt&&isDateCell(c)){dt=toDate(c);continue}if(isTime(c)||typeof c==='number'||/^\d+$/.test(String(c).trim()))continue;tx.push(String(c).trim())}
   if(tx.length>=2)g={d:dt,h:tx[0],a:tx[1]};else if(tx.length===1){if(!dt)dt=toDate(tx[0]);var v=splitVs(tx[0].replace(/\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}/,'').replace(/\b\d{1,2}[:.]\d{2}\b/,'').trim());if(v)g={d:dt,h:v[0],a:v[1]}}}
  if(g&&g.h&&g.a)out.push(g)}
 return out}
function parseText(t){
 var ls=String(t).split(/\r?\n/).filter(function(l){return l.trim()}),dl=ls.some(function(l){return l.indexOf('\t')>=0})?'\t':ls.some(function(l){return l.indexOf(';')>=0})?';':(ls.length>1&&ls.every(function(l){return l.split(',').length>=3}))?',':null;
 return parseRows(ls.map(function(l){if(dl)return l.split(dl).map(function(c){return c.replace(/^"|"$/g,'').trim()});return[l.trim()]}))}
function merge(list){var a=get(),n=0,seen={};a.forEach(function(x){seen[x.d+'|'+norm(x.h)+'|'+norm(x.a)]=1});
 list.forEach(function(g){var k=g.d+'|'+norm(g.h)+'|'+norm(g.a);if(!seen[k]){seen[k]=1;a.push({id:'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),d:g.d,h:g.h,a:g.a});n++}});save(a);return n}
function loadXlsx(cb){if(window.XLSX)return cb();var s=document.createElement('script');s.src='xlsx.full.min.js';s.onload=cb;s.onerror=function(){st.msg='Per i file Excel serve xlsx.full.min.js: salva il foglio come CSV oppure incolla il testo.';draw()};document.head.appendChild(s)}
function importFile(f){var nm=(f.name||'').toLowerCase();
 if(/\.(xlsx|xls)$/.test(nm)){var fr=new FileReader();fr.onload=function(){loadXlsx(function(){try{var wb=XLSX.read(fr.result,{type:'array',cellDates:true}),rows=[];wb.SheetNames.forEach(function(n){rows=rows.concat(XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,raw:true,defval:''}))});done(parseRows(rows))}catch(e){st.msg='File Excel non leggibile';draw()}})};fr.readAsArrayBuffer(f)}
 else{var fr2=new FileReader();fr2.onload=function(){done(parseText(fr2.result))};fr2.readAsText(f)}}
function done(l){var n=l.length?merge(l):0;st.msg=l.length?('Importate '+n+' partite nuove ('+l.length+' righe riconosciute)'):'Nessuna partita riconosciuta: servono data, squadra casa e squadra ospite (anche come "A - B").';draw()}
function mine(){return norm((cfg&&cfg.me)||'')}
function myName(){try{return localStorage.getItem(KM)||''}catch(e){return''}}
function same(a,b){a=norm(a);b=norm(b);return a&&b&&(a.indexOf(b)>=0||b.indexOf(a)>=0)}
function pick(id){var g=get().filter(function(x){return x.id===id})[0];if(!g)return;var me=myName(),side=null;
 if(me&&same(g.h,me))side='h';else if(me&&same(g.a,me))side='a';
 if(side)return fin(side==='h'?g.a:g.h,g);st.who=g;draw()}
function who(side){var g=st.who;if(!g)return;try{localStorage.setItem(KM,side==='h'?g.h:g.a)}catch(e){}st.who=null;fin(side==='h'?g.a:g.h,g)}
function fin(opp,g){close();if(cfg&&cfg.onPick)cfg.onPick(opp,g||null)}
function fmtD(d){return d?d.slice(8)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'—'}
function draw(){if(!el)return;var a=get().slice().sort(function(x,y){return(x.d||'9')>(y.d||'9')?1:-1}),q=norm(st.q),td=new Date().toISOString().slice(0,10);
 if(q)a=a.filter(function(x){return norm(x.h+x.a).indexOf(q)>=0});
 var up=a.filter(function(x){return!x.d||x.d>=td}),pa=a.filter(function(x){return x.d&&x.d<td}).reverse();
 function row(x){return'<div class="cr"><button data-c="pick" data-v="'+x.id+'"><small>'+fmtD(x.d)+'</small><b>'+esc(x.h)+'</b> – <b>'+esc(x.a)+'</b></button><button data-c="del" data-v="'+x.id+'" aria-label="Elimina" class="cx">✕</button></div>'}
 var h='<div class="cbox"><div class="ch"><b>📅 Calendario / avversario</b><button data-c="close" class="cx">✕</button></div>';
 if(st.who){h+='<p>Quale squadra siamo noi?</p><button class="cg" data-c="who" data-v="h">'+esc(st.who.h)+'</button><button class="cg" data-c="who" data-v="a">'+esc(st.who.a)+'</button><button data-c="whox">Indietro</button></div>';el.innerHTML=h;return}
 h+='<div class="cs"><b>Avversario a mano</b><div class="cf"><input id="cmo" placeholder="Nome squadra avversaria" autocomplete="off"><button class="cg" data-c="man">Usa</button></div></div>';
 h+='<div class="cs"><b>Partite del campionato</b>'+(get().length>6?'<input id="cq" placeholder="Cerca squadra…" value="'+esc(st.q)+'" autocomplete="off">':'')+
  (up.length||pa.length?'<div class="cl">'+up.map(row).join('')+(pa.length?'<div class="cp">Già giocate</div>'+pa.map(row).join(''):'')+'</div>':'<p class="ch2">Nessuna partita in calendario: importala o aggiungila qui sotto.</p>')+'</div>';
 h+='<div class="cs"><b>Importa calendario</b><p class="ch2">File Excel (.xlsx), CSV o testo con data, squadra di casa e ospite.</p><input type="file" id="cfile" accept=".xlsx,.xls,.csv,.txt,text/csv,text/plain"><textarea id="cpaste" rows="3" placeholder="…oppure incolla qui le righe del calendario"></textarea><button data-c="imp">Importa testo incollato</button>'+(st.msg?'<p class="cm">'+esc(st.msg)+'</p>':'')+'</div>';
 h+='<div class="cs"><b>Aggiungi una partita</b><div class="cf"><input type="date" id="cad"><input id="cah" placeholder="Casa"><input id="caa" placeholder="Ospite"><button data-c="add">Aggiungi</button></div></div>';
 if(get().length)h+='<button data-c="clr" class="cd">Svuota calendario</button>';
 el.innerHTML=h+'</div>'}
function close(){if(el){el.remove();el=null}}
function open(c){cfg=c||{};st={q:'',who:null,msg:''};close();
 if(!document.getElementById('calcss')){var s=document.createElement('style');s.id='calcss';s.textContent='#calm{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;padding:10px;font:15px system-ui,sans-serif}#calm .cbox{background:#fff;color:#111;border-radius:12px;max-width:560px;width:100%;max-height:92vh;overflow:auto;padding:14px}#calm .ch{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}#calm .cs{border-top:1px solid #ddd;padding:10px 0}#calm button{font:inherit;padding:10px 12px;border:1px solid #bbb;border-radius:8px;background:#f3f3f3;color:#111;cursor:pointer}#calm .cg{background:#14803c;color:#fff;border-color:#14803c;margin:4px 0;display:block;width:100%}#calm .cf .cg{display:inline-block;width:auto;margin:0}#calm .cx{padding:6px 10px}#calm .cd{color:#b00020;margin-top:6px}#calm input,#calm textarea{font:inherit;padding:9px;border:1px solid #bbb;border-radius:8px;width:100%;box-sizing:border-box;margin:6px 0}#calm .cf{display:flex;gap:6px;flex-wrap:wrap}#calm .cf input{flex:1 1 120px;width:auto}#calm .cr{display:flex;gap:6px;margin:5px 0}#calm .cr>button:first-child{flex:1;text-align:left}#calm small{display:block;color:#666}#calm .cl{max-height:230px;overflow:auto}#calm .cp{margin:8px 0 2px;color:#666;font-size:13px}#calm .ch2{color:#666;margin:4px 0;font-size:13px}#calm .cm{color:#14803c;font-weight:600}';document.head.appendChild(s)}
 el=document.createElement('div');el.id='calm';document.body.appendChild(el);
 el.addEventListener('click',function(e){if(e.target===el)return close();var b=e.target.closest('[data-c]');if(!b)return;var c=b.dataset.c,v=b.dataset.v;
  if(c==='close')close();else if(c==='pick')pick(v);else if(c==='who')who(v);else if(c==='whox'){st.who=null;draw()}
  else if(c==='del'){save(get().filter(function(x){return x.id!==v}));draw()}
  else if(c==='clr'){if(confirm('Svuotare tutto il calendario?')){save([]);draw()}}
  else if(c==='man'){var n=el.querySelector('#cmo').value.trim();if(!n)return;fin(n,null)}
  else if(c==='imp'){var t=el.querySelector('#cpaste').value;if(!t.trim()){st.msg='Incolla prima il testo';return draw()}done(parseText(t))}
  else if(c==='add'){var h=el.querySelector('#cah').value.trim(),a=el.querySelector('#caa').value.trim(),d=el.querySelector('#cad').value;if(!h||!a){st.msg='Servono casa e ospite';return draw()}merge([{d:d,h:h,a:a}]);st.msg='Partita aggiunta';draw()}});
 el.addEventListener('input',function(e){if(e.target.id==='cq'){st.q=e.target.value;var p=e.target.selectionStart;draw();var n=el.querySelector('#cq');if(n){n.focus();n.setSelectionRange(p,p)}}});
 el.addEventListener('change',function(e){if(e.target.id==='cfile'&&e.target.files[0])importFile(e.target.files[0])});
 draw()}
window.rbCal={open:open,get:get,parseText:parseText,parseRows:parseRows};
})();
