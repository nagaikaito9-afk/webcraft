// Webcraft Release 3.0.0 Main Controller (Sound Synth FX, 3D Mobs, Falling Sand & Complete Bug Fixes)
document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('renderCanvas');
    const startOverlay = document.getElementById('startOverlay');
    const debugHud = document.getElementById('debugHud');
    const hotbarContainer = document.getElementById('hotbarContainer');
    const heldItemHand = document.getElementById('heldItemHand');

    const inventoryModal = document.getElementById('inventoryModal');
    const workbenchModal = document.getElementById('workbenchModal');
    const optionsModal = document.getElementById('optionsModal');
    const multiplayerModal = document.getElementById('multiplayerModal');

    const cursorItemEl = document.getElementById('cursorItem');
    const recipeBookListEl = document.getElementById('recipeBookList');

    // Instantiate Core Engines
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
    const audioManager = new SoundEngine();
    const mobManager = new MobManager(worldBridge);

    let selectedHotbarIndex = 0;
    let isPointerLocked = false;
    let isMouseDown = false;
    let targetRaycast = null;

    // Day/Night & Falling Physics State
    let dayTime = 0.2;
    const DAY_SPEED = 0.005;
    let stepSoundTimer = 0;
    let fallingSandTimer = 0;

    // Initial Mesh Generation
    let meshData = worldBridge.buildMesh();
    renderer.updateMeshBuffer(meshData);

    // --------------------------------------------------
    // Real-Time WebRTC Multiplayer Setup
    // --------------------------------------------------
    const mpStatusText = document.getElementById('mpStatusText');
    const myRoomIdText = document.getElementById('myRoomIdText');

    const mpManager = new MultiplayerManager(worldBridge, (status, data) => {
        if (status === 'ready') {
            myRoomIdText.innerText = data;
            mpStatusText.innerText = 'Status: Server Ready. Room ID created!';
        } else if (status === 'connected') {
            mpStatusText.innerText = `Status: Player Connected (${data})`;
        } else if (status === 'disconnected') {
            mpStatusText.innerText = `Status: Player Left (${data})`;
        } else if (status === 'error') {
            mpStatusText.innerText = `Error: ${data}`;
        }
    });
    mpManager.init();

    mpManager.onBlockUpdateCallback = (x, y, z, type) => {
        meshData = worldBridge.buildMesh();
        renderer.updateMeshBuffer(meshData);
    };

    document.getElementById('btnCopyRoomId').addEventListener('click', () => {
        if (mpManager.myPeerId) {
            navigator.clipboard.writeText(mpManager.myPeerId);
            alert('Room ID copied to clipboard: ' + mpManager.myPeerId);
        }
    });

    document.getElementById('btnJoinRoom').addEventListener('click', () => {
        let roomId = document.getElementById('joinRoomInput').value.trim();
        if (roomId) {
            mpManager.joinRoom(roomId);
            mpStatusText.innerText = 'Connecting to ' + roomId + '...';
        }
    });

    // --------------------------------------------------
    // Title Menu & Options Event Listeners
    // --------------------------------------------------
    document.getElementById('btnSingleplayer').addEventListener('click', () => {
        audioManager.initCtx();
        canvas.requestPointerLock();
    });

    document.getElementById('btnMultiplayer').addEventListener('click', () => {
        multiplayerModal.style.display = 'flex';
    });

    document.getElementById('btnOptions').addEventListener('click', () => {
        optionsModal.style.display = 'flex';
    });

    document.getElementById('closeOptionsBtn').addEventListener('click', () => {
        optionsModal.style.display = 'none';
    });

    document.getElementById('closeMpBtn').addEventListener('click', () => {
        multiplayerModal.style.display = 'none';
    });

    // Options Sliders
    const sensSlider = document.getElementById('sensSlider');
    const sensValue = document.getElementById('sensValue');
    sensSlider.addEventListener('input', (e) => {
        let val = parseFloat(e.target.value);
        camera.mouseSensitivity = val;
        sensValue.innerText = val.toFixed(2);
    });

    const fovSlider = document.getElementById('fovSlider');
    const fovValue = document.getElementById('fovValue');
    fovSlider.addEventListener('input', (e) => {
        let val = parseInt(e.target.value);
        camera.fov = val * Math.PI / 180.0;
        fovValue.innerText = `${val}°`;
    });

    // --------------------------------------------------
    // Hotbar & 1st Person Hand Sway Renderer
    // --------------------------------------------------
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
                
                let slotIdx = getAtlasSlotIndex(item.id);
                let col = slotIdx % 16;
                let row = Math.floor(slotIdx / 16);
                iconEl.style.backgroundPosition = `-${col * 28}px -${row * 28}px`;
                iconEl.style.backgroundSize = `${16 * 28}px ${5 * 28}px`;
                slotEl.appendChild(iconEl);

                let countEl = document.createElement('span');
                countEl.className = 'slot-count';
                countEl.innerText = item.count > 1 ? item.count : '';
                slotEl.appendChild(countEl);
            }

            slotEl.addEventListener('click', () => {
                selectedHotbarIndex = i;
                renderHotbar();
                updateHeldHandItem();
            });

            hotbarContainer.appendChild(slotEl);
        }

        updateHeldHandItem();
    }

    function updateHeldHandItem() {
        let held = inventory.slots[selectedHotbarIndex];
        if (held && held.id) {
            heldItemHand.style.display = 'block';
            let slotIdx = getAtlasSlotIndex(held.id);
            let col = slotIdx % 16;
            let row = Math.floor(slotIdx / 16);
            heldItemHand.innerHTML = `
                <div class="hand-icon" style="background-image: url(${textureAtlas.toDataURL()}); background-position: -${col * 96}px -${row * 96}px; background-size: ${16 * 96}px ${5 * 96}px;"></div>
            `;
        } else {
            heldItemHand.style.display = 'none';
        }
    }

    function getAtlasSlotIndex(id) {
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
        if (id === 29) return 33; // Water
        if (id === 30) return 34; // Lava
        return 8;
    }

    renderHotbar();

    // --------------------------------------------------
    // Recipe Book & One-Click Quick Crafting
    // --------------------------------------------------
    function renderRecipeBook() {
        recipeBookListEl.innerHTML = '';
        crafting.RECIPES.forEach(rec => {
            let itemEl = document.createElement('div');
            itemEl.className = 'recipe-item';

            let iconEl = document.createElement('div');
            iconEl.className = 'slot-icon';
            iconEl.style.backgroundImage = `url(${textureAtlas.toDataURL()})`;
            let slotIdx = getAtlasSlotIndex(rec.id);
            let col = slotIdx % 16;
            let row = Math.floor(slotIdx / 16);
            iconEl.style.backgroundPosition = `-${col * 24}px -${row * 24}px`;
            iconEl.style.backgroundSize = `${16 * 24}px ${5 * 24}px`;

            let nameEl = document.createElement('span');
            nameEl.className = 'recipe-name';
            nameEl.innerText = rec.name;

            itemEl.appendChild(iconEl);
            itemEl.appendChild(nameEl);

            itemEl.addEventListener('click', () => {
                let success = crafting.quickCraftRecipe(rec.id);
                if (success) {
                    audioManager.playCraftSuccess();
                    refreshGUI();
                }
            });

            recipeBookListEl.appendChild(itemEl);
        });
    }

    // --------------------------------------------------
    // Inventory GUI & Drag-Splitting Handling
    // --------------------------------------------------
    let isMouseDraggingGUI = false;

    function setupGUIGrids(mainGridEl, hotbarGridEl) {
        mainGridEl.innerHTML = '';
        hotbarGridEl.innerHTML = '';

        for (let i = 9; i < 36; i++) {
            mainGridEl.appendChild(createGUISlot(i));
        }
        for (let i = 0; i < 9; i++) {
            hotbarGridEl.appendChild(createGUISlot(i));
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
            iconEl.style.backgroundSize = `${16 * 28}px ${5 * 28}px`;
            slotEl.appendChild(iconEl);

            if (item.count > 1) {
                let countEl = document.createElement('span');
                countEl.className = 'slot-count';
                countEl.innerText = item.count;
                slotEl.appendChild(countEl);
            }
        }

        slotEl.addEventListener('mousedown', (e) => {
            isMouseDraggingGUI = true;
            if (inventory.cursorItem) {
                inventory.isDragSplitting = true;
                inventory.dragSplitPass(slotIndex);
            } else {
                handleSlotClick(slotIndex, e.button === 2);
            }
            refreshGUI();
        });

        slotEl.addEventListener('mouseenter', () => {
            if (isMouseDraggingGUI && inventory.cursorItem) {
                inventory.dragSplitPass(slotIndex);
                refreshGUI();
            }
        });

        return slotEl;
    }

    document.addEventListener('mouseup', () => {
        isMouseDraggingGUI = false;
        inventory.endDragSplit();
    });

    function handleSlotClick(slotIndex, isRightClick) {
        let slotItem = inventory.slots[slotIndex];

        if (!inventory.cursorItem && slotItem) {
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
                if (isRightClick) {
                    inventory.slots[slotIndex] = { ...inventory.cursorItem, count: 1 };
                    inventory.cursorItem.count--;
                    if (inventory.cursorItem.count <= 0) inventory.cursorItem = null;
                } else {
                    inventory.slots[slotIndex] = inventory.cursorItem;
                    inventory.cursorItem = null;
                }
            } else if (slotItem.id === inventory.cursorItem.id) {
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
        renderRecipeBook();
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
                <div class="slot-icon" style="background-image: url(${textureAtlas.toDataURL()}); background-position: -${col * 32}px -${row * 32}px; background-size: ${16 * 32}px ${5 * 32}px;"></div>
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
            iconEl.style.backgroundSize = `${16 * 32}px ${5 * 32}px`;
            resEl.appendChild(iconEl);

            if (result.count > 1) {
                let countEl = document.createElement('span');
                countEl.className = 'slot-count';
                countEl.innerText = result.count;
                resEl.appendChild(countEl);
            }
        }
    }

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

    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === canvas) {
            isPointerLocked = true;
            startOverlay.style.display = 'none';
        } else {
            isPointerLocked = false;
            if (inventoryModal.style.display === 'none' && workbenchModal.style.display === 'none' && optionsModal.style.display === 'none' && multiplayerModal.style.display === 'none') {
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
        audioManager.initCtx();
        if (isPointerLocked && e.button === 0) {
            isMouseDown = true;
        } else if (isPointerLocked && e.button === 2) {
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

                    audioManager.playBlockPlace();

                    meshData = worldBridge.buildMesh();
                    renderer.updateMeshBuffer(meshData);
                    renderHotbar();

                    mpManager.sendBlockUpdate(p[0], p[1], p[2], heldSlot.id);
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
        if (e.code === 'Space') {
            if (!keys.jump && physics.onGround) audioManager.playJump();
            keys.jump = true;
        }
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.sneak = true;

        if (e.code === 'KeyE') {
            e.preventDefault();
            let isOpen = inventoryModal.style.display !== 'none' || workbenchModal.style.display !== 'none';
            toggleInventoryModal(!isOpen);
        }

        if (e.code === 'Escape') {
            if (inventoryModal.style.display !== 'none' || workbenchModal.style.display !== 'none' || optionsModal.style.display !== 'none' || multiplayerModal.style.display !== 'none') {
                inventoryModal.style.display = 'none';
                workbenchModal.style.display = 'none';
                optionsModal.style.display = 'none';
                multiplayerModal.style.display = 'none';
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

    // --------------------------------------------------
    // Main Game Loop (with Mobs, Falling Sand & Web Audio)
    // --------------------------------------------------
    let lastTime = performance.now();
    let mpSyncTimer = 0;

    function gameLoop(now) {
        let dt = (now - lastTime) / 1000.0;
        lastTime = now;

        if (isPointerLocked) {
            physics.update(camera, keys, dt);

            // Footstep audio & Hand sway
            let isMoving = keys.forward || keys.backward || keys.left || keys.right;
            if (isMoving && physics.onGround) {
                stepSoundTimer += dt;
                if (stepSoundTimer >= 0.35) {
                    stepSoundTimer = 0;
                    audioManager.playFootstep();
                }
                let swayX = Math.sin(now * 0.01) * 8;
                let swayY = Math.cos(now * 0.02) * 6;
                heldItemHand.style.transform = `translate(${swayX}px, ${swayY}px)`;
            } else {
                heldItemHand.style.transform = `translate(0px, 0px)`;
            }

            // Update 3D Mobs AI
            mobManager.update(camera.position, dt);

            // MP Transform Broadcast
            mpSyncTimer += dt;
            if (mpSyncTimer >= 0.1) {
                mpSyncTimer = 0;
                mpManager.sendTransform(camera.position, camera.yaw, camera.pitch, selectedHotbarIndex);
            }
        }

        // Falling Sand Physics Simulation Loop
        fallingSandTimer += dt;
        if (fallingSandTimer >= 0.3) {
            fallingSandTimer = 0;
            let updatedSand = false;
            let px = Math.floor(camera.position[0]);
            let pz = Math.floor(camera.position[2]);

            // Scan area around player for floating sand
            for (let sx = px - 12; sx <= px + 12; sx++) {
                for (let sz = pz - 12; sz <= pz + 12; sz++) {
                    for (let sy = 1; sy < 60; sy++) {
                        if (worldBridge.getBlock(sx, sy, sz) === 8 && worldBridge.getBlock(sx, sy - 1, sz) === 0) {
                            worldBridge.setBlock(sx, sy, sz, 0);
                            worldBridge.setBlock(sx, sy - 1, sz, 8);
                            updatedSand = true;
                        }
                    }
                }
            }
            if (updatedSand) {
                meshData = worldBridge.buildMesh();
                renderer.updateMeshBuffer(meshData);
            }
        }

        // Day/Night Cycle Calculation
        dayTime = (dayTime + dt * DAY_SPEED) % 1.0;
        let skyR = 0.55, skyG = 0.72, skyB = 0.98;
        if (dayTime > 0.45 && dayTime <= 0.55) {
            let factor = (dayTime - 0.45) / 0.1;
            skyR = 0.55 + factor * 0.35;
            skyG = 0.72 - factor * 0.30;
            skyB = 0.98 - factor * 0.75;
        } else if (dayTime > 0.55 && dayTime <= 0.85) {
            skyR = 0.05; skyG = 0.08; skyB = 0.18;
        } else if (dayTime > 0.85 && dayTime <= 0.95) {
            let factor = (dayTime - 0.85) / 0.1;
            skyR = 0.05 + factor * 0.50;
            skyG = 0.08 + factor * 0.64;
            skyB = 0.18 + factor * 0.80;
        }
        renderer.setSkyColor(skyR, skyG, skyB);

        // Target Raycast & Mining
        targetRaycast = physics.raycast(camera.position, camera.front);

        if (isPointerLocked && isMouseDown && targetRaycast) {
            let hitType = worldBridge.getBlock(targetRaycast.hit[0], targetRaycast.hit[1], targetRaycast.hit[2]);
            let heldItem = inventory.slots[selectedHotbarIndex];

            let finished = mining.updateMining(targetRaycast.hit, hitType, heldItem ? inventory.getItemMeta(heldItem.id) : null, dt);

            if (finished) {
                audioManager.playBlockBreak();

                worldBridge.setBlock(targetRaycast.hit[0], targetRaycast.hit[1], targetRaycast.hit[2], 0);
                inventory.addItem(hitType, 1);
                renderHotbar();

                meshData = worldBridge.buildMesh();
                renderer.updateMeshBuffer(meshData);

                mpManager.sendBlockUpdate(targetRaycast.hit[0], targetRaycast.hit[1], targetRaycast.hit[2], 0);
            }
        } else {
            mining.resetMining();
        }

        // Render Frame
        renderer.render(camera, targetRaycast ? targetRaycast.hit : null, mining.miningProgress);

        let pos = camera.position;
        debugHud.innerHTML = `
            <div><strong>Webcraft 3.0.0 Super Update</strong></div>
            <div>XYZ: ${pos[0].toFixed(2)} / ${pos[1].toFixed(2)} / ${pos[2].toFixed(2)}</div>
            <div>Active Mobs: ${mobManager.mobs.length} (Pigs, Sheep, Zombies)</div>
            <div>Multiplayer: ${mpManager.myPeerId ? 'Ready (' + Object.keys(mpManager.connections).length + ' Peer)' : 'Offline'}</div>
            <div>Polygons: ${(renderer.vertexCount / 3).toLocaleString()} Triangles</div>
        `;

        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
});
