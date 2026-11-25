<!-- Modified on 2026-11-25 for edgetunnel-plus. -->
# edgetunnel-plus

[![GPLv2](https://img.shields.io/badge/License-GPLv2-2457c5)](LICENSE)

edgetunnel-plus 是 [cmliu/edgetunnel](https://github.com/cmliu/edgetunnel) 的多用户衍生项目，可部署在 Cloudflare Workers 或 Pages。它为每位用户生成独立的订阅链接和节点凭据，并提供有效期管理及统一的中文后台。

## 功能

| 功能 | 说明 |
| --- | --- |
| 多用户管理 | 手动创建用户、设置到期时间、续期、停用、恢复和删除 |
| 独立订阅 | 每个用户有独立链接与节点凭据，共用管理员配置的节点参数 |
| 中文管理后台 | 登录、总览、用户管理、连接设置、订阅设置、服务集成和运行日志 |
| 自适应界面 | 桌面侧栏、移动端用户卡片、系统浅色与深色模式、键盘焦点和减少动态效果 |
| 协议与订阅格式 | 沿用上游的 VLESS、Trojan、Shadowsocks，以及 WebSocket、gRPC、XHTTP 等受支持的传输组合。可按配置转换为 Clash、sing-box、Surge 等格式 |
| 现有部署兼容 | 沿用原有 `/sub` 主订阅、`KV` 配置和管理员凭据。测速与优选工具可从总览的「更多工具」进入 |

## 快速部署

### Cloudflare Workers 控制台

1. 在 Cloudflare 创建一个 Worker。
2. 创建一个 Workers KV 命名空间。在 Worker 的绑定设置中将它绑定为 `KV`。
3. 创建一个 D1 数据库，在数据库控制台执行 [建表 SQL](migrations/0001_subscription_users.sql)，然后在 Worker 中将数据库绑定为 `USERS_DB`。
4. 在 Worker 的变量和机密设置中添加密钥 `ADMIN`，值为你的后台密码。该密码独立于节点 UUID。
5. 将本仓库的 [`_worker.js`](_worker.js) 放入 Worker 的模块入口并部署。使用 Worker 的 HTTPS 域名访问 `/admin`，登录后进入「用户管理」。

已有部署可以继续使用原来的 `KV` 和环境变量。先创建 D1、执行建表 SQL 并添加绑定，再替换 Worker 源码。

### Wrangler 部署

使用 Node.js 和 Wrangler，从项目目录执行以下命令。

```bash
git clone https://github.com/Linyueying/edgetunnel-plus.git
cd edgetunnel-plus

npx wrangler login
npx wrangler kv namespace create edgetunnel-plus-config
npx wrangler d1 create edgetunnel-plus-users
```

打开 [`wrangler.toml`](wrangler.toml)，取消 KV 和 D1 绑定示例的注释，分别填入上一步返回的 KV 命名空间 ID 和 D1 数据库 ID。绑定名称保持为 `KV` 和 `USERS_DB`。如果要更新现有 Worker，将 `name` 改为现有 Worker 名称。

```bash
npx wrangler d1 migrations apply USERS_DB --remote
npx wrangler secret put ADMIN
npx wrangler deploy
```

`secret put` 会提示输入管理员密码。部署后，打开命令输出中的 HTTPS 地址并访问 `/admin`。

### Cloudflare Pages

1. 在 Pages 新建 Git 项目，选择本仓库与 `main` 分支。框架预设选无，构建命令填写 `mkdir -p dist && cp _worker.js dist/`，输出目录填写 `dist`。
2. 创建 KV 命名空间和 D1 数据库。在 D1 控制台执行 [建表 SQL](migrations/0001_subscription_users.sql)。
3. 在 Pages 项目设置中为生产环境添加 `KV`、`USERS_DB` 两个绑定，以及 `ADMIN` 密钥。使用预览环境时，为该环境单独配置对应资源。
4. 重新部署，在 Pages 的 HTTPS 域名上打开 `/admin`。

也可以用 Pages Direct Upload 项目配合 Wrangler 上传同一份构建产物。绑定与密钥仍在 Pages 项目设置中配置。

```bash
mkdir -p dist
cp _worker.js dist/
npx wrangler pages deploy dist --project-name edgetunnel-plus
```

参考 [Cloudflare Workers KV 绑定](https://developers.cloudflare.com/kv/concepts/kv-namespaces/)、[D1 迁移](https://developers.cloudflare.com/d1/reference/migrations/) 和 [Pages 高级模式](https://developers.cloudflare.com/pages/functions/advanced-mode/)。

## 开户、续期和停用

1. 登录 `/admin` 后打开「用户管理」。也可直接访问 `/admin/users`。
2. 点击「新增用户」，填写名称和到期时间。后台按管理员设备的本地时区显示和填写时间。
3. 保存后复制该用户的订阅链接，将链接单独发给对方导入客户端。
4. 续期时编辑到期时间。需要暂停账户时，取消「允许使用」；再次开启即可恢复。续期和恢复均可继续使用原订阅链接。
5. 删除用户会使原订阅和节点凭据失效。到期、停用或删除后，服务拒绝刷新订阅与建立新连接，已建立的连接会自然结束。

「管理总览」中的主订阅使用原有管理员节点凭据。向其他用户发放访问权限时，请使用「用户管理」生成的专属订阅。托管用户订阅包含本项目生成的节点。当前版本提供手动发放与续期。

## 配置项

| 名称 | 类型 | 用途 |
| --- | --- | --- |
| `ADMIN` | 密钥 | 管理后台密码。多用户管理要求显式设置 |
| `KV` | KV 绑定 | 存储原有节点配置、优选地址、集成设置及日志 |
| `USERS_DB` | D1 绑定 | 存储用户、有效期和独立订阅凭据 |
| `UUID` | 可选变量 | 固定原有主节点的 UUID，须采用 UUIDv4 |
| `KEY` | 可选密钥 | 沿用上游的快速订阅路径与派生设置。已有部署升级时可保持原值 |
| `HOST` / `PATH` | 可选变量 | 指定节点域名和路径，优先于后台对应配置 |
| `PROXYIP` / `GO2SOCKS5` | 可选变量 | 设置反代地址和 SOCKS5 规则 |
| `URL` | 可选变量 | 控制未匹配路径的默认响应 |
| `DEBUG` / `OFF_LOG` | 可选变量 | 分别启用调试输出或停用 KV 日志，值为 `1` 或 `true` 时生效 |
| `BEST_SUB` | 可选变量 | 启用上游优选订阅生成器 |
| `PRELOAD_RACE_DIAL` / `TCP_CONCURRENT_DIAL` / `PROXY_CONCURRENT_DIAL` | 可选变量 | 调整连接竞速和拨号并行度 |

Cloudflare 用量和 Telegram 凭据可在「服务集成」中配置。请通过 Cloudflare 的密钥设置保管部署凭据，并通过私下的渠道分发订阅链接。

## 常见问题

| 现象 | 检查方法 |
| --- | --- |
| 后台提示缺少配置或绑定 | 检查部署环境是否设置 `ADMIN` 和 `KV`，并确认访问的是更新后的部署 |
| 用户列表报数据库不可用 | 检查 D1 绑定名是否为 `USERS_DB`，确认该数据库中存在 `subscription_users` 表 |
| 独立订阅返回 404 | 检查用户是否到期、停用或已删除，以及链接中的用户 ID 和 token 是否配套 |
| 续期后客户端仍显示旧状态 | 确认后台已保存，再手动更新客户端订阅 |
| Clash 或 sing-box 转换异常 | 先确认通用订阅可获取节点，再检查「订阅设置」中的转换服务和规则配置 |
| Pages 返回 404 | 检查构建输出目录下是否直接包含 `_worker.js`，绑定后是否重新部署 |
| Worker 返回 1101 | 在项目的实时日志或 `wrangler tail` 中检查异常，核对入口和资源绑定 |

## 本地开发

- [`_worker.js`](_worker.js) 包含 Worker 路由、订阅、传输处理和后台前端，无需单独构建前端。
- [`migrations/`](migrations/) 包含 D1 数据库迁移。
- [`wrangler.toml`](wrangler.toml) 提供部署配置模板。
- [`CHANGELOG`](CHANGELOG) 保留上游变更记录。

配置 Wrangler 的绑定后，使用本地迁移和 Worker 开发环境进行测试。将本地管理员密码填入 `.dev.vars`，格式为 `ADMIN=你的本地密码`。本地变量文件已加入 Git 忽略规则。

```bash
node --check _worker.js
npx wrangler d1 migrations apply USERS_DB --local
npx wrangler dev
```

提交问题时，请附上部署方式、复现步骤、预期结果及脱敏日志。

## 许可证与致谢

本仓库以 [GNU General Public License v2.0](LICENSE) 发布，保留上游许可证原文及原作者归属。源码基于 [cmliu/edgetunnel](https://github.com/cmliu/edgetunnel)，起始快照为 [`5b2aaf0`](https://github.com/cmliu/edgetunnel/commit/5b2aaf0)。edgetunnel-plus 于 2026 年 11 月 25 日加入多用户鉴权、有效期管理与重构后的管理界面。GNU GPLv2 的担保免责条款见 [LICENSE](LICENSE)。

以下为上游注明的开源代码与资料来源。

- [zizifn/edgetunnel](https://github.com/zizifn/edgetunnel)
- [3Kmfi6HP/EDtunnel](https://github.com/6Kmfi6HP/EDtunnel)
- [SHIJS1999/cloudflare-worker-vless-ip](https://github.com/SHIJS1999/cloudflare-worker-vless-ip)
- [Stanley-baby](https://github.com/Stanley-baby)
- [ACL4SSR](https://github.com/ACL4SSR/ACL4SSR/tree/master/Clash/config)
- [股神](https://t.me/CF_NAT/38889)
- [Workers/Pages Metrics](https://t.me/zhetengsha/3382)
- [白嫖哥](https://t.me/bestcfipas)
- [Mingyu](https://github.com/ymyuuu/workers-vless)
- [ToiCF/CF-Workers-HTTPS](https://github.com/ToiCF/CF-Workers-HTTPS)
- [ToiCF/CF-Workers-TURN](https://github.com/ToiCF/CF-Workers-TURN)
- [ToiCF/CF-Workers-SoftEther](https://github.com/ToiCF/CF-Workers-SoftEther)
- [eooce](https://github.com/eooce/Cloudflare-proxy)
- [Sukka](https://ip.skk.moe/)
- [zhangtaile](https://github.com/cmliu/edgetunnel/pull/999)
- [1345695](https://github.com/1345695/edcloudwasm)
- [ToiCF/GrainTCP](https://github.com/ToiCF/GrainTCP)
- [xream](https://github.com/cmliu/edgetunnel/pull/1359)
