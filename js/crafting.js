// Minecraft-accurate Crafting Engine (2x2, 3x3 + Quick Craft Assist)
class CraftingEngine {
    constructor(inventory) {
        this.inventory = inventory;
        
        this.RECIPES = [
            { id: 7, name: 'Oak Planks x4', ingredients: [{ id: 5, count: 1 }], yieldsCount: 4 },
            { id: 41, name: 'Stick x4', ingredients: [{ id: 7, count: 2 }], yieldsCount: 4 },
            { id: 19, name: 'Crafting Table', ingredients: [{ id: 7, count: 4 }], yieldsCount: 1 },
            { id: 20, name: 'Chest', ingredients: [{ id: 7, count: 8 }], yieldsCount: 1 },
            { id: 31, name: 'Wooden Pickaxe', ingredients: [{ id: 7, count: 3 }, { id: 41, count: 2 }], yieldsCount: 1 },
            { id: 32, name: 'Wooden Axe', ingredients: [{ id: 7, count: 3 }, { id: 41, count: 2 }], yieldsCount: 1 },
            { id: 33, name: 'Wooden Shovel', ingredients: [{ id: 7, count: 1 }, { id: 41, count: 2 }], yieldsCount: 1 },
            { id: 34, name: 'Wooden Sword', ingredients: [{ id: 7, count: 2 }, { id: 41, count: 1 }], yieldsCount: 1 },
            { id: 35, name: 'Stone Pickaxe', ingredients: [{ id: 4, count: 3 }, { id: 41, count: 2 }], yieldsCount: 1 },
            { id: 37, name: 'Iron Pickaxe', ingredients: [{ id: 43, count: 3 }, { id: 41, count: 2 }], yieldsCount: 1 },
            { id: 38, name: 'Diamond Pickaxe', ingredients: [{ id: 45, count: 3 }, { id: 41, count: 2 }], yieldsCount: 1 }
        ];
    }

    // Quick Crafting assist method
    quickCraftRecipe(recipeId) {
        let recipe = this.RECIPES.find(r => r.id === recipeId);
        if (!recipe) return false;

        // Check if player has all ingredients in inventory
        for (let ing of recipe.ingredients) {
            let total = 0;
            for (let i = 0; i < 36; i++) {
                if (this.inventory.slots[i] && this.inventory.slots[i].id === ing.id) {
                    total += this.inventory.slots[i].count;
                }
            }
            if (total < ing.count) return false; // Not enough ingredients
        }

        // Deduct ingredients
        for (let ing of recipe.ingredients) {
            let needed = ing.count;
            for (let i = 0; i < 36; i++) {
                if (this.inventory.slots[i] && this.inventory.slots[i].id === ing.id) {
                    let take = Math.min(needed, this.inventory.slots[i].count);
                    this.inventory.slots[i].count -= take;
                    needed -= take;
                    if (this.inventory.slots[i].count <= 0) {
                        this.inventory.slots[i] = null;
                    }
                    if (needed <= 0) break;
                }
            }
        }

        // Give crafted item
        this.inventory.addItem(recipe.id, recipe.yieldsCount);
        return true;
    }

    evaluateCraft(grid, is3x3 = false) {
        let rows = is3x3 ? 3 : 2;
        let cols = is3x3 ? 3 : 2;

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

        if (maxR === -1) return null;

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

        // 5. Wooden Pickaxe (31)
        if (patH === 3 && patW === 3 &&
            pattern[0][0] === 7 && pattern[0][1] === 7 && pattern[0][2] === 7 &&
            pattern[1][0] === 0 && pattern[1][1] === 41 && pattern[1][2] === 0 &&
            pattern[2][0] === 0 && pattern[2][1] === 41 && pattern[2][2] === 0) {
            return { id: 31, count: 1, name: 'Wooden Pickaxe' };
        }

        // 6. Stone Pickaxe (35)
        if (patH === 3 && patW === 3 &&
            pattern[0][0] === 4 && pattern[0][1] === 4 && pattern[0][2] === 4 &&
            pattern[1][0] === 0 && pattern[1][1] === 41 && pattern[1][2] === 0 &&
            pattern[2][0] === 0 && pattern[2][1] === 41 && pattern[2][2] === 0) {
            return { id: 35, count: 1, name: 'Stone Pickaxe' };
        }

        // 7. Iron Pickaxe (37)
        if (patH === 3 && patW === 3 &&
            pattern[0][0] === 43 && pattern[0][1] === 43 && pattern[0][2] === 43 &&
            pattern[1][0] === 0 && pattern[1][1] === 41 && pattern[1][2] === 0 &&
            pattern[2][0] === 0 && pattern[2][1] === 41 && pattern[2][2] === 0) {
            return { id: 37, count: 1, name: 'Iron Pickaxe' };
        }

        // 8. Diamond Pickaxe (38)
        if (patH === 3 && patW === 3 &&
            pattern[0][0] === 45 && pattern[0][1] === 45 && pattern[0][2] === 45 &&
            pattern[1][0] === 0 && pattern[1][1] === 41 && pattern[1][2] === 0 &&
            pattern[2][0] === 0 && pattern[2][1] === 41 && pattern[2][2] === 0) {
            return { id: 38, count: 1, name: 'Diamond Pickaxe' };
        }

        return null;
    }
}
