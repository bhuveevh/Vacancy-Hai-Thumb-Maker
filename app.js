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
            
            // Event Listeners for layer controls
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

        // Update Shadow Controls
        const shadow = activeObj.shadow;
        dom.shadowEnable.checked = !!shadow;
        dom.shadowControls.classList.toggle('hidden', !shadow);
        if (shadow) {
            dom.shadowColor.value = shadow.color;
            dom.shadowBlur.value = shadow.blur;
            dom.shadowOffsetX.value = shadow.offsetX;
            dom.shadowOffsetY.value = shadow.offsetY;
        }

        // Update Type-specific properties
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
            // For images, rx is on the clipPath, not the image itself
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
        const textbox = new fabric.Textbox('Your Text Here', {
            left: 50, top: 50, width: 250, fontSize: 40, fill: '#000000', fontFamily: 'Arial',
        });
        canvas.add(textbox).setActiveObject(textbox);
    });
    document.getElementById('add-line').addEventListener('click', () => {
        const line = new fabric.Rect({ left: 50, top: 150, width: 200, height: 5, fill: 'white', stroke: 'black', strokeWidth: 1 });
        canvas.add(line).setActiveObject(line);
    });
    document.getElementById('image-upload').addEventListener('change', (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (f) => fabric.Image.fromURL(f.target.result, (img) => {
            img.scaleToWidth(200); canvas.add(img).setActiveObject(img);
        });
        reader.readAsDataURL(file); e.target.value = '';
    });
    document.getElementById('font-upload').addEventListener('change', (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (f) => {
            const fontName = file.name.split('.')[0].replace(/ /g, "_");
            const newFont = new FontFace(fontName, `url(${f.target.result})`);
            newFont.load().then(font => {
                document.fonts.add(font);
                dom.fontFamilySelect.add(new Option(fontName, fontName));
                alert(`Font '${fontName}' imported!`);
            }).catch(err => console.error("Font loading error:", err));
        };
        reader.readAsDataURL(file); e.target.value = '';
    });

    // --- Property Panel Event Listeners ---
    document.getElementById('canvas-bg-color').addEventListener('input', (e) => canvas.setBackgroundColor(e.target.value, canvas.renderAll.bind(canvas)));

    // Text properties
    document.getElementById('text-color').addEventListener('input', (e) => getActive()?.set('fill', e.target.value) && canvas.renderAll());
    document.getElementById('font-size').addEventListener('input', (e) => getActive()?.set('fontSize', parseInt(e.target.value, 10)) && canvas.renderAll());
    dom.fontFamilySelect.addEventListener('change', (e) => getActive()?.set('fontFamily', e.target.value) && canvas.renderAll());
    document.getElementById('text-bold').addEventListener('click', () => getActive()?.set('fontWeight', getActive().fontWeight === 'bold' ? 'normal' : 'bold') && canvas.renderAll() & updatePropertiesPanel());
    document.getElementById('text-italic').addEventListener('click', () => getActive()?.set('fontStyle', getActive().fontStyle === 'italic' ? 'normal' : 'italic') && canvas.renderAll() & updatePropertiesPanel());
    dom.alignButtons.forEach(btn => btn.addEventListener('click', () => getActive()?.set('textAlign', btn.id.split('-')[1]) && canvas.renderAll() & updatePropertiesPanel()));

    // Image properties - Corner Radius (using clipPath)
    document.getElementById('image-corners').addEventListener('input', (e) => {
        const obj = getActive();
        if (obj?.type !== 'image') return;
        const radius = parseInt(e.target.value, 10);
        if (radius === 0) {
            obj.clipPath = null; // Remove clipping
        } else {
            const clipRect = new fabric.Rect({
                width: obj.width, height: obj.height,
                rx: radius, ry: radius,
                absolutePositioned: true, // Important for clipPath
            });
            obj.clipPath = clipRect;
        }
        canvas.renderAll();
    });

    // Shadow properties
    dom.shadowEnable.addEventListener('change', (e) => {
        if (!e.target.checked) getActive()?.set('shadow', null);
        else updateShadow();
        updatePropertiesPanel();
        canvas.renderAll();
    });
    function updateShadow() {
        const obj = getActive(); if (!obj) return;
        const shadow = new fabric.Shadow({
            color: dom.shadowColor.value,
            blur: parseInt(dom.shadowBlur.value, 10),
            offsetX: parseInt(dom.shadowOffsetX.value, 10),
            offsetY: parseInt(dom.shadowOffsetY.value, 10),
        });
        obj.set('shadow', shadow);
        canvas.renderAll();
    }
    ['input', 'change'].forEach(evt => {
        dom.shadowColor.addEventListener(evt, updateShadow);
        dom.shadowBlur.addEventListener(evt, updateShadow);
        dom.shadowOffsetX.addEventListener(evt, updateShadow);
        dom.shadowOffsetY.addEventListener(evt, updateShadow);
    });

    // --- Eyedropper / Color Picker ---
    const colorPickerTriggers = document.querySelectorAll('.color-picker-trigger');
    if ('EyeDropper' in window) {
        const eyeDropper = new window.EyeDropper();
        colorPickerTriggers.forEach(trigger => {
            trigger.addEventListener('click', async () => {
                try {
                    const { sRGBHex } = await eyeDropper.open();
                    const colorInput = trigger.previousElementSibling;
                    colorInput.value = sRGBHex;
                    // Trigger the input event to update the canvas
                    colorInput.dispatchEvent(new Event('input', { bubbles: true }));
                } catch (e) {
                    console.log('EyeDropper cancelled.');
                }
            });
        });
    } else {
        colorPickerTriggers.forEach(trigger => trigger.classList.add('unsupported'));
    }

    // --- General Controls ---
    document.getElementById('zoom-in').addEventListener('click', () => canvas.setZoom(canvas.getZoom() * 1.1));
    document.getElementById('zoom-out').addEventListener('click', () => canvas.setZoom(canvas.getZoom() / 1.1));
    document.getElementById('theme-toggle').addEventListener('click', () => document.body.classList.toggle('dark-theme'));
    function downloadImage(format, quality) {
        canvas.discardActiveObject().renderAll();
        const filename = `VACANCYHAI_ONLINE_${Date.now()}.${format}`;
        const dataURL = canvas.toDataURL({ format, quality, multiplier: 1 });
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    document.getElementById('download-jpg').addEventListener('click', () => downloadImage('jpeg', 0.8));
    document.getElementById('download-webp').addEventListener('click', () => downloadImage('webp', 0.8));
    
    // --- Initialize App ---
    setupInitialCanvas();
});
