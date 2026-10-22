// Original procedural voxel comparison. Real 3D meshes, orthographic camera,
// articulated parts and lighting; no image-generation service is called.
import * as THREE from './vendor/three/three.module.js';

const definitions = new Map();
const cube = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshLambertMaterial();
const matrix = new THREE.Matrix4(), color = new THREE.Color();
let renderer, scene, camera, active, tilt = 0, failure;
const actorCache = new Map(), terrainCache = new Map();
function part(parent, x=0,y=0,z=0) {
    const p=new THREE.Group(); p.position.set(x,y,z); p.userData.cells=[]; parent.add(p); return p;
}
function voxel(p,x,y,z,c) { p.userData.cells.push([x,y,z,c]); }
function box(p,x,y,z,w,h,d,c) {
    for(let ix=0;ix<w;ix++) for(let iy=0;iy<h;iy++) for(let iz=0;iz<d;iz++)
        voxel(p,x+ix,y+iy,z+iz,c);
}
function ellipsoid(p,x,y,z,rx,ry,rz,c) {
    for(let ix=-Math.ceil(rx);ix<=rx;ix++) for(let iy=-Math.ceil(ry);iy<=ry;iy++) for(let iz=-Math.ceil(rz);iz<=rz;iz++)
        if(ix*ix/rx**2+iy*iy/ry**2+iz*iz/rz**2<=1) voxel(p,x+ix,y+iy,z+iz,c);
}
function finish(root) {
    root.traverse(p=>{
        const cells=p.userData.cells; if(!cells?.length) return;
        const mesh=new THREE.InstancedMesh(cube,material,cells.length);
        cells.forEach(([x,y,z,c],i)=>{
            matrix.makeTranslation(x,y,z); mesh.setMatrixAt(i,matrix);
            color.set(c);
            const noise=((Math.imul(x+31,73856093)^Math.imul(y+31,19349663)^Math.imul(z+31,83492791))>>>0)%9;
            color.multiplyScalar(.94+noise*.015); mesh.setColorAt(i,color);
        });
        mesh.instanceMatrix.needsUpdate=true; p.add(mesh); delete p.userData.cells;
    });
    return root;
}
function humanoid(id) {
    const root=new THREE.Group();
    const hero=id==='hero', ogre=id==='ogre', goblin=id==='goblin', imp=id==='imp';
    const skin=hero?'#e8b283':ogre?'#b59570':imp?'#c3543d':'#6d9a51';
    const armor=hero?'#406554':ogre?'#715039':imp?'#74392d':'#715b43';
    const width=ogre?4:goblin?2:3, height=ogre?9:goblin?6:8;
    const body=part(root); ellipsoid(body,0,height/2,0,width,3,width,armor);
    const head=part(root,1,height,0); ellipsoid(head,0,0,0,3,2.5,2.5,skin);
    if(hero) {
        ellipsoid(head,-1,1,0,2.8,2,2.5,'#68402b');
        box(head,1,2,-1,2,1,2,'#9c6b38');
        const cape=part(root,-width-1,4,0);box(cape,0,-2,-width,1,5,width*2+1,'#284a3f');
        box(cape,-1,-2,-width,1,2,width*2+1,'#bd9b50');
        root.userData.cape=cape;
    } else if(!ogre) {
        box(head,0,0,-4,2,1,2,skin);box(head,0,0,3,2,1,2,skin);
        box(head,-1,3,-2,1,2,1,imp?'#dec4a0':'#526d3d');
        box(head,-1,3,2,1,2,1,imp?'#dec4a0':'#526d3d');
    }
    // Eyes and nose lie on the forward (+X) side; overhead reveals hair/shoulders.
    box(head,3,0,-2,1,1,1,'#272f2a');box(head,3,0,2,1,1,1,'#272f2a');
    box(head,3,-1,0,2,1,1,skin);
    const legs=[],arms=[];
    for(const sign of [-1,1]) {
        const leg=part(root,0,1,sign*(width-1));box(leg,-1,-1,-1,3,2,2,'#3b4139');box(leg,1,-1,-1,2,1,2,'#513b2d');legs.push(leg);
        const arm=part(root,0,4,sign*(width+1));box(arm,-1,-2,-1,2,4,2,skin);arms.push(arm);
    }
    if(hero) {
        const shield=part(arms[0],0,0,-1);ellipsoid(shield,0,0,0,2,2.5,.7,'#a78a51');voxel(shield,0,0,-1,'#e4cb87');
        box(arms[1],0,-2,1,1,1,5,'#c1d5cf');box(arms[1],-1,-2,1,3,1,1,'#be9e50');
    }
    if(ogre) {box(head,-2,1,-2,2,1,1,'#745639'); box(arms[1],1,-2,0,5,2,2,'#745334');}
    if(imp) {
        const wings=[];for(const sign of [-1,1]) {const wing=part(root,-2,5,sign*3);for(let i=0;i<5;i++)box(wing,-i,0,sign*i,2,1,2,'#6d3940');wings.push(wing);}root.userData.wings=wings;
    }
    root.userData.legs=legs;root.userData.arms=arms;return root;
}
function build(id) {
    if(['hero','goblin','orc','ogre','imp'].includes(id)) return finish(humanoid(id));
    const root=new THREE.Group(),body=part(root);
    if(id==='slime') {
        ellipsoid(body,0,3,0,5,4,5,'#67bdb0');ellipsoid(body,-1,5,-1,3,2,3,'#9ae0c6');
        box(body,5,3,-2,1,2,1,'#243d3c');box(body,5,3,2,1,2,1,'#243d3c');
        root.userData.squash=body;
    } else if(id==='wisp') {
        ellipsoid(body,2,5,0,3,3,3,'#aadfd1');ellipsoid(body,2,6,0,2,2,2,'#def4cb');
        for(let i=0;i<8;i++)ellipsoid(body,-i,3+Math.sin(i)*1.2,Math.cos(i)*1.5,1.3,1.3,1.3,'#65b9ad');root.userData.float=body;
    } else if(id==='wyvern') {
        ellipsoid(body,0,4,0,5,2,2,'#527d4a');ellipsoid(body,5,5,0,2,2,1.5,'#8eaf63');
        for(let i=0;i<7;i++)box(body,-5-i,4,0,1,1,1,'#527d4a');
        box(body,6,5,-1,1,1,1,'#dfbb68');box(body,6,5,1,1,1,1,'#dfbb68');
        const wings=[];for(const sign of [-1,1]) {const wing=part(root,0,4,sign*2);for(let i=0;i<9;i++){box(wing,-Math.floor(i/2),0,sign*i,Math.max(1,6-Math.floor(i/2)),1,1,i%3?'#b78a4c':'#587b46');}wings.push(wing);}root.userData.wings=wings;
    } else if(id==='fruit') {
        ellipsoid(body,0,3,0,4,3,3,'#d8b353');ellipsoid(body,2,4,0,2,2,2,'#efd68a');box(body,-3,5,0,1,3,1,'#6c733a');
        ellipsoid(body,-4,7,0,2,.7,1.6,'#77a75b');root.userData.float=body;
    } else if(id==='raft') {
        for(let z=-5;z<=5;z+=2)box(body,-7,0,z,15,2,2,'#9a6f43');
        box(body,-5,2,-5,1,1,12,'#cdb47a');box(body,4,2,-5,1,1,12,'#cdb47a');
        for(let i=-2;i<=2;i++){voxel(body,i,2,i,'#87cec1');voxel(body,i,2,-i,'#87cec1');}root.userData.float=body;
    }
    return finish(root);
}
function pose(root,id,t) {
    const s=Math.sin(t*Math.PI*2), c=Math.cos(t*Math.PI*2);
    root.userData.legs?.forEach((p,i)=>{p.position.x=(i?-1:1)*s*1.7;});
    root.userData.arms?.forEach((p,i)=>{p.rotation.z=(i?-1:1)*s*.3;});
    if(root.userData.cape)root.userData.cape.rotation.z=s*.09;
    if(root.userData.squash){root.userData.squash.scale.set(1+s*.12,1-s*.18,1+s*.12);root.position.y=Math.max(0,c)*2;}
    if(root.userData.float) {
        root.userData.float.position.y=s*.8;
        root.userData.float.position.z=c*.25;
        root.userData.float.rotation.y=s*(id==='raft'?.025:.12);
    }
    root.userData.wings?.forEach((p,i)=>{p.rotation.x=(i?-1:1)*s*.5;});
}
function init() {
    try {
        renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,preserveDrawingBuffer:true});
        renderer.setSize(256,256);renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
        scene=new THREE.Scene();scene.add(new THREE.AmbientLight('#d8e9df',2.2));
        const sun=new THREE.DirectionalLight('#fff4d1',3.2);sun.position.set(-30,70,-40);scene.add(sun);
        camera=new THREE.OrthographicCamera(-32,32,32,-32,.1,300);camera.up.set(0,0,-1);
        for(const id of ['hero','goblin','slime','orc','ogre','wisp','imp','wyvern','fruit','raft']) {
            const root=build(id);scene.add(root);
            const bounds=new THREE.Box3().setFromObject(root), size=bounds.getSize(new THREE.Vector3());
            // Constant calibration from the actual model's unanimated top-down bounds.
            definitions.set(id,{root,referenceExtent:Math.max(size.x,size.z)*4});root.visible=false;
        }
    } catch(error) {failure=String(error.message); console.warn('Voxel WebGL unavailable',error);}
}
init();
export const voxelAvailable=()=>!!renderer&&!failure;
export const voxelFailure=()=>failure;
export function setVoxelTilt(degrees) {tilt=degrees;actorCache.clear();}
export function drawVoxelActor(ctx,id,x,y,extent,frame,zoom,rotation) {
    if(!voxelAvailable()) return;
    const model=definitions.get(id);if(!model)return;
    const key=`${id}:${frame}:${rotation}:${tilt}`;
    let image=actorCache.get(key);
    if(!image) {
        if(actorCache.size>90)actorCache.clear();
        if(active)active.visible=false;active=model.root;active.visible=true;
        active.rotation.y=-rotation*Math.PI/180;pose(active,id,frame/8);
        const rad=tilt*Math.PI/180;camera.position.set(0,3+100*Math.cos(rad),100*Math.sin(rad));camera.lookAt(0,3,0);
        renderer.setSize(256,256,false);renderer.render(scene,camera);
        image=document.createElement('canvas');image.width=image.height=256;image.getContext('2d').drawImage(renderer.domElement,0,0);
        actorCache.set(key,image);
    }
    const factor=extent/model.referenceExtent*zoom;
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(image,x-128*factor,y-128*factor,256*factor,256*factor);ctx.restore();
}
function terrain(biome) {
    const root=new THREE.Group(),ground=part(root);
    const palette={grass:['#749357','#a4b76b','#446347'],snow:['#dae7de','#f7f3df','#88a5a4'],desert:['#ceaa68','#e3c786','#ad854b'],swamp:['#556f56','#7b8e61','#344d45']}[biome];
    // Chunky original terrain made from actual voxel geometry, viewed overhead.
    for(let x=-32;x<32;x++) for(let z=-20;z<20;z++) {
        const path=Math.abs(z-7*Math.sin(x/18))<3;
        voxel(ground,x,-1,z,path?palette[1]:palette[0]);
    }
    for(let i=0;i<28;i++) {
        const x=((i*19+7)%60)-30,z=((i*13+5)%36)-18;
        if(Math.abs(z-7*Math.sin(x/18))<6)continue;
        const p=part(root,x,0,z);
        if(biome==='desert') {
            if(i%3) {box(p,0,0,0,1,4,1,'#7d8953');box(p,-1,2,0,3,1,1,'#7d8953');}
            else ellipsoid(p,0,1,0,2,1,1.5,palette[2]);
        } else if(i%3===0)ellipsoid(p,0,1,0,2,1.5,2,palette[2]);
        else {
            box(p,0,0,0,1,3,1,'#71563c');
            ellipsoid(p,0,4,0,2.5,3,2.5,biome==='snow'?'#b4ccbc':palette[2]);
            ellipsoid(p,-.5,6,-.5,1.5,1.5,1.5,biome==='snow'?'#f5f4e7':palette[0]);
        }
    }
    finish(root);return root;
}
export function voxelTerrain(biome) {
    if(!voxelAvailable())return;
    if(terrainCache.has(biome))return terrainCache.get(biome);
    if(active)active.visible=false;
    const ground=terrain(biome);scene.add(ground);
    const cam=new THREE.OrthographicCamera(-32,32,20,-20,.1,300);cam.up.set(0,0,-1);cam.position.set(0,100,0);cam.lookAt(0,0,0);
    renderer.setSize(512,320,false);renderer.render(scene,cam);
    const image=document.createElement('canvas');image.width=512;image.height=320;image.getContext('2d').drawImage(renderer.domElement,0,0);
    terrainCache.set(biome,image);scene.remove(ground);
    ground.traverse(p=>{if(p.isInstancedMesh)p.dispose();});
    return image;
}
