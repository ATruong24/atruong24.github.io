// Animated wallpaper: soft colour blobs drifting slowly.
// Drawn on a tiny canvas (~200px wide) that CSS stretches to fill the screen.
// Upscaling blurs it for free, so the browser only composites one cheap layer.
(function () {
    var canvas = document.getElementById('bg');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d', { alpha: false });

    var css = getComputedStyle(document.documentElement);
    var color = function (name) { return css.getPropertyValue(name).trim(); };

    // x/y: centre as a fraction of the screen; r: radius as a fraction of the longer side.
    // ax/ay: how far it wanders; px/py: seconds per cycle (slow, and different per blob
    // so the pattern never visibly repeats).
    var blobs = [
        { c: color('--periwinkle'), x: 0.15, y: 0.10, r: 0.55, ax: 0.18, ay: 0.20, px: 70,  py: 90,  ph: 0.0 },
        { c: color('--rose'),       x: 0.90, y: 0.25, r: 0.50, ax: 0.20, ay: 0.22, px: 85,  py: 75,  ph: 1.3 },
        { c: color('--sage'),       x: 0.20, y: 0.90, r: 0.55, ax: 0.25, ay: 0.15, px: 95,  py: 110, ph: 2.1 },
        { c: color('--lavender'),   x: 0.85, y: 0.85, r: 0.50, ax: 0.20, ay: 0.20, px: 80,  py: 100, ph: 3.4 },
        { c: color('--peach'),      x: 0.50, y: 0.50, r: 0.35, ax: 0.18, ay: 0.16, px: 110, py: 95,  ph: 4.2, a: 0.55 }
    ];
    var base = color('--base');

    var W = 200, H = 120;
    function resize() {
        H = Math.max(60, Math.round(W * window.innerHeight / window.innerWidth));
        canvas.width = W;
        canvas.height = H;
    }

    function hexToRgb(hex) {
        var n = parseInt(hex.replace('#', ''), 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    blobs.forEach(function (b) { b.rgb = hexToRgb(b.c); });

    function draw(t) {
        var s = t / 1000;
        var size = Math.max(W, H);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, W, H);

        // Soft additive-ish light: 'lighter' would blow out, 'screen' keeps it gentle
        ctx.globalCompositeOperation = 'screen';
        for (var i = 0; i < blobs.length; i++) {
            var b = blobs[i];
            var tau = Math.PI * 2;
            var cx = (b.x + b.ax * Math.sin(tau * s / b.px + b.ph)) * W;
            var cy = (b.y + b.ay * Math.cos(tau * s / b.py + b.ph * 0.7)) * H;
            var r = b.r * size * (1 + 0.08 * Math.sin(tau * s / (b.px * 1.3) + b.ph));
            var a = b.a || 0.7;
            var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            var rgb = b.rgb.join(',');
            g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')');
            g.addColorStop(0.5, 'rgba(' + rgb + ',' + (a * 0.45) + ')');
            g.addColorStop(1, 'rgba(' + rgb + ',0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
        }
    }

    resize();
    // Resizing clears the canvas, so redraw straight away (matters when motion is paused)
    window.addEventListener('resize', function () { resize(); draw(performance.now() + offset); });

    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    // Start at a random point in the cycle so each visit looks a little different
    var offset = Math.random() * 100000;

    function frame(now) {
        draw(now + offset);
        if (!(still && still.matches)) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    if (still && still.addEventListener) {
        still.addEventListener('change', function () { if (!still.matches) requestAnimationFrame(frame); });
    }
})();
