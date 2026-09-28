import { Preferences } from '@capacitor/preferences';

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

export async function getApiKey() {
  const { value } = await Preferences.get({ key: 'api_key' });
  if (!value) return null;
  try {
    return atob(value);
  } catch {
    return null;
  }
}

export async function setApiKey(key) {
  await Preferences.set({ key: 'api_key', value: btoa(key.trim()) });
}

export async function getRecipes(ingredients, budget, exclude, servings, category) {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('请先设置 API Key');
  }

  if (!ingredients || ingredients.length === 0) {
    throw new Error('请至少输入一个食材');
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
        'Authorization': `Bearer ${apiKey}`,
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
      throw new Error(data.error.message || 'API 调用失败');
    }

    if (!data.choices || data.choices.length === 0) {
      throw new Error('API 返回数据格式异常');
    }

    const content = data.choices[0].message.content;
    let recipes;
    try {
      recipes = JSON.parse(content);
    } catch {
      recipes = [{ name: '解析失败', category: '其他', ingredients: [], steps: [content], estimatedCost: 0 }];
    }

    return recipes;
  } catch (err) {
    console.error('API 调用错误:', err);
    throw err;
  }
}
