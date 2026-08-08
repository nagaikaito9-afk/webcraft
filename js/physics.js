// Physics Engine, Player AABB Collision & Raycasting
class PhysicsEngine {
    constructor(worldBridge) {
        this.world = worldBridge;
        this.playerRadius = 0.3; // 0.6m width
        this.playerHeight = 1.7; // 1.7m height
        this.velocity = [0, 0, 0];
        this.onGround = false;
        this.gravity = -24.0;
        this.jumpForce = 8.2;
        this.moveSpeed = 6.0;
    }

    update(camera, inputState, dt) {
        if (dt > 0.1) dt = 0.1; // Clamp delta time

        // Calculate move direction relative to camera yaw
        let forward = [camera.front[0], 0, camera.front[2]];
        let lenF = Math.hypot(forward[0], forward[2]);
        if (lenF > 0.0001) {
            forward[0] /= lenF;
            forward[2] /= lenF;
        }

        let right = [camera.right[0], 0, camera.right[2]];
        let lenR = Math.hypot(right[0], right[2]);
        if (lenR > 0.0001) {
            right[0] /= lenR;
            right[2] /= lenR;
        }

        let moveDir = [0, 0, 0];
        if (inputState.forward)  { moveDir[0] += forward[0]; moveDir[2] += forward[2]; }
        if (inputState.backward) { moveDir[0] -= forward[0]; moveDir[2] -= forward[2]; }
        if (inputState.left)     { moveDir[0] -= right[0];   moveDir[2] -= right[2]; }
        if (inputState.right)    { moveDir[0] += right[0];   moveDir[2] += right[2]; }

        let moveLen = Math.hypot(moveDir[0], moveDir[2]);
        if (moveLen > 0.0001) {
            let speed = inputState.sneak ? this.moveSpeed * 0.4 : this.moveSpeed;
            moveDir[0] = (moveDir[0] / moveLen) * speed;
            moveDir[2] = (moveDir[2] / moveLen) * speed;
        }

        // Apply velocities with smooth damping
        this.velocity[0] += (moveDir[0] - this.velocity[0]) * 15.0 * dt;
        this.velocity[2] += (moveDir[2] - this.velocity[2]) * 15.0 * dt;

        // Jump
        if (inputState.jump && this.onGround) {
            this.velocity[1] = this.jumpForce;
            this.onGround = false;
        }

        // Apply Gravity
        this.velocity[1] += this.gravity * dt;

        // Perform AABB Movement & Collision axis by axis
        let pos = [...camera.position];
        // Shift camera position down to feet position for collision AABB
        let feetY = pos[1] - 1.5;

        // Move X
        pos[0] += this.velocity[0] * dt;
        if (this.checkCollision(pos[0], feetY, pos[2])) {
            pos[0] -= this.velocity[0] * dt;
            this.velocity[0] = 0;
        }

        // Move Z
        pos[2] += this.velocity[2] * dt;
        if (this.checkCollision(pos[0], feetY, pos[2])) {
            pos[2] -= this.velocity[2] * dt;
            this.velocity[2] = 0;
        }

        // Move Y
        feetY += this.velocity[1] * dt;
        if (this.checkCollision(pos[0], feetY, pos[2])) {
            feetY -= this.velocity[1] * dt;
            if (this.velocity[1] < 0) {
                this.onGround = true;
            }
            this.velocity[1] = 0;
        } else {
            this.onGround = false;
        }

        // Update Camera Position
        camera.position[0] = pos[0];
        camera.position[1] = feetY + 1.5; // Eye height offset
        camera.position[2] = pos[2];
    }

    checkCollision(x, feetY, z) {
        let minX = Math.floor(x - this.playerRadius);
        let maxX = Math.floor(x + this.playerRadius);
        let minY = Math.floor(feetY);
        let maxY = Math.floor(feetY + this.playerHeight);
        let minZ = Math.floor(z - this.playerRadius);
        let maxZ = Math.floor(z + this.playerRadius);

        for (let intX = minX; intX <= maxX; intX++) {
            for (let intY = minY; intY <= maxY; intY++) {
                for (let intZ = minZ; intZ <= maxZ; intZ++) {
                    if (this.world.getBlock(intX, intY, intZ) !== 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // 3D DDA Raycast for block selection
    raycast(origin, dir, maxDistance = 6.0) {
        let x = Math.floor(origin[0]);
        let y = Math.floor(origin[1]);
        let z = Math.floor(origin[2]);

        let stepX = dir[0] > 0 ? 1 : -1;
        let stepY = dir[1] > 0 ? 1 : -1;
        let stepZ = dir[2] > 0 ? 1 : -1;

        let deltaX = Math.abs(1 / dir[0]);
        let deltaY = Math.abs(1 / dir[1]);
        let deltaZ = Math.abs(1 / dir[2]);

        let maxX = (dir[0] > 0 ? (x + 1 - origin[0]) : (origin[0] - x)) * deltaX;
        let maxY = (dir[1] > 0 ? (y + 1 - origin[1]) : (origin[1] - y)) * deltaY;
        let maxZ = (dir[2] > 0 ? (z + 1 - origin[2]) : (origin[2] - z)) * deltaZ;

        let hitBlock = null;
        let targetFaceNormal = [0, 0, 0];
        let distance = 0;

        while (distance <= maxDistance) {
            let blockType = this.world.getBlock(x, y, z);
            if (blockType !== 0) {
                hitBlock = [x, y, z];
                break;
            }

            if (maxX < maxY) {
                if (maxX < maxZ) {
                    x += stepX;
                    distance = maxX;
                    maxX += deltaX;
                    targetFaceNormal = [-stepX, 0, 0];
                } else {
                    z += stepZ;
                    distance = maxZ;
                    maxZ += deltaZ;
                    targetFaceNormal = [0, 0, -stepZ];
                }
            } else {
                if (maxY < maxZ) {
                    y += stepY;
                    distance = maxY;
                    maxY += deltaY;
                    targetFaceNormal = [0, -stepY, 0];
                } else {
                    z += stepZ;
                    distance = maxZ;
                    maxZ += deltaZ;
                    targetFaceNormal = [0, 0, -stepZ];
                }
            }
        }

        if (hitBlock) {
            let placeBlock = [
                hitBlock[0] + targetFaceNormal[0],
                hitBlock[1] + targetFaceNormal[1],
                hitBlock[2] + targetFaceNormal[2]
            ];
            return { hit: hitBlock, place: placeBlock, normal: targetFaceNormal };
        }
        return null;
    }
}
