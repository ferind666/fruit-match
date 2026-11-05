# 🍎 水果消消乐 (Fruit Match-3)

一个带后端存档和排行榜的 Match-3 消除游戏。

## 快速开始

```bash
cd server
npm install    # 首次运行
npm start      # → http://localhost:3000
```

浏览器打开 `http://localhost:3000` 即可游玩——服务器同时托管前端和后端 API。

## 项目结构

```
fruit-match/
├── index.html              ← 前端：游戏引擎 + API 集成
├── README.md               ← 本文件
├── .gitignore
└── server/
    ├── package.json        ← 依赖声明
    ├── server.js           ← Express 入口，静态文件 + API 路由
    ├── db.js               ← SQLite 数据库（sql.js WASM，自动建表）
    ├── fruit-match.db      ← 数据库文件（首次启动自动生成）
    ├── middleware/
    │   └── auth.js         ← JWT 签发 & 鉴权中间件
    └── routes/
        ├── auth.js         ← 注册 / 登录
        ├── game.js         ← 存档 / 读档 / 删除
        └── leaderboard.js  ← 成绩提交 / 排行榜查询
```

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | 原生 HTML/CSS/JS，零框架 |
| 后端 | Node.js + Express |
| 数据库 | SQLite（sql.js，WASM 版，无需安装） |
| 密码 | bcryptjs 哈希 |
| 鉴权 | JWT（7 天有效） |

## 数据库设计

SQLite 单文件数据库（`server/fruit-match.db`），三张表，首次启动自动建表：

```
users                     game_saves                  leaderboard
─────────────────────     ─────────────────────       ─────────────────────
id          INTEGER PK    id          INTEGER PK      id          INTEGER PK
username    TEXT UNIQUE   user_id     INTEGER FK      user_id     INTEGER FK
password    TEXT (bcrypt) board_json  TEXT (JSON)     score       INTEGER
created_at  TEXT          score       INTEGER         moves       INTEGER
                          moves       INTEGER         best_combo  INTEGER
                          combo       INTEGER         played_at   TEXT
                          best_combo  INTEGER
                          updated_at  TEXT

users ───1:1─── game_saves
users ───1:N─── leaderboard
```

## API 接口

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|:----:|------|
| POST | `/api/auth/register` | ❌ | 注册 (`username`, `password`) → `{ token, username }` |
| POST | `/api/auth/login` | ❌ | 登录 → `{ token, username }` |
| POST | `/api/game/save` | ✅ | 保存游戏（board JSON + score/moves/combo） |
| GET | `/api/game/load` | ✅ | 读取存档 / `{ hasSave: false }` |
| DELETE | `/api/game/delete` | ✅ | 删除存档 |
| POST | `/api/leaderboard/submit` | ✅ | 提交成绩 |
| GET | `/api/leaderboard?sortBy=score&limit=20` | ❌ | 排行榜 |
| GET | `/api/health` | ❌ | 健康检查 |

鉴权方式：`Authorization: Bearer <jwt_token>`

## 前端功能

- 🎮 8×8 Match-3 消除（点击相邻水果交换）
- 💾 登录后自动存档 / 恢复存档
- 🏆 排行榜（按得分 / 最高连击排序）
- 🔑 注册 / 登录（弹窗表单）
- 💡 提示系统（高亮可消除对）
- 🔥 连击特效 + 分数弹窗
- 📱 响应式设计（适配手机）

## 数据库读写流程

```
注册 → INSERT INTO users (bcrypt 密码)
登录 → SELECT FROM users → bcrypt.compare → 签发 JWT
存档 → UPSERT INTO game_saves (board 序列化为 JSON)
读档 → SELECT FROM game_saves WHERE user_id = ?
提交 → INSERT INTO leaderboard
排行 → SELECT ... FROM leaderboard JOIN users ORDER BY score/combo DESC
```