const root=document.documentElement;
const cursor=document.querySelector('.pixel-cursor');
const fine=matchMedia('(pointer:fine)').matches;
if(fine){root.classList.add('custom-cursor');let x=-50,y=-50,tx=-50,ty=-50;addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY});const tick=()=>{x+=(tx-x)*.34;y+=(ty-y)*.34;cursor.style.transform=`translate3d(${x}px,${y}px,0)`;requestAnimationFrame(tick)};tick();document.querySelectorAll('a,button,.interactive,.portal,.file-card,.tool-grid span').forEach(el=>{el.addEventListener('pointerenter',()=>cursor.classList.add('active'));el.addEventListener('pointerleave',()=>cursor.classList.remove('active'))})}
const io=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('visible',e.isIntersecting)),{threshold:.14});document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
// On wheel over the phone, keep the gesture inside the phone until its feed reaches an edge.
const phone=document.querySelector('.phone-scroll');if(phone){phone.addEventListener('wheel',e=>{const max=phone.scrollHeight-phone.clientHeight;const next=phone.scrollTop+e.deltaY;if((e.deltaY>0&&phone.scrollTop<max)||(e.deltaY<0&&phone.scrollTop>0)){e.preventDefault();phone.scrollTop=next}},{passive:false})}

const motionOK=!matchMedia('(prefers-reduced-motion:reduce)').matches;
const deskLayout=matchMedia('(min-width:901px)').matches;

// Pupils cut onto the right portrait follow the cursor; anchored to fixed
// fractions of the artwork, so they survive any resize of the cutout.
const rPortrait=document.querySelector('.right-portrait');
const rImg=rPortrait&&rPortrait.querySelector('img');
if(rImg&&fine&&motionOK&&deskLayout){
  const EYES=[{fx:.345,fy:.342},{fx:.530,fy:.314}];
  const eyeEls=EYES.map(()=>{const e=document.createElement('div');e.className='eye-follow';e.innerHTML='<div class="pupil"></div>';rPortrait.appendChild(e);return e});
  let emx=innerWidth/2,emy=innerHeight/2;
  addEventListener('pointermove',e=>{emx=e.clientX;emy=e.clientY});
  const eyeStep=()=>{
    const b=rPortrait.getBoundingClientRect();
    if(rImg.naturalWidth&&b.width>10){
      // object-fit:contain anchored right/bottom on desktop
      const ar=rImg.naturalWidth/rImg.naturalHeight;
      const w=Math.min(b.width,b.height*ar),h=w/ar,left=b.right-w,top=b.bottom-h;
      const size=w*.075;
      EYES.forEach((eye,i)=>{
        const el=eyeEls[i],cx=left+eye.fx*w,cy=top+eye.fy*h;
        el.style.width=el.style.height=size+'px';
        el.style.left=(cx-b.left-size/2)+'px';el.style.top=(cy-b.top-size/2)+'px';
        const dx=emx-cx,dy=emy-cy,dist=Math.hypot(dx,dy)||1,r=size*.16*Math.min(1,dist/240);
        el.firstChild.style.transform=`translate(calc(-50% + ${dx/dist*r}px),calc(-50% + ${dy/dist*r}px))`;
      });
    }
    requestAnimationFrame(eyeStep);
  };
  if(rImg.complete)eyeStep();else rImg.addEventListener('load',eyeStep,{once:true});
}

// Scrolling away from the hero draws the four portals down toward the frame's
// bottom centre so they hand off into the next section.
if(motionOK&&deskLayout){
  const hero=document.querySelector('.hero');
  const portals=[...document.querySelectorAll('.hero .portal')];
  if(hero&&portals.length){
    let basePts=[],queued=false;
    const measure=()=>{
      portals.forEach(el=>{el.style.transform='';el.style.opacity=''});
      const hb=hero.getBoundingClientRect();
      basePts=portals.map(el=>{const r=el.getBoundingClientRect();return{x:r.left+r.width/2-hb.left,y:r.top+r.height/2-hb.top}});
    };
    const apply=()=>{
      queued=false;
      const hb=hero.getBoundingClientRect();
      const p=Math.min(1,Math.max(0,-hb.top/(hb.height*.75)));
      const e=p*p*(3-2*p);
      portals.forEach((el,i)=>{
        const b=basePts[i];
        const tx=(hb.width/2-b.x)*e*.55,ty=(hb.height-b.y)*e*.4;
        el.style.transform=e>.001?`translate(${tx}px,${ty}px) scale(${1-.35*e})`:'';
        el.style.opacity=e>.001?String(1-.5*e):'';
      });
    };
    const onScroll=()=>{if(!queued){queued=true;requestAnimationFrame(apply)}};
    measure();
    addEventListener('scroll',onScroll,{passive:true});
    addEventListener('resize',()=>{measure();onScroll()});
  }
}

// Drag the blossom layer behind the left portrait: it pivots at its base
// while dragged and springs back with a damped wobble on release.
const floraImg=document.querySelector('.left-portrait img.flora');
const floraWrap=document.querySelector('.left-portrait');
if(floraImg&&floraWrap){
  let rot=0,vel=0,dragging=false,startX=0,baseRot=0,lastX=0,lastT=0,springing=null;
  const apply=()=>{floraImg.style.transform=`rotate(${rot}deg)`};
  const spring=()=>{
    let last=performance.now();
    const stepS=n=>{
      const dt=Math.min(.04,(n-last)/1000);last=n;
      vel+=(-34*rot-6.5*vel)*dt;
      rot+=vel*dt;
      rot=Math.max(-20,Math.min(20,rot));
      apply();
      if(Math.abs(rot)>.02||Math.abs(vel)>.02){springing=requestAnimationFrame(stepS)}
      else{rot=0;vel=0;springing=null;apply()}
    };
    springing=requestAnimationFrame(stepS);
  };
  floraWrap.addEventListener('pointerdown',e=>{
    dragging=true;startX=e.clientX;baseRot=rot;lastX=e.clientX;lastT=performance.now();
    if(springing){cancelAnimationFrame(springing);springing=null}
    e.preventDefault();
  });
  addEventListener('pointermove',e=>{
    if(!dragging)return;
    const raw=baseRot+(e.clientX-startX)*.07;
    rot=Math.max(-14,Math.min(14,raw));
    const now=performance.now(),dtm=(now-lastT)/1000;
    if(dtm>0){vel=((e.clientX-lastX)*.07)/dtm*.4;lastX=e.clientX;lastT=now}
    apply();
  });
  addEventListener('pointerup',()=>{if(dragging){dragging=false;vel=Math.max(-40,Math.min(40,vel));spring()}});
}

// Short synthesized mouse-click tick on the portal icons; no audio assets needed.
let blipCtx=null;
const clickBlip=()=>{
  try{
    blipCtx=blipCtx||new (window.AudioContext||window.webkitAudioContext)();
    const t=blipCtx.currentTime,dur=.03;
    const buf=blipCtx.createBuffer(1,Math.ceil(blipCtx.sampleRate*dur),blipCtx.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);
    const src=blipCtx.createBufferSource();src.buffer=buf;
    const f=blipCtx.createBiquadFilter();f.type='bandpass';f.frequency.value=3400;f.Q.value=1;
    const g=blipCtx.createGain();g.gain.value=.55;
    src.connect(f);f.connect(g);g.connect(blipCtx.destination);src.start(t);
  }catch(err){}
};
document.querySelectorAll('.portal').forEach(el=>el.addEventListener('pointerdown',clickBlip));
