// Webcraft Release 1.0 - Main Game Controller & Inventory Integration
document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('renderCanvas');
    const startOverlay = document.getElementById('startOverlay');
    const debugHud = document.getElementById('debugHud');
    const hotbarContainer = document.getElementById('hotbarContainer');

    const inventoryModal = document.getElementById('inventoryModal');
    const workbenchModal = document.getElementById('workbenchModal');
    const cursorItemEl = document.getElementById('cursorItem');

    // Instantiate Core Systems
    const worldBridge = new WorldBridge();
    await worldBridge.init(Math.floor(Math.random() * 10000));

    const renderer = new WebGLRenderer(canvas);
    const textureAtlas = TextureGenerator.generateAtlas();
    renderer.loadTextureAtlas(textureAtlas);

    const camera = new Camera();
    const physics = new PhysicsEngine(worldBridge);
    const inventory = new InventorySystem();
    const crafting = new CraftingEngine(inventory);
    const mining = new MiningEngine();

    let selectedHotbarIndex = 0;
    let isPointerLocked = false;
    let isMouseDown = false;
    let targetRaycast = null;

    // Initial Mesh Generation
    let meshData = worldBridge.buildMesh();
    renderer.updateMeshBuffer(meshData);

    // Dynamic Hotbar Render
    function renderHotbar() {
        hotbarContainer.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            let item = inventory.slots[i];
            let slotEl = document.createElement('div');
            slotEl.className = `hotbar-slot ${i === selectedHotbarIndex ? 'active' : ''}`;
            
            let keyEl = document.createElement('span');
            keyEl.className = 'slot-key';
            keyEl.innerText = i + 1;
            slotEl.appendChild(keyEl);

            if (item) {
                let iconEl = document.createElement('div');
                iconEl.className = 'slot-icon';
                iconEl.style.backgroundImage = `url(${textureAtlas.toDataURL()})`;
                
                // Texture offset mapping for icons
                let slotIdx = getAtlasSlotIndex(item.id);
                let col = slotIdx % 16;
                let row = Math.floor(slotIdx / 16);
                iconEl.style.backgroundPosition = `-${col * 28}px -${row * 28}px`;
                iconEl.style.backgroundSize = `${16 * 28}px ${4 * 28}px`;
                slotEl.appendChild(iconEl);

                let countEl = document.createElement('span');
                countEl.className = 'slot-count';
                countEl.innerText = item.count > 1 ? item.count : '';
                slotEl.appendChild(countEl);
            }

            slotEl.addEventListener('click', () => {
                selectedHotbarIndex = i;
                renderHotbar();
            });

            hotbarContainer.appendChild(slotEl);
        }
    }

    function getAtlasSlotIndex(id) {
        // Block / Item to Atlas index
        if (id === 1) return 0;  // Grass
        if (id === 2) return 2;  // Dirt
        if (id === 3) return 3;  // Stone
        if (id === 4) return 4;  // Cobble
        if (id === 5) return 5;  // Log
        if (id === 6) return 7;  // Leaves
        if (id === 7) return 8;  // Planks
        if (id === 8) return 9;  // Sand
        if (id === 9) return 10; // Sandstone
        if (id === 10) return 11; // Glass
        if (id === 11) return 12; // Coal Ore
        if (id === 12) return 13; // Iron Ore
        if (id === 13) return 14; // Gold Ore
        if (id === 14) return 15; // Diamond Ore
        if (id === 15) return 16; // Obsidian
        if (id === 16) return 17; // Bricks
        if (id === 17) return 18; // Bookshelf
        if (id === 18) return 19; // Mossy Cobble
        if (id === 19) return 20; // Crafting Table
        if (id === 20) return 23; // Chest
        if (id === 21) return 25; // TNT
        if (id === 22) return 26; // Sponge
        if (id >= 23 && id <= 28) return 27 + (id - 23); // Wools
        return 8; // Default Planks icon
    }

    renderHotbar();

    // Inventory & Crafting GUI Event Wireup
    function setupGUIGrids(mainGridEl, hotbarGridEl) {
        mainGridEl.innerHTML = '';
        hotbarGridEl.innerHTML = '';

        for (let i = 9; i < 36; i++) {
            let slot = createGUISlot(i);
            mainGridEl.appendChild(slot);
        }
        for (let i = 0; i < 9; i++) {
            let slot = createGUISlot(i);
            hotbarGridEl.appendChild(slot);
        }
    }

    function createGUISlot(slotIndex) {
        let slotEl = document.createElement('div');
        slotEl.className = 'gui-slot';
        slotEl.dataset.index = slotIndex;

        let item = inventory.slots[slotIndex];
        if (item) {
            let iconEl = document.createElement('div');
            iconEl.className = 'slot-icon';
            iconEl.style.backgroundImage = `url(${textureAtlas.toDataURL()})`;
            let slotIdx = getAtlasSlotIndex(item.id);
            let col = slotIdx % 16;
            let row = Math.floor(slotIdx / 16);
            iconEl.style.backgroundPosition = `-${col * 28}px -${row * 28}px`;
            iconEl.style.backgroundSize = `${16 * 28}px ${4 * 28}px`;
            slotEl.appendChild(iconEl);

            if (item.count > 1) {
                let countEl = document.createElement('span');
                countEl.className = 'slot-count';
                countEl.innerText = item.count;
                slotEl.appendChild(countEl);
            }
        }

        slotEl.addEventListener('click', (e) => {
            handleSlotClick(slotIndex, e.button === 2);
            refreshGUI();
        });

        return slotEl;
    }

    function handleSlotClick(slotIndex, isRightClick) {
        let slotItem = inventory.slots[slotIndex];

        if (!inventory.cursorItem && slotItem) {
            // Pick up item
            if (isRightClick) {
                let half = Math.ceil(slotItem.count / 2);
                inventory.cursorItem = { ...slotItem, count: half };
                slotItem.count -= half;
                if (slotItem.count <= 0) inventory.slots[slotIndex] = null;
            } else {
                inventory.cursorItem = slotItem;
                inventory.slots[slotIndex] = null;
            }
        } else if (inventory.cursorItem) {
            if (!slotItem) {
                // Place item in empty slot
                if (isRightClick) {
                    inventory.slots[slotIndex] = { ...inventory.cursorItem, count: 1 };
                    inventory.cursorItem.count--;
                    if (inventory.cursorItem.count <= 0) inventory.cursorItem = null;
                } else {
                    inventory.slots[slotIndex] = inventory.cursorItem;
                    inventory.cursorItem = null;
                }
            } else if (slotItem.id === inventory.cursorItem.id) {
                // Stack items
                if (isRightClick) {
                    if (slotItem.count < 64) {
                        slotItem.count++;
                        inventory.cursorItem.count--;
                        if (inventory.cursorItem.count <= 0) inventory.cursorItem = null;
                    }
                } else {
                    let add = Math.min(inventory.cursorItem.count, 64 - slotItem.count);
                    slotItem.count += add;
                    inventory.cursorItem.count -= add;
                    if (inventory.cursorItem.count <= 0) inventory.cursorItem = null;
                }
            } else {
                // Swap items
                let temp = inventory.slots[slotIndex];
                inventory.slots[slotIndex] = inventory.cursorItem;
                inventory.cursorItem = temp;
            }
        }
    }

    function refreshGUI() {
        renderHotbar();
        setupGUIGrids(document.getElementById('invMainGrid'), document.getElementById('invHotbarGrid'));
        setupGUIGrids(document.getElementById('wbMainGrid'), document.getElementById('wbHotbarGrid'));
        updateCursorItemUI();
        updateCrafting();
    }

    function updateCursorItemUI() {
        if (inventory.cursorItem) {
            cursorItemEl.style.display = 'block';
            let slotIdx = getAtlasSlotIndex(inventory.cursorItem.id);
            let col = slotIdx % 16;
            let row = Math.floor(slotIdx / 16);
            cursorItemEl.innerHTML = `
                <div class="slot-icon" style="background-image: url(${textureAtlas.toDataURL()}); background-position: -${col * 32}px -${row * 32}px; background-size: ${16 * 32}px ${4 * 32}px;"></div>
                <span class="slot-count">${inventory.cursorItem.count > 1 ? inventory.cursorItem.count : ''}</span>
            `;
        } else {
            cursorItemEl.style.display = 'none';
        }
    }

    document.addEventListener('mousemove', (e) => {
        if (inventory.cursorItem) {
            cursorItemEl.style.left = `${e.clientX}px`;
            cursorItemEl.style.top = `${e.clientY}px`;
        }
    });

    // Crafting evaluation
    function updateCrafting() {
        let isWbOpen = workbenchModal.style.display !== 'none';
        let grid = isWbOpen ? inventory.craftingGrid : inventory.craftingGrid.slice(0, 4);
        let result = crafting.evaluateCraft(grid, isWbOpen);

        inventory.craftingResult = result;

        let resEl = isWbOpen ? document.getElementById('craftResult3x3') : document.getElementById('craftResult2x2');
        resEl.innerHTML = '';

        if (result) {
            let iconEl = document.createElement('div');
            iconEl.className = 'slot-icon';
            iconEl.style.backgroundImage = `url(${textureAtlas.toDataURL()})`;
            let slotIdx = getAtlasSlotIndex(result.id);
            let col = slotIdx % 16;
            let row = Math.floor(slotIdx / 16);
            iconEl.style.backgroundPosition = `-${col * 32}px -${row * 32}px`;
            iconEl.style.backgroundSize = `${16 * 32}px ${4 * 32}px`;
            resEl.appendChild(iconEl);

            if (result.count > 1) {
                let countEl = document.createElement('span');
                countEl.className = 'slot-count';
                countEl.innerText = result.count;
                resEl.appendChild(countEl);
            }
        }
    }

    // Modal Controls
    function toggleInventoryModal(open = true) {
        if (open) {
            document.exitPointerLock();
            inventoryModal.style.display = 'flex';
            workbenchModal.style.display = 'none';
            refreshGUI();
        } else {
            inventoryModal.style.display = 'none';
            workbenchModal.style.display = 'none';
            canvas.requestPointerLock();
        }
    }

    document.getElementById('closeInventoryBtn').addEventListener('click', () => toggleInventoryModal(false));
    document.getElementById('closeWorkbenchBtn').addEventListener('click', () => toggleInventoryModal(false));

    // Input States
    const keys = { forward: false, backward: false, left: false, right: false, jump: false, sneak: false };

    // Pointer Lock & Overlay Event
    startOverlay.addEventListener('click', () => {
        canvas.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === canvas) {
            isPointerLocked = true;
            startOverlay.style.display = 'none';
        } else {
            isPointerLocked = false;
            if (inventoryModal.style.display === 'none' && workbenchModal.style.display === 'none') {
                startOverlay.style.display = 'flex';
            }
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isPointerLocked) {
            camera.handleMouseMove(e.movementX, e.movementY);
        }
    });

    document.addEventListener('mousedown', (e) => {
        if (isPointerLocked && e.button === 0) {
            isMouseDown = true;
        } else if (isPointerLocked && e.button === 2) { // Right Click: Place / Interact
            targetRaycast = physics.raycast(camera.position, camera.front);
            if (!targetRaycast) return;

            let hitType = worldBridge.getBlock(targetRaycast.hit[0], targetRaycast.hit[1], targetRaycast.hit[2]);
            if (hitType === 19) { // Crafting Table
                document.exitPointerLock();
                workbenchModal.style.display = 'flex';
                refreshGUI();
                return;
            }

            let heldSlot = inventory.slots[selectedHotbarIndex];
            if (heldSlot && heldSlot.id) {
                let meta = inventory.getItemMeta(heldSlot.id);
                if (meta.isBlock) {
                    let p = targetRaycast.place;
                    worldBridge.setBlock(p[0], p[1], p[2], heldSlot.id);
                    heldSlot.count--;
                    if (heldSlot.count <= 0) inventory.slots[selectedHotbarIndex] = null;

                    meshData = worldBridge.buildMesh();
                    renderer.updateMeshBuffer(meshData);
                    renderHotbar();
                }
            }
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            isMouseDown = false;
            mining.resetMining();
        }
    });

    document.addEventListener('contextmenu', e => e.preventDefault());

    document.addEventListener('wheel', (e) => {
        if (e.deltaY > 0) {
            selectedHotbarIndex = (selectedHotbarIndex + 1) % 9;
        } else {
            selectedHotbarIndex = (selectedHotbarIndex - 1 + 9) % 9;
        }
        renderHotbar();
    });

    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyW') keys.forward = true;
        if (e.code === 'KeyS') keys.backward = true;
        if (e.code === 'KeyA') keys.left = true;
        if (e.code === 'KeyD') keys.right = true;
        if (e.code === 'Space') keys.jump = true;
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.sneak = true;

        if (e.code === 'KeyE') {
            e.preventDefault();
            let isOpen = inventoryModal.style.display !== 'none' || workbenchModal.style.display !== 'none';
            toggleInventoryModal(!isOpen);
        }

        if (e.code === 'Escape') {
            if (inventoryModal.style.display !== 'none' || workbenchModal.style.display !== 'none') {
                toggleInventoryModal(false);
            }
        }

        if (e.code === 'F3') {
            e.preventDefault();
            debugHud.style.display = debugHud.style.display === 'none' ? 'block' : 'none';
        }

        if (e.key >= '1' && e.key <= '9') {
            selectedHotbarIndex = parseInt(e.key) - 1;
            renderHotbar();
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.code === 'KeyW') keys.forward = false;
        if (e.code === 'KeyS') keys.backward = false;
        if (e.code === 'KeyA') keys.left = false;
        if (e.code === 'KeyD') keys.right = false;
        if (e.code === 'Space') keys.jump = false;
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.sneak = false;
    });

    // Game Loop
    let lastTime = performance.now();

    function gameLoop(now) {
        let dt = (now - lastTime) / 1000.0;
        lastTime = now;

        if (isPointerLocked) {
            physics.update(camera, keys, dt);
        }

        // Raycasting & Progressive Mining
        targetRaycast = physics.raycast(camera.position, camera.front);

        if (isPointerLocked && isMouseDown && targetRaycast) {
            let hitType = worldBridge.getBlock(targetRaycast.hit[0], targetRaycast.hit[1], targetRaycast.hit[2]);
            let heldItem = inventory.slots[selectedHotbarIndex];

            let finished = mining.updateMining(targetRaycast.hit, hitType, heldItem ? inventory.getItemMeta(heldItem.id) : null, dt);

            if (finished) {
                worldBridge.setBlock(targetRaycast.hit[0], targetRaycast.hit[1], targetRaycast.hit[2], 0);
                inventory.addItem(hitType, 1);
                renderHotbar();

                meshData = worldBridge.buildMesh();
                renderer.updateMeshBuffer(meshData);
            }
        } else {
            mining.resetMining();
        }

        // Render Frame with Mining Progress Overlay
        renderer.render(camera, targetRaycast ? targetRaycast.hit : null, mining.miningProgress);

        // Update Debug HUD
        let pos = camera.position;
        debugHud.innerHTML = `
            <div><strong>Webcraft Release 1.0 (Survival & Crafting)</strong></div>
            <div>XYZ: ${pos[0].toFixed(2)} / ${pos[1].toFixed(2)} / ${pos[2].toFixed(2)}</div>
            <div>World Size: ${worldBridge.WORLD_SIZE_X}x${worldBridge.WORLD_SIZE_Y}x${worldBridge.WORLD_SIZE_Z}</div>
            <div>Engine: ${worldBridge.isWasmLoaded ? 'C++ WebAssembly' : 'JS Voxel Engine'}</div>
            <div>Polygons: ${(renderer.vertexCount / 3).toLocaleString()} Triangles</div>
        `;

        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
});
