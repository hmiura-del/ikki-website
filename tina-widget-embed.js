/**
 * ティナ ウィジェット 埋め込みスクリプト(静的HTMLサイト向け)
 *
 * 使い方: 各ページの </body> 直前に以下を追加するだけ
 *   <script src="./tina-widget-embed.js"></script>
 *
 * 中身は iframe で、別途デプロイした会話AIアプリ(Next.js/create-simli-app-elevenlabs)
 * を読み込んでいます。ページ側のコードはこのファイル1つだけで完結します。
 */
(function () {
    var TINA_APP_URL = "https://ikki-tina-agent.netlify.app";

    var BRAND_GRADIENT = "linear-gradient(135deg, #1A2A45 0%, #1158A6 100%)";
    var PANEL_WIDTH = 380; // px

    var isOpen = false;

    // ---- 常時表示のタブ ----
    var tab = document.createElement("button");
    tab.setAttribute("aria-label", "AI秘書ティナと話す");
    tab.style.cssText = [
        "position:fixed",
        "top:50%",
        "transform:translateY(-50%)",
        "right:0",
        "z-index:2147483000",
        "display:flex",
        "flex-direction:column",
        "align-items:center",
        "gap:8px",
        "padding:16px 8px",
        "border:none",
        "border-radius:12px 0 0 12px",
        "box-shadow:0 4px 16px rgba(0,0,0,0.25)",
        "color:#fff",
        "cursor:pointer",
        "transition:right 0.3s ease",
        "background:" + BRAND_GRADIENT,
    ].join(";");
    tab.innerHTML =
        '<span style="writing-mode:vertical-rl;font-size:12px;font-weight:bold;">AI秘書 ティナ</span>' +
        '<span id="tina-tab-arrow" style="font-size:18px;line-height:1;">‹</span>';

    // ---- スライドパネル(iframeを内包) ----
    var panel = document.createElement("div");
    panel.style.cssText = [
        "position:fixed",
        "top:0",
        "right:0",
        "height:100%",
        "width:" + PANEL_WIDTH + "px",
        "max-width:calc(100vw - 40px)",
        "z-index:2147482999",
        "box-shadow:-4px 0 24px rgba(0,0,0,0.3)",
        "transform:translateX(100%)",
        "transition:transform 0.3s ease",
        "background:#0d1526",
    ].join(";");

    var panelHeader = document.createElement("div");
    panelHeader.style.cssText = [
        "display:flex",
        "align-items:center",
        "justify-content:space-between",
        "padding:12px 16px",
        "background:" + BRAND_GRADIENT,
    ].join(";");
    panelHeader.innerHTML =
        '<span style="color:#fff;font-weight:bold;font-size:14px;">AI秘書 ティナ</span>';

    var closeBtn = document.createElement("button");
    closeBtn.setAttribute("aria-label", "閉じる");
    closeBtn.textContent = "×";
    closeBtn.style.cssText =
        "background:none;border:none;color:rgba(255,255,255,0.8);font-size:20px;line-height:1;cursor:pointer;";
    panelHeader.appendChild(closeBtn);

    var iframe = document.createElement("iframe");
    iframe.src = TINA_APP_URL;
    iframe.setAttribute("allow", "microphone; autoplay");
    iframe.style.cssText = "width:100%;height:calc(100% - 48px);border:none;";

    panel.appendChild(panelHeader);
    panel.appendChild(iframe);

    document.body.appendChild(tab);
    document.body.appendChild(panel);

    function setOpen(open) {
        isOpen = open;
        panel.style.transform = open ? "translateX(0)" : "translateX(100%)";
        tab.style.right = open ? PANEL_WIDTH + "px" : "0";
        document.getElementById("tina-tab-arrow").textContent = open ? "›" : "‹";
    }

    tab.addEventListener("click", function () {
        setOpen(!isOpen);
    });
    closeBtn.addEventListener("click", function () {
        setOpen(false);
    });

    // ---- iframe(ティナ)とのメッセージ連携 ----
    window.addEventListener("message", function (event) {
        var data = event.data;
        if (!data || data.source !== "tina-widget") return;

        if (data.type === "requestPageInfo") {
            // 今、訪問者が実際に見ているページの情報を返す
            iframe.contentWindow.postMessage(
                {
                    source: "tina-widget-host",
                    type: "pageInfo",
                    title: document.title,
                    url: window.location.href,
                },
                "*"
            );
        }

        if (data.type === "navigate" && data.url) {
            try {
                var target = new URL(data.url);
                var current = new URL(window.location.href);
                var isSamePageAnchor =
                    target.origin === current.origin &&
                    target.pathname === current.pathname &&
                    target.hash.length > 0;

                if (isSamePageAnchor) {
                    // 同じページ内のアンカー: そのまま移動(このページ自体は再読み込みされない)
                    window.location.hash = target.hash;
                } else {
                    // 別ページ: 新しいタブで開く(会話中のこのページはそのまま)
                    window.open(data.url, "_blank", "noopener,noreferrer");
                }
            } catch (e) {
                // 不正なURLは無視
            }
        }
    });
})();
