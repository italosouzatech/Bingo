"use strict";
const LET="BINGO",$=id=>document.getElementById(id),app=$("app");
let N=0,drawn=[],view="menu",psize=50,bt,rt;
const pubWin=location.hash==="#publico";
const has=n=>drawn.includes(n),letraDe=n=>LET[Math.floor((n-1)/(N/5))];

/* ---------- cartelas (50 = mesmas do PDF/PNG anteriores) ---------- */
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function mk(seed,per){
  const r=rng(seed),cols=[];
  for(let c=0;c<5;c++){
    const p=[];for(let i=1;i<=per;i++)p.push(c*per+i);
    for(let i=p.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[p[i],p[j]]=[p[j],p[i]]}
    cols.push(p.slice(0,5).sort((a,b)=>a-b));
  }
  cols[2][2]=0;return cols;
}
const store={50:{c:[],s:new Set(),i:1},100:{c:[],s:new Set(),i:1}};
function card(n,k){
  const st=store[n],per=n/5,off=n===100?500009:0;
  while(st.c.length<k){const c=mk(st.i*7919+13+off,per);st.i++;const key=c.flat().join();if(!st.s.has(key)){st.s.add(key);st.c.push(c)}}
  return st.c[k-1];
}
function cardHTML(c){
  let h='<table class="c"><tr>'+LET.split("").map(l=>"<th>"+l+"</th>").join("")+"</tr>";
  for(let r=0;r<5;r++){h+="<tr>";for(let k=0;k<5;k++){const n=c[k][r];h+=n===0?'<td class="f">LIVRE</td>':"<td"+(has(n)?' class="m"':"")+">"+n+"</td>"}h+="</tr>"}
  return h+"</table>";
}

/* ---------- PDF (sem bibliotecas) ---------- */
const WD={0:556,1:556,2:556,3:556,4:556,5:556,6:556,7:556,8:556,9:556,B:722,I:278,N:722,G:778,O:778,L:611,V:667,R:722,E:667," ":278};
const PW=595.28,PH=841.89,MX=34,MY=34,GX=23,GY=23,CW=(PW-2*MX-GX)/2,CH=(PH-2*MY-2*GY)/3;
const fx=n=>n.toFixed(2),cl=c=>c.join(" ");
const rect=(x,y,w,h,f)=>cl(f)+" rg 0 0 0 RG 0.8 w "+fx(x)+" "+fx(y)+" "+fx(w)+" "+fx(h)+" re B\n";
const txt=(s,x,y,z,c)=>"BT /F1 "+z+" Tf "+cl(c)+" rg "+fx(x)+" "+fx(y)+" Td ("+s+") Tj ET\n";
function tw(s,z){let w=0;for(const c of s)w+=WD[c]||556;return w*z/1000}
function cardPDF(c,no,pos,size){
  const x=MX+(pos%2)*(CW+GX),top=PH-MY-Math.floor(pos/2)*(CH+GY),cw=CW/5,hh=26,rh=(CH-22-hh)/5,t0=top-22;
  const lab="Bingo 1 a "+size;
  let s=txt("Cartela n\\272 "+no,x,top-14,14,[0,0,0])+txt(lab,x+CW-tw(lab,9),top-13,9,[.4,.4,.4]);
  for(let k=0;k<5;k++){s+=rect(x+k*cw,t0-hh,cw,hh,[.145,.388,.922])+txt(LET[k],x+k*cw+cw/2-tw(LET[k],16)/2,t0-hh+8,16,[1,1,1])}
  for(let r=0;r<5;r++)for(let k=0;k<5;k++){
    const n=c[k][r],cx=x+k*cw,cy=t0-hh-(r+1)*rh;
    if(n===0)s+=rect(cx,cy,cw,rh,[.9,.91,.92])+txt("LIVRE",cx+cw/2-tw("LIVRE",10)/2,cy+rh/2-3.5,10,[0,0,0]);
    else{const t=""+n;s+=rect(cx,cy,cw,rh,[1,1,1])+txt(t,cx+cw/2-tw(t,22)/2,cy+rh/2-7.5,22,[0,0,0])}
  }
  return s;
}
function makePDF(pages){
  const o=[];
  o[1]="<< /Type /Catalog /Pages 2 0 R >>";
  o[2]="<< /Type /Pages /Kids ["+pages.map((_,i)=>(4+2*i)+" 0 R").join(" ")+"] /Count "+pages.length+" >>";
  o[3]="<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
  pages.forEach((c,i)=>{
    o[4+2*i]="<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 3 0 R >> >> /Contents "+(5+2*i)+" 0 R >>";
    o[5+2*i]="<< /Length "+c.length+" >>\nstream\n"+c+"endstream";
  });
  let out="%PDF-1.4\n";const off=[];
  for(let i=1;i<o.length;i++){off[i]=out.length;out+=i+" 0 obj\n"+o[i]+"\nendobj\n"}
  const x=out.length;
  out+="xref\n0 "+o.length+"\n0000000000 65535 f \n"+off.slice(1).map(v=>String(v).padStart(10,"0")+" 00000 n \n").join("")+"trailer\n<< /Size "+o.length+" /Root 1 0 R >>\nstartxref\n"+x+"\n%%EOF";
  return new Blob([out],{type:"application/pdf"});
}
function pdfCards(size,q){
  const pages=[];
  for(let p=0;p<q;p+=6){let s="";for(let i=p;i<Math.min(p+6,q);i++)s+=cardPDF(card(size,i+1),i+1,i-p,size);pages.push(s)}
  return makePDF(pages);
}
function baixar(){
  let q=parseInt($("q").value,10);if(!(q>=1))q=30;q=Math.min(q,300);$("q").value=q;
  const a=document.createElement("a");a.href=URL.createObjectURL(pdfCards(psize,q));
  a.download="cartelas_bingo_"+psize+"_numeros.pdf";document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),5000);
  $("pm").textContent="PDF gerado: "+q+" cartelas ("+Math.ceil(q/6)+" folhas).";
}

/* ---------- sorteio ---------- */
function sortear(){
  if((view!=="draw"&&view!=="pres")||drawn.length>=N)return;
  const rest=[];for(let i=1;i<=N;i++)if(!has(i))rest.push(i);
  const a=new Uint32Array(1);crypto.getRandomValues(a);
  const n=rest[a[0]%rest.length];drawn.push(n);
  sync();
}
function desfazer(){if(drawn.length){drawn.pop();sync()}}
function reiniciar(){
  const b=$("rs");
  if(b.dataset.c){drawn=[];delete b.dataset.c;b.textContent="Reiniciar";sync();return}
  b.dataset.c=1;b.textContent="Toque de novo";rt=setTimeout(()=>{b.textContent="Reiniciar";delete b.dataset.c},3000);
}
function start(n){N=n;drawn=[];view="draw";render();broadcast()}
function go(v){view=v;render()}
function backMenu(){
  const b=$("bk");
  if(drawn.length&&!b.dataset.c){b.dataset.c=1;b.textContent="Perde o sorteio. Toque de novo";bt=setTimeout(()=>{b.textContent="← Menu";delete b.dataset.c},3000);return}
  N=0;drawn=[];view="menu";render();broadcast();
}

/* ---------- tela do público (projetor/TV) ---------- */
function pubHTML(){
  if(!N)return '<div class="pub w">🎱</div>';
  const last=drawn[drawn.length-1];let b="";
  for(let i=1;i<=N;i++)b+='<div class="'+(has(i)?(i===last?"d c":"d"):"")+'">'+i+"</div>";
  return '<div class="pub n'+N+'"><div class="pn"><div class="pl">'+(last?letraDe(last):"")+'</div><div class="pv">'+(last||"🎱")+'</div></div><div class="pb">'+b+"</div></div>";
}
let bc=null;try{bc=new BroadcastChannel("bingo-sorteio")}catch(e){}
function broadcast(){try{bc&&bc.postMessage({t:"s",N:N,drawn:drawn})}catch(e){}}
if(bc){
  bc.onmessage=e=>{const m=e.data;
    if(pubWin&&m.t==="s"){N=m.N;drawn=m.drawn;render()}
    else if(!pubWin&&m.t==="h")broadcast()};
  if(pubWin)bc.postMessage({t:"h"});
}
function openPub(){window.open(location.href.split("#")[0]+"#publico","bingo-publico","width=1100,height=620")}
function reqFS(){try{const p=document.documentElement.requestFullscreen();p&&p.catch&&p.catch(()=>{})}catch(e){}}
function exitFS(){try{if(document.fullscreenElement)document.exitFullscreen()}catch(e){}}
function toggleFS(){document.fullscreenElement?exitFS():reqFS()}
function present(){view="pres";reqFS();render()}
function exitPres(){view="draw";exitFS();render()}
document.addEventListener("fullscreenchange",()=>{if(!document.fullscreenElement&&view==="pres")exitPres()});
document.addEventListener("keydown",e=>{
  const t=e.target.tagName;
  if(e.code==="Escape"&&view==="pres"){exitPres();return}
  if((e.code==="Space"||e.code==="Enter")&&(view==="draw"||view==="pres")&&t!=="BUTTON"&&t!=="INPUT"){e.preventDefault();sortear()}
});
window.addEventListener("beforeunload",e=>{if(!pubWin&&drawn.length&&view!=="menu"){e.preventDefault();e.returnValue=""}});

/* ---------- telas ---------- */
function sync(){
  if(view==="draw")paintDraw();
  else if(view==="pres")app.innerHTML=pubHTML()+'<div class="xit"></div>';
  broadcast();
}
function render(){
  app.onclick=null;app.className="";
  if(pubWin){app.className="pubmode";app.innerHTML=pubHTML();app.onclick=toggleFS;return}
  if(view==="menu")menuView();
  else if(view==="print")printView();
  else if(view==="draw")drawView();
  else if(view==="check")checkView();
  else if(view==="pres"){app.className="pubmode";app.innerHTML=pubHTML()+'<div class="xit"></div>';
    app.onclick=e=>{if(e.target.className==="xit")exitPres();else sortear()}}
}
function menuView(){
  app.innerHTML='<main class="menu"><h1>🎱 Bingo</h1><p class="sub">Escolha uma opção</p>'
   +'<button class="opt" onclick="start(50)"><b>Sorteio de 50 números</b><span>Números de 1 a 50</span></button>'
   +'<button class="opt" onclick="start(100)"><b>Sorteio de 100 números</b><span>Números de 1 a 100</span></button>'
   +'<button class="opt" onclick="go(\'print\')"><b>Imprimir cartelas</b><span>Escolha o tamanho do sorteio e baixe em PDF</span></button>'
   +'<p class="note">Tudo roda no seu aparelho. Nada é enviado nem salvo.</p></main>';
}
function printView(){
  app.innerHTML='<div class="top"><button class="btn sec" onclick="go(\'menu\')">← Menu</button><h2>Imprimir cartelas</h2></div>'
   +'<div class="prt"><div><b>Tamanho do sorteio</b></div><div class="seg"><button id="s50" onclick="setSize(50)">50 números</button><button id="s100" onclick="setSize(100)">100 números</button></div>'
   +'<label>Quantidade de cartelas <input type="number" id="q" min="1" max="300" value="30"></label>'
   +'<button class="btn" onclick="baixar()">Baixar PDF</button><div class="msg ok" id="pm" style="font-size:16px"></div>'
   +'<p class="hist" style="margin:0">6 cartelas por folha A4. Cada cartela tem um número, usado na conferência do bingo.</p></div>';
  setSize(psize);
}
function setSize(n){psize=n;$("s50").className=n===50?"on":"";$("s100").className=n===100?"on":""}
function drawView(){
  app.innerHTML='<div class="top"><button class="btn sec" id="bk" onclick="backMenu()">← Menu</button><h2>Sorteio de '+N+' números</h2><span id="cnt"></span></div>'
   +'<div class="draw"><section class="left"><div class="cur"><div class="l" id="l"></div><div class="n" id="n"></div></div>'
   +'<button class="btn" id="go" onclick="sortear()">Sortear número</button>'
   +'<div class="row"><button class="btn sec" onclick="desfazer()">Desfazer último</button><button class="btn sec" id="rs" onclick="reiniciar()">Reiniciar</button></div>'
   +'<div class="row"><button class="btn sec" onclick="present()">Modo apresentação</button><button class="btn sec" onclick="openPub()">Abrir tela do público</button></div>'
   +'<button class="btn sec wide" id="ck" onclick="go(\'check\')">Conferir cartela</button><small id="ckh"></small>'
   +'</section>'
   +'<section><div class="board" id="bd"></div><div class="hist" id="hs"></div></section></div>';
  paintDraw();
}
function paintDraw(){
  const last=drawn[drawn.length-1];
  $("n").textContent=last||"—";$("l").textContent=last?letraDe(last):"";
  $("cnt").textContent=drawn.length+" / "+N;
  $("go").disabled=drawn.length>=N;
  $("ck").disabled=drawn.length<24;
  $("ckh").textContent=drawn.length<24?"A conferência libera após 24 números sorteados.":"";
  let b="";for(let i=1;i<=N;i++)b+='<div class="'+(has(i)?(i===last?"d c":"d"):"")+'">'+i+"</div>";
  $("bd").innerHTML=b;
  $("hs").textContent=drawn.length?"Últimos: "+drawn.slice(-10).reverse().join(", "):"";
}
function checkView(){
  app.innerHTML='<div class="top"><button class="btn sec" onclick="go(\'draw\')">← Voltar ao sorteio</button><h2>Conferir cartela</h2></div>'
   +'<div class="chk"><label>Cartela nº <input type="number" id="cn" min="1" max="300" oninput="paintCheck()"></label>'
   +'<p class="hist" style="margin:0">Confere com os '+drawn.length+' números sorteados até agora (sorteio de '+N+').</p>'
   +'<div class="msg" id="res"></div><div id="one"></div></div>';
  paintCheck();
}
function paintCheck(){
  const k=parseInt($("cn").value,10),r=$("res");
  if(!(k>=1&&k<=300)){r.textContent="Digite o número da cartela (1 a 300)";r.className="msg";$("one").innerHTML="";return}
  const c=card(N,k),f=c.flat().filter(n=>n>0&&!has(n));
  r.textContent=f.length?"Ainda não é bingo. Faltam "+f.length+": "+f.join(", "):"BINGO válido! Cartela "+k+" completa";
  r.className="msg"+(f.length?"":" ok");
  $("one").innerHTML=cardHTML(c);
}
render();