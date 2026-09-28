import { CapacitorSQLite } from '@capacitor-community/sqlite';

const DB_NAME = 'recipe_db';
let db = null;

export async function initDatabase() {
  try {
    const ret = await CapacitorSQLite.createConnection({
      database: DB_NAME,
      version: 1,
      encrypted: false,
      mode: 'no-encryption',
      readOnly: false
    });

    if (ret.result) {
      await CapacitorSQLite.open({ database: DB_NAME, readOnly: false });
      db = DB_NAME;

      await CapacitorSQLite.execute({
        database: DB_NAME,
        statement: `
          CREATE TABLE IF NOT EXISTS saved_recipes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            ingredients TEXT,
            steps TEXT,
            estimatedCost INTEGER,
            cookingTime INTEGER,
            tip TEXT,
            pinned INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(name, category)
          );
        `
      });

      await CapacitorSQLite.execute({
        database: DB_NAME,
        statement: `
          CREATE TABLE IF NOT EXISTS common_ingredients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
          );
        `
      });

      console.log('数据库初始化成功');
      return true;
    }
    return false;
  } catch (err) {
    console.error('数据库初始化失败:', err);
    return false;
  }
}

export async function saveRecipe(recipe) {
  try {
    const { name, category, ingredients, steps, estimatedCost, cookingTime, tip } = recipe;
    const ingredientsJson = JSON.stringify(ingredients);
    const stepsJson = JSON.stringify(steps);

    await CapacitorSQLite.run({
      database: DB_NAME,
      statement: `
        INSERT OR IGNORE INTO saved_recipes (name, category, ingredients, steps, estimatedCost, cookingTime, tip)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      values: [name, category, ingredientsJson, stepsJson, estimatedCost || 0, cookingTime || 0, tip || '']
    });

    return { saved: true, message: '已收藏' };
  } catch (err) {
    console.error('保存菜谱失败:', err);
    return { saved: false, message: '保存失败' };
  }
}

export async function getSavedRecipes(search, category) {
  try {
    let query = 'SELECT * FROM saved_recipes';
    const conditions = [];
    const values = [];

    if (search) {
      conditions.push('(name LIKE ? OR ingredients LIKE ?)');
      values.push(`%${search}%`, `%${search}%`);
    }

    if (category && category !== '全部') {
      conditions.push('category = ?');
      values.push(category);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY pinned DESC, created_at DESC';

    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: query,
      values: values
    });

    const recipes = result.values.map(row => ({
      name: row.name,
      category: row.category,
      ingredients: JSON.parse(row.ingredients || '[]'),
      steps: JSON.parse(row.steps || '[]'),
      estimatedCost: row.estimatedCost,
      cookingTime: row.cookingTime,
      tip: row.tip,
      pinned: row.pinned === 1
    }));

    return recipes;
  } catch (err) {
    console.error('获取菜谱失败:', err);
    return [];
  }
}

export async function deleteRecipe(name, category) {
  try {
    await CapacitorSQLite.run({
      database: DB_NAME,
      statement: 'DELETE FROM saved_recipes WHERE name = ? AND category = ?',
      values: [name, category]
    });
    return { deleted: true };
  } catch (err) {
    console.error('删除菜谱失败:', err);
    return { deleted: false };
  }
}

export async function togglePinRecipe(name, category) {
  try {
    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: 'SELECT pinned FROM saved_recipes WHERE name = ? AND category = ?',
      values: [name, category]
    });

    if (result.values.length === 0) {
      return { pinned: false };
    }

    const currentPinned = result.values[0].pinned;
    const newPinned = currentPinned === 1 ? 0 : 1;

    await CapacitorSQLite.run({
      database: DB_NAME,
      statement: 'UPDATE saved_recipes SET pinned = ? WHERE name = ? AND category = ?',
      values: [newPinned, name, category]
    });

    return { pinned: newPinned === 1 };
  } catch (err) {
    console.error('切换置顶状态失败:', err);
    return { pinned: false };
  }
}

export async function getCommonIngredients() {
  try {
    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: 'SELECT name FROM common_ingredients ORDER BY id'
    });
    return result.values.map(row => row.name);
  } catch (err) {
    console.error('获取常用食材失败:', err);
    return [];
  }
}

export async function addCommonIngredient(name) {
  try {
    await CapacitorSQLite.run({
      database: DB_NAME,
      statement: 'INSERT OR IGNORE INTO common_ingredients (name) VALUES (?)',
      values: [name.trim()]
    });
    return { added: true };
  } catch (err) {
    console.error('添加食材失败:', err);
    return { added: false };
  }
}

export async function deleteCommonIngredient(name) {
  try {
    await CapacitorSQLite.run({
      database: DB_NAME,
      statement: 'DELETE FROM common_ingredients WHERE name = ?',
      values: [name]
    });
    return { deleted: true };
  } catch (err) {
    console.error('删除食材失败:', err);
    return { deleted: false };
  }
}
