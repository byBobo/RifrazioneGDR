document.addEventListener('DOMContentLoaded', () => {

    const state = {
        space1: { avg: null, mode: null, canvasDataUrl: null },
        space2: { avg: null, mode: null, canvasDataUrl: null }
    };

    const canvasModalOverlay = document.getElementById('canvas-modal-overlay');
    const canvasEl = document.getElementById('canvas');
    const ctx = canvasEl.getContext('2d');
    let currentDrawingSpace = null;
    let painting = false;

    // --- FUNZIONI DI UTILITÀ COLORE ---
    const hexToRgb = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    };
    const rgbToHex = (r, g, b) => "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    const rgbToString = (rgb) => `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

    // --- LOGICA DI CALCOLO ---
    const calculateColors = (imageElement) => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imageElement.naturalWidth || imageElement.width;
        tempCanvas.height = imageElement.naturalHeight || imageElement.height;
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        try {
            tempCtx.drawImage(imageElement, 0, 0);
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imageData.data;
            let rSum = 0, gSum = 0, bSum = 0, pixelCount = 0;
            const colorFrequencies = new Map();
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
                if (a === 0 || (r === 255 && g === 255 && b === 255)) continue;
                rSum += r; gSum += g; bSum += b; pixelCount++;
                const rgbKey = `${r},${g},${b}`;
                colorFrequencies.set(rgbKey, (colorFrequencies.get(rgbKey) || 0) + 1);
            }
            if (pixelCount === 0) return { avg: null, mode: null };
            const avg = { r: Math.round(rSum / pixelCount), g: Math.round(gSum / pixelCount), b: Math.round(bSum / pixelCount) };
            let maxFreq = 0, modeRgbKey = "";
            for (const [key, freq] of colorFrequencies.entries()) { if (freq > maxFreq) { maxFreq = freq; modeRgbKey = key; } }
            const [r_mode, g_mode, b_mode] = modeRgbKey.split(',').map(Number);
            const mode = { r: r_mode, g: g_mode, b: b_mode };
            return { avg, mode };
        } catch (error) {
            console.error("Errore nel calcolo dei colori (probabile problema CORS).", error);
            return { avg: null, mode: null };
        }
    };

    const updateComparison = () => {
        const distValueEl = document.getElementById('dist-value');
        const distPercEl = document.getElementById('dist-perc');
        if (state.space1.avg && state.space2.avg) {
            const c1 = state.space1.avg, c2 = state.space2.avg;
            const distance = Math.sqrt(Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2));
            const maxDistance = Math.sqrt(3 * Math.pow(255, 2));
            const percentage = (distance / maxDistance) * 100;
            distValueEl.textContent = distance.toFixed(2);
            distPercEl.textContent = `${percentage.toFixed(2)}%`;
        } else {
            distValueEl.textContent = '-';
            distPercEl.textContent = '-';
        }
    };

    // --- GESTIONE UI ---
    const updateResultsUI = (space, results) => {
        state[`space${space}`] = { ...state[`space${space}`], avg: results.avg, mode: results.mode };
        const spazioEl = document.getElementById(`spazio${space}`);
        const updateRow = (rowSelector, color) => {
            const row = spazioEl.querySelector(rowSelector);
            row.querySelector('.result-box').style.backgroundColor = color ? rgbToString(color) : 'transparent';
            row.querySelector('.result-hex').textContent = color ? rgbToHex(color.r, color.g, color.b) : '-';
            row.querySelector('.result-rgb').textContent = color ? rgbToString(color) : '-';
        };
        updateRow('.avg-row', results.avg);
        updateRow('.mode-row', results.mode);
        updateComparison();
    };
    
    const resetSpace = (space) => {
        const spazioEl = document.getElementById(`spazio${space}`);
        const placeholder = spazioEl.querySelector('.placeholder');
        placeholder.textContent = 'Nessuna sorgente selezionata';
        placeholder.style.display = 'block';
        const previewImage = spazioEl.querySelector('.preview-image');
        previewImage.style.display = 'none';
        previewImage.removeAttribute('src');
        spazioEl.querySelector('.preview-color').style.display = 'none';
        spazioEl.querySelector('input[type="file"]').value = '';
        spazioEl.querySelector('input[type="url"]').value = '';
        spazioEl.querySelectorAll('.palette-swatch.selected').forEach(s => s.classList.remove('selected'));
        state[`space${space}`] = { avg: null, mode: null, canvasDataUrl: state[`space${space}`].canvasDataUrl };
        updateResultsUI(space, { avg: null, mode: null });
    };

    const showPreview = (space, type, source) => {
        const spazioEl = document.getElementById(`spazio${space}`);
        const placeholder = spazioEl.querySelector('.placeholder'), previewImage = spazioEl.querySelector('.preview-image'), previewColor = spazioEl.querySelector('.preview-color');
        placeholder.style.display = 'none'; previewImage.style.display = 'none'; previewColor.style.display = 'none';
        if (type === 'image') {
            previewImage.crossOrigin = "Anonymous";
            previewImage.src = source;
            previewImage.style.display = 'block';
            previewImage.onload = () => {
                const results = calculateColors(previewImage);
                if(results.avg === null && results.mode === null) {
                    placeholder.textContent = "URL non valido o inaccessibile";
                    placeholder.style.display = 'block'; previewImage.style.display = 'none';
                }
                updateResultsUI(space, results);
            };
            previewImage.onerror = () => {
                placeholder.textContent = "URL non valido o inaccessibile";
                placeholder.style.display = 'block'; previewImage.style.display = 'none';
                updateResultsUI(space, { avg: null, mode: null });
            };
        } else if (type === 'color') {
            previewColor.style.backgroundColor = source; previewColor.style.display = 'block';
            const rgb = hexToRgb(source);
            updateResultsUI(space, { avg: rgb, mode: rgb });
            state[`space${space}`].canvasDataUrl = null;
        }
    };
    
    // --- GESTIONE EVENTI ---
    [1, 2].forEach(space => {
        const spazioEl = document.getElementById(`spazio${space}`);
        spazioEl.querySelectorAll(`input[name="source${space}"]`).forEach(radio => radio.addEventListener('change', () => {
             const selectedValue = radio.value;
             document.querySelectorAll(`.input-wrapper[data-space="${space}"]`).forEach(wrapper => { wrapper.style.display = wrapper.dataset.source === selectedValue ? 'flex' : 'none'; });
             resetSpace(space);
             if(selectedValue === 'color'){ spazioEl.querySelector('.palette-swatch').click(); }
        }));
        
        spazioEl.querySelector('input[type="file"]').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => { state[`space${space}`].canvasDataUrl = null; showPreview(space, 'image', event.target.result); }
                reader.readAsDataURL(file);
            }
        });

        spazioEl.querySelector('div[data-source="url"] button').addEventListener('click', () => {
            const url = spazioEl.querySelector('input[type="url"]').value.trim();
            if (url) {
                spazioEl.querySelector('.placeholder').textContent = 'Caricamento in corso...';
                spazioEl.querySelector('.placeholder').style.display = 'block';
                state[`space${space}`].canvasDataUrl = null;
                showPreview(space, 'image', url);
            } else { resetSpace(space); }
        });
        
        const colorPalette = spazioEl.querySelector('div[data-source="color"] .color-palette');
        colorPalette.querySelectorAll('.palette-swatch').forEach(swatch => {
            swatch.style.backgroundColor = swatch.dataset.color;
            swatch.addEventListener('click', () => {
                colorPalette.querySelectorAll('.palette-swatch.selected').forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');
                showPreview(space, 'color', swatch.dataset.color);
            });
        });
        colorPalette.querySelector('.color-picker-input').addEventListener('input', (e) => {
            colorPalette.querySelectorAll('.palette-swatch.selected').forEach(s => s.classList.remove('selected'));
            showPreview(space, 'color', e.target.value);
        });

        spazioEl.querySelector('.canvas-open-btn').addEventListener('click', () => {
            currentDrawingSpace = space;
            canvasModalOverlay.style.display = 'flex';
            resizeCanvas();
            const savedDrawing = state[`space${space}`].canvasDataUrl;
            if (savedDrawing) { const img = new Image(); img.onload = () => { ctx.drawImage(img, 0, 0); }; img.src = savedDrawing; }
            document.querySelector('#canvas-color-palette .palette-swatch').click();
        });
    });

    // --- LOGICA CANVAS MODAL ---
    function resizeCanvas() {
        const savedContent = canvasEl.toDataURL();
        canvasEl.width = canvasEl.parentElement.clientWidth;
        const maxHeight = window.innerHeight * 0.9 - 200; // Calcola altezza massima disponibile
        canvasEl.height = Math.min(canvasEl.parentElement.clientWidth / (4/3), maxHeight);
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, canvasEl.width, canvasEl.height);
        img.src = savedContent;
    }
    window.addEventListener('resize', () => { if (canvasModalOverlay.style.display !== 'none') { resizeCanvas(); } });
    
    function startPosition(e) { painting = true; draw(e); }
    function endPosition() { painting = false; ctx.beginPath(); }
    function getMousePos(canvas, evt) {
        const rect = canvas.getBoundingClientRect();
        const clientX = evt.clientX || evt.touches[0].clientX;
        const clientY = evt.clientY || evt.touches[0].clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }
    function draw(e) {
        if (!painting) return;
        e.preventDefault();
        const { x, y } = getMousePos(canvasEl, e);
        ctx.lineWidth = document.getElementById('canvas-brush-size').value;
        ctx.lineCap = 'round';
        ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y);
    }
    ['mousedown', 'touchstart'].forEach(evt => canvasEl.addEventListener(evt, startPosition, { passive: false }));
    ['mouseup', 'touchend', 'mouseleave'].forEach(evt => canvasEl.addEventListener(evt, endPosition));
    ['mousemove', 'touchmove'].forEach(evt => canvasEl.addEventListener(evt, draw, { passive: false }));
    
    const canvasPalette = document.getElementById('canvas-color-palette');
    canvasPalette.querySelectorAll('.palette-swatch').forEach(swatch => {
        swatch.style.backgroundColor = swatch.dataset.color;
        swatch.addEventListener('click', () => {
            canvasPalette.querySelectorAll('.palette-swatch.selected').forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
            ctx.strokeStyle = swatch.dataset.color;
        });
    });
    document.getElementById('canvas-color-input').addEventListener('input', (e) => {
        canvasPalette.querySelectorAll('.palette-swatch.selected').forEach(s => s.classList.remove('selected'));
        ctx.strokeStyle = e.target.value;
    });

    document.getElementById('canvas-close-btn').addEventListener('click', () => {
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        canvasModalOverlay.style.display = 'none';
    });
    document.getElementById('canvas-clear-btn').addEventListener('click', () => { ctx.clearRect(0, 0, canvasEl.width, canvasEl.height); });
    document.getElementById('canvas-save-btn').addEventListener('click', () => {
        const dataUrl = canvasEl.toDataURL('image/png');
        state[`space${currentDrawingSpace}`].canvasDataUrl = dataUrl;
        showPreview(currentDrawingSpace, 'image', dataUrl);
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        canvasModalOverlay.style.display = 'none';
    });

    // Inizializzazione
    [1, 2].forEach(space => {
        document.querySelector(`input[name="source${space}"][value="file"]`).dispatchEvent(new Event('change', {bubbles:true}));
    });
});