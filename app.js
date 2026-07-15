import { unzipSync } from 'fflate';

const $ = (id) => document.getElementById(id);

const translations = {
  'pt-BR': {localOnly:'Somente neste dispositivo',search:'Pesquisar na conversa',welcomeTitle:'Veja sua conversa como no WhatsApp',welcomeText:'Abra um ZIP exportado com mídia ou apenas o arquivo TXT. Tudo é processado localmente no seu navegador.',openChat:'Abrir conversa',dropHere:'ou arraste o ZIP/TXT para cá',privacy:'Seus arquivos nunca saem deste dispositivo.',newChat:'Abrir outra',settings:'Configurações',language:'Idioma',myName:'Meu nome na conversa',privacyLong:'Privacidade: o arquivo é aberto apenas na memória do navegador e não é enviado ou armazenado.',conversation:'Conversa',messages:'mensagens',participants:'participantes',today:'Hoje',yesterday:'Ontem',loading:'Abrindo conversa…',invalid:'Não foi possível ler esta exportação.',noText:'O ZIP não contém um arquivo TXT.',mediaMissing:'Mídia não incluída na exportação',file:'Arquivo',selectMe:'Escolha seu nome'},
  'en-US': {localOnly:'Only on this device',search:'Search in conversation',welcomeTitle:'See your chat like WhatsApp',welcomeText:'Open an exported ZIP with media or just the TXT file. Everything is processed locally in your browser.',openChat:'Open conversation',dropHere:'or drop the ZIP/TXT here',privacy:'Your files never leave this device.',newChat:'Open another',settings:'Settings',language:'Language',myName:'My name in the conversation',privacyLong:'Privacy: the file is opened only in browser memory and is never uploaded or stored.',conversation:'Conversation',messages:'messages',participants:'participants',today:'Today',yesterday:'Yesterday',loading:'Opening conversation…',invalid:'This export could not be read.',noText:'The ZIP does not contain a TXT file.',mediaMissing:'Media not included in export',file:'File',selectMe:'Choose your name'},
  'es-MX': {localOnly:'Solo en este dispositivo',search:'Buscar en la conversación',welcomeTitle:'Mira tu conversación como en WhatsApp',welcomeText:'Abre un ZIP exportado con archivos o solo el TXT. Todo se procesa localmente en tu navegador.',openChat:'Abrir conversación',dropHere:'o arrastra el ZIP/TXT aquí',privacy:'Tus archivos nunca salen de este dispositivo.',newChat:'Abrir otra',settings:'Configuración',language:'Idioma',myName:'Mi nombre en la conversación',privacyLong:'Privacidad: el archivo se abre solo en la memoria del navegador; no se sube ni almacena.',conversation:'Conversación',messages:'mensajes',participants:'participantes',today:'Hoy',yesterday:'Ayer',loading:'Abriendo conversación…',invalid:'No se pudo leer esta exportación.',noText:'El ZIP no contiene un archivo TXT.',mediaMissing:'Archivo no incluido en la exportación',file:'Archivo',selectMe:'Elige tu nombre'},
  'hi-IN': {localOnly:'केवल इस डिवाइस पर',search:'चैट में खोजें',welcomeTitle:'अपनी चैट WhatsApp जैसी देखें',welcomeText:'मीडिया वाला निर्यातित ZIP या केवल TXT फ़ाइल खोलें। सब कुछ आपके ब्राउज़र में स्थानीय रूप से संसाधित होता है।',openChat:'चैट खोलें',dropHere:'या ZIP/TXT यहाँ छोड़ें',privacy:'आपकी फ़ाइलें इस डिवाइस से बाहर नहीं जातीं।',newChat:'दूसरी खोलें',settings:'सेटिंग्स',language:'भाषा',myName:'चैट में मेरा नाम',privacyLong:'गोपनीयता: फ़ाइल केवल ब्राउज़र मेमोरी में खुलती है; इसे अपलोड या संग्रहीत नहीं किया जाता।',conversation:'चैट',messages:'संदेश',participants:'प्रतिभागी',today:'आज',yesterday:'कल',loading:'चैट खुल रही है…',invalid:'यह निर्यात पढ़ा नहीं जा सका।',noText:'ZIP में TXT फ़ाइल नहीं है।',mediaMissing:'मीडिया निर्यात में शामिल नहीं है',file:'फ़ाइल',selectMe:'अपना नाम चुनें'}
};

let locale = localStorage.getItem('whatsview-locale') || 'pt-BR';
let messages = [], media = new Map(), objectUrls = [], participants = [], me = '';
const t = (key) => translations[locale]?.[key] || translations['pt-BR'][key] || key;

function applyLanguage(){
  document.documentElement.lang=locale; $('languageSelect').value=locale;
  document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>el.placeholder=t(el.dataset.i18nPlaceholder));
  if(messages.length) render();
}

function toast(text){ const el=$('toast'); el.textContent=text; el.classList.remove('hidden'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.add('hidden'),2800); }
function cleanup(){ objectUrls.forEach(URL.revokeObjectURL); objectUrls=[]; media.clear(); messages=[]; participants=[]; }
function normalizeName(name=''){ return name.replace(/^\.\//,'').split('/').pop().normalize('NFC').trim(); }
function makeUrl(bytes,name){ const blob=new Blob([bytes],{type:mimeType(name)}); const url=URL.createObjectURL(blob); objectUrls.push(url); return {url,blob,name}; }
function mimeType(name){ const ext=name.split('.').pop()?.toLowerCase(); return ({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',gif:'image/gif',webp:'image/webp',heic:'image/heic',mp4:'video/mp4',mov:'video/quicktime',webm:'video/webm',opus:'audio/ogg; codecs=opus',ogg:'audio/ogg',mp3:'audio/mpeg',m4a:'audio/mp4',wav:'audio/wav',pdf:'application/pdf',vcf:'text/vcard'})[ext]||'application/octet-stream'; }

async function openFile(file){
  if(!file) return; toast(t('loading')); cleanup();
  try{
    let text='';
    if(file.name.toLowerCase().endsWith('.zip')){
      const files=unzipSync(new Uint8Array(await file.arrayBuffer()));
      const entries=Object.entries(files).filter(([name])=>!name.endsWith('/')&&!name.startsWith('__MACOSX/'));
      const txt=entries.find(([name])=>name.toLowerCase().endsWith('.txt'));
      if(!txt) throw new Error(t('noText'));
      text=new TextDecoder('utf-8').decode(txt[1]).replace(/^\uFEFF/,'');
      for(const [name,bytes] of entries){ if(name===txt[0]) continue; const item=makeUrl(bytes,normalizeName(name)); media.set(normalizeName(name).toLowerCase(),item); }
    }else text=await file.text();
    messages=parseChat(text);
    if(!messages.length) throw new Error(t('invalid'));
    participants=[...new Set(messages.filter(m=>m.sender).map(m=>m.sender))];
    me=localStorage.getItem('whatsview-me') || participants.at(-1) || '';
    setupMeSelect();
    $('chatName').textContent=file.name.replace(/\.(zip|txt)$/i,'').replace(/^(Conversa do WhatsApp com|WhatsApp Chat with|Chat de WhatsApp con)\s*/i,'')||t('conversation');
    $('avatar').textContent=($('chatName').textContent.trim()[0]||'W').toUpperCase();
    $('welcome').classList.add('hidden'); $('viewer').classList.remove('hidden'); $('searchWrap').classList.remove('hidden');
    render(); requestAnimationFrame(()=>$('messages').scrollTop=$('messages').scrollHeight);
  }catch(error){ console.error(error); cleanup(); toast(error.message||t('invalid')); }
}

function parseChat(text){
  const lines=text.replace(/\r/g,'').split('\n'); const out=[];
  const patterns=[
    /^\[?(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[APap][Mm])?)\]?\s*(?:[-–]\s*)?(.*)$/,
    /^\[?(\d{4}[\/.\-]\d{1,2}[\/.\-]\d{1,2}),?\s+(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*(?:[-–]\s*)?(.*)$/
  ];
  let current=null;
  for(const line of lines){
    let match=null; for(const pattern of patterns){ match=line.match(pattern); if(match) break; }
    if(match){
      const [,date,time,rest]=match; const senderMatch=rest.match(/^([^:]{1,100}):\s([\s\S]*)$/);
      current={date,time,sender:senderMatch?.[1]||'',text:senderMatch?.[2]??rest,system:!senderMatch}; out.push(current);
    }else if(current) current.text+=`\n${line}`;
  }
  return out;
}

function setupMeSelect(){
  const select=$('meSelect'); select.innerHTML='';
  for(const name of participants){ const option=document.createElement('option'); option.value=name; option.textContent=name; option.selected=name===me; select.append(option); }
  $('meField').classList.toggle('hidden',participants.length<2);
}

function escapeHtml(value=''){ const el=document.createElement('div'); el.textContent=value; return el.innerHTML; }
function linkify(value){ return escapeHtml(value).replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'); }
function dateKey(date){
  const nums=date.match(/\d+/g)?.map(Number)||[]; if(nums.length<3) return date;
  let [a,b,c]=nums; if(a>1900) return `${a}-${String(b).padStart(2,'0')}-${String(c).padStart(2,'0')}`;
  const year=c<100?2000+c:c; return `${year}-${String(b).padStart(2,'0')}-${String(a).padStart(2,'0')}`;
}
function localizedDate(raw){ const key=dateKey(raw), d=new Date(`${key}T12:00:00`); if(Number.isNaN(d.valueOf())) return raw; const today=new Date(); const yesterday=new Date(); yesterday.setDate(today.getDate()-1); if(d.toDateString()===today.toDateString())return t('today'); if(d.toDateString()===yesterday.toDateString())return t('yesterday'); return new Intl.DateTimeFormat(locale,{dateStyle:'long'}).format(d); }
function findMedia(text){
  const clean=text.replace(/[‎<>]/g,'').trim(); const candidates=[clean,...clean.split(/\n/)];
  for(const candidate of candidates){ const base=normalizeName(candidate.replace(/\s*\(arquivo anexado\)|\s*\(file attached\)|\s*\(archivo adjunto\)/i,'').trim()); const item=media.get(base.toLowerCase()); if(item)return item; }
  const match=clean.match(/[\wÀ-ž ()\-_.]+\.(?:jpe?g|png|gif|webp|heic|mp4|mov|webm|opus|ogg|mp3|m4a|wav|pdf|vcf)/i); return match?media.get(normalizeName(match[0]).toLowerCase()):null;
}
function renderMedia(item){
  const type=item.blob.type, safe=escapeHtml(item.name);
  if(type.startsWith('image/')) return `<div class="message-media"><img src="${item.url}" alt="${safe}" data-preview="${item.url}" data-kind="image"></div>`;
  if(type.startsWith('video/')) return `<div class="message-media"><video src="${item.url}" controls preload="metadata" data-preview="${item.url}" data-kind="video"></video></div>`;
  if(type.startsWith('audio/')) return `<div class="message-media"><audio src="${item.url}" controls preload="metadata"></audio></div>`;
  const ext=item.name.split('.').pop()?.toUpperCase()||t('file'); return `<a class="file-card" href="${item.url}" target="_blank" rel="noopener"><span class="file-icon">${escapeHtml(ext.slice(0,4))}</span><span class="file-info"><strong>${safe}</strong><small>${type==='application/pdf'?'PDF':t('file')}</small></span></a>`;
}
function messageHtml(msg){
  if(msg.system)return `<div class="system-message">${linkify(msg.text)}</div>`;
  const item=findMedia(msg.text); const mediaHtml=item?renderMedia(item):'';
  const attachmentOnly=/^(?:[‎<>]?mídia oculta[‎<>]?|[‎<>]?media omitted[‎<>]?|[‎<>]?archivo omitido[‎<>]?|.*\.(?:jpe?g|png|gif|webp|heic|mp4|mov|webm|opus|ogg|mp3|m4a|wav|pdf|vcf)(?:\s*\([^)]*\))?)$/i.test(msg.text.trim());
  const missing=!item&&/mídia oculta|media omitted|archivo omitido/i.test(msg.text)?`<div class="missing-media">${t('mediaMissing')}</div>`:'';
  const body=attachmentOnly?'':`<div class="message-text">${linkify(msg.text)}</div>`;
  return `<div class="message-row ${msg.sender===me?'mine':''}" data-search="${escapeHtml((msg.sender+' '+msg.text).toLowerCase())}"><article class="message"><div class="sender">${escapeHtml(msg.sender)}</div>${mediaHtml}${missing}${body}<time class="message-time">${escapeHtml(msg.time)}</time></article></div>`;
}
function render(){
  let lastDate=''; const query=$('searchInput').value.trim().toLocaleLowerCase(locale); let shown=0; const chunks=[];
  for(const msg of messages){ if(query&&!`${msg.sender} ${msg.text}`.toLocaleLowerCase(locale).includes(query))continue; const key=dateKey(msg.date); if(key!==lastDate){chunks.push(`<div class="day-chip">${localizedDate(msg.date)}</div>`);lastDate=key;} chunks.push(messageHtml(msg));shown++; }
  $('messages').innerHTML=chunks.join(''); $('chatMeta').textContent=`${shown} ${t('messages')} · ${participants.length} ${t('participants')}`;
}
function preview(url,kind){ const stage=$('mediaStage'); stage.innerHTML=kind==='image'?`<img src="${url}" alt="">`:`<video src="${url}" controls autoplay></video>`; $('mediaDialog').showModal(); }

$('fileInput').addEventListener('change',e=>openFile(e.target.files[0]));
$('newChatButton').addEventListener('click',()=>{ $('fileInput').value=''; $('fileInput').click(); });
$('settingsButton').addEventListener('click',()=>$('settingsDialog').showModal()); $('avatar').addEventListener('click',()=>$('settingsDialog').showModal());
$('languageSelect').addEventListener('change',e=>{locale=e.target.value;localStorage.setItem('whatsview-locale',locale);applyLanguage();});
$('meSelect').addEventListener('change',e=>{me=e.target.value;localStorage.setItem('whatsview-me',me);render();});
$('searchInput').addEventListener('input',render);
$('messages').addEventListener('click',e=>{const el=e.target.closest('[data-preview]');if(el&&!el.controls)preview(el.dataset.preview,el.dataset.kind);else if(el?.tagName==='IMG')preview(el.dataset.preview,el.dataset.kind);});
$('mediaClose').addEventListener('click',()=>{ $('mediaDialog').close(); $('mediaStage').innerHTML=''; });
$('mediaDialog').addEventListener('click',e=>{if(e.target===$('mediaDialog')){$('mediaDialog').close();$('mediaStage').innerHTML='';}});
$('scrollBottom').addEventListener('click',()=>$('messages').scrollTo({top:$('messages').scrollHeight,behavior:'smooth'}));
$('messages').addEventListener('scroll',()=>{const el=$('messages');$('scrollBottom').classList.toggle('hidden',el.scrollHeight-el.scrollTop-el.clientHeight<240);});
for(const event of ['dragenter','dragover']) $('dropZone').addEventListener(event,e=>{e.preventDefault();$('dropZone').classList.add('dragging');});
for(const event of ['dragleave','drop']) $('dropZone').addEventListener(event,e=>{e.preventDefault();$('dropZone').classList.remove('dragging');});
$('dropZone').addEventListener('drop',e=>openFile(e.dataTransfer.files[0])); $('dropZone').addEventListener('click',()=>$('fileInput').click());
$('dropZone').addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){$('fileInput').click();e.preventDefault();}});
applyLanguage();
