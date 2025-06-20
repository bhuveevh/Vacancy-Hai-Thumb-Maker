document.addEventListener('DOMContentLoaded', () => {
    // --- Konva.js Setup ---
    const width = 640;
    const height = 415;
    const stage = new Konva.Stage({
        container: 'konvaContainer',
        width: width,
        height: height,
    });
    const layer = new Konva.Layer();
    stage.add(layer);

    // Transformer for resizing and rotating
    const tr = new Konva.Transformer();
    layer.add(tr);

    // --- UI Elements ---
    const bgColorPicker = document.getElementById('bgColorPicker');
    const addRectBtn = document.getElementById('addRectBtn');
    const addCircleBtn = document.getElementById('addCircleBtn');
    const addTextBtn = document.getElementById('addTextBtn');
    const imageUpload = document.getElementById('imageUpload');
    const addImageBtn = document.getElementById('addImageBtn');
    const addLineBtn = document.getElementById('addLineBtn');
    const uploadFontBtn = document.getElementById('uploadFontBtn');
    const downloadWebPBtn = document.getElementById('downloadWebPBtn');
    const zoomSlider = document.getElementById('zoomSlider');
    const zoomValueSpan = document.getElementById('zoomValue');
    const quickTextArea = document.getElementById('quickTextArea');

    // Properties Panel
    const noElementSelectedMsg = document.getElementById('noElementSelected');
    const elementPropertiesDiv = document.getElementById('elementProperties');
    const propX = document.getElementById('propX');
    const valX = document.getElementById('valX');
    const propY = document.getElementById('propY');
    const valY = document.getElementById('valY');
    const propRotation = document.getElementById('propRotation');
    const valRotation = document.getElementById('valRotation');
    const propFillColor = document.getElementById('propFillColor');

    // Text Specific
    const textPropertiesDiv = document.getElementById('textProperties');
    const propTextContent = document.getElementById('propTextContent');
    const propFontFamily = document.getElementById('propFontFamily');
    const propFontSize = document.getElementById('propFontSize');
    const valFontSize = document.getElementById('valFontSize');
    const propTextColor = document.getElementById('propTextColor');
    const alignLeftBtn = document.getElementById('alignLeft');
    const alignCenterBtn = document.getElementById('alignCenter');
    const alignRightBtn = document.getElementById('alignRight');
    const toggleBoldBtn = document.getElementById('toggleBold');
    const toggleItalicBtn = document.getElementById('toggleItalic');

    // Image Specific
    const imagePropertiesDiv = document.getElementById('imageProperties');
    const propCornerRadius = document.getElementById('propCornerRadius');
    const valCornerRadius = document.getElementById('valCornerRadius');

    // Line Specific
    const linePropertiesDiv = document.getElementById('lineProperties');
    const propLineLength = document.getElementById('propLineLength');
    const valLineLength = document.getElementById('valLineLength');
    const propLineThickness = document.getElementById('propLineThickness');
    const valLineThickness = document.getElementById('valLineThickness');
    const propLineColor = document.getElementById('propLineColor');

    // Shadow Properties
    const shadowEnable = document.getElementById('shadowEnable');
    const shadowColor = document.getElementById('shadowColor');
    const shadowBlur = document.getElementById('shadowBlur');
    const valShadowBlur = document.getElementById('valShadowBlur');
    const shadowOffsetX = document.getElementById('shadowOffsetX');
    const valShadowOffsetX = document.getElementById('valShadowOffsetX');
    const shadowOffsetY = document.getElementById('shadowOffsetY');
    const valShadowOffsetY = document.getElementById('valShadowOffsetY');

    // Lock/Unlock
    const toggleLockBtn = document.getElementById('toggleLock');

    // Layers Panel
    const layersList = document.getElementById('layersList');
    const moveLayerUpBtn = document.getElementById('moveLayerUp');
    const moveLayerDownBtn = document.getElementById('moveLayerDown');

    let selectedShape = null; // Currently selected Konva shape
    let nextElementId = 1; // For unique IDs for new elements

    // --- Helper Functions ---
    function updatePropertiesPanel() {
        if (!selectedShape) {
            noElementSelectedMsg.classList.remove('hidden');
            elementPropertiesDiv.classList.add('hidden');
            quickTextArea.value = ''; // Clear scratchpad
            return;
        }

        noElementSelectedMsg.classList.add('hidden');
        elementPropertiesDiv.classList.remove('hidden');

        const isLocked = selectedShape.getAttr('isLocked') || false;
        const disableControls = isLocked;

        // Common properties
        propX.value = selectedShape.x();
        valX.textContent = Math.round(selectedShape.x());
        propY.value = selectedShape.y();
        valY.textContent = Math.round(selectedShape.y());
        propRotation.value = selectedShape.rotation();
        valRotation.textContent = Math.round(selectedShape.rotation());

        propX.disabled = disableControls;
        propY.disabled = disableControls;
        propRotation.disabled = disableControls;

        // Element-specific properties visibility and data
        propFillColor.parentElement.style.display = 'none'; // Hide by default
        textPropertiesDiv.classList.add('hidden');
        imagePropertiesDiv.classList.add('hidden');
        linePropertiesDiv.classList.add('hidden');
        quickTextArea.value = ''; // Clear scratchpad by default

        if (selectedShape.getClassName() === 'Rect' || selectedShape.getClassName() === 'Circle') {
            propFillColor.parentElement.style.display = 'block';
            propFillColor.value = selectedShape.fill();
            propFillColor.disabled = disableControls;
        } else if (selectedShape.getClassName() === 'Text') {
            textPropertiesDiv.classList.remove('hidden');
            propTextContent.value = selectedShape.text();
            propFontFamily.value = selectedShape.fontFamily();
            propFontSize.value = selectedShape.fontSize();
            valFontSize.textContent = Math.round(selectedShape.fontSize());
            propTextColor.value = selectedShape.fill(); // Text color is fill for Konva.Text
            updateFontStyles(selectedShape.fontStyle());
            updateTextAlign(selectedShape.align());
            quickTextArea.value = selectedShape.text(); // Sync scratchpad

            propTextContent.disabled = disableControls;
            propFontFamily.disabled = disableControls;
            propFontSize.disabled = disableControls;
            propTextColor.disabled = disableControls;
            alignLeftBtn.disabled = disableControls;
            alignCenterBtn.disabled = disableControls;
            alignRightBtn.disabled = disableControls;
            toggleBoldBtn.disabled = disableControls;
            toggleItalicBtn.disabled = disableControls;
            quickTextArea.disabled = disableControls; // Disable scratchpad if locked

        } else if (selectedShape.getClassName() === 'Image') {
            imagePropertiesDiv.classList.remove('hidden');
            propCornerRadius.value = selectedShape.cornerRadius();
            valCornerRadius.textContent = Math.round(selectedShape.cornerRadius());
            propCornerRadius.disabled = disableControls;
        } else if (selectedShape.getClassName() === 'Line') {
            linePropertiesDiv.classList.remove('hidden');
            const points = selectedShape.points();
            const currentLength = Math.sqrt(Math.pow(points[2] - points[0], 2) + Math.pow(points[3] - points[1], 2));
            propLineLength.value = Math.round(currentLength);
            valLineLength.textContent = Math.round(currentLength);
            propLineThickness.value = selectedShape.strokeWidth();
            valLineThickness.textContent = Math.round(selectedShape.strokeWidth());
            propLineColor.value = selectedShape.stroke();

            propLineLength.disabled = disableControls;
            propLineThickness.disabled = disableControls;
            propLineColor.disabled = disableControls;
        }

        // Shadow properties
        const shadow = selectedShape.getAttrs().shadowEnabled ? selectedShape.getAttrs() : {}; // Get current shadow or empty
        shadowEnable.checked = selectedShape.getAttr('shadowEnabled') || false;
        shadowColor.value = shadow.shadowColor || '#000000';
        shadowBlur.value = shadow.shadowBlur || 0;
        valShadowBlur.textContent = Math.round(shadow.shadowBlur || 0);
        shadowOffsetX.value = shadow.shadowOffsetX || 0;
        valShadowOffsetX.textContent = Math.round(shadow.shadowOffsetX || 0);
        shadowOffsetY.value = shadow.shadowOffsetY || 0;
        valShadowOffsetY.textContent = Math.round(shadow.shadowOffsetY || 0);

        shadowEnable.disabled = disableControls;
        // Disable shadow controls if shadow is not enabled or element is locked
        const shadowControlsDisabled = disableControls || !shadowEnable.checked;
        shadowColor.disabled = shadowControlsDisabled;
        shadowBlur.disabled = shadowControlsDisabled;
        shadowOffsetX.disabled = shadowControlsDisabled;
        shadowOffsetY.disabled = shadowControlsDisabled;


        // Update Lock/Unlock button text
        toggleLockBtn.textContent = isLocked ? 'Unlock Element' : 'Lock Element';
        toggleLockBtn.disabled = false; // Always allow toggling lock
    }

    function updateLayersPanel() {
        layersList.innerHTML = '';
        const nodes = layer.children.filter(node => node !== tr); // Use layer.children directly

        for (let i = nodes.length - 1; i >= 0; i--) {
            const node = nodes[i];
            const li = document.createElement('li');
            li.dataset.id = node.id();
            li.dataset.index = node.getZIndex();

            let icon = '❓';
            let name = 'Unknown';
            if (node.getClassName() === 'Rect') {
                icon = '⬛';
                name = 'Rectangle';
            } else if (node.getClassName() === 'Circle') {
                icon = '🔵';
                name = 'Circle';
            } else if (node.getClassName() === 'Text') {
                icon = '🅰️';
                // Show a snippet of the text content
                name = node.text().substring(0, 20) + (node.text().length > 20 ? '...' : '') || 'Text';
            } else if (node.getClassName() === 'Image') {
                icon = '🖼️';
                name = 'Image';
            } else if (node.getClassName() === 'Line') {
                icon = '━';
                name = 'Line';
            }

            const isLocked = node.getAttr('isLocked') || false;
            const lockIcon = isLocked ? '🔒' : '🔓';
            const lockTitle = isLocked ? 'Locked' : 'Unlocked';

            li.innerHTML = `
                <span class="layer-icon">${icon}</span>
                <span class="layer-name">${name}</span>
                <div class="layer-actions">
                    <button class="layer-lock-btn" title="${lockTitle}">${lockIcon}</button>
                    <button class="layer-dup-btn" title="Duplicate" ${isLocked ? 'disabled' : ''}>📋</button>
                    <button class="layer-del-btn" title="Delete" ${isLocked ? 'disabled' : ''}>✖️</button>
                </div>
            `;
            if (node === selectedShape) {
                li.classList.add('selected');
            }

            li.addEventListener('click', (e) => {
                // If a button inside the list item was clicked, prevent selecting the shape itself
                if (e.target.tagName === 'BUTTON') return;
                selectShape(node);
            });

            li.querySelector('.layer-lock-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                toggleLayerLock(node);
            });
            li.querySelector('.layer-dup-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                duplicateLayer(node);
            });
            li.querySelector('.layer-del-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteLayer(node);
            });

            layersList.appendChild(li);
        }

        // Enable/disable layer movement buttons
        if (selectedShape) {
            const shapes = layer.children.filter(node => node !== tr);
            const index = shapes.indexOf(selectedShape);
            moveLayerUpBtn.disabled = index >= shapes.length - 1 || selectedShape.getAttr('isLocked');
            moveLayerDownBtn.disabled = index <= 0 || selectedShape.getAttr('isLocked');
        } else {
            moveLayerUpBtn.disabled = true;
            moveLayerDownBtn.disabled = true;
        }
        layer.batchDraw();
    }

    function selectShape(shape) {
        if (selectedShape && selectedShape !== shape) {
            tr.nodes([]);
        }
        selectedShape = shape;
        if (selectedShape && !selectedShape.getAttr('isLocked')) {
            tr.nodes([selectedShape]);
        } else if (selectedShape && selectedShape.getAttr('isLocked')) {
            tr.nodes([]);
        }
        updatePropertiesPanel();
        updateLayersPanel();
        layer.batchDraw();
    }

    function deselectShape() {
        selectedShape = null;
        tr.nodes([]);
        updatePropertiesPanel();
        updateLayersPanel();
        layer.batchDraw();
    }

    function addShapeToLayer(shape) {
        shape.id(`${shape.getClassName()}_${nextElementId++}`);
        shape.setAttr('isLocked', false);
        shape.setAttr('shadowEnabled', false);
        layer.add(shape);
        selectShape(shape);
        layer.batchDraw();
    }

    // --- Event Listeners for Adding Elements ---
    addRectBtn.addEventListener('click', () => {
        const rect = new Konva.Rect({
            x: 50,
            y: 50,
            width: 100,
            height: 100,
            fill: '#FFFFFF',
            draggable: true,
            shadowColor: '#000000',
            shadowBlur: 5,
            shadowOffsetX: 5,
            shadowOffsetY: 5,
            shadowEnabled: false,
        });
        addShapeToLayer(rect);
    });

    addCircleBtn.addEventListener('click', () => {
        const circle = new Konva.Circle({
            x: 150,
            y: 150,
            radius: 50,
            fill: '#FFFFFF',
            draggable: true,
            shadowColor: '#000000',
            shadowBlur: 5,
            shadowOffsetX: 5,
            shadowOffsetY: 5,
            shadowEnabled: false,
        });
        addShapeToLayer(circle);
    });

    addTextBtn.addEventListener('click', () => {
        const textNode = new Konva.Text({
            x: 200,
            y: 100,
            text: 'Type your text here!',
            fontSize: 40,
            fontFamily: 'Arial',
            fill: '#333333',
            draggable: true,
            width: 300,
            align: 'left',
            fontStyle: 'normal', // Ensure default font style
            shadowColor: '#000000',
            shadowBlur: 5,
            shadowOffsetX: 5,
            shadowOffsetY: 5,
            shadowEnabled: false,
        });
        addShapeToLayer(textNode);
    });

    addImageBtn.addEventListener('click', () => {
        imageUpload.click();
    });

    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                const img = new Image();
                img.onload = function () {
                    let scale = 1;
                    if (img.width > 300 || img.height > 300) {
                        scale = Math.min(300 / img.width, 300 / img.height);
                    }
                    const konvaImage = new Konva.Image({
                        x: 100,
                        y: 100,
                        image: img,
                        width: img.width * scale,
                        height: img.height * scale,
                        draggable: true,
                        cornerRadius: 0,
                        shadowColor: '#000000',
                        shadowBlur: 5,
                        shadowOffsetX: 5,
                        shadowOffsetY: 5,
                        shadowEnabled: false,
                    });
                    addShapeToLayer(konvaImage);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    addLineBtn.addEventListener('click', () => {
        const line = new Konva.Line({
            points: [50, 200, 250, 200],
            stroke: '#000000',
            strokeWidth: 5,
            draggable: true,
            shadowColor: '#000000',
            shadowBlur: 5,
            shadowOffsetX: 5,
            shadowOffsetY: 5,
            shadowEnabled: false,
        });
        addShapeToLayer(line);
    });


    // --- Canvas Background Color ---
    bgColorPicker.addEventListener('input', (e) => {
        stage.container().style.backgroundColor = e.target.value;
    });

    // --- Properties Panel Interactions ---
    function updateShapeProperty(prop, value) {
        if (selectedShape && !selectedShape.getAttr('isLocked')) {
            selectedShape[prop](value);
            layer.batchDraw();
            if (prop === 'x' || prop === 'y' || prop === 'rotation') {
                tr.nodes([selectedShape]);
            }
            updatePropertiesPanel();
        }
    }

    propX.addEventListener('input', (e) => updateShapeProperty('x', parseFloat(e.target.value)));
    propY.addEventListener('input', (e) => updateShapeProperty('y', parseFloat(e.target.value)));
    propRotation.addEventListener('input', (e) => updateShapeProperty('rotation', parseFloat(e.target.value)));

    propFillColor.addEventListener('input', (e) => {
        if (selectedShape && (selectedShape.getClassName() === 'Rect' || selectedShape.getClassName() === 'Circle') && !selectedShape.getAttr('isLocked')) {
            selectedShape.fill(e.target.value);
            layer.batchDraw();
        }
    });

    // Text Properties
    propTextContent.addEventListener('input', (e) => {
        if (selectedShape && selectedShape.getClassName() === 'Text' && !selectedShape.getAttr('isLocked')) {
            selectedShape.text(e.target.value);
            layer.batchDraw();
            updateLayersPanel();
            quickTextArea.value = e.target.value; // Sync with scratchpad
        }
    });
    // Sync quickTextArea with selected text element
    quickTextArea.addEventListener('input', (e) => {
        if (selectedShape && selectedShape.getClassName() === 'Text' && !selectedShape.getAttr('isLocked')) {
            selectedShape.text(e.target.value);
            layer.batchDraw();
            updateLayersPanel(); // Update layer name
            propTextContent.value = e.target.value; // Sync prop panel text content
        }
    });


    propFontFamily.addEventListener('change', (e) => {
        if (selectedShape && selectedShape.getClassName() === 'Text' && !selectedShape.getAttr('isLocked')) {
            selectedShape.fontFamily(e.target.value);
            layer.batchDraw();
        }
    });
    propFontSize.addEventListener('input', (e) => {
        if (selectedShape && selectedShape.getClassName() === 'Text' && !selectedShape.getAttr('isLocked')) {
            selectedShape.fontSize(parseFloat(e.target.value));
            valFontSize.textContent = Math.round(selectedShape.fontSize());
            layer.batchDraw();
        }
    });
    propTextColor.addEventListener('input', (e) => {
        if (selectedShape && selectedShape.getClassName() === 'Text' && !selectedShape.getAttr('isLocked')) {
            selectedShape.fill(e.target.value); // For text, fill is the text color
            layer.batchDraw();
        }
    });

    function updateTextAlign(align) {
        alignLeftBtn.classList.remove('active');
        alignCenterBtn.classList.remove('active');
        alignRightBtn.classList.remove('active');
        if (align === 'left') alignLeftBtn.classList.add('active');
        else if (align === 'center') alignCenterBtn.classList.add('active');
        else if (align === 'right') alignRightBtn.classList.add('active');
    }

    alignLeftBtn.addEventListener('click', () => {
        if (selectedShape && selectedShape.getClassName() === 'Text' && !selectedShape.getAttr('isLocked')) {
            selectedShape.align('left');
            layer.batchDraw();
            updateTextAlign('left');
        }
    });
    alignCenterBtn.addEventListener('click', () => {
        if (selectedShape && selectedShape.getClassName() === 'Text' && !selectedShape.getAttr('isLocked')) {
            selectedShape.align('center');
            layer.batchDraw();
            updateTextAlign('center');
        }
    });
    alignRightBtn.addEventListener('click', () => {
        if (selectedShape && selectedShape.getClassName() === 'Text' && !selectedShape.getAttr('isLocked')) {
            selectedShape.align('right');
            layer.batchDraw();
            updateTextAlign('right');
        }
    });

    function updateFontStyles(fontStyle) {
        toggleBoldBtn.classList.remove('active');
        toggleItalicBtn.classList.remove('active');
        if (fontStyle.includes('bold')) toggleBoldBtn.classList.add('active');
        if (fontStyle.includes('italic')) toggleItalicBtn.classList.add('active');
    }

    toggleBoldBtn.addEventListener('click', () => {
        if (selectedShape && selectedShape.getClassName() === 'Text' && !selectedShape.getAttr('isLocked')) {
            let currentStyle = selectedShape.fontStyle();
            if (currentStyle.includes('bold')) {
                currentStyle = currentStyle.replace('bold', '').trim();
            } else {
                currentStyle += ' bold';
            }
            selectedShape.fontStyle(currentStyle.trim());
            layer.batchDraw();
            updateFontStyles(selectedShape.fontStyle());
        }
    });

    toggleItalicBtn.addEventListener('click', () => {
        if (selectedShape && selectedShape.getClassName() === 'Text' && !selectedShape.getAttr('isLocked')) {
            let currentStyle = selectedShape.fontStyle();
            if (currentStyle.includes('italic')) {
                currentStyle = currentStyle.replace('italic', '').trim();
            } else {
                currentStyle += ' italic';
            }
            selectedShape.fontStyle(currentStyle.trim());
            layer.batchDraw();
            updateFontStyles(selectedShape.fontStyle());
        }
    });


    // Image Properties
    propCornerRadius.addEventListener('input', (e) => {
        if (selectedShape && selectedShape.getClassName() === 'Image' && !selectedShape.getAttr('isLocked')) {
            selectedShape.cornerRadius(parseFloat(e.target.value)); // Use parseFloat for consistency
            valCornerRadius.textContent = Math.round(selectedShape.cornerRadius());
            layer.batchDraw();
        }
    });

    // Line Properties
    propLineLength.addEventListener('input', (e) => {
        if (selectedShape && selectedShape.getClassName() === 'Line' && !selectedShape.getAttr('isLocked')) {
            const currentPoints = selectedShape.points();
            // This logic assumes horizontal line, for general lines, length changes via transform
            // For simple line length, assuming first point is fixed and second point x changes
            const startX = currentPoints[0];
            const startY = currentPoints[1];
            const newLength = parseFloat(e.target.value);
            selectedShape.points([startX, startY, startX + newLength, startY]);
            valLineLength.textContent = Math.round(newLength);
            layer.batchDraw();
            tr.nodes([selectedShape]); // Update transformer to reflect new dimensions
        }
    });

    propLineThickness.addEventListener('input', (e) => {
        if (selectedShape && selectedShape.getClassName() === 'Line' && !selectedShape.getAttr('isLocked')) {
            selectedShape.strokeWidth(parseFloat(e.target.value));
            valLineThickness.textContent = Math.round(selectedShape.strokeWidth());
            layer.batchDraw();
        }
    });

    propLineColor.addEventListener('input', (e) => {
        if (selectedShape && selectedShape.getClassName() === 'Line' && !selectedShape.getAttr('isLocked')) {
            selectedShape.stroke(e.target.value);
            layer.batchDraw();
        }
    });


    // Shadow Properties
    function updateShadowProperties() {
        if (!selectedShape || selectedShape.getAttr('isLocked')) return;

        const enabled = shadowEnable.checked;
        selectedShape.setAttr('shadowEnabled', enabled);

        if (enabled) {
            selectedShape.setAttrs({
                shadowColor: shadowColor.value,
                shadowBlur: parseFloat(shadowBlur.value),
                shadowOffsetX: parseFloat(shadowOffsetX.value),
                shadowOffsetY: parseFloat(shadowOffsetY.value),
            });
        } else {
            // When shadow is disabled, remove the visual effect by setting properties to undefined/0
            selectedShape.setAttrs({
                shadowColor: undefined,
                shadowBlur: 0,
                shadowOffsetX: 0,
                shadowOffsetY: 0,
            });
        }
        layer.batchDraw();
        updatePropertiesPanel(); // To update disabled states of shadow controls
    }

    shadowEnable.addEventListener('change', updateShadowProperties);
    shadowColor.addEventListener('input', updateShadowProperties);
    shadowBlur.addEventListener('input', (e) => {
        valShadowBlur.textContent = Math.round(e.target.value);
        updateShadowProperties();
    });
    shadowOffsetX.addEventListener('input', (e) => {
        valShadowOffsetX.textContent = Math.round(e.target.value);
        updateShadowProperties();
    });
    shadowOffsetY.addEventListener('input', (e) => {
        valShadowOffsetY.textContent = Math.round(e.target.value);
        updateShadowProperties();
    });

    // --- Lock/Unlock (Properties Panel Button) ---
    toggleLockBtn.addEventListener('click', () => {
        if (selectedShape) {
            const isLocked = !selectedShape.getAttr('isLocked');
            selectedShape.setAttr('isLocked', isLocked);
            selectedShape.draggable(!isLocked);
            tr.nodes(isLocked ? [] : [selectedShape]);
            layer.batchDraw();
            updatePropertiesPanel();
            updateLayersPanel();
        }
    });

    // --- Layer Panel Actions ---
    function toggleLayerLock(node) {
        const isLocked = !node.getAttr('isLocked');
        node.setAttr('isLocked', isLocked);
        node.draggable(!isLocked);
        if (selectedShape === node) {
            tr.nodes(isLocked ? [] : [node]);
        }
        layer.batchDraw();
        updatePropertiesPanel();
        updateLayersPanel();
    }

    function duplicateLayer(node) {
        if (node.getAttr('isLocked')) {
            alert('Cannot duplicate locked elements.');
            return;
        }

        const clonedNode = node.clone({
            x: node.x() + 20,
            y: node.y() + 20,
            id: `${node.getClassName()}_${nextElementId++}`
        });

        if (node.getClassName() === 'Line') {
            clonedNode.points([...node.points()]);
        }
        if (clonedNode.getClassName() === 'Text') {
            clonedNode.width(node.width());
            clonedNode.height(node.height());
        }

        layer.add(clonedNode);
        clonedNode.moveToTop();
        selectShape(clonedNode);
        layer.batchDraw();
    }

    function deleteLayer(node) {
        if (node.getAttr('isLocked')) {
            alert('Cannot delete locked elements.');
            return;
        }
        if (confirm('Are you sure you want to delete this element?')) {
            if (selectedShape === node) {
                deselectShape();
            }
            node.destroy();
            layer.batchDraw();
            updateLayersPanel();
        }
    }

    moveLayerUpBtn.addEventListener('click', () => {
        if (selectedShape && !selectedShape.getAttr('isLocked')) {
            const currentIndex = selectedShape.getZIndex();
            const allShapes = layer.children.filter(node => node !== tr);
            if (currentIndex < allShapes.length -1) {
                selectedShape.moveUp();
                layer.batchDraw();
                updateLayersPanel();
            }
        } else if (selectedShape && selectedShape.getAttr('isLocked')) {
            alert('Cannot move locked elements.');
        }
    });

    moveLayerDownBtn.addEventListener('click', () => {
        if (selectedShape && !selectedShape.getAttr('isLocked')) {
            const currentIndex = selectedShape.getZIndex();
            if (currentIndex > 0) {
                selectedShape.moveDown();
                layer.batchDraw();
                updateLayersPanel();
            }
        } else if (selectedShape && selectedShape.getAttr('isLocked')) {
            alert('Cannot move locked elements.');
        }
    });


    // --- Canvas Interaction (Selection) ---
    stage.on('click tap', (e) => {
        if (e.target === stage || e.target === layer) {
            deselectShape();
            return;
        }

        const clickedOnTransformer = e.target.getParent() && e.target.getParent().className === 'Transformer';
        if (clickedOnTransformer) {
            return;
        }

        if (e.target !== selectedShape) {
            selectShape(e.target);
        }
    });

    tr.on('transformend', () => {
        // When a shape is resized or moved via transformer, update its properties
        // For text, adjust width if scaled
        if (selectedShape && selectedShape.getClassName() === 'Text') {
            // Konva Text's width is used for text wrapping/alignment.
            // When scaled, the Konva.Text node's width/height properties don't automatically update to reflect the visual size.
            // We need to re-evaluate its width based on the transformed scale.
            // However, simply setting width/height here might interfere with manual width input.
            // A more robust solution for text might involve checking if `wrap` is enabled.
            // For now, if scaling, the visual size changes but its `width` property (for alignment) might not.
            // Let's ensure if it was manually set, it stays. If scaled by TR, it should use that scale.
            // The transformer applies scale to the node, so its `width()` and `height()` will reflect the scaled size.
            // So, just calling updatePropertiesPanel() should be enough.
        } else if (selectedShape && selectedShape.getClassName() === 'Line') {
             // If line is transformed, its points are adjusted by Konva.
             // Recalculate length based on new points to update propLineLength.
             const points = selectedShape.points();
             const newLength = Math.sqrt(Math.pow(points[2] - points[0], 2) + Math.pow(points[3] - points[1], 2));
             selectedShape.setAttr('length', newLength); // Store custom length
        }
        updatePropertiesPanel();
        layer.batchDraw();
    });

    // --- Zoom Functionality ---
    zoomSlider.addEventListener('input', (e) => {
        const scale = parseFloat(e.target.value);
        stage.scale({ x: scale, y: scale });
        stage.container().style.width = `${width * scale}px`;
        stage.container().style.height = `${height * scale}px`;
        zoomValueSpan.textContent = `${Math.round(scale * 100)}%`;
        layer.batchDraw();
    });

    // --- Font Management (Simplified) ---
    propFontFamily.options[propFontFamily.options.length] = new Option('Pacifico (Web)', 'Pacifico');
    propFontFamily.options[propFontFamily.options.length] = new Option('Lobster (Web)', 'Lobster');
    propFontFamily.options[propFontFamily.options.length] = new Option('Dancing Script (Web)', 'Dancing Script');

    uploadFontBtn.addEventListener('click', () => {
        const fontFileInput = document.createElement('input');
        fontFileInput.type = 'file';
        fontFileInput.accept = '.ttf,.otf,.woff,.woff2';
        fontFileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    const fontName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
                    const fontFace = new FontFace(fontName, `url(${event.target.result})`);

                    fontFace.load().then((loadedFace) => {
                        document.fonts.add(loadedFace);
                        const newOption = new Option(fontName, fontName);
                        propFontFamily.add(newOption);
                        alert(`Font '${fontName}' loaded successfully!`);

                        const style = document.createElement('style');
                        style.textContent = `@font-face { font-family: '${fontName}'; src: url(${event.target.result}) format('${file.name.split('.').pop()}'); }`;
                        document.head.appendChild(style);

                    }).catch(error => {
                        alert(`Error loading font: ${error.message}`);
                    });
                };
                reader.readAsDataURL(file);
            }
        };
        fontFileInput.click();
    });

    // --- Download WebP ---
    downloadWebPBtn.addEventListener('click', () => {
        tr.nodes([]);
        layer.batchDraw();

        const currentScale = stage.scaleX();
        stage.scale({ x: 1, y: 1 });
        stage.width(width);
        stage.height(height);

        const dataURL = stage.toDataURL({
            mimeType: 'image/webp',
            quality: 0.8
        });

        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
        a.href = dataURL;
        a.download = `VACANCY_HAI_ONLINE_${timestamp}.webp`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        stage.scale({ x: currentScale, y: currentScale });
        stage.width(width * currentScale);
        stage.height(height * currentScale);
        if (selectedShape && !selectedShape.getAttr('isLocked')) {
            tr.nodes([selectedShape]);
        }
        layer.batchDraw();
    });


    // --- Initial Setup ---
    updatePropertiesPanel();
    updateLayersPanel();
    stage.container().style.backgroundColor = bgColorPicker.value;
});
