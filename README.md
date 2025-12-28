# 简约短链接生成器

一个基于 Cloudflare Workers 和 KV 存储的短链接生成服务。
因为[Cloudflare](https://www.cloudflare.com)的免费套餐有限制，所以不提供预览地址，请自行前往[cloudflare Work](https://dash.cloudflare.com)部署。  
正常来说免费套餐私人使用是完全够的，如有大量需求可付费升级套餐。

## 功能特点

- 🔗 生成短链接
- 🔒 支持密码保护
- ⏰ 支持链接有效期设置
- 🔢 支持访问次数限制
- 🤖 集成 Cloudflare Turnstile 人机验证
- 🎨 简洁美观的用户界面
- ✨ 支持自定义短链接

## 部署步骤

### 1. 准备工作

- 注册 [Cloudflare](https://dash.cloudflare.com) 账号
-------
- 去Workers KV中创建一个命名空间
![image](https://github.com/user-attachments/assets/eb761e5d-bdfa-4ef6-8c8f-d347bd27daed)

- 去Worker的设置选选项卡中绑定KV 命名空间

- 其中变量名称填写`URL_SHORT_KV`, KV 命名空间填写你刚刚创建的命名空间

![image](https://github.com/user-attachments/assets/68db428a-c3af-42f7-90fc-43ba91f9cc7b)

复制本项目中的[index.js](/index.js)的代码到Cloudflare Worker 点击保存并部署

### 2. 配置 Turnstile

启用人机验证:

1. 在 [Cloudflare Dashboard](https://dash.cloudflare.com/?to=/:account/turnstile) 创建新的 Turnstile site key
2. 获取 site key 和 secret key
3. 在 Workers 设置中添加环境变量:
   - `TURNSTILE_SITE_KEY`: 你的 site key
   - `TURNSTILE_SECRET`: 你的 secret key

## 预览图

![image](https://github.com/user-attachments/assets/25d3c304-3b25-485a-b158-29d795439cbd)

## 使用说明

1. 访问你的 Worker URL (例如: `https://url-shortener.你的用户名.workers.dev`)
2. 输入需要缩短的链接
3. (可选) 设置:
   - 自定义短链接
   - 有效期
   - 访问密码
   - 最大访问次数
4. 点击生成按钮获取短链接

## 注意事项
#### Workers  
每个请求最多占用 10 毫秒 CPU 时间  
第一个请求后的延迟最低  
每天最多 100,000 个请求 (UTC+0)  
#### KV  
全局性的低延迟键值边缘存储  
每天最多 100,000 次读取操作  
每天最多 1,000 次写入、删除和列出操作  
  
## 许可证

MIT License

## 感谢
感谢[Cloudflare](https://www.cloudflare.com)提供平台和服务。

<p align="center">
  <img src="https://iTaoPu.Github.io/言家稗子-标准色版.png" alt="微信公眾號" />
</p>
