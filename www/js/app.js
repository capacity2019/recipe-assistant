(function () {
  'use strict';

  var DB_NAME = 'recipe_db';
  var SYSTEM_PROMPT = '\u4f60\u662f\u4e00\u4e2a\u9762\u5411\u53a8\u827a\u5c0f\u767d\u7684\u83dc\u8c31\u52a9\u624b\u3002\u4f60\u7684\u4efb\u52a1\u662f\uff1a\n1. \u6839\u636e\u7528\u6237\u8f93\u5165\u7684\u98df\u6750\uff0c\u63a8\u83503-5\u4e2a\u7b80\u5355\u6613\u505a\u7684\u83dc\u8c31\n2. \u6bcf\u4e2a\u83dc\u8c31\u5fc5\u987b\u9075\u5faa\u201c\u6a21\u677f\u5316\u201d\u601d\u8def\uff0c\u6bd4\u5982\uff1a\n   - \u51c9\u62cc\u7c7b\uff1a\u98df\u6750 + \u4e07\u80fd\u51c9\u62cc\u6c41\uff08\u9171\u6cb92\u52fa+\u918b1\u52fa+\u849c\u672b+\u8fa3\u6912\u6cb9\uff0c\u62cc\u5300\uff09\n   - \u6c64\u7c7b\uff1a\u5e95\u6c64 + \u4efb\u610f\u852c\u83dc\u7ec4\u5408\uff0c\u716e5-10\u5206\u949f\n   - \u7092\u7c7b\uff1a\u98df\u6750 + \u4e07\u80fd\u7092\u9171\u6c41\uff08\u8017\u6cb91\u52fa+\u751f\u62bd1\u52fa+\u7cd6\u534a\u52fa+\u6dc0\u7c89\u6c34\uff0c\u7ffb\u7092\uff09\n   - \u7116\u716e\u7c7b\uff1a\u98df\u6750 + \u7ea2\u70e7\u6c41/\u5496\u55b1\u5757\n3. \u6b65\u9aa4\u8981\u6781\u5176\u7b80\u5355\uff0c\u6bcf\u6b65\u4e0d\u8d85\u8fc7\u4e00\u53e5\u8bdd\uff0c\u603b\u6b65\u9aa4\u4e0d\u8d85\u8fc75\u6b65\n4. \u4f7f\u7528\u5e38\u89c1\u3001\u5bb9\u6613\u8d2d\u4e70\u7684\u8f85\u6599\n5. \u4f30\u7b97\u6bcf\u9053\u83dc\u7684\u98df\u6750\u603b\u6210\u672c\uff08\u5143\uff09\n6. \u4f30\u7b97\u6bcf\u9053\u83dc\u7684\u603b\u8017\u65f6\uff08\u5206\u949f\uff09\uff0c\u5305\u542b\u5907\u83dc\u548c\u70f9\u996a\u65f6\u95f4\n\n\u5982\u679c\u7528\u6237\u8f93\u5165\u4e86\u9884\u7b97\u4e0a\u9650\uff0c\u786e\u4fdd\u63a8\u8350\u7684\u83dc\u8c31\u603b\u6210\u672c\u5728\u9884\u7b97\u5185\u3002\n\u5982\u679c\u7528\u6237\u8f93\u5165\u4e86\u4e24\u4e2a\u98df\u6750\uff0c\u4f18\u5148\u63a8\u8350\u80fd\u540c\u65f6\u6d88\u8017\u4e24\u8005\u7684\u83dc\u8c31\uff1b\u5982\u679c\u6ca1\u6709\u5408\u9002\u7684\u642d\u914d\uff0c\u53ef\u4ee5\u62c6\u6210\u4e24\u9053\u83dc\u5206\u522b\u5efa\u8bae\u3002\n\u5982\u679c\u7528\u6237\u6307\u5b9a\u4e86\u7528\u9910\u4eba\u6570\uff0c\u98df\u6750\u7528\u91cf\u8bf7\u6309\u4eba\u6570\u8c03\u6574\uff08\u9ed8\u8ba42\u4eba\u4efd\uff09\u3002\n\n\u8f93\u51fa\u683c\u5f0f\uff08JSON\u6570\u7ec4\uff09\uff1a\n[\n  {\n    \"name\": \"\u83dc\u540d\",\n    \"category\": \"\u51c9\u62cc/\u6c64/\u7092/\u7116\u716e/\u5176\u4ed6\",\n    \"ingredients\": [\"\u98df\u67501 \u7528\u91cf\", \"\u98df\u67502 \u7528\u91cf\"],\n    \"steps\": [\"\u6b65\u9aa41\", \"\u6b65\u9aa42\"],\n    \"estimatedCost\": 15,\n    \"cookingTime\": 20,\n    \"tip\": \"\u5c0f\u8d34\u58eb\uff08\u53ef\u9009\uff09\"\n  }\n]\n\n\u53ea\u8f93\u51faJSON\uff0c\u4e0d\u8981\u8f93\u51fa\u5176\u4ed6\u5185\u5bb9\u3002';

  var currentServings = 2;
  var currentCategory = '\u5168\u90e8';
  var commonIngredients = [];
  var seenRecipes = new Set();
  var dbReady = false;
  var DEEPSEEK_API_KEY = atob('c2stMzRlZmVkYzE4MGZjNGFiOTg5NmFjMjBmNjM0MDFlNzk=');

  // --- Native bridge helpers ---

  function isNative() {
    return !!(window.Capacitor && typeof window.Capacitor.nativePromise === 'function');
  }

  function nativeCall(pluginName, methodName, options) {
    if (isNative()) {
      return window.Capacitor.nativePromise(pluginName, methodName, options || {});
    }
    return Promise.reject(new Error('Native bridge not available'));
  }

  // --- SQLite helpers ---

  async function sqliteExecute(database, statement, values) {
    var options = { database: database, statement: statement };
    if (values) options.values = values;
    return nativeCall('CapacitorSQLite', 'execute', options);
  }

  async function sqliteRun(database, statement, values) {
    var options = { database: database, statement: statement };
    if (values) options.values = values;
    return nativeCall('CapacitorSQLite', 'execute', options);
  }

  async function sqliteQuery(database, statement, values) {
    var options = { database: database, statement: statement };
    if (values) options.values = values;
    return nativeCall('CapacitorSQLite', 'query', options);
  }

  // --- Database ---

  async function initDatabase() {
    if (!isNative()) {
      console.warn('Native bridge not available, database disabled');
      return false;
    }
    try {
      var ret = await nativeCall('CapacitorSQLite', 'createConnection', {
        database: DB_NAME,
        version: 1,
        encrypted: false,
        mode: 'no-encryption',
        readOnly: false
      });

      if (ret.result) {
        await nativeCall('CapacitorSQLite', 'open', { database: DB_NAME, readOnly: false });
        dbReady = true;

        await sqliteExecute(DB_NAME,
          'CREATE TABLE IF NOT EXISTS saved_recipes (' +
          'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
          'name TEXT NOT NULL, ' +
          'category TEXT NOT NULL, ' +
          'ingredients TEXT, ' +
          'steps TEXT, ' +
          'estimatedCost INTEGER, ' +
          'cookingTime INTEGER, ' +
          'tip TEXT, ' +
          'pinned INTEGER DEFAULT 0, ' +
          'created_at DATETIME DEFAULT CURRENT_TIMESTAMP, ' +
          'UNIQUE(name, category))'
        );

        await sqliteExecute(DB_NAME,
          'CREATE TABLE IF NOT EXISTS common_ingredients (' +
          'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
          'name TEXT NOT NULL UNIQUE)'
        );

        console.log('Database initialized');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Database init failed:', err);
      return false;
    }
  }

  async function dbSaveRecipe(recipe) {
    try {
      var name = recipe.name, category = recipe.category,
          ingredients = recipe.ingredients, steps = recipe.steps,
          estimatedCost = recipe.estimatedCost, cookingTime = recipe.cookingTime,
          tip = recipe.tip;

      await sqliteRun(DB_NAME,
        'INSERT OR IGNORE INTO saved_recipes (name, category, ingredients, steps, estimatedCost, cookingTime, tip) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, category, JSON.stringify(ingredients), JSON.stringify(steps), estimatedCost || 0, cookingTime || 0, tip || '']
      );
      return { saved: true, message: '\u5df2\u6536\u85cf' };
    } catch (err) {
      console.error('Save recipe failed:', err);
      return { saved: false, message: '\u4fdd\u5b58\u5931\u8d25' };
    }
  }

  async function dbGetSavedRecipes(search, category) {
    try {
      var query = 'SELECT * FROM saved_recipes';
      var conditions = [];
      var values = [];

      if (search) {
        conditions.push('(name LIKE ? OR ingredients LIKE ?)');
        values.push('%' + search + '%', '%' + search + '%');
      }
      if (category && category !== '\u5168\u90e8') {
        conditions.push('category = ?');
        values.push(category);
      }
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      query += ' ORDER BY pinned DESC, created_at DESC';

      var result = await sqliteQuery(DB_NAME, query, values);
      return (result.values || []).map(function (row) {
        return {
          name: row.name,
          category: row.category,
          ingredients: JSON.parse(row.ingredients || '[]'),
          steps: JSON.parse(row.steps || '[]'),
          estimatedCost: row.estimatedCost,
          cookingTime: row.cookingTime,
          tip: row.tip,
          pinned: row.pinned === 1
        };
      });
    } catch (err) {
      console.error('Get saved recipes failed:', err);
      return [];
    }
  }

  async function dbDeleteRecipe(name, category) {
    try {
      await sqliteRun(DB_NAME, 'DELETE FROM saved_recipes WHERE name = ? AND category = ?', [name, category]);
      return { deleted: true };
    } catch (err) {
      console.error('Delete recipe failed:', err);
      return { deleted: false };
    }
  }

  async function dbTogglePinRecipe(name, category) {
    try {
      var result = await sqliteQuery(DB_NAME, 'SELECT pinned FROM saved_recipes WHERE name = ? AND category = ?', [name, category]);
      if (!result.values || result.values.length === 0) return { pinned: false };

      var currentPinned = result.values[0].pinned;
      var newPinned = currentPinned === 1 ? 0 : 1;

      await sqliteRun(DB_NAME, 'UPDATE saved_recipes SET pinned = ? WHERE name = ? AND category = ?', [newPinned, name, category]);
      return { pinned: newPinned === 1 };
    } catch (err) {
      console.error('Toggle pin failed:', err);
      return { pinned: false };
    }
  }

  async function dbGetCommonIngredients() {
    try {
      var result = await sqliteQuery(DB_NAME, 'SELECT name FROM common_ingredients ORDER BY id');
      return (result.values || []).map(function (row) { return row.name; });
    } catch (err) {
      console.error('Get common ingredients failed:', err);
      return [];
    }
  }

  async function dbAddCommonIngredient(name) {
    try {
      await sqliteRun(DB_NAME, 'INSERT OR IGNORE INTO common_ingredients (name) VALUES (?)', [name.trim()]);
      return { added: true };
    } catch (err) {
      console.error('Add ingredient failed:', err);
      return { added: false };
    }
  }

  async function dbDeleteCommonIngredient(name) {
    try {
      await sqliteRun(DB_NAME, 'DELETE FROM common_ingredients WHERE name = ?', [name]);
      return { deleted: true };
    } catch (err) {
      console.error('Delete ingredient failed:', err);
      return { deleted: false };
    }
  }

  // --- DeepSeek API ---

  async function fetchRecipes(ingredients, budget, exclude, servings, category) {
    var apiKey = DEEPSEEK_API_KEY;
    if (!ingredients || ingredients.length === 0) throw new Error('\u8bf7\u81f3\u5c11\u8f93\u5165\u4e00\u4e2a\u98df\u6750');

    var userPrompt = '\u98df\u6750\uff1a' + ingredients.join('\u3001');
    if (category && category !== '\u5168\u90e8') userPrompt += '\n\u8bf7\u53ea\u63a8\u8350' + category + '\u7c7b\u83dc\u8c31';
    if (budget) userPrompt += '\n\u9884\u7b97\u4e0a\u9650\uff1a' + budget + '\u5143';
    if (servings && servings > 0) userPrompt += '\n\u7528\u9910\u4eba\u6570\uff1a' + servings + '\u4eba';
    if (exclude && exclude.length > 0) userPrompt += '\n\u8bf7\u907f\u514d\u91cd\u590d\u63a8\u8350\u4ee5\u4e0b\u83dc\u8c31\uff1a' + exclude.join('\u3001');

    var response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8
      })
    });

    var data = await response.json();
    if (data.error) throw new Error(data.error.message || 'API \u8c03\u7528\u5931\u8d25');
    if (!data.choices || data.choices.length === 0) throw new Error('API \u8fd4\u56de\u6570\u636e\u683c\u5f0f\u5f02\u5e38');

    var content = data.choices[0].message.content;
    var recipes;
    try {
      recipes = JSON.parse(content);
    } catch (e) {
      recipes = [{ name: '\u89e3\u6790\u5931\u8d25', category: '\u5176\u4ed6', ingredients: [], steps: [content], estimatedCost: 0 }];
    }
    return recipes;
  }

  // --- Shopping Cart (localStorage) ---

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem('shoppingCart') || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem('shoppingCart', JSON.stringify(cart));
    updateCartBadge();
  }

  function updateCartBadge() {
    var cart = getCart();
    var badge = document.getElementById('cartBadge');
    badge.textContent = cart.length;
    badge.style.display = cart.length > 0 ? 'inline' : 'none';
  }

  // --- UI Functions (global) ---

  window.setServings = function (n, btn) {
    currentServings = n;
    document.querySelectorAll('.servings-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
  };

  window.setCategory = function (cat, btn) {
    currentCategory = cat;
    document.querySelectorAll('.category-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
  };

  window.switchTab = function (tab) {
    document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
    document.getElementById('generateSection').classList.add('hidden');
    document.getElementById('savedSection').classList.add('hidden');
    document.getElementById('shoppingSection').classList.add('hidden');

    if (tab === 'generate') {
      document.querySelectorAll('.tab')[0].classList.add('active');
      document.getElementById('generateSection').classList.remove('hidden');
    } else if (tab === 'saved') {
      document.querySelectorAll('.tab')[1].classList.add('active');
      document.getElementById('savedSection').classList.remove('hidden');
      loadSaved();
    } else if (tab === 'shopping') {
      document.querySelectorAll('.tab')[2].classList.add('active');
      document.getElementById('shoppingSection').classList.remove('hidden');
      renderCart();
    }
  };

  window.toggleManage = function () {
    var row = document.getElementById('manageRow');
    var btn = document.getElementById('manageToggle');
    row.classList.toggle('hidden');
    btn.textContent = row.classList.contains('hidden') ? '\u7ba1\u7406' : '\u5b8c\u6210';
  };

  window.addToInput = function (name) {
    var input = document.getElementById('ingredients');
    var current = input.value.trim();
    if (current.split(/[,，、\s]+/).filter(Boolean).includes(name)) return;
    input.value = current ? current + '\u3001' + name : name;
  };

  window.addCommonIngredient = async function () {
    var input = document.getElementById('newIngredient');
    var name = input.value.trim();
    if (!name) return;
    var result = await dbAddCommonIngredient(name);
    if (result.added) {
      commonIngredients = await dbGetCommonIngredients();
      renderTags();
    }
    input.value = '';
  };

  window.removeCommonIngredient = async function (name) {
    await dbDeleteCommonIngredient(name);
    commonIngredients = await dbGetCommonIngredients();
    renderTags();
  };

  window.useCommonIngredients = function () {
    if (commonIngredients.length === 0) {
      document.getElementById('results').innerHTML = '<div class="empty">\u8bf7\u5148\u6dfb\u52a0\u5e38\u7528\u98df\u6750</div>';
      return;
    }
    var shuffled = commonIngredients.slice().sort(function () { return Math.random() - 0.5; });
    var count = Math.min(shuffled.length, Math.random() > 0.5 ? 2 : 1);
    var picked = shuffled.slice(0, count);
    document.getElementById('ingredients').value = picked.join('\u3001');
    window.getRecipes();
  };

  window.getRecipes = async function (isRetry) {
    var ingredientsInput = document.getElementById('ingredients').value.trim();
    var budgetInput = document.getElementById('budget').value.trim();
    var resultsDiv = document.getElementById('results');
    var btn = document.getElementById('submitBtn');

    if (!ingredientsInput) {
      resultsDiv.innerHTML = '<div class="error">\u8bf7\u8f93\u5165\u81f3\u5c11\u4e00\u4e2a\u98df\u6750</div>';
      return;
    }

    if (!isRetry) seenRecipes.clear();

    var ingredients = ingredientsInput.split(/[,，、\s]+/).filter(Boolean);
    var budget = budgetInput ? parseInt(budgetInput) : null;
    var exclude = Array.from(seenRecipes);

    btn.disabled = true;
    btn.textContent = '\u751f\u6210\u4e2d...';
    resultsDiv.innerHTML = '<div class="loading"><span class="spinner"></span>\u6b63\u5728\u4e3a\u4f60\u751f\u6210\u83dc\u8c31...</div>';

    try {
      var recipes = await fetchRecipes(ingredients, budget, exclude, currentServings, currentCategory);
      var newRecipes = recipes.filter(function (r) { return !seenRecipes.has(r.name); });

      if (newRecipes.length === 0) {
        resultsDiv.innerHTML = '<div class="empty">\u5df2\u7ecf\u6ca1\u6709\u66f4\u591a\u83dc\u8c31\u4e86\uff0c\u6362\u4e2a\u98df\u6750\u8bd5\u8bd5\u5427</div>';
        return;
      }

      newRecipes.forEach(function (r) { seenRecipes.add(r.name); });

      resultsDiv.innerHTML = newRecipes.map(function (r, i) {
        return '<div class="recipe-card">' +
          '<div class="recipe-header">' +
            '<span class="recipe-name">' + r.name + '</span>' +
            '<span class="recipe-category">' + r.category + '</span>' +
          '</div>' +
          '<div class="recipe-cost">\u9884\u4f30\u6210\u672c\uff1a\u7ea6 ' + r.estimatedCost + ' \u5143</div>' +
          (r.cookingTime ? '<div class="recipe-time">\u70f9\u996a\u65f6\u95f4\uff1a\u7ea6 ' + r.cookingTime + ' \u5206\u949f</div>' : '') +
          '<div class="recipe-ingredients">\u98df\u6750\uff1a' + r.ingredients.join('\u3001') + '</div>' +
          '<ol class="recipe-steps">' + r.steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>' +
          (r.tip ? '<div class="recipe-tip">\ud83d\udca1 ' + r.tip + '</div>' : '') +
          '<button class="btn-save" id="saveBtn' + i + '" onclick="saveRecipe(' + i + ')">\u6536\u85cf</button>' +
          '<button class="btn-cart" id="cartBtn' + i + '" onclick="addToCart(' + i + ')">\u52a0\u5165\u8d2d\u7269\u6e05\u5355</button>' +
        '</div>';
      }).join('') + '<button class="btn-retry" onclick="getRecipes(true)">\u6362\u4e00\u6279</button>';

      window._currentRecipes = newRecipes;
    } catch (err) {
      resultsDiv.innerHTML = '<div class="error">' + (err.message || '\u7f51\u7edc\u9519\u8bef\uff0c\u8bf7\u91cd\u8bd5') + '</div>';
    } finally {
      btn.disabled = false;
      btn.textContent = '\u751f\u6210\u83dc\u8c31';
    }
  };

  window.saveRecipe = async function (index) {
    var recipe = window._currentRecipes[index];
    var btn = document.getElementById('saveBtn' + index);
    var result = await dbSaveRecipe(recipe);
    btn.textContent = result.saved ? '\u5df2\u6536\u85cf' : result.message;
    btn.classList.add('saved');
    btn.disabled = true;
  };

  window.deleteRecipe = async function (encodedName, category) {
    if (!confirm('\u786e\u5b9a\u8981\u5220\u9664\u8fd9\u4e2a\u83dc\u8c31\u5417\uff1f')) return;
    var name = decodeURIComponent(encodedName);
    await dbDeleteRecipe(name, category);
    loadSaved();
  };

  window.togglePin = async function (encodedName, category) {
    var name = decodeURIComponent(encodedName);
    await dbTogglePinRecipe(name, category);
    loadSaved();
  };

  window.addToCart = function (index) {
    var recipe = window._currentRecipes[index];
    var cart = getCart();
    if (cart.find(function (r) { return r.name === recipe.name; })) {
      var btn2 = document.getElementById('cartBtn' + index);
      btn2.textContent = '\u5df2\u5728\u6e05\u5355\u4e2d';
      btn2.classList.add('added');
      btn2.disabled = true;
      return;
    }
    cart.push({
      name: recipe.name,
      category: recipe.category,
      ingredients: recipe.ingredients,
      servings: currentServings
    });
    saveCart(cart);
    var btn = document.getElementById('cartBtn' + index);
    btn.textContent = '\u5df2\u5728\u6e05\u5355\u4e2d';
    btn.classList.add('added');
    btn.disabled = true;
  };

  window.removeFromCart = function (name) {
    var cart = getCart().filter(function (r) { return r.name !== name; });
    saveCart(cart);
    renderCart();
  };

  window.clearCart = function () {
    if (!confirm('\u786e\u5b9a\u8981\u6e05\u7a7a\u8d2d\u7269\u6e05\u5355\u5417\uff1f')) return;
    saveCart([]);
    renderCart();
  };

  // --- Render helpers ---

  function renderTags() {
    var container = document.getElementById('commonTags');
    if (commonIngredients.length === 0) {
      container.innerHTML = '<span style="font-size:12px;color:#999;">\u70b9\u51fb"\u7ba1\u7406"\u6dfb\u52a0\u5e38\u7528\u98df\u6750</span>';
      return;
    }
    container.innerHTML = commonIngredients.map(function (name) {
      return '<span class="tag" onclick="addToInput(\'' + name + '\')">' + name +
        '<span class="tag-remove" onclick="event.stopPropagation();removeCommonIngredient(\'' + name + '\')">\u00d7</span></span>';
    }).join('');
  }

  async function loadCommonIngredients() {
    commonIngredients = await dbGetCommonIngredients();
    renderTags();
  }

  function renderCart() {
    var cart = getCart();
    var listEl = document.getElementById('shoppingList');
    if (cart.length === 0) {
      listEl.innerHTML = '<li class="shopping-empty">\u8d2d\u7269\u6e05\u5355\u662f\u7a7a\u7684\uff0c\u53bb\u751f\u6210\u83dc\u8c31\u5e76\u6dfb\u52a0\u5427</li>';
      return;
    }

    var ingredientMap = {};
    cart.forEach(function (recipe) {
      recipe.ingredients.forEach(function (ing) {
        var match = ing.match(/^(.+?)(?:\s*(\d+.+))?$/);
        if (match) {
          var name = match[1].trim();
          var amount = match[2] || '';
          if (!ingredientMap[name]) ingredientMap[name] = [];
          if (amount) ingredientMap[name].push(amount);
        }
      });
    });

    listEl.innerHTML = cart.map(function (r) {
      return '<li>' +
        '<span class="shopping-item-name">' + r.name + ' <span style="color:#999;font-size:12px;">(' + r.category + ')</span></span>' +
        '<button class="btn-delete" onclick="removeFromCart(\'' + r.name + '\')" style="margin-left:8px;">\u79fb\u9664</button>' +
      '</li>';
    }).join('') +
      '<li style="margin-top:16px;padding-top:16px;border-top:2px solid #eee;"><strong>\u98df\u6750\u6c47\u603b\uff1a</strong></li>' +
      Object.entries(ingredientMap).map(function (entry) {
        var name = entry[0], amounts = entry[1];
        return '<li>' +
          '<span class="shopping-item-name">' + name + '</span>' +
          '<span class="shopping-item-amount">' + (amounts.length > 0 ? amounts.join(' + ') : '\u9002\u91cf') + '</span>' +
        '</li>';
      }).join('');
  }

  async function loadSaved() {
    var search = document.getElementById('searchInput').value.trim();
    var category = document.getElementById('categoryFilter').value;
    var resultsDiv = document.getElementById('savedResults');
    var recipes = await dbGetSavedRecipes(search, category);

    if (recipes.length === 0) {
      resultsDiv.innerHTML = '<div class="empty">\u8fd8\u6ca1\u6709\u6536\u85cf\u7684\u83dc\u8c31\uff0c\u53bb\u751f\u6210\u4e00\u4e2a\u5427</div>';
      return;
    }

    resultsDiv.innerHTML = recipes.map(function (r) {
      return '<div class="recipe-card' + (r.pinned ? ' pinned-card' : '') + '">' +
        '<div class="recipe-header">' +
          '<span class="recipe-name">' + (r.pinned ? '&#11088; ' : '') + r.name + '</span>' +
          '<span class="recipe-category">' + r.category + '</span>' +
        '</div>' +
        (r.estimatedCost ? '<div class="recipe-cost">\u9884\u4f30\u6210\u672c\uff1a\u7ea6 ' + r.estimatedCost + ' \u5143</div>' : '') +
        (r.cookingTime ? '<div class="recipe-time">\u70f9\u996a\u65f6\u95f4\uff1a\u7ea6 ' + r.cookingTime + ' \u5206\u949f</div>' : '') +
        (r.ingredients ? '<div class="recipe-ingredients">\u98df\u6750\uff1a' + r.ingredients.join('\u3001') + '</div>' : '') +
        (r.steps ? '<ol class="recipe-steps">' + r.steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>' : '') +
        (r.tip ? '<div class="recipe-tip">\ud83d\udca1 ' + r.tip + '</div>' : '') +
        '<button class="btn-pin' + (r.pinned ? ' pinned' : '') + '" onclick="togglePin(\'' + encodeURIComponent(r.name) + '\', \'' + r.category + '\', this)">' + (r.pinned ? '\u5df2\u7f6e\u9876' : '\u7f6e\u9876') + '</button>' +
        '<button class="btn-delete" onclick="deleteRecipe(\'' + encodeURIComponent(r.name) + '\', \'' + r.category + '\')">\u5220\u9664</button>' +
      '</div>';
    }).join('');
  }

  // --- Init ---

  console.log('App starting, native bridge available:', isNative());

  (async function () {
    await initDatabase();
    await loadCommonIngredients();
    updateCartBadge();
  })();

})();
