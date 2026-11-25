import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

const $ = id => document.getElementById(id);
const host = $("gameCanvas");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bd0e4);
scene.fog = new THREE.Fog(0x9bd0e4, 38, 85);
const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 150);
camera.position.set(0, 27, 34);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
host.innerHTML = "";
host.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff, 0x356047, 2.0));
const sun = new THREE.DirectionalLight(0xffffff, 2.3);
sun.position.set(-12, 25, 12); sun.castShadow = true; sun.shadow.mapSize.set(2048,2048); scene.add(sun);

const pitch = new THREE.Group(); scene.add(pitch);
const grassMat = new THREE.MeshStandardMaterial({color:0x238348, roughness:1});
const grass = new THREE.Mesh(new THREE.PlaneGeometry(60,38), grassMat);
grass.rotation.x=-Math.PI/2; grass.receiveShadow=true; pitch.add(grass);
for(let i=0;i<10;i++){const stripe=new THREE.Mesh(new THREE.PlaneGeometry(6,38),new THREE.MeshStandardMaterial({color:i%2?0x238348:0x2c9653}));stripe.rotation.x=-Math.PI/2;stripe.position.set(-27+i*6,.012,0);pitch.add(stripe);}
function line(x1,z1,x2,z2,color=0xffffff,r=.045){const len=Math.hypot(x2-x1,z2-z1);const m=new THREE.Mesh(new THREE.BoxGeometry(len,.035,r),new THREE.MeshBasicMaterial({color}));m.position.set((x1+x2)/2,.04,(z1+z2)/2);m.rotation.y=-Math.atan2(z2-z1,x2-x1);pitch.add(m);}
line(-29,-18,29,-18);line(-29,18,29,18);line(-29,-18,-29,18);line(29,-18,29,18);line(0,-18,0,18);
const circle=new THREE.Mesh(new THREE.RingGeometry(5.9,6,.08,96),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}));circle.rotation.x=-Math.PI/2;circle.position.y=.05;pitch.add(circle);
function box(w,h,d,x,y,z,color){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.8}));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
function goal(x,dir){const c=0xffffff;box(.18,2.4,7,x,1.2,0,c);box(.18,2.4,7,x,1.2,0,c).material.transparent=true;box(.18,2.4,.18,x,1.2,-3.5,c);box(.18,2.4,.18,x,1.2,3.5,c);box(.18,.18,7,x,2.4,0,c);for(let z=-3.2;z<=3.2;z+=.8)lineGoal(x,z,2.25);function lineGoal(gx,gz,gy){const net=new THREE.Mesh(new THREE.BoxGeometry(.05,gy,.035),new THREE.MeshBasicMaterial({color:0xd9e5e8}));net.position.set(gx+dir*.45,gy/2,gz);scene.add(net);}}
goal(-30,-1);goal(30,1);
const standMat=new THREE.MeshStandardMaterial({color:0x344b60});
for(let side of [-1,1]){box(60,2,5,0,1,side*22,0x28445a);for(let row=0;row<2;row++)for(let i=0;i<25;i++){const fan= new THREE.Mesh(new THREE.BoxGeometry(.45,.5,.45),new THREE.MeshStandardMaterial({color:[0xf3c74f,0xe9f0f4,0x45b98c,0x4288bd][(i+row*3)%4]}));fan.position.set(-27+i*2.2,2.3+row*.55,side*(20+row*1.3));scene.add(fan);}}
const ballGeo=new THREE.SphereGeometry(.48,24,16);
const ballMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.45});
const ball=new THREE.Mesh(ballGeo,ballMat);ball.castShadow=true;scene.add(ball);
const ballVelocity=new THREE.Vector3();
const playerMeshes=[];
function makePlayer(team,index,x,z){const group=new THREE.Group();const color=team==="home"?0x13b982:0xf0f4ff;const body=new THREE.Mesh(new THREE.CapsuleGeometry(.48,.9,4,8),new THREE.MeshStandardMaterial({color,roughness:.65}));body.position.y=1.05;body.castShadow=true;group.add(body);const head=new THREE.Mesh(new THREE.SphereGeometry(.28,16,12),new THREE.MeshStandardMaterial({color:0xd5a47c}));head.position.y=1.9;group.add(head);const shorts=new THREE.Mesh(new THREE.BoxGeometry(.72,.3,.5),new THREE.MeshStandardMaterial({color:team==="home"?0x102b55:0x303c4b}));shorts.position.y=.47;group.add(shorts);group.position.set(x,0,z);scene.add(group);const p={team,index,mesh:group,velocity:new THREE.Vector3(),speed:team==="home"?8:5.1};playerMeshes.push(p);return p;}
let home=[],away=[],controlled=0;
function resetPlayers(){for(const p of playerMeshes)scene.remove(p.mesh);playerMeshes.length=0;home=[makePlayer("home",0,-13,0),makePlayer("home",1,-20,-9),makePlayer("home",2,-19,0),makePlayer("home",3,-20,9),makePlayer("home",4,-25,0)];away=[makePlayer("away",0,13,0),makePlayer("away",1,20,-9),makePlayer("away",2,19,0),makePlayer("away",3,20,9),makePlayer("away",4,25,0)];controlled=0;}
resetPlayers();
let running=false,paused=false,finished=false,homeScore=0,awayScore=0,remaining=120,lastTime=0,saveBusy=false;
const keys={};
function updateScore(){$("homeScore").textContent=homeScore;$("awayScore").textContent=awayScore;}
function clock(){const m=Math.floor(remaining/60),s=remaining%60;$("clock").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;}
function resetBall(){ball.position.set(0,.5,0);ballVelocity.set(0,0,0);resetPlayers();}
function kick(){if(!running||paused)return;const p=home[controlled];if(p.mesh.position.distanceTo(ball.position)<3.3){const aim=new THREE.Vector3(30-ball.position.x,0,-ball.position.z*.45).normalize();ballVelocity.addScaledVector(aim,17);ballVelocity.y=2.1;}}
function movePlayer(p,dx,dz,dt,maxSpeed){const v=new THREE.Vector3(dx,0,dz);if(v.lengthSq()>1)v.normalize();p.mesh.position.x+=v.x*maxSpeed*dt;p.mesh.position.z+=v.z*maxSpeed*dt;p.mesh.position.x=THREE.MathUtils.clamp(p.mesh.position.x,-27,27);p.mesh.position.z=THREE.MathUtils.clamp(p.mesh.position.z,-16,16);if(v.lengthSq()>.01)p.mesh.rotation.y=Math.atan2(v.x,v.z);}
function updateGame(dt){
 if(!running||paused)return;
 const me=home[controlled];let dx=(keys.d||keys.ArrowRight?1:0)-(keys.a||keys.ArrowLeft?1:0),dz=(keys.s||keys.ArrowDown?1:0)-(keys.w||keys.ArrowUp?1:0);
 movePlayer(me,dx,dz,dt,keys.Shift?11:8);
 home.forEach((p,i)=>{if(i!==controlled){const target=new THREE.Vector3(-13-i*2,0,(i-2)*5);p.mesh.position.lerp(target,.008);}});
 away.forEach((p,i)=>{const target=ball.position.clone().add(new THREE.Vector3(1.6,0,(i-2)*1.7));target.x=THREE.MathUtils.clamp(target.x,2,27);target.z=THREE.MathUtils.clamp(target.z,-15,15);const dir=target.sub(p.mesh.position);if(dir.length()>1)movePlayer(p,dir.x,dir.z,dt,p.speed);});
 // Ball movement, friction, bounce and player contact.
 ballVelocity.y-=19*dt;ball.position.addScaledVector(ballVelocity,dt);
 if(ball.position.y<.48){ball.position.y=.48;ballVelocity.y=Math.abs(ballVelocity.y)*.42;if(Math.abs(ballVelocity.y)<.7)ballVelocity.y=0;}
 ballVelocity.x*=Math.pow(.985,dt*60);ballVelocity.z*=Math.pow(.985,dt*60);
 for(const p of playerMeshes){const pos=p.mesh.position;const dist=Math.hypot(ball.position.x-pos.x,ball.position.z-pos.z);if(dist<1.45&&ball.position.y<2.3){const awayDir=new THREE.Vector3(ball.position.x-pos.x,0,ball.position.z-pos.z).normalize();ballVelocity.x+=awayDir.x*1.2;ballVelocity.z+=awayDir.z*1.2;}}
 if(ball.position.z<-18||ball.position.z>18){ball.position.z=THREE.MathUtils.clamp(ball.position.z,-18,18);ballVelocity.z*=-.65;}
 if(ball.position.x<-30.3||ball.position.x>30.3){if(Math.abs(ball.position.z)<3.5){if(ball.position.x>0)homeScore++;else awayScore++;updateScore();resetBall();}else{ball.position.x=THREE.MathUtils.clamp(ball.position.x,-29.5,29.5);ballVelocity.x*=-.6;}}
 const target=new THREE.Vector3(me.mesh.position.x+1,0,me.mesh.position.z+15);camera.position.lerp(new THREE.Vector3(me.mesh.position.x*.18,27,36),.025);camera.lookAt(target);
 remaining-=dt;if(remaining<=0){remaining=0;clock();endMatch();}else clock();
}
async function endMatch(){if(finished)return;finished=true;running=false;$("status").textContent="Full time! Saving match to the backend…";if(saveBusy)return;saveBusy=true;try{const payload={homeTeam:$("team").value,awayTeam:"CPU UNITED",homeScore,awayScore,duration:$("duration").selectedOptions[0].text};const r=await fetch("/api/matches",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const data=await r.json();if(!r.ok)throw new Error(data.error);$("status").textContent="Full time! Saved successfully to JSON and XML.";await loadHistory();}catch(e){$("status").textContent="Match finished, but save failed: "+e.message;}finally{saveBusy=false;}}
function start(){homeScore=0;awayScore=0;remaining=Number($("duration").value);finished=false;paused=false;running=true;resetBall();updateScore();clock();$("homeName").textContent=$("team").value;$("status").textContent="Kick-off! Get close to the ball and press SPACE to shoot.";}
function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
window.addEventListener("resize",resize);resize();
window.addEventListener("keydown",e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;if([" ","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key))e.preventDefault();keys[k]=true;if(e.code==="Space")kick();if(k==="q")controlled=(controlled+1)%home.length;});
window.addEventListener("keyup",e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;keys[k]=false;});
$("start").addEventListener("click",start);$("pause").addEventListener("click",()=>{if(!running)return;paused=!paused;$("pause").textContent=paused?"RESUME":"PAUSE";$("status").textContent=paused?"Match paused.":"Match resumed.";});
async function loadHistory(){try{const r=await fetch("/api/matches");const rows=await r.json();$("history").innerHTML=rows.length?rows.map(m=>`<div class="history-row"><span>${safe(m.homeTeam)} <strong>${m.homeScore} : ${m.awayScore}</strong> ${safe(m.awayTeam)}</span><small>${new Date(m.playedAt).toLocaleString()}</small></div>`).join(""):"No matches yet. Complete your first match to create a JSON and XML record.";}catch{$("history").textContent="Could not load match history. Check that the backend is running.";}}
function safe(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
$("refresh").addEventListener("click",loadHistory);
$("importXml").addEventListener("click",async()=>{try{const r=await fetch("/api/import/xml",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({xml:$("xmlText").value})});const d=await r.json();if(!r.ok)throw new Error(d.error);$("importStatus").textContent=d.message;loadHistory();}catch(e){$("importStatus").textContent=e.message;}});
function animate(t){requestAnimationFrame(animate);const dt=Math.min((t-lastTime)/1000||0,.04);lastTime=t;updateGame(dt);ball.rotation.x+=ballVelocity.z*dt;ball.rotation.z-=ballVelocity.x*dt;renderer.render(scene,camera);}
requestAnimationFrame(animate);clock();loadHistory();
