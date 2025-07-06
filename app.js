document.addEventListener('DOMContentLoaded', () => {
    // --- Canvas Setup ---
    const canvas = new fabric.Canvas('thumbnail-canvas', {
        width: 640, height: 415, backgroundColor: '#dddddd',
    });

    // --- DOM Element Cache ---
    const dom = {
        propertiesPanel: document.getElementById('properties-panel'),
        commonProps: document.getElementById('common-props'),
        textProps: document.getElementById('text-props'),
        imageProps: document.getElementById('image-props'),
        layersList: document.getElementById('layers-list'),
        fontFamilySelect: document.getElementById('font-family-select'),
        shadowEnable: document.getElementById('shadow-enable'),
        shadowControls: document.getElementById('shadow-controls'),
        shadowColor: document.getElementById('shadow-color'),
        shadowBlur: document.getElementById('shadow-blur'),
        shadowOffsetX: document.getElementById('shadow-offset-x'),
        shadowOffsetY: document.getElementById('shadow-offset-y'),
        alignButtons: document.querySelectorAll('.align-buttons button'),
    };

    const FONT_STORAGE_KEY = 'vh-thumbnail-maker-fonts';

    // ===================================================
    // === NEW FONT MANAGEMENT LOGIC STARTS HERE ===
    // ===================================================

    /**
     * Loads fonts saved in localStorage when the app starts.
     */
    function loadSavedFonts() {
        const savedFonts = JSON.parse(localStorage.getItem(FONT_STORAGE_KEY) || '[]');
        if (savedFonts.length === 0) return;

        console.log(`Loading ${savedFonts.length} saved fonts...`);
        savedFonts.forEach(fontData => {
            loadAndApplyFont(fontData.name, fontData.dataURL);
        });
    }

    /**
     * Takes font name and dataURL, loads it using FontFace API, and adds to dropdown.
     * @param {string} name - The name of the font.
     * @param {string} dataURL - The base64 dataURL of the font file.
     */
    function loadAndApplyFont(name, dataURL) {
        const newFont = new FontFace(name, `url(${dataURL})`);
        newFont.load().then(loadedFont => {
            document.fonts.add(loadedFont);
            // Add to dropdown only if it doesn't already exist
            if (![...dom.fontFamilySelect.options].some(opt => opt.value === name)) {
                dom.fontFamilySelect.add(new Option(name, name));
            }
        }).catch(err => console.error(`Font loading error for ${name}:`, err));
    }
    
    // --- UPDATED FONT UPLOAD LOGIC ---
    document.getElementById('font-upload').addEventListener('change', (e) => {
        const files = e.target.files;
        if (!files.length) return;

        const fontPromises = Array.from(files).map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const fontName = file.name.split('.')[0].replace(/ /g, "_");
                    resolve({ name: fontName, dataURL: reader.result });
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });

        Promise.all(fontPromises).then(newFonts => {
            const savedFonts = JSON.parse(localStorage.getItem(FONT_STORAGE_KEY) || '[]');
            let newFontsAddedCount = 0;

            newFonts.forEach(newFont => {
                loadAndApplyFont(newFont.name, newFont.dataURL);
                if (!savedFonts.some(f => f.name === newFont.name)) {
                    savedFonts.push(newFont);
                    newFontsAddedCount++;
                }
            });

            if (newFontsAddedCount > 0) {
                 localStorage.setItem(FONT_STORAGE_KEY, JSON.stringify(savedFonts));
            }
           
            alert(`${newFonts.length} font(s) processed. ${newFontsAddedCount} new font(s) saved successfully!`);

        }).catch(err => {
            console.error("Error processing fonts:", err);
            alert("There was an error importing the fonts.");
        });

        e.target.value = ''; // Reset the input
    });

    // --- NEW: Clear Saved Fonts Logic ---
    document.getElementById('clear-fonts').addEventListener('click', () => {
        if (confirm("Are you sure you want to remove all saved fonts from your browser? This cannot be undone.")) {
            localStorage.removeItem(FONT_STORAGE_KEY);
            alert("All saved fonts have been cleared. Please reload the page to see the changes.");
            // Optionally, reload the page automatically
            window.location.reload();
        }
    });

    // ===================================================
    // === NEW FONT MANAGEMENT LOGIC ENDS HERE ===
    // ===================================================


    // --- Initial State and Functions ---
    function setupInitialCanvas() {
        const whiteSpace = new fabric.Rect({
            left: canvas.width * 0.65, top: 0, width: canvas.width * 0.35, height: canvas.height,
            fill: 'white', selectable: false, evented: false, isDefault: true,
        });
        const brandText = new fabric.Text('VACANCYHAI.ONLINE', {
            left: 10, top: canvas.height - 30, fontSize: 20, fill: 'rgba(0,0,0,0.5)',
            selectable: false, evented: false, isDefault: true,
        });
        canvas.add(whiteSpace, brandText);
        canvas.sendToBack(brandText).sendToBack(whiteSpace);
        updateLayers();
    }

    const getActive = () => canvas.getActiveObject();

    // --- Update UI Functions ---
    function updateLayers() {
        dom.layersList.innerHTML = '';
        const objects = canvas.getObjects().filter(obj => !obj.isDefault).reverse();

        objects.forEach(obj => {
            const name = obj.type === 'textbox' ? obj.text.substring(0, 15) : (obj.type || 'Object');
            const li = document.createElement('li');
            if (obj === getActive()) li.classList.add('active');
            
            li.innerHTML = `
                <span class="layer-name">${name}</span>
                <div class="layer-controls">
                    <button class="up" title="Move Up"><i class="fas fa-arrow-up"></i></button>
                    <button class="down" title="Move Down"><i class="fas fa-arrow-down"></i></button>
                    <button class="lock" title="Lock/Unlock">${obj.lockMovementX ? '<i class="fas fa-lock"></i>' : '<i class="fas fa-lock-open"></i>'}</button>
                    <button class="delete" title="Delete"><i class="fas fa-trash-can"></i></button>
                </div>`;
            
            li.querySelector('.layer-name').addEventListener('click', () => canvas.setActiveObject(obj).renderAll());
            li.querySelector('.delete').addEventListener('click', () => canvas.remove(obj));
            li.querySelector('.lock').addEventListener('click', (e) => {
                const isLocked = !obj.lockMovementX;
                obj.set({ lockMovementX: isLocked, lockMovementY: isLocked, lockScalingX: isLocked, lockScalingY: isLocked, lockRotation: isLocked });
                e.currentTarget.innerHTML = isLocked ? '<i class="fas fa-lock"></i>' : '<i class="fas fa-lock-open"></i>';
            });
            li.querySelector('.up').addEventListener('click', () => { canvas.bringForward(obj); updateLayers(); });
            li.querySelector('.down').addEventListener('click', () => { canvas.sendBackwards(obj); updateLayers(); });

            dom.layersList.appendChild(li);
        });
    }

    function updatePropertiesPanel() {
        const activeObj = getActive();
        if (!activeObj) {
            dom.propertiesPanel.classList.add('hidden');
            return;
        }

        dom.propertiesPanel.classList.remove('hidden');
        dom.commonProps.classList.remove('hidden');
        dom.textProps.classList.add('hidden');
        dom.imageProps.classList.add('hidden');

        const shadow = activeObj.shadow;
        dom.shadowEnable.checked = !!shadow;
        dom.shadowControls.classList.toggle('hidden', !shadow);
        if (shadow) {
            dom.shadowColor.value = shadow.color;
            dom.shadowBlur.value = shadow.blur;
            dom.shadowOffsetX.value = shadow.offsetX;
            dom.shadowOffsetY.value = shadow.offsetY;
        }

        if (activeObj.type === 'textbox') {
            dom.textProps.classList.remove('hidden');
            document.getElementById('text-color').value = activeObj.fill;
            document.getElementById('font-size').value = activeObj.fontSize;
            dom.fontFamilySelect.value = activeObj.fontFamily;
            document.getElementById('text-bold').style.fontWeight = activeObj.fontWeight;
            document.getElementById('text-italic').style.fontStyle = activeObj.fontStyle;
            dom.alignButtons.forEach(btn => btn.classList.toggle('active', btn.id.includes(activeObj.textAlign)));
        } else if (activeObj.type === 'image') {
            dom.imageProps.classList.remove('hidden');
            const clipPath = activeObj.clipPath;
            document.getElementById('image-corners').value = (clipPath && clipPath.rx) ? clipPath.rx : 0;
        }
    }

    // --- Main Event Listeners ---
    canvas.on({
        'selection:created': updatePropertiesPanel, 'selection:updated': updatePropertiesPanel,
        'selection:cleared': () => dom.propertiesPanel.classList.add('hidden'),
        'object:added': updateLayers, 'object:removed': updateLayers, 'object:modified': updateLayers,
    });
    canvas.on('mouse:down', (e) => e.target && updateLayers());

    // --- Toolbar Actions ---
    document.getElementById('add-text').addEventListener('click', () => {
        const textbox = new fabric.Textbox('Your Text Here', { left: 50, top: 50, width: 250, fontSize: 40, fill: '#000000', fontFamily: 'Arial' });
        canvas.add(textbox).setActiveObject(textbox);
    });
    document.getElementById('add-line').addEventListener('click', () => {
        const line = new fabric.Rect({ left: 50, top: 150, width: 200, height: 5, fill: 'white', stroke: 'black', strokeWidth: 1 });
        canvas.add(line).setActiveObject(line);
    });
    document.getElementById('image-upload').addEventListener('change', (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (f) => fabric.Image.fromURL(f.target.result, (img) => { img.scaleToWidth(200); canvas.add(img).setActiveObject(img); });
        reader.readAsDataURL(file); e.target.value = '';
    });

    // --- Property Panel Event Listeners ---
    document.getElementById('canvas-bg-color').addEventListener('input', (e) => canvas.setBackgroundColor(e.target.value, canvas.renderAll.bind(canvas)));
    document.getElementById('text-color').addEventListener('input', (e) => getActive()?.set('fill', e.target.value) && canvas.renderAll());
    document.getElementById('font-size').addEventListener('input', (e) => getActive()?.set('fontSize', parseInt(e.target.value, 10)) && canvas.renderAll());
    dom.fontFamilySelect.addEventListener('change', (e) => getActive()?.set('fontFamily', e.target.value) && canvas.renderAll());
    document.getElementById('text-bold').addEventListener('click', () => getActive()?.set('fontWeight', getActive().fontWeight === 'bold' ? 'normal' : 'bold') && canvas.renderAll() & updatePropertiesPanel());
    document.getElementById('text-italic').addEventListener('click', () => getActive()?.set('fontStyle', getActive().fontStyle === 'italic' ? 'normal' : 'italic') && canvas.renderAll() & updatePropertiesPanel());
    dom.alignButtons.forEach(btn => btn.addEventListener('click', () => getActive()?.set('textAlign', btn.id.split('-')[1]) && canvas.renderAll() & updatePropertiesPanel()));

    document.getElementById('image-corners').addEventListener('input', (e) => {
        const obj = getActive();
        if (obj?.type !== 'image') return;
        const radius = parseInt(e.target.value, 10);
        if (radius === 0) { obj.clipPath = null; }
        else { obj.clipPath = new fabric.Rect({ width: obj.width, height: obj.height, rx: radius / obj.scaleX, ry: radius / obj.scaleY, absolutePositioned: true }); }
        canvas.renderAll();
    });

    function updateShadow() {
        const obj = getActive(); if (!obj) return;
        obj.set('shadow', new fabric.Shadow({
            color: dom.shadowColor.value,
            blur: parseInt(dom.shadowBlur.value, 10),
            offsetX: parseInt(dom.shadowOffsetX.value, 10),
            offsetY: parseInt(dom.shadowOffsetY.value, 10),
        }));
        canvas.renderAll();
    }
    dom.shadowEnable.addEventListener('change', (e) => {
        if (!e.target.checked) getActive()?.set('shadow', null); else updateShadow();
        updatePropertiesPanel(); canvas.renderAll();
    });
    [dom.shadowColor, dom.shadowBlur, dom.shadowOffsetX, dom.shadowOffsetY].forEach(el => el.addEventListener('input', updateShadow));

    // Eyedropper
    const colorPickerTriggers = document.querySelectorAll('.color-picker-trigger');
    if ('EyeDropper' in window) {
        const eyeDropper = new window.EyeDropper();
        colorPickerTriggers.forEach(trigger => {
            trigger.addEventListener('click', async () => {
                try {
                    const { sRGBHex } = await eyeDropper.open();
                    const colorInput = trigger.previousElementSibling;
                    colorInput.value = sRGBHex;
                    colorInput.dispatchEvent(new Event('input', { bubbles: true }));
                } catch (e) { console.log('EyeDropper cancelled.'); }
            });
        });
    } else {
        colorPickerTriggers.forEach(trigger => trigger.classList.add('unsupported'));
    }

    // General Controls
    document.getElementById('zoom-in').addEventListener('click', () => canvas.setZoom(canvas.getZoom() * 1.1));
    document.getElementById('zoom-out').addEventListener('click', () => canvas.setZoom(canvas.getZoom() / 1.1));
    document.getElementById('theme-toggle').addEventListener('click', () => document.body.classList.toggle('dark-theme'));
    function downloadImage(format, quality) {
        canvas.discardActiveObject().renderAll();
        const filename = `VACANCYHAI_ONLINE_${Date.now()}.${format}`;
        const dataURL = canvas.toDataURL({ format, quality, multiplier: 1 });
        const link = document.createElement('a');
        link.href = dataURL; link.download = filename;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    }
    document.getElementById('download-jpg').addEventListener('click', () => downloadImage('jpeg', 0.8));
    document.getElementById('download-webp').addEventListener('click', () => downloadImage('webp', 0.8));
    
    // --- Initialize App ---
    setupInitialCanvas();
    loadSavedFonts(); // Load saved fonts on startup
});
