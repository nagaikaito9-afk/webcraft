// Webcraft - Cave Game Main Controller
document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('renderCanvas');
    const startOverlay = document.getElementById('startOverlay');
    const debugHud = document.getElementById('debugHud');
    const hotbarSlots = document.querySelectorAll('.hotbar-slot');

    // Block Mapping for Hotbar
    const hotbarBlockTypes = [
        1, // Grass
        2, // Dirt
        3, // Stone
        4, // Cobblestone
        5, // Planks
        6  // Bricks
    ];
    let selectedHotbarIndex = 0;

    // Instantiate Modules
    const worldBridge = new WorldBridge();
    await worldBridge.init(Math.floor(Math.random() * 10000));

    const renderer = new WebGLRenderer(canvas);
    const textureAtlas = TextureGenerator.generateAtlas();
    renderer.loadTextureAtlas(textureAtlas);

    const camera = new Camera();
    const physics = new PhysicsEngine(worldBridge);

    // Initial World Mesh Generation
    let meshData = worldBridge.buildMesh();
    renderer.updateMeshBuffer(meshData);

    // Input States
    const keys = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false,
        sneak: false
    };

    let isPointerLocked = false;
    let showDebug = true;
    let frameCount = 0;
    let fps = 60;
    let lastFpsUpdate = performance.now();
    let targetRaycast = null;

    // Hotbar UI Renderer Helper
    function updateHotbarUI() {
        hotbarSlots.forEach((slot, index) => {
            if (index === selectedHotbarIndex) {
                slot.classList.add('active');
            } else {
                slot.classList.remove('active');
            }
        });
    }
    updateHotbarUI();

    // Event Listeners
    window.addEventListener('resize', () => {
        renderer.resize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
    });
    renderer.resize(window.innerWidth, window.innerHeight);

    // Pointer Lock Setup
    let lockCooldown = false;
    startOverlay.addEventListener('click', () => {
        if (lockCooldown) return;
        lockCooldown = true;
        setTimeout(() => { lockCooldown = false; }, 1000);

        try {
            const req = canvas.requestPointerLock();
            if (req && typeof req.catch === 'function') {
                req.catch(err => {
                    console.warn('Pointer lock request rejected:', err);
                });
            }
        } catch (e) {
            console.warn('Pointer lock error:', e);
        }
    });

    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === canvas) {
            isPointerLocked = true;
            startOverlay.style.display = 'none';
        } else {
            isPointerLocked = false;
            startOverlay.style.display = 'flex';
        }
    });

    document.addEventListener('pointerlockerror', () => {
        console.warn('Pointer lock error event fired');
    });

    // Mouse Movement
    document.addEventListener('mousemove', (e) => {
        if (isPointerLocked) {
            camera.handleMouseMove(e.movementX, e.movementY);
        }
    });

    // Mouse Clicks (Block Mining & Placing)
    document.addEventListener('mousedown', (e) => {
        if (!isPointerLocked) return;

        targetRaycast = physics.raycast(camera.position, camera.front);
        if (!targetRaycast) return;

        if (e.button === 0) { // Left Click: Destroy Block
            worldBridge.setBlock(targetRaycast.hit[0], targetRaycast.hit[1], targetRaycast.hit[2], 0);
            meshData = worldBridge.buildMesh();
            renderer.updateMeshBuffer(meshData);
        } else if (e.button === 2) { // Right Click: Place Block
            let placeType = hotbarBlockTypes[selectedHotbarIndex];
            let p = targetRaycast.place;
            // Prevent placing block inside player body
            let playerMinX = camera.position[0] - physics.playerRadius;
            let playerMaxX = camera.position[0] + physics.playerRadius;
            let playerMinY = camera.position[1] - 1.5;
            let playerMaxY = camera.position[1] + physics.playerHeight - 1.5;
            let playerMinZ = camera.position[2] - physics.playerRadius;
            let playerMaxZ = camera.position[2] + physics.playerRadius;

            let isInsidePlayer = (p[0] + 1 > playerMinX && p[0] < playerMaxX) &&
                                 (p[1] + 1 > playerMinY && p[1] < playerMaxY) &&
                                 (p[2] + 1 > playerMinZ && p[2] < playerMaxZ);

            if (!isInsidePlayer) {
                worldBridge.setBlock(p[0], p[1], p[2], placeType);
                meshData = worldBridge.buildMesh();
                renderer.updateMeshBuffer(meshData);
            }
        }
    });

    // Prevent Context Menu on Right Click
    document.addEventListener('contextmenu', e => e.preventDefault());

    // Scroll Wheel for Hotbar
    document.addEventListener('wheel', (e) => {
        if (e.deltaY > 0) {
            selectedHotbarIndex = (selectedHotbarIndex + 1) % hotbarSlots.length;
        } else {
            selectedHotbarIndex = (selectedHotbarIndex - 1 + hotbarSlots.length) % hotbarSlots.length;
        }
        updateHotbarUI();
    });

    // Keyboard Input
    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyW') keys.forward = true;
        if (e.code === 'KeyS') keys.backward = true;
        if (e.code === 'KeyA') keys.left = true;
        if (e.code === 'KeyD') keys.right = true;
        if (e.code === 'Space') keys.jump = true;
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.sneak = true;

        if (e.code === 'F3') {
            e.preventDefault();
            showDebug = !showDebug;
            debugHud.style.display = showDebug ? 'block' : 'none';
        }

        // Hotbar Direct Keys 1-6
        if (e.key >= '1' && e.key <= '6') {
            selectedHotbarIndex = parseInt(e.key) - 1;
            updateHotbarUI();
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

        // Update FPS
        frameCount++;
        if (now - lastFpsUpdate >= 500) {
            fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
            frameCount = 0;
            lastFpsUpdate = now;
        }

        if (isPointerLocked) {
            physics.update(camera, keys, dt);
        }

        // Raycast for target block overlay
        targetRaycast = physics.raycast(camera.position, camera.front);

        // Render Frame
        renderer.render(camera, targetRaycast ? targetRaycast.hit : null);

        // Update Debug HUD
        if (showDebug) {
            let pos = camera.position;
            debugHud.innerHTML = `
                <div><strong>Webcraft 0.1.0 (Cave Game Phase)</strong></div>
                <div>FPS: ${fps}</div>
                <div>XYZ: ${pos[0].toFixed(2)} / ${pos[1].toFixed(2)} / ${pos[2].toFixed(2)}</div>
                <div>Facing: Yaw ${camera.yaw.toFixed(1)}° / Pitch ${camera.pitch.toFixed(1)}°</div>
                <div>Engine: ${worldBridge.isWasmLoaded ? 'C++ WebAssembly' : 'JS High-Perf Voxel Engine'}</div>
                <div>Vertices: ${renderer.vertexCount} (${(renderer.vertexCount / 3).toLocaleString()} Triangles)</div>
            `;
        }

        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
});
