// ================================================================
//  LOADER
// ================================================================
(function () {
    window.addEventListener('load', function () {
        setTimeout(function () {
            var loader = document.getElementById('loader');
            if (loader) loader.classList.add('done');
            initHorizontalScroll();
            initStatCounters();
            initHeroCanvas();
            initTypewriter();
            initMagneticCursor();
            initCardTilt();
            initTextScramble();
            initSpotlight();
            initSoundDesign();
        }, 1800);
    });
})();

// ================================================================
//  INTERACTIVE PARTICLE NEURAL NETWORK — Canvas
// ================================================================
function initHeroCanvas() {
    var canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var mouse = { x: -1000, y: -1000 };
    var particles = [];
    var PARTICLE_COUNT = 90;
    var CONNECTION_DIST = 140;
    var MOUSE_RADIUS = 200;

    function resize() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Track mouse
    canvas.parentElement.addEventListener('mousemove', function (e) {
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    canvas.parentElement.addEventListener('mouseleave', function () {
        mouse.x = -1000; mouse.y = -1000;
    });

    // Create particles
    for (var i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.6,
            vy: (Math.random() - 0.5) * 0.6,
            r: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.2
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update & draw particles
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];

            // Mouse attraction
            var dx = mouse.x - p.x;
            var dy = mouse.y - p.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MOUSE_RADIUS && dist > 0) {
                var force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS * 0.02;
                p.vx += dx / dist * force;
                p.vy += dy / dist * force;
            }

            // Damping
            p.vx *= 0.99;
            p.vy *= 0.99;

            p.x += p.vx;
            p.y += p.vy;

            // Wrap
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            // Draw dot
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(201, 255, 0, ' + p.opacity + ')';
            ctx.fill();
        }

        // Draw connections
        for (var i = 0; i < particles.length; i++) {
            for (var j = i + 1; j < particles.length; j++) {
                var dx = particles[i].x - particles[j].x;
                var dy = particles[i].y - particles[j].y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < CONNECTION_DIST) {
                    var alpha = (1 - dist / CONNECTION_DIST) * 0.15;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = 'rgba(201, 255, 0, ' + alpha + ')';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        // Mouse glow ring
        if (mouse.x > 0 && mouse.y > 0) {
            var g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, MOUSE_RADIUS);
            g.addColorStop(0, 'rgba(201, 255, 0, 0.06)');
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g;
            ctx.fillRect(mouse.x - MOUSE_RADIUS, mouse.y - MOUSE_RADIUS, MOUSE_RADIUS * 2, MOUSE_RADIUS * 2);
        }

        requestAnimationFrame(animate);
    }
    animate();
}

// ================================================================
//  TYPEWRITER EFFECT
// ================================================================
function initTypewriter() {
    var el = document.getElementById('hero-sub');
    if (!el) return;
    var text = '17 benchmarks. 90,000+ questions. No excuses.';
    var i = 0;
    var delay = 2800; // wait for title animations
    setTimeout(function type() {
        if (i <= text.length) {
            el.textContent = text.substring(0, i);
            i++;
            setTimeout(type, 35 + Math.random() * 30);
        }
    }, delay);
}

// ================================================================
//  GSAP HORIZONTAL SCROLL + PARALLAX
// ================================================================
function initHorizontalScroll() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        setTimeout(initHorizontalScroll, 100);
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    var container = document.getElementById('horizontal-container');
    var track = document.getElementById('h-track');
    if (!container || !track) return;

    var scrollDist = track.scrollWidth - window.innerWidth;

    var mainTween = gsap.to(track, {
        x: -scrollDist,
        ease: 'none',
        scrollTrigger: {
            trigger: container,
            start: 'top top',
            end: '+=' + scrollDist,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onUpdate: function (self) {
                var fill = document.getElementById('scroll-progress-fill');
                if (fill) fill.style.width = (self.progress * 100) + '%';
            }
        }
    });

    // ── HEAVY Parallax: Section titles move much faster ──
    document.querySelectorAll('.section-title').forEach(function (el) {
        gsap.to(el, {
            x: -250,
            ease: 'none',
            scrollTrigger: {
                trigger: el,
                containerAnimation: mainTween,
                start: 'left right',
                end: 'right left',
                scrub: true
            }
        });
    });

    // ── Parallax: Section tags ──
    document.querySelectorAll('.section-tag').forEach(function (el) {
        gsap.to(el, {
            x: -150,
            ease: 'none',
            scrollTrigger: {
                trigger: el,
                containerAnimation: mainTween,
                start: 'left right',
                end: 'right left',
                scrub: true
            }
        });
    });

    // ── Parallax: Story photo BIG swoop ──
    var storyPhoto = document.querySelector('.story-photo');
    if (storyPhoto) {
        gsap.to(storyPhoto, {
            x: 60,
            y: -20,
            ease: 'none',
            scrollTrigger: {
                trigger: storyPhoto,
                containerAnimation: mainTween,
                start: 'left right',
                end: 'right left',
                scrub: true
            }
        });
    }

    // ── Parallax: Story text col ──
    var storyText = document.querySelector('.story-text-col');
    if (storyText) {
        gsap.to(storyText, {
            x: -40,
            ease: 'none',
            scrollTrigger: {
                trigger: storyText,
                containerAnimation: mainTween,
                start: 'left right',
                end: 'right left',
                scrub: true
            }
        });
    }

    // ── Parallax: Hero headline dramatic depth ──
    var heroHL = document.querySelector('.hero-headline');
    if (heroHL) {
        gsap.to(heroHL, {
            x: -120,
            ease: 'none',
            scrollTrigger: {
                trigger: heroHL,
                containerAnimation: mainTween,
                start: 'left left',
                end: '+=800',
                scrub: true
            }
        });
    }

    // ── Parallax: Stat orbs drift opposite ──
    var statOrbs = document.querySelector('.hero-stat-orbs');
    if (statOrbs) {
        gsap.to(statOrbs, {
            x: 80,
            ease: 'none',
            scrollTrigger: {
                trigger: statOrbs,
                containerAnimation: mainTween,
                start: 'left left',
                end: '+=800',
                scrub: true
            }
        });
    }

    // ── Parallax: Numbers grid ──
    var numGrid = document.querySelector('.numbers-grid');
    if (numGrid) {
        gsap.to(numGrid, {
            x: -80,
            ease: 'none',
            scrollTrigger: {
                trigger: numGrid,
                containerAnimation: mainTween,
                start: 'left right',
                end: 'right left',
                scrub: true
            }
        });
    }

    // ── FAQ list: subtle slide-in as a group ──
    var faqList = document.querySelector('.faq-list');
    if (faqList) {
        gsap.from(faqList, {
            x: 60,
            opacity: 0.5,
            ease: 'none',
            scrollTrigger: {
                trigger: faqList,
                containerAnimation: mainTween,
                start: 'left 90%',
                end: 'left 50%',
                scrub: true
            }
        });
    }

    // ── Cards: Cotton Fabric Float Effect ──
    // Each card gets a unique, continuous floating animation
    // like a light cotton cloth drifting in gentle breeze
    document.querySelectorAll('.card').forEach(function (card, i) {
        // Entrance: cards rise from below
        gsap.from(card, {
            y: 100 + (i % 4) * 30,
            opacity: 0,
            scale: 0.85,
            rotation: (i % 2 === 0 ? 3 : -3),
            ease: 'power2.out',
            scrollTrigger: {
                trigger: card,
                containerAnimation: mainTween,
                start: 'left 95%',
                end: 'left 55%',
                scrub: true
            }
        });

        // Continuous cotton float: gentle y/rotation oscillation
        var floatY = 8 + (i % 5) * 3;         // 8-20px range
        var floatRot = 0.8 + (i % 4) * 0.4;   // 0.8-2.0deg
        var floatDur = 2.5 + (i % 7) * 0.5;   // 2.5-5.5s
        var floatDelay = (i % 5) * 0.4;        // staggered

        gsap.to(card, {
            y: floatY,
            rotation: floatRot,
            scale: 1.01,
            ease: 'sine.inOut',
            duration: floatDur,
            delay: floatDelay,
            repeat: -1,
            yoyo: true
        });
    });

    var t;
    window.addEventListener('resize', function () {
        clearTimeout(t);
        t = setTimeout(function () { ScrollTrigger.refresh(); }, 250);
    });
}

// ================================================================
//  STAT COUNTERS
// ================================================================
function initStatCounters() {
    document.querySelectorAll('.stat-val, .orb-val').forEach(function (el) {
        var target = parseInt(el.getAttribute('data-target'), 10);
        if (isNaN(target)) return;
        var suffix = target > 1000 ? '+' : '';
        var displayTarget = target > 1000 ? Math.round(target / 10) * 10 : target;
        var dur = 1200, start = Date.now();
        (function tick() {
            var p = Math.min((Date.now() - start) / dur, 1);
            var ease = 1 - Math.pow(1 - p, 3);
            var val = Math.round(ease * displayTarget);
            el.textContent = val.toLocaleString() + suffix;
            if (p < 1) requestAnimationFrame(tick);
        })();
    });
}

// ================================================================
//  MENU TOGGLE
// ================================================================
(function () {
    var btn = document.getElementById('menu-toggle');
    var overlay = document.getElementById('menu-overlay');
    if (!btn || !overlay) return;
    btn.addEventListener('click', function () {
        btn.classList.toggle('open');
        overlay.classList.toggle('open');
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.classList.contains('open')) {
            btn.classList.remove('open');
            overlay.classList.remove('open');
        }
    });
})();

function closeMenu() {
    var btn = document.getElementById('menu-toggle');
    var overlay = document.getElementById('menu-overlay');
    if (btn) btn.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
}

// ================================================================
//  QUIZ ENGINE — uses local data files
// ================================================================
var quizState = {
    benchmark: '', questions: [], current: 0, score: 0, attempted: 0,
    answered: false, total: 50, startTime: 0, totalTime: 0, timerInterval: null
};

// Manifest: number of chunk files per benchmark (loaded from data/manifest.json)
var manifest = null;
// AI model scores (loaded from data/models.json)
var modelScores = null;

var benchmarkNames = {
    mmlu: 'MMLU', hellaswag: 'HellaSwag', arc: 'ARC Challenge', mathqa: 'MathQA',
    truthfulqa: 'TruthfulQA', race: 'RACE', aqua: 'AQUA-RAT', winogrande: 'Winogrande',
    commonsense: 'CommonsenseQA', sciq: 'SciQ', piqa: 'PIQA', openbook: 'OpenBookQA',
    boolq: 'BoolQ', copa: 'COPA', medmcqa: 'MedMCQA', qasc: 'QASC', swag: 'SWAG'
};

function startRandomBenchmark() {
    var keys = Object.keys(benchmarkNames);
    var pick = keys[Math.floor(Math.random() * keys.length)];
    getQuestions(pick);
}

// Load manifest & model scores on startup
(function () {
    fetch('data/manifest.json')
        .then(function (r) { return r.json(); })
        .then(function (d) { manifest = d; })
        .catch(function () { console.warn('Could not load manifest.json'); });

    fetch('data/models.json')
        .then(function (r) { return r.json(); })
        .then(function (d) { modelScores = d; })
        .catch(function () { console.warn('Could not load models.json'); });
})();

function getQuestions(benchmark) {
    quizState.benchmark = benchmark;
    quizState.current = 0;
    quizState.score = 0;
    quizState.attempted = 0;
    quizState.totalTime = 0;
    quizState.answered = false;

    document.getElementById('quiz-modal').classList.remove('hidden');
    document.getElementById('question-text').textContent = 'Loading questions...';
    document.getElementById('options-grid').innerHTML = '';

    if (!manifest) {
        document.getElementById('question-text').textContent = 'Data not loaded yet — please try again.';
        return;
    }

    var totalChunks = manifest[benchmark];
    if (!totalChunks) {
        document.getElementById('question-text').textContent = 'No data available for this benchmark.';
        return;
    }

    // Pick a random chunk file
    var chunkIdx = Math.floor(Math.random() * totalChunks);
    var url = 'data/' + benchmark + '/' + chunkIdx + '.json';

    fetch(url)
        .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        })
        .then(function (data) {
            if (!data || !data.length) throw new Error('Empty chunk');

            // Shuffle the questions within the chunk
            for (var i = data.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var tmp = data[i]; data[i] = data[j]; data[j] = tmp;
            }

            quizState.questions = data;
            quizState.total = Math.min(50, data.length);
            showQuestion();
        })
        .catch(function (err) {
            document.getElementById('question-text').textContent = 'Failed to load — try again. (' + err.message + ')';
        });
}

// All local data uses the same unified format:
// { id, question, options: [...], answer: int }
// No need for per-benchmark parsers!

function showQuestion() {
    var q = quizState.questions[quizState.current];
    if (!q) return;
    quizState.answered = false;
    quizState.startTime = Date.now();

    document.getElementById('question-counter').textContent =
        String(quizState.current + 1).padStart(2, '0') + ' / ' + quizState.total;
    document.getElementById('progress-fill').style.width =
        ((quizState.current + 1) / quizState.total * 100) + '%';
    document.getElementById('next-btn').disabled = true;
    document.getElementById('finish-btn').disabled = quizState.current < 1;

    startTimer();

    document.getElementById('question-text').textContent = q.question;

    // Update keyboard hint dynamically
    var hint = document.querySelector('.footer-hint');
    if (hint) {
        hint.textContent = 'Press 1-' + q.options.length + ' to answer, Enter for next';
    }

    var grid = document.getElementById('options-grid');
    grid.innerHTML = '';
    q.options.forEach(function (opt, i) {
        var btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = '<span class="option-key">' + (i + 1) + '</span><span>' + escapeHtml(String(opt)) + '</span>';
        btn.addEventListener('click', function () { selectAnswer(i, q.answer); });
        grid.appendChild(btn);
    });
}

function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function selectAnswer(idx, correct) {
    if (quizState.answered) return;
    quizState.answered = true;
    quizState.attempted++;
    quizState.totalTime += (Date.now() - quizState.startTime) / 1000;
    stopTimer();

    var btns = document.querySelectorAll('.option-btn');
    if (btns[correct]) btns[correct].classList.add('correct');
    if (idx !== correct && btns[idx]) btns[idx].classList.add('wrong');
    if (idx === correct) quizState.score++;

    document.getElementById('next-btn').disabled = false;
}

function nextQuestion() {
    if (!quizState.answered) return;
    quizState.current++;
    if (quizState.current >= quizState.total) { finish(); return; }
    showQuestion();
}

function startTimer() {
    var el = document.getElementById('question-timer');
    var s = Date.now();
    clearInterval(quizState.timerInterval);
    quizState.timerInterval = setInterval(function () {
        el.textContent = ((Date.now() - s) / 1000).toFixed(1) + 's';
    }, 100);
}
function stopTimer() { clearInterval(quizState.timerInterval); }

function closeModal() {
    document.getElementById('quiz-modal').classList.add('hidden');
    stopTimer();
}

function finish() {
    closeModal();
    showResults();
}

// Keyboard shortcuts
document.addEventListener('keydown', function (e) {
    var modal = document.getElementById('quiz-modal');
    if (modal.classList.contains('hidden')) return;
    if (e.key === 'Escape') { closeModal(); return; }

    var num = parseInt(e.key, 10);
    if (num >= 1 && num <= 9) {
        var btns = document.querySelectorAll('.option-btn');
        if (btns[num - 1]) btns[num - 1].click();
        return;
    }

    if (e.key === 'Enter' && quizState.answered) {
        var next = document.getElementById('next-btn');
        if (next && !next.disabled) next.click();
    }
});

// ================================================================
//  RESULTS — uses data/models.json for AI scores
// ================================================================
function showResults() {
    var modal = document.getElementById('chart-model');
    modal.classList.remove('hidden');

    var attempted = quizState.attempted || quizState.current;
    var pct = attempted > 0 ? Math.round((quizState.score / attempted) * 100) : 0;
    var avg = attempted > 0 ? (quizState.totalTime / attempted).toFixed(1) : '0.0';
    var name = benchmarkNames[quizState.benchmark] || quizState.benchmark;

    document.getElementById('results-badge').textContent = name;
    document.getElementById('ring-pct').textContent = pct + '%';

    var ring = document.getElementById('score-ring');
    var circ = 2 * Math.PI * 52;
    setTimeout(function () { ring.style.strokeDashoffset = circ - (circ * pct / 100); }, 100);

    var comment = pct >= 90 ? 'Exceptional. You outperform most AI models.' :
                  pct >= 70 ? 'Solid performance. Competitive with GPT-class models.' :
                  pct >= 50 ? 'Decent showing. Room to improve.' :
                  'Tough benchmark. The machines win this round.';
    document.getElementById('result-comment').textContent = comment;

    var statsRow = document.getElementById('result-stats');
    statsRow.innerHTML =
        '<div class="results-stat-card"><span class="val">' + quizState.score + '/' + attempted + '</span><span class="label">Correct</span></div>' +
        '<div class="results-stat-card"><span class="val">' + pct + '%</span><span class="label">Accuracy</span></div>' +
        '<div class="results-stat-card"><span class="val">' + avg + 's</span><span class="label">Avg Time</span></div>';

    renderChart(pct);

    var shareUrl = window.location.origin + window.location.pathname + '?b=' + quizState.benchmark + '&s=' + pct;
    document.getElementById('share-link-input').value = shareUrl;
}

function renderChart(humanPct) {
    // Use real model scores from models.json
    var scores = modelScores && modelScores[quizState.benchmark];
    var labels, values;

    if (scores) {
        // Replace "Avg Human" with "You" in the chart
        labels = scores.labels.map(function (l) { return l === 'Avg Human' ? 'You' : l; });
        values = scores.scores.map(function (s, i) { return labels[i] === 'You' ? humanPct : s; });
    } else {
        labels = ['You'];
        values = [humanPct];
    }

    var colors = labels.map(function (l) { return l === 'You' ? '#c9ff00' : 'rgba(255,255,255,0.15)'; });

    if (typeof ApexCharts !== 'undefined') {
        var el = document.getElementById('chart-body');
        el.innerHTML = '';
        new ApexCharts(el, {
            chart: { type: 'bar', height: 220, background: 'transparent', toolbar: { show: false } },
            series: [{ data: values }],
            xaxis: { categories: labels, labels: { style: { colors: '#888', fontSize: '10px', fontFamily: 'JetBrains Mono' } } },
            yaxis: { max: 100, labels: { style: { colors: '#555', fontSize: '10px' } } },
            plotOptions: { bar: { borderRadius: 4, columnWidth: '50%', distributed: true } },
            colors: colors,
            grid: { borderColor: 'rgba(255,255,255,0.04)' },
            dataLabels: { enabled: false },
            legend: { show: false },
            tooltip: { theme: 'dark' }
        }).render();
    }
}

function closeChart() { document.getElementById('chart-model').classList.add('hidden'); }

function copyQuestion() {
    navigator.clipboard.writeText(document.getElementById('question-text').textContent);
}

function copyShareLink() {
    navigator.clipboard.writeText(document.getElementById('share-link-input').value);
}

function shareScore() {
    var t = 'I scored ' + document.getElementById('ring-pct').textContent + ' on ' +
            document.getElementById('results-badge').textContent + '! Can you beat me?';
    if (navigator.share) navigator.share({ title: 'Benchmark Score', text: t, url: document.getElementById('share-link-input').value });
}

function downloadReport() {
    var attempted = quizState.attempted || quizState.current;
    var t = 'Benchmark Report\nTest: ' + document.getElementById('results-badge').textContent +
            '\nScore: ' + document.getElementById('ring-pct').textContent +
            '\nCorrect: ' + quizState.score + '/' + attempted;
    var blob = new Blob([t], { type: 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'benchmark-report.txt';
    a.click();
}

// ================================================================
//  FAQ ACCORDION
// ================================================================
function toggleFaq(btn) {
    var item = btn.closest('.faq-item');
    if (!item) return;
    item.classList.toggle('open');
}

// ================================================================
//  NUMBERS PANEL COUNTER ANIMATION
// ================================================================
function initNumberCounters() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    var numbersPanel = document.getElementById('panel-numbers');
    if (!numbersPanel) return;

    // Get the horizontal scroll position of this panel
    var track = document.getElementById('h-track');
    var container = document.getElementById('horizontal-container');
    if (!track || !container) return;

    var animated = false;

    ScrollTrigger.create({
        trigger: container,
        start: 'top top',
        end: '+=' + (track.scrollWidth - window.innerWidth),
        onUpdate: function (self) {
            if (animated) return;
            // Calculate which panel we're near
            var scrollX = self.progress * (track.scrollWidth - window.innerWidth);
            var panelLeft = numbersPanel.offsetLeft;
            if (scrollX >= panelLeft - window.innerWidth * 0.5) {
                animated = true;
                animateNumberCards();
            }
        }
    });
}

function animateNumberCards() {
    document.querySelectorAll('.number-val').forEach(function (el) {
        var target = parseInt(el.getAttribute('data-count'), 10);
        if (isNaN(target)) return;
        var suffix = target > 100 ? '+' : '';
        var dur = 1500, start = Date.now();
        (function tick() {
            var p = Math.min((Date.now() - start) / dur, 1);
            var ease = 1 - Math.pow(1 - p, 3);
            var val = Math.round(ease * target);
            el.textContent = val.toLocaleString() + suffix;
            if (p < 1) requestAnimationFrame(tick);
        })();
    });
}

// ================================================================
//  SCROLL TO PANEL (for menu navigation)
// ================================================================
function scrollToPanel(panelId) {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    var panelMap = {
        hero: 'panel-hero',
        benchmarks: 'panel-benchmarks',
        story: 'panel-story',
        numbers: 'panel-numbers',
        faq: 'panel-faq',
        footer: 'panel-footer'
    };

    var targetId = panelMap[panelId] || panelId;
    var targetEl = document.getElementById(targetId);
    var track = document.getElementById('h-track');
    var container = document.getElementById('horizontal-container');
    if (!targetEl || !track || !container) return;

    var totalScroll = track.scrollWidth - window.innerWidth;
    var panelLeft = targetEl.offsetLeft;
    var ratio = panelLeft / totalScroll;

    // Get the ScrollTrigger instance to find the scroll range
    var triggers = ScrollTrigger.getAll();
    if (triggers.length > 0) {
        var st = triggers[0];
        var scrollTarget = st.start + ratio * (st.end - st.start);
        gsap.to(window, {
            scrollTo: scrollTarget,
            duration: 1.2,
            ease: 'power3.inOut'
        });
    }
}

// Init number counters after horizontal scroll is set up
window.addEventListener('load', function () {
    setTimeout(initNumberCounters, 2200);
});

// ================================================================
//  MAGNETIC CURSOR
// ================================================================
function initMagneticCursor() {
    var dot = document.getElementById('cursor-dot');
    var ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    // Check for touch device
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        dot.style.display = 'none';
        ring.style.display = 'none';
        return;
    }

    var mouseX = -100, mouseY = -100;
    var dotX = -100, dotY = -100;
    var ringX = -100, ringY = -100;
    var hovering = false;

    document.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Hover detection on interactive elements
    var hoverTargets = 'a, button, .card, .faq-question, .menu-link, .story-link, .option-btn, .hero-cta';
    document.addEventListener('mouseover', function (e) {
        if (e.target.closest(hoverTargets)) {
            hovering = true;
            dot.classList.add('hovering');
            ring.classList.add('hovering');
        }
    });
    document.addEventListener('mouseout', function (e) {
        if (e.target.closest(hoverTargets)) {
            hovering = false;
            dot.classList.remove('hovering');
            ring.classList.remove('hovering');
        }
    });

    // Click effect
    document.addEventListener('mousedown', function () {
        dot.classList.add('clicking');
        ring.classList.add('clicking');
    });
    document.addEventListener('mouseup', function () {
        dot.classList.remove('clicking');
        ring.classList.remove('clicking');
    });

    // Smooth follow with requestAnimationFrame
    function updateCursor() {
        // Dot follows closely
        dotX += (mouseX - dotX) * 0.2;
        dotY += (mouseY - dotY) * 0.2;
        dot.style.left = dotX + 'px';
        dot.style.top = dotY + 'px';

        // Ring follows with more lag for elastic feel
        ringX += (mouseX - ringX) * 0.08;
        ringY += (mouseY - ringY) * 0.08;
        ring.style.left = ringX + 'px';
        ring.style.top = ringY + 'px';

        requestAnimationFrame(updateCursor);
    }
    updateCursor();
}

// ================================================================
//  3D CARD TILT
// ================================================================
function initCardTilt() {
    var cards = document.querySelectorAll('.card');
    cards.forEach(function (card) {
        // Add shine element
        var shine = document.createElement('div');
        shine.className = 'card-tilt-shine';
        card.appendChild(shine);

        card.addEventListener('mousemove', function (e) {
            var rect = card.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            var centerX = rect.width / 2;
            var centerY = rect.height / 2;

            var rotateX = ((y - centerY) / centerY) * -8;
            var rotateY = ((x - centerX) / centerX) * 8;

            card.style.transform = 'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale(1.02)';

            // Update shine position
            var shineX = (x / rect.width * 100);
            var shineY = (y / rect.height * 100);
            shine.style.setProperty('--shine-x', shineX + '%');
            shine.style.setProperty('--shine-y', shineY + '%');
        });

        card.addEventListener('mouseleave', function () {
            card.style.transform = '';
        });
    });
}

// ================================================================
//  TEXT SCRAMBLE / DECODE EFFECT
// ================================================================
function initTextScramble() {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!?';
    var titles = document.querySelectorAll('.section-title');

    titles.forEach(function (title) {
        var originalHTML = title.innerHTML;
        var originalText = title.textContent;
        title.setAttribute('data-original', originalHTML);
        title.setAttribute('data-scrambled', 'false');
    });

    // Use scroll position to trigger scramble
    function checkScrambleTriggers() {
        var track = document.getElementById('h-track');
        if (!track) return;

        var matrix = getComputedStyle(track).transform;
        var scrollX = 0;
        if (matrix && matrix !== 'none') {
            var values = matrix.split(',');
            scrollX = Math.abs(parseFloat(values[4]) || 0);
        }

        titles.forEach(function (title) {
            if (title.getAttribute('data-scrambled') === 'true') return;
            var panel = title.closest('.panel');
            if (!panel) return;

            var panelLeft = panel.offsetLeft;
            var triggerPoint = panelLeft - window.innerWidth * 0.7;

            if (scrollX >= triggerPoint) {
                title.setAttribute('data-scrambled', 'true');
                scrambleReveal(title);
            }
        });

        requestAnimationFrame(checkScrambleTriggers);
    }

    // Start checking after a brief delay
    setTimeout(checkScrambleTriggers, 2500);

    function scrambleReveal(el) {
        var original = el.getAttribute('data-original');
        var textOnly = el.textContent;
        var duration = 800;
        var start = Date.now();
        var len = textOnly.length;

        function step() {
            var elapsed = Date.now() - start;
            var progress = Math.min(elapsed / duration, 1);

            // Build scrambled text - characters reveal from left to right
            var revealedCount = Math.floor(progress * len);
            var result = '';
            var textIdx = 0;

            // Walk through original HTML, replace unfinished chars with random
            for (var i = 0; i < original.length; i++) {
                if (original[i] === '<') {
                    // Skip HTML tags entirely
                    var closeIdx = original.indexOf('>', i);
                    if (closeIdx !== -1) {
                        result += original.substring(i, closeIdx + 1);
                        i = closeIdx;
                        continue;
                    }
                }
                if (original[i] === '&') {
                    var semiIdx = original.indexOf(';', i);
                    if (semiIdx !== -1 && semiIdx - i < 8) {
                        result += original.substring(i, semiIdx + 1);
                        i = semiIdx;
                        textIdx++;
                        continue;
                    }
                }

                if (textIdx < revealedCount) {
                    result += original[i];
                } else if (original[i] === ' ' || original[i] === '\n') {
                    result += original[i];
                } else {
                    result += chars[Math.floor(Math.random() * chars.length)];
                }
                textIdx++;
            }

            el.innerHTML = result;

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.innerHTML = original;
            }
        }
        step();
    }
}

// ================================================================
//  SPOTLIGHT / REVEAL EFFECT
// ================================================================
function initSpotlight() {
    var spotlight = document.getElementById('spotlight');
    if (!spotlight) return;

    var active = false;

    // Track pointer position (mouse and touch)
    document.addEventListener('mousemove', function (e) {
        spotlight.style.setProperty('--spotlight-x', e.clientX + 'px');
        spotlight.style.setProperty('--spotlight-y', e.clientY + 'px');

        // Activate spotlight when not on hero section
        var track = document.getElementById('h-track');
        if (!track) return;

        var matrix = getComputedStyle(track).transform;
        var scrollX = 0;
        if (matrix && matrix !== 'none') {
            var values = matrix.split(',');
            scrollX = Math.abs(parseFloat(values[4]) || 0);
        }

        if (scrollX > window.innerWidth * 0.5) {
            if (!active) { active = true; spotlight.classList.add('active'); }
        } else {
            if (active) { active = false; spotlight.classList.remove('active'); }
        }
    });

    // Touch support for mobile
    document.addEventListener('touchmove', function (e) {
        if (e.touches.length > 0) {
            spotlight.style.setProperty('--spotlight-x', e.touches[0].clientX + 'px');
            spotlight.style.setProperty('--spotlight-y', e.touches[0].clientY + 'px');
        }
    }, { passive: true });
}

// ================================================================
//  MICRO-INTERACTION SOUND DESIGN
// ================================================================
function initSoundDesign() {
    var audioCtx = null;
    var soundEnabled = false;
    var toggle = document.getElementById('sound-toggle');
    if (!toggle) return;

    function getAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        // Resume if suspended (mobile requires user gesture)
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function enableSound() {
        if (soundEnabled) return;
        soundEnabled = true;
        toggle.classList.add('active');
        var onIcon = toggle.querySelector('.sound-on-icon');
        var offIcon = toggle.querySelector('.sound-off-icon');
        if (onIcon && offIcon) {
            onIcon.style.display = 'block';
            offIcon.style.display = 'none';
        }
        getAudioContext();
    }

    // Auto-enable sound on first user interaction
    function autoEnable() {
        enableSound();
        document.removeEventListener('click', autoEnable);
        document.removeEventListener('touchstart', autoEnable);
    }
    document.addEventListener('click', autoEnable, { once: true });
    document.addEventListener('touchstart', autoEnable, { once: true });

    // Toggle sound on/off
    toggle.addEventListener('click', function () {
        soundEnabled = !soundEnabled;
        toggle.classList.toggle('active', soundEnabled);
        var onIcon = toggle.querySelector('.sound-on-icon');
        var offIcon = toggle.querySelector('.sound-off-icon');
        if (onIcon && offIcon) {
            onIcon.style.display = soundEnabled ? 'block' : 'none';
            offIcon.style.display = soundEnabled ? 'none' : 'block';
        }

        if (soundEnabled) {
            getAudioContext();
            playTick(800, 0.06, 0.05); // subtle confirmation
        }
    });

    // Sound generators using Web Audio API
    function playTick(freq, vol, dur) {
        if (!soundEnabled) return;
        try {
            var ctx = getAudioContext();
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + dur);
            gain.gain.setValueAtTime(vol, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + dur);
        } catch (e) { /* silent fail */ }
    }

    function playClick() {
        if (!soundEnabled) return;
        try {
            var ctx = getAudioContext();
            var bufferSize = ctx.sampleRate * 0.02;
            var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            var data = buffer.getChannelData(0);
            for (var i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 10);
            }
            var source = ctx.createBufferSource();
            var gain = ctx.createGain();
            source.buffer = buffer;
            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            source.connect(gain);
            gain.connect(ctx.destination);
            source.start();
        } catch (e) { /* silent fail */ }
    }

    function playSuccess() {
        if (!soundEnabled) return;
        playTick(523, 0.05, 0.08);
        setTimeout(function () { playTick(659, 0.05, 0.08); }, 80);
        setTimeout(function () { playTick(784, 0.04, 0.12); }, 160);
    }

    function playError() {
        if (!soundEnabled) return;
        playTick(300, 0.05, 0.1);
        setTimeout(function () { playTick(250, 0.04, 0.15); }, 100);
    }

    // Attach sounds to interactive elements
    // Card hover
    document.querySelectorAll('.card').forEach(function (card) {
        card.addEventListener('mouseenter', function () { playTick(600, 0.03, 0.04); });
        card.addEventListener('click', function () { playClick(); });
    });

    // FAQ toggle
    document.querySelectorAll('.faq-question').forEach(function (q) {
        q.addEventListener('click', function () { playTick(500, 0.04, 0.05); });
    });

    // Option buttons (quiz) — listen dynamically
    document.addEventListener('click', function (e) {
        var optionBtn = e.target.closest('.option-btn');
        if (optionBtn) {
            playClick();
            // Check correct/wrong after a small delay
            setTimeout(function () {
                if (optionBtn.classList.contains('correct')) playSuccess();
                else if (optionBtn.classList.contains('wrong')) playError();
            }, 50);
        }
    });

    // Menu links
    document.querySelectorAll('.menu-link').forEach(function (link) {
        link.addEventListener('mouseenter', function () { playTick(700, 0.02, 0.03); });
    });

    // CTA button
    var cta = document.querySelector('.hero-cta');
    if (cta) {
        cta.addEventListener('mouseenter', function () { playTick(440, 0.04, 0.06); });
        cta.addEventListener('click', function () { playClick(); });
    }

    // Nav toggle
    var menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function () { playTick(550, 0.04, 0.05); });
    }
}
