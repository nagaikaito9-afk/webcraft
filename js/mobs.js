// 3D Voxel Mob Engine (Pigs, Sheep & Hostile Zombies with AI)
class MobEntity {
    constructor(id, type, x, y, z) {
        this.id = id;
        this.type = type; // 'pig', 'sheep', 'zombie'
        this.position = [x, y, z];
        this.rotation = Math.random() * Math.PI * 2;
        this.health = (type === 'zombie') ? 20 : 10;
        this.speed = (type === 'zombie') ? 3.2 : 1.8;
        this.moveTimer = 0;
        this.isHostile = (type === 'zombie');
    }

    update(playerPos, worldBridge, dt) {
        // Wandering / Chasing AI
        this.moveTimer -= dt;

        if (this.isHostile) {
            // Zombie Chase Player
            let dx = playerPos[0] - this.position[0];
            let dz = playerPos[2] - this.position[2];
            let dist = Math.hypot(dx, dz);
            if (dist < 20.0 && dist > 0.5) {
                this.rotation = Math.atan2(dz, dx);
                let vx = (dx / dist) * this.speed * dt;
                let vz = (dz / dist) * this.speed * dt;
                this.position[0] += vx;
                this.position[2] += vz;
            }
        } else {
            // Passive Wandering
            if (this.moveTimer <= 0) {
                this.moveTimer = 2.0 + Math.random() * 3.0;
                this.rotation = Math.random() * Math.PI * 2;
            }

            let vx = Math.cos(this.rotation) * this.speed * dt;
            let vz = Math.sin(this.rotation) * this.speed * dt;
            
            let nextX = this.position[0] + vx;
            let nextZ = this.position[2] + vz;

            // Simple collision check with world blocks
            let blockX = Math.floor(nextX);
            let blockY = Math.floor(this.position[1]);
            let blockZ = Math.floor(nextZ);

            if (worldBridge.getBlock(blockX, blockY, blockZ) === 0) {
                this.position[0] = nextX;
                this.position[2] = nextZ;
            } else {
                // Try jump or change direction
                this.rotation += Math.PI;
            }
        }
    }
}

class MobManager {
    constructor(worldBridge) {
        this.world = worldBridge;
        this.mobs = [];
        this.spawnMobs();
    }

    spawnMobs() {
        // Spawn 8 Passive Mobs (Pigs & Sheep)
        for (let i = 0; i < 8; i++) {
            let x = 30 + Math.floor(Math.random() * 60);
            let z = 30 + Math.floor(Math.random() * 60);
            let y = 35;
            let type = (i % 2 === 0) ? 'pig' : 'sheep';
            this.mobs.push(new MobEntity('mob_' + i, type, x, y, z));
        }

        // Spawn 4 Hostile Zombies
        for (let i = 0; i < 4; i++) {
            let x = 40 + Math.floor(Math.random() * 40);
            let z = 40 + Math.floor(Math.random() * 40);
            this.mobs.push(new MobEntity('zombie_' + i, 'zombie', x, 35, z));
        }
    }

    update(playerPos, dt) {
        this.mobs.forEach(mob => {
            mob.update(playerPos, this.world, dt);
        });
    }
}
