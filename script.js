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

// Short synthesized paper-click on the portal icons; no audio assets needed.
let blipCtx=null;
const clickBlip=()=>{
  try{
    blipCtx=blipCtx||new (window.AudioContext||window.webkitAudioContext)();
    const t=blipCtx.currentTime,o=blipCtx.createOscillator(),g=blipCtx.createGain();
    o.type='triangle';o.frequency.setValueAtTime(1800,t);o.frequency.exponentialRampToValueAtTime(520,t+.05);
    g.gain.setValueAtTime(.15,t);g.gain.exponentialRampToValueAtTime(.0001,t+.09);
    o.connect(g);g.connect(blipCtx.destination);o.start(t);o.stop(t+.1);
  }catch(err){}
};
document.querySelectorAll('.portal').forEach(el=>el.addEventListener('pointerdown',clickBlip));
