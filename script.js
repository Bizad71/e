'use strict';
const $ = s => document.querySelector(s);
const pad = n => String(n).padStart(2,'0');
const fa = n => String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
const MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const STORAGE = 'weekly_vocab_1405_v1';
const START = [1405,8,30], END = [1405,12,29];
function j2g(jy,jm,jd){
 jy+=1595;let days=-355668+365*jy+Math.floor(jy/33)*8+Math.floor((jy%33+3)/4)+jd+(jm<7?(jm-1)*31:(jm-7)*30+186);
 let gy=400*Math.floor(days/146097);days%=146097;
 if(days>36524){days--;gy+=100*Math.floor(days/36524);days%=36524;if(days>=365)days++;}
 gy+=4*Math.floor(days/1461);days%=1461;if(days>365){gy+=Math.floor((days-1)/365);days=(days-1)%365;}
 let gd=days+1;const a=[0,31,(gy%4===0&&gy%100!==0)||gy%400===0?29:28,31,30,31,30,31,31,30,31,30,31];let gm=0;
 while(gm<13&&gd>a[gm])gd-=a[gm++];return [gy,gm,gd];
}
function g2j(gy,gm,gd){
 const m=[0,31,59,90,120,151,181,212,243,273,304,334],y2=gm>2?gy+1:gy;
 let d=355666+365*gy+Math.floor((y2+3)/4)-Math.floor((y2+99)/100)+Math.floor((y2+399)/400)+gd+m[gm-1];
 let jy=-1595+33*Math.floor(d/12053);d%=12053;jy+=4*Math.floor(d/1461);d%=1461;
 if(d>365){jy+=Math.floor((d-1)/365);d=(d-1)%365;}
 return [jy,d<186?1+Math.floor(d/31):7+Math.floor((d-186)/30),1+(d<186?d%31:(d-186)%30)];
}
const dayNo=(y,m,d)=>{const [gy,gm,gd]=j2g(y,m,d);return Math.round(Date.UTC(gy,gm-1,gd)/86400000)};
function fromDayNo(n){const dt=new Date(n*86400000);return g2j(dt.getUTCFullYear(),dt.getUTCMonth()+1,dt.getUTCDate());}
function dateText(a){return `${fa(a[2])} ${MONTHS[a[1]-1]}`;}
function key(a){return `${a[0]}/${pad(a[1])}/${pad(a[2])}`;}
function loadData(){try{return JSON.parse(localStorage.getItem(STORAGE)||'{}')}catch{return {}}}
let weekData=loadData(), weeks=[], activeWeek=null, toastTimer=null, flipTimers=new WeakMap();
const palette=[
 ['#e6f2ff','#175da8'],['#fff0e7','#a44719'],['#e9f7ef','#18764b'],['#f2eaff','#6941a5'],
 ['#fff6d9','#8a5b00'],['#e6f7f8','#176b72'],['#ffeaf1','#a52e5c'],['#edf0ff','#3c4b9a'],
 ['#f0f4e7','#536b25'],['#fcecff','#873b8c'],['#e9efff','#264e9b'],['#fff0dc','#8b4b12']
];
function buildWeeks(){
 const start=dayNo(...START),end=dayNo(...END);
 for(let n=start,i=1;n<=end;n+=7,i++){
   const last=Math.min(n+6,end),a=fromDayNo(n),b=fromDayNo(last),id=`${key(a)}_${key(b)}`;
   const now=new Date(),today=g2j(now.getFullYear(),now.getMonth()+1,now.getDate()),todayNo=today[0]===1405?dayNo(...today):-1;
   weeks.push({id,index:i,start:n,end:last,a,b,current: n<=todayNo&&last>=todayNo});
 }
}
function save(){localStorage.setItem(STORAGE,JSON.stringify(weekData));}
function showToast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2600);}
function renderWeeks(){
 $('#weekGrid').innerHTML=weeks.map(w=>{
   const data=weekData[w.id],count=data?.words?.length||0,ready=count>0;
   return `<article class="week-card ${w.current?'current':''} ${ready?'active':''}" data-week="${w.id}">
     <div class="week-top"><span class="week-number">هفته ${fa(w.index)}</span><button class="week-plus" data-import="${w.id}" title="وارد کردن فایل JSON" aria-label="وارد کردن فایل برای هفته ${w.index}">+</button></div>
     <h3>${dateText(w.a)} تا ${dateText(w.b)}</h3>
     <div class="week-date">${fa(w.a[0])} · ${w.current?'هفته جاری': 'برنامه هفتگی'}</div>
     <div class="week-meta"><span>${ready?'لغات آماده تمرین':'هنوز فایلی وارد نشده'}</span><strong>${ready?fa(count)+' کلمه':'۰ کلمه'}</strong></div>
   </article>`;
 }).join('');
}
function normalizeWords(data){
 const arr=Array.isArray(data)?data:(data&&Array.isArray(data.words)?data.words:null);
 if(!arr||!arr.length)throw new Error('ساختار فایل باید شامل آرایه words باشد.');
 const cleaned=arr.map(x=>{
   const word=typeof x==='string'?x:(x.word||x.english||x.en||'');
   const meaning=typeof x==='string'?'':(x.meaning||x.translation||x.fa||'');
   return {word:String(word).trim(),meaning:String(meaning).trim()};
 }).filter(x=>x.word);
 if(!cleaned.length)throw new Error('هیچ کلمه معتبری در فایل پیدا نشد.');
 return cleaned;
}
function importFile(file,weekId){
 if(!file)return;
 const reader=new FileReader();
 reader.onload=()=>{
  try{
   const data=JSON.parse(reader.result),words=normalizeWords(data);
   weekData[weekId]={words,updatedAt:new Date().toISOString()};
   save();renderWeeks();
   if(activeWeek===weekId)openWeek(weekId);
   showToast(`${fa(words.length)} کلمه برای این هفته ذخیره شد.`);
  }catch(e){showToast('فایل JSON معتبر نیست: '+e.message);}
 };
 reader.readAsText(file,'UTF-8');
}
function openWeek(id){
 const data=weekData[id];if(!data?.words?.length){showToast('برای این هفته هنوز فایل لغات وارد نشده است.');return;}
 activeWeek=id;const w=weeks.find(x=>x.id===id);
 $('#weeksView').hidden=true;$('#wordsView').hidden=false;
 $('#activeWeekTitle').textContent=`هفته ${fa(w.index)} | ${dateText(w.a)} تا ${dateText(w.b)}`;
 $('#wordCount').textContent=`${fa(data.words.length)} کلمه برای تمرین`;
 $('#wordGrid').innerHTML=data.words.map((item,i)=>{
   const [bg,fg]=palette[i%palette.length];
   return `<button class="word-card" data-word-index="${i}" aria-label="${item.word}، نمایش معنی و پخش تلفظ" style="background:${bg};color:${fg}">
    <span class="word-inner"><span class="word-face word-front"><span class="word-en">${escapeHtml(item.word)}</span><small class="word-index">${fa(i+1)} / ${fa(data.words.length)}</small></span>
    <span class="word-face word-back"><span>${escapeHtml(item.meaning||'معنی ثبت نشده')}</span><small>معنی فارسی</small></span></span></button>`;
 }).join('');
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function playPronunciation(word){
 // First try the free dictionary API audio; use browser speech as a fallback.
 try{
  const response=await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
  if(response.ok){
   const data=await response.json();
   const audio=data.flatMap(x=>x.phonetics||[]).map(x=>x.audio).find(Boolean);
   if(audio){const player=new Audio(audio);await player.play();return;}
  }
 }catch(e){}
 if('speechSynthesis' in window){
   window.speechSynthesis.cancel();
   const utterance=new SpeechSynthesisUtterance(word);
   utterance.lang='en-US';utterance.rate=.82;
   window.speechSynthesis.speak(utterance);
 }
}
function flipCard(card,index){
 const word=weekData[activeWeek].words[index].word;
 const old=flipTimers.get(card);if(old)clearTimeout(old);
 card.classList.add('flipped');
 playPronunciation(word);
 const timer=setTimeout(()=>card.classList.remove('flipped'),3000);
 flipTimers.set(card,timer);
}
$('#weekGrid').addEventListener('click',e=>{
 const imp=e.target.closest('[data-import]'),card=e.target.closest('[data-week]');
 if(imp){e.stopPropagation();$('#globalImport').dataset.week=imp.dataset.import;$('#globalImport').click();return;}
 if(card)openWeek(card.dataset.week);
});
$('#weekImport').addEventListener('change',e=>{const f=e.target.files[0];if(f)importFile(f,activeWeek);e.target.value='';});
$('#wordGrid').addEventListener('click',e=>{const card=e.target.closest('[data-word-index]');if(card)flipCard(card,Number(card.dataset.wordIndex));});
function goHome(){$('#wordsView').hidden=true;$('#weeksView').hidden=false;activeWeek=null;}
$('#backBtn').onclick=goHome;$('#homeBtn').onclick=goHome;
buildWeeks();
// Preload the first week's 50 words only on a fresh install; existing user imports are preserved.
const first=weeks[0];
if(!weekData[first.id]){
 const initial={"week": "1405-08-30_1405-09-06", "title": "هفته اول | ۳۰ آبان تا ۶ آذر", "words": [{"word": "ability", "meaning": "توانایی"}, {"word": "achieve", "meaning": "دستیابی پیدا کردن"}, {"word": "advice", "meaning": "توصیه"}, {"word": "afraid", "meaning": "ترسیده"}, {"word": "almost", "meaning": "تقریباً"}, {"word": "answer", "meaning": "پاسخ دادن؛ پاسخ"}, {"word": "arrive", "meaning": "رسیدن"}, {"word": "attention", "meaning": "توجه"}, {"word": "beautiful", "meaning": "زیبا"}, {"word": "believe", "meaning": "باور کردن"}, {"word": "borrow", "meaning": "قرض گرفتن"}, {"word": "brave", "meaning": "شجاع"}, {"word": "bright", "meaning": "روشن؛ باهوش"}, {"word": "build", "meaning": "ساختن"}, {"word": "careful", "meaning": "مراقب؛ بااحتیاط"}, {"word": "choose", "meaning": "انتخاب کردن"}, {"word": "comfortable", "meaning": "راحت"}, {"word": "continue", "meaning": "ادامه دادن"}, {"word": "decide", "meaning": "تصمیم گرفتن"}, {"word": "different", "meaning": "متفاوت"}, {"word": "difficult", "meaning": "دشوار"}, {"word": "early", "meaning": "زود؛ زودهنگام"}, {"word": "enough", "meaning": "کافی"}, {"word": "enjoy", "meaning": "لذت بردن"}, {"word": "experience", "meaning": "تجربه"}, {"word": "explain", "meaning": "توضیح دادن"}, {"word": "famous", "meaning": "مشهور"}, {"word": "favorite", "meaning": "موردعلاقه"}, {"word": "forget", "meaning": "فراموش کردن"}, {"word": "friendly", "meaning": "دوستانه؛ خوش‌برخورد"}, {"word": "future", "meaning": "آینده"}, {"word": "healthy", "meaning": "سالم"}, {"word": "important", "meaning": "مهم"}, {"word": "improve", "meaning": "بهتر کردن؛ پیشرفت کردن"}, {"word": "instead", "meaning": "به‌جای آن"}, {"word": "invite", "meaning": "دعوت کردن"}, {"word": "journey", "meaning": "سفر"}, {"word": "knowledge", "meaning": "دانش"}, {"word": "language", "meaning": "زبان"}, {"word": "message", "meaning": "پیام"}, {"word": "necessary", "meaning": "ضروری"}, {"word": "opinion", "meaning": "نظر"}, {"word": "possible", "meaning": "ممکن"}, {"word": "practice", "meaning": "تمرین کردن؛ تمرین"}, {"word": "probably", "meaning": "احتمالاً"}, {"word": "remember", "meaning": "به خاطر آوردن"}, {"word": "special", "meaning": "خاص؛ ویژه"}, {"word": "surprise", "meaning": "غافلگیری؛ غافلگیر کردن"}, {"word": "usually", "meaning": "معمولاً"}, {"word": "wonderful", "meaning": "عالی؛ شگفت‌انگیز"}]};
 weekData[first.id]={words:initial.words,updatedAt:null};
 save();
}
renderWeeks();
