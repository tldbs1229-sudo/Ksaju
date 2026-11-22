'use strict';
/* ====================================================================
   윤슬당 YUNSEULDANG — standalone demo (no server).
   - Real AI chat: set AI_ENDPOINT to YOUR server URL that calls the Claude API.
     NEVER put API keys or payment secrets in this HTML.
   - Payments are demo-only. Use Stripe/Apple Pay etc. via a backend.
   ==================================================================== */
const AI_ENDPOINT = '';   // e.g. 'https://your-server.example/api/pet-chat'  (POST {pet,messages} -> {reply})

const $ = id => document.getElementById(id);
const LS = 'yunseuldang-v2';

let lang=(navigator.language||'').startsWith('ko')?'ko':'en';
try{lang=localStorage.getItem('yd-lang')||lang}catch(e){}
const T=k=>UI[lang][k]??UI.ko[k]??k;
const L=o=>o[lang];
const fmt=(s,o)=>s.replace(/\{(\w+)\}/g,(_,k)=>o[k]);

/* ================= SAJU CORE ================= */
const MB=[[1,6,1],[2,4,2],[3,6,3],[4,5,4],[5,6,5],[6,6,6],[7,7,7],[8,8,8],[9,8,9],[10,8,10],[11,7,11],[12,7,0]];
function saju(date,time){
  const [y,m,d]=date.split('-').map(Number);const v=m*100+d;
  const sy=(m<2||(m===2&&d<4))?y-1:y;
  const ys=((sy-4)%10+10)%10,yb=((sy-4)%12+12)%12;
  let mb=0;for(const [mm,dd,b] of MB)if(v>=mm*100+dd)mb=b;
  if(v<106)mb=0;
  const mi=(mb-2+12)%12,ms=((ys%5)*2+2+mi)%10;
  const jdn=Math.floor(Date.UTC(y,m-1,d)/86400000)+2440588;
  const di=((jdn+49)%60+60)%60,ds=di%10,db=di%12;
  let hour=null;
  if(time){const hh=+time.split(':')[0];const hb=Math.floor((hh+1)/2)%12;hour=[(ds*2+hb)%10,hb]}
  const p={year:[ys,yb],month:[ms,mb],day:[ds,db],hour};
  const cnt=[0,0,0,0,0];
  [p.year,p.month,p.day,p.hour].forEach(x=>{if(!x)return;cnt[STEM[x[0]][2]]++;cnt[BR[x[1]][2]]++});
  const mn=Math.min(...cnt),mx=Math.max(...cnt);
  const lack=cnt.map((n,i)=>n===mn?i:-1).filter(i=>i>=0);
  const top=cnt.map((n,i)=>n===mx?i:-1).filter(i=>i>=0);
  return {p,cnt,lack,top,animal:yb,yang:ys%2===0,theme:lack[hash(date)%lack.length]};
}
function hash(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let a=seed;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function zodiacOf(date){const [,m,d]=date.split('-').map(Number),v=m*100+d;
  if(v>=1222||v<120)return 0;if(v<219)return 1;if(v<321)return 2;if(v<420)return 3;if(v<521)return 4;if(v<622)return 5;if(v<723)return 6;if(v<823)return 7;if(v<923)return 8;if(v<1023)return 9;if(v<1122)return 10;return 11}

/* ================= CHARACTERS: guide (human, TIGER CREW) + zodiac pets ================= */
/* Guide = Day Master element (array index = element: wood fire earth metal water). Pet = zodiac animal × strongest element. */
const CREW=[
{id:'san',n:{ko:'SAN',en:'SAN'},kr:'산',age:29,g:{ko:'남',en:'Male'},mbti:'ESFP',
 tag:{ko:'오늘도, 한 걸음 더',en:'One more step, today too'},job:{ko:'러닝 코치',en:'Running coach'},area:{ko:'서울 관악 · 서울대입구',en:'Gwanak, Seoul · Seoul Nat\'l Univ.'},
 tags:{ko:['#러닝','#건강한습관','#자연','#긍정에너지'],en:['#running','#healthyhabits','#nature','#goodvibes']},
 quote:{ko:'지금, 이 순간도 충분히 멋지니까.',en:'Right now is already pretty great.'},
 items:{ko:['러닝화','스포츠 워치','물통'],en:['Running shoes','Sports watch','Water bottle']},
 likes:{ko:'새벽 공기, 바나나 우유, 텃밭 상추',en:'dawn air, banana milk, lettuce from the garden'},dis:{ko:'하루 종일 엘리베이터만 타는 날',en:'days spent only riding elevators'},
 farm:{ko:'관악 산자락 숲속 농장',en:'Gwanak Forest Farm'},chibi:{ko:'달리자! 오늘도!',en:'Let\'s run! Today too!'},
 day:{ko:['관악산 새벽 트레일 10km 뛰고, 농장 텃밭에 상추 모종을 심었어.','도림천에서 아침 러닝 크루 수업. 다들 월요병인데 끝나면 표정이 밝아져.','오후엔 농장 울타리를 고치고, 저녁엔 NURI랑 서울대입구 국밥집.','회원 한 분이 처음으로 5km 완주했어! 오늘은 내가 더 신났어.','비가 와서 실내 근력 수업. 펫들도 헛간에서 낮잠 잤어.','HOYA 공연 보러 홍대 갔다가, 끝나고 같이 한강까지 천천히 걸었어.','동네 아이들이 농장 체험을 왔어. 토끼랑 양이 인기 최고.'],
  en:['Ran a 10 km dawn trail on Gwanaksan, then planted lettuce on the farm.','Morning run-crew class by Dorimcheon. Monday blues melt by the finish line.','Fixed the farm fence, then gukbap with NURI near Seoul Nat\'l Univ.','A member finished their first 5 km! I was even more excited than they were.','Rain, so indoor strength class. The pets napped in the barn.','Went to HOYA\'s show in Hongdae, then we walked slowly to the Han River.','Neighborhood kids visited the farm. The rabbit and sheep were the stars.']},
 open:{ko:['나도 기록 안 나오는 날엔 그냥 걷기만 해.','숨 한번 크게 쉬고 —','러닝 코치로서 말하자면,'],en:['On slow days I just walk, too.','Take one big breath first —','Speaking as a running coach,']},
 fr:{hoya:{ko:'공연 끝난 HOYA를 새벽 러닝에 끌고 나가는 게 내 취미야.',en:'Dragging HOYA out for a dawn run after a show is my hobby.'},nuri:{ko:'같은 서울대입구 이웃. 텃밭 채소를 나눠 먹는 사이.',en:'My neighbor near Seoul Nat\'l Univ. We share garden vegetables.'},kian:{ko:'내 러닝 기록 앱을 만들어준 고마운 친구.',en:'The friend who built my running-log app.'},gil:{ko:'강릉 바다 러닝 코스를 알려준 친구. 언젠가 같이 마라톤!',en:'Showed me a seaside running route in Gangneung. A marathon together someday!'}}},
{id:'hoya',n:{ko:'HOYA',en:'HOYA'},kr:'호야',age:26,g:{ko:'남',en:'Male'},mbti:'ENFJ',
 tag:{ko:'무대를 만드는 온도',en:'The warmth that makes a stage'},job:{ko:'라이브 이벤트 프로듀서',en:'Live event producer'},area:{ko:'서울 합정 · 망원',en:'Hapjeong · Mangwon, Seoul'},
 tags:{ko:['#무대기획','#사람','#홍대라이브','#열정'],en:['#stageplanning','#people','#hongdaelive','#passion']},
 quote:{ko:'좋은 무대는, 좋은 사람들로부터.',en:'A good stage starts with good people.'},
 items:{ko:['기획 노트','헤드폰','액세스 패스'],en:['Planning notebook','Headphones','Access pass']},
 likes:{ko:'홍대 라이브 클럽, 망원시장 떡볶이, 사람들의 박수',en:'Hongdae live clubs, Mangwon Market tteokbokki, applause'},dis:{ko:'아무 반응 없이 끝나는 리허설',en:'rehearsals that end in silence'},
 farm:{ko:'망원 옥상 등불 농장',en:'Mangwon Rooftop Lantern Farm'},chibi:{ko:'오늘, 좋은 무대 하자!',en:'Let\'s make a great show today!'},
 day:{ko:['망원 옥상 농장에서 펫들이랑 늦잠 자고, 오후엔 셋리스트를 짰어.','합정 사무실에서 다음 달 공연 기획 회의. 포스터 사진은 GIL한테 부탁했어.','홍대 클럽 사운드 체크. 닭이 새벽부터 울어서 알람이 필요 없었어.','신인 밴드 오디션을 봤어. 떨리는 목소리에서 진짜가 들리더라.','KIAN이 만들어준 예매 시스템 덕에 티켓 오픈이 순조로웠어!','공연 날! 무대 끝나고 SAN이랑 한강까지 걸었어.','망원시장에서 떡볶이 사서 농장 식구들이랑 옥상 피크닉.'],
  en:['Slept in with the pets on the Mangwon rooftop farm, then built a setlist.','Planning meeting for next month\'s show in Hapjeong. Asked GIL for the poster photos.','Sound check at a Hongdae club. The rooster crowed at dawn — no alarm needed.','Auditioned a new band. You can hear the real thing in a shaky voice.','Ticket launch went smoothly thanks to the system KIAN built!','Show day! Afterwards SAN and I walked to the Han River.','Bought tteokbokki at Mangwon Market for a rooftop picnic with the farm crew.']},
 open:{ko:['무대 뒤에서는 나도 늘 떨려.','리허설 끝난 참이라 목이 좀 쉬었는데,','좋은 무대도 결국 사람이 만들더라.'],en:['I get nervous backstage too, every time.','Just out of rehearsal, voice a bit hoarse, but —','Even great shows are made by people.']},
 fr:{san:{ko:'"딱 3km만"이라는 SAN 말은 절대 믿으면 안 돼.',en:'Never trust SAN when he says "just 3 km."'},nuri:{ko:'내 공연 이야기를 제일 멋지게 기록해주는 친구.',en:'The one who writes up my shows best.'},kian:{ko:'티켓 시스템 구원자. 공연장 맨 뒷줄은 늘 KIAN 자리야.',en:'Saved my ticketing system. The back row is always KIAN\'s seat.'},gil:{ko:'내 공연 포스터는 전부 GIL 사진이야.',en:'Every one of my show posters is GIL\'s photo.'}}},
{id:'nuri',n:{ko:'NURI',en:'NURI'},kr:'누리',age:29,g:{ko:'논바이너리',en:'Non-binary'},mbti:'INFJ',
 tag:{ko:'일상을 단단하게',en:'Making everyday life steady'},job:{ko:'콘텐츠 기획자',en:'Content planner'},area:{ko:'서울 관악 · 서울대입구',en:'Gwanak, Seoul · Seoul Nat\'l Univ.'},
 tags:{ko:['#기록하는사람','#지식','#카페작업','#꾸준함'],en:['#notetaker','#knowledge','#cafework','#consistency']},
 quote:{ko:'작은 기록이 언젠가 큰 이야기가 되니까.',en:'Small notes become big stories someday.'},
 items:{ko:['노트북','노트','카페 음료'],en:['Laptop','Notebook','Café drink']},
 likes:{ko:'빈 노트 첫 장, 따뜻한 보리차, 오래된 책방',en:'the first page of a new notebook, warm barley tea, old bookshops'},dis:{ko:'마감 직전에 날아간 파일',en:'files lost right before a deadline'},
 farm:{ko:'샤로수길 뒤뜰 흙 농장',en:'Sharosu-gil Backyard Farm'},chibi:{ko:'오늘도 좋은 생각 발견!',en:'Found a good idea today, too!'},
 day:{ko:['오래된 책방에서 책 두 권을 사고, 뒤뜰 농장 흙을 골랐어.','샤로수길 카페에서 이번 주 콘텐츠 기획안 정리. 마감은 금요일!','SAN이 텃밭 상추를 갖다줘서 점심은 쌈밥.','인터뷰 녹취를 풀다가 좋은 문장을 발견했어. 노트에 옮겨 적었지.','KIAN이랑 회의록 템플릿을 바꿨어. 기획자끼리는 이런 게 재밌다니까.','마감 완료! 농장 소랑 같이 볕 좋은 데서 멍때렸어.','GIL이 보내준 강릉 여행 노트를 받고 답장 편지를 썼어.'],
  en:['Bought two books at an old bookshop, then tilled the backyard farm.','Organized this week\'s content plan at a Sharosu-gil café. Deadline: Friday!','SAN brought garden lettuce, so lunch was ssambap.','Found a great sentence while transcribing an interview. Copied it into my notebook.','Redesigned our meeting-notes template with KIAN. Planners love this stuff.','Deadline done! Zoned out in the sun with the farm ox.','Got GIL\'s Gangneung travel notes and wrote a letter back.']},
 open:{ko:['방금 카페에서 메모하던 참인데,','작은 기록이 쌓이면 보여, 진짜로.','차 한 잔 앞에 두고 말해줄게.'],en:['I was just taking notes at a café, but —','Small notes add up. They really do.','Let me say this over a cup of tea.']},
 fr:{san:{ko:'텃밭 상추 배달부. 덕분에 점심이 늘 푸짐해.',en:'My garden-lettuce courier. Lunch is always generous thanks to SAN.'},hoya:{ko:'시끌벅적하지만 마음은 제일 따뜻한 친구.',en:'Loud, but the warmest heart of us all.'},kian:{ko:'기획자끼리 통하는 게 있어. 회의록 템플릿 공유 중.',en:'Planners get each other. We share meeting templates.'},gil:{ko:'손편지로 교환 일기를 쓰는 사이.',en:'We keep a handwritten exchange diary.'}}},
{id:'kian',n:{ko:'KIAN',en:'KIAN'},kr:'키안',age:28,g:{ko:'남',en:'Male'},mbti:'INTJ',
 tag:{ko:'정확하게, 앞으로',en:'Precisely, forward'},job:{ko:'IT 서비스 기획자',en:'IT service planner'},area:{ko:'수원 광교 · 영통',en:'Gwanggyo · Yeongtong, Suwon'},
 tags:{ko:['#데이터','#효율','#도시주행','#스마트라이프'],en:['#data','#efficiency','#citydrive','#smartlife']},
 quote:{ko:'좋은 서비스는, 사람의 시간을 아낀다.',en:'Good service saves people\'s time.'},
 items:{ko:['스마트 워치','태블릿','사원증'],en:['Smart watch','Tablet','Employee badge']},
 likes:{ko:'깔끔한 대시보드, 아이스 아메리카노, 신분당선 첫차',en:'clean dashboards, iced americano, the first Shinbundang train'},dis:{ko:'회의만 있고 결론은 없는 날',en:'days full of meetings with no decisions'},
 farm:{ko:'광교 호숫가 스마트 농장',en:'Gwanggyo Lakeside Smart Farm'},chibi:{ko:'업데이트 완료!',en:'Update complete!'},
 day:{ko:['광교호수공원을 한 바퀴 돌고, 스마트 농장 급수 시스템을 업데이트했어.','스프린트 플래닝. 이번 주 목표는 앱 로딩 0.5초 줄이기.','퇴근길 신분당선에서 SAN 러닝 앱 버그를 고쳐줬어.','사용자 인터뷰 날. 사람들 시간을 아끼는 게 결국 제일 좋은 기능이더라.','배포 성공! "업데이트 완료!" 외치고 농장 원숭이랑 하이파이브.','HOYA 공연 보러 수원에서 홍대까지. 맨 뒷줄에서 조용히 응원했어.','GIL이 강릉으로 끌고 갔어. 하루 종일 폰을 안 봤는데, 신기하게 괜찮더라.'],
  en:['Walked around Gwanggyo Lake Park and updated the smart farm\'s watering system.','Sprint planning. This week\'s goal: cut app load time by 0.5 s.','Fixed a bug in SAN\'s running app on the Shinbundang line home.','User interview day. Saving people\'s time really is the best feature.','Deploy succeeded! Shouted "update complete!" and high-fived the farm monkey.','Went from Suwon to Hongdae for HOYA\'s show. Cheered quietly from the back row.','GIL dragged me to Gangneung. No phone all day — and somehow it was fine.']},
 open:{ko:['데이터로 보면 말이야,','지금 퇴근 셔틀 안인데,','하나씩 정리하면 생각보다 단순해.'],en:['If we look at the data,','I\'m on the shuttle home right now, but —','Sorted one by one, it\'s simpler than it looks.']},
 fr:{san:{ko:'내가 만든 앱의 1호 사용자이자 최고의 버그 제보자.',en:'User #1 of my app and its best bug reporter.'},hoya:{ko:'감으로 움직이는데 이상하게 다 맞아. 데이터로 설명이 안 돼.',en:'Runs on instinct and is somehow always right. The data can\'t explain it.'},nuri:{ko:'내 회의록을 살아 있는 문장으로 바꿔주는 친구.',en:'Turns my meeting notes into living sentences.'},gil:{ko:'나를 강릉으로 끌고 가서 폰을 끄게 만든 유일한 사람.',en:'The only person who got me to Gangneung with my phone off.'}}},
{id:'gil',n:{ko:'GIL',en:'GIL'},kr:'길',age:25,g:{ko:'여',en:'Female'},mbti:'ENFP',
 tag:{ko:'흐르는 대로, 더 멀리',en:'Go with the flow, a little farther'},job:{ko:'여행 콘텐츠 크리에이터',en:'Travel content creator'},area:{ko:'강릉 교동 · 포남',en:'Gyo-dong · Ponam, Gangneung'},
 tags:{ko:['#여행','#필름카메라','#바다','#자유'],en:['#travel','#filmcamera','#sea','#freedom']},
 quote:{ko:'흐르는 길을 따라, 더 좋은 풍경이 있으니까.',en:'Follow the road — there\'s a better view ahead.'},
 items:{ko:['필름 카메라','여행 노트','키링'],en:['Film camera','Travel journal','Keyring']},
 likes:{ko:'필름 카메라, 교동 칼국수, 해 질 녘 안목해변',en:'film cameras, Gyo-dong kalguksu, Anmok Beach at sunset'},dis:{ko:'빈틈없이 짜인 일정표',en:'fully packed itineraries'},
 farm:{ko:'강릉 바닷가 물결 농장',en:'Gangneung Seaside Wave Farm'},chibi:{ko:'다음엔 어디로 갈까?',en:'Where to next?'},
 day:{ko:['안목해변에서 해 뜨는 걸 찍고, 바닷가 농장 펫들 아침을 챙겼어.','지난주 여행 영상 편집. BGM 고르느라 반나절을 썼어.','교동 칼국수 먹고 필름 현상을 맡겼어. 결과 나오는 날이 제일 설레.','다음 여행지 조사 중. 통영이냐 제주냐, 그게 문제야.','HOYA 공연 포스터 사진을 보정해서 보냈어.','KIAN을 강릉에 초대했어. 디지털 디톡스 투어 1일 차!','NURI한테 여행 노트를 보냈어. 우리는 손편지로 교환 일기를 써.'],
  en:['Shot the sunrise at Anmok Beach, then fed the pets on the seaside farm.','Edited last week\'s travel video. Spent half a day choosing music.','Kalguksu in Gyo-dong, then dropped off film to develop. Results day is the best.','Researching the next trip. Tongyeong or Jeju — that is the question.','Retouched and sent the photos for HOYA\'s show poster.','Invited KIAN to Gangneung. Day 1 of the digital-detox tour!','Sent NURI my travel notes. We keep a handwritten exchange diary.']},
 open:{ko:['나 지금 강릉 바다 앞이야. 파도 소리 들려?','필름 한 롤 다 찍고 온 참인데,','길은 늘 하나 더 있어.'],en:['I\'m by the sea in Gangneung — hear the waves?','Just finished a roll of film, and —','There\'s always one more road.']},
 fr:{san:{ko:'강릉에 오면 꼭 바다 러닝을 같이 하는 친구.',en:'Whenever SAN visits, we run along the sea.'},hoya:{ko:'무대 위에서 제일 빛나는 피사체.',en:'The subject that shines brightest on stage.'},nuri:{ko:'여행 노트를 주고받는 펜팔.',en:'My pen pal for travel journals.'},kian:{ko:'디지털 디톡스 투어 1호 손님. 생각보다 잘 버텼어.',en:'First guest of my digital-detox tour. Held up better than expected.'}}}];
const PK=['rat','ox','tiger','rabbit','dragon','snake','horse','sheep','monkey','rooster','dog','pig'];
const petSrc=(a,e)=>`img/pets/${EK[e]}-${PK[a]}.jpg`;
const crewSrc=(c,k)=>`img/crew/${c.id}-${k}.jpg`;
const HUMAN_ART=['fire-tiger','metal-snake','wood-rabbit'];   // human-form art available so far
const humanSrc=(a,e)=>HUMAN_ART.includes(`${EK[e]}-${PK[a]}`)?`img/human/${EK[e]}-${PK[a]}.jpg`:null;
const HUMAN_LV=4;   // 0-based level (= Lv.5) that unlocks human form
const ANLOOK={ko:['동그란 쥐 귀와 가느다란 꼬리','작은 뿔과 순한 눈매','줄무늬 귀와 꼬리','길게 늘어진 토끼 귀','사슴뿔 같은 용의 뿔','은은한 비늘 꼬리','갈기처럼 긴 머리','돌돌 말린 양 뿔','장난스러운 긴 꼬리','붉은 볏 모양 앞머리','쫑긋한 강아지 귀','분홍 볼과 작은 귀'],
 en:['round mouse ears and a thin tail','small horns and gentle eyes','striped ears and tail','long floppy rabbit ears','antler-like dragon horns','a softly scaled tail','long, mane-like hair','curled ram horns','a playful long tail','a red comb-shaped fringe','perky puppy ears','pink cheeks and little ears']};
const ELLOOK={ko:['초록 니트에 베이지 조끼','붉은 바시티 재킷','황토빛 오버롤','은빛 트렌치코트','남색 바람막이'],en:['a green knit with a beige vest','a red varsity jacket','ochre overalls','a silver trench coat','a navy windbreaker']};
const ELJOB={ko:['텃밭 물 주기 담당','저녁 등불 켜기 담당','흙 고르기 담당','농기구 손질 담당','연못 돌보기 담당'],en:['in charge of watering the garden','in charge of lighting the evening lanterns','in charge of tilling the soil','in charge of tool care','in charge of the pond']};
const petTop=(s,date)=>s.top[hash(date+'pet')%s.top.length];
const stageOf=lv=>lv>=HUMAN_LV?2:lv>=2?1:0;
function petHTML(p,eq,human){
  const hs=human?humanSrc(p.animal,p.petEl):null;
  if(hs)return `<div class="pet-img human"><img src="${hs}" alt="${esc(animalLabel(p))}"></div>`;
  const stk=['ground','neck','head','hold'].map(s=>{const g=eq&&VITEMS.find(x=>x.id===eq[s]);return g?`<span class="stk ${s}">${g.i}</span>`:''}).join('');
  return `<div class="pet-img"><img src="${petSrc(p.animal,p.petEl)}" alt="${esc(animalLabel(p))}" loading="lazy">${stk}</div>`;
}

/* ================= STATE ================= */
const fresh=()=>({pet:null,coins:120,xp:0,owned:[],equipped:{},night:false,human:false,chats:[],entries:[],days:{},match:null,cart:[],metrics:{},mem:null,zsel:null});
let state=fresh(),storageOK=true;
try{const s=JSON.parse(localStorage.getItem(LS));
  if(s&&Array.isArray(s.owned)&&Array.isArray(s.chats)&&Array.isArray(s.entries)&&s.days&&Number.isFinite(s.coins))state={...fresh(),...s}}catch(e){storageOK=false}
if(!state.equipped||typeof state.equipped!=='object')state.equipped={};   // migrate older saves
if(state.pet&&state.pet.saju&&state.pet.petEl===undefined){              // saves from before guide/pet split
  state.pet.petEl=petTop(state.pet.saju,state.pet.date);state.pet.guide=STEM[state.pet.saju.p.day[0]][2];
  if(state.match&&state.match.her)state.match.her.petEl=state.match.her.element}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const dstr=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today=()=>dstr(new Date());
function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||s<'1900-01-01'||s>today())return false;const d=new Date(s+'T12:00:00');return !isNaN(d)&&dstr(d)===s}
let tt;function toast(s){$('toast').textContent=s;clearTimeout(tt);tt=setTimeout(()=>$('toast').textContent='',3800)}
function save(){try{localStorage.setItem(LS,JSON.stringify(state))}catch(e){if(storageOK){storageOK=false;toast(T('saved_fail'))}}}
function track(k){state.metrics[k]=(state.metrics[k]||0)+1}
function dayData(){const k=today();if(!state.days[k])state.days[k]={tasks:[],card:null};return state.days[k]}
function needPet(){if(state.pet)return true;toast(T('need_pet'));openBirth();return false}
const elName=i=>L(EL[i]);
const anName=a=>L(AN[a]);
const animalLabel=p=>lang==='ko'?`${EL[p.petEl].ko.slice(0,1)}의 ${AN[p.animal].ko}`:`${EL[p.petEl].en} ${AN[p.animal].en}`;
const guideOf=p=>CREW[p.guide];
const lvOf=()=>Math.floor(state.xp/30);
const humanOn=()=>!!state.pet&&state.human&&lvOf()>=HUMAN_LV&&!!humanSrc(state.pet.animal,state.pet.petEl);

/* ================= APPLY LANG / STATIC FILL ================= */
function applyLang(){
  document.documentElement.lang=lang;
  document.querySelectorAll('[data-i18n]').forEach(e=>e.textContent=T(e.dataset.i18n));
  document.querySelectorAll('[data-i18n-html]').forEach(e=>e.innerHTML=T(e.dataset.i18nHtml));
  document.querySelectorAll('[data-i18n-ph]').forEach(e=>e.placeholder=T(e.dataset.i18nPh));
  $('langBtn').textContent=lang==='ko'?'EN':'한국어';
  fillSelects();render();pxRender();
}
function fillSelects(){
  const keep=id=>$(id).value;
  const b={mbti:keep('mbti'),el:keep('element'),tone:keep('tone'),sky:keep('sky'),pm:keep('partnerMbti'),pr:keep('preset'),mood:keep('mood'),z:keep('zPick')};
  $('mbti').innerHTML=`<option value="">${T('mbti_none')}</option>`+MBTI.map(m=>`<option>${m}</option>`).join('');
  $('partnerMbti').innerHTML=$('mbti').innerHTML;
  $('element').innerHTML=`<option value="auto">${T('b_el_auto')}</option>`+EL.map((e,i)=>`<option value="${i}">${e.em} ${L(e)} · ${L(e.v)}</option>`).join('');
  $('tone').innerHTML=T('tones').map((t,i)=>`<option value="${['warm','clear','play'][i]}">${t}</option>`).join('');
  $('sky').innerHTML=SKY.map(s=>`<option>${s}</option>`).join('');
  $('preset').innerHTML=`<option value="">${T('m_custom')}</option>`+PRESETS.map(p=>`<option value="${p.id}">${L(p.n)}</option>`).join('');
  $('mood').innerHTML=T('moods').map((m,i)=>`<option value="${i}">${m}</option>`).join('');
  $('zPick').innerHTML=ZOD.map((z,i)=>`<option value="${i}">${z[0]} ${L({ko:z[1],en:z[2]})}</option>`).join('');
  if(b.mbti)$('mbti').value=b.mbti;if(b.el)$('element').value=b.el;if(b.tone)$('tone').value=b.tone;if(b.sky)$('sky').value=b.sky;
  if(b.pm)$('partnerMbti').value=b.pm;if(b.pr)$('preset').value=b.pr;if(b.mood)$('mood').value=b.mood;if(b.z)$('zPick').value=b.z;
}
function applyTheme(){const dk=document.documentElement.dataset.theme==='dark';
  $('themeBtn').textContent=dk?'☀️':'🌙';$('themeBtn').title=lang==='ko'?(dk?'화이트모드':'다크모드'):(dk?'Light mode':'Dark mode');
  document.querySelector('meta[name=theme-color]').content=dk?'#0c0a19':'#FAF7F2'}
$('themeBtn').onclick=()=>{const dk=document.documentElement.dataset.theme!=='dark';
  if(dk)document.documentElement.dataset.theme='dark';else delete document.documentElement.dataset.theme;
  try{localStorage.setItem('yd-theme',dk?'dark':'light')}catch(e){}applyTheme()};
applyTheme();
$('langBtn').onclick=()=>{lang=lang==='ko'?'en':'ko';try{localStorage.setItem('yd-lang',lang)}catch(e){}applyLang()};

/* ================= RENDER ================= */
function render(){
  $('wallet').textContent=`✦ ${state.coins}`;
  $('todayLabel').textContent=today();
  $('aiMode').textContent=AI_ENDPOINT?T('ai_on'):T('ai_off');
  const has=!!state.pet;
  $('welcome').hidden=has;$('mySpace').hidden=!has;$('chartEmpty').hidden=has;$('chartBox').hidden=!has;
  $('guideEmpty').hidden=has;$('guideBox').hidden=!has;$('farmEmpty').hidden=has;$('farmBox').hidden=!has;
  renderPet();renderLanding();
  if(has){renderChart();renderGuide();renderFarm()}
  renderChat();renderRitual();renderShop();renderMatch();renderJournal();renderCart();
}
/* ---- landing: pet device + product cards ---- */
const PRODUCTS=[
{k:'chart',img:'img/pets/water-dragon.jpg',sh:'sq',c:'#fbf3c4',need:1,t:{ko:'내 사주 풀이',en:'My Saju'},s:{ko:'네 기둥과 오행으로 보는 나',en:'Four pillars & five elements'},b:{ko:'무료',en:'Free'}},
{k:'match',img:'img/pets/fire-rabbit.jpg',sh:'heart',c:'#fde4ec',need:1,t:{ko:'인연 궁합',en:'Chemistry'},s:{ko:'우리 사이는 몇 점?',en:'How well do we match?'},b:{ko:'무료',en:'Free'}},
{k:'today',img:'img/pets/metal-monkey.jpg',sh:'ears',c:'#e3f2c6',need:0,t:{ko:'오늘의 타로',en:'Daily tarot'},s:{ko:'하루 한 장, 오늘의 질문',en:'One card, one question a day'},b:{ko:'하루 1장',en:'1 / day'}},
{k:'chat',img:'img/human/wood-rabbit.jpg',sh:'star',pos:'50% 18%',c:'#d6ecfb',need:1,t:{ko:'가이드와 대화',en:'Chat with guide'},s:{ko:'일상이 있는 가이드가 사주를 읽어줘',en:'A guide with a life reads your Saju'},b:{ko:'NEW',en:'NEW'}},
{k:'farm',img:'img/pets/wood-sheep.jpg',sh:'flower',c:'#e8e2fd',need:1,t:{ko:'동물농장',en:'Animal Farm'},s:{ko:'레벨업하면 펫이 사람 모습으로!',en:'Level up and your pet takes human form!'},b:{ko:'Lv.UP',en:'Lv.UP'}},
{k:'shop',img:'img/pets/earth-pig.jpg',sh:'ci',c:'#fde3cc',need:0,t:{ko:'오행 공방',en:'Element Workshop'},s:{ko:'부족한 기운을 채우는 소품',en:'Charms for the energy you lack'},b:{ko:'✦ 추천',en:'✦ Picks'}}];
let pendingTab=null,pendingDraw=false,drawing=false,ballsKey=null;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function goProduct(k){
  const pr=PRODUCTS.find(x=>x.k===k);
  if(pr.need&&!state.pet){pendingTab=k;openBirth();return}
  goTab(k);$('tabs').scrollIntoView({behavior:'smooth',block:'start'});
}
/* claw machine: a heap of pet capsules (left%, bottom%); the prize chute is the acrylic box at bottom-left */
const BALLPOS=[
  [38,0],[50,0],[62,0],[74,0],[86,0],[97,1],
  [44,8],[56,8],[68,8],[80,8],[92,9],
  [38,16],[50,16],[62,16],[74,16],[86,17],
  [45,24],[57,24],[69,24],[81,24],
  [52,32],[64,32],[76,32]];
const ROPE0=26,CHUTE_X=16.5;
function renderBalls(p){
  const n=BALLPOS.length,target=p?n-3+hash(p.date)%3:-1;   // one of the top three, so the claw can reach it
  const rnd=()=>[Math.floor(Math.random()*12),Math.floor(Math.random()*5)];
  $('balls').innerHTML=BALLPOS.map(([x,y],i)=>{const [a,e]=i===target?[p.animal,p.petEl]:rnd();
    return `<span class="ball${i%3===1?' hop':''}${i===target?' target':''}" style="left:${x}%;bottom:${y}%;z-index:${i};--r:${(i*47%50)-25}deg;--bc:${EL[e].c};--d:${(1.8+(i*37%10)/10).toFixed(1)}s;--dl:-${(i*.37).toFixed(2)}s"><img src="${petSrc(a,e)}" alt="" loading="lazy"></span>`}).join('');
}
function resetClaw(){const c=$('claw');c.classList.remove('closed','wide');c.style.transition='';c.style.left='';c.style.animation='';$('rope').style.height='';$('grab').replaceChildren();$('grab').style.width=$('grab').style.height='';$('joy').className='joy'}
function showReveal(p,party){
  const r=$('reveal'),fresh=r.hidden||party;
  $('dvImg').src=humanOn()?humanSrc(p.animal,p.petEl):petSrc(p.animal,p.petEl);$('dvImg').alt=animalLabel(p);
  $('rvT').textContent=fmt(T('rv_t'),{label:animalLabel(p),n:p.name});$('rvAgain').textContent=T('rv_again');
  if(party)$('confetti').innerHTML=Array.from({length:18},(_,i)=>`<i style="left:${i*53%100}%;animation-delay:${(i%6)*.12}s">${['✦','🌸','⭐','🎉','✧','💛'][i%6]}</i>`).join('');
  r.hidden=false;
  if(fresh){const c=r.querySelector('.rv-card');c.style.animation='none';void c.offsetWidth;c.style.animation=''}
}
function flashEl(id){const e=$(id);e.classList.remove('flash');void e.offsetWidth;e.classList.add('flash')}
async function moveClaw(to,ms){   // slide the carriage along the rails; the joystick leans the same way
  const claw=$('claw'),from=parseFloat(claw.style.left);
  $('joy').className='joy '+(to<from?'l':'r');
  claw.style.transition=`left ${ms}ms ease-in-out`;claw.style.left=to+'%';
  await sleep(ms+40);$('joy').className='joy';
}
async function playDraw(){
  const p=state.pet;if(!p||drawing)return;
  drawing=true;$('dvBtn').disabled=true;$('credit').textContent='00';
  $('reveal').hidden=true;$('dvBubble').hidden=true;$('confetti').replaceChildren();
  resetClaw();renderBalls(p);ballsKey=p.date+p.petEl;$('lhTitle').textContent=T('lh_q');
  await sleep(80);
  const box=$('dvScreen'),claw=$('claw'),ball=box.querySelector('.ball.target'),br=box.getBoundingClientRect();
  claw.style.left=((claw.getBoundingClientRect().left+claw.offsetWidth/2-br.left)/br.width*100)+'%';
  claw.style.animation='none';void claw.offsetWidth;                                       // freeze where it is
  await moveClaw(parseFloat(ball.style.left),1000);                                         // over our capsule
  ball.style.animation='none';claw.classList.add('wide');
  const hb=$('clawHead').getBoundingClientRect(),bb=ball.getBoundingClientRect();
  $('rope').style.height=(ROPE0+bb.top-hb.bottom+bb.height*.05)+'px';await sleep(880);    // drop
  claw.classList.remove('wide');claw.classList.add('closed');await sleep(360);             // grab
  $('grab').style.width=$('grab').style.height=bb.width+'px';
  ball.style.left='0';ball.style.bottom='auto';$('grab').append(ball);
  $('rope').style.height=ROPE0+'px';await sleep(880);                                       // lift
  await moveClaw(CHUTE_X,1100);                                                             // to the prize chute
  claw.classList.remove('closed');ball.classList.add('fall');flashEl('chute');await sleep(600);   // release
  flashEl('door');await sleep(350);
  state.drawn=true;save();
  drawing=false;$('dvBtn').disabled=false;$('credit').textContent='01';
  renderLanding(true);
}
function renderLanding(party){
  const p=state.pet,has=!!p,drawn=has&&state.drawn!==false;
  $('loginTab').textContent=has?T('me'):T('login');
  if(!drawing){
    $('lhTitle').textContent=drawn?fmt(T('lh_got'),{label:animalLabel(p)}):T('lh_q');
    $('lhCap').textContent=drawn?fmt(T('lh_cap_in'),{g:L(guideOf(p).n),label:animalLabel(p),n:p.name,lv:lvOf()+1}):has?T('lh_cap_push'):T('lh_cap_out');
    const key=has?p.date+p.petEl:'none';
    if(key!==ballsKey||party){resetClaw();renderBalls(has?p:null);ballsKey=key}
    if(drawn)showReveal(p,!!party);else $('reveal').hidden=true;
  }
  const mine=has?petSrc(p.animal,p.petEl):null;
  $('pgrid').innerHTML=PRODUCTS.map(x=>{const src=x.k==='farm'&&mine?mine:x.img;
    return `<button type="button" class="pcard" style="--pc:${x.c}" data-k="${x.k}"><img class="pimg ${x.sh}" src="${src}" alt="" loading="lazy"${x.pos?` style="object-position:${x.pos}"`:''}><span class="prow"><b>${esc(L(x.t))}</b><span class="pbadge">${esc(L(x.b))}</span></span><small>${esc(L(x.s))}</small></button>`}).join('');
  $('pgrid').querySelectorAll('.pcard').forEach(b=>b.onclick=()=>goProduct(b.dataset.k));
}
$('birthDialog').addEventListener('close',()=>{pendingTab=null;pendingDraw=false});
$('loginTab').onclick=()=>{if(!state.pet)pendingDraw=true;openBirth()};
$('rvAgain').onclick=()=>playDraw();
$('dvBtn').onclick=()=>{
  if(!state.pet){pendingDraw=true;return openBirth()}
  if(state.drawn===false)return playDraw();
  const p=state.pet,l=T('dv_lines'),h=hash(today()+Date.now());
  $('dvBubble').textContent=`${p.name}: ${L(AN[p.animal].sig)} ${l[h%l.length]}`;$('dvBubble').hidden=false;
  const s=$('dvScreen');s.classList.remove('pop');void s.offsetWidth;s.classList.add('pop');
  clearTimeout($('dvBtn')._t);$('dvBtn')._t=setTimeout(()=>$('dvBubble').hidden=true,3200);
};
/* ---- live character panel (always visible) ---- */
let preview={};            // slot -> item id being tried on (not saved)
const DEMO={animal:4,element:1,petEl:4,guide:4,yang:true,sky:'✧'};
function worn(){return {...state.equipped,...preview}}   // preview overrides equipped per slot
function renderPet(){
  const has=!!state.pet,p=has?state.pet:DEMO,g=guideOf(p);
  const lv=lvOf(),hu=humanOn();
  $('petArt').innerHTML=petHTML(p,worn(),hu);
  $('petBadge').textContent=`${p.sky} ${animalLabel(p)}`;
  $('petTitle').textContent=has?p.name:(lang==='ko'?'미리보기 펫':'Preview pet');
  $('petSub').textContent=`${L(EL[p.petEl].v)} · ${p.yang?T('yang'):T('yin')} · ${L(AN[p.animal].tr)}`;
  $('guideChip').innerHTML=`<img src="${crewSrc(g,'face')}" alt=""><span><b>${L(g.n)}</b> · ${EL[p.guide].em} ${L(g.job)}${has?'':' · '+T('preview')}<br><small>${esc(fmt(T('g_owner'),{farm:L(g.farm)}))}</small></span>`;
  const hb=$('humanBtn');hb.hidden=!(has&&lv>=HUMAN_LV&&humanSrc(p.animal,p.petEl));hb.textContent=hu?T('hu_off'):T('hu_on');
  $('room').classList.toggle('night',state.night);
  $('level').textContent=fmt(T('level'),{n:lv+1,t:T('lv_titles')[Math.min(lv,4)],t2:state.xp});
  $('progress').style.width=(state.xp%30)/30*100+'%';
  renderTray();
}
function bump(){const a=$('petArt');a.classList.remove('pop');void a.offsetWidth;a.classList.add('pop')}
function renderTray(){
  const w=worn();
  $('tray').innerHTML=VITEMS.map(g=>{
    const isOn=w[g.s]===g.id,tr=preview[g.s]===g.id&&!state.owned.includes(g.id),own=state.owned.includes(g.id);
    return `<button class="ti ${isOn?'on':''} ${tr?'try':''}" data-id="${g.id}" title="${esc(L(g.n))}"><span>${g.i}</span>${T('slots')[g.s]}<em class="tag" style="font-style:normal">${own?'✓':'✦'+g.p}</em></button>`}).join('');
  $('tray').querySelectorAll('button').forEach(b=>b.onclick=()=>pickItem(b.dataset.id));
  // info line: the last touched item
  const g=VITEMS.find(x=>x.id===lastItem);
  if(!g){$('trayInfo').textContent=T('v_none');return}
  const own=state.owned.includes(g.id),isOn=w[g.s]===g.id;
  if(own)$('trayInfo').innerHTML=`<span>${g.i} <b style="color:var(--text)">${esc(L(g.n))}</b><br>${isOn?T('v_worn'):T('v_owned')}</span>`;
  else $('trayInfo').innerHTML=`<span>${g.i} <b style="color:var(--text)">${esc(L(g.n))}</b><br>${isOn?T('v_try'):L(g.t)}</span><button class="btn primary sm" id="getBtn">${fmt(T('v_buy'),{p:g.p})}</button>`;
  const gb=$('getBtn');if(gb)gb.onclick=()=>getItem(g.id);
}
let lastItem=null;
function pickItem(id){
  const g=VITEMS.find(x=>x.id===id);if(!g)return;
  lastItem=id;
  const own=state.owned.includes(id);
  const nowOn=worn()[g.s]===id;
  if(own){                                   // owned: toggle wear
    delete preview[g.s];
    if(nowOn)delete state.equipped[g.s];else state.equipped[g.s]=id;
    save();
  }else{                                     // not owned: instant try-on preview
    if(nowOn)delete preview[g.s];else preview[g.s]=id;
  }
  renderPet();bump();
}
function getItem(id){
  const g=VITEMS.find(x=>x.id===id);if(!g)return;
  if(state.coins<g.p)return toast(T('v_short'));
  state.coins-=g.p;state.owned.push(id);track('shopv');
  delete preview[g.s];state.equipped[g.s]=id;
  save();render();bump();toast(T('v_on'));
}
/* ---- tabs ---- */
function goTab(name){
  document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===name));
  document.querySelectorAll('.tabp').forEach(p=>p.classList.toggle('on',p.id==='tab-'+name));
  if(innerWidth<=860)$('tabs').scrollIntoView({behavior:'smooth',block:'start'});
}
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>goTab(b.dataset.tab));
function renderChart(){
  const p=state.pet,s=p.saju,names=T('pillar_n');
  const cols=[['hour',s.p.hour],['day',s.p.day],['month',s.p.month],['year',s.p.year]];
  $('pillars').innerHTML=cols.map(([k,x],i)=>{
    if(!x)return `<div class="pil"><small>${names[i]}</small><div class="h">?</div><small>${T('unknown')}</small></div>`;
    const st=STEM[x[0]],br=BR[x[1]];
    return `<div class="pil ${k==='day'?'me':''}"><small>${names[i]}</small><div class="h" style="color:var(--el${st[2]})">${st[1]}</div><div class="h" style="color:var(--el${br[2]})">${br[1]}</div><small>${lang==='ko'?st[0]+br[0]:STEMEN[x[0]].split(' ')[1]+' '+AN[x[1]].en}</small></div>`}).join('');
  const mx=Math.max(...s.cnt,1);
  $('els').innerHTML=EL.map((e,i)=>`<div class="bar"><i>${e.em} ${L(e)}</i><div><u style="width:${s.cnt[i]/mx*100}%;background:var(--el${i})"></u></div><b>${s.cnt[i]}</b></div>`).join('');
  const dm=STEM[s.p.day[0]];
  const dmN=lang==='ko'?`${dm[0]}(${dm[1]}) · ${elName(dm[2])}`:STEMEN[s.p.day[0]];
  const th=EL[p.element];
  let t=[fmt(T('chart_l1'),{dm:dmN,g:L(guideOf(p).n)}),fmt(T('chart_l2'),{top:s.top.map(elName).join(', '),pet:`${animalLabel(p)} '${p.name}'`}),fmt(T('chart_l3'),{lack:s.lack.map(elName).join(', ')}),fmt(T('chart_l4'),{th:`${th.em} ${L(th)}`}),fmt(T('chart_tail'),{n:p.name,a:anName(p.animal),v:L(th.v)})];
  if(!s.p.hour)t.push(T('chart_nt'));
  $('chartText').textContent=t.join('\n\n');
}
function renderGuide(){
  const p=state.pet,g=guideOf(p),k=T('g_kv'),dm=STEM[p.saju.p.day[0]];
  $('gPoster').src=crewSrc(g,'full');$('gPoster').alt=L(g.n);
  $('gEl').textContent=`${EL[p.guide].em} ${L(EL[p.guide])} · ${lang==='ko'?'나의 가이드':'My guide'}`;
  $('gName').textContent=L(g.n);$('gTag').textContent=L(g.tag);
  $('gKv').innerHTML=[[k[0],`${g.age} · ${L(g.g)}`],[k[1],L(g.job)],[k[2],L(g.area)],[k[3],g.mbti],[k[4],L(g.likes)],[k[5],L(g.dis)],[k[6],L(g.farm)]].map(([a,b])=>`<dt>${a}</dt><dd>${esc(b)}</dd>`).join('');
  $('gTags').innerHTML=L(g.tags).map(t=>`<span>${esc(t)}</span>`).join('');
  $('gQuote').textContent=`“${L(g.quote)}”`;
  $('gItems').innerHTML=L(g.items).map(t=>`<span>${esc(t)}</span>`).join('');
  $('gWhy').textContent=fmt(T('g_why_t'),{dm:lang==='ko'?`${dm[0]}(${dm[1]})`:STEMEN[p.saju.p.day[0]],el:elName(p.guide)});
  $('gChibi').src=crewSrc(g,'chibi');$('gChibi').alt=L(g.chibi);
  $('gDaily').textContent=`${today()} · ${L(g.day)[new Date().getDay()]}`;
  $('gFriends').innerHTML=CREW.filter(c=>c!==g).map(c=>`<button type="button" class="fr" data-id="${c.id}"><img src="${crewSrc(c,'face')}" alt=""><span><b>${L(c.n)}</b> · ${EL[CREW.indexOf(c)].em} ${esc(L(c.job))}<br>${esc(L(g.fr[c.id]))}</span></button>`).join('');
  $('gFriends').querySelectorAll('button').forEach(b=>b.onclick=()=>{const c=CREW.find(x=>x.id===b.dataset.id);
    info(`${L(c.n)} · ${L(c.tag)}`,`${L(c.job)} · ${L(c.area)} · ${c.mbti}\n“${L(c.quote)}”\n\n${L(g.n)}: ${L(g.fr[c.id])}\n${L(c.n)}: ${L(c.fr[g.id])}\n\n${lang==='ko'?'오늘':'Today'}: ${L(c.day)[new Date().getDay()]}`)});
}
function farmOrder(a){   // own animal first, then six-harmony / triple-harmony partners, then the rest
  const he=HE.find(x=>x.includes(a)),sam=SAM.find(x=>x.includes(a));
  const o=[a,he[0]===a?he[1]:he[0],...sam.filter(x=>x!==a)];
  for(let i=1;i<12;i++){const x=(a+i)%12;if(!o.includes(x))o.push(x)}
  return o;
}
function renderFarm(){
  const p=state.pet,g=guideOf(p),lv=lvOf(),st=stageOf(lv);
  $('farmTitle').textContent=`${EL[p.guide].em} `+fmt(T('farm_h'),{g:L(g.n),farm:L(g.farm)});
  $('farmSub').textContent=T('farm_p');
  $('fpBadge').textContent=`${p.sky} ${animalLabel(p)}`;
  $('fpImg').src=petSrc(p.animal,p.petEl);$('fpImg').alt=animalLabel(p);
  $('fpName').textContent=p.name;
  $('fpSub').textContent=`Lv.${lv+1} · ${L(AN[p.animal].tr)} · ${L(ELJOB)[p.petEl]}`;
  $('fpStage').innerHTML=T('stage').map((s,i)=>`<span class="${i===st?'on':''}">${s}</span>`).join('');
  $('fpNext').textContent=fmt(T(st===2?'fp_max':'fp_next'),{x:30-state.xp%30,h:HUMAN_LV+1});
  const hs=humanSrc(p.animal,p.petEl),open=lv>=HUMAN_LV;
  const prof=`<div class="kv" style="text-align:left"><dt>${T('pet_look')}</dt><dd>${esc(L(ANLOOK)[p.animal])}, ${esc(L(ELLOOK)[p.petEl])}</dd><dt>${T('pet_trait')}</dt><dd>${esc(L(AN[p.animal].tr))}</dd><dt>${T('pet_job')}</dt><dd>${esc(fmt(T('hu_role'),{g:L(g.n)}))} · ${esc(L(ELJOB)[p.petEl])}</dd></div>`;
  $('huCard').innerHTML=`<h3>${T('hu_h')}</h3>`+(open&&hs
    ?`<div class="pet-img human" style="margin:10px auto"><img src="${hs}" alt=""></div>${prof}<button class="btn sm" onclick="toggleHuman()">${humanOn()?T('hu_off'):T('hu_on')}</button>`
    :`<div class="hu-ph"><img src="${petSrc(p.animal,p.petEl)}" alt=""><div>${open?`✨<br><b>${esc(p.name)}</b><br><small>${T('hu_soon')}</small>`:`🔒<br><small>${esc(fmt(T('hu_lock'),{n:HUMAN_LV+1,p:p.name}))}</small>`}</div></div>${open?prof:''}`);
  const order=farmOrder(p.animal),n=Math.min(12,lv+1),visit=state.match?state.match.her.animal:null;
  $('farmRosterSub').textContent=fmt(T('farm_roster_s'),{el:`${EL[p.petEl].em} ${elName(p.petEl)}`,n});
  $('farmGrid').innerHTML=order.map((a,i)=>{
    const me=i===0,in_=i<n,vis=!in_&&a===visit,shown=in_||vis;
    const lab=me?T('farm_me'):vis?T('farm_visit'):in_?L(AN[a].tr):fmt(T('farm_lock'),{n:i+1});
    return `<button type="button" class="fa ${me?'me':''} ${shown?'':'lock'} ${vis?'visit':''}" data-a="${a}" data-on="${shown?1:0}"><img src="${petSrc(a,vis?state.match.her.petEl:p.petEl)}" alt="" loading="lazy"><b>${shown?(me?esc(p.name):anName(a)):'?'}</b>${esc(lab)}</button>`}).join('');
  $('farmGrid').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(b.dataset.on!=='1')return toast(b.lastChild.textContent);
    const a=+b.dataset.a;info(`${AN[a].e} ${anName(a)}`,`${L(AN[a].tr)} · ${L(AN[a].sig)}\n\n${L(ANLOOK)[a]}`)});
}
function toggleHuman(){state.human=!state.human;save();render();bump()}
function renderChat(){
  $('chatLog').replaceChildren();
  const g=state.pet?guideOf(state.pet):null;
  for(const m of state.chats){
    const row=document.createElement('div'),b=document.createElement('div'),u=m.role==='user';
    row.className='msg'+(u?' user':'');b.className='bubble'+(u?' user':'');b.textContent=m.text;
    if(!u&&g){const im=document.createElement('img');im.className='av';im.src=crewSrc(g,'face');im.alt=L(g.n);row.append(im)}
    row.append(b);$('chatLog').append(row)}
  $('chatLog').scrollTop=$('chatLog').scrollHeight;
  const chips=T('chips_g');
  $('chips').innerHTML=chips.map(c=>`<button type="button" data-t="${esc(c)}">${esc(c)}</button>`).join('');
  $('chips').querySelectorAll('button').forEach(b=>b.onclick=()=>chat(b.dataset.t));
}
function renderRitual(){
  const d=dayData(),c=d.card===null?null:TAROT[d.card];
  $('tIcon').textContent=c?c[0]:'✧';
  $('tName').textContent=c?L({ko:c[1],en:c[2]}):'YUNSEUL';
  $('tText').textContent=c&&state.pet?fmt(T('tarot_q'),{k:L({ko:c[3],en:c[4]}),n:state.pet.name}):T('tarot_idle');
  $('drawBtn').disabled=!!c;$('drawBtn').textContent=c?T('drawn'):T('draw');
  const zi=state.zsel!==null?state.zsel:(state.pet?zodiacOf(state.pet.date):null);
  if(zi!==null){
    $('zPick').value=zi;const z=ZOD[zi];
    $('zName').textContent=`${z[0]} ${L({ko:z[1],en:z[2]})} · ${L(z[3])}`;
    const r=rng(hash(z[2]+today()));
    $('zBars').innerHTML=T('z_lbl').map(l=>{const v=45+Math.floor(r()*55);return `<div class="bar"><i>${l}</i><div><u style="width:${v}%"></u></div><b>${v}</b></div>`}).join('');
    $('zText').textContent=L(ZMSG[Math.floor(r()*ZMSG.length)]);
  }else{$('zName').textContent='✦';$('zBars').innerHTML='';$('zText').textContent=''}
  const el=state.pet?EL[state.pet.element]:EL[1];
  const q=lang==='ko'?['물 한 잔, 천천히 마시기','나에게 다정한 말 건네기']:['Drink a glass of water slowly','Say something kind to yourself'];
  const all=[...q,L(el.q)];
  $('quests').innerHTML=all.map((t,i)=>`<button class="task" data-i="${i}" ${d.tasks.includes(i)?'disabled':''}>${d.tasks.includes(i)?'✓':'○'} ${esc(t)} <span style="float:right">${d.tasks.includes(i)?'✓':'+10 ✦'}</span></button>`).join('');
  $('quests').querySelectorAll('button').forEach(b=>b.onclick=()=>completeTask(+b.dataset.i));
}
let shopFilter='all';
function renderShop(){
  const rec=state.pet?state.pet.element:null;
  const rb=$('recbar');rb.hidden=rec===null;if(rec!==null)rb.innerHTML=fmt(T('rec_for'),{el:`${EL[rec].em} ${L(EL[rec])}`});
  $('filters').innerHTML=[['all',T('all')],...EL.map((e,i)=>[String(i),`${e.em} ${L(e)}`])].map(([k,l])=>`<button class="${shopFilter===k?'on':''}" data-k="${k}">${l}</button>`).join('');
  $('filters').querySelectorAll('button').forEach(b=>b.onclick=()=>{shopFilter=b.dataset.k;renderShop()});
  const list=GOODS.filter(g=>shopFilter==='all'||g.el===+shopFilter||g.el===-1);
  $('products').innerHTML=list.map(g=>{
    const nm=g.el===-1&&state.pet?L(g.n).replace(lang==='ko'?'내 동물':'your animal',anName(state.pet.animal)):L(g.n);
    const col=g.el>=0?EL[g.el].c:'#c9bcd9';
    return `<article class="card product ${rec===g.el?'rec':''}"><div class="shop-art" style="background:${col}33">${g.i}<span class="badge">${g.el>=0?EL[g.el].em+' '+L(EL[g.el]):'✦'}${g.b?' · '+g.b:''}</span></div><h3>${esc(nm)}</h3><p>${L(g.t)}</p><div class="price">$${g.p}</div><button class="btn" data-id="${g.id}">+ ${T('add')}</button></article>`}).join('');
  $('products').querySelectorAll('button').forEach(b=>b.onclick=()=>addCart(+b.dataset.id));
}
function renderJournal(){
  $('entries').innerHTML=state.entries.length?`<h3>${T('jo_list')}</h3>`+state.entries.slice().reverse().map(e=>`<div class="entry"><small>${esc(e.day)} · ${esc(T('moods')[e.mood]??'')}</small><p>${esc(e.text)}</p><button class="textbtn" data-id="${e.id}">${T('del')}</button></div>`).join(''):`<div class="empty">${T('jo_none')}</div>`;
  $('entries').querySelectorAll('button').forEach(b=>b.onclick=()=>deleteEntry(b.dataset.id));
}

/* ================= CREATE ================= */
$('noTime').onchange=()=>{$('birthTime').disabled=$('noTime').checked;if($('noTime').checked)$('birthTime').value=''};
$('birthTime').oninput=()=>{if($('birthTime').value)$('noTime').checked=false};
$('mbti').onchange=()=>{const m=$('mbti').value;if(!m)return;$('tone').value=m[2]==='T'?'clear':(m[0]==='E'&&m[3]==='P')?'play':'warm'};
function openBirth(){
  track('start');save();
  const p=state.pet;
  if(p){$('nickname').value=p.name;$('birthday').value=p.date;$('birthTime').value=p.time||'';$('noTime').checked=!p.time;$('mbti').value=p.mbti;$('tone').value=p.tone;$('element').value=p.choice;$('sky').value=p.sky}
  else{$('noTime').checked=true;$('birthTime').disabled=true}
  $('birthTime').disabled=$('noTime').checked;
  if(!$('birthDialog').open)$('birthDialog').showModal();
}
$('birthForm').onsubmit=e=>{
  e.preventDefault();
  const date=$('birthday').value,name=$('nickname').value.trim();
  if(!name||!validDate(date))return toast(T('bad_input'));
  const time=$('noTime').checked?'':$('birthTime').value;
  const s=saju(date,time||null);
  const choice=$('element').value;
  const element=choice==='auto'?s.theme:Number(choice);
  const first=!state.pet;
  const prev=state.pet;
  state.pet={name,date,time,mbti:$('mbti').value,tone:$('tone').value,sky:$('sky').value,choice,element,animal:s.animal,yang:s.yang,saju:s,petEl:petTop(s,date),guide:STEM[s.p.day[0]][2]};
  state.match=null;
  const changed=!prev||prev.guide!==state.pet.guide||prev.animal!==state.pet.animal||prev.petEl!==state.pet.petEl;
  if(!state.chats.length||first||changed){state.chats=[{role:'guide',text:greet()}];state.mem=null}
  if(first||changed)state.drawn=false;          // a new pet waits in the claw machine
  track('done');save();render();
  const draw=pendingDraw;
  $('birthDialog').close();
  if(pendingTab){goTab(pendingTab);pendingTab=null;$('tabs').scrollIntoView({behavior:'smooth',block:'start'})}
  else if(draw){goTab(first?'guide':'chat');scrollTo({top:0,behavior:'smooth'});setTimeout(playDraw,500)}
  else goTab(first?'guide':'chat');
  toast(T('started'));
};
function greet(){
  const p=state.pet,g=guideOf(p),dm=STEM[p.saju.p.day[0]],top=EL[p.petEl];
  return lang==='ko'
    ?`안녕, 나는 ${L(g.n)}! ${L(g.area)}에서 ${L(g.job)}로 일하면서 '${L(g.farm)}'을 꾸리고 있어. 네 일간이 ${dm[0]}${dm[1]}이라 나랑 같은 ${elName(p.guide)} 기운이더라. 그래서 내가 네 사주를 봐주게 됐어.\n\n그리고 오늘 우리 농장에 새 식구가 왔어 — ${animalLabel(p)} '${p.name}'! 네 팔자에서 ${top.ko} 기운이 가장 강해서 이런 모습으로 태어났대. 같이 돌보면서 레벨이 오르면 사람 모습으로도 변할 수 있어.\n\n오늘 네 하루는 어땠어?`
    :`Hi, I'm ${L(g.n)}! I work as a ${L(g.job).toLowerCase()} in ${L(g.area)} and run the ${L(g.farm)}. Your Day Master is ${STEMEN[p.saju.p.day[0]]} — the same ${elName(p.guide)} energy as mine, so I'll be reading your Saju.\n\nAnd a new resident arrived at the farm today — ${animalLabel(p)} "${p.name}"! ${top.en} is the strongest energy in your chart, so that's the form it was born in. Raise it with me, and as it levels up it can even take human form.\n\nHow was your day?`}
function toggleMode(){state.night=!state.night;save();render()}

/* ================= CHAT ================= */
const CATS=[
['tired',/지쳤|힘들|피곤|슬퍼|우울|tired|exhaust|sad|stress|down/i],
['fear',/용기|불안|걱정|무서|시험|발표|anxious|nervous|afraid|worr|exam|presentation/i],
['friend',/친구|크루|호야|누리|키안|hoya|nuri|kian|\bgil\b|\bsan\b|friend|crew/i],
['saju',/사주|팔자|오행|일간|운세|기운|saju|fortune|element|day master/i],
['pet',/펫|농장|동물|의인화|레벨|\bpet\b|farm|level|human form/i],
['daily',/뭐\s?했|뭐\s?해|뭐하|일상|요즘|너는|넌 |what did you|your day|up to/i],
['happy',/좋은|행복|기뻐|뿌듯|신나|happy|glad|proud|great|good thing/i],
['love',/사랑|좋아하는|최애|짝사랑|crush|love|bias/i]];
const REPLY={
tired:{ko:['오늘은 많이 애썼구나. 잠깐 쉬면서 지금 필요한 것을 하나만 골라볼까?','지친 마음, 여기서는 내려놔도 돼. 따뜻한 것 한 모금 마시고 올래?'],en:['You worked so hard today. Shall we pick just one thing you need right now?','You can set that tired heart down here. Maybe grab something warm to drink?']},
fear:{ko:['가장 작은 첫걸음부터 골라보자. 지금 5분 안에 할 수 있는 일은 뭘까?','걱정은 쪼개면 작아져. 제일 먼저 확인할 사실 하나만 말해줄래?'],en:['Let\'s choose the smallest first step. What can you do in 5 minutes?','Worries shrink when split up. What is the one fact to check first?']},
happy:{ko:['그 순간을 함께 간직하고 싶어! 어떤 점이 제일 기뻤는지 기록에 남겨볼까?','와, 나도 덩달아 신나! 그 기쁨을 누구와 나누고 싶어?'],en:['I want to keep that moment with you! Shall we write what felt best in your journal?','Wow, now I\'m excited too! Who would you like to share it with?']},
love:{ko:['설레는 마음이구나! 그 사람의 어떤 점이 좋은지 한 가지만 적어볼까? 인연 보기에서 우리 궁합도 볼 수 있어.','좋아하는 마음은 그 자체로 반짝여. 인연 보기에서 두 동물의 이야기를 만들어볼래?'],en:['What a fluttery feeling! Want to write one thing you like about them? You can also try Chemistry above.','Liking someone is sparkly by itself. Want to make a story of your two animals in Chemistry?']},
other:{ko:['이야기해 줘서 고마워. 그중 오늘 가장 마음에 남은 순간을 하나 더 말해줄래?','응, 듣고 있어. 그때 어떤 기분이 들었는지 조금만 더 들려줄래?'],en:['Thanks for telling me. Which moment stayed with you most today?','I\'m listening. Tell me a bit more about how it felt?']}};
const MEMLINE={tired:{ko:'지난번에 많이 지쳐 보였는데, 오늘은 좀 어때?',en:'You seemed worn out last time — how is today?'},fear:{ko:'지난번에 걱정이 있었잖아. 그건 어떻게 됐어?',en:'You were worried last time. How did it go?'},happy:{ko:'지난번에 좋은 일이 있었지! 그 기분 아직 남아 있어?',en:'You had good news last time! Is the feeling still here?'},love:{ko:'지난번에 설레는 이야기를 했었지. 그 뒤로 어때?',en:'You told me something fluttery last time. Any news?'}};
/* topics about the guide's own life, friends, your saju and your pet */
function topicReply(cat,t){
  const p=state.pet,g=guideOf(p),dow=new Date().getDay(),ko=lang==='ko',h=hash(t+today()),lv=lvOf();
  if(cat==='daily')return L(g.day)[dow]+' '+(ko?`${p.name}도 오늘 ${L(ELJOB)[p.petEl]}으로 바빴어. 너는 오늘 어땠어?`:`${p.name} was busy too, ${L(ELJOB)[p.petEl]}. How was yours?`);
  if(cat==='friend'){
    const named=CREW.find(c=>c!==g&&((c.kr.length>1&&t.includes(c.kr))||t.toLowerCase().includes(c.id))),others=CREW.filter(c=>c!==g),c=named||others[h%others.length];
    return ko?`${L(c.n)} 얘기? ${L(g.fr[c.id])} 요즘 ${L(c.n)} 근황 — "${L(c.day)[dow]}" 우리 TIGER CREW는 ${others.map(x=>L(x.n)).join(', ')}, 그리고 나. 🧑 내 가이드 탭에서 다 소개해 둘게.`
      :`About ${L(c.n)}? ${L(g.fr[c.id])} Latest from ${L(c.n)}: "${L(c.day)[dow]}" Our TIGER CREW is ${others.map(x=>L(x.n)).join(', ')} and me. Meet them all in the My Guide tab.`}
  if(cat==='saju'){
    const s=p.saju,dm=STEM[s.p.day[0]];
    return ko?`네 일간은 ${dm[0]}(${dm[1]}) — 나와 같은 ${elName(p.guide)} 기운이야. 팔자에서 가장 강한 기운: ${s.top.map(elName).join(', ')}. 그래서 펫은 ${animalLabel(p)} 모습이 됐어. 상대적으로 약한 기운: ${s.lack.map(elName).join(', ')}. 공방에선 ${elName(p.element)} 쪽 소품을 골라뒀어. 자세한 네 기둥은 ☯ 사주 탭에! (어디까지나 오락용 간이 풀이야.)`
      :`Your Day Master is ${STEMEN[s.p.day[0]]} — the same ${elName(p.guide)} energy as mine. Strongest in your chart: ${s.top.map(elName).join(', ')}, which is why your pet is a ${animalLabel(p)}. Relatively weak: ${s.lack.map(elName).join(', ')}, so I picked ${elName(p.element)} items in the Workshop. See the four pillars in the Saju tab! (Just a simplified reading, for fun.)`}
  const hu=lv>=HUMAN_LV?(humanSrc(p.animal,p.petEl)?(ko?'의인화 모습도 열렸어 — 🏡 동물농장 탭에서 볼 수 있어!':'Human form is unlocked — see it in the Animal Farm tab!'):(ko?'의인화가 열렸어! 이 조합 일러스트는 준비 중이야.':'Human form is unlocked! Art for this combination is coming soon.'))
    :(ko?`의인화까지는 Lv.${HUMAN_LV+1}, 별가루 ✦${HUMAN_LV*30-state.xp} 남았어.`:`Human form at Lv.${HUMAN_LV+1} — ✦${HUMAN_LV*30-state.xp} to go.`);
  return ko?`${p.name} 소식! 지금 Lv.${lv+1} · ${T('stage')[stageOf(lv)]}. 오늘도 ${L(ELJOB)[p.petEl]}으로 열심이야. ${hu} (${p.name}: ${L(AN[p.animal].sig)})`
    :`News from ${p.name}! Lv.${lv+1} · ${T('stage')[stageOf(lv)]}, ${L(ELJOB)[p.petEl]}. ${hu} (${p.name}: ${L(AN[p.animal].sig)})`;
}
function rule(t){
  const p=state.pet,g=guideOf(p);let cat='other';for(const [k,re] of CATS)if(re.test(t)){cat=k;break}
  if(cat==='other'&&t.includes(p.name))cat='pet';
  if(!REPLY[cat])return topicReply(cat,t);
  const h=hash(t+today()),pool=REPLY[cat][lang];let r=pool[h%pool.length];
  if(h%3!==0)r=L(g.open)[h%L(g.open).length]+' '+r;          // the guide speaks from their own life
  if(state.mem&&state.mem.day!==today()&&MEMLINE[state.mem.cat])r=L(MEMLINE[state.mem.cat])+' '+r;
  if(p.tone==='clear')r=(lang==='ko'?'차근차근 정리해 보자. ':'Let\'s sort it out step by step. ')+r;
  if(p.tone==='play')r=(lang==='ko'?'응원 에너지 충전! ✨ ':'Cheer energy charged! ✨ ')+r;
  if(p.mbti&&p.mbti[2]==='F'&&cat!=='other')r+=lang==='ko'?' (네 마음이 먼저야.)':' (Your feelings come first.)';
  if(p.mbti&&p.mbti[2]==='T'&&cat==='fear')r+=lang==='ko'?' 우선순위를 번호로 적어볼까?':' Want to number your priorities?';
  r+=` (${p.name}: ${L(AN[p.animal].sig)})`;
  if(cat!=='other')state.mem={cat,day:today()};
  return r;
}
async function reply(t){
  if(!AI_ENDPOINT)return rule(t);
  try{
    const p=state.pet,g=guideOf(p),dow=new Date().getDay();
    const guide={name:g.n.en,age:g.age,gender:g.g.en,job:g.job.en,area:g.area.en,mbti:g.mbti,element:EL[p.guide].en,farm:g.farm.en,likes:g.likes.en,quote:g.quote.en,today:g.day.en[dow],friends:CREW.filter(c=>c!==g).map(c=>({name:c.n.en,job:c.job.en,relation:g.fr[c.id].en}))};
    const res=await fetch(AI_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({guide,pet:{name:p.name,animal:AN[p.animal].en,element:EL[p.petEl].en,level:lvOf()+1,yang:p.yang},user:{tone:p.tone,mbti:p.mbti,dayMaster:STEMEN[p.saju.p.day[0]],strongest:p.saju.top.map(i=>EL[i].en),weakest:p.saju.lack.map(i=>EL[i].en)},lang,messages:state.chats.slice(-12).concat({role:'user',text:t})})});
    const j=await res.json();if(j&&typeof j.reply==='string')return j.reply.slice(0,800);
  }catch(e){}
  return rule(t);
}
async function chat(text){
  if(!needPet())return;
  const t=text.trim().slice(0,300);if(!t)return;
  state.chats.push({role:'user',text:t});track('chat');renderChat();$('message').value='';
  const r=await reply(t);
  state.chats.push({role:'guide',text:r});state.chats=state.chats.slice(-40);save();renderChat();
}
$('chatForm').onsubmit=e=>{e.preventDefault();chat($('message').value)};
function clearChat(){if(!confirm(T('confirm_chat')))return;state.chats=[];save();renderChat()}

/* ================= RITUAL ================= */
function addXp(n){
  const before=lvOf();state.coins+=n;state.xp+=n;const after=lvOf();
  if(after===before||!state.pet)return;
  const p=state.pet,g=guideOf(p),ko=lang==='ko';
  let msg=ko?`${p.name}, Lv.${after+1} 달성! `:`${p.name} reached Lv.${after+1}! `;
  if(after<12){const a=farmOrder(p.animal)[after];msg+=fmt(T('new_farm'),{a:`${AN[a].e} ${anName(a)}`})}
  if(after===HUMAN_LV)msg+=' '+fmt(T('hu_unlock'),{p:p.name});
  state.chats.push({role:'guide',text:msg});state.chats=state.chats.slice(-40);
  setTimeout(()=>toast(msg),900);
}
function completeTask(i){
  if(!needPet())return;const d=dayData();if(d.tasks.includes(i))return;
  d.tasks.push(i);addXp(10);save();render();toast(T('task_done'));
}
function drawTarot(){
  if(!needPet())return;const d=dayData();if(d.card!==null)return;
  d.card=hash(today()+state.pet.date)%TAROT.length;track('tarot');
  const c=TAROT[d.card];
  state.chats.push({role:'guide',text:fmt(T('tarot_pet'),{n:L(guideOf(state.pet).n),c:L({ko:c[1],en:c[2]}),s:fmt(T('tarot_q'),{k:L({ko:c[3],en:c[4]}),n:state.pet.name})})});
  state.chats=state.chats.slice(-40);save();render();
}
$('zPick').onchange=()=>{state.zsel=+$('zPick').value;save();renderRitual()};

/* ================= SHOP / CART ================= */
function addCart(id){const f=state.cart.find(c=>c.id===id);f?f.q++:state.cart.push({id,q:1});track('cart');save();renderCart();toast(T('added'))}
function renderCart(){
  $('cartN').textContent=state.cart.reduce((a,c)=>a+c.q,0);
  if(!state.cart.length){$('items').innerHTML=`<p class="muted" style="padding-top:16px">${T('empty')}</p>`;$('total').textContent='$0';return}
  let tot=0;
  $('items').innerHTML=state.cart.map(c=>{const g=GOODS.find(x=>x.id===c.id);tot+=g.p*c.q;return `<div class="ci"><span>${g.i}</span><div>${esc(L(g.n))}<br><small>$${g.p} × ${c.q}</small></div><button data-id="${c.id}">✕</button></div>`}).join('');
  $('total').textContent='$'+tot;
  $('items').querySelectorAll('button').forEach(b=>b.onclick=()=>{state.cart=state.cart.filter(c=>c.id!==+b.dataset.id);save();renderCart()});
}
$('cartBtn').onclick=()=>$('drawer').classList.add('open');
$('closeCart').onclick=()=>$('drawer').classList.remove('open');
$('checkout').onclick=()=>alert(T('checkout_msg'));

/* ================= CHEMISTRY ================= */
$('preset').onchange=()=>{const p=PRESETS.find(x=>x.id===$('preset').value);$('partner').value=p?L(p.n):'';$('partnerDate').value=p?p.d:'';$('partnerMbti').value=p?p.m:''};
const HE=[[0,1],[2,11],[3,10],[4,9],[5,8],[6,7]],SAM=[[8,0,4],[11,3,7],[2,6,10],[5,9,1]];
function animalRel(a,b){
  if(a===b)return['same',10];
  if(HE.some(([x,y])=>(x===a&&y===b)||(x===b&&y===a)))return['he',20];
  if(SAM.some(g=>g.includes(a)&&g.includes(b)))return['sam',16];
  if(Math.abs(a-b)===6)return['clash',4];
  return['norm',8];
}
function elemRel(a,b){const d=(b-a+5)%5;return d===0?['same',8]:(d===1||d===4)?['gen',14]:['ctl',6]}
function compat(me,her){   // elements = each person's strongest element (pet element). MBTI is profile-only, never scored.
  const [ar,as]=animalRel(me.animal,her.animal),[er,es]=elemRel(me.petEl,her.petEl);
  const ys=me.yang!==her.yang?10:5;
  const score=Math.min(99,50+as+es+ys);
  return {score,ar,as,er,es,ys};
}
$('matchForm').onsubmit=e=>{
  e.preventDefault();if(!needPet())return;
  const name=$('partner').value.trim(),date=$('partnerDate').value;
  if(!name||!validDate(date))return toast(T('bad_input'));
  const s=saju(date,null),her={name,mbti:$('partnerMbti').value,animal:s.animal,yang:s.yang,petEl:petTop(s,date)};
  state.match={her,...compat(state.pet,her)};
  track('match');save();render();
};
function renderMatch(){
  const m=state.match;$('matchEmpty').hidden=!!m;$('matchResult').hidden=!m;
  if(!m||!state.pet)return;
  const p=state.pet,cap=(x,n)=>`<small style="display:block;margin-top:4px">${esc(n)} · ${esc(animalLabel(x))}</small>`;
  $('mePet').innerHTML=petHTML(p)+cap(p,p.name);$('herPet').innerHTML=petHTML(m.her)+cap(m.her,m.her.name);
  $('mTitle').textContent=fmt(T('m_title'),{a:p.name,b:m.her.name});
  $('mScore').textContent=m.score;
  $('mStory').textContent=T('m_story')[m.score>=80?0:m.score>=70?1:2];
  const mb=p.mbti||m.her.mbti?`${p.mbti||'?'} × ${m.her.mbti||'?'} · ${T('m_prof')}`:T('m_na');
  const bars=[[T('m_parts')[0],m.as,20,T('rel')[m.ar]],[T('m_parts')[1],m.es,14,T('erel')[m.er]],[T('m_parts')[2],m.ys,10,m.ys===10?(lang==='ko'?'음양 보완':'Complementary'):(lang==='ko'?'같은 결':'Same polarity')]];
  $('mBars').innerHTML=bars.map(([l,v,mx,note])=>`<div class="bar"><i>${l}</i><div><u style="width:${v/mx*100}%"></u></div><b style="flex-basis:auto;min-width:60px;font-weight:400;font-size:11px;color:var(--muted)">${esc(note)}</b></div>`).join('')
    +`<div class="bar"><i>${T('m_parts')[3]}</i><span style="flex:1;font-size:12px;color:var(--muted)">${esc(mb)}</span></div>`;
  $('mExplain').textContent=fmt(T('m_exp'),{a:m.as,b:m.es,c:m.ys});
}
function dl(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
const loadImg=src=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=src});
async function downloadCard(){
  if(!state.match)return;track('share');save();
  const m=state.match,p=state.pet;
  try{
    const [a,b]=await Promise.all([loadImg(petSrc(p.animal,p.petEl)),loadImg(petSrc(m.her.animal,m.her.petEl))]);
    const c=document.createElement('canvas');c.width=900;c.height=1100;const x=c.getContext('2d');
    x.fillStyle='#f7f1e9';x.fillRect(0,0,900,1100);x.strokeStyle='#c9a96e';x.lineWidth=2;x.strokeRect(40,40,820,1020);
    x.fillStyle='#59476b';x.textAlign='center';
    x.font='46px Georgia,serif';x.fillText('☾ YUNSEULDANG',450,140);
    x.font='18px sans-serif';x.fillText('OUR LITTLE CONNECTION',450,190);
    x.drawImage(a,70,250,368,286);x.drawImage(b,462,250,368,286);
    x.font='22px sans-serif';x.fillText(`${p.name} · ${animalLabel(p)}`,254,580);x.fillText(`${m.her.name} · ${animalLabel(m.her)}`,646,580);
    x.font='34px sans-serif';x.fillText(`${p.name} × ${m.her.name}`,450,700);
    x.font='100px Georgia,serif';x.fillText(String(m.score),450,840);
    x.font='22px sans-serif';x.fillText(lang==='ko'?'윤슬 케미 지수 · 오락용':'Yunseul Chemistry · for fun',450,890);
    x.font='16px sans-serif';x.fillText(lang==='ko'?'샘플 규칙 결과 · 실제 관계 예측이 아닙니다':'Fixed-rule result · not a real relationship prediction',450,1010);
    c.toBlob(bl=>bl&&dl(bl,'yunseuldang-duo.png'),'image/png');
    toast(T('card_saved'));
  }catch(e){toast(T('saved_fail'))}
}
async function shareMatch(){
  if(!state.match)return;track('share');save();
  const text=fmt(T('share_t'),{a:state.pet.name,b:state.match.her.name,s:state.match.score});
  try{
    if(navigator.share){await navigator.share({title:'Yunseuldang',text});return}
    if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);toast(T('copy'));return}
  }catch(e){if(e.name==='AbortError')return}
  info(T('copyshare'),text);
}

/* ================= JOURNAL ================= */
$('journalForm').onsubmit=e=>{
  e.preventDefault();if(!needPet())return;
  const text=$('memo').value.trim();if(!text)return;
  state.entries.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),day:today(),mood:+$('mood').value,text:text.slice(0,500)});
  state.entries=state.entries.slice(-60);save();render();$('memo').value='';toast(T('journal_saved'));
};
function deleteEntry(id){if(!confirm(T('confirm_entry')))return;state.entries=state.entries.filter(e=>e.id!==id);save();render()}
function weekly(){
  const d=new Date();d.setDate(d.getDate()-6);const start=dstr(d),end=today();
  const ents=state.entries.filter(e=>e.day>=start&&e.day<=end);
  const tasks=Object.keys(state.days).filter(k=>k>=start&&k<=end).reduce((n,k)=>n+state.days[k].tasks.length,0);
  const mo={};for(const e of ents)mo[e.mood]=(mo[e.mood]||0)+1;
  const ms=Object.entries(mo).map(([m,n])=>`${T('moods')[m]} ${n}${T('times')}`).join(' · ')||T('wk_none');
  info(T('wk_h'),`${start} ~ ${end}\n\n`+fmt(T('wk_body'),{e:ents.length,t:tasks,m:ms}));
}

/* ================= INFO / METRICS / RESET ================= */
function openPartner(){$('pStatus').textContent='';$('partnerDialog').showModal()}
$('partnerForm').onsubmit=async e=>{
  e.preventDefault();const f=e.target,b=$('pSend');
  b.disabled=true;b.textContent=T('p_sending');$('pStatus').textContent='';
  try{
    const r=await fetch(f.action,{method:'POST',body:new FormData(f),headers:{Accept:'application/json'}});
    if(!r.ok)throw new Error(r.status);
    f.reset();$('partnerDialog').close();toast(T('p_ok'));
  }catch(err){$('pStatus').textContent=T('p_fail')}
  finally{b.disabled=false;b.textContent=T('p_send')}
};
function info(title,text){$('infoTitle').textContent=title;$('infoBody').textContent=text;$('infoDialog').showModal()}
function showMetrics(){
  const m=state.metrics,g=k=>m[k]||0,mt=T('mt');
  const rate=g('start')?Math.round(g('done')/g('start')*100)+'%':'-';
  info(T('metrics_h'),Object.keys(mt).map(k=>`${mt[k]}: ${g(k)}`).join('\n')+`\n\n${T('mt_rate')}: ${rate}\n\n${T('mt_note')}`);
}
function resetAll(){
  if(!confirm(T('confirm_reset')))return;
  state=fresh();try{localStorage.removeItem(LS)}catch(e){}
  render();toast(T('reset_done'));
}

/* ================= PIXEL PET HOME =================
   The animal comes from saju(): zodiac animal by birth year (Ipchun), element = weakest element (s.theme),
   yin/yang of the birth year. The element is only the device/screen skin; ◀ ▶ lets the user try others. */
const PXLS='ksaju-pixel-v1';
let px={me:null,skin:null},pxEditing=false,pxSayT;
try{const v=JSON.parse(localStorage.getItem(PXLS));if(v&&typeof v==='object')px={...px,...v}}catch(e){}
if(!px.me&&state.pet&&state.pet.date)px.me={date:state.pet.date,time:state.pet.time||'',name:state.pet.name||''};   // carry over the birth info from the previous site
function pxSave(){try{localStorage.setItem(PXLS,JSON.stringify(px))}catch(e){}}
function pxInfo(){
  if(!px.me||!validDate(px.me.date))return null;
  const s=saju(px.me.date,px.me.time||null);
  const el=Number.isInteger(px.skin)?px.skin:s.theme;
  return {s,animal:s.animal,lack:s.theme,el,yang:s.yang,name:px.me.name||L(AN[s.animal])};
}
const pxLabel=(el,a)=>lang==='ko'?`${EL[el].ko} ${AN[a].ko}`:`${EL[el].en} ${AN[a].en}`;
function pxYear(){const d=new Date(),y=d.getFullYear();return d>=new Date(y,1,4)?y+1:y}   // "new year" = the next Ipchun year
const pxGanji=y=>{const st=STEM[((y-4)%10+10)%10],br=BR[((y-4)%12+12)%12];return lang==='ko'?st[0]+br[0]:st[1]+br[1]};
function pxSprite(a,scale){const [w,h]=PX_SIZE[a];return `<img src="assets/animals/${PX_KEYS[a]}.png" width="${w*scale}" height="${h*scale}" alt="${esc(L(AN[a]))}">`}
const PX_BAN=[['saju','☯','#e3f2c6'],['today','☀️','#fdf0c4'],['year','🎍','#fde4ec'],['match','💞','#d9ecfb']];

function pxRender(){
  const info=pxInfo(),el=info?info.el:(Number.isInteger(px.skin)?px.skin:0),sk=PX_SKIN[el],root=$('px');
  root.style.setProperty('--sk-a',sk.a);root.style.setProperty('--sk-b',sk.b);root.style.setProperty('--scr',sk.scr);root.style.setProperty('--ac',sk.ac);
  $('tamaOrn').innerHTML=sk.orn;
  $('scrFx').innerHTML=[12,30,48,66,84,22].map((x,i)=>`<span class="fx fx-${sk.fx}" style="left:${x}%;top:${sk.fx==='leaf'?4:sk.fx==='spark'?14+i*11:sk.fx==='sand'?60+i%3*8:78}%;animation-delay:-${(i*.9).toFixed(1)}s"></span>`).join('');
  $('pxTitle').textContent=info?fmt(T('px_title_in'),{n:info.name}):T('px_title_out');
  $('pxEgg').hidden=!!info;$('petWalk').hidden=!info;
  if(info){
    const a=info.animal,[w,h]=PX_SIZE[a],sh=$('tamaScreen').clientHeight||130;
    const sc=Math.max(2,Math.min(4,Math.floor(sh*.66/h)));
    for(const [id,f] of [['petA',''],['petB','-blink']]){const im=$(id);im.src=`assets/animals/${PX_KEYS[a]}${f}.png`;im.width=w*sc;im.height=h*sc}
    $('petA').alt=pxLabel(el,a);
    if(!pxSayT)$('pxSay').hidden=true;
  }else{$('pxSay').textContent=T('px_egg_say');$('pxSay').hidden=false}
  $('pxPlate').innerHTML=`<span class="px-chip">${sk.ch[lang]}</span>`+(info
    ?`<span class="who">${esc(info.name)} · ${esc(pxLabel(el,info.animal))} · ${info.yang?T('px_yang'):T('px_yin')}</span><small>${esc(fmt(T(el===info.lack?'px_plate_sub':'px_skin_preview'),{el:EL[el===info.lack?info.lack:el][lang==='ko'?'ko':'en']}))}</small>`
    :'')+`<small>${T('px_skin_hint')}</small>`;
  $('pxForm').hidden=!!info&&!pxEditing;$('pxMe').hidden=!info||pxEditing;
  if(info)$('pxMe').innerHTML=`<div><b>${esc(info.name)}</b>${esc(fmt(T('px_born'),{d:px.me.date,t:px.me.time||T('px_notime_s')}))}</div><button type="button" class="px-ghost" id="pxEdit">${T('px_edit')}</button>`;
  const pe=$('pxEdit');if(pe)pe.onclick=()=>{pxEditing=true;$('pxDate').value=px.me.date;$('pxTime').value=px.me.time||'';$('pxNoTime').checked=!px.me.time;$('pxTime').disabled=!px.me.time;$('pxName').value=px.me.name||'';pxRender();$('pxDate').focus()};
  const y=pxYear(),bt=T('px_banners');
  $('pxBanners').innerHTML=PX_BAN.map(([k,ic,c],i)=>`<button type="button" class="px-ban" style="--bc:${c}" data-k="${k}"><i aria-hidden="true">${ic}</i><b>${bt[i][1]}</b><span>${esc(fmt(bt[i][2],{y,g:pxGanji(y)}))}</span></button>`).join('');
  $('pxBanners').querySelectorAll('.px-ban').forEach(b=>b.onclick=()=>pxOpen(b.dataset.k));
  pxRoute();
}
function pxSay(text,ms){const s=$('pxSay');s.textContent=text;s.hidden=false;clearTimeout(pxSayT);pxSayT=setTimeout(()=>{pxSayT=null;if(pxInfo())s.hidden=true},ms||2600)}
function pxPoke(){const j=$('petJump');j.classList.remove('poke');void j.offsetWidth;j.classList.add('poke')}
function pxOpen(k){
  if(!pxInfo()){toast(T('px_need'));$('pxForm').scrollIntoView({behavior:'smooth',block:'center'});$('pxDate').focus({preventScroll:true});return}
  location.hash=k;
}
function pxRoute(){   // #saju / #today / #year / #match open a banner screen; no hash = home
  const k=location.hash.slice(1),i=PX_BAN.findIndex(b=>b[0]===k),info=pxInfo(),open=i>=0&&!!info;
  $('pxHome').hidden=open;$('pxView').hidden=!open;
  if(!open)return;
  const bt=T('px_banners')[i];
  $('pxViewTitle').textContent=`${PX_BAN[i][1]} ${bt[1]}`;
  $('pxViewPet').innerHTML=pxSprite(info.animal,3);
  $('pxViewSay').textContent=T('px_soon');
  scrollTo(0,0);
}
addEventListener('hashchange',pxRoute);
$('pxBack').onclick=()=>{if(history.length>1&&location.hash)history.back();else location.hash=''};
$('tbPrev').onclick=()=>pxSkin(-1);$('tbNext').onclick=()=>pxSkin(1);
$('tbPrev').setAttribute('aria-label','◀');$('tbNext').setAttribute('aria-label','▶');$('tbOk').setAttribute('aria-label','●');
function pxSkin(d){
  const info=pxInfo(),cur=info?info.el:(Number.isInteger(px.skin)?px.skin:0),next=(cur+d+5)%5;
  px.skin=info&&next===info.lack?null:next;pxSave();pxRender();
  if(info)pxPoke();
}
$('tbOk').onclick=()=>{
  const info=pxInfo();
  if(!info){$('pxEgg').style.animationDuration='.5s';setTimeout(()=>$('pxEgg').style.animationDuration='',1200);$('pxForm').scrollIntoView({behavior:'smooth',block:'center'});return}
  const l=T('px_pokes');pxSay(l[hash(String(Date.now()))%l.length]);pxPoke();
};
$('pxNoTime').onchange=()=>{$('pxTime').disabled=$('pxNoTime').checked;if($('pxNoTime').checked)$('pxTime').value=''};
$('pxTime').oninput=()=>{if($('pxTime').value)$('pxNoTime').checked=false};
$('pxForm').onsubmit=e=>{
  e.preventDefault();
  const date=$('pxDate').value;if(!validDate(date))return toast(T('px_bad'));
  const changed=!px.me||px.me.date!==date;
  px.me={date,time:$('pxNoTime').checked?'':$('pxTime').value,name:$('pxName').value.trim().slice(0,12)};
  if(changed)px.skin=null;            // a new birth date starts from its own (weakest) element
  pxEditing=false;pxSave();pxRender();
  $('tama').scrollIntoView({behavior:'smooth',block:'center'});
  const nm=pxInfo().name,c=nm.charCodeAt(nm.length-1),batchim=c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28>0;   // 용이야 vs 토끼야
  pxSay(fmt(T('px_hello'),{n:nm,ya:batchim?'이야':'야'}),3200);pxPoke();
};
$('pxDate').max=today();
let pxRT;addEventListener('resize',()=>{clearTimeout(pxRT);pxRT=setTimeout(pxRender,150)});

/* ================= INIT ================= */
for(const id of['birthday','partnerDate'])$(id).max=today();
applyLang();
if(!storageOK)toast(T('saved_fail'));
document.addEventListener('visibilitychange',()=>{if(!document.hidden){for(const id of['birthday','partnerDate'])$(id).max=today();render()}});
