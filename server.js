require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const RECIPES_DIR = path.join(__dirname, '我的菜谱');
const INGREDIENTS_FILE = path.join(__dirname, '常用食材.json');

function readIngredients() {
  if (!fs.existsSync(INGREDIENTS_FILE)) return [];
  return JSON.parse(fs.readFileSync(INGREDIENTS_FILE, 'utf-8'));
}

function writeIngredients(list) {
  fs.writeFileSync(INGREDIENTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

const PINNED_FILE = path.join(__dirname, 'pinned.json');

function readPinned() {
  if (!fs.existsSync(PINNED_FILE)) return [];
  return JSON.parse(fs.readFileSync(PINNED_FILE, 'utf-8'));
}

function writePinned(list) {
  fs.writeFileSync(PINNED_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM_PROMPT = `你是一个面向厨艺小白的菜谱助手。你的任务是：
1. 根据用户输入的食材，推荐3-5个简单易做的菜谱
2. 每个菜谱必须遵循"模板化"思路，比如：
   - 凉拌类：食材 + 万能凉拌汁（酱油2勺+醋1勺+蒜末+辣椒油，拌匀）
   - 汤类：底汤 + 任意蔬菜组合，煮5-10分钟
   - 炒类：食材 + 万能炒酱汁（蚝油1勺+生抽1勺+糖半勺+淀粉水，翻炒）
   - 焖煮类：食材 + 红烧汁/咖喱块
3. 步骤要极其简单，每步不超过一句话，总步骤不超过5步
4. 使用常见、容易购买的辅料
5. 估算每道菜的食材总成本（元）
6. 估算每道菜的总耗时（分钟），包含备菜和烹饪时间

如果用户输入了预算上限，确保推荐的菜谱总成本在预算内。
如果用户输入了两个食材，优先推荐能同时消耗两者的菜谱；如果没有合适的搭配，可以拆成两道菜分别建议。
如果用户指定了用餐人数，食材用量请按人数调整（默认2人份）。

输出格式（JSON数组）：
[
  {
    "name": "菜名",
    "category": "凉拌/汤/炒/焖煮/其他",
    "ingredients": ["食材1 用量", "食材2 用量"],
    "steps": ["步骤1", "步骤2"],
    "estimatedCost": 15,
    "cookingTime": 20,
    "tip": "小贴士（可选）"
  }
]

只输出JSON，不要输出其他内容。`;

app.post('/api/recipes', async (req, res) => {
  const { ingredients, budget, exclude, servings, category } = req.body;

  if (!ingredients || ingredients.length === 0) {
    return res.status(400).json({ error: '请至少输入一个食材' });
  }

  let userPrompt = `食材：${ingredients.join('、')}`;
  if (category && category !== '全部') {
    userPrompt += `\n请只推荐${category}类菜谱`;
  }
  if (budget) {
    userPrompt += `\n预算上限：${budget}元`;
  }
  if (servings && servings > 0) {
    userPrompt += `\n用餐人数：${servings}人`;
  }
  if (exclude && exclude.length > 0) {
    userPrompt += `\n请避免重复推荐以下菜谱：${exclude.join('、')}`;
  }

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message || 'API 调用失败' });
    }

    if (!data.choices || data.choices.length === 0) {
      return res.status(500).json({ error: 'API 返回数据格式异常' });
    }

    const content = data.choices[0].message.content;
    let recipes;
    try {
      recipes = JSON.parse(content);
    } catch {
      recipes = [{ name: '解析失败', category: '其他', ingredients: [], steps: [content], estimatedCost: 0 }];
    }

    res.json({ recipes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.post('/api/recipes/save', (req, res) => {
  const { name, category, ingredients, steps, estimatedCost, cookingTime, tip } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: '菜名和分类不能为空' });
  }

  const categoryDir = path.join(RECIPES_DIR, category);
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }

  const fileName = `${name}.md`;
  const filePath = path.join(categoryDir, fileName);

  if (fs.existsSync(filePath)) {
    return res.json({ saved: false, message: '该菜谱已收藏' });
  }

  const content = `# ${name}

**分类：** ${category}
**预估成本：** 约 ${estimatedCost || 0} 元
**烹饪时间：** 约 ${cookingTime || 0} 分钟

## 食材

${ingredients.map(i => `- ${i}`).join('\n')}

## 步骤

${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

${tip ? `## 小贴士\n\n${tip}` : ''}
`;

  fs.writeFileSync(filePath, content, 'utf-8');
  res.json({ saved: true, message: '已收藏' });
});

app.get('/api/recipes/saved', (req, res) => {
  const { search, category } = req.query;
  const results = [];

  if (!fs.existsSync(RECIPES_DIR)) {
    return res.json({ recipes: [] });
  }

  const categories = fs.readdirSync(RECIPES_DIR).filter(f =>
    fs.statSync(path.join(RECIPES_DIR, f)).isDirectory()
  );

  for (const cat of categories) {
    if (category && cat !== category) continue;

    const catDir = path.join(RECIPES_DIR, cat);
    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.md'));

    for (const file of files) {
      const filePath = path.join(catDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const name = file.replace('.md', '');

      if (search) {
        const keyword = search.toLowerCase();
        if (!name.toLowerCase().includes(keyword) && !content.toLowerCase().includes(keyword)) {
          continue;
        }
      }

      const recipe = { name, category: cat, content };
      const costMatch = content.match(/预估成本[：:]\s*约\s*(\d+)/);
      if (costMatch) recipe.estimatedCost = parseInt(costMatch[1]);

      const timeMatch = content.match(/烹饪时间[：:]\s*约\s*(\d+)/);
      if (timeMatch) recipe.cookingTime = parseInt(timeMatch[1]);

      const tipMatch = content.match(/## 小贴士\n\n([\s\S]+)/);
      if (tipMatch) recipe.tip = tipMatch[1].trim();

      const ingredientsMatch = content.match(/## 食材\n\n([\s\S]+?)(?=\n## )/);
      if (ingredientsMatch) {
        recipe.ingredients = ingredientsMatch[1].trim().split('\n')
          .map(l => l.replace(/^-\s*/, '').trim())
          .filter(Boolean);
      }

      const stepsMatch = content.match(/## 步骤\n\n([\s\S]+?)(?=\n## |$)/);
      if (stepsMatch) {
        recipe.steps = stepsMatch[1].trim().split('\n')
          .map(l => l.replace(/^\d+\.\s*/, '').trim())
          .filter(Boolean);
      }

      results.push(recipe);
    }
  }

  const pinned = readPinned();
  for (const r of results) {
    r.pinned = pinned.includes(`${r.category}/${r.name}`);
  }
  results.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  res.json({ recipes: results });
});

app.post('/api/recipes/pin/:category/:name', (req, res) => {
  const key = `${req.params.category}/${decodeURIComponent(req.params.name)}`;
  const pinned = readPinned();
  const idx = pinned.indexOf(key);
  if (idx >= 0) {
    pinned.splice(idx, 1);
  } else {
    pinned.push(key);
  }
  writePinned(pinned);
  res.json({ pinned: idx < 0, pinnedList: pinned });
});

app.delete('/api/recipes/saved/:category/:name', (req, res) => {
  const { category, name } = req.params;
  const filePath = path.join(RECIPES_DIR, category, `${name}.md`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '菜谱不存在' });
  }

  fs.unlinkSync(filePath);
  const key = `${category}/${name}`;
  const pinned = readPinned().filter(k => k !== key);
  writePinned(pinned);
  res.json({ deleted: true });
});

app.get('/api/ingredients', (req, res) => {
  res.json({ ingredients: readIngredients() });
});

app.post('/api/ingredients', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: '食材名称不能为空' });
  }
  const list = readIngredients();
  const trimmed = name.trim();
  if (list.includes(trimmed)) {
    return res.json({ added: false, message: '该食材已在列表中' });
  }
  list.push(trimmed);
  writeIngredients(list);
  res.json({ added: true, ingredients: list });
});

app.delete('/api/ingredients/:name', (req, res) => {
  const name = decodeURIComponent(req.params.name);
  const list = readIngredients().filter(i => i !== name);
  writeIngredients(list);
  res.json({ deleted: true, ingredients: list });
});

app.listen(PORT, () => {
  console.log(`菜谱助手已启动: http://localhost:${PORT}`);
});
