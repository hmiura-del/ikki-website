(function () {
    var TINA_APP_URL = "https://ikki-tina-agent.netlify.app";

    var BRAND_GRADIENT = "linear-gradient(135deg, #1A2A45 0%, #1158A6 100%)";
    var CARD_WIDTH = 320;
    var CARD_HEIGHT = 460;

    var isMinimized = false;

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

    var minimizedButton = document.createElement("button");
    minimizedButton.setAttribute("aria-label", "AI秘書ティナと会話する");
    minimizedButton.style.cssText = [
        "position:fixed",
        "bottom:20px",
        "right:20px",
        "z-index:2000",
        "height:52px",
        "padding:0 22px",
        "border-radius:26px",
        "border:none",
        "cursor:pointer",
        "box-shadow:0 6px 20px rgba(0,0,0,0.3)",
        "background:" + BRAND_GRADIENT,
        "color:#fff",
        "font-size:14px",
        "font-weight:bold",
        "white-space:nowrap",
        "display:none",
        "align-items:center",
        "justify-content:center",
        "gap:8px",
        "transition:transform 0.15s ease",
    ].join(";");
    minimizedButton.innerHTML = '<span style="font-size:16px;">\uD83D\uDCAC</span><span>AI秘書ティナと会話する</span>';
    minimizedButton.addEventListener("mouseenter", function () {
        minimizedButton.style.transform = "scale(1.06)";
    });
    minimizedButton.addEventListener("mouseleave", function () {
        minimizedButton.style.transform = "scale(1)";
    });

    var collapseBtn = document.createElement("button");
    collapseBtn.setAttribute("aria-label", "たたむ");
    collapseBtn.textContent = "\u2013";
    collapseBtn.style.cssText = [
        "position:fixed",
        "bottom:" + (20 + CARD_HEIGHT - 44) + "px",
        "right:28px",
        "z-index:2100",
        "width:34px",
        "height:34px",
        "pointer-events:auto",
        "touch-action:manipulation",
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

    var cardWrapper = document.createElement("div");
    cardWrapper.style.cssText = "position:relative;width:100%;height:100%;";
    cardWrapper.appendChild(iframe);
    card.appendChild(cardWrapper);

    document.body.appendChild(card);
    document.body.appendChild(collapseBtn);
    document.body.appendChild(minimizedButton);

    function setMinimized(min) {
        isMinimized = min;
        card.style.setProperty("display", min ? "none" : "block", "important");
        collapseBtn.style.setProperty("display", min ? "none" : "flex", "important");
        minimizedButton.style.setProperty("display", min ? "flex" : "none", "important");
        minimizedButton.style.setProperty("visibility", min ? "visible" : "hidden", "important");
        minimizedButton.style.setProperty("pointer-events", min ? "auto" : "none", "important");
    }

    // 訪問直後は小さいボタンだけ表示し、少し経ってからポップアップで開く
    setMinimized(true);
    var autoOpenTimer = window.setTimeout(function () {
        card.style.transition = "opacity .45s ease, transform .45s ease";
        card.style.opacity = "0";
        card.style.transform = "translateY(16px)";
        setMinimized(false);
        window.requestAnimationFrame(function () {
            card.style.opacity = "1";
            card.style.transform = "translateY(0)";
        });
    }, 6000);
    // ユーザーが自分で開いた場合は自動ポップアップを中止
    function cancelAutoOpen() {
        if (autoOpenTimer) { window.clearTimeout(autoOpenTimer); autoOpenTimer = null; }
    }

    // pointerdown を使うことで、iframe にフォーカスが移っている状態でも 1 クリックで反応する
    collapseBtn.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        e.stopPropagation();
        cancelAutoOpen();
        setMinimized(true);
    });
    minimizedButton.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        e.stopPropagation();
        cancelAutoOpen();
        setMinimized(false);
    });

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

    window.addEventListener("message", function (event) {
        var data = event.data;
        if (!data || data.source !== "tina-widget") return;

        if (data.type === "minimize" || data.type === "collapse" || data.type === "close") {
            setMinimized(true);
            return;
        }

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
