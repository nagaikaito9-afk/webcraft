// Minecraft-style Full Inventory System & Slot Management
class InventorySystem {
    constructor() {
        this.HOTBAR_SIZE = 9;
        this.MAIN_SIZE = 27;
        
        // 9 Hotbar + 27 Main Inventory Slots
        this.slots = new Array(36).fill(null);
        
        // Crafting Slots (2x2 or 3x3)
        this.craftingGrid = new Array(9).fill(null);
        this.craftingResult = null;

        // Currently dragged item on cursor
        this.cursorItem = null;

        this.initDefaultItems();
    }

    initDefaultItems() {
        // Initialize player with starter items in hotbar
        this.slots[0] = { id: 1, count: 64, name: 'Grass Block' };
        this.slots[1] = { id: 2, count: 64, name: 'Dirt Block' };
        this.slots[2] = { id: 3, count: 64, name: 'Stone Block' };
        this.slots[3] = { id: 5, count: 32, name: 'Oak Log' };
        this.slots[4] = { id: 7, count: 64, name: 'Oak Planks' };
        this.slots[5] = { id: 10, count: 32, name: 'Glass' };
        this.slots[6] = { id: 19, count: 4,  name: 'Crafting Table' };
        this.slots[7] = { id: 12, count: 16, name: 'Iron Ore' };
        this.slots[8] = { id: 14, count: 8,  name: 'Diamond Ore' };
    }

    getItemMeta(id) {
        const ITEMS = {
            1:  { name: 'Grass Block', isBlock: true },
            2:  { name: 'Dirt Block', isBlock: true },
            3:  { name: 'Stone Block', isBlock: true },
            4:  { name: 'Cobblestone', isBlock: true },
            5:  { name: 'Oak Log', isBlock: true },
            6:  { name: 'Oak Leaves', isBlock: true },
            7:  { name: 'Oak Planks', isBlock: true },
            8:  { name: 'Sand', isBlock: true },
            9:  { name: 'Sandstone', isBlock: true },
            10: { name: 'Glass', isBlock: true },
            11: { name: 'Coal Ore', isBlock: true },
            12: { name: 'Iron Ore', isBlock: true },
            13: { name: 'Gold Ore', isBlock: true },
            14: { name: 'Diamond Ore', isBlock: true },
            15: { name: 'Obsidian', isBlock: true },
            16: { name: 'Bricks', isBlock: true },
            17: { name: 'Bookshelf', isBlock: true },
            18: { name: 'Mossy Cobble', isBlock: true },
            19: { name: 'Crafting Table', isBlock: true },
            20: { name: 'Chest', isBlock: true },
            21: { name: 'TNT', isBlock: true },
            22: { name: 'Sponge', isBlock: true },
            23: { name: 'White Wool', isBlock: true },
            24: { name: 'Red Wool', isBlock: true },
            25: { name: 'Blue Wool', isBlock: true },
            26: { name: 'Green Wool', isBlock: true },
            27: { name: 'Yellow Wool', isBlock: true },
            28: { name: 'Black Wool', isBlock: true },
            // Tools
            29: { name: 'Wooden Pickaxe', isBlock: false, toolType: 'pickaxe', tierMultiplier: 2.0 },
            30: { name: 'Wooden Axe', isBlock: false, toolType: 'axe', tierMultiplier: 2.0 },
            31: { name: 'Wooden Shovel', isBlock: false, toolType: 'shovel', tierMultiplier: 2.0 },
            32: { name: 'Wooden Sword', isBlock: false, toolType: 'sword', tierMultiplier: 1.5 },
            33: { name: 'Stone Pickaxe', isBlock: false, toolType: 'pickaxe', tierMultiplier: 4.0 },
            34: { name: 'Stone Axe', isBlock: false, toolType: 'axe', tierMultiplier: 4.0 },
            35: { name: 'Iron Pickaxe', isBlock: false, toolType: 'pickaxe', tierMultiplier: 6.0 },
            36: { name: 'Diamond Pickaxe', isBlock: false, toolType: 'pickaxe', tierMultiplier: 8.0 },
            // Materials
            41: { name: 'Stick', isBlock: false },
            42: { name: 'Coal', isBlock: false },
            43: { name: 'Iron Ingot', isBlock: false },
            44: { name: 'Gold Ingot', isBlock: false },
            45: { name: 'Diamond', isBlock: false }
        };

        return ITEMS[id] || { name: 'Unknown Item', isBlock: false };
    }

    addItem(id, count = 1) {
        let meta = this.getItemMeta(id);
        // Try stacking
        for (let i = 0; i < 36; i++) {
            if (this.slots[i] && this.slots[i].id === id && this.slots[i].count < 64) {
                let addable = Math.min(count, 64 - this.slots[i].count);
                this.slots[i].count += addable;
                count -= addable;
                if (count <= 0) return true;
            }
        }
        // Place in empty slot
        for (let i = 0; i < 36; i++) {
            if (!this.slots[i]) {
                this.slots[i] = { id, count, name: meta.name };
                return true;
            }
        }
        return false; // Inventory full
    }
}
