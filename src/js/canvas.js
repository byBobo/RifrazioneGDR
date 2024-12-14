// import { func1Name, func2Name } from './utils/colorCalculations.js';

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var modal = document.getElementById('canvasModal');
var modalOverlay = document.getElementById('modalOverlay');
var openButton = document.querySelector('.open-canvas-btn');
var closeButton = document.querySelector('.close-modal');

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    // Before resizing, store current drawing if any
    var dataURL = canvas.toDataURL();
    canvas.width = rect.width;
    canvas.height = rect.height;
    // After resizing, restore the image
    var img = new Image();
    img.onload = function() {
        ctx.drawImage(img, 0, 0);
        updateResults();
    };
    img.src = dataURL;
}

function openModal() {
    modal.style.display = 'block';
    modalOverlay.style.display = 'block';
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Restore saved drawing if exists
    var savedImage = localStorage.getItem('canvasImage');
    if (savedImage) {
        var img = new Image();
        img.onload = function() {
            ctx.drawImage(img, 0, 0);
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
    // Save current canvas image so that it persists
    var dataURL = canvas.toDataURL();
    localStorage.setItem('canvasImage', dataURL);
}

openButton.addEventListener('click', openModal);
closeButton.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

window.addEventListener('resize', function() {
    // On resize (when modal is open), we handle drawing persistence via dataURL above
    if (modal.style.display === 'block') {
        resizeCanvas();
    }
});

var painting = false;
var drawColor = document.getElementById('drawColor').value;
var confrontoColor = document.getElementById('confrontoColor').value;

document.getElementById('drawColor').addEventListener('input', (e) => {
    drawColor = e.target.value;
    updateResults();
});

document.getElementById('confrontoColor').addEventListener('input', (e) => {
    confrontoColor = e.target.value;
    updateResults();
});

document.getElementById('resetButton').addEventListener('click', resetCanvas);

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

// Mouse events
canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mouseup', endDraw);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseleave', endDraw);

// Touch events
canvas.addEventListener('touchstart', startDraw);
canvas.addEventListener('touchend', endDraw);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchcancel', endDraw);

function resetCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    localStorage.removeItem('canvasImage');
    updateResults();
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b)
        .toString(16)
        .slice(1)
        .toUpperCase();
}

function calculateColorDistancePercentage(distance) {
    const maxDistance = Math.sqrt(3 * Math.pow(255, 2));
    return ((distance / maxDistance) * 100).toFixed(2);
}

function calculateAverageColor() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let r = 0, g = 0, b = 0, count = 0;

    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] !== 0) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
        }
    }

    if (count === 0) return null;
    return { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
}

function calculateColorDistance(c1, c2) {
    return Math.sqrt(
        Math.pow(c1.r - c2.r, 2) +
        Math.pow(c1.g - c2.g, 2) +
        Math.pow(c1.b - c2.b, 2)
    );
}

function updateResults() {
    const avgColor = calculateAverageColor();

    if (!avgColor) {
        document.getElementById('results').innerHTML = 
        `<p><strong>Colore per Disegnare:</strong>
        <p><strong>Colore di Confronto:</strong>
        <p><strong>Colore Medio:</strong>
        <p><strong>Distanza:</strong>`;
        return;
    }

    const confrontoRgb = hexToRgb(confrontoColor);
    const avgHex = rgbToHex(avgColor.r, avgColor.g, avgColor.b);
    const dist = calculateColorDistance(avgColor, confrontoRgb);
    const distPercentage = calculateColorDistancePercentage(dist);

    document.getElementById('averageColorBox').style.backgroundColor = avgHex;
    document.getElementById('results').innerHTML = 
        `<p><strong>Colore per Disegnare:</strong> ${drawColor} (${hexToRgb(drawColor).r}, ${hexToRgb(drawColor).g}, ${hexToRgb(drawColor).b})</p>
        <p><strong>Colore di Confronto:</strong> ${confrontoColor} (${confrontoRgb.r}, ${confrontoRgb.g}, ${confrontoRgb.b})</p>
        <p><strong>Colore Medio:</strong> ${avgHex} (${avgColor.r}, ${avgColor.g}, ${avgColor.b})</p>
        <p><strong>Distanza:</strong> ${dist.toFixed(2)} (${distPercentage}%)</p>`;
}
