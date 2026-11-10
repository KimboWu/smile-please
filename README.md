# 拍好沒？ v1.02（鬼臉彩蛋整合版）

手機優先的 2D 網頁小遊戲。直接用瀏覽器開啟 `index.html` 即可試玩；若要發布，必須完整保留 `css/`、`js/` 與 `assets/` 資料夾。

## 本版更新

- 首頁：保留主標「拍好沒？」並以 `SMILE, PLEASE!` 做簡潔英文輔標；去除最底下的「手機與電腦都能玩」。
- 固定 30 秒挑戰節奏、4 秒鎖定、六種表情皆可鎖定，無難度／主題選項。
- 一般拍照：全半閉眼標題改為「眼睛是怎麼了？」；全哈欠標題改為「沒睡飽是不是？」；C 區眼神亂飄台詞改為「偷看帥哥喔？」。
- **沒按快門而倒數歸零**：A「快門都不會按嗎？」、B「0/1 位攝影師成功拍照」、C「恭喜發現彩蛋」。此時顯示三位角色的專屬扮鬼臉合照，仍不顯示星等；正常遊玩不會出現鬼臉。
- 所有角色圖片都從使用者最新提供的 `characters.zip` 複製，完全未重新繪製。

## 遊戲素材

`assets/characters/character01/`、`character02/`、`character03/` 每組各七張 PNG（六種一般表情 + 一張超時彩蛋）：
`smile.png`、`half_closed.png`、`angry.png`、`looking_around.png`、`yawn.png`、`blank.png`、`funny_face.png`（彩蛋專用）。

## 專案架構

- `index.html`：三個頁面與文字結構
- `css/styles.css`：字級、配色、版面與動畫
- `js/game.js`：表情切換、鎖定、快門與結果評語
- `assets/characters/`：人物 PNG 素材
