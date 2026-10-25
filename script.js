/* ══════════════════════════════════════════════════════════════
   DOĞUM GÜNÜ DENEYİMİ
   ══════════════════════════════════════════════════════════════ */
(() => {
    'use strict';

    /* ⚙️ AYAR: tanıştığınız tarih (YYYY-AA-GG). Boş bırakırsan sayaç görünmez. */
    const MEET_DATE = ''; // örnek: '2023-09-14'

    const $  = (s) => document.querySelector(s);
    const $$ = (s) => document.querySelectorAll(s);

    // Konfeti kütüphanesi yüklenmezse site yine de çalışsın
    const fire = (o) => { try { if (window.confetti) window.confetti(o); } catch (e) { /* sessiz */ } };

    const toast = (text, ms = 2300) => {
        const t = document.createElement('div');
        t.className = 'wish-toast';
        t.textContent = text;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), ms);
    };

    /* ═══ ELEMENTLER ═══ */
    const scenes = {};
    for (let i = 1; i <= 6; i++) scenes[i] = $('#scene0' + i);

    const TOTAL_SCENES     = 6;
    const TOTAL_CANDLES    = 3;
    const progressFill     = $('#progressFill');
    const progressLabel    = $('#progressLabel');
    const audio            = $('#bgMusic');
    const audioBtn         = $('#musicToggle');
    const giftBtn          = $('#giftBtn');
    const wishInput        = $('#wishInput');
    const wishList         = $('#wishList');
    const wishCount        = $('#wishCount');
    const candlesLayer     = $('#candlesLayer');
    const candlesRemaining = $('#candlesRemaining');
    const candleCounter    = $('#candleCounter');
    const form             = $('#responseForm');
    const formSuccess      = $('#formSuccess');
    const celebrateBtn     = $('#celebrateBtn');

    let currentScene = '1';
    let isBusy = false;
    let musicOn = false;
    let wishCounter = 0;
    let cakeBlown = false;
    let candlesBlown = 0;
    let skipLetter = null;

    const palettes = [
        { color: '#ff8fb0', light: '#ffd0dc', dark: '#b83d5f' },
        { color: '#ffd98a', light: '#fff0c8', dark: '#b8862f' },
        { color: '#c8b0ff', light: '#e8ddff', dark: '#6d4eb8' },
    ];

    /* ═══ 📳 TİTREŞİM (butonlara dokununca) ═══ */
    function vibrate(ms = 25) {
        // Android / Chrome
        try { if (navigator.vibrate && navigator.vibrate(ms)) return; } catch (e) { /* sessiz */ }
        // iPhone (iOS 17.4+): gizli "switch" kutusuna dokunmak hafif titreşim verir
        try {
            const label = document.createElement('label');
            const input = document.createElement('input');
            label.setAttribute('aria-hidden', 'true');
            label.style.cssText = 'position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;overflow:hidden;';
            input.type = 'checkbox';
            input.setAttribute('switch', '');
            label.appendChild(input);
            document.body.appendChild(label);
            label.click();
            setTimeout(() => label.remove(), 100);
        } catch (e) { /* sessiz */ }
    }
    document.addEventListener('click', (e) => {
        if (e.target.closest('button, .wish')) vibrate(25);
    });

    /* ═══ 👋 URL'DEN İSİM (index.html?isim=Ayşe) ═══ */
    (function greet() {
        const raw = new URLSearchParams(location.search).get('isim');
        if (!raw) return;
        const name = raw.replace(/[<>&"'`]/g, '').trim().slice(0, 24);
        const el = $('#heroGreeting');
        if (name && el) el.textContent = `Merhaba ${name}! 👋`;
    })();

    /* ═══ SAHNE YÖNETİCİSİ ═══ */
    const SceneManager = {
        go(nextNum) {
            nextNum = String(nextNum);
            if (isBusy || nextNum === currentScene) return;
            const from = scenes[currentScene];
            const to = scenes[nextNum];
            if (!to || !from) return;

            isBusy = true;
            progressFill.style.width = (nextNum / TOTAL_SCENES * 100) + '%';
            progressLabel.textContent = nextNum.padStart(2, '0') + ' / ' + String(TOTAL_SCENES).padStart(2, '0');

            from.classList.add('scene-exiting');

            setTimeout(() => {
                from.classList.remove('scene-active', 'scene-exiting');
                to.classList.add('scene-active', 'scene-entering');
                to.scrollTop = 0;

                document.body.setAttribute('data-scroll', to.classList.contains('scene--scroll') ? 'unlocked' : 'locked');
                setTimeout(() => to.classList.remove('scene-entering'), 1200);

                currentScene = nextNum;
                if (nextNum === '4') startTypewriter();
                if (nextNum === '6') startMeetCounter();

                setTimeout(() => { isBusy = false; }, 250);
            }, 650);
        }
    };

    $$('[data-next]').forEach((btn) => btn.addEventListener('click', () => SceneManager.go(btn.dataset.next)));

    /* ═══ YILDIZLI GÖKYÜZÜ ═══ */
    function initStarfield() {
        const canvas = $('#starfield');
        const ctx = canvas.getContext('2d', { alpha: true });
        let stars = [], shooting = [], w = 0, h = 0, last = 0;

        function resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = canvas.width = innerWidth * dpr;
            h = canvas.height = innerHeight * dpr;
            canvas.style.width = innerWidth + 'px';
            canvas.style.height = innerHeight + 'px';
        }
        function createStars() {
            const mobile = innerWidth < 768;
            const count = Math.min(mobile ? 50 : 80, Math.floor((w * h) / (mobile ? 25000 : 16000)));
            stars = Array.from({ length: count }, () => ({
                x: Math.random() * w, y: Math.random() * h,
                r: Math.random() * 1.6 + .3, a: Math.random() * .6 + .2,
                tw: Math.random() * .02 + .005, dir: Math.random() > .5 ? 1 : -1,
            }));
        }
        function draw(ts) {
            requestAnimationFrame(draw);
            if (ts - last < 33) return;
            last = ts;
            ctx.clearRect(0, 0, w, h);

            for (const s of stars) {
                s.a += s.tw * s.dir;
                if (s.a > .9) { s.a = .9; s.dir = -1; }
                if (s.a < .15) { s.a = .15; s.dir = 1; }
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,217,138,${s.a})`;
                ctx.fill();
            }

            if (Math.random() > .992) {
                shooting.push({ x: Math.random() * w, y: Math.random() * h * .5, vx: 6 + Math.random() * 6, vy: 3 + Math.random() * 4, life: 1, len: 80 + Math.random() * 80 });
            }
            shooting = shooting.filter((s) => s.life > 0);
            for (const s of shooting) {
                const g = ctx.createLinearGradient(s.x, s.y, s.x - s.len, s.y - s.len * .5);
                g.addColorStop(0, `rgba(254,249,243,${s.life})`);
                g.addColorStop(1, 'rgba(254,249,243,0)');
                ctx.beginPath();
                ctx.strokeStyle = g;
                ctx.lineWidth = 2;
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(s.x - s.len, s.y - s.len * .5);
                ctx.stroke();
                s.x += s.vx; s.y += s.vy; s.life -= .012;
            }
        }

        resize(); createStars();
        addEventListener('resize', () => { resize(); createStars(); });
        requestAnimationFrame(draw);
    }

    /* ═══ SAHNE 01 · HEDİYE ═══ */
    function openGift() {
        if (giftBtn.classList.contains('exploding')) return;

        audio.play()
            .then(() => { musicOn = true; audioBtn.removeAttribute('data-muted'); })
            .catch(() => audioBtn.setAttribute('data-muted', 'true'));

        giftBtn.classList.add('exploding');
        const colors = ['#ff8fb0', '#ffd98a', '#c8b0ff', '#a5d5ff', '#fef9f3'];
        fire({ particleCount: 200, spread: 110, startVelocity: 60, origin: { y: .55 }, colors, scalar: 1.2 });
        setTimeout(() => {
            fire({ particleCount: 80, angle: 55, spread: 70, origin: { x: 0, y: .65 }, colors });
            fire({ particleCount: 80, angle: 125, spread: 70, origin: { x: 1, y: .65 }, colors });
        }, 200);
        setTimeout(revealGift, 1000);
    }

    function revealGift() {
        $('#scene01').classList.add('is-revealed');
        fire({ particleCount: 70, spread: 90, origin: { y: .35 }, colors: ['#ff8fb0', '#ffd98a', '#c8b0ff'], scalar: .8 });
    }
    giftBtn.addEventListener('click', openGift);

    /* ═══ MÜZİK ═══ */
    audioBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (musicOn) {
            audio.pause();
            musicOn = false;
            audioBtn.setAttribute('data-muted', 'true');
        } else {
            audio.play().then(() => { musicOn = true; audioBtn.removeAttribute('data-muted'); }).catch(() => {});
        }
    });
    // Sekme arka plana geçince müzik dursun, dönünce devam etsin
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) audio.pause();
        else if (musicOn) audio.play().catch(() => {});
    });

    /* ═══ SAHNE 02 · DİLEKLER ═══ */
    function addWish(text) {
        const trimmed = text.trim();
        if (!trimmed) return;

        const chip = document.createElement('span');
        chip.className = 'wish-chip';
        chip.textContent = trimmed;
        wishList.appendChild(chip);

        wishCount.textContent = ++wishCounter;
        wishCount.style.transform = 'scale(1.5)';
        setTimeout(() => { wishCount.style.transform = ''; }, 300);
        wishList.parentElement.scrollTop = wishList.parentElement.scrollHeight;

        const rect = chip.getBoundingClientRect();
        const flyer = document.createElement('span');
        flyer.className = 'wish-flyer';
        flyer.textContent = '✨ ' + trimmed;
        flyer.style.left = (rect.left + rect.width / 2) + 'px';
        flyer.style.top = (rect.top + rect.height / 2) + 'px';
        document.body.appendChild(flyer);
        requestAnimationFrame(() => requestAnimationFrame(() => flyer.classList.add('is-flying')));
        setTimeout(() => flyer.remove(), 2000);

        fire({
            particleCount: 12, spread: 60, scalar: .6, ticks: 100,
            origin: { x: (rect.left + rect.width / 2) / innerWidth, y: (rect.top + rect.height / 2) / innerHeight },
            colors: ['#ffd98a', '#fff0c8', '#ff8fb0'],
        });

        wishInput.value = '';
        wishInput.focus();
    }

    wishInput.setAttribute('enterkeyhint', 'send');
    wishInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); addWish(wishInput.value); }
    });
    wishInput.addEventListener('focus', () => {
        document.body.classList.add('keyboard-open');
        setTimeout(() => wishInput.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    });
    wishInput.addEventListener('blur', () => {
        document.body.classList.remove('keyboard-open');
        document.documentElement.style.removeProperty('--kb-shift');
    });

    if (window.visualViewport) {
        const vv = window.visualViewport;
        vv.addEventListener('resize', () => {
            const kb = innerHeight - vv.height;
            if (kb > 100 && document.activeElement === wishInput) {
                document.documentElement.style.setProperty('--kb-shift', (kb * .35) + 'px');
                document.body.classList.add('keyboard-open');
            } else {
                document.documentElement.style.removeProperty('--kb-shift');
                document.body.classList.remove('keyboard-open');
            }
        });
    }

    const readyWishes = ['Sağlık', 'Mutluluk', 'Huzur', 'Başarı', 'Aşk', 'Kahkaha', 'Seyahat', 'Hayaller'];
    $$('.wish').forEach((w, i) => {
        w.addEventListener('click', () => {
            if (w.dataset.used) return;
            w.dataset.used = '1';
            addWish(readyWishes[i % readyWishes.length]);
        });
    });

    /* ═══ SAHNE 03 · 3 MUM ═══ */
    function createCandles() {
        candlesLayer.innerHTML = '';
        const layout = [{ cx: 33, cy: 73, h: 52 }, { cx: 50, cy: 74, h: 56 }, { cx: 67, cy: 73, h: 52 }];
        const frag = document.createDocumentFragment();

        layout.forEach((pos, i) => {
            const c = document.createElement('button');
            const p = palettes[i % palettes.length];
            c.className = 'candle';
            c.type = 'button';
            c.setAttribute('aria-label', `${i + 1}. mum`);
            c.setAttribute('aria-pressed', 'false');
            c.style.setProperty('--cx', pos.cx + '%');
            c.style.setProperty('--cy', pos.cy + '%');
            c.style.setProperty('--h', pos.h + 'px');
            c.style.setProperty('--z', 16);
            c.style.setProperty('--candle-color', p.color);
            c.style.setProperty('--candle-light', p.light);
            c.style.setProperty('--candle-dark', p.dark);
            c.innerHTML = '<span class="candle__body"></span><span class="candle__wick"></span><span class="candle__flame"></span>';
            frag.appendChild(c);
        });
        candlesLayer.appendChild(frag);
    }

    candlesLayer.addEventListener('click', (e) => {
        const candle = e.target.closest('.candle');
        if (!candle || candle.classList.contains('is-blown')) return;

        candle.classList.add('is-blown');
        candle.setAttribute('aria-pressed', 'true');
        candlesRemaining.textContent = TOTAL_CANDLES - ++candlesBlown;

        if (candlesBlown >= TOTAL_CANDLES && !cakeBlown) {
            cakeBlown = true;
            candleCounter.classList.add('done');
            candleCounter.querySelector('span:last-child').innerHTML = '<strong>Hepsi söndü!</strong> 🎉';

            setTimeout(() => fire({ particleCount: 300, spread: 140, origin: { y: .5 }, colors: ['#ffb347', '#ff6b35', '#ff8fb0', '#ffd98a', '#fef9f3'], scalar: 1.15 }), 250);
            setTimeout(() => SceneManager.go(4), 2300);
        }
    });

    // Gizli sürpriz: "22" yazısına 3 kez dokun
    const ageEl = $('.drop-number');
    if (ageEl) {
        let taps = 0;
        ageEl.style.cursor = 'pointer';
        ageEl.addEventListener('click', () => {
            if (++taps < 3) return;
            taps = 0;
            fire({ particleCount: 140, spread: 120, origin: { y: .35 }, colors: ['#ff8fb0', '#ffd98a', '#c8b0ff'] });
            toast('💖 Gizli sürprizi buldun!');
        });
    }

    /* ═══ FOTOĞRAFLAR (hediyeden çıkanlar) ═══ */
    // Dosya bulunamazsa kırık resim yerine yer tutucu göster
    $$('.gift-photo img').forEach((img) => {
        const fail = () => { img.parentElement.classList.add('is-empty'); img.remove(); };
        if (img.complete && img.naturalWidth === 0) fail();
        else img.addEventListener('error', fail, { once: true });
    });

    // Dokununca büyüsün
    document.addEventListener('click', (e) => {
        const img = e.target.closest('.gift-photo img');
        if (!img) return;
        const box = document.createElement('div');
        const big = document.createElement('img');
        box.className = 'lightbox';
        big.src = img.src;
        big.alt = '';
        box.appendChild(big);
        box.addEventListener('click', () => { box.classList.add('out'); setTimeout(() => box.remove(), 250); });
        document.body.appendChild(box);
    });

    /* ═══ SAHNE 04 · MEKTUP (daktilo) ═══ */
    function startTypewriter() {
        const lines = [...$$('.type-line')];
        const nextBtn = $('#letterNextBtn');
        let li = 0, ci = 0, timer = null, finished = false;

        lines.forEach((l) => { l.textContent = ''; l.classList.remove('is-done', 'is-typing'); });
        if (nextBtn) nextBtn.classList.remove('is-ready');

        function finish() {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            lines.forEach((l) => { l.textContent = l.dataset.text || ''; l.classList.remove('is-typing'); l.classList.add('is-done'); });
            if (nextBtn) nextBtn.classList.add('is-ready');
            fire({ particleCount: 40, spread: 60, origin: { y: .85 }, colors: ['#ff8fb0', '#ffd98a', '#c8b0ff'], scalar: .7, ticks: 80 });
            skipLetter = null;
        }

        function tick() {
            if (finished) return;
            const el = lines[li];
            if (!el) { timer = setTimeout(finish, 500); return; }
            const text = el.dataset.text || '';
            el.classList.add('is-typing');
            if (ci < text.length) {
                el.textContent += text[ci++];
                timer = setTimeout(tick, 22);
            } else {
                el.classList.remove('is-typing');
                el.classList.add('is-done');
                li++; ci = 0;
                timer = setTimeout(tick, 350);
            }
        }

        skipLetter = finish; // mektuba dokununca hızlıca bitir
        tick();
    }
    const letter = $('.letter');
    if (letter) letter.addEventListener('click', () => { if (skipLetter) skipLetter(); });

    /* ═══ SAHNE 05 · FORM ═══ */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        const label = btn.querySelector('.btn__text');
        const original = label.textContent;

        label.textContent = 'Gönderiliyor';
        btn.disabled = true;

        try {
            const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
            if (!res.ok) throw new Error('Network');

            form.style.display = 'none';
            formSuccess.classList.remove('hidden');
            fire({ particleCount: 250, spread: 160, origin: { y: .6 }, colors: ['#ff8fb0', '#ffd98a', '#c8b0ff', '#a5d5ff'] });
        } catch (err) {
            label.textContent = 'Tekrar dene';
            btn.disabled = false;
            setTimeout(() => { label.textContent = original; }, 2200);
        }
    });

    /* ═══ SAHNE 06 · KUTLAMA ═══ */
    // "Tanışalı X gün oldu" sayacı
    let startMeetCounter = () => {};
    const sub7 = $('#scene06 .scene-sub');
    const meetStart = Date.parse(MEET_DATE);
    if (sub7 && !isNaN(meetStart)) {
        const days = Math.max(0, Math.floor((Date.now() - meetStart) / 864e5));
        const p = document.createElement('p');
        p.className = 'scene-sub';
        p.innerHTML = 'Tanışalı <b class="meet-n">0</b> gün oldu.<br>İyi ki o gün tanışmışız.';
        sub7.after(p);
        startMeetCounter = () => {
            const out = p.querySelector('b');
            const t0 = performance.now();
            (function step(t) {
                const k = Math.min(1, (t - t0) / 1600);
                out.textContent = Math.round(days * (1 - Math.pow(1 - k, 3)));
                if (k < 1) requestAnimationFrame(step);
            })(t0);
        };
    }

    function launchBalloons() {
        const cols = ['#ff8fa8', '#ffc59a', '#c3adff', '#8cc7ff', '#ffe6b8'];
        for (let i = 0; i < 16; i++) {
            setTimeout(() => {
                const b = document.createElement('div');
                b.className = 'balloon';
                b.style.left = (4 + Math.random() * 88) + '%';
                b.style.setProperty('--c', cols[i % cols.length]);
                b.style.setProperty('--s', (.8 + Math.random() * .6).toFixed(2));
                b.style.animationDuration = (6 + Math.random() * 4).toFixed(1) + 's';
                document.body.appendChild(b);
                setTimeout(() => b.remove(), 11000);
            }, i * 180);
        }
    }

    celebrateBtn.addEventListener('click', () => {
        const colors = ['#ff8fb0', '#ffd98a', '#c8b0ff', '#a5d5ff', '#fef9f3', '#ff6b35'];
        fire({ particleCount: 300, spread: 160, origin: { y: .5 }, colors, scalar: 1.3 });
        setTimeout(() => {
            fire({ particleCount: 180, angle: 55, spread: 90, origin: { x: 0, y: .6 }, colors, scalar: 1.1 });
            fire({ particleCount: 180, angle: 125, spread: 90, origin: { x: 1, y: .6 }, colors, scalar: 1.1 });
        }, 300);
        setTimeout(() => fire({ particleCount: 150, spread: 180, origin: { y: .7 }, colors, scalar: .9 }), 700);

        launchBalloons();
        celebrateBtn.querySelector('span').textContent = '🎉 Mutlu Yıllar! 🎉';
        celebrateBtn.disabled = true;
        celebrateBtn.style.opacity = '.7';
    });

    /* ═══ ✨ YILDIZ TOZU (parmak / imleç izi) ═══ */
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const sparkColors = ['#ffd28a', '#ff8fa8', '#c3adff'];
        let lastSpark = 0;
        addEventListener('pointermove', (e) => {
            const now = performance.now();
            if (now - lastSpark < 45) return;
            lastSpark = now;
            const s = document.createElement('i');
            s.className = 'spark';
            s.style.left = e.clientX + 'px';
            s.style.top = e.clientY + 'px';
            s.style.setProperty('--dx', (Math.random() * 40 - 20) + 'px');
            s.style.setProperty('--c', sparkColors[(Math.random() * sparkColors.length) | 0]);
            document.body.appendChild(s);
            setTimeout(() => s.remove(), 800);
        }, { passive: true });
    }

    /* ═══ MANYETİK BUTONLAR ═══ */
    $$('[data-magnetic]').forEach((el) => {
        el.addEventListener('mousemove', (e) => {
            const r = el.getBoundingClientRect();
            el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .15}px, ${(e.clientY - r.top - r.height / 2) * .15}px)`;
        });
        el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });

    /* ═══ SAYFA KAYDIRMA KİLİDİ (iOS) ═══ */
    document.addEventListener('touchmove', (e) => {
        if (document.body.getAttribute('data-scroll') === 'unlocked') return;
        if (e.target.closest('textarea, input, .scene')) return;
        e.preventDefault();
    }, { passive: false });

    /* ═══ BAŞLAT ═══ */
    initStarfield();
    createCandles();
    document.body.setAttribute('data-scroll', 'locked');
    progressFill.style.width = (100 / TOTAL_SCENES) + '%';
    progressLabel.textContent = '01 / ' + String(TOTAL_SCENES).padStart(2, '0');
})();