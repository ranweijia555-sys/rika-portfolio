const root=document.documentElement;
const cursor=document.querySelector('.pixel-cursor');
const fine=matchMedia('(pointer:fine)').matches;
if(fine){root.classList.add('custom-cursor');let x=-50,y=-50,tx=-50,ty=-50;addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY});const tick=()=>{x+=(tx-x)*.34;y+=(ty-y)*.34;cursor.style.transform=`translate3d(${x}px,${y}px,0)`;requestAnimationFrame(tick)};tick();document.querySelectorAll('a,button,.interactive,.portal,.file-card,.tool-grid span').forEach(el=>{el.addEventListener('pointerenter',()=>cursor.classList.add('active'));el.addEventListener('pointerleave',()=>cursor.classList.remove('active'))})}
const io=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('visible',e.isIntersecting)),{threshold:.14});document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
// On wheel over the phone, keep the gesture inside the phone until its feed reaches an edge.
const phone=document.querySelector('.phone-scroll');if(phone){phone.addEventListener('wheel',e=>{const max=phone.scrollHeight-phone.clientHeight;const next=phone.scrollTop+e.deltaY;if((e.deltaY>0&&phone.scrollTop<max)||(e.deltaY<0&&phone.scrollTop>0)){e.preventDefault();phone.scrollTop=next}},{passive:false})}
