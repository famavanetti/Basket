/* Campo FIBA: zone, mappa a zone e punti dei tiri. Condiviso (estratto da referto_tiri.html) */
(function(){
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var U={esel:''};
var CX=750,CY=157.5,YMAX=1100;
function is3(x,y){var dx=x-CX,dy=y-CY;return Math.abs(dx)>=660||Math.hypot(dx,dy)>=675}

function zone(x,y,v){var dx=x-CX,dy=y-CY,d=Math.hypot(dx,dy);
 if(v===2){if(d<250)return'Area';if(x>=505&&x<=995&&y<=580)return'Pitturato';return x<505?'Media sx':x>995?'Media dx':'Media centro'}
 if(y<299)return x<CX?'Angolo sx':'Angolo dx';if(Math.abs(dx)<=300)return'Tripla centro';return dx<0?'Tripla ala sx':'Tripla ala dx'}
/* ============ mappa a zone: colore = punti per tiro della zona (zone come in "Per zona") ============ */
function zFill(o){if(!o||!o.a)return'#141b3d';if(o.a<3)return'#252d5e';var p=o.p/o.a;return p<.4?'#8f2d3a':p<.7?'#9a5a28':p<.9?'#85752a':p<1.1?'#4a8346':'#2a7a4c'}
function zoneSvg(shots){var Z={};shots.forEach(function(s){var k=zone(s.x,s.y,s.v),o=Z[k]||(Z[k]={a:0,m:0,p:0});o.a++;if(s.r){o.m++;o.p+=s.v}});
 var F=function(k){return zFill(Z[k])},in2='M90 0 V299 A675 675 0 0 0 1410 299 V0 Z',T='fill="none" stroke="#e8ecff" stroke-width="2.6" stroke-opacity=".55"',C='fill="none" stroke="#e8ecff" stroke-width="6"';
 var h='<svg class="court" viewBox="-30 -30 1560 1160" role="img" aria-label="Mappa a zone"><defs><clipPath id="zc2"><path d="'+in2+'"/></clipPath><clipPath id="zc3"><path clip-rule="evenodd" d="M0 0 H1500 V1100 H0 Z '+in2+'"/></clipPath></defs>'+
 '<g clip-path="url(#zc2)"><rect x="0" y="0" width="505" height="1100" fill="'+F('Media sx')+'"/><rect x="995" y="0" width="505" height="1100" fill="'+F('Media dx')+'"/><rect x="505" y="0" width="490" height="1100" fill="'+F('Media centro')+'"/><rect x="505" y="0" width="490" height="580" fill="'+F('Pitturato')+'"/><path d="M556 0 A250 250 0 1 0 944 0 Z" fill="'+F('Area')+'"/></g>'+
 '<g clip-path="url(#zc3)"><rect x="0" y="0" width="750" height="299" fill="'+F('Angolo sx')+'"/><rect x="750" y="0" width="750" height="299" fill="'+F('Angolo dx')+'"/><rect x="0" y="299" width="450" height="801" fill="'+F('Tripla ala sx')+'"/><rect x="450" y="299" width="600" height="801" fill="'+F('Tripla centro')+'"/><rect x="1050" y="299" width="450" height="801" fill="'+F('Tripla ala dx')+'"/></g>'+
 '<g '+T+'><path d="M556 0 A250 250 0 1 0 944 0"/><path d="M505 0 V786.5 M995 0 V786.5 M505 580 H995"/><path d="M0 299 H90 M1410 299 H1500"/><path d="M450 762 V1100 M1050 762 V1100"/></g>'+
 '<g '+C+'><rect x="0" y="0" width="1500" height="1400"/><rect x="505" y="0" width="490" height="580"/><path d="M570 580 A180 180 0 0 0 930 580"/><path d="M570 580 A180 180 0 0 1 930 580" stroke-dasharray="22 18" stroke-opacity=".5"/><path d="M625 120 V157.5 A125 125 0 0 0 875 157.5 V120"/><path d="M90 0 V299 A675 675 0 0 0 1410 299 V0"/><path d="M660 120 H840 M750 120 V135" stroke-width="10"/><circle cx="750" cy="157.5" r="22.5" stroke="#ffd93a"/></g>';
 var P={'Area':[750,330],'Pitturato':[750,505],'Media centro':[750,690],'Media sx':[300,370],'Media dx':[1200,370],'Angolo sx':[45,160],'Angolo dx':[1455,160],'Tripla ala sx':[225,760],'Tripla ala dx':[1275,760],'Tripla centro':[750,930]};
 Object.keys(P).forEach(function(k){var o=Z[k]||{a:0,m:0,p:0},sm=k.indexOf('Angolo')===0,f=sm?34:64,f2=sm?24:36,x=P[k][0],y=P[k][1],low=o.a<3;
  if(!o.a){h+='<text x="'+x+'" y="'+(y+10)+'" text-anchor="middle" font-size="'+(sm?30:46)+'" font-weight="800" fill="#4a5490">–</text>';return}
  h+='<g text-anchor="middle" font-weight="900" fill="'+(low?'#a9b1dd':'#fff')+'"><text x="'+x+'" y="'+y+'" font-size="'+f+'">'+o.m+'/'+o.a+'</text><text x="'+x+'" y="'+(y+f2+8)+'" font-size="'+f2+'" font-weight="700" fill-opacity=".9">'+Math.round(100*o.m/o.a)+'%'+(sm?'':' · '+o.p+' pt')+'</text></g>'});
 return h+'</svg>'}
function zoneLegend(){var c=['#8f2d3a','#9a5a28','#85752a','#4a8346','#2a7a4c'];return'<div style="display:flex;align-items:center;gap:0;margin-top:8px;font-size:11px;color:#8d96c8;font-weight:700;flex-wrap:wrap"><span style="margin-right:8px">pochi punti per tiro</span>'+c.map(function(x){return'<i style="width:34px;height:12px;background:'+x+';display:block"></i>'}).join('')+'<span style="margin:0 12px 0 8px">molti</span><i style="width:24px;height:12px;background:#252d5e;display:block"></i><span style="margin-left:6px">meno di 3 tiri</span></div>'}
function zoneCard(all){var p=0,a=all.length;all.forEach(function(s){if(s.r)p+=s.v});
 return'<div class="card"><b>Mappa a zone</b><div class="hint" style="margin:4px 0 8px">Ogni zona mostra segnati/tentati, percentuale e punti. Il colore dipende dai <b>punti per tiro</b> della zona'+(a?' (squadra: '+(p/a).toFixed(2).replace('.',',')+')':'')+'.</div>'+zoneSvg(all)+zoneLegend()+'</div>'}


function court(dots,pend){var Ls='fill="none" stroke="#6f7bb0" stroke-width="7"';
 return'<svg id="ct" viewBox="-30 -30 1560 '+(YMAX+60)+'" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Metà campo">'+
 '<rect x="0" y="0" width="1500" height="1400" '+Ls+'/><rect x="505" y="0" width="490" height="580" '+Ls+'/>'+
 '<path d="M570 580 A180 180 0 0 0 930 580" '+Ls+'/><path d="M570 580 A180 180 0 0 1 930 580" '+Ls+' stroke-dasharray="22 18"/>'+
 '<path d="M625 120 V157.5 A125 125 0 0 0 875 157.5 V120" '+Ls+'/><path d="M90 0 V299 A675 675 0 0 0 1410 299 V0" '+Ls+'/>'+
 '<path d="M660 120 H840 M750 120 V135" '+Ls+' stroke-width="11"/><circle cx="750" cy="157.5" r="22.5" '+Ls+' stroke="#d9b52a"/>'+dots+(pend||'')+'</svg>'}
function dot(s){var c=s.r?'#2ecc71':'#ff5d6c',ring=s.id===U.esel?'<circle cx="'+s.x+'" cy="'+s.y+'" r="52" fill="none" stroke="#ffd93a" stroke-width="9"/>':'';
 return ring+(s.r?'<circle cx="'+s.x+'" cy="'+s.y+'" r="30" fill="'+c+'" fill-opacity=".9" stroke="#06240f" stroke-width="5"/><text x="'+s.x+'" y="'+(s.y+11)+'" fill="#06240f" font-size="32" font-weight="900" text-anchor="middle" style="pointer-events:none">'+esc(s.n)+'</text>'
 :'<path d="M'+(s.x-24)+' '+(s.y-24)+' L'+(s.x+24)+' '+(s.y+24)+' M'+(s.x+24)+' '+(s.y-24)+' L'+(s.x-24)+' '+(s.y+24)+'" stroke="'+c+'" stroke-width="14" stroke-linecap="round"/><text x="'+(s.x+34)+'" y="'+(s.y-26)+'" fill="#ff9aa5" font-size="30" font-weight="900" style="pointer-events:none">'+esc(s.n)+'</text>')}

window.rbCourt={zone:zone,is3:is3,zoneSvg:zoneSvg,zoneLegend:zoneLegend,court:court,dot:dot};
})();
