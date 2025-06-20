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
    const transformer = new Konva.Transformer({
        enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'], // Allow standard resizing
        rotateEnabled: true,
        // Custom boundBoxFunc to handle text resizing without stretching
        boundBoxFunc: (oldBox, newBox) => {
            const MIN_SIZE = 10; // Minimum dimension for any shape/text
            if (newBox.width < MIN_SIZE || newBox.height < MIN_SIZE) {
                return oldBox; // Prevent resizing below min size
            }

            // Special handling for Text nodes to control font size proportionally
            if (selectedShape && selectedShape.getClassName() === 'Text') {
                const textNode = selectedShape;

                // We need to determine the new font size based on the new width,
                // while ensuring the text itself scales proportionally.
                // The key is to map the visual width of the text to the transformer's width.

                const currentTextWidth = textNode._getTextWidth(); // Get actual rendered text width
                const currentFontSize = textNode.fontSize();

                // Calculate the new font size based on the ratio of new transformer width to current text width
                // We're essentially trying to make the transformer's newBox.width reflect the new visual text width
                let newFontSize = currentFontSize * (newBox.width / currentTextWidth);

                // Apply minimum font size to prevent disappearance
                const MIN_FONT_SIZE = 8; // A reasonable minimum font size
                if (newFontSize < MIN_FONT_SIZE) {
                    newFontSize = MIN_FONT_SIZE;
                    // If font size hits minimum, adjust the newBox.width to match the visual width at min font size
                    // This prevents the transformer handles from being too far out.
                    // We need to temporarily set the font size to calculate the corresponding width.
                    const tempText = textNode.clone({ fontSize: MIN_FONT_SIZE });
                    newBox.width = tempText._getTextWidth();
                    tempText.destroy(); // Clean up temporary node
                }

                // Apply the new font size
                textNode.fontSize(newFontSize);
                // Set the text node's width to its calculated content width
                // This makes the internal Konva text width match the visual width.
                textNode.width(textNode._getTextWidth());
                textNode.height('auto'); // Let Konva recalculate height based on new font size and width

                // Reset scale to 1 to prevent double scaling from transformer
                textNode.scaleX(1);
                textNode.scaleY(1);

                // Return the new bounding box for the transformer based on the text node's updated dimensions
                return {
                    width: textNode.width(), // The actual width after font size adjustment
                    height: textNode.height(),
                    x: newBox.x,
                    y: newBox.y,
                    rotation: newBox.rotation
                };
            }
            return newBox; // For other shapes, return the new box as is
        }
    });
    layer.add(transformer);

    // --- UI Element References ---
    // Top Bar
    const bgColorPicker = document.getElementById('bgColorPicker');
    const downloadWebPBtn = document.getElementById('downloadWebPBtn');

    // Top Bar (Tools)
    const addRectBtn = document.getElementById('addRectBtn');
    const addCircleBtn = document.getElementById('addCircleBtn'); // Renamed to addEllipseBtn logically
    const addTextBtn = document.getElementById('addTextBtn');
    const imageUpload = document.getElementById('imageUpload');
    const addImageBtn = document.getElementById('addImageBtn');
    const addLineBtn = document.getElementById('addLineBtn');
    const uploadFontBtn = document.getElementById('uploadFontBtn');
    const fontUpload = document.getElementById('fontUpload'); // New: for multiple font uploads

    // Scratchpad
    const quickTextArea = document.getElementById('quickTextArea');

    // Left Sidebar (Properties)
    const noElementSelectedMsg = document.getElementById('noElementSelected');
    const elementPropertiesDiv = document.getElementById('elementProperties');
    const propX = document.getElementById('propX');
    const valX = document.getElementById('valX');
    const propY = document.getElementById('propY');
    const valY = document.getElementById('valY');
    const propRotation = document.getElementById('propRotation');
    const valRotation = document.getElementById('valRotation');
    const propFillColorGroup = document.getElementById('propFillColorGroup');
    const propFillColor = document.getElementById('propFillColor');

    // Rounded Corner Property (for Rect and Image)
    const propCornerRadiusGroup = document.getElementById('propCornerRadiusGroup');
    const propCornerRadius = document.getElementById('propCornerRadius');
    const valCornerRadius = document.getElementById('valCornerRadius');

    // Text Specific Properties
    const textPropertiesDiv = document.getElementById('textProperties');
    const propTextContent = document.getElementById('propTextContent');
    const propFontFamily = document.getElementById('propFontFamily');
    const propTextColor = document.getElementById('propTextColor');
    const alignLeftBtn = document.getElementById('alignLeft');
    const alignCenterBtn = document.getElementById('alignCenter');
    const alignRightBtn = document.getElementById('alignRight');
    const toggleBoldBtn = document.getElementById('toggleBold');
    const toggleItalicBtn = document.getElementById('toggleItalic');

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

    // Right Sidebar (Layers)
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
        propCornerRadiusGroup.classList.add('hidden');
        textPropertiesDiv.classList.add('hidden');
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
        if (className === 'Rect') {
            propFillColorGroup.classList.remove('hidden');
            propFillColor.value = selectedShape.fill();
            propFillColor.disabled = disableControls;

            propCornerRadiusGroup.classList.remove('hidden');
            propCornerRadius.value = selectedShape.cornerRadius();
            valCornerRadius.textContent = Math.round(selectedShape.cornerRadius());
            propCornerRadius.disabled = disableControls;

        } else if (className === 'Circle') { // Konva Circle is actually an Ellipse
            propFillColorGroup.classList.remove('hidden');
            propFillColor.value = selectedShape.fill();
            propFillColor.disabled = disableControls;

            propCornerRadiusGroup.classList.remove('hidden');
            propCornerRadius.value = selectedShape.radiusX(); // Use radiusX for "roundedness"
            valCornerRadius.textContent = Math.round(selectedShape.radiusX());
            propCornerRadius.disabled = disableControls;

        } else if (className === 'Text') {
            textPropertiesDiv.classList.remove('hidden');
            propTextContent.value = selectedShape.text();
            propFontFamily.value = selectedShape.fontFamily();
            propTextColor.value = selectedShape.fill(); // Text color is 'fill' for Konva.Text
            updateFontStyles(selectedShape.fontStyle());
            updateTextAlign(selectedShape.align());

            propTextContent.disabled = disableControls;
            propFontFamily.disabled = disableControls;
            propTextColor.disabled = disableControls;
            alignLeftBtn.disabled = disableControls;
            alignCenterBtn.disabled = disableControls;
            alignRightBtn.disabled = disableControls;
            toggleBoldBtn.disabled = disableControls;
            toggleItalicBtn.disabled = disableControls;
        } else if (className === 'Image') {
            // Image now uses common corner radius group
            propCornerRadiusGroup.classList.remove('hidden');
            propCornerRadius.value = selectedShape.cornerRadius();
            valCornerRadius.textContent = Math.round(selectedShape.cornerRadius());
            propCornerRadius.disabled = disableControls;
        } else if (className === 'Line') {
            linePropertiesDiv.classList.remove('hidden');
            const points = selectedShape.points();
            // Calculate current length for display in UI (assuming horizontal for prop)
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
        shadowEnable.disabled = disableControls; // Shadow enable/disable checkbox itself can be disabled if locked
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
            } else if (className === 'Circle') { // Konva Circle (Ellipse)
                icon = '🔵';
                name = 'Ellipse';
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
            const disableButtons = isLocked ? 'disabled' : ''; // For duplicate and delete

            li.innerHTML = `
                <span class="layer-icon">${icon}</span>
                <span class="layer-name">${name}</span>
                <div class="layer-actions">
                    <button class="layer-lock-btn" title="${lockTitle}">${lockIcon}</button>
                    <button class="layer-dup-btn" title="Duplicate" ${disableButtons}>📋</button>
                    <button class="layer-del-btn" title="Delete" ${disableButtons}>✖️</button>
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
            transformer.moveToTop(); // Ensure transformer is always on top
            // IMPORTANT: For text, update the transformer's width to match the *actual* text width
            // This is crucial after selection if its width property was not accurately reflecting visual width
            if (selectedShape.getClassName() === 'Text') {
                selectedShape.width(selectedShape._getTextWidth());
                selectedShape.height('auto'); // Ensure height is recalculated for rap
            }
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
        // Ensure all new shapes have these properties for consistent shadow behavior
        shape.setAttrs({
            shadowColor: '#000000',
            shadowBlur: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            shadowEnabled: false, // Custom property for shadow toggle
        });

        layer.add(shape);
        // Special handling after adding to layer to get accurate dimensions for Text
        if (shape.getClassName() === 'Text') {
            // After adding to layer, Konva calculates its intrinsic size.
            // Set its width property to its actual rendered width,
            // which will then be used by the transformer.
            shape.width(shape._getTextWidth());
            shape.height('auto'); // Let Konva auto-calculate height
        }
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
            cornerRadius: 0, // Default no rounded corners
        });
        addShapeToLayer(rect);
    });

    addCircleBtn.addEventListener('click', () => { // Now adds an Ellipse
        const ellipse = new Konva.Circle({ // Konva.Circle is actually an ellipse
            x: 150,
            y: 150,
            radiusX: 50, // Default horizontal radius
            radiusY: 50, // Default vertical radius
            fill: '#FFFFFF',
            draggable: true,
        });
        addShapeToLayer(ellipse);
    });

    addTextBtn.addEventListener('click', () => {
        const initialText = 'Type your text here!';
        const initialFontSize = 40;
        const initialFontFamily = 'Arial';

        const textNode = new Konva.Text({
            x: 200,
            y: 100,
            text: initialText,
            fontSize: initialFontSize,
            fontFamily: initialFontFamily,
            fill: '#333333',
            draggable: true,
            // Do NOT set a fixed 'width' here initially. Konva will calculate it.
            // We'll adjust it in addShapeToLayer after it's added.
            align: 'left',
            fontStyle: 'normal',
            wrap: 'word', // Enable word wrapping
        });

        addShapeToLayer(textNode);
        // After adding, selectShape will call textNode.width(textNode._getTextWidth())
        // to set the precise initial width for the transformer.
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
            lineCap: 'round', // Makes line ends rounded
            lineJoin: 'round',
        });
        addShapeToLayer(line);
    });

    // --- Canvas Background Color ---
    bgColorPicker.addEventListener('input', (e) => {
        document.getElementById('konvaContainer').style.backgroundColor = e.target.value;
    });

    // --- Properties Panel Interactions ---

    // Common properties (X, Y, Rotation)
    propX.addEventListener('input', (e) => {
        if (selectedShape && !selectedShape.getAttr('isLocked')) {
            selectedShape.x(parseFloat(e.target.value));
            valX.textContent = Math.round(selectedShape.x());
            layer.batchDraw();
        }
    });
    propY.addEventListener('input', (e) => {
        if (selectedShape && !selectedShape.getAttr('isLocked')) {
            selectedShape.y(parseFloat(e.target.value));
            valY.textContent = Math.round(selectedShape.y());
            layer.batchDraw();
        }
    });
    propRotation.addEventListener('input', (e) => {
        if (selectedShape && !selectedShape.getAttr('isLocked')) {
            selectedShape.rotation(parseFloat(e.target.value));
            valRotation.textContent = Math.round(selectedShape.rotation());
            layer.batchDraw();
        }
    });

    // Fill Color (for Rect/Circle/Text)
    propFillColor.addEventListener('input', (e) => {
        if (selectedShape && (selectedShape.getClassName() === 'Rect' || selectedShape.getClassName() === 'Circle' || selectedShape.getClassName() === 'Text') && !selectedShape.getAttr('isLocked')) {
            selectedShape.fill(e.target.value);
            layer.batchDraw();
        }
    });

    // Corner Radius (for Rect and Image) and Ellipse Radius
    propCornerRadius.addEventListener('input', (e) => {
        if (selectedShape && !selectedShape.getAttr('isLocked')) {
            const value = parseFloat(e.target.value);
            valCornerRadius.textContent = Math.round(value);

            if (selectedShape.getClassName() === 'Rect' || selectedShape.getClassName() === 'Image') {
                selectedShape.cornerRadius(value);
            } else if (selectedShape.getClassName() === 'Circle') {
                // For Ellipse, adjust both radii to maintain circularity or just radiusX
                selectedShape.radiusX(value);
                selectedShape.radiusY(value); // Keep it proportional for "roundedness"
            }
            layer.batchDraw();
        }
    });


    // Text Specific Properties
    propTextContent.addEventListener('input', (e) => {
        if (selectedShape && selectedShape.getClassName() === 'Text' && !selectedShape.getAttr('isLocked')) {
            selectedShape.text(e.target.value);
            // After changing text, update its width to match content width for transformer
            selectedShape.width(selectedShape._getTextWidth());
            selectedShape.height('auto');
            layer.batchDraw();
            updateLayersPanel();
            // Re-select to update transformer handles immediately if needed
            selectShape(selectedShape);
        }
    });

    propFontFamily.addEventListener('change', (e) => {
        if (selectedShape && selectedShape.getClassName() === 'Text' && !selectedShape.getAttr('isLocked')) {
            selectedShape.fontFamily(e.target.value);
            // After changing font, update its width to match content width for transformer
            selectedShape.width(selectedShape._getTextWidth());
            selectedShape.height('auto');
            layer.batchDraw();
            // Re-select to update transformer handles immediately if needed
            selectShape(selectedShape);
        }
    });
    propTextColor.addEventListener('input', (e) => {
        if (selectedShape && selectedShape.getClassName() === 'Text' && !selectedShape.getAttr('isLocked')) {
            selectedShape.fill(e.target.value);
            layer.batchDraw();
        }
    });
    alignLeftBtn.addEventListener('click', () => {
        if (selectedShape && selectedShape.getClassName() === 'Text' && !selectedShape.getAttr('isLocked')) {
            selectedShape.align('left');
            // Alignment change might affect text dimensions if multi-line and wrap.
            // Ensure width is still based on content if not using width for wrapping.
            // If `wrap` is 'none', then `_getTextWidth` is sufficient. If 'word', then `width` matters.
            // For now, keep it simple.
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
            }
            // Ensure no duplicate 'bold'
            else if (!currentStyle.includes('bold')) {
                currentStyle = (currentStyle + ' bold').trim();
            }
            selectedShape.fontStyle(currentStyle);
            // After changing style, update its width to match content width for transformer
            selectedShape.width(selectedShape._getTextWidth());
            selectedShape.height('auto');
            layer.batchDraw();
            updateFontStyles(selectedShape.fontStyle());
            // Re-select to update transformer handles immediately if needed
            selectShape(selectedShape);
        }
    });
    toggleItalicBtn.addEventListener('click', () => {
        if (selectedShape && selectedShape.getClassName() === 'Text' && !selectedShape.getAttr('isLocked')) {
            let currentStyle = selectedShape.fontStyle();
            if (currentStyle.includes('italic')) {
                currentStyle = currentStyle.replace('italic', '').trim();
            }
            // Ensure no duplicate 'italic'
            else if (!currentStyle.includes('italic')) {
                currentStyle = (currentStyle + ' italic').trim();
            }
            selectedShape.fontStyle(currentStyle);
            // After changing style, update its width to match content width for transformer
            selectedShape.width(selectedShape._getTextWidth());
            selectedShape.height('auto');
            layer.batchDraw();
            updateFontStyles(selectedShape.fontStyle());
            // Re-select to update transformer handles immediately if needed
            selectShape(selectedShape);
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
            // To maintain angle, more complex vector math would be needed.
            // For now, simple horizontal length change.
            selectedShape.points([startX, startY, startX + newLength, startY]);
            valLineLength.textContent = Math.round(newLength);
            layer.batchDraw();
            transformer.nodes([selectedShape]); // Re-attach transformer to update handles
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
        selectedShape.setAttr('shadowEnabled', enabled); // Update custom attribute

        if (enabled) {
            selectedShape.setAttrs({
                shadowColor: shadowColor.value,
                shadowBlur: parseFloat(shadowBlur.value),
                shadowOffsetX: parseFloat(shadowOffsetX.value),
                shadowOffsetY: parseFloat(shadowOffsetY.value),
                // Konva will automatically apply shadow if these properties are set
            });
        } else {
            // Remove shadow properties or set to defaults that effectively disable it
            selectedShape.setAttrs({
                shadowColor: undefined, // Removing color disables it more surely
                shadowBlur: 0,
                shadowOffsetX: 0,
                shadowOffsetY: 0,
            });
        }
        layer.batchDraw();
        updatePropertiesPanel(); // Re-render panel to disable controls if shadow is off
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
            selectedShape.draggable(!isLocked);
            transformer.nodes(isLocked ? [] : [selectedShape]); // Detach transformer if locked
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
            transformer.nodes(isLocked ? [] : [node]);
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
            id: `${node.getClassName()}_${nextElementId++}`,
            // Ensure shadow properties are copied correctly as attributes
            shadowEnabled: node.getAttr('shadowEnabled'),
            shadowColor: node.shadowColor(),
            shadowBlur: node.shadowBlur(),
            shadowOffsetX: node.shadowOffsetX(),
            shadowOffsetY: node.shadowOffsetY(),
        });

        if (node.getClassName() === 'Line') {
            clonedNode.points([...node.points()]); // Deep copy points array
        }
        if (clonedNode.getClassName() === 'Text') {
            // Text nodes need to preserve their width, height, and intrinsic font properties.
            // The cloned node will initially have the same properties as the original.
            // We ensure its width is based on its content width right after cloning.
            clonedNode.width(clonedNode._getTextWidth());
            clonedNode.height('auto');
            clonedNode.wrap('word'); // Ensure wrap is set for cloned text
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
            selectedShape.moveUp();
            layer.batchDraw();
            updateLayersPanel();
        } else if (selectedShape && selectedShape.getAttr('isLocked')) {
            alert('Cannot move locked elements.');
        }
    });

    moveLayerDownBtn.addEventListener('click', () => {
        if (selectedShape && !selectedShape.getAttr('isLocked')) {
            selectedShape.moveDown();
            layer.batchDraw();
            updateLayersPanel();
        } else if (selectedShape && selectedShape.getAttr('isLocked')) {
            alert('Cannot move locked elements.');
        }
    });


    // --- Canvas Interaction (Selection & Transformation) ---
    stage.on('click tap', (e) => {
        // If clicked on stage or layer directly (not a shape), deselect
        if (e.target === stage || e.target === layer) {
            deselectShape();
            return;
        }

        // If clicked on transformer handle, do nothing (transformer handles its own logic)
        const clickedOnTransformer = e.target.getParent() && e.target.getParent().className === 'Transformer';
        if (clickedOnTransformer) {
            return;
        }

        // If a shape is clicked, select it (unless it's already selected)
        if (e.target !== selectedShape) {
            selectShape(e.target);
        }
    });

    // Update properties panel when shape is transformed (resized, rotated, moved via transformer)
    transformer.on('transformend', () => {
        if (selectedShape) {
            if (selectedShape.getClassName() === 'Text') {
                // For text, the font size is updated within boundBoxFunc.
                // We ensure its `width` property (used by transformer) is reset to match its content's current visual width.
                selectedShape.width(selectedShape._getTextWidth());
                selectedShape.height('auto'); // Ensure height is correct after font size change
                // Re-attach transformer to update handles if text dimensions changed significantly
                transformer.nodes([selectedShape]);
            } else {
                // For other shapes, apply the scale to width/height and reset scale to 1
                selectedShape.width(selectedShape.width() * selectedShape.scaleX());
                selectedShape.height(selectedShape.height() * selectedShape.scaleY());
                selectedShape.scaleX(1);
                selectedShape.scaleY(1);
                if (selectedShape.getClassName() === 'Circle') { // Ellipse
                    selectedShape.radiusX(selectedShape.radiusX());
                    selectedShape.radiusY(selectedShape.shapeType === 'Circle' ? selectedShape.radiusX() : selectedShape.radiusY());
                } else if (selectedShape.getClassName() === 'Line') {
                    const points = selectedShape.points();
                    const currentLength = Math.sqrt(Math.pow(points[2] - points[0], 2) + Math.pow(points[3] - points[1], 2));
                    propLineLength.value = Math.round(currentLength);
                    valLineLength.textContent = Math.round(currentLength);
                }
            }
            updatePropertiesPanel(); // Refresh properties after transform
        }
        layer.batchDraw();
    });


    // Update properties panel when shape is dragged
    layer.on('dragend', () => {
        if (selectedShape) {
            updatePropertiesPanel();
        }
    });


    // --- Font Management (Multiple Uploads) ---
    // Add default web fonts to dropdown
    propFontFamily.options[propFontFamily.options.length] = new Option('Pacifico (Web)', 'Pacifico');
    propFontFamily.options[propFontFamily.options.length] = new Option('Lobster (Web)', 'Lobster');
    propFontFamily.options[propFontFamily.options.length] = new Option('Dancing Script (Web)', 'Dancing Script');

    uploadFontBtn.addEventListener('click', () => {
        fontUpload.click(); // Trigger hidden file input for multiple fonts
    });

    fontUpload.addEventListener('change', async (e) => {
        const files = e.target.files;
        if (files.length === 0) return;

        const loadPromises = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            const fontName = file.name.split('.')[0].replace(/[^a-zA-Z0-9\s]/g, '_').replace(/\s/g, ''); // Clean up name for font-family CSS
            const format = file.name.split('.').pop().toLowerCase();

            loadPromises.push(new Promise((resolve, reject) => {
                reader.onload = function (event) {
                    const fontFace = new FontFace(fontName, `url(${event.target.result})`);

                    fontFace.load().then((loadedFace) => {
                        document.fonts.add(loadedFace);
                        const newOption = new Option(`${fontName} (Custom)`, fontName);
                        propFontFamily.add(newOption);

                        // Add a style tag for the font-face rule to ensure it's loaded consistently
                        const style = document.createElement('style');
                        // Use appropriate format for src url, although usually not strictly necessary for .ttf/.otf
                        style.textContent = `@font-face { font-family: '${fontName}'; src: url(${event.target.result}) format('${format}'); }`;
                        document.head.appendChild(style);

                        console.log(`Font '${fontName}' loaded successfully.`);
                        resolve(fontName);
                    }).catch(error => {
                        console.error(`Error loading font ${file.name}:`, error);
                        reject({ name: file.name, error: error });
                    });
                };
                reader.readAsDataURL(file);
            }));
        }

        try {
            const loadedFonts = await Promise.allSettled(loadPromises);
            const successfulLoads = loadedFonts.filter(p => p.status === 'fulfilled').map(p => p.value);
            const failedLoads = loadedFonts.filter(p => p.status === 'rejected');

            if (successfulLoads.length > 0) {
                alert(`Successfully loaded ${successfulLoads.length} font(s): ${successfulLoads.join(', ')}`);
            }
            if (failedLoads.length > 0) {
                alert(`Failed to load ${failedLoads.length} font(s). Check console for details.`);
            }
        } catch (error) {
            // This catch block might not be hit if Promise.allSettled is used, but good for general error handling
            console.error("An unexpected error occurred during font loading:", error);
            alert("An error occurred during font loading.");
        }
        // Clear selected files from input to allow re-selection of same files
        fontUpload.value = '';
    });


    // --- Download WebP ---
    downloadWebPBtn.addEventListener('click', () => {
        transformer.nodes([]); // Deselect any active shape for clean export
        layer.batchDraw();

        // Get current background color of the konva container
        const backgroundColor = document.getElementById('konvaContainer').style.backgroundColor || '#F0F0F0';

        // Create a temporary rectangle to fill the background for export if needed
        let bgRect = null;
        if (backgroundColor && backgroundColor !== 'transparent' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
            bgRect = new Konva.Rect({
                x: 0,
                y: 0,
                width: stage.width(),
                height: stage.height(),
                fill: backgroundColor,
                listening: false, // Not interactive
                isHitEnabled: false, // Not selectable
            });
            layer.add(bgRect); // Add to layer
            bgRect.moveToBottom(); // Send to back
            layer.batchDraw(); // Redraw with background
        }

        const dataURL = stage.toDataURL({
            mimeType: 'image/webp',
            quality: 0.8
        });

        if (bgRect) {
            bgRect.destroy(); // Remove temporary background rect
            layer.batchDraw(); // Redraw without background
        }


        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
        a.href = dataURL;
        a.download = `VACANCY_HAI_ONLINE_Design_${timestamp}.webp`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Re-select the shape if one was selected before export
        if (selectedShape && !selectedShape.getAttr('isLocked')) {
            transformer.nodes([selectedShape]);
        }
        layer.batchDraw();
    });

    // --- Default Branding Text ---
    function addBrandingText() {
        const brandingText = new Konva.Text({
            x: 2, // 2px from left edge
            y: CANVAS_HEIGHT - 2 - 20, // Initial Y, will be adjusted after creation based on actual height
            text: 'VACANCYHAI.ONLINE',
            fontSize: 16,
            fontFamily: 'Arial',
            fill: '#999999', // A subtle gray color
            draggable: false, // Not draggable
            isLocked: true, // Custom property to lock it
            listening: false, // Cannot be selected or interacted with
            shadowEnabled: false, // No shadow by default
        });
        // Adjust Y based on actual text height after creation, if needed
        brandingText.y(CANVAS_HEIGHT - 2 - brandingText.height());
        layer.add(brandingText);
        layer.batchDraw();
    }


    // --- Initial Setup on Load ---
    updatePropertiesPanel();
    updateLayersPanel();
    document.getElementById('konvaContainer').style.backgroundColor = bgColorPicker.value;
    addBrandingText(); // Add the branding text on load
});
