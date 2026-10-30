# 小白炒股决策工具 - iOS TestFlight 部署指南

## 项目说明

这是一个 React Native + Expo 开发的 iOS 原生 App，包含 8 个炒股决策板块：
- 大盘环境
- 选股
- 买点
- 仓位
- 做T
- 卖点
- 持股心态
- 每日复盘

## 推送到 GitHub

1. 在 GitHub 创建新仓库（例如 `stock-helper-app`）
2. 在本项目目录执行：

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/stock-helper-app.git
git push -u origin main
```

## 配置 GitHub Secrets

在仓库 Settings -> Secrets and variables -> Actions 中添加以下 Secrets：

| Secret | 说明 | 获取方式 |
|---|---|---|
| `APPLE_API_KEY_ID` | App Store Connect API 密钥 ID | App Store Connect -> 用户和访问 -> 密钥 |
| `APPLE_API_ISSUER_ID` | App Store Connect API Issuer ID | 同上 |
| `APPLE_API_PRIVATE_KEY` | `.p8` 私钥文件完整内容 | 同上，下载的 `.p8` 文件 |
| `APPLE_TEAM_ID` | Apple Team ID | Apple Developer 后台 |
| `BUILD_CERTIFICATE_BASE64` | 发布证书 `.p12` 的 base64 编码 | `base64 -i distribution.p12` |
| `P12_PASSWORD` | `.p12` 证书密码 | 导出证书时设置 |
| `BUILD_PROVISION_PROFILE_BASE64` | 描述文件 `.mobileprovision` 的 base64 编码 | `base64 -i StockHelper.mobileprovision` |
| `KEYCHAIN_PASSWORD` | 临时钥匙串密码 | 任意设置，如随机字符串 |

## 准备 Apple 证书和描述文件

1. 在 Apple Developer 后台创建 App ID：`com.mayuntian.stockhelper`
2. 创建 Distribution 证书并导出为 `.p12`
3. 创建 App Store Distribution 描述文件，绑定上面的 App ID 和证书
4. 在 App Store Connect 创建新 App：
   - 名称：小白炒股决策工具
   - Bundle ID：com.mayuntian.stockhelper
   - SKU：stock-helper

## 收费：7 天试用 + ¥12 终身会员（内购）

App 内的收费逻辑已经做好，代码位置：

- `src/lib/entitlement.js`：试用期计算（首次启动写入 `trialStart`，7 天内可用）
- `src/lib/iap.native.js` / `iap.web.js`：内购（原生用 react-native-iap，网页用空实现）
- `src/components/Paywall.js`：付费弹层（买断、恢复购买、条款链接）
- `src/config.js`：隐私政策 / 用户协议链接（已上线，见下节）

### 隐私政策 / 用户协议（已上线）

两个页面托管在独立仓库 `mayuntian0-prog/stock-helper-legal` 的 GitHub Pages：

- `https://mayuntian0-prog.github.io/stock-helper-legal/privacy.html`
- `https://mayuntian0-prog.github.io/stock-helper-legal/terms.html`
- `https://mayuntian0-prog.github.io/stock-helper-legal/`（可作 App 支持网址）

页面源码在本机项目外层的 `legal/` 目录。修改后需要把文件重新传到那个仓库（网页上传即可）。
内容变化时记得同步更新页面里的「生效日期」。

### 在 App Store Connect 创建内购商品

1. 打开 App Store Connect -> 你的 App -> 「App 内购买项目」-> 新建
2. 类型选 **非消耗型项目（Non-Consumable）**
3. 产品 ID 必须一字不差：`com.mayuntian.stockhelper.lifetime`
4. 价格选 ¥12（中国区价格档位）
5. 显示名称：`终身会员`；描述：`一次性买断，永久使用全部 8 个板块`
6. 上传审核截图（随便截一张 App 首页即可）
7. 状态改为「准备提交」，**首次提交 App 版本时要一起勾选这个内购项目**，否则审核不通过

### 其他必填项

- 「协议、税务和银行业务」-> 填写付费 App 协议（银行账户 + 税务信息），不填内购无法生效
- App 信息 -> 隐私政策网址：填 `src/config.js` 里 `PRIVACY_URL` 对应的网页
- App 审核备注里写明：`本 App 提供 7 天免费试用，试用结束后可通过内购一次性买断（非消耗型），支持恢复购买。`

### 测试试用到期

把 `src/lib/entitlement.js` 里的 `TRIAL_DAYS` 临时改成 `0` 打包一个测试版即可看到锁定状态和付费弹层；正式版必须是 `7`。

## 触发构建

推送代码到 main 分支后，GitHub Actions 会自动：
1. 安装依赖
2. 安装 CocoaPods
3. 使用你的证书签名
4. 打包成 IPA
5. 上传到 App Store Connect

上传成功后，大约 10-30 分钟，构建会出现在 TestFlight 中。

## 更新版本

每次重新上传时，需要修改 `app.json` 中的：
- `version`（例如 1.0.1）
- `ios.buildNumber`（必须递增，例如 2）

然后提交并推送。

## 本地开发

```bash
npm install
npx expo start
```

在 iPhone 上安装 Expo Go App，扫描终端显示的二维码即可预览。
