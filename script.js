document.addEventListener('DOMContentLoaded', () => {
    // --- Core Konva Setup ---
    const CANVAS_WIDTH = 640;
    const CANVAS_HEIGHT = 415;
    const stage = new Konva.Stage({
        container: 'konvaContainer',
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
    });
    const layer = new Konva.Layer();
    stage.add(layer);

    // Transformer for resizing and rotating elements
    const transformer = new Konva.Transformer();
    layer.add(transformer);

    // --- UI Element References ---
    // Top Bar
    const bgColorPicker = document.getElementById('bgColorPicker');
    const downloadWebPBtn = document.getElementById('downloadWebPBtn');
    const zoomSlider = document.getElementById('zoomSlider');
    const zoomValueSpan = document.getElementById('zoomValue');

    // Left Sidebar (Tools & Scratchpad)
    const addRectBtn = document.getElementById('addRectBtn');
    const addCircleBtn = document.getElementById('addCircleBtn');
    const addTextBtn = document.getElementById('addTextBtn');
    const imageUpload = document.getElementById('imageUpload');
    const addImageBtn = document.getElementById('addImageBtn');
    const addLineBtn = document.getElementById('addLineBtn');
    const uploadFontBtn = document.getElementById('uploadFontBtn');
    const quickTextArea = document.getElementById('quickTextArea'); // User's requested scratchpad

    // Right Sidebar (Properties & Layers)
    const noElementSelectedMsg = document.getElementById('noElementSelected');
    const elementPropertiesDiv = document.getElementById('elementProperties');
    const propX = document.getElementById('propX');
    const valX = document.getElementById('valX');
    const propY = document.getElementById('propY');
    const valY = document.getElementById('valY');
    const propRotation = document.getElementById('propRotation');
    const valRotation = document.getElementById('valRotation');
    const propFillColorGroup = document.getElementById('propFillColorGroup'); // Group for visibility control
    const propFillColor = document.getElementById('propFillColor');

    // Text Specific Properties
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

    // Image Specific Properties
    const imagePropertiesDiv = document.getElementById('imageProperties');
    const propCornerRadius = document.getElementById('propCornerRadius');
    const valCornerRadius = document.getElementById('valCornerRadius');

    // Line Specific Properties
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

    const toggleLockBtn = document.getElementById('toggleLock');

    // Layers Panel
    const layersList = document.getElementById('layersList');
    const moveLayerUpBtn = document.getElementById('moveLayerUp');
    const moveLayerDownBtn = document.getElementById('moveLayerDown');

    // --- State Variables ---
    let selectedShape = null; // Currently active Konva node
    let nextElementId = 1; // Unique ID for new elements

    // --- Helper Functions ---

    /**
     * Updates the visibility and values of the properties panel based on the selected shape.
     */
    function updatePropertiesPanel() {
        if (!selectedShape) {
            noElementSelectedMsg.classList.remove('hidden');
            elementPropertiesDiv.classList.add('hidden');
            return;
        }

        noElementSelectedMsg.classList.add('hidden');
        elementPropertiesDiv.classList.remove('hidden');

        const isLocked = selectedShape.getAttr('isLocked') || false;
        const disableControls = isLocked;

        // Reset visibility of all type-specific property sections
        propFillColorGroup.classList.add('hidden');
        textPropertiesDiv.classList.add('hidden');
        imagePropertiesDiv.classList.add('hidden');
        linePropertiesDiv.classList.add('hidden');

        // Update common properties
        propX.value = selectedShape.x();
        valX.textContent = Math.round(selectedShape.x());
        propY.value = selectedShape.y();
        valY.textContent = Math.round(selectedShape.y());
        propRotation.value = selectedShape.rotation();
        valRotation.textContent = Math.round(selectedShape.rotation());

        propX.disabled = disableControls;
        propY.disabled = disableControls;
        propRotation.disabled = disableControls;

        // Update element-specific properties
        const className = selectedShape.getClassName();
        if (className === 'Rect' || className === 'Circle') {
            propFillColorGroup.classList.remove('hidden');
            propFillColor.value = selectedShape.fill();
            propFillColor.disabled = disableControls;
        } else if (className === 'Text') {
            textPropertiesDiv.classList.remove('hidden');
            propTextContent.value = selectedShape.text();
            propFontFamily.value = selectedShape.fontFamily();
            propFontSize.value = selectedShape.fontSize();
            valFontSize.textContent = Math.round(selectedShape.fontSize());
            propTextColor.value = selectedShape.fill(); // Text color is 'fill' for Konva.Text
            updateFontStyles(selectedShape.fontStyle());
            updateTextAlign(selectedShape.align());

            propTextContent.disabled = disableControls;
            propFontFamily.disabled = disableControls;
            propFontSize.disabled = disableControls;
            propTextColor.disabled = disableControls;
            alignLeftBtn.disabled = disableControls;
            alignCenterBtn.disabled = disableControls;
            alignRightBtn.disabled = disableControls;
            toggleBoldBtn.disabled = disableControls;
            toggleItalicBtn.disabled = disableControls;
        } else if (className === 'Image') {
            imagePropertiesDiv.classList.remove('hidden');
            propCornerRadius.value = selectedShape.cornerRadius();
            valCornerRadius.textContent = Math.round(selectedShape.cornerRadius());
            propCornerRadius.disabled = disableControls;
        } else if (className === 'Line') {
            linePropertiesDiv.classList.remove('hidden');
            const points = selectedShape.points();
            // Calculate current length for display in UI
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
        const shadowEnabled = selectedShape.getAttr('shadowEnabled') || false;
        const shadow = shadowEnabled ? selectedShape.getAttrs() : {};

        shadowEnable.checked = shadowEnabled;
        shadowColor.value = shadow.shadowColor || '#000000';
        shadowBlur.value = shadow.shadowBlur || 0;
        valShadowBlur.textContent = Math.round(shadow.shadowBlur || 0);
        shadowOffsetX.value = shadow.shadowOffsetX || 0;
        valShadowOffsetX.textContent = Math.round(shadow.shadowOffsetX || 0);
        shadowOffsetY.value = shadow.shadowOffsetY || 0;
        valShadowOffsetY.textContent = Math.round(shadow.shadowOffsetY || 0);

        // Disable shadow controls if shadow is not enabled or element is locked
        const shadowControlsDisabled = disableControls || !shadowEnabled;
        shadowColor.disabled = shadowControlsDisabled;
        shadowBlur.disabled = shadowControlsDisabled;
        shadowOffsetX.disabled = shadowControlsDisabled;
        shadowOffsetY.disabled = shadowControlsDisabled;

        // Update Lock/Unlock button text
        toggleLockBtn.textContent = isLocked ? 'Unlock Element' : 'Lock Element';
        toggleLockBtn.disabled = false; // Always allow toggling lock
    }

    /**
     * Updates the layers panel to reflect the current order and selection.
     */
    function updateLayersPanel() {
        layersList.innerHTML = '';
        const nodes = layer.children.filter(node => node !== transformer); // Get all shapes, excluding the transformer

        if (nodes.length === 0) {
            layersList.innerHTML = '<li class="info-message">No layers yet. Add elements to see them here.</li>';
            moveLayerUpBtn.disabled = true;
            moveLayerDownBtn.disabled = true;
            return;
        }

        // Iterate in reverse order to display top layers at the top of the list
        for (let i = nodes.length - 1; i >= 0; i--) {
            const node = nodes[i];
            const li = document.createElement('li');
            li.dataset.id = node.id(); // Store Konva node ID for reference

            let icon = '❓';
            let name = 'Unknown';
            const className = node.getClassName();
            if (className === 'Rect') {
                icon = '⬛';
                name = 'Rectangle';
            } else if (className === 'Circle') {
                icon = '🔵';
                name = 'Circle';
            } else if (className === 'Text') {
                icon = '🅰️';
                // Show a snippet of the text content, max 20 chars
                name = node.text().substring(0, 20) + (node.text().length > 20 ? '...' : '') || 'Text';
            } else if (className === 'Image') {
                icon = '🖼️';
                name = 'Image';
            } else if (className === 'Line') {
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

            // Event Listeners for layer items and their buttons
            li.addEventListener('click', (e) => {
                // If a button inside the list item was clicked, prevent selecting the shape itself
                if (e.target.tagName === 'BUTTON') return;
                selectShape(node);
            });

            li.querySelector('.layer-lock-btn').addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent li click from re-selecting on button click
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

        // Enable/disable layer movement buttons based on selection and position
        if (selectedShape) {
            const currentZIndex = selectedShape.getZIndex();
            const totalShapes = nodes.length;
            moveLayerUpBtn.disabled = currentZIndex >= totalShapes - 1 || selectedShape.getAttr('isLocked');
            moveLayerDownBtn.disabled = currentZIndex <= 0 || selectedShape.getAttr('isLocked');
        } else {
            moveLayerUpBtn.disabled = true;
            moveLayerDownBtn.disabled = true;
        }
        layer.batchDraw(); // Redraw Konva layer
    }

    /**
     * Selects a Konva shape, attaches transformer, and updates UI panels.
     * @param {Konva.Shape} shape - The shape to be selected.
     */
    function selectShape(shape) {
        if (selectedShape && selectedShape !== shape) {
            // Deselect previous shape
            transformer.nodes([]);
        }
        selectedShape = shape;
        if (selectedShape && !selectedShape.getAttr('isLocked')) {
            transformer.nodes([selectedShape]);
        } else { // If newly selected shape is locked or no shape
            transformer.nodes([]);
        }
        updatePropertiesPanel();
        updateLayersPanel(); // Highlight selected layer in list
        layer.batchDraw();
    }

    /**
     * Deselects the current shape and updates UI panels.
     */
    function deselectShape() {
        selectedShape = null;
        transformer.nodes([]);
        updatePropertiesPanel();
        updateLayersPanel();
        layer.batchDraw();
    }

    /**
     * Adds a new shape to the Konva layer and selects it.
     * @param {Konva.Shape} shape - The shape to add.
     */
    function addShapeToLayer(shape) {
        // Assign unique ID and custom properties
        shape.id(`${shape.getClassName()}_${nextElementId++}`);
        shape.setAttr('isLocked', false);
        shape.setAttr('shadowEnabled', false); // Custom property for shadow toggle
        layer.add(shape);
        selectShape(shape); // Select the newly added shape
    }

    /**
     * Updates the active/inactive state of text alignment buttons.
     * @param {string} align - The current text alignment ('left', 'center', 'right').
     */
    function updateTextAlign(align) {
        alignLeftBtn.classList.remove('active');
        alignCenterBtn.classList.remove('active');
        alignRightBtn.classList.remove('active');
        if (align === 'left') alignLeftBtn.classList.add('active');
        else if (align === 'center') alignCenterBtn.classList.add('active');
        else if (align === 'right') alignRightBtn.classList.add('active');
    }

    /**
     * Updates the active/inactive state of font style buttons.
     * @param {string} fontStyle - The current font style string (e.g., 'bold italic').
     */
    function updateFontStyles(fontStyle) {
        toggleBoldBtn.classList.remove('active');
        toggleItalicBtn.classList.remove('active');
        if (fontStyle.includes('bold')) toggleBoldBtn.classList.add('active');
        if (fontStyle.includes('italic')) toggleItalicBtn.classList.add('active');
    }

    // --- Event Listeners for Adding Elements ---
    addRectBtn.addEventListener('click', () => {
        const rect = new Konva.Rect({
            x: 50,
            y: 50,
            width: 100,
            height: 100,
            fill: '#FFFFFF', // Default white
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
            width: 300, // For alignment and wrapping
            align: 'left',
            fontStyle: 'normal',
            shadowColor: '#000000',
            shadowBlur: 5,
            shadowOffsetX: 5,
            shadowOffsetY: 5,
            shadowEnabled: false,
        });
        addShapeToLayer(textNode);
    });

    addImageBtn.addEventListener('click', () => {
        imageUpload.click(); // Trigger hidden file input
    });

    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                const img = new Image();
                img.onload = function () {
                    // Scale image if too large for initial display
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
                        cornerRadius: 0, // Default no rounded corners
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
            points: [50, 200, 250, 200], // Default horizontal line
            stroke: '#000000', // Default black
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

    // Common properties (X, Y, Rotation)
    propX.addEventListener('input', (e) => {
        if (selectedShape && !selectedShape.getAttr('isLocked')) {
            selectedShape.x(parseFloat(e.target.value));
            valX.textContent = Math.round(selectedShape.x());
            transformer.nodes([selectedShape]); // Re-apply transformer to update its position
            layer.batchDraw();
        }
    });
    propY.addEventListener('input', (e) => {
        if (selectedShape && !selectedShape.getAttr('isLocked')) {
            selectedShape.y(parseFloat(e.target.value));
            valY.textContent = Math.round(selectedShape.y());
            transformer.nodes([selectedShape]); // Re-apply transformer to update its position
            layer.batchDraw();
        }
    });
    propRotation.addEventListener('input', (e) => {
        if (selectedShape && !selectedShape.getAttr('isLocked')) {
            selectedShape.rotation(parseFloat(e.target.value));
            valRotation.textContent = Math.round(selectedShape.rotation());
            transformer.nodes([selectedShape]); // Re-apply transformer to update its rotation
            layer.batchDraw();
        }
    });

    // Fill Color (for Rect/Circle)
    propFillColor.addEventListener('input', (e) => {
        if (selectedShape && (selectedShape.getClassName() === 'Rect' || selectedShape.getClassName() === 'Circle') && !selectedShape.getAttr('isLocked')) {
            selectedShape.fill(e.target.value);
            layer.batchDraw();
        }
    });

    // Text Specific Properties
    propTextContent.addEventListener('input', (e) => {
        if (selectedShape && selectedShape.getClassName() === 'Text' && !selectedShape.getAttr('isLocked')) {
            selectedShape.text(e.target.value);
            layer.batchDraw();
            updateLayersPanel(); // Update layer name if text content changes
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
            selectedShape.fill(e.target.value); // Text color is 'fill' for Konva.Text
            layer.batchDraw();
        }
    });
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

    // Image Specific Properties
    propCornerRadius.addEventListener('input', (e) => {
        if (selectedShape && selectedShape.getClassName() === 'Image' && !selectedShape.getAttr('isLocked')) {
            selectedShape.cornerRadius(parseFloat(e.target.value));
            valCornerRadius.textContent = Math.round(selectedShape.cornerRadius());
            layer.batchDraw();
        }
    });

    // Line Specific Properties
    propLineLength.addEventListener('input', (e) => {
        if (selectedShape && selectedShape.getClassName() === 'Line' && !selectedShape.getAttr('isLocked')) {
            const currentPoints = selectedShape.points();
            const startX = currentPoints[0];
            const startY = currentPoints[1];
            const newLength = parseFloat(e.target.value);
            // This assumes changing the second point's X to adjust length (horizontal line)
            selectedShape.points([startX, startY, startX + newLength, startY]);
            valLineLength.textContent = Math.round(newLength);
            layer.batchDraw();
            transformer.nodes([selectedShape]); // Update transformer to reflect new dimensions
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
    function handleShadowPropertyChange() {
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
            // When shadow is disabled, remove the visual effect
            selectedShape.setAttrs({
                shadowColor: undefined, // Konva will remove shadow if color is undefined
                shadowBlur: 0,
                shadowOffsetX: 0,
                shadowOffsetY: 0,
            });
        }
        layer.batchDraw();
        updatePropertiesPanel(); // Re-enable/disable controls
    }

    shadowEnable.addEventListener('change', handleShadowPropertyChange);
    shadowColor.addEventListener('input', handleShadowPropertyChange);
    shadowBlur.addEventListener('input', (e) => {
        valShadowBlur.textContent = Math.round(e.target.value);
        handleShadowPropertyChange();
    });
    shadowOffsetX.addEventListener('input', (e) => {
        valShadowOffsetX.textContent = Math.round(e.target.value);
        handleShadowPropertyChange();
    });
    shadowOffsetY.addEventListener('input', (e) => {
        valShadowOffsetY.textContent = Math.round(e.target.value);
        handleShadowPropertyChange();
    });

    // --- Lock/Unlock Button (Properties Panel) ---
    toggleLockBtn.addEventListener('click', () => {
        if (selectedShape) {
            const isLocked = !selectedShape.getAttr('isLocked');
            selectedShape.setAttr('isLocked', isLocked);
            selectedShape.draggable(!isLocked); // Disable Konva dragging for locked elements
            transformer.nodes(isLocked ? [] : [selectedShape]); // Remove transformer if locked
            layer.batchDraw();
            updatePropertiesPanel();
            updateLayersPanel(); // To update lock icon in layers list
        }
    });

    // --- Layer Panel Actions ---
    function toggleLayerLock(node) {
        const isLocked = !node.getAttr('isLocked');
        node.setAttr('isLocked', isLocked);
        node.draggable(!isLocked);
        if (selectedShape === node) { // If currently selected, update transformer
            transformer.nodes(isLocked ? [] : [node]);
        }
        layer.batchDraw();
        updatePropertiesPanel(); // Update properties panel disabled state
        updateLayersPanel(); // Update lock icon and button states
    }

    function duplicateLayer(node) {
        if (node.getAttr('isLocked')) {
            alert('Cannot duplicate locked elements.');
            return;
        }

        const clonedNode = node.clone({
            x: node.x() + 20, // Offset new clone slightly
            y: node.y() + 20,
            id: `${node.getClassName()}_${nextElementId++}` // New unique ID
        });

        // Special handling for specific node types if needed (e.g., deep cloning arrays)
        if (node.getClassName() === 'Line') {
            clonedNode.points([...node.points()]); // Copy points array
        }
        // If it's a text node, ensure its width/height are also cloned for layout
        if (clonedNode.getClassName() === 'Text') {
            clonedNode.width(node.width());
            clonedNode.height(node.height());
        }

        layer.add(clonedNode);
        clonedNode.moveToTop(); // Bring cloned layer to top
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
                deselectShape(); // Deselect if deleting current
            }
            node.destroy(); // Remove from Konva layer
            layer.batchDraw();
            updateLayersPanel(); // Update the list
        }
    }

    moveLayerUpBtn.addEventListener('click', () => {
        if (selectedShape && !selectedShape.getAttr('isLocked')) {
            selectedShape.moveUp();
            layer.batchDraw();
            updateLayersPanel(); // To reflect new order
        } else if (selectedShape && selectedShape.getAttr('isLocked')) {
            alert('Cannot move locked elements.');
        }
    });

    moveLayerDownBtn.addEventListener('click', () => {
        if (selectedShape && !selectedShape.getAttr('isLocked')) {
            selectedShape.moveDown();
            layer.batchDraw();
            updateLayersPanel(); // To reflect new order
        } else if (selectedShape && selectedShape.getAttr('isLocked')) {
            alert('Cannot move locked elements.');
        }
    });


    // --- Canvas Interaction (Selection & Transformation) ---
    stage.on('click tap', (e) => {
        // If click on empty stage or layer, deselect
        if (e.target === stage || e.target === layer) {
            deselectShape();
            return;
        }

        // If clicked on the transformer itself, do nothing, as it's part of the selection mechanism
        const clickedOnTransformer = e.target.getParent() && e.target.getParent().className === 'Transformer';
        if (clickedOnTransformer) {
            return;
        }

        // If clicked on a shape that's not currently selected, select it
        if (e.target !== selectedShape) {
            selectShape(e.target);
        }
        // If clicked on already selected shape, do nothing
    });

    // Update properties panel when shape is transformed (resized, rotated, moved via transformer)
    transformer.on('transformend', () => {
        // Konva updates node's x, y, width, height, rotation directly on transform
        // For lines, recalculate length if its points are adjusted by transform
        if (selectedShape && selectedShape.getClassName() === 'Line') {
             const points = selectedShape.points();
             const newLength = Math.sqrt(Math.pow(points[2] - points[0], 2) + Math.pow(points[3] - points[1], 2));
             // You could store this as a custom attribute if you want to persist it
             // selectedShape.setAttr('currentLength', newLength);
        }
        updatePropertiesPanel(); // Refresh panel to show new values
        layer.batchDraw();
    });

    // Update properties panel when shape is dragged
    layer.on('dragend', () => {
        if (selectedShape) {
            updatePropertiesPanel(); // Refresh panel to show new X, Y
        }
    });


    // --- Zoom Functionality ---
    zoomSlider.addEventListener('input', (e) => {
        const scale = parseFloat(e.target.value);
        stage.scale({ x: scale, y: scale });
        // Adjust stage container size to prevent scrollbars from appearing immediately if zoomed in
        stage.container().style.width = `${CANVAS_WIDTH * scale}px`;
        stage.container().style.height = `${CANVAS_HEIGHT * scale}px`;
        zoomValueSpan.textContent = `${Math.round(scale * 100)}%`;
        layer.batchDraw();
    });

    // --- Font Management (Simplified) ---
    // Add Google Fonts to the font dropdown initially
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
                    const fontName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_'); // Basic name clean-up
                    const fontFace = new FontFace(fontName, `url(${event.target.result})`);

                    fontFace.load().then((loadedFace) => {
                        document.fonts.add(loadedFace);
                        const newOption = new Option(fontName, fontName);
                        propFontFamily.add(newOption);
                        alert(`Font '${fontName}' loaded successfully! It is now available in the font dropdown.`);

                        // Create a temporary style rule to ensure the font is applied if selected
                        const style = document.createElement('style');
                        style.textContent = `@font-face { font-family: '${fontName}'; src: url(${event.target.result}) format('${file.name.split('.').pop()}'); }`;
                        document.head.appendChild(style);

                    }).catch(error => {
                        alert(`Error loading font: ${error.message}. Please ensure it's a valid font file.`);
                    });
                };
                reader.readAsDataURL(file);
            }
        };
        fontFileInput.click();
    });

    // --- Download WebP ---
    downloadWebPBtn.addEventListener('click', () => {
        // Temporarily remove transformer to avoid it being in the image
        transformer.nodes([]);
        layer.batchDraw();

        // Save current stage scale and dimensions
        const currentScale = stage.scaleX();
        const originalWidth = stage.width();
        const originalHeight = stage.height();

        // Reset scale to 100% for download to get original size rendering
        stage.scale({ x: 1, y: 1 });
        stage.width(CANVAS_WIDTH);
        stage.height(CANVAS_HEIGHT);

        // Get data URL as WebP
        const dataURL = stage.toDataURL({
            mimeType: 'image/webp',
            quality: 0.8 // Adjust quality (0 to 1) for file size
        });

        // Create a temporary link and trigger download
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
        a.href = dataURL;
        a.download = `VACANCY_HAI_ONLINE_Design_${timestamp}.webp`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Restore original scale and transformer
        stage.scale({ x: currentScale, y: currentScale });
        stage.width(originalWidth);
        stage.height(originalHeight);
        if (selectedShape && !selectedShape.getAttr('isLocked')) {
            transformer.nodes([selectedShape]);
        }
        layer.batchDraw();
    });


    // --- Initial Setup on Load ---
    updatePropertiesPanel(); // Initialize properties panel state
    updateLayersPanel(); // Initialize layers panel state
    stage.container().style.backgroundColor = bgColorPicker.value; // Set initial canvas background
});
