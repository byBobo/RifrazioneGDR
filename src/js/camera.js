// Logica specifica per la pagina camera

let confrontoColor = "#ff0000";
let stream = null;

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

const confrontoColorBox = document.getElementById('confrontoColorBox');
const confrontoColorText = document.getElementById('confrontoColorText');
const averageMethodText = document.getElementById('averageMethodText');
const averageColorBox = document.getElementById('averageColorBox');
const averageColorText = document.getElementById('averageColorText');
const distanceMethodText = document.getElementById('distanceMethodText');
const distanceText = document.getElementById('distanceText');
const noImageText = document.getElementById('noImageText');

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
    };
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

function updateResults() {
    if (!photoPreview.src || !photoPreview.complete) {
        noImageText.style.display = 'block';
        confrontoColorBox.style.backgroundColor = '';
        confrontoColorText.textContent = '';
        averageMethodText.textContent = '';
        averageColorBox.style.backgroundColor = '';
        averageColorText.textContent = '';
        distanceMethodText.textContent = '';
        distanceText.textContent = '';
        return;
    }

    noImageText.style.display = 'none';

    const avgMethod = averageMethodSelect.value;
    const distMethod = distanceMethodSelect.value;
    const avgColor = calculateAverageColor(photoPreview, avgMethod);

    if (!avgColor) {
        noImageText.style.display = 'block';
        return;
    }

    const selectedColor = hexToRgb(confrontoColor);
    const dist = calculateColorDistance(selectedColor, avgColor, distMethod);
    const distPercentage = calculateColorDistancePercentage(dist);

    // Aggiorna testi e colori
    confrontoColorBox.style.backgroundColor = confrontoColor;
    confrontoColorText.textContent = `${confrontoColor} - ${hexToRgbString(confrontoColor)}`;

    averageMethodText.textContent = avgMethod;
    const avgHex = rgbToHexString(avgColor);
    averageColorBox.style.backgroundColor = `rgb(${avgColor.r},${avgColor.g},${avgColor.b})`;
    averageColorText.textContent = `${avgHex} - rgb(${avgColor.r}, ${avgColor.g}, ${avgColor.b})`;

    distanceMethodText.textContent = distMethod;
    distanceText.textContent = `${dist.toFixed(2)} (${distPercentage}%)`;
}

// Imposta valore di default e aggiorna i risultati all'avvio
confrontoOther.value = "#ff0000";
updateResults();
