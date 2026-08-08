// Minecraft-accurate Crafting Engine (2x2 Inventory & 3x3 Workbench)
class CraftingEngine {
    constructor(inventory) {
        this.inventory = inventory;
    }

    // Evaluates grid array (length 4 for 2x2, length 9 for 3x3)
    evaluateCraft(grid, is3x3 = false) {
        let rows = is3x3 ? 3 : 2;
        let cols = is3x3 ? 3 : 2;

        // Trim empty rows and columns to find recipe pattern
        let minR = rows, maxR = -1, minC = cols, maxC = -1;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let item = grid[r * cols + c];
                if (item && item.count > 0) {
                    if (r < minR) minR = r;
                    if (r > maxR) maxR = r;
                    if (c < minC) minC = c;
                    if (c > maxC) maxC = c;
                }
            }
        }

        if (maxR === -1) return null; // Empty grid

        // Extract normalized pattern matrix
        let patH = maxR - minR + 1;
        let patW = maxC - minC + 1;
        let pattern = [];
        for (let r = minR; r <= maxR; r++) {
            let rowStr = [];
            for (let c = minC; c <= maxC; c++) {
                let item = grid[r * cols + c];
                rowStr.push(item ? item.id : 0);
            }
            pattern.push(rowStr);
        }

        // Recipes Definitions
        // 1. Oak Log (5) -> Oak Planks (7) x 4
        if (patH === 1 && patW === 1 && pattern[0][0] === 5) {
            return { id: 7, count: 4, name: 'Oak Planks' };
        }

        // 2. Oak Planks (7) x 2 Vertical -> Stick (41) x 4
        if (patH === 2 && patW === 1 && pattern[0][0] === 7 && pattern[1][0] === 7) {
            return { id: 41, count: 4, name: 'Stick' };
        }

        // 3. Oak Planks (7) x 4 (2x2) -> Crafting Table (19) x 1
        if (patH === 2 && patW === 2 &&
            pattern[0][0] === 7 && pattern[0][1] === 7 &&
            pattern[1][0] === 7 && pattern[1][1] === 7) {
            return { id: 19, count: 1, name: 'Crafting Table' };
        }

        // 4. Oak Planks (7) x 8 (3x3 Hollow) -> Chest (20) x 1
        if (patH === 3 && patW === 3 &&
            pattern[0][0] === 7 && pattern[0][1] === 7 && pattern[0][2] === 7 &&
            pattern[1][0] === 7 && pattern[1][1] === 0 && pattern[1][2] === 7 &&
            pattern[2][0] === 7 && pattern[2][1] === 7 && pattern[2][2] === 7) {
            return { id: 20, count: 1, name: 'Chest' };
        }

        // 5. Wooden Pickaxe (29): Top 3 Planks (7), Center 2 Sticks (41)
        if (patH === 3 && patW === 3 &&
            pattern[0][0] === 7 && pattern[0][1] === 7 && pattern[0][2] === 7 &&
            pattern[1][0] === 0 && pattern[1][1] === 41 && pattern[1][2] === 0 &&
            pattern[2][0] === 0 && pattern[2][1] === 41 && pattern[2][2] === 0) {
            return { id: 29, count: 1, name: 'Wooden Pickaxe' };
        }

        // 6. Stone Pickaxe (33): Top 3 Cobblestone (4), Center 2 Sticks (41)
        if (patH === 3 && patW === 3 &&
            pattern[0][0] === 4 && pattern[0][1] === 4 && pattern[0][2] === 4 &&
            pattern[1][0] === 0 && pattern[1][1] === 41 && pattern[1][2] === 0 &&
            pattern[2][0] === 0 && pattern[2][1] === 41 && pattern[2][2] === 0) {
            return { id: 33, count: 1, name: 'Stone Pickaxe' };
        }

        // 7. Iron Pickaxe (35): Top 3 Iron Ingots (43), Center 2 Sticks (41)
        if (patH === 3 && patW === 3 &&
            pattern[0][0] === 43 && pattern[0][1] === 43 && pattern[0][2] === 43 &&
            pattern[1][0] === 0 && pattern[1][1] === 41 && pattern[1][2] === 0 &&
            pattern[2][0] === 0 && pattern[2][1] === 41 && pattern[2][2] === 0) {
            return { id: 35, count: 1, name: 'Iron Pickaxe' };
        }

        // 8. Diamond Pickaxe (36): Top 3 Diamonds (45), Center 2 Sticks (41)
        if (patH === 3 && patW === 3 &&
            pattern[0][0] === 45 && pattern[0][1] === 45 && pattern[0][2] === 45 &&
            pattern[1][0] === 0 && pattern[1][1] === 41 && pattern[1][2] === 0 &&
            pattern[2][0] === 0 && pattern[2][1] === 41 && pattern[2][2] === 0) {
            return { id: 36, count: 1, name: 'Diamond Pickaxe' };
        }

        // 9. Wooden Axe (30): 3 Planks (7) L-shape, 2 Sticks (41)
        if (patH === 3 && patW === 2 &&
            pattern[0][0] === 7 && pattern[0][1] === 7 &&
            pattern[1][0] === 7 && pattern[1][1] === 41 &&
            pattern[2][0] === 0 && pattern[2][1] === 41) {
            return { id: 30, count: 1, name: 'Wooden Axe' };
        }

        // 10. Wooden Shovel (31): 1 Plank (7), 2 Sticks (41)
        if (patH === 3 && patW === 1 &&
            pattern[0][0] === 7 &&
            pattern[1][0] === 41 &&
            pattern[2][0] === 41) {
            return { id: 31, count: 1, name: 'Wooden Shovel' };
        }

        // 11. Wooden Sword (32): 2 Planks (7), 1 Stick (41)
        if (patH === 3 && patW === 1 &&
            pattern[0][0] === 7 &&
            pattern[1][0] === 7 &&
            pattern[2][0] === 41) {
            return { id: 32, count: 1, name: 'Wooden Sword' };
        }

        return null;
    }
}
