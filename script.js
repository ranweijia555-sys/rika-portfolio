// Site behaviour: custom cursor, scroll reveals, the phone feed, the portrait
// eye-follow and blossom drag, and the hero's four floating portal icons.
//
// The hero portals are label-free icons that drift inside a safe zone clear of
// the title and portraits, pause under the cursor, sound a click and lead to
// the trails section, and converge toward the frame's bottom as you scroll on.

const root=document.documentElement;
const cursor=document.querySelector('.pixel-cursor');
const fine=matchMedia('(pointer:fine)').matches;
if(fine){root.classList.add('custom-cursor');let x=-50,y=-50,tx=-50,ty=-50;addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY});const tick=()=>{x+=(tx-x)*.34;y+=(ty-y)*.34;cursor.style.transform=`translate3d(${x}px,${y}px,0)`;requestAnimationFrame(tick)};tick();document.querySelectorAll('a,button,.interactive,.file-card,.tool-grid span').forEach(el=>{el.addEventListener('pointerenter',()=>cursor.classList.add('active'));el.addEventListener('pointerleave',()=>cursor.classList.remove('active'))})}
const io=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('visible',e.isIntersecting)),{threshold:.14});document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
const phone=document.querySelector('.phone-scroll');if(phone){phone.addEventListener('wheel',e=>{const max=phone.scrollHeight-phone.clientHeight;const next=phone.scrollTop+e.deltaY;if((e.deltaY>0&&phone.scrollTop<max)||(e.deltaY<0&&phone.scrollTop>0)){e.preventDefault();phone.scrollTop=next}},{passive:false})}

const motionOK=!matchMedia('(prefers-reduced-motion:reduce)').matches;
const deskLayout=matchMedia('(min-width:901px)').matches;

// Pupils cut onto the right portrait follow the cursor.
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

// synthesized mouse-click tick
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

// Drag the blossom layer behind the left portrait; the person stays still.
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

// ---- floating portal icons -------------------------------------------------
const hero=document.querySelector('.hero');
const portals=[...document.querySelectorAll('.hero .portal')];
if(hero&&portals.length){
  const SAFE={x0:.31,x1:.73,y0:.36,y1:.88}; // clear of title, portraits, note
  const state=portals.map((el,i)=>({
    el,
    href:el.getAttribute('href'),
    x:0,y:0,
    ang:Math.random()*Math.PI*2,
    speed:40+Math.random()*22,
    rot:Math.random()*360,
    rotV:(Math.random()<.5?-1:1)*(9+Math.random()*11),
    pause:0,           // eased 0..1, 1 = fully stopped under cursor
    hovered:false
  }));
  let heroW=0,heroH=0,pw=210,ph=200;
  const placeInitial=()=>{
    const hb=hero.getBoundingClientRect();
    heroW=hb.width;heroH=hb.height;
    const rx0=SAFE.x0*heroW,rx1=SAFE.x1*heroW-pw,ry0=SAFE.y0*heroH,ry1=SAFE.y1*heroH-ph;
    const spots=[[.15,.1],[.85,.15],[.2,.85],[.8,.8]];
    state.forEach((s,i)=>{
      s.x=rx0+(rx1-rx0)*spots[i][0]+(Math.random()-.5)*30;
      s.y=ry0+(ry1-ry0)*spots[i][1]+(Math.random()-.5)*30;
    });
  };
  placeInitial();
  addEventListener('resize',placeInitial);

  let mx=-1e4,my=-1e4;
  addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY});

  // click-through: portals have pointer-events:none, so hit-test manually
  addEventListener('pointerdown',e=>{
    if(!wideNow())return;
    const hb=hero.getBoundingClientRect();
    const px=e.clientX-hb.left,py=e.clientY-hb.top;
    for(const s of state){
      if(px>=s.x&&px<=s.x+pw&&py>=s.y&&py<=s.y+ph){
        clickBlip();
        // icons act as one shared doorway: always land on the trails page
        setTimeout(()=>{location.hash='#trails';},60);
        break;
      }
    }
  });

  let last=performance.now(),scrollE=0,queued=false;
  const readScroll=()=>{
    queued=false;
    const hb=hero.getBoundingClientRect();
    const p=Math.min(1,Math.max(0,-hb.top/(hb.height*.6)));
    scrollE=p*p*(3-2*p);
  };
  addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(readScroll)}},{passive:true});

  const wideNow=()=>matchMedia('(min-width:901px)').matches;
  const step=now=>{
    // Width is checked every frame, not once at load: the CSS only hands the
    // portals over to absolute positioning while .js-portals is set, so a
    // window resized across the breakpoint can never strand them in a corner.
    if(!wideNow()){
      if(hero.classList.contains('js-portals')){
        hero.classList.remove('js-portals');
        state.forEach(s=>{s.el.style.transform='';s.el.style.opacity=''});
      }
      last=now;requestAnimationFrame(step);return;
    }
    if(!hero.classList.contains('js-portals')){hero.classList.add('js-portals');placeInitial()}
    const dt=Math.min(.05,(now-last)/1000);last=now;
    const hb=hero.getBoundingClientRect();
    heroW=hb.width;heroH=hb.height;
    const rx0=SAFE.x0*heroW,rx1=SAFE.x1*heroW-pw,ry0=SAFE.y0*heroH,ry1=SAFE.y1*heroH-ph;
    state.forEach(s=>{
      // hover detection in page coords
      const sx=hb.left+s.x,sy=hb.top+s.y;
      s.hovered=mx>=sx&&mx<=sx+pw&&my>=sy&&my<=sy+ph;
      s.pause+=((s.hovered?1:0)-s.pause)*Math.min(1,dt*7);
      if(motionOK){
        s.ang+=(Math.random()-.5)*1.5*dt;
        // gentle separation so icons do not stack
        state.forEach(o=>{
          if(o===s)return;
          const dx=(s.x-o.x),dy=(s.y-o.y),d=Math.hypot(dx,dy);
          if(d>1&&d<240){s.x+=dx/d*22*dt;s.y+=dy/d*22*dt}
        });
        const v=s.speed*(1-s.pause);
        s.x+=Math.cos(s.ang)*v*dt;
        s.y+=Math.sin(s.ang)*v*dt;
        if(s.x<rx0){s.x=rx0;s.ang=Math.PI-s.ang}
        if(s.x>rx1){s.x=rx1;s.ang=Math.PI-s.ang}
        if(s.y<ry0){s.y=ry0;s.ang=-s.ang}
        if(s.y>ry1){s.y=ry1;s.ang=-s.ang}
        s.rot+=s.rotV*(1-s.pause)*dt;
      }
      // converge toward bottom centre while scrolling away
      const tx=heroW/2-pw/2,ty=heroH*.94-ph/2;
      const e=scrollE;
      const fx=s.x+(tx-s.x)*e,fy=s.y+(ty-s.y)*e;
      const sc=(1-.4*e)*(1+.05*s.pause);
      s.el.style.transform=`translate3d(${fx}px,${fy}px,0) rotate(${s.rot}deg) scale(${sc})`;
      s.el.style.opacity=String(1-.65*e);
    });
    // cursor feedback while over an icon
    if(cursor)cursor.classList.toggle('active',state.some(s=>s.hovered));
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
