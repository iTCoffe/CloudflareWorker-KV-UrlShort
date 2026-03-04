// Cloudflare Worker
// 使用 Cloudflare KV 存儲短鏈接數據
// 綁定變量：URL_SHORT_KV, TURNSTILE_SITE_KEY, TURNSTILE_SECRET

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  try {
    const url = new URL(request.url);
    const { pathname } = url;

    // Handle favicon request
    if (pathname === '/favicon.ico') {
      return new Response(null, { status: 204 });
    }

    if (pathname === "/") {
      // Serve the frontend
      return serveFrontend();
    }

    if (pathname.startsWith("/api")) {
      // Handle API requests
      return handleAPIRequest(request);
    }

    // Redirect for short URLs
    return handleRedirect(pathname);
  } catch (error) {
    console.error('Error handling request:', error);
    return new Response('伺服器內部錯誤', { status: 500 });
  }
}

async function serveFrontend() {
  const turnstileScript = TURNSTILE_SITE_KEY ? 
    '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>' : 
    '';
  
  const frontendHTML = `<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>簡約短網址服務</title>
    <link href="https://fastly.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔗</text></svg>">
    ${turnstileScript}
</head>
<body class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <main class="container mx-auto p-6 max-w-2xl">
        <div class="text-center mb-12">
            <h1 class="text-6xl font-extrabold mb-4">
                <span class="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 
                hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 transition-all duration-500">
                    簡約短網址
                </span>
            </h1>
            <p class="text-gray-600 text-lg mb-4">簡單、快速、安全的短網址服務</p>
            <a target="_blank" 
               class="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"></path>
                </svg>
                賽博活佛部署項目
            </a>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-8 backdrop-blur-sm bg-opacity-90">
            <form id="shorten-form" class="space-y-6">
                <div class="space-y-4">
                    <div>
                        <label for="url" class="block text-sm font-semibold text-gray-700 mb-2">
                            輸入鏈接
                            <span class="text-gray-500 font-normal">（必填）</span>
                        </label>
                        <input id="url" type="url" 
                            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200" 
                            placeholder="https://example.com" required>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-4">
                        <div>
                            <label for="slug" class="block text-sm font-semibold text-gray-700 mb-2">
                                自訂短鏈接
                                <span class="text-gray-500 font-normal">（可選）</span>
                            </label>
                            <input id="slug" type="text" 
                                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200" 
                                placeholder="自訂短鏈接">
                        </div>
                        <div>
                            <label for="expiry" class="block text-sm font-semibold text-gray-700 mb-2">
                                有效期
                                <span class="text-gray-500 font-normal">（可選）</span>
                            </label>
                            <select id="expiry" 
                                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200">
                                <option value="">永久有效</option>
                                <option value="1h">1小時</option>
                                <option value="24h">24小時</option>
                                <option value="7d">7天</option>
                                <option value="30d">30天</option>
                                <option value="custom">自訂時間</option>
                            </select>
                            <input id="customExpiry" type="datetime-local" 
                                class="hidden w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200">
                        </div>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-4">
                        <div>
                            <label for="password" class="block text-sm font-semibold text-gray-700 mb-2">
                                訪問密碼
                                <span class="text-gray-500 font-normal">（可選）</span>
                            </label>
                            <input id="password" type="password" 
                                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200" 
                                placeholder="設定密碼">
                        </div>
                        <div>
                            <label for="maxVisits" class="block text-sm font-semibold text-gray-700 mb-2">
                                最大訪問次數
                                <span class="text-gray-500 font-normal">（可選）</span>
                            </label>
                            <input id="maxVisits" type="number" 
                                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200" 
                                placeholder="10">
                        </div>
                    </div>
                </div>
                
                <div class="flex justify-center">
                    ${TURNSTILE_SITE_KEY ? 
                        '<div class="cf-turnstile" data-sitekey="' + TURNSTILE_SITE_KEY + '"></div>' : 
                        ''}
                </div>
                
                <button type="submit" 
                    class="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:-translate-y-0.5 transition duration-200">
                    生成短網址
                </button>
            </form>
            
            <div id="result" class="mt-8"></div>
        </div>
    </main>

    <script>
    document.getElementById('shorten-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      let token;
      try {
        // 確保 turnstile 物件存在
        token = typeof turnstile !== 'undefined' ? turnstile.getResponse() : null;
        if (TURNSTILE_SITE_KEY && !token) {
          document.getElementById('result').innerHTML = \`<div class="p-4 bg-red-50 rounded-lg"><p class="text-red-800">請完成人機驗證</p></div>\`;
          return;
        }
      } catch (error) {
        console.error('Turnstile error:', error);
        document.getElementById('result').innerHTML = \`<div class="p-4 bg-red-50 rounded-lg"><p class="text-red-800">人機驗證載入失敗，請重新整理頁面重試</p></div>\`;
        return;
      }
      
      const submitButton = e.target.querySelector('button[type="submit"]');
      const resultDiv = document.getElementById('result');
      
      // 禁用提交按鈕並顯示載入狀態
      submitButton.disabled = true;
      submitButton.textContent = '生成中...';
      resultDiv.innerHTML = '';
      
      try {
        const expiry = document.getElementById('expiry').value;
        let expiryDate = null;

        if (expiry) {
            const now = new Date();
            switch(expiry) {
                case '1h':
                    expiryDate = new Date(now.getTime() + 60 * 60 * 1000);
                    break;
                case '24h':
                    expiryDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    expiryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                    break;
                case 'custom':
                    // 將本地時間字串轉換為 ISO 字串（包含時區偏移）
                    const localDate = document.getElementById('customExpiry').value;
                    if (localDate) {
                        // 建構本地時間的 Date 物件（注意：new Date(localDate) 會被解析為 UTC，所以需要手動處理）
                        const [year, month, day] = localDate.split('-').map(Number);
                        const [hour, minute] = document.getElementById('customExpiry').value.split('T')[1].split(':').map(Number);
                        expiryDate = new Date(year, month-1, day, hour, minute);
                    }
                    break;
            }
        }

        const formData = {
            url: document.getElementById('url').value,
            slug: document.getElementById('slug').value,
            expiry: expiryDate ? expiryDate.toISOString() : null, // 統一傳遞 ISO 字串
            password: document.getElementById('password').value,
            maxVisits: document.getElementById('maxVisits').value,
            token: token
        };
        
        const response = await fetch('/api/shorten', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
          resultDiv.innerHTML = \`
            <div class="p-4 bg-green-50 rounded-lg">
              <p class="text-green-800 font-medium mb-2">
                短鏈接生成成功！
              </p>
              <div class="flex items-center gap-2">
                <input type="text" value="\${data.shortened}" readonly
                  class="flex-1 p-2 border border-gray-300 rounded bg-white">
                <button onclick="copyToClipboard(this, '\${data.shortened}')"
                  class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                  複製
                </button>
              </div>
            </div>
          \`;
        } else {
          resultDiv.innerHTML = \`
            <div class="p-4 bg-red-50 rounded-lg">
              <p class="text-red-800">\${data.error}</p>
            </div>
          \`;
          // 重置 Turnstile
          if (typeof turnstile !== 'undefined') {
            turnstile.reset();
          }
        }
      } catch (error) {
        resultDiv.innerHTML = \`
          <div class="p-4 bg-red-50 rounded-lg">
            <p class="text-red-800">生成短鏈接時發生錯誤，請重試</p>
          </div>
        \`;
        if (typeof turnstile !== 'undefined') {
          turnstile.reset();
        }
      }
      
      // 恢復提交按鈕狀態
      submitButton.disabled = false;
      submitButton.textContent = '生成短網址';
    });

    document.getElementById('expiry').addEventListener('change', function() {
        const customExpiryInput = document.getElementById('customExpiry');
        if (this.value === 'custom') {
            customExpiryInput.classList.remove('hidden');
        } else {
            customExpiryInput.classList.add('hidden');
        }
    });

    function copyToClipboard(button, text) {
      navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = '已複製!';
        button.classList.add('bg-green-500', 'hover:bg-green-600');
        
        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('bg-green-500', 'hover:bg-green-600');
          button.classList.add('bg-blue-500', 'hover:bg-blue-600');
        }, 2000);
      }).catch(() => {
        button.textContent = '複製失敗';
        setTimeout(() => {
          button.textContent = '複製';
        }, 2000);
      });
    }
    </script>
</body>
</html>`;

  return new Response(frontendHTML, {
    headers: { 
      "Content-Type": "text/html",
      "Cache-Control": "no-cache, no-store, must-revalidate"
    },
  });
}

async function handleAPIRequest(request) {
  try {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/shorten") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "請求方法不允許" }), { 
          status: 405,
          headers: { 
            "Content-Type": "application/json",
            "Allow": "POST"
          }
        });
      }

      const { url, slug, expiry, password, maxVisits, token } = await request.json();
      if (!url) {
        return new Response(JSON.stringify({ error: "請輸入鏈接位址" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Validate URL
      try {
        new URL(url);
      } catch {
        return new Response(JSON.stringify({ error: "鏈接格式無效" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 添加最大訪問次數驗證
      if (maxVisits && (parseInt(maxVisits) <= 0 || isNaN(parseInt(maxVisits)))) {
        return new Response(JSON.stringify({ error: "最大訪問次數必須大於0" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 添加自訂有效期驗證
      if (expiry) {
        const expiryDate = new Date(expiry);
        const now = new Date();
        if (expiryDate <= now) {
          return new Response(JSON.stringify({ error: "有效期必須大於目前時間" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // 生成或使用自訂短鏈，並確保唯一性
      let shortSlug;
      if (slug) {
        // 自訂短鏈驗證
        if (slug.length < 3) {
          return new Response(JSON.stringify({ error: "自訂鏈接至少需要3個字元" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (!/^[a-zA-Z0-9-_]+$/.test(slug)) {
          return new Response(JSON.stringify({ error: "自訂鏈接格式無效，只能使用字母、數字、橫線和底線" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        // 檢查是否存在
        const existing = await URL_SHORT_KV.get(slug);
        if (existing) {
          return new Response(JSON.stringify({ error: "該自訂鏈接已被使用" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        shortSlug = slug;
      } else {
        // 生成唯一短鏈，最多嘗試10次
        shortSlug = await generateUniqueSlug();
        if (!shortSlug) {
          return new Response(JSON.stringify({ error: "系統繁忙，請稍後重試" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // 存儲數據
      const expiryTimestamp = expiry ? new Date(expiry).getTime() : null;
      await URL_SHORT_KV.put(shortSlug, JSON.stringify({ 
        url, 
        expiry: expiryTimestamp, 
        password,
        created: Date.now(),
        maxVisits: maxVisits ? parseInt(maxVisits) : null,
        visits: 0
      }));

      const baseURL = new URL(request.url).origin;
      const shortURL = `${baseURL}/${shortSlug}`;
      return new Response(JSON.stringify({ shortened: shortURL }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (pathname.startsWith('/api/verify/')) {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "請求方法不允許" }), { 
          status: 405,
          headers: { 
            "Content-Type": "application/json",
            "Allow": "POST"
          }
        });
      }

      const slug = pathname.replace('/api/verify/', '');
      const record = await URL_SHORT_KV.get(slug);
      
      if (!record) {
        return new Response(JSON.stringify({ error: "鏈接不存在" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }

      const data = JSON.parse(record);
      const { password: correctPassword, url, maxVisits, visits = 0 } = data;
      const { password: inputPassword, token } = await request.json();

      // 驗證 Turnstile token
      if (TURNSTILE_SITE_KEY && TURNSTILE_SECRET) {
        if (!token) {
          return new Response(JSON.stringify({ error: "請完成人機驗證" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        
        const tokenValidation = await validateTurnstileToken(token);
        if (!tokenValidation.success) {
          return new Response(JSON.stringify({ error: "人機驗證失敗" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // 檢查訪問次數是否已達上限
      if (maxVisits && visits >= maxVisits) {
        // 可選的：立即刪除記錄
        await URL_SHORT_KV.delete(slug);
        return new Response(JSON.stringify({ error: "鏈接訪問次數已達上限" }), {
          status: 410,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (inputPassword === correctPassword) {
        // 密碼正確，更新訪問次數
        const newVisits = visits + 1;
        await URL_SHORT_KV.put(slug, JSON.stringify({
          ...data,
          visits: newVisits
        }));

        // 如果達到上限，立即刪除
        if (maxVisits && newVisits >= maxVisits) {
          await URL_SHORT_KV.delete(slug);
        }

        return new Response(JSON.stringify({ 
          success: true,
          url: url
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } else {
        return new Response(JSON.stringify({ 
          success: false,
          error: "密碼錯誤"
        }), {
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    return new Response(JSON.stringify({ error: "頁面不存在" }), { 
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: "伺服器內部錯誤" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleRedirect(pathname) {
  try {
    const slug = pathname.slice(1);
    const record = await URL_SHORT_KV.get(slug);

    if (!record) {
      return new Response("鏈接不存在", { 
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    const data = JSON.parse(record);
    const { url, expiry, password, maxVisits, visits = 0 } = data;

    if (expiry && Date.now() > expiry) {
      await URL_SHORT_KV.delete(slug);
      return new Response("鏈接已過期", { 
        status: 410,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    if (maxVisits && visits >= maxVisits) {
      await URL_SHORT_KV.delete(slug);
      return new Response("鏈接訪問次數已達上限", { 
        status: 410,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    // 只在沒有密碼保護時更新訪問次數
    if (maxVisits && !password) {
      data.visits = visits + 1;
      await URL_SHORT_KV.put(slug, JSON.stringify(data));
      // 如果達到上限，立即刪除
      if (data.visits >= maxVisits) {
        await URL_SHORT_KV.delete(slug);
      }
    }

    if (password) {
      const turnstileScript = TURNSTILE_SITE_KEY ? 
        '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>' : 
        '';
      
      const frontendHTML = `<!DOCTYPE html>
      <html lang="zh">
      <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>密碼保護鏈接</title>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔒</text></svg>">
      ${turnstileScript}
      </head>
      <body class="bg-gray-100">
        <main class="container mx-auto p-4 max-w-md min-h-screen flex items-center justify-center">
          <div class="bg-white rounded-lg shadow-md p-6 w-full">
            <h1 class="text-2xl font-bold mb-6 text-center text-gray-800">密碼保護鏈接</h1>
            <form id="password-form" class="space-y-4">
              <div>
                <label for="password" class="block text-sm font-medium text-gray-700 mb-1">請輸入訪問碼：</label>
                <input id="password" type="password" class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
              </div>
              <div class="flex justify-center">
                ${TURNSTILE_SITE_KEY ? 
                    '<div class="cf-turnstile" data-sitekey="' + TURNSTILE_SITE_KEY + '"></div>' : 
                    ''}
              </div>
              <button type="submit" class="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                訪問鏈接
              </button>
            </form>
            <div id="error" class="mt-4 text-red-500 text-center"></div>
          </div>
        </main>
        <script>
          document.getElementById('password-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = e.target.querySelector('button[type="submit"]');
            const inputPassword = document.getElementById('password').value;
            const errorDiv = document.getElementById('error');
            
            submitButton.disabled = true;
            submitButton.textContent = '驗證中...';
            errorDiv.textContent = '';
            
            let token = null;
            try {
              token = typeof turnstile !== 'undefined' ? turnstile.getResponse() : null;
            } catch (e) {
              console.error('Turnstile error:', e);
            }
            if (TURNSTILE_SITE_KEY && !token) {
              errorDiv.textContent = "請完成人機驗證";
              submitButton.disabled = false;
              submitButton.textContent = '訪問鏈接';
              return;
            }
            
            try {
              const response = await fetch('/api/verify/${slug}', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                  password: inputPassword,
                  token: token
                })
              });
              
              const data = await response.json();
              
              if (data.success) {
                window.location.href = data.url;
              } else {
                errorDiv.textContent = data.error || "密碼錯誤";
                // 重置 Turnstile
                if (typeof turnstile !== 'undefined') {
                  turnstile.reset();
                }
              }
            } catch (error) {
              errorDiv.textContent = "發生錯誤，請重試";
              if (typeof turnstile !== 'undefined') {
                turnstile.reset();
              }
            } finally {
              submitButton.disabled = false;
              submitButton.textContent = '訪問鏈接';
            }
          });
        </script>
      </body>
      </html>`;

      return new Response(frontendHTML, {
        headers: { 
          "Content-Type": "text/html",
          "Cache-Control": "no-cache, no-store, must-revalidate"
        },
      });
    }

    return Response.redirect(url, 302);
  } catch (error) {
    console.error('Redirect Error:', error);
    return new Response("伺服器內部錯誤", { 
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}

/**
 * 生成隨機短鏈，確保唯一性
 * 最多嘗試 MAX_ATTEMPTS 次，若失敗返回 null
 */
async function generateUniqueSlug(length = 6, maxAttempts = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const slug = Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const existing = await URL_SHORT_KV.get(slug);
    if (!existing) {
      return slug;
    }
  }
  return null;
}

async function validateTurnstileToken(token) {
  try {
    const formData = new FormData();
    formData.append('secret', TURNSTILE_SECRET);
    formData.append('response', token);

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    return { 
      success: data.success,
      error: data['error-codes']
    };
  } catch (error) {
    console.error('Turnstile validation error:', error);
    return { 
      success: false,
      error: ['驗證伺服器錯誤']
    };
  }
}