# 炒股助手 - iOS TestFlight 部署指南

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
   - 名称：炒股助手
   - Bundle ID：com.mayuntian.stockhelper
   - SKU：stock-helper

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
