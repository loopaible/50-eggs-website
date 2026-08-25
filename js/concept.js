document.addEventListener('DOMContentLoaded', function () {
    // "Discover More" carousel: static, arrow-controlled, one full-screen slide at a
    // time. No autoplay/scroll-linked motion.
    (function () {
        var track = document.getElementById('nextConceptTrack');
        var prevBtn = document.getElementById('nextConceptPrev');
        var nextBtn = document.getElementById('nextConceptNext');
        if (!track || !prevBtn || !nextBtn) return;
        var items = track.querySelectorAll('.concept-next-item');
        var index = 0;

        function goTo(i) {
            index = (i + items.length) % items.length;
            track.style.transform = 'translateX(-' + (index * 100) + 'vw)';
        }

        prevBtn.addEventListener('click', function () { goTo(index - 1); });
        nextBtn.addEventListener('click', function () { goTo(index + 1); });

        goTo(0);
    })();

    // Horizontal image gallery: progress bar reflects actual scroll position within the
    // gallery's scrollable viewport.
    var viewport = document.querySelector('.concept-gallery-viewport');
    var bar = document.getElementById('galleryProgressBar');
    if (!viewport || !bar) return;

    // Arrow buttons: scroll exactly one item (its width + the track gap) at a time,
    // snapping smoothly rather than free-scrolling.
    var galleryPrev = document.getElementById('galleryPrev');
    var galleryNext = document.getElementById('galleryNext');
    var galleryItem = viewport.querySelector('.concept-gallery-item');

    function galleryStep() {
        if (!galleryItem) return 0;
        var style = getComputedStyle(galleryItem);
        var gap = parseFloat(getComputedStyle(viewport.querySelector('.concept-gallery-track')).columnGap) || 0;
        return galleryItem.getBoundingClientRect().width + gap;
    }

    if (galleryPrev) {
        galleryPrev.addEventListener('click', function () {
            viewport.scrollBy({ left: -galleryStep(), behavior: 'smooth' });
        });
    }
    if (galleryNext) {
        galleryNext.addEventListener('click', function () {
            viewport.scrollBy({ left: galleryStep(), behavior: 'smooth' });
        });
    }

    function updateProgress() {
        var maxScroll = viewport.scrollWidth - viewport.clientWidth;
        var progress = maxScroll > 0 ? viewport.scrollLeft / maxScroll : 0;
        bar.style.width = (progress * 100) + '%';
    }

    viewport.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();

    // Deliberately no vertical-wheel-to-horizontal conversion here: that would hijack
    // normal page scrolling whenever the cursor happens to be over the gallery. Native
    // horizontal trackpad swipes and shift+wheel already scroll this natively; mouse
    // and touch users get there via drag (below) or the progress-bar scrubber.

    // Click-and-drag to scroll for mouse users (dragging directly on the images).
    var isDown = false;
    var startX = 0;
    var startScroll = 0;

    viewport.addEventListener('mousedown', function (e) {
        isDown = true;
        viewport.classList.add('dragging');
        startX = e.pageX;
        startScroll = viewport.scrollLeft;
    });
    window.addEventListener('mouseup', function () {
        isDown = false;
        viewport.classList.remove('dragging');
        trackDown = false;
    });
    window.addEventListener('mousemove', function (e) {
        if (!isDown) return;
        e.preventDefault();
        viewport.scrollLeft = startScroll - (e.pageX - startX);
    });

    // Drag the progress bar itself as a scrubber.
    var progressTrack = document.getElementById('galleryProgressTrack');
    var trackDown = false;

    function scrubToClientX(clientX) {
        var trackRect = progressTrack.getBoundingClientRect();
        var ratio = (clientX - trackRect.left) / trackRect.width;
        ratio = Math.min(Math.max(ratio, 0), 1);
        var maxScroll = viewport.scrollWidth - viewport.clientWidth;
        viewport.scrollLeft = ratio * maxScroll;
    }

    if (progressTrack) {
        progressTrack.addEventListener('mousedown', function (e) {
            trackDown = true;
            scrubToClientX(e.clientX);
        });
        window.addEventListener('mousemove', function (e) {
            if (!trackDown) return;
            scrubToClientX(e.clientX);
        });
    }
});
