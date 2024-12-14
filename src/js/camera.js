// import { func1Name, func2Name } from './utils/colorCalculations.js';

let confrontoColor = "#ff0000";
let stream = null;
let capturedDataURL = null;

const confrontoOther = document.getElementById('confrontoColorOther');
const averageMethodSelect = document.getElementById('averageMethod');
const distanceMethodSelect = document.getElementById('distanceMethod');
const photoPreview = document.getElementById('photoPreview');
const results = document.getElementById('results');
const openCameraModalBtn = document.getElementById('openCameraModalBtn');
const cameraModal = document.getElementById('cameraModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const captureBtn = document.getElementById('captureBtn');
const video = document.getElementById('video');
const fileInput = document.getElementById('fileInput');
const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');

confrontoOther.addEventListener('input', function(e) {
    confrontoColor = e.target.value;
    updateResults();
});

averageMethodSelect.addEventListener('change', updateResults);
distanceMethodSelect.addEventListener('change', updateResults);

uploadPhotoBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
    photoPreview.src = event.target.result;
    photoPreview.onload = updateResults;
    }
    reader.readAsDataURL(file);
});

openCameraModalBtn.addEventListener('click', async () => {
    cameraModal.style.display = 'flex';
    if(!stream) {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, 
        audio:false
        });
        video.srcObject = stream;
        video.muted = true;
        await video.play();
    } catch (err) {
        console.error("Errore nell'accedere alla webcam:", err);
    }
    }
});

closeModalBtn.addEventListener('click', closeModal);

captureBtn.addEventListener('click', () => {
    if(!video.srcObject) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const dataURL = canvas.toDataURL('image/png');
    photoPreview.src = dataURL;
    photoPreview.onload = updateResults;
    closeModal();
});

function closeModal() {
    cameraModal.style.display = 'none';
}

function getImageDataFromElement(imgElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = imgElement.naturalWidth || imgElement.width;
    canvas.height = imgElement.naturalHeight || imgElement.height;
    ctx.drawImage(imgElement, 0, 0);
    const imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
    const totalPixels = imageData.data.length/4;
    return {imageData, totalPixels};
}

function hexToRgb(hex) {
    const stripped=hex.replace('#','');
    const bigint=parseInt(stripped,16);
    const r=(bigint>>16)&255;
    const g=(bigint>>8)&255;
    const b=bigint&255;
    return {r,g,b};
}

function calculateAverageColor(imgElement, method) {
    const {imageData, totalPixels} = getImageDataFromElement(imgElement);
    const data = imageData.data;
    
    if(method === 'rgb') {
    return averageRGB(data, totalPixels);
    } else if(method === 'hex') {
    return averageHex(data, totalPixels);
    } else if(method === 'lum') {
    return averageLuminanceWeighted(data, totalPixels);
    } else if(method === 'hsv') {
    return averageHSV(data, totalPixels);
    } else {
    return averageRGB(data, totalPixels); 
    }
}

function calculateColorDistance(c1, c2, method) {
    if(method === 'euclidean') {
    return colorDistanceEuclidean(c1,c2);
    } else if(method === 'lab') {
    return colorDistanceLab(c1,c2);
    } else if(method === 'avgchannels') {
    return colorDistanceAvgChannels(c1,c2);
    } else if(method === 'hue') {
    return colorDistanceHue(c1,c2);
    } else {
    return colorDistanceEuclidean(c1,c2); 
    }
}

// Metodi di calcolo media
function averageRGB(data, totalPixels) {
    let rSum=0,gSum=0,bSum=0,count=0;
    for(let i=0;i<data.length;i+=4){
    rSum+=data[i]; gSum+=data[i+1]; bSum+=data[i+2]; count++;
    }
    if(count===0) return null;
    return {r:Math.round(rSum/count),g:Math.round(gSum/count),b:Math.round(bSum/count)};
}

function averageHex(data, totalPixels) {
    let sum=0,count=0;
    for(let i=0;i<data.length;i+=4){
    const val=(data[i]<<16)+(data[i+1]<<8)+data[i+2];
    sum+=val;count++;
    }
    if(count===0)return null;
    const avgVal=Math.round(sum/count);
    return {r:(avgVal>>16)&255,g:(avgVal>>8)&255,b:avgVal&255};
}

function averageLuminanceWeighted(data, totalPixels){
    let rSum=0,gSum=0,bSum=0,wSum=0;
    for(let i=0;i<data.length;i+=4){
    const R=data[i],G=data[i+1],B=data[i+2];
    const L=0.299*R+0.587*G+0.114*B;
    rSum+=R*L;gSum+=G*L;bSum+=B*L;wSum+=L;
    }
    if(wSum===0)return null;
    return {r:Math.round(rSum/wSum),g:Math.round(gSum/wSum),b:Math.round(bSum/wSum)};
}

function averageHSV(data, totalPixels){
    let hSum=0,sSum=0,vSum=0,count=0;
    for(let i=0;i<data.length;i+=4){
    const R=data[i],G=data[i+1],B=data[i+2];
    const {h,s,v}=rgbToHsv(R,G,B);
    hSum+=h;sSum+=s;vSum+=v;count++;
    }
    if(count===0)return null;
    const hAvg=hSum/count,sAvg=sSum/count,vAvg=vSum/count;
    return hsvToRgb(hAvg,sAvg,vAvg);
}

// Distanze
function colorDistanceEuclidean(c1,c2){
    return Math.sqrt((c1.r-c2.r)**2+(c1.g-c2.g)**2+(c1.b-c2.b)**2);
}

function colorDistanceAvgChannels(c1,c2){
    return (Math.abs(c1.r-c2.r)+Math.abs(c1.g-c2.g)+Math.abs(c1.b-c2.b))/3;
}

function colorDistanceHue(c1,c2){
    const hsv1=rgbToHsv(c1.r,c1.g,c1.b);
    const hsv2=rgbToHsv(c2.r,c2.g,c2.b);
    const dh=Math.abs(hsv1.h-hsv2.h);
    return Math.min(dh,360-dh);
}

function colorDistanceLab(c1,c2){
    const lab1=rgbToLab(c1.r,c1.g,c1.b);
    const lab2=rgbToLab(c2.r,c2.g,c2.b);
    return Math.sqrt((lab1.L-lab2.L)**2+(lab1.a-lab2.a)**2+(lab1.b-lab2.b)**2);
}

// Conversioni
function rgbToHsv(r,g,b){
    r/=255;g/=255;b/=255;
    const max=Math.max(r,g,b),min=Math.min(r,g,b);
    let h,s,v=max;const d=max-min;
    s=max===0?0:d/max;
    if(max===min){
    h=0;
    } else {
    switch(max){
        case r:h=(g-b)/d+(g<b?6:0);break;
        case g:h=(b-r)/d+2;break;
        case b:h=(r-g)/d+4;break;
    }
    h*=60;
    }
    return {h:h,s:s,v:v};
}

function hsvToRgb(h,s,v){
    let r,g,b;
    const c=v*s;
    const x=c*(1-Math.abs((h/60)%2-1));
    const m=v-c;
    let r_,g_,b_;
    if(h<60){r_=c;g_=x;b_=0;}
    else if(h<120){r_=x;g_=c;b_=0;}
    else if(h<180){r_=0;g_=c;b_=x;}
    else if(h<240){r_=0;g_=x;b_=c;}
    else if(h<300){r_=x;g_=0;b_=c;}
    else {r_=c;g_=0;b_=x;}
    r=(r_+m)*255;g=(g_+m)*255;b=(b_+m)*255;
    return {r:Math.round(r),g:Math.round(g),b:Math.round(b)};
}

function rgbToLab(R,G,B){
    let r=R/255;let g=G/255;let b=B/255;
    r=(r>0.04045)?Math.pow((r+0.055)/1.055,2.4):r/12.92;
    g=(g>0.04045)?Math.pow((g+0.055)/1.055,2.4):g/12.92;
    b=(b>0.04045)?Math.pow((b+0.055)/1.055,2.4):b/12.92;

    const X=r*0.4124+g*0.3576+b*0.1805;
    const Y=r*0.2126+g*0.7152+b*0.0722;
    const Z=r*0.0193+g*0.1192+b*0.9505;

    let x=X/0.95047;
    let y=Y/1.00000;
    let z=Z/1.08883;

    x=(x>0.008856)?Math.pow(x,1/3):(7.787*x)+(16/116);
    y=(y>0.008856)?Math.pow(y,1/3):(7.787*y)+(16/116);
    z=(z>0.008856)?Math.pow(z,1/3):(7.787*z)+(16/116);

    const L=(116*y)-16;
    const a=500*(x-y);
    const b2=200*(y-z);
    return {L,a,b:b2};
}

function hexToRgbString(hex) {
    const rgb = hexToRgb(hex);
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

function rgbToHexString(rgb) {
    return `#${((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1).toUpperCase()}`;
}

function calculateColorDistancePercentage(distance) {
    const maxDistance = Math.sqrt(3 * Math.pow(255, 2));
    return ((distance / maxDistance) * 100).toFixed(2);
}

function updateResults() {
    if (!photoPreview.src) return;
    const avgColor = calculateAverageColor(photoPreview, averageMethodSelect.value);
    if (!avgColor) {
    results.innerHTML = "<p>Nessuna immagine disponibile per il calcolo.</p>";
    return;
    }
    const selectedColor = hexToRgb(confrontoColor);
    const dist = calculateColorDistance(selectedColor, avgColor, distanceMethodSelect.value);
    const distPercentage = calculateColorDistancePercentage(dist);

    results.innerHTML = `
    <p><strong>Colore di Confronto:</strong> <span style="display:inline-block;width:20px;height:20px;background:${confrontoColor};"></span> ${confrontoColor} - ${hexToRgbString(confrontoColor)})</p>
    <p><strong>Colore Medio (${averageMethodSelect.value}):</strong> 
        <span style="display:inline-block;width:20px;height:20px;background:rgb(${avgColor.r},${avgColor.g},${avgColor.b});"></span> 
        ${rgbToHexString(avgColor)} - rgb(${avgColor.r}, ${avgColor.g}, ${avgColor.b})
    </p>
    <p><strong>Distanza (${distanceMethodSelect.value}):</strong> ${dist.toFixed(2)} (${distPercentage}%)</p>
    `;
}


// Imposta valore di default
confrontoOther.value = "#ff0000";
updateResults();
