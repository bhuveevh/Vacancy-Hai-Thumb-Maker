@@ -16,49 +16,80 @@ document.addEventListener('DOMContentLoaded', () => {
        rotateEnabled: true,
        // Custom boundBoxFunc to handle text resizing without stretching
        boundBoxFunc: (oldBox, newBox) => {
            const MIN_SIZE = 10;
            const MIN_SIZE = 10; // Minimum dimension for any shape/text
            if (newBox.width < MIN_SIZE || newBox.height < MIN_SIZE) {
                return oldBox;
                return oldBox; // Prevent resizing below min size
            }

            // Special handling for Text nodes to control font size proportionally
            if (selectedShape && selectedShape.getClassName() === 'Text') {
                const textNode = selectedShape;

                const originalWidth = textNode.getAttr('initialWidth') || textNode.width();
                const originalHeight = textNode.getAttr('initialHeight') || textNode.height();
                const originalFontSize = textNode.getAttr('initialFontSize') || textNode.fontSize();
                // --- Step 1: Calculate current actual content width and height ---
                // Temporarily ensure width/height are set to 0/auto for intrinsic calculation
                const originalWidthProp = textNode.width();
                const originalHeightProp = textNode.height();
                const originalWrap = textNode.wrap();

                const scaleW = newBox.width / originalWidth;
                const scaleH = newBox.height / originalHeight;
                const scale = Math.min(scaleW, scaleH);
                // To get the actual content size without wrapping constraints
                textNode.setAttrs({ width: 0, height: 'auto', wrap: 'none' });
                layer.batchDraw(); // Force a draw cycle for Konva to update internal text metrics

                let newFontSize = originalFontSize * scale;
                const actualContentWidth = textNode.width(); // This is the intrinsic width of the text
                const actualContentHeight = textNode.height(); // This is the intrinsic height of the text

                const MIN_FONT_SIZE = 8;
                const MAX_FONT_SIZE = 120;
                // Restore original wrapping and dimensions for next calculation step
                textNode.setAttrs({ width: originalWidthProp, height: originalHeightProp, wrap: originalWrap });
                // No need to batchDraw here, as it will be drawn after font size change

                if (actualContentWidth === 0 || actualContentHeight === 0) { // Safety check
                    return oldBox;
                }

                newFontSize = Math.max(MIN_FONT_SIZE, Math.min(newFontSize, MAX_FONT_SIZE));
                // --- Step 2: Calculate new font size based on new transformer width ---
                const currentFontSize = textNode.fontSize();
                let newFontSize = currentFontSize * (newBox.width / actualContentWidth);

                const MIN_FONT_SIZE = 8;
                if (newFontSize < MIN_FONT_SIZE) {
                    newFontSize = MIN_FONT_SIZE;
                }

                // --- Step 3: Apply new font size and calculate new dimensions ---
                textNode.fontSize(newFontSize);
                textNode.width(newBox.width);
                textNode.height('auto');
                // Now, force Konva to recalculate its width and height based on the new font size
                // and the current text content.
                // Setting width to 0 and height to 'auto' tells Konva to calculate the intrinsic size.
                textNode.setAttrs({ width: 0, height: 'auto', wrap: 'none' });
                layer.batchDraw(); // Crucial: Force draw to get the updated intrinsic size

                const finalContentWidth = textNode.width();
                const finalContentHeight = textNode.height();

                // --- Step 4: Update text node's actual properties for display and transformer ---
                // We want the text node's width to be its calculated content width + 2px padding
                // And height to be its calculated content height + some padding if needed
                const PADDING = 2; // Desired padding around text
                textNode.width(finalContentWidth + PADDING);
                textNode.height(finalContentHeight + PADDING); // Adjust height based on content

                // Restore original wrapping behavior if it was active
                textNode.wrap(originalWrap);

                // Reset scale to 1 to prevent double scaling from transformer
                textNode.scaleX(1);
                textNode.scaleY(1);

                textNode.setAttr('initialWidth', textNode.width());
                textNode.setAttr('initialHeight', textNode.height());
                textNode.setAttr('initialFontSize', newFontSize);

                // Return the new bounding box for the transformer based on the text node's updated dimensions
                return {
                    width: textNode.width(),
                    height: textNode.height(),
                    width: textNode.width(), // The actual width after font size adjustment and padding
                    height: textNode.height(), // The actual height after font size adjustment and padding
                    x: newBox.x,
                    y: newBox.y,
                    rotation: newBox.rotation
                };
            }

            return newBox;
            return newBox; // For other shapes, return the new box as is
        }
    });
    layer.add(transformer);
@@ -108,6 +139,9 @@ document.addEventListener('DOMContentLoaded', () => {
    const alignRightBtn = document.getElementById('alignRight');
    const toggleBoldBtn = document.getElementById('toggleBold');
    const toggleItalicBtn = document.getElementById('toggleItalic');
    const propFontSize = document.getElementById('propFontSize'); // New: Font size slider
    const valFontSize = document.getElementById('valFontSize'); // New: Font size value display


    // Line Specific Properties
    const linePropertiesDiv = document.getElementById('lineProperties');
@@ -201,12 +235,15 @@ document.addEventListener('DOMContentLoaded', () => {
            propTextContent.value = selectedShape.text();
            propFontFamily.value = selectedShape.fontFamily();
            propTextColor.value = selectedShape.fill(); // Text color is 'fill' for Konva.Text
            propFontSize.value = selectedShape.fontSize(); // New: Font size
            valFontSize.textContent = Math.round(selectedShape.fontSize()); // New: Font size display
            updateFontStyles(selectedShape.fontStyle());
            updateTextAlign(selectedShape.align());

            propTextContent.disabled = disableControls;
            propFontFamily.disabled = disableControls;
            propTextColor.disabled = disableControls;
            propFontSize.disabled = disableControls; // New: disable font size
            alignLeftBtn.disabled = disableControls;
            alignCenterBtn.disabled = disableControls;
            alignRightBtn.disabled = disableControls;
@@ -368,6 +405,20 @@ document.addEventListener('DOMContentLoaded', () => {
        if (selectedShape && !selectedShape.getAttr('isLocked')) {
            transformer.nodes([selectedShape]);
            transformer.moveToTop(); // Ensure transformer is always on top
            // IMPORTANT: For text, ensure its width and height properties reflect its visual content
            // to correctly size the transformer.
            if (selectedShape.getClassName() === 'Text') {
                // Reset width/height to force Konva to recalculate intrinsic size
                selectedShape.setAttrs({ width: 0, height: 'auto', wrap: 'none' });
                layer.batchDraw(); // Force a draw to update internal text metrics

                const PADDING = 2;
                selectedShape.width(selectedShape.width() + PADDING);
                selectedShape.height(selectedShape.height() + PADDING);
                selectedShape.wrap('word'); // Restore default wrap
                // Re-attach transformer after updating width to refresh handles
                transformer.nodes([selectedShape]); // This is critical to update transformer dimensions
            }
        } else { // If newly selected shape is locked or no shape
            transformer.nodes([]);
        }
@@ -404,14 +455,19 @@ document.addEventListener('DOMContentLoaded', () => {
            shadowEnabled: false, // Custom property for shadow toggle
        });

        // For Text nodes, store initial properties for proportional scaling
        layer.add(shape);
        // Special handling after adding to layer to get accurate dimensions for Text
        if (shape.getClassName() === 'Text') {
            shape.setAttr('initialWidth', shape.width());
            shape.setAttr('initialFontSize', shape.fontSize());
        shape.setAttr('initialHeight', shape.height());
            // After adding to layer, Konva needs a draw cycle to calculate its intrinsic size.
            // Set its width property to 0 so Konva recalculates its actual content width.
            const PADDING = 2;
            shape.setAttrs({ width: 0, height: 'auto', wrap: 'none' }); // Temporarily set wrap to none for accurate intrinsic width
            layer.batchDraw(); // Force a draw to update internal text metrics

            shape.width(shape.width() + PADDING); // Set width to content width + padding
            shape.height(shape.height() + PADDING); // Set height to content height + padding
            shape.wrap('word'); // Restore default wrap behavior
        }

        layer.add(shape);
        selectShape(shape); // Select the newly added shape
    }

@@ -466,20 +522,24 @@ document.addEventListener('DOMContentLoaded', () => {
    });

    addTextBtn.addEventListener('click', () => {
        const initialText = 'Type your text here!';
        const initialFontSize = 40;
        const initialFontFamily = 'Arial';

        const textNode = new Konva.Text({
            x: 200,
            y: 100,
            text: 'Type your text here!',
            fontSize: 40, // Base font size
            fontFamily: 'Arial',
            text: initialText,
            fontSize: initialFontSize,
            fontFamily: initialFontFamily,
            fill: '#333333',
            draggable: true,
            width: 300, // Initial width for wrapping
            width: 0, // Konva will calculate intrinsic width
            align: 'left',
            fontStyle: 'normal',
            wrap: 'word', // Enable word wrapping
            // Important: text does not have cornerRadius, shadow properties are added by addShapeToLayer
            wrap: 'word', // Enable word wrapping by default
        });

        addShapeToLayer(textNode);
    });

@@ -585,48 +645,67 @@ document.addEventListener('DOMContentLoaded', () => {


    // Text Specific Properties
    function updateTextNodeDimensions(node) {
        const PADDING = 2;
        const originalWrap = node.wrap();
        node.setAttrs({ width: 0, height: 'auto', wrap: 'none' }); // Temporarily disable wrap for intrinsic calculation
        layer.batchDraw(); // Force redraw for Konva to update internal metrics
        node.width(node.width() + PADDING); // Apply padding
        node.height(node.height() + PADDING); // Apply padding
        node.wrap(originalWrap); // Restore original wrap setting
        layer.batchDraw(); // Redraw with new dimensions
        selectShape(node); // Re-select to update transformer handles
    }

    propTextContent.addEventListener('input', (e) => {
        if (selectedShape && selectedShape.getClassName() === 'Text' && !selectedShape.getAttr('isLocked')) {
            selectedShape.text(e.target.value);
            layer.batchDraw();
            updateLayersPanel();
            updateTextNodeDimensions(selectedShape);
            updateLayersPanel(); // Update layer name in panel
        }
    });

    propFontFamily.addEventListener('change', (e) => {
        if (selectedShape && selectedShape.getClassName() === 'Text' && !selectedShape.getAttr('isLocked')) {
            selectedShape.fontFamily(e.target.value);
            // When font family changes, font size might need adjustment to maintain visual size
            // Re-evaluate initialWidth and initialFontSize
            selectedShape.setAttr('initialWidth', selectedShape.width());
            selectedShape.setAttr('initialFontSize', selectedShape.fontSize());
            layer.batchDraw();
            updateTextNodeDimensions(selectedShape);
        }
    });

    propFontSize.addEventListener('input', (e) => {
        if (selectedShape && selectedShape.getClassName() === 'Text' && !selectedShape.getAttr('isLocked')) {
            const newSize = parseFloat(e.target.value);
            selectedShape.fontSize(newSize);
            valFontSize.textContent = Math.round(newSize);
            updateTextNodeDimensions(selectedShape);
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
            layer.batchDraw();
            updateTextNodeDimensions(selectedShape); // Alignment can affect text dimensions (e.g., if wrapping changes)
            updateTextAlign('left');
        }
    });
    alignCenterBtn.addEventListener('click', () => {
        if (selectedShape && selectedShape.getClassName() === 'Text' && !selectedShape.getAttr('isLocked')) {
            selectedShape.align('center');
            layer.batchDraw();
            updateTextNodeDimensions(selectedShape);
            updateTextAlign('center');
        }
    });
    alignRightBtn.addEventListener('click', () => {
        if (selectedShape && selectedShape.getClassName() === 'Text' && !selectedShape.getAttr('isLocked')) {
            selectedShape.align('right');
            layer.batchDraw();
            updateTextNodeDimensions(selectedShape);
            updateTextAlign('right');
        }
    });
@@ -635,11 +714,13 @@ document.addEventListener('DOMContentLoaded', () => {
            let currentStyle = selectedShape.fontStyle();
            if (currentStyle.includes('bold')) {
                currentStyle = currentStyle.replace('bold', '').trim();
            } else {
                currentStyle += ' bold';
            }
            selectedShape.fontStyle(currentStyle.trim());
            layer.batchDraw();
            // Ensure no duplicate 'bold'
            else if (!currentStyle.includes('bold')) {
                currentStyle = (currentStyle + ' bold').trim();
            }
            selectedShape.fontStyle(currentStyle);
            updateTextNodeDimensions(selectedShape);
            updateFontStyles(selectedShape.fontStyle());
        }
    });
@@ -648,11 +729,13 @@ document.addEventListener('DOMContentLoaded', () => {
            let currentStyle = selectedShape.fontStyle();
            if (currentStyle.includes('italic')) {
                currentStyle = currentStyle.replace('italic', '').trim();
            } else {
                currentStyle += ' italic';
            }
            selectedShape.fontStyle(currentStyle.trim());
            layer.batchDraw();
            // Ensure no duplicate 'italic'
            else if (!currentStyle.includes('italic')) {
                currentStyle = (currentStyle + ' italic').trim();
            }
            selectedShape.fontStyle(currentStyle);
            updateTextNodeDimensions(selectedShape);
            updateFontStyles(selectedShape.fontStyle());
        }
    });
@@ -777,20 +860,22 @@ document.addEventListener('DOMContentLoaded', () => {
        if (node.getClassName() === 'Line') {
            clonedNode.points([...node.points()]); // Deep copy points array
        }
        // Text specific cloning: Ensure width is reset for recalculation
        if (clonedNode.getClassName() === 'Text') {
            // Text nodes need to preserve their width (which transformer uses)
            clonedNode.width(node.width());
            clonedNode.height('auto'); // Konva handles height automatically with 'wrap'
            clonedNode.wrap('word'); // Ensure wrap is set for cloned text
            clonedNode.fontSize(node.fontSize()); // Copy original font size
            // Copy initial width/fontSize for consistent scaling
            clonedNode.setAttr('initialWidth', node.getAttr('initialWidth') || node.width());
            clonedNode.setAttr('initialFontSize', node.getAttr('initialFontSize') || node.fontSize());
            // Recalculate dimensions for cloned text node immediately
            const PADDING = 2;
            clonedNode.setAttrs({ width: 0, height: 'auto', wrap: 'none' });
            layer.add(clonedNode); // Add before batchDraw to ensure context is available
            layer.batchDraw(); // Force draw to update internal metrics
            clonedNode.width(clonedNode.width() + PADDING); // Set width to content width + padding
            clonedNode.height(clonedNode.height() + PADDING); // Set height to content height + padding
            clonedNode.wrap('word'); // Restore default wrap behavior
        } else {
            layer.add(clonedNode);
        }

        layer.add(clonedNode);
        clonedNode.moveToTop();
        selectShape(clonedNode);
        selectShape(clonedNode); // This will re-evaluate width/height for transformer
        layer.batchDraw();
    }

@@ -854,10 +939,16 @@ document.addEventListener('DOMContentLoaded', () => {
    transformer.on('transformend', () => {
        if (selectedShape) {
            if (selectedShape.getClassName() === 'Text') {
                // For text, the font size is updated within boundBoxFunc,
                // so here we just need to ensure the transformer's nodes are reset
                // and the panel is updated.
                // Re-attach transformer to update handles if text dimensions changed significantly
                // After transformation, force Konva to recalculate intrinsic width/height
                // based on the new font size which was set in boundBoxFunc.
                const PADDING = 2;
                const originalWrap = selectedShape.wrap();
                selectedShape.setAttrs({ width: 0, height: 'auto', wrap: 'none' }); // Temporarily disable wrap
                layer.batchDraw(); // Critical for internal Konva metrics to update
                selectedShape.width(selectedShape.width() + PADDING); // Apply padding
                selectedShape.height(selectedShape.height() + PADDING); // Apply padding
                selectedShape.wrap(originalWrap); // Restore wrap
                // Re-attach transformer to update handles to fit new intrinsic dimensions
                transformer.nodes([selectedShape]);
            } else {
                // For other shapes, apply the scale to width/height and reset scale to 1
@@ -866,8 +957,8 @@ document.addEventListener('DOMContentLoaded', () => {
                selectedShape.scaleX(1);
                selectedShape.scaleY(1);
                if (selectedShape.getClassName() === 'Circle') { // Ellipse
                    selectedShape.radiusX(selectedShape.radiusX()); // Radius already updated in boundBoxFunc if any custom logic was there
                    selectedShape.radiusY(selectedShape.shapeType === 'Circle' ? selectedShape.radiusX() : selectedShape.radiusY()); // If it was a circle, keep proportional
                    selectedShape.radiusX(selectedShape.radiusX());
                    selectedShape.radiusY(selectedShape.shapeType === 'Circle' ? selectedShape.radiusX() : selectedShape.radiusY());
                } else if (selectedShape.getClassName() === 'Line') {
                    const points = selectedShape.points();
                    const currentLength = Math.sqrt(Math.pow(points[2] - points[0], 2) + Math.pow(points[3] - points[1], 2));
@@ -943,6 +1034,10 @@ document.addEventListener('DOMContentLoaded', () => {

            if (successfulLoads.length > 0) {
                alert(`Successfully loaded ${successfulLoads.length} font(s): ${successfulLoads.join(', ')}`);
                // If text is selected and font changed, update it
                if (selectedShape && selectedShape.getClassName() === 'Text' && successfulLoads.includes(selectedShape.fontFamily())) {
                    updateTextNodeDimensions(selectedShape);
                }
            }
            if (failedLoads.length > 0) {
                alert(`Failed to load ${failedLoads.length} font(s). Check console for details.`);
@@ -1021,11 +1116,15 @@ document.addEventListener('DOMContentLoaded', () => {
            isLocked: true, // Custom property to lock it
            listening: false, // Cannot be selected or interacted with
            shadowEnabled: false, // No shadow by default
            width: 0, // Konva will calculate intrinsic width
            wrap: 'none', // Ensure it doesn't wrap for initial measurement
        });
        // Adjust Y based on actual text height after creation, if needed
        brandingText.y(CANVAS_HEIGHT - 2 - brandingText.height());
        layer.add(brandingText);
        layer.batchDraw();
        layer.batchDraw(); // Force draw to update internal metrics
        // Adjust Y based on actual text height after Konva has calculated it
        brandingText.y(CANVAS_HEIGHT - 2 - brandingText.height());
        brandingText.width(brandingText.width() + 2); // Add 2px padding to branding text width
        layer.batchDraw(); // Redraw to apply new Y position and width
    }
