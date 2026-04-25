// ============================================================
//  Al Wafi Antrian — app.js
//  Firebase Realtime DB sync + Queue logic + TTS + UI
// ============================================================

// ===== FIREBASE CONFIG =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDxhVagL1G8RhrqYH2CV7q5Lx9GhlZ8Wlk",
  authDomain: "alwafi-antrian.firebaseapp.com",
  databaseURL: "https://alwafi-antrian-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "alwafi-antrian",
  storageBucket: "alwafi-antrian.firebasestorage.app",
  messagingSenderId: "524334905887",
  appId: "1:524334905887:web:d904e7d185db62742e332a"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ===== INDIKATOR KONEKSI =====
function setConnStatus(ok, msg){
  const el = document.getElementById('conn-status');
  if(!el) return;
  el.textContent = ok ? '🟢 ' + msg : '🔴 ' + msg;
  el.style.color = ok ? '#15803d' : '#dc2626';
}

// ===== DEFAULT DATA =====
const DEFAULT_IKHWAN = ['Ibrahim Afif Alfaizi','Ammaar Romadhon Pramana','Maulana Yusuf Ibrahim','Syafee Aliyyandaru Purchila','Yusuf Ahsanul Azzam','Zein Omar Kanz Ramadhan','Atharizz Nandaru Zihni','Hafidz Akbar Adikaputra','Zhafran Thara Arkananta','Harits Abdurrahman Saleh','Nabil Zhafran Fahrezi','Adhyaksa Putra Ramadhan','Muhammad Arsyad Arrazy','Sharaffa Alfisyahr Putra','Musa Malaga Abdurrahman','Devin Damarso Daniswara','Uwais Abidzar Berghoti','M. Arsyad Atharizz Satriarso','Faqih Ghalibi Jillauz','Kenzie Ray Alkhalifi','Muhammad Luthfi Muhadzib','Syamil Khairan Alkahfi','Razatta Muhammad Kamaquinza','Jundi Zufar Lukman','Kiano Alfarezel Maheswara Nugraha','Alkhalifi Satria Riffi','Muhammad Fathan Athalla','Muhammad Faqih Rasydan','Ahmad Naufal Hariz','Maulana Fadhlullah','Abdurrahman Faiz Muharram','Muhammad Alfian Fathan','Alhasan Fatihuzzaman','Muhammad Rafi Bin Kuddah','Hanzalah Mufazzal Anandya','Ibnu Fachri Al Azis','Ezra Irvan Alfahri','Muhammad Farhan Kamil Prayata Rahman','Rasyad Azwar Bratasena','Ahmad Hafizh Al-Madani','Daffa Athaya Ramadhan','Muhammad Nizam','Kiandra Raffie El Rasyid','Ibrahim Abdulghani Darmawan','Azeema Ahsan Abdillah','Neil Mahardika Widyastoto','Muhammad Randi Hediyanto','Alief Nizam Hakim','Yahya','Scienza Zaffran Abdillah','Abdullah Razin Cahyohardo','Rafa Malik Al Syuhada','Muhammad Mishary Al-Ghazali','Muhammad Riffat Subhan','M Ihsan Abdurrahman','Adha Novero Sahlaa'];
const DEFAULT_AKHWAT = ["Qisya Izz Zara","Aisyah","Azzura Tsabita Qurrota A'yun","Kayyisah Shidqiyah","Kafiya Mahira Alija","Fakhira Kamila","Naira Maheswari Darmawan","Evelyn Qaireen Chandra","Kinatha Fredeli A","Mahira Rumaisha Azzahra","Kinatha Fredeli Arksi","Hafiza Waiters Azzalea","Aisyah Sulthanah Harjadinata","Zhafira Alya Ibrahim","Ameera Safiyyah Prasetyo","Fathiyya Yasmin","Humairoh","Maimunah","Shakira Rizka Alya Wahyudi","Dayyinah Azka Atsilah"];
const DEFAULT_IV_A = ['Ibrahim Afif Alfaizi','Ammaar Romadhon Pramana','Maulana Yusuf Ibrahim','Syafee Aliyyandaru Purchila','Yusuf Ahsanul Azzam','Zein Omar Kanz Ramadhan','Atharizz Nandaru Zihni','Hafidz Akbar Adikaputra','Zhafran Thara Arkananta','Harits Abdurrahman Saleh'];
const DEFAULT_IV_B = ['Nabil Zhafran Fahrezi','Adhyaksa Putra Ramadhan','Muhammad Arsyad Arrazy','Sharaffa Alfisyahr Putra','Musa Malaga Abdurrahman','Devin Damarso Daniswara','Uwais Abidzar Berghoti','M. Arsyad Atharizz Satriarso','Faqih Ghalibi Jillauz','Kenzie Ray Alkhalifi'];
const DEFAULT_IV_C = ["Qisya Izz Zara","Aisyah","Azzura Tsabita Qurrota A'yun","Kayyisah Shidqiyah","Kafiya Mahira Alija","Fakhira Kamila","Naira Maheswari Darmawan","Evelyn Qaireen Chandra","Kinatha Fredeli A","Mahira Rumaisha Azzahra"];

// ===== STATE =====
let people = buildPeople(DEFAULT_IKHWAN, DEFAULT_AKHWAT);
let queueA=[], queueB=[], callingA=null, callingB=null, counter=0;
let searchVal='', filterVal='all', ttsVol=0.9;
let femaleVoice=null, editingId=null;
let tvVideoSrc='', tvVideoType='youtube';
let ivPeople = buildIVPeople(DEFAULT_IV_A, DEFAULT_IV_B, DEFAULT_IV_C);
let ivQueueA=[], ivQueueB=[], ivQueueC=[];
let ivCallingA=null, ivCallingB=null, ivCallingC=null, ivCounter=0;
let ivSearchVal='', ivFilterVal='all', ivEditingId=null;
let isSaving=false, pendingSave=false;

function buildPeople(ikhwan, akhwat){
  return [
    ...ikhwan.map((name,i)=>({id:'i'+i,name,room:'A',status:'waiting',queuePos:0})),
    ...akhwat.map((name,i)=>({id:'a'+i,name,room:'B',status:'waiting',queuePos:0}))
  ];
}
function buildIVPeople(rA,rB,rC){
  return [
    ...rA.map((name,i)=>({id:'ia'+i,name,room:'IA',status:'waiting',queuePos:0})),
    ...rB.map((name,i)=>({id:'ib'+i,name,room:'IB',status:'waiting',queuePos:0})),
    ...rC.map((name,i)=>({id:'ic'+i,name,room:'IC',status:'waiting',queuePos:0}))
  ];
}

// ===== FIREBASE SYNC =====
function getState(){
  return {
    people, queueA, queueB, callingA, callingB, counter,
    ivPeople, ivQueueA, ivQueueB, ivQueueC,
    ivCallingA, ivCallingB, ivCallingC, ivCounter,
    tvVideoSrc, tvVideoType
  };
}

async function saveToFirebase(){
  if(isSaving){ pendingSave=true; return; }
  isSaving=true;
  try{
    await set(ref(db,'session'), getState());
    setConnStatus(true,'Tersimpan');
  } catch(e){
    setConnStatus(false,'Gagal simpan');
  }
  isSaving=false;
  if(pendingSave){ pendingSave=false; saveToFirebase(); }
}

function applyState(data){
  people      = data.people      || people;
  queueA      = data.queueA      || [];
  queueB      = data.queueB      || [];
  callingA    = data.callingA    ?? null;
  callingB    = data.callingB    ?? null;
  counter     = data.counter     || 0;
  ivPeople    = data.ivPeople    || ivPeople;
  ivQueueA    = data.ivQueueA    || [];
  ivQueueB    = data.ivQueueB    || [];
  ivQueueC    = data.ivQueueC    || [];
  ivCallingA  = data.ivCallingA  ?? null;
  ivCallingB  = data.ivCallingB  ?? null;
  ivCallingC  = data.ivCallingC  ?? null;
  ivCounter   = data.ivCounter   || 0;
  tvVideoSrc  = data.tvVideoSrc  || '';
  tvVideoType = data.tvVideoType || 'youtube';
  const vidInput = document.getElementById('video-url-input');
  if(vidInput) vidInput.value = tvVideoSrc;
  const ytRadio = document.getElementById('vt-youtube');
  const lcRadio = document.getElementById('vt-local');
  if(ytRadio){
    ytRadio.checked = tvVideoType==='youtube';
    if(tvVideoType==='gdrive') tvVideoType='youtube'; // gdrive tidak didukung, fallback ke youtube
    lcRadio.checked = tvVideoType==='local';
  }
}

// Listen real-time dari Firebase
let isFirstLoad = true;
// _localAction: true saat device INI yang memicu perubahan (admin)
// Saat Firebase mengirim update ke device lain (TV), _localAction = false → tidak speak
let _localAction = false;

onValue(ref(db,'session'), (snapshot)=>{
  const data = snapshot.val();
  if(data){
    applyState(data);
    setConnStatus(true,'Terhubung — real-time');
    if(isFirstLoad){ updateTVVideo(); isFirstLoad=false; }
  } else {
    saveToFirebase();
    setConnStatus(true,'Sesi baru dibuat');
    isFirstLoad=false;
  }
  _localAction = false;
  render();
}, (err)=>{
  setConnStatus(false,'Tidak terhubung');
});

// ===== CALL TRIGGER — real-time panggil lintas device =====
// Setiap klik "🔊 Panggil" → tulis ke /callTrigger, semua device dengar & berbunyi
let _lastCallTriggerTs = 0;

onValue(ref(db,'callTrigger'), (snapshot)=>{
  const d = snapshot.val();
  if(!d) return;
  // Abaikan event lama (mis. saat pertama kali load)
  if(d.ts <= _lastCallTriggerTs) return;
  _lastCallTriggerTs = d.ts;
  // Abaikan jika device ini sendiri yang memicu (sudah speak lokal)
  if(d.originId === _deviceId) return;
  // Bunyikan suara di device ini (TV/device lain)
  speak(d.name, d.room, d.isInterview);
});

// ID unik per device/tab supaya bisa diabaikan oleh pengirim
const _deviceId = Math.random().toString(36).slice(2);

async function triggerCallFirebase(name, room, isInterview){
  try {
    await set(ref(db,'callTrigger'), {
      ts: Date.now(),
      name,
      room,
      isInterview: !!isInterview,
      originId: _deviceId
    });
  } catch(e){ /* silent fail */ }
}

// _triggerSpeakFromFirebase removed — single callTrigger path used instead

// Wrapper: setiap perubahan state → simpan ke Firebase, lalu render
function render(){
  renderStats(); renderQueueFitting(); renderPersonListFitting();
  renderQueueIV(); renderPersonListIV(); renderTV(); renderEditor();
}
function saveAndRender(userAction=false){ 
  if(userAction) _localAction = true;
  saveToFirebase(); render(); 
}

// ===== TTS =====
function loadVoices(){
  if(!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  femaleVoice = voices.find(v=>v.lang==='id-ID'&&/female|wanita|perempuan/i.test(v.name))
    || voices.find(v=>v.lang==='id-ID')
    || voices.find(v=>v.lang.startsWith('id'))
    || voices.find(v=>v.lang==='ms-MY')
    || voices.find(v=>/female|woman/i.test(v.name)&&v.lang.startsWith('en'))
    || voices.find(v=>v.lang.startsWith('en'));
}
window.speechSynthesis && window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
loadVoices();

// ===== TTS ENGINE — stable, deduped, single-path =====
window._ttsMuted = false;
window._ttsLastKey = '';      // dedup: skip if same name+room already playing/queued
window._ttsPending = null;    // only 1 queued item at a time (drop older ones)
window._ttsBusy = false;

function speak(name, room, isInterview){
  if(!('speechSynthesis' in window) || window._ttsMuted) return;
  const roomLabel = isInterview
    ? `interview ruang ${room.replace('I','')}`
    : `fitting ruang ${room}`;
  const text = `Atas nama ${name}, silakan masuk ${roomLabel}`;
  const key  = name + '|' + room;

  // Deduplicate: jangan antri suara yang sama 2x dalam 5 detik
  if(key === window._ttsLastKey) return;
  window._ttsLastKey = key;
  // Reset key after 5s so same name CAN be called again later
  clearTimeout(window._ttsKeyReset);
  window._ttsKeyReset = setTimeout(()=>{ window._ttsLastKey=''; }, 5000);

  if(window._ttsBusy){
    // Replace pending (not queue — we only keep the latest)
    window._ttsPending = {text, key};
    return;
  }
  _ttsSpeak(text);
}

function _ttsSpeak(text){
  window._ttsBusy = true;
  setSpeakStatus('Memanggil...');
  window.speechSynthesis.cancel(); // clear any stale utterances

  // Watchdog: if onend never fires (browser bug), force-release after 12s
  const watchdog = setTimeout(()=>{
    window._ttsBusy = false;
    window.speechSynthesis.cancel();
    _ttsDrain();
  }, 12000);

  function _sayOnce(txt, cb){
    const u = new SpeechSynthesisUtterance(txt);
    if(femaleVoice) u.voice = femaleVoice;
    u.lang   = femaleVoice ? femaleVoice.lang : 'id-ID';
    u.volume = ttsVol;
    u.rate   = 0.82;
    u.pitch  = 1.1;
    u.onend  = cb;
    u.onerror = cb;
    window.speechSynthesis.speak(u);
  }
  // Speak once, pause 700ms, speak again
  _sayOnce(text, ()=>{
    setTimeout(()=>{
      _sayOnce(text, ()=>{
        clearTimeout(watchdog);
        window._ttsBusy = false;
        setSpeakStatus('Siap');
        setTimeout(_ttsDrain, 400);
      });
    }, 700);
  });
}

function _ttsDrain(){
  if(window._ttsPending && !window._ttsBusy){
    const {text} = window._ttsPending;
    window._ttsPending = null;
    _ttsSpeak(text);
  }
}

window.toggleMute=function(){
  window._ttsMuted=!window._ttsMuted;
  const btn=document.getElementById('btn-mute');
  if(btn) btn.textContent=window._ttsMuted?'🔇 Unmute Suara':'🔕 Mute Suara';
  if(window._ttsMuted){ window.speechSynthesis.cancel(); window._ttsBusy=false; window._ttsQueue=[]; setSpeakStatus('Siap (mute)'); }
  else setSpeakStatus('Siap');
};
function setSpeakStatus(txt){
  const el=document.getElementById('tts-status');
  if(!el) return;
  el.textContent=txt;
  el.style.color=txt==='Siap'?'#22c55e':txt.includes('Memanggil')?'#f59e0b':'#888';
}
window.testTTS=()=>speak('Zein Omar Kanz Ramadhan','A',false);
window.stopTTS=function(){
  if('speechSynthesis' in window){ window.speechSynthesis.cancel(); }
  window._ttsBusy=false;
  window._ttsQueue=[];
  setSpeakStatus('Siap');
};

// ===== QUEUE LOGIC: FITTING =====
window.markHadir=function(id){
  const p=people.find(x=>x.id===id);
  if(!p||p.status!=='waiting') return;
  counter++; p.status='present'; p.queuePos=counter;
  if(p.room==='A') queueA.push(id); else queueB.push(id);
  // Tidak autoCall — hanya tombol 🔊 yang memindahkan ke dipanggil + suara
  saveAndRender(true);
};
window.undoHadir=function(id){
  const p=people.find(x=>x.id===id); if(!p) return;
  const wA=callingA===id, wB=callingB===id;
  queueA=queueA.filter(x=>x!==id); queueB=queueB.filter(x=>x!==id);
  if(wA){callingA=null;window.speechSynthesis&&window.speechSynthesis.cancel();}
  if(wB){callingB=null;window.speechSynthesis&&window.speechSynthesis.cancel();}
  p.status='waiting'; p.queuePos=0;
  const rem=[...queueA,...queueB].map(qid=>people.find(x=>x.id===qid)).filter(Boolean);
  counter=rem.length>0?Math.max(...rem.map(x=>x.queuePos)):0;
  if(wA) autoCall(); if(wB) autoCall();
  saveAndRender();
};
function autoCall(){
  if(callingA===null&&queueA.length>0){callingA=queueA.shift();const p=people.find(x=>x.id===callingA);if(p) p.status='calling';}
  if(callingB===null&&queueB.length>0){callingB=queueB.shift();const p=people.find(x=>x.id===callingB);if(p) p.status='calling';}
}
function autoCallWithSpeak(){
  const prevA=callingA, prevB=callingB;
  autoCall();
  if(callingA!==prevA&&callingA!==null){const p=people.find(x=>x.id===callingA);if(p) speak(p.name,'A',false);}
  if(callingB!==prevB&&callingB!==null){const p=people.find(x=>x.id===callingB);if(p) speak(p.name,'B',false);}
}
window.markDone=function(room){
  if(room==='A'&&callingA!==null){const p=people.find(x=>x.id===callingA);if(p)p.status='done';callingA=null;}
  else if(room==='B'&&callingB!==null){const p=people.find(x=>x.id===callingB);if(p)p.status='done';callingB=null;}
  // Tidak autoCall — tombol 🔊 yang akan memanggil berikutnya
  saveAndRender(true);
};
window.markMasuk=function(id){
  const p=people.find(x=>x.id===id); if(!p||p.status!=='calling') return;
  p.status='agenda';
  if(callingA===id) callingA=null;
  else if(callingB===id) callingB=null;
  // Tidak autoCall — tombol 🔊 yang memanggil berikutnya
  saveAndRender();
};
window.markDoneAgenda=function(id){
  const p=people.find(x=>x.id===id); if(!p) return;
  p.status='done'; saveAndRender(true);
};
window.replaySpeak=function(id){
  const p=people.find(x=>x.id===id);
  if(!p) return;
  // Jika ruang kosong, ambil dari antrian dulu
  if(p.room==='A' && callingA===null && queueA.length>0){
    callingA=queueA.shift(); const np=people.find(x=>x.id===callingA);
    if(np){np.status='calling'; speak(np.name,'A',false); triggerCallFirebase(np.name,'A',false); saveAndRender(true); return;}
  }
  if(p.room==='B' && callingB===null && queueB.length>0){
    callingB=queueB.shift(); const np=people.find(x=>x.id===callingB);
    if(np){np.status='calling'; speak(np.name,'B',false); triggerCallFirebase(np.name,'B',false); saveAndRender(true); return;}
  }
  // Ruang sudah ada yang calling → replay nama itu
  speak(p.name,p.room,false);
  triggerCallFirebase(p.name,p.room,false);
};

// ===== QUEUE LOGIC: INTERVIEW =====
window.markHadirIV=function(id){
  const p=ivPeople.find(x=>x.id===id); if(!p||p.status!=='waiting') return;
  ivCounter++; p.status='present'; p.queuePos=ivCounter;
  if(p.room==='IA') ivQueueA.push(id);
  else if(p.room==='IB') ivQueueB.push(id);
  else ivQueueC.push(id);
  // Tidak autoCallIV — hanya tombol 🔊 yang memindahkan ke dipanggil + suara
  saveAndRender(true);
};
window.undoHadirIV=function(id){
  const p=ivPeople.find(x=>x.id===id); if(!p) return;
  const wA=ivCallingA===id,wB=ivCallingB===id,wC=ivCallingC===id;
  ivQueueA=ivQueueA.filter(x=>x!==id); ivQueueB=ivQueueB.filter(x=>x!==id); ivQueueC=ivQueueC.filter(x=>x!==id);
  if(wA){ivCallingA=null;window.speechSynthesis&&window.speechSynthesis.cancel();}
  if(wB){ivCallingB=null;window.speechSynthesis&&window.speechSynthesis.cancel();}
  if(wC){ivCallingC=null;window.speechSynthesis&&window.speechSynthesis.cancel();}
  p.status='waiting'; p.queuePos=0;
  const rem=[...ivQueueA,...ivQueueB,...ivQueueC].map(qid=>ivPeople.find(x=>x.id===qid)).filter(Boolean);
  ivCounter=rem.length>0?Math.max(...rem.map(x=>x.queuePos)):0;
  if(wA||wB||wC) autoCallIV();
  saveAndRender();
};
function autoCallIV(){
  if(ivCallingA===null&&ivQueueA.length>0){ivCallingA=ivQueueA.shift();const p=ivPeople.find(x=>x.id===ivCallingA);if(p) p.status='calling';}
  if(ivCallingB===null&&ivQueueB.length>0){ivCallingB=ivQueueB.shift();const p=ivPeople.find(x=>x.id===ivCallingB);if(p) p.status='calling';}
  if(ivCallingC===null&&ivQueueC.length>0){ivCallingC=ivQueueC.shift();const p=ivPeople.find(x=>x.id===ivCallingC);if(p) p.status='calling';}
}
function autoCallIVWithSpeak(){
  const prevA=ivCallingA, prevB=ivCallingB, prevC=ivCallingC;
  autoCallIV();
  if(ivCallingA!==prevA&&ivCallingA!==null){const p=ivPeople.find(x=>x.id===ivCallingA);if(p) speak(p.name,'IA',true);}
  if(ivCallingB!==prevB&&ivCallingB!==null){const p=ivPeople.find(x=>x.id===ivCallingB);if(p) speak(p.name,'IB',true);}
  if(ivCallingC!==prevC&&ivCallingC!==null){const p=ivPeople.find(x=>x.id===ivCallingC);if(p) speak(p.name,'IC',true);}
}
window.markDoneIV=function(room){
  if(room==='IA'&&ivCallingA!==null){const p=ivPeople.find(x=>x.id===ivCallingA);if(p)p.status='done';ivCallingA=null;}
  else if(room==='IB'&&ivCallingB!==null){const p=ivPeople.find(x=>x.id===ivCallingB);if(p)p.status='done';ivCallingB=null;}
  else if(room==='IC'&&ivCallingC!==null){const p=ivPeople.find(x=>x.id===ivCallingC);if(p)p.status='done';ivCallingC=null;}
  // Tidak autoCallIV — tombol 🔊 yang memanggil berikutnya
  saveAndRender(true);
};
window.markMasukIV=function(id){
  const p=ivPeople.find(x=>x.id===id); if(!p||p.status!=='calling') return;
  p.status='agenda';
  if(ivCallingA===id) ivCallingA=null;
  else if(ivCallingB===id) ivCallingB=null;
  else if(ivCallingC===id) ivCallingC=null;
  // Tidak autoCallIV — tombol 🔊 yang memanggil berikutnya
  saveAndRender();
};
window.markDoneAgendaIV=function(id){
  const p=ivPeople.find(x=>x.id===id); if(!p) return;
  p.status='done'; saveAndRender(true);
};
window.replaySpeakIV=function(id){
  const p=ivPeople.find(x=>x.id===id);
  if(!p) return;
  if(p.room==='IA' && ivCallingA===null && ivQueueA.length>0){
    ivCallingA=ivQueueA.shift(); const np=ivPeople.find(x=>x.id===ivCallingA);
    if(np){np.status='calling'; speak(np.name,'IA',true); triggerCallFirebase(np.name,'IA',true); saveAndRender(true); return;}
  }
  if(p.room==='IB' && ivCallingB===null && ivQueueB.length>0){
    ivCallingB=ivQueueB.shift(); const np=ivPeople.find(x=>x.id===ivCallingB);
    if(np){np.status='calling'; speak(np.name,'IB',true); triggerCallFirebase(np.name,'IB',true); saveAndRender(true); return;}
  }
  if(p.room==='IC' && ivCallingC===null && ivQueueC.length>0){
    ivCallingC=ivQueueC.shift(); const np=ivPeople.find(x=>x.id===ivCallingC);
    if(np){np.status='calling'; speak(np.name,'IC',true); triggerCallFirebase(np.name,'IC',true); saveAndRender(true); return;}
  }
  speak(p.name,p.room,true);
  triggerCallFirebase(p.name,p.room,true);
};

// ===== RENDER =====
function renderStats(){
  const tot=people.length,sel=people.filter(p=>p.status==='done').length;
  const ivTot=ivPeople.length,ivSel=ivPeople.filter(p=>p.status==='done').length;
  document.getElementById('stats-row').innerHTML=`
    <div class="stat"><div class="stat-label">Total Peserta Fitting</div><div class="stat-value">${tot}</div></div>
    <div class="stat"><div class="stat-label">Fitting Selesai</div><div class="stat-value" style="color:#15803d">${sel}/${tot}</div></div>
    <div class="stat" style="background:#fffbeb;border-color:#fde68a"><div class="stat-label">Total Peserta Interview</div><div class="stat-value">${ivTot}</div></div>
    <div class="stat" style="background:#fffbeb;border-color:#fde68a"><div class="stat-label">Interview Selesai</div><div class="stat-value" style="color:#b45309">${ivSel}/${ivTot}</div></div>
    <div class="stat" style="background:#f5f3ff;border-color:#ddd6fe"><div class="stat-label">Interview Aktif</div><div class="stat-value" style="color:#7c3aed">${ivPeople.filter(p=>p.status==='calling'||p.status==='present'||p.status==='agenda').length}</div></div>`;
}

function renderQueueFitting(){
  const el=document.getElementById('queue-list-fitting');
  const active=people.filter(p=>p.status==='calling'||p.status==='present'||p.status==='agenda').sort((a,b)=>a.queuePos-b.queuePos);
  if(!active.length){el.innerHTML='<p style="font-size:13px;color:#aaa;padding:8px 0">Belum ada antrian.</p>';return;}
  el.innerHTML=active.map((p,i)=>{
    const isCalling=p.status==='calling', isAgenda=p.status==='agenda';
    const rb=p.room==='A'?`<span class="room-badge badge-a">Ruang A — Ikhwan</span>`:`<span class="room-badge badge-b">Ruang B — Akhwat</span>`;
    let actionBtns='';
    if(isCalling) actionBtns=`<button class="btn btn-masuk" onclick="markMasuk('${p.id}')">✅ Masuk</button><button class="btn btn-done" onclick="markDone('${p.room}')">✓ Selesai</button><button class="btn btn-replay" onclick="replaySpeak('${p.id}')">🔊 Panggil</button>`;
    else if(isAgenda) actionBtns=`<span style="font-size:11px;padding:3px 8px;border-radius:5px;background:#f5f3ff;color:#7c3aed;font-weight:600">🟣 Dalam agenda</span><button class="btn btn-done" onclick="markDoneAgenda('${p.id}')" style="border-color:#a78bfa;background:#f5f3ff;color:#7c3aed">✓ Selesai</button>`;
    else actionBtns=`<button class="btn btn-replay" onclick="replaySpeak('${p.id}')">🔊 Panggil</button><button class="btn" style="border:1px solid #86efac;background:#f0fdf4;color:#15803d" onclick="markDirectDone('${p.id}')">✓ Skip</button>`;
    return`<div class="queue-item ${isCalling?'calling':isAgenda?'queue-item-agenda':''}" data-id="${p.id}" data-room="${p.room}" data-type="fitting" draggable="${!isCalling&&!isAgenda}">
      <span class="drag-handle" title="Drag untuk ubah urutan">⠿</span>
      <span class="queue-num">${isCalling?'📢':isAgenda?'🟣':i+1}</span>
      <span class="queue-name">${p.name}</span>
      ${rb}${actionBtns}
      <button class="btn btn-undo" onclick="undoHadir('${p.id}')">↩</button>
    </div>`;
  }).join('');
  _bindDragFitting();
}

function renderQueueIV(){
  const el=document.getElementById('queue-list-iv');
  const active=ivPeople.filter(p=>p.status==='calling'||p.status==='present'||p.status==='agenda').sort((a,b)=>a.queuePos-b.queuePos);
  if(!active.length){el.innerHTML='<p style="font-size:13px;color:#aaa;padding:8px 0">Belum ada antrian interview.</p>';return;}
  el.innerHTML=active.map((p,i)=>{
    const isCalling=p.status==='calling', isAgenda=p.status==='agenda';
    const roomLabel={'IA':'Ruang Interview A','IB':'Ruang Interview B','IC':'Ruang Interview C'}[p.room];
    const badgeClass={'IA':'badge-ia','IB':'badge-ib','IC':'badge-ic'}[p.room];
    let actionBtns='';
    if(isCalling) actionBtns=`<button class="btn btn-masuk" onclick="markMasukIV('${p.id}')">✅ Masuk</button><button class="btn btn-done-iv" onclick="markDoneIV('${p.room}')">✓ Selesai</button><button class="btn btn-replay" onclick="replaySpeakIV('${p.id}')">🔊 Panggil</button>`;
    else if(isAgenda) actionBtns=`<span style="font-size:11px;padding:3px 8px;border-radius:5px;background:#f5f3ff;color:#7c3aed;font-weight:600">🟣 Dalam agenda</span><button class="btn btn-done-iv" onclick="markDoneAgendaIV('${p.id}')" style="border-color:#a78bfa;background:#f5f3ff;color:#7c3aed">✓ Selesai</button>`;
    else actionBtns=`<button class="btn btn-replay" onclick="replaySpeakIV('${p.id}')">🔊 Panggil</button><button class="btn" style="border:1px solid #86efac;background:#f0fdf4;color:#15803d" onclick="markDirectDoneIV('${p.id}')">✓ Skip</button>`;
    return`<div class="queue-item ${isCalling?'calling-iv':isAgenda?'queue-item-agenda':''}" data-id="${p.id}" data-room="${p.room}" data-type="iv" draggable="${!isCalling&&!isAgenda}">
      <span class="drag-handle" title="Drag untuk ubah urutan">⠿</span>
      <span class="queue-num">${isCalling?'📢':isAgenda?'🟣':i+1}</span>
      <span class="queue-name">${p.name}</span>
      <span class="room-badge ${badgeClass}">${roomLabel}</span>
      ${actionBtns}
      <button class="btn btn-undo" onclick="undoHadirIV('${p.id}')">↩</button>
    </div>`;
  }).join('');
  _bindDragIV();
}

function renderPersonListFitting(){
  const el=document.getElementById('person-list-fitting');
  const list=people.filter(p=>{
    const ms=p.name.toLowerCase().includes(searchVal);
    const mf=filterVal==='all'||(filterVal==='waiting'&&p.status==='waiting')
      ||(filterVal==='present'&&(p.status==='present'||p.status==='calling'||p.status==='agenda'))
      ||(filterVal==='done'&&p.status==='done');
    return ms&&mf;
  });
  el.innerHTML=list.map(p=>{
    const dot=`<div class="status-dot dot-${p.status==='calling'?'calling':p.status==='agenda'?'agenda':p.status}"></div>`;
    const tag=p.room==='A'?`<span class="tag-a">Ikhwan</span>`:`<span class="tag-b">Akhwat</span>`;
    let action='';
    if(p.status==='waiting') action=`<button class="btn-hadir" onclick="markHadir('${p.id}')">Hadir</button>`;
    else if(p.status==='present') action=`<span class="status-label sl-antri">Antri</span><button class="btn-undo-sm" onclick="undoHadir('${p.id}')" style="margin-left:4px">↩ Undo</button>`;
    else if(p.status==='calling') action=`<span class="status-label sl-dipanggil">Dipanggil</span><button class="btn-undo-sm" onclick="undoHadir('${p.id}')" style="margin-left:4px">↩ Undo</button>`;
    else if(p.status==='agenda') action=`<span class="status-label sl-agenda">Dalam Agenda</span><button class="btn-undo-sm" onclick="undoHadir('${p.id}')" style="margin-left:4px">↩ Undo</button>`;
    else action=`<span class="status-label sl-selesai">Selesai</span><button class="btn-undo-sm" onclick="undoHadir('${p.id}')" style="margin-left:4px">↩ Undo</button>`;
    return`<div class="person-item">${dot}<span class="person-name">${p.name}</span>${tag}${action}</div>`;
  }).join('')||'<p style="font-size:13px;color:#aaa;padding:8px 0">Tidak ditemukan.</p>';
}

function renderPersonListIV(){
  const el=document.getElementById('person-list-iv');
  const list=ivPeople.filter(p=>{
    const ms=p.name.toLowerCase().includes(ivSearchVal);
    const mf=ivFilterVal==='all'||(ivFilterVal==='waiting'&&p.status==='waiting')
      ||(ivFilterVal==='present'&&(p.status==='present'||p.status==='calling'||p.status==='agenda'))
      ||(ivFilterVal==='done'&&p.status==='done');
    return ms&&mf;
  });
  const roomMap={'IA':['tag-ia','Ruang IA'],'IB':['tag-ib','Ruang IB'],'IC':['tag-ic','Ruang IC']};
  el.innerHTML=list.map(p=>{
    const dotClass=p.status==='calling'?'dot-iv-calling':p.status==='done'?'dot-iv-done':p.status==='agenda'?'dot-iv-agenda':p.status==='present'?'dot-iv-present':'dot-waiting';
    const [tc,tl]=roomMap[p.room]||['tag-a','?'];
    let action='';
    if(p.status==='waiting') action=`<button class="btn-hadir" onclick="markHadirIV('${p.id}')">Hadir</button>`;
    else if(p.status==='present') action=`<span class="status-label sl-antri">Antri</span><button class="btn-undo-sm" onclick="undoHadirIV('${p.id}')" style="margin-left:4px">↩ Undo</button>`;
    else if(p.status==='calling') action=`<span class="status-label sl-dipanggil">Dipanggil</span><button class="btn-undo-sm" onclick="undoHadirIV('${p.id}')" style="margin-left:4px">↩ Undo</button>`;
    else if(p.status==='agenda') action=`<span class="status-label sl-agenda">Dalam Agenda</span><button class="btn-undo-sm" onclick="undoHadirIV('${p.id}')" style="margin-left:4px">↩ Undo</button>`;
    else action=`<span class="status-label sl-iv-selesai">Selesai</span><button class="btn-undo-sm" onclick="undoHadirIV('${p.id}')" style="margin-left:4px">↩ Undo</button>`;
    return`<div class="person-item"><div class="status-dot ${dotClass}"></div><span class="person-name">${p.name}</span><span class="${tc}">${tl}</span>${action}</div>`;
  }).join('')||'<p style="font-size:13px;color:#aaa;padding:8px 0">Tidak ditemukan.</p>';
}

// ===== TV THEME =====
let tvDark=true;
window.toggleTVTheme=function(){
  tvDark=!tvDark;
  const wrap=document.getElementById('tv-wrap');
  const btn=document.getElementById('tv-theme-toggle');
  if(tvDark){wrap.classList.remove('tv-light');if(btn)btn.textContent='☀️ Mode Terang';}
  else{wrap.classList.add('tv-light');if(btn)btn.textContent='🌙 Mode Gelap';}
};

// ===== VIDEO (ROBUST LOOPING) =====
function extractYouTubeId(src){
  const m=src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
// extractGDriveId removed — Google Drive tidak didukung browser karena X-Frame-Options
function makeVideoLoop(panel, src){
  // Remove old element to force reload
  const old=panel.querySelector('video');
  if(old) old.remove();
  const v=document.createElement('video');
  v.src=src; v.autoplay=true; v.loop=true; v.muted=true; v.playsInline=true;
  v.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border:none';
  // Auto-restart on stall
  v.addEventListener('ended', ()=>{ v.currentTime=0; v.play(); });
  v.addEventListener('error', ()=>{ setTimeout(()=>{ v.load(); v.play(); }, 2000); });
  v.addEventListener('stalled', ()=>{ v.load(); v.play(); });
  panel.innerHTML='';
  panel.appendChild(v);
  v.play().catch(()=>{});
}
function updateTVVideo(){
  const panel=document.getElementById('tv-video-panel');
  if(!panel) return;
  const src=tvVideoSrc.trim();
  if(!src){
    panel.innerHTML=`<div class="tv-video-placeholder"><div class="tv-video-icon">🎬</div><div>Video belum dikonfigurasi</div><div style="font-size:11px;margin-top:4px;opacity:.6">Atur di tab Edit → bagian Video</div></div>`;
    return;
  }
  if(tvVideoType==='youtube'){
    const vid=extractYouTubeId(src);
    if(vid){
      // YouTube embed: autoplay, muted, loop. enablejsapi for added reliability.
      const embedUrl=`https://www.youtube.com/embed/${vid}?autoplay=1&mute=1&loop=1&playlist=${vid}&controls=0&rel=0&enablejsapi=1&origin=${encodeURIComponent(location.origin||location.href)}`;
      panel.innerHTML=`<iframe id="tv-yt-frame" src="${embedUrl}" allow="autoplay; encrypted-media" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:none"></iframe>`;
      // Watchdog: reload iframe if video stops (YouTube sometimes ignores loop param)
      clearInterval(window._ytWatchdog);
      window._ytWatchdog = setInterval(()=>{
        const fr=document.getElementById('tv-yt-frame');
        if(!fr) return;
        // Reset src to force restart after 4h (86400s safety)
        const url=new URL(fr.src);
        // noop — YouTube embed loop=1 handles it; watchdog is just a safety net
      }, 3600000);
    } else {
      panel.innerHTML=`<div class="tv-video-placeholder"><div class="tv-video-icon">⚠️</div><div>URL YouTube tidak valid</div></div>`;
    }
  } else {
    // Direct URL / local file — use <video> with loop+watchdog
    makeVideoLoop(panel, src);
  }
}

window.updateTVVideo=function(){
  const input=document.getElementById('video-url-input');
  if(input) tvVideoSrc=input.value.trim();
  updateTVVideo();
  saveToFirebase();
};

// ===== TV RENDER =====
function makeQCard(cardCls,calling,roomName){
  const isActive=calling!==null;
  const isAgenda=isActive&&calling.status==='agenda';
  let nameHtml;
  if(isActive){
    const statusText=isAgenda?'🟣 Sedang dalam agenda':'📢 Dipanggil';
    nameHtml=`<div class="tv-qcard-name">${calling.name}</div><div class="tv-qcard-status">${statusText}</div>`;
  } else {
    nameHtml=`<div class="tv-qcard-name tv-empty">Ruangan kosong</div>`;
  }
  return`<div class="tv-qcard ${cardCls}${isActive?' tv-qactive':''}"><div class="tv-qcard-room-label">${roomName}</div>${nameHtml}</div>`;
}

function renderTV(){
  const pA=callingA!==null?people.find(x=>x.id===callingA):null;
  const pB=callingB!==null?people.find(x=>x.id===callingB):null;
  const pIA=ivCallingA!==null?ivPeople.find(x=>x.id===ivCallingA):null;
  const pIB=ivCallingB!==null?ivPeople.find(x=>x.id===ivCallingB):null;
  const pIC=ivCallingC!==null?ivPeople.find(x=>x.id===ivCallingC):null;
  const nA=queueA.map(id=>people.find(x=>x.id===id)).filter(Boolean);
  const nB=queueB.map(id=>people.find(x=>x.id===id)).filter(Boolean);
  const nIA=ivQueueA.map(id=>ivPeople.find(x=>x.id===id)).filter(Boolean);
  const nIB=ivQueueB.map(id=>ivPeople.find(x=>x.id===id)).filter(Boolean);
  const nIC=ivQueueC.map(id=>ivPeople.find(x=>x.id===id)).filter(Boolean);
  const agendaA=people.find(x=>x.room==='A'&&x.status==='agenda')||null;
  const agendaB=people.find(x=>x.room==='B'&&x.status==='agenda')||null;
  const agendaIA=ivPeople.find(x=>x.room==='IA'&&x.status==='agenda')||null;
  const agendaIB=ivPeople.find(x=>x.room==='IB'&&x.status==='agenda')||null;
  const agendaIC=ivPeople.find(x=>x.room==='IC'&&x.status==='agenda')||null;

  const qRow=document.getElementById('tv-queue-row');
  if(qRow) qRow.innerHTML=
    makeQCard('tv-qcard-a',pA||agendaA,'Fitting — Ikhwan')+
    makeQCard('tv-qcard-b',pB||agendaB,'Fitting — Akhwat')+
    makeQCard('tv-qcard-ia',pIA||agendaIA,'Interview A')+
    makeQCard('tv-qcard-ib',pIB||agendaIB,'Interview B')+
    makeQCard('tv-qcard-ic',pIC||agendaIC,'Interview C');

  // ===== MIDDLE QUEUE PANEL =====
  // Fitting queue: all present people sorted by queuePos (arrival order), both rooms merged
  const fittingQueue = [
    ...nA.map(p=>({...p,_rClass:'tv-mq-room-a',_rLabel:'Ruang A'})),
    ...nB.map(p=>({...p,_rClass:'tv-mq-room-b',_rLabel:'Ruang B'}))
  ].sort((a,b)=>a.queuePos-b.queuePos);

  const fittingEl = document.getElementById('tv-mq-fitting');
  if(fittingEl){
    if(!fittingQueue.length){
      fittingEl.innerHTML='<div class="tv-mq-empty">Belum ada antrian</div>';
    } else {
      fittingEl.innerHTML = fittingQueue.map((p,i)=>
        `<div class="tv-mq-item">
          <span class="tv-mq-num">${i+1}</span>
          <span class="tv-mq-name">${p.name}</span>
          <span class="tv-mq-room ${p._rClass}">${p._rLabel}</span>
        </div>`
      ).join('');
    }
  }

  // Interview queue: all present sorted by queuePos, all rooms merged
  const ivQueue = [
    ...nIA.map(p=>({...p,_rClass:'tv-mq-room-ia',_rLabel:'IV-A'})),
    ...nIB.map(p=>({...p,_rClass:'tv-mq-room-ib',_rLabel:'IV-B'})),
    ...nIC.map(p=>({...p,_rClass:'tv-mq-room-ic',_rLabel:'IV-C'}))
  ].sort((a,b)=>a.queuePos-b.queuePos);

  const ivEl = document.getElementById('tv-mq-interview');
  if(ivEl){
    if(!ivQueue.length){
      ivEl.innerHTML='<div class="tv-mq-empty">Belum ada antrian</div>';
    } else {
      ivEl.innerHTML = ivQueue.map((p,i)=>
        `<div class="tv-mq-item">
          <span class="tv-mq-num">${i+1}</span>
          <span class="tv-mq-name">${p.name}</span>
          <span class="tv-mq-room ${p._rClass}">${p._rLabel}</span>
        </div>`
      ).join('');
    }
  }
  // ===== END MIDDLE QUEUE PANEL =====

  const nowEl=document.getElementById('tv-now-calling-body');
  if(nowEl){
    const allCalling=[pA?{p:pA,room:'Fitting Ikhwan'}:null,pB?{p:pB,room:'Fitting Akhwat'}:null,pIA?{p:pIA,room:'Interview A'}:null,pIB?{p:pIB,room:'Interview B'}:null,pIC?{p:pIC,room:'Interview C'}:null].filter(Boolean);
    if(!allCalling.length) nowEl.innerHTML='<div class="tv-now-empty">Belum ada yang dipanggil</div>';
    else if(allCalling.length===1){
      const {p,room}=allCalling[0];
      nowEl.innerHTML=`<div class="tv-now-room-badge">${room}</div><div class="tv-now-name">${p.name}</div><div class="tv-now-call-text">📢 Silakan masuk ke ruangan</div>`;
    } else {
      nowEl.innerHTML=`<div class="tv-now-multi-wrap">${allCalling.map(({p,room})=>`<div class="tv-now-multi-item"><span class="tv-now-multi-room">${room}</span><span class="tv-now-multi-name">${p.name}</span><span class="tv-now-multi-sub">📢 Masuk</span></div>`).join('')}</div>`;
    }
  }

  const tickerPeople=[...nA.map(p=>({...p,_label:'Fitting A'})),...nB.map(p=>({...p,_label:'Fitting B'})),...nIA.map(p=>({...p,_label:'Interview A'})),...nIB.map(p=>({...p,_label:'Interview B'})),...nIC.map(p=>({...p,_label:'Interview C'}))];
  const footerEl=document.getElementById('tv-footer');
  if(!tickerPeople.length){footerEl.innerHTML='';return;}
  const items=[...tickerPeople,...tickerPeople].map(p=>`<span class="tv-ticker-item">${p.name} <span style="opacity:.5;font-size:10px">${p._label}</span></span>`).join('');
  const dur=Math.max(18,tickerPeople.length*4);
  footerEl.innerHTML=`<div class="tv-ticker-wrap"><span class="tv-ticker-label">⏳ Antrian Berikutnya</span><div class="tv-ticker-track"><div class="tv-ticker-inner" style="animation-duration:${dur}s">${items}</div></div></div>`;
}

// ===== EDITOR =====
function renderEditor(){
  const ikhwan=people.filter(p=>p.room==='A'),akhwat=people.filter(p=>p.room==='B');
  const ivA=ivPeople.filter(p=>p.room==='IA'),ivB=ivPeople.filter(p=>p.room==='IB'),ivC=ivPeople.filter(p=>p.room==='IC');
  document.getElementById('count-a').textContent=`(${ikhwan.length} orang)`;
  document.getElementById('count-b').textContent=`(${akhwat.length} orang)`;
  document.getElementById('count-ia').textContent=`(${ivA.length} orang)`;
  document.getElementById('count-ib').textContent=`(${ivB.length} orang)`;
  document.getElementById('count-ic').textContent=`(${ivC.length} orang)`;
  document.getElementById('editor-list-a').innerHTML=ikhwan.map(p=>editorItem(p,'fitting')).join('');
  document.getElementById('editor-list-b').innerHTML=akhwat.map(p=>editorItem(p,'fitting')).join('');
  document.getElementById('editor-list-ia').innerHTML=ivA.map(p=>editorItem(p,'iv')).join('');
  document.getElementById('editor-list-ib').innerHTML=ivB.map(p=>editorItem(p,'iv')).join('');
  document.getElementById('editor-list-ic').innerHTML=ivC.map(p=>editorItem(p,'iv')).join('');
}
function editorItem(p,type){
  const canEdit=p.status==='waiting';
  const statusNote=p.status!=='waiting'?`<span style="font-size:11px;color:#aaa">(${p.status==='done'?'selesai':p.status==='calling'?'dipanggil':p.status==='agenda'?'agenda':'antri'})</span>`:'';
  const editFn=type==='iv'?'startEditIV':'startEdit';
  const saveFn=type==='iv'?'saveNameIV':'saveName';
  const cancelFn=type==='iv'?'cancelEditIV':'cancelEdit';
  const delFn=type==='iv'?'deletePersonIV':'deletePerson';
  const editingIdVal=type==='iv'?ivEditingId:editingId;
  if(editingIdVal===p.id) return`<li class="editor-item"><input id="edit-input-${p.id}" value="${p.name}" onkeydown="if(event.key==='Enter')${saveFn}('${p.id}')"><button class="btn-save-name" onclick="${saveFn}('${p.id}')">✓ Simpan</button><button class="btn-edit-name" onclick="${cancelFn}()">✕</button></li>`;
  return`<li class="editor-item"><span class="editor-item-name">${p.name}</span>${statusNote}${canEdit?`<button class="btn-edit-name" onclick="${editFn}('${p.id}')">Edit</button>`:''} ${canEdit?`<button class="btn-del" onclick="${delFn}('${p.id}')">Hapus</button>`:''}</li>`;
}
window.startEdit=function(id){editingId=id;renderEditor();setTimeout(()=>{const el=document.getElementById('edit-input-'+id);if(el){el.focus();el.select();}},50);};
window.cancelEdit=function(){editingId=null;renderEditor();};
window.saveName=function(id){
  const el=document.getElementById('edit-input-'+id); if(!el) return;
  const newName=el.value.trim(); if(!newName) return;
  const p=people.find(x=>x.id===id); if(p) p.name=newName;
  editingId=null; saveAndRender();
};
window.deletePerson=function(id){
  const p=people.find(x=>x.id===id); if(!p||p.status!=='waiting') return;
  if(!confirm(`Hapus "${p.name}" dari daftar?`)) return;
  people=people.filter(x=>x.id!==id); saveAndRender();
};
window.addPerson=function(room){
  const inputId=room==='A'?'add-a':'add-b';
  const el=document.getElementById(inputId); const name=el.value.trim(); if(!name) return;
  people.push({id:(room==='A'?'i':'a')+Date.now(),name,room,status:'waiting',queuePos:0});
  el.value=''; saveAndRender();
};
window.startEditIV=function(id){ivEditingId=id;renderEditor();setTimeout(()=>{const el=document.getElementById('edit-input-'+id);if(el){el.focus();el.select();}},50);};
window.cancelEditIV=function(){ivEditingId=null;renderEditor();};
window.saveNameIV=function(id){
  const el=document.getElementById('edit-input-'+id); if(!el) return;
  const newName=el.value.trim(); if(!newName) return;
  const p=ivPeople.find(x=>x.id===id); if(p) p.name=newName;
  ivEditingId=null; saveAndRender();
};
window.deletePersonIV=function(id){
  const p=ivPeople.find(x=>x.id===id); if(!p||p.status!=='waiting') return;
  if(!confirm(`Hapus "${p.name}" dari daftar interview?`)) return;
  ivPeople=ivPeople.filter(x=>x.id!==id); saveAndRender();
};
window.addPersonIV=function(room){
  const inputId={'IA':'add-ia','IB':'add-ib','IC':'add-ic'}[room];
  const el=document.getElementById(inputId); const name=el.value.trim(); if(!name) return;
  const prefix={'IA':'ia','IB':'ib','IC':'ic'}[room];
  ivPeople.push({id:prefix+Date.now(),name,room,status:'waiting',queuePos:0});
  el.value=''; saveAndRender();
};

// ===== EXPORT / IMPORT =====
window.exportJSON=function(){
  const data={ikhwan:people.filter(p=>p.room==='A').map(p=>p.name),akhwat:people.filter(p=>p.room==='B').map(p=>p.name),interview_a:ivPeople.filter(p=>p.room==='IA').map(p=>p.name),interview_b:ivPeople.filter(p=>p.room==='IB').map(p=>p.name),interview_c:ivPeople.filter(p=>p.room==='IC').map(p=>p.name)};
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='peserta_alwafi.json';a.click();
};
window.exportTXT=function(){
  let txt='=== FITTING SERAGAM ===\n\n--- IKHWAN (Ruang A) ---\n';
  people.filter(p=>p.room==='A').forEach((p,i)=>txt+=`${i+1}. ${p.name}\n`);
  txt+='\n--- AKHWAT (Ruang B) ---\n';
  people.filter(p=>p.room==='B').forEach((p,i)=>txt+=`${i+1}. ${p.name}\n`);
  txt+='\n\n=== INTERVIEW SISWA ===\n\n--- Ruang Interview A ---\n';
  ivPeople.filter(p=>p.room==='IA').forEach((p,i)=>txt+=`${i+1}. ${p.name}\n`);
  txt+='\n--- Ruang Interview B ---\n';
  ivPeople.filter(p=>p.room==='IB').forEach((p,i)=>txt+=`${i+1}. ${p.name}\n`);
  txt+='\n--- Ruang Interview C ---\n';
  ivPeople.filter(p=>p.room==='IC').forEach((p,i)=>txt+=`${i+1}. ${p.name}\n`);
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/plain'}));a.download='peserta_alwafi.txt';a.click();
};
window.importJSON=function(input){
  const file=input.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const data=JSON.parse(e.target.result);
      if(!data.ikhwan||!data.akhwat) throw new Error();
      if(!confirm('Muat data? Sesi saat ini akan direset.')) return;
      people=buildPeople(data.ikhwan,data.akhwat);
      queueA=[];queueB=[];callingA=null;callingB=null;counter=0;
      if(data.interview_a||data.interview_b||data.interview_c){
        ivPeople=buildIVPeople(data.interview_a||[],data.interview_b||[],data.interview_c||[]);
        ivQueueA=[];ivQueueB=[];ivQueueC=[];ivCallingA=null;ivCallingB=null;ivCallingC=null;ivCounter=0;
      }
      saveAndRender(true); alert('Data berhasil dimuat!');
    } catch(err){alert('Gagal membaca file.');}
  };
  reader.readAsText(file); input.value='';
};
window.confirmReset=function(){document.getElementById('modal-reset').classList.add('open');};
window.closeModal=function(){document.getElementById('modal-reset').classList.remove('open');};
window.doReset=function(){
  people.forEach(p=>{p.status='waiting';p.queuePos=0;});
  ivPeople.forEach(p=>{p.status='waiting';p.queuePos=0;});
  queueA=[];queueB=[];callingA=null;callingB=null;counter=0;
  ivQueueA=[];ivQueueB=[];ivQueueC=[];ivCallingA=null;ivCallingB=null;ivCallingC=null;ivCounter=0;
  window.speechSynthesis&&window.speechSynthesis.cancel();
  closeModal(); saveAndRender(true);
};

// ===== NAV =====
window.filterList=function(v){searchVal=v.toLowerCase();render();};
window.filterListIV=function(v){ivSearchVal=v.toLowerCase();render();};
window.setFilter=function(v,el){
  filterVal=v;
  document.querySelectorAll('#panel-admin .filter-row:first-of-type .filter-btn').forEach(b=>b.classList.remove('active'));
  el.classList.add('active'); render();
};
window.setFilterIV=function(v,el){
  ivFilterVal=v;
  el.closest('.filter-row').querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  el.classList.add('active'); render();
};
window.switchTab=function(t){
  document.querySelectorAll('.tab').forEach((el,i)=>el.classList.toggle('active',['admin','editor','tv'][i]===t));
  ['admin','editor','tv'].forEach(id=>{const el=document.getElementById('panel-'+id);if(el)el.classList.toggle('active',id===t);});
  if(t==='editor') renderEditor();
};
window.openFS=function(){
  const el=document.getElementById('tv-wrap');
  if(el.requestFullscreen) el.requestFullscreen();
  else if(el.webkitRequestFullscreen) el.webkitRequestFullscreen();
};

// ===== CLOCK =====
function updateClock(){
  const now=new Date();
  const el=document.getElementById('tv-clock');
  if(el) el.textContent=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  const days=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const months=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const dateEl=document.getElementById('tv-date');
  if(dateEl) dateEl.textContent=`${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}
setInterval(updateClock,1000); updateClock();

// ===== VERTICAL SPLIT RESIZE HANDLE (top/bottom) =====
(function(){
  const handle = document.getElementById('tv-split-handle');
  const topEl  = document.getElementById('tv-split-top');
  const botEl  = document.getElementById('tv-split-bottom');
  const cont   = document.getElementById('tv-split-container');
  if(!handle||!topEl||!botEl||!cont) return;
  let dragging=false, startY=0, startTopH=0, startBotH=0;
  handle.addEventListener('mousedown', e=>{
    dragging=true; startY=e.clientY;
    startTopH=topEl.offsetHeight; startBotH=botEl.offsetHeight;
    document.body.style.cursor='row-resize'; document.body.style.userSelect='none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', e=>{
    if(!dragging) return;
    const dy=e.clientY-startY;
    const newTop=Math.max(80, startTopH+dy);
    const newBot=Math.max(80, startBotH-dy);
    topEl.style.height=newTop+'px'; topEl.style.flex='none';
    botEl.style.height=newBot+'px'; botEl.style.flex='none';
  });
  document.addEventListener('mouseup', ()=>{
    if(!dragging) return;
    dragging=false;
    document.body.style.cursor=''; document.body.style.userSelect='';
  });
  // Touch support
  handle.addEventListener('touchstart', e=>{
    dragging=true; startY=e.touches[0].clientY;
    startTopH=topEl.offsetHeight; startBotH=botEl.offsetHeight;
    e.preventDefault();
  },{passive:false});
  document.addEventListener('touchmove', e=>{
    if(!dragging) return;
    const dy=e.touches[0].clientY-startY;
    const newTop=Math.max(80, startTopH+dy);
    const newBot=Math.max(80, startBotH-dy);
    topEl.style.height=newTop+'px'; topEl.style.flex='none';
    botEl.style.height=newBot+'px'; botEl.style.flex='none';
  },{passive:false});
  document.addEventListener('touchend', ()=>{ dragging=false; });
})();

// ===== HORIZONTAL SPLIT RESIZE HANDLES (3 panels in top section) =====
(function(){
  function makeHSplitter(handleId, leftId, rightId){
    const handle = document.getElementById(handleId);
    const leftEl = document.getElementById(leftId);
    const rightEl= document.getElementById(rightId);
    if(!handle||!leftEl||!rightEl) return;
    let dragging=false, startX=0, startLeftW=0, startRightW=0;
    handle.addEventListener('mousedown', e=>{
      dragging=true; startX=e.clientX;
      startLeftW=leftEl.offsetWidth; startRightW=rightEl.offsetWidth;
      document.body.style.cursor='col-resize'; document.body.style.userSelect='none';
      e.preventDefault();
    });
    document.addEventListener('mousemove', e=>{
      if(!dragging) return;
      const dx=e.clientX-startX;
      const newLeft=Math.max(100, startLeftW+dx);
      const newRight=Math.max(100, startRightW-dx);
      leftEl.style.flex='none'; leftEl.style.width=newLeft+'px';
      rightEl.style.flex='none'; rightEl.style.width=newRight+'px';
    });
    document.addEventListener('mouseup', ()=>{
      if(!dragging) return;
      dragging=false;
      document.body.style.cursor=''; document.body.style.userSelect='';
    });
    handle.addEventListener('touchstart', e=>{
      dragging=true; startX=e.touches[0].clientX;
      startLeftW=leftEl.offsetWidth; startRightW=rightEl.offsetWidth;
      e.preventDefault();
    },{passive:false});
    document.addEventListener('touchmove', e=>{
      if(!dragging) return;
      const dx=e.touches[0].clientX-startX;
      const newLeft=Math.max(100, startLeftW+dx);
      const newRight=Math.max(100, startRightW-dx);
      leftEl.style.flex='none'; leftEl.style.width=newLeft+'px';
      rightEl.style.flex='none'; rightEl.style.width=newRight+'px';
    },{passive:false});
    document.addEventListener('touchend', ()=>{ dragging=false; });
  }
  makeHSplitter('tv-h-handle-1','tv-panel-calling','tv-panel-queue');
  makeHSplitter('tv-h-handle-2','tv-panel-queue','tv-video-panel');
})();


// ===== DRAG & DROP REORDER =====
let _dragId = null, _dragType = null;

function _bindDragFitting(){
  const items = document.querySelectorAll('#queue-list-fitting .queue-item[draggable="true"]');
  items.forEach(el => {
    el.addEventListener('dragstart', e => {
      _dragId = el.dataset.id; _dragType = 'fitting';
      el.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    el.addEventListener('dragend', () => el.classList.remove('dragging','drag-over'));
    el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('drag-over'); });
    el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
    el.addEventListener('drop', e => {
      e.preventDefault(); el.classList.remove('drag-over');
      const targetId = el.dataset.id;
      if(!_dragId || _dragId === targetId || _dragType !== 'fitting') return;
      _reorderQueue(people, _dragId, targetId, ['A','B'], [queueA, queueB]);
      _dragId = null; saveAndRender(true);
    });
  });
}

function _bindDragIV(){
  const items = document.querySelectorAll('#queue-list-iv .queue-item[draggable="true"]');
  items.forEach(el => {
    el.addEventListener('dragstart', e => {
      _dragId = el.dataset.id; _dragType = 'iv';
      el.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    el.addEventListener('dragend', () => el.classList.remove('dragging','drag-over'));
    el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('drag-over'); });
    el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
    el.addEventListener('drop', e => {
      e.preventDefault(); el.classList.remove('drag-over');
      const targetId = el.dataset.id;
      if(!_dragId || _dragId === targetId || _dragType !== 'iv') return;
      _reorderQueue(ivPeople, _dragId, targetId, ['IA','IB','IC'], [ivQueueA, ivQueueB, ivQueueC]);
      _dragId = null; saveAndRender(true);
    });
  });
}

// Swap queuePos between two 'present' items (only non-calling)
function _reorderQueue(peopleArr, fromId, toId, rooms, queues){
  const from = peopleArr.find(x=>x.id===fromId);
  const to   = peopleArr.find(x=>x.id===toId);
  if(!from || !to) return;
  if(from.status !== 'present' || to.status !== 'present') return;
  // Swap queuePos
  const tmp = from.queuePos;
  from.queuePos = to.queuePos;
  to.queuePos   = tmp;
  // Rebuild queue arrays to reflect new order
  rooms.forEach((room, i) => {
    const q = queues[i];
    // Re-sort the queue for this room by queuePos
    const newOrder = peopleArr
      .filter(p => p.room === room && p.status === 'present')
      .sort((a,b) => a.queuePos - b.queuePos)
      .map(p => p.id);
    q.length = 0;
    newOrder.forEach(id => q.push(id));
  });
}

// ===== DIRECT DONE (Skip) =====
window.markDirectDone = function(id){
  const p = people.find(x=>x.id===id);
  if(!p || p.status !== 'present') return;
  // Remove from queue
  queueA = queueA.filter(x=>x!==id);
  queueB = queueB.filter(x=>x!==id);
  p.status = 'done';
  saveAndRender(true);
};

window.markDirectDoneIV = function(id){
  const p = ivPeople.find(x=>x.id===id);
  if(!p || p.status !== 'present') return;
  ivQueueA = ivQueueA.filter(x=>x!==id);
  ivQueueB = ivQueueB.filter(x=>x!==id);
  ivQueueC = ivQueueC.filter(x=>x!==id);
  p.status = 'done';
  saveAndRender(true);
};

// Hook _bindDragIV after renderQueueIV
const _origRenderQueueIV = renderQueueIV;
// We already call _bindDragFitting() in renderQueueFitting above
// For IV, patch after render by monkey-patching
