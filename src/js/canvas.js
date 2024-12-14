// Logica specifica per la pagina canvas
// Utilizziamo le stesse funzioni di colorCalculation.js usate nella camera page

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const modal = document.getElementById('canvasModal');
const modalOverlay = document.getElementById('modalOverlay');
const openButton = document.querySelector('.open-canvas-btn');
const closeButton = document.querySelector('.close-modal');
const resetButton = document.getElementById('resetButton');
const canvasImage = document.getElementById('canvasImage');

const averageMethodSelect = document.getElementById('averageMethod');
const distanceMethodSelect = document.getElementById('distanceMethod');
const confrontoColorInput = document.getElementById('confrontoColor');
const drawColorInput = document.getElementById('drawColor');

const noImageText = document.getElementById('noImageText');
const confrontoColorBox = document.getElementById('confrontoColorBox');
const confrontoColorText = document.getElementById('confrontoColorText');
const averageMethodText = document.getElementById('averageMethodText');
const averageColorBox = document.getElementById('averageColorBox');
const averageColorText = document.getElementById('averageColorText');
const distanceMethodText = document.getElementById('distanceMethodText');
const distanceText = document.getElementById('distanceText');

const drawColorBox = document.getElementById('drawColorBox');
const drawColorText = document.getElementById('drawColorText');

let painting = false;
let drawColor = drawColorInput.value;
let confrontoColor = confrontoColorInput.value;

openButton.addEventListener('click', openModal);
closeButton.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);
resetButton.addEventListener('click', resetCanvas);

drawColorInput.addEventListener('input', (e) => {
    drawColor = e.target.value;
    updateResults();
});

confrontoColorInput.addEventListener('input', (e) => {
    confrontoColor = e.target.value;
    updateResults();
});

averageMethodSelect.addEventListener('change', updateResults);
distanceMethodSelect.addEventListener('change', updateResults);

window.addEventListener('resize', function() {
    if (modal.style.display === 'block') {
        resizeCanvas();
    }
});

// Disegno
canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mouseup', endDraw);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseleave', endDraw);

// Touch
canvas.addEventListener('touchstart', startDraw);
canvas.addEventListener('touchend', endDraw);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchcancel', endDraw);

function openModal() {
    modal.style.display = 'block';
    modalOverlay.style.display = 'block';
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const savedImage = localStorage.getItem('canvasImage');
    if (savedImage) {
        const img = new Image();
        img.onload = function() {
            ctx.drawImage(img, 0, 0);
            // Once image loaded onto canvas, update results
            updateResults();
        };
        img.src = savedImage;
    } else {
        updateResults();
    }
}

function closeModal() {
    modal.style.display = 'none';
    modalOverlay.style.display = 'none';
    const dataURL = canvas.toDataURL();
    localStorage.setItem('canvasImage', dataURL);
}

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dataURL = canvas.toDataURL();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const img = new Image();
    img.onload = function() {
        ctx.drawImage(img, 0, 0);
        updateResults();
    };
    img.src = dataURL;
}

function getPosition(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches ? e.touches[0].clientX : 0)) - rect.left;
    const y = (e.clientY || (e.touches ? e.touches[0].clientY : 0)) - rect.top;
    return { x, y };
}

function startDraw(e) {
    painting = true;
    ctx.beginPath();
    const pos = getPosition(e);
    ctx.moveTo(pos.x, pos.y);
    e.preventDefault();
}

function endDraw() {
    painting = false;
    ctx.beginPath();
    updateResults();
}

function draw(e) {
    if (!painting) return;
    ctx.lineWidth = 15;
    ctx.lineCap = 'round';
    ctx.strokeStyle = drawColor;
    const pos = getPosition(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    e.preventDefault();
}

function resetCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    localStorage.removeItem('canvasImage');
    updateResults();
}

function updateResults() {
    // Convert canvas to image for calculation (similar to camera logic)
    const dataURL = canvas.toDataURL();
    canvasImage.onload = function() {
        // Once image is loaded into canvasImage, calculate
        performColorCalculations();
    };
    canvasImage.src = dataURL;
}

function performColorCalculations() {
    // If no content is drawn, the image might be blank
    if (!canvasImage.src) {
        displayNoImage();
        return;
    }

    const avgMethod = averageMethodSelect.value;
    const distMethod = distanceMethodSelect.value;
    const avgColor = calculateAverageColor(canvasImage, avgMethod);

    if (!avgColor) {
        displayNoImage();
        return;
    }

    noImageText.style.display = 'none';

    const selectedColor = hexToRgb(confrontoColor);
    const dist = calculateColorDistance(selectedColor, avgColor, distMethod);
    const distPercentage = calculateColorDistancePercentage(dist);
    const avgHex = rgbToHexString(avgColor);

    // Update confronto color
    confrontoColorBox.style.backgroundColor = confrontoColor;
    confrontoColorText.textContent = `${confrontoColor} - ${hexToRgbString(confrontoColor)}`;

    // Update draw color
    drawColorBox.style.backgroundColor = drawColor;
    drawColorText.textContent = `${drawColor} - ${hexToRgbString(drawColor)}`;

    // Update average color
    averageMethodText.textContent = avgMethod;
    averageColorBox.style.backgroundColor = `rgb(${avgColor.r},${avgColor.g},${avgColor.b})`;
    averageColorText.textContent = `${avgHex} - rgb(${avgColor.r}, ${avgColor.g}, ${avgColor.b})`;

    // Update distance
    distanceMethodText.textContent = distMethod;
    distanceText.textContent = `${dist.toFixed(2)} (${distPercentage}%)`;
}

function displayNoImage() {
    noImageText.style.display = 'block';
    confrontoColorBox.style.backgroundColor = '';
    confrontoColorText.textContent = '';
    drawColorBox.style.backgroundColor = '';
    drawColorText.textContent = '';
    averageMethodText.textContent = '';
    averageColorBox.style.backgroundColor = '';
    averageColorText.textContent = '';
    distanceMethodText.textContent = '';
    distanceText.textContent = '';
}

// Initialize results on first load
updateResults();
