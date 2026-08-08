// Mining Engine: Progressive Block Digging, Tool Efficiency & Hardness
class MiningEngine {
    constructor() {
        // Block Base Break Time (in seconds with hand)
        this.HARDNESS = {
            1: 0.6,   // Grass
            2: 0.5,   // Dirt
            3: 1.5,   // Stone
            4: 2.0,   // Cobblestone
            5: 2.0,   // Oak Log
            6: 0.2,   // Leaves
            7: 2.0,   // Oak Planks
            8: 0.5,   // Sand
            9: 1.0,   // Sandstone
            10: 0.3,  // Glass
            11: 3.0,  // Coal Ore
            12: 4.0,  // Iron Ore
            13: 4.0,  // Gold Ore
            14: 5.0,  // Diamond Ore
            15: 12.0, // Obsidian
            16: 2.0,  // Bricks
            17: 1.5,  // Bookshelf
            18: 2.0,  // Mossy Cobble
            19: 2.5,  // Crafting Table
            20: 2.5,  // Chest
            21: 0.0,  // TNT
            22: 0.6,  // Sponge
            23: 0.8,  // Wool White
            24: 0.8,  // Wool Red
            25: 0.8,  // Wool Blue
            26: 0.8,  // Wool Green
            27: 0.8,  // Wool Yellow
            28: 0.8   // Wool Black
        };

        // Tool categories
        this.TOOL_TYPES = {
            PICKAXE: [3, 4, 9, 11, 12, 13, 14, 15, 16, 18],
            AXE: [5, 7, 17, 19, 20],
            SHOVEL: [1, 2, 8]
        };

        this.currentMiningPos = null;
        this.miningProgress = 0.0; // 0.0 to 1.0
        this.activeTargetBlock = null;
    }

    getToolSpeedMultiplier(blockType, heldItem) {
        if (!heldItem || !heldItem.toolType) return 1.0;

        let toolCategory = heldItem.toolType; // 'pickaxe', 'axe', 'shovel'
        let tierMultiplier = heldItem.tierMultiplier || 1.0;

        if (toolCategory === 'pickaxe' && this.TOOL_TYPES.PICKAXE.includes(blockType)) {
            return tierMultiplier;
        }
        if (toolCategory === 'axe' && this.TOOL_TYPES.AXE.includes(blockType)) {
            return tierMultiplier;
        }
        if (toolCategory === 'shovel' && this.TOOL_TYPES.SHOVEL.includes(blockType)) {
            return tierMultiplier;
        }

        return 1.0;
    }

    updateMining(targetBlock, blockType, heldItem, dt) {
        if (!targetBlock || blockType === 0) {
            this.resetMining();
            return false;
        }

        // Target changed
        if (!this.currentMiningPos ||
            this.currentMiningPos[0] !== targetBlock[0] ||
            this.currentMiningPos[1] !== targetBlock[1] ||
            this.currentMiningPos[2] !== targetBlock[2]) {
            this.currentMiningPos = [...targetBlock];
            this.miningProgress = 0.0;
        }

        let baseHardness = this.HARDNESS[blockType] || 1.0;
        if (baseHardness <= 0.01) return true; // Instant break (TNT)

        let speed = this.getToolSpeedMultiplier(blockType, heldItem);
        this.miningProgress += (dt * speed) / baseHardness;

        if (this.miningProgress >= 1.0) {
            this.resetMining();
            return true; // Mining completed
        }

        return false;
    }

    resetMining() {
        this.currentMiningPos = null;
        this.miningProgress = 0.0;
    }
}
