/**
 * ティナ ウィジェット 埋め込みスクリプト(静的HTMLサイト向け)
 * 右下固定の小さなカード型(Salesforce Piperのようなスタイル)
 *
 * 使い方: 各ページの </body> 直前に以下を追加するだけ
 *   <script src="./tina-widget-embed.js"></script>
 */
(function () {
    var TINA_APP_URL = "https://ikki-tina-agent.netlify.app";

    var BRAND_GRADIENT = "linear-gradient(135deg, #1A2A45 0%, #1158A6 100%)";
    var CARD_WIDTH = 320; // px
    var CARD_HEIGHT = 460; // px(顔+ボタン+入力欄+注意書きがすべて収まる高さ)

    var isMinimized = false;

    // ---- カード本体(常時、顔が見えている状態) ----
    var card = document.createElement("div");
    card.style.cssText = [
        "position:fixed",
        "bottom:20px",
        "right:20px",
        "z-index:2000",
        "width:" + CARD_WIDTH + "px",
        "height:" + CARD_HEIGHT + "px",
        "max-width:calc(100vw - 24px)",
        "border-radius:16px",
        "overflow:hidden",
        "box-shadow:0 8px 28px rgba(0,0,0,0.28)",
        "background:#0d1526",
        "transition:transform 0.25s ease, opacity 0.25s ease",
        "transform-origin:bottom right",
    ].join(";");

    var iframe = document.createElement("iframe");
    iframe.src = TINA_APP_URL;
    iframe.setAttribute("allow", "microphone; autoplay");
    iframe.style.cssText = "width:100%;height:100%;border:none;";
    card.appendChild(iframe);

    // ---- 折りたたみ用の小さいボタン(最小化時に表示) ----
    var minimizedButton = document.createElement("button");
    minimizedButton.setAttribute("aria-label", "AI秘書ティナを開く");
    minimizedButton.style.cssText = [
        "position:fixed",
        "bottom:20px",
        "right:20px",
        "z-index:2000",
        "width:64px",
        "height:64px",
        "border-radius:50%",
        "border:none",
        "cursor:pointer",
        "box-shadow:0 6px 20px rgba(0,0,0,0.3)",
        "background:" + BRAND_GRADIENT,
        "color:#fff",
        "font-size:11px",
        "font-weight:bold",
        "display:none",
        "align-items:center",
        "justify-content:center",
        "text-align:center",
        "line-height:1.3",
        "transition:transform 0.15s ease",
    ].join(";");
    minimizedButton.textContent = "ティナ";
    minimizedButton.addEventListener("mouseenter", function () {
        minimizedButton.style.transform = "scale(1.06)";
    });
    minimizedButton.addEventListener("mouseleave", function () {
        minimizedButton.style.transform = "scale(1)";
    });

    // ---- カード右上の折りたたみボタン ----
    var collapseBtn = document.createElement("button");
    collapseBtn.setAttribute("aria-label", "たたむ");
    collapseBtn.textContent = "\u2013"; // minus sign
    collapseBtn.style.cssText = [
        "position:absolute",
        "top:8px",
        "right:8px",
        "z-index:2001",
        "width:26px",
        "height:26px",
        "border-radius:50%",
        "border:none",
        "cursor:pointer",
        "background:rgba(0,0,0,0.35)",
        "color:#fff",
        "font-size:16px",
        "line-height:1",
        "display:flex",
        "align-items:center",
        "justify-content:center",
    ].join(";");
    card.style.position = "fixed"; // ensure relative positioning context works with absolute child
    var cardWrapper = document.createElement("div");
    cardWrapper.style.cssText = "position:relative;width:100%;height:100%;";
    cardWrapper.appendChild(iframe);
    cardWrapper.appendChild(collapseBtn);
    card.innerHTML = "";
    card.appendChild(cardWrapper);

    document.body.appendChild(card);
    document.body.appendChild(minimizedButton);

    function setMinimized(min) {
        isMinimized = min;
        card.style.display = min ? "none" : "block";
        minimizedButton.style.display = min ? "flex" : "none";
    }

    collapseBtn.addEventListener("click", function () {
        setMinimized(true);
    });
    minimizedButton.addEventListener("click", function () {
        setMinimized(false);
    });

    // ---- 訪問者ID(第一者Cookie/localStorage、複数回の訪問をまたいで同一人物として扱う) ----
    function getOrCreateVisitorId() {
        var STORAGE_KEY = "tina_visitor_id";
        try {
            var existing = window.localStorage.getItem(STORAGE_KEY);
            if (existing) return existing;
            var fresh =
                (window.crypto && window.crypto.randomUUID
                    ? window.crypto.randomUUID()
                    : "v-" + Date.now() + "-" + Math.random().toString(36).slice(2));
            window.localStorage.setItem(STORAGE_KEY, fresh);
            return fresh;
        } catch (e) {
            return "v-" + Date.now() + "-" + Math.random().toString(36).slice(2);
        }
    }
    var visitorId = getOrCreateVisitorId();

    // ---- iframe(ティナ)とのメッセージ連携 ----
    window.addEventListener("message", function (event) {
        var data = event.data;
        if (!data || data.source !== "tina-widget") return;

        if (data.type === "requestPageInfo") {
            iframe.contentWindow.postMessage(
                {
                    source: "tina-widget-host",
                    type: "pageInfo",
                    title: document.title,
                    url: window.location.href,
                    visitorId: visitorId,
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
                    window.location.hash = target.hash;
                } else {
                    window.open(data.url, "_blank", "noopener,noreferrer");
                }
            } catch (e) {
                // 不正なURLは無視
            }
        }
    });
})();
