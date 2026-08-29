document.addEventListener('DOMContentLoaded', function () {
    // Page transition overlay: on load, a full-screen color panel (matching this page's
    // hero color) unfills from top to bottom, revealing the page. Clicking an internal
    // link instead fills the same panel from bottom to top, then navigates once covered
    // — both directions share one transform-origin (bottom), just scaling the opposite way.
    (function () {
        var overlay = document.querySelector('.page-transition-overlay');
        if (!overlay) return;

        requestAnimationFrame(function () {
            overlay.classList.add('is-animating');
            requestAnimationFrame(function () {
                overlay.classList.add('is-hidden');
            });
        });

        document.addEventListener('click', function (e) {
            var a = e.target.closest('a');
            if (!a) return;
            var href = a.getAttribute('href');
            if (!href || href.charAt(0) === '#') return;
            if (a.target === '_blank' || a.hasAttribute('download')) return;
            var url;
            try { url = new URL(a.href, window.location.href); } catch (err) { return; }
            if (url.origin !== window.location.origin) return;
            if (url.pathname === window.location.pathname) return;

            e.preventDefault();
            overlay.classList.add('is-animating');
            overlay.classList.remove('is-hidden');
            setTimeout(function () { window.location.href = a.href; }, 600);
        });
    })();

    // Site-wide velocity-based smooth scrolling: wheel input accumulates velocity that
    // eases the page's real scroll position toward its target with friction, instead of
    // jumping 1:1 with each wheel tick. Uses window.scrollBy (genuine native scroll), so
    // window.scrollY stays authoritative and every other scroll-driven feature on the
    // page keeps working unchanged. Tuned conservatively so a single scroll gesture
    // travels roughly a normal scroll's distance, just eased, not a runaway distance.
    (function () {
        var velocity = 0;
        var FRICTION = 0.82;
        var SENSITIVITY = 0.45;
        var MAX_VELOCITY = 26; // hard cap on the accumulated velocity itself

        window.addEventListener('wheel', function (e) {
            if (e.ctrlKey) return; // let pinch-zoom through untouched
            e.preventDefault();
            velocity += e.deltaY * SENSITIVITY;
            velocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, velocity));
        }, { passive: false });

        function tick() {
            if (Math.abs(velocity) > 0.05) {
                window.scrollBy(0, velocity);
                velocity *= FRICTION;
            } else {
                velocity = 0;
            }
            requestAnimationFrame(tick);
        }
        tick();
    })();

    // Hero image carousel: continuous edge-to-edge marquee, base autoplay speed at rest,
    // sped up in whichever direction matches the page's current scroll velocity.
    (function () {
        var track = document.getElementById('heroCarouselTrack');
        if (!track) return;

        // Randomize carousel items
        var sets = track.querySelectorAll('.hero-carousel-set');
        if (sets.length > 0) {
            var firstSet = sets[0];
            var items = Array.from(firstSet.querySelectorAll('.hero-carousel-item'));
            if (items.length > 3) {
                // Fisher-Yates shuffle
                for (var i = items.length - 1; i > 0; i--) {
                    var j = Math.floor(Math.random() * (i + 1));
                    var temp = items[i].cloneNode(true);
                    items[i].replaceWith(items[j].cloneNode(true));
                    items[j].replaceWith(temp);
                }
            }
        }

        var setWidth = 0;
        var offset = 0;
        var BASE_SPEED = 1.6; // px/frame at rest
        var lastScrollY = window.scrollY;
        var scrollBoost = 0;
        var paused = false;

        function measure() {
            setWidth = track.querySelector('.hero-carousel-set').getBoundingClientRect().width;
        }

        window.addEventListener('scroll', function () {
            var dy = window.scrollY - lastScrollY;
            lastScrollY = window.scrollY;
            scrollBoost += dy * 0.1;
            scrollBoost = Math.max(-4, Math.min(4, scrollBoost));
        }, { passive: true });

        track.addEventListener('mouseenter', function () { paused = true; });
        track.addEventListener('mouseleave', function () { paused = false; });

        // Drag functionality: click and hold to drag
        var isDragging = false;
        var dragStart = 0;
        var dragOffset = 0;

        track.addEventListener('mousedown', function (e) {
            isDragging = true;
            dragStart = e.clientX;
            dragOffset = 0;
            paused = true;
        });

        document.addEventListener('mousemove', function (e) {
            if (!isDragging) return;
            dragOffset = e.clientX - dragStart;
        });

        document.addEventListener('mouseup', function () {
            if (!isDragging) return;
            isDragging = false;
            if (Math.abs(dragOffset) > 10) {
                offset -= dragOffset * 0.5;
            }
            paused = false;
            dragOffset = 0;
        });

        function tick() {
            scrollBoost *= 0.94;
            if (isDragging) {
                var displayOffset = offset + dragOffset;
                track.style.transform = 'translateX(' + displayOffset + 'px)';
            } else if (!paused) {
                var speed = BASE_SPEED + scrollBoost;
                offset -= speed;
                if (setWidth > 0) {
                    if (offset <= -setWidth) offset += setWidth;
                    if (offset > 0) offset -= setWidth;
                }
                track.style.transform = 'translateX(' + offset + 'px)';
            }
            requestAnimationFrame(tick);
        }

        window.addEventListener('resize', measure);
        window.addEventListener('load', measure);
        measure();
        tick();
    })();

    // Nav link hover: wrap each link's text so it can roll up and be replaced by an
    // identical copy scrolling up from underneath (and roll back down on mouse-leave).
    document.querySelectorAll('.nav-links > a, .nav-dropdown-trigger, .nav-dropdown-menu a, .footer-v2-col a, .footer-v2-bottom a, .footer-v2-legal a, .footer-v2-signup').forEach(function (link) {
        var text = link.textContent;
        link.innerHTML = '<span class="roll">' +
            '<span class="roll-line">' + text + '</span>' +
            '<span class="roll-line" aria-hidden="true">' + text + '</span>' +
            '</span>';
    });

    // Button hover: same roll-up text effect, wrapped in its own clipping mask since
    // buttons have their own padding/height independent of the text line height.
    document.querySelectorAll('.btn').forEach(function (btn) {
        var text = btn.textContent;
        btn.innerHTML = '<span class="roll-mask"><span class="roll">' +
            '<span class="roll-line">' + text + '</span>' +
            '<span class="roll-line" aria-hidden="true">' + text + '</span>' +
            '</span></span>';
    });

    // Mobile nav toggle
    var navIcon = document.querySelector('.nav-icon');
    if (navIcon) {
        navIcon.addEventListener('click', function () {
            document.body.classList.toggle('active');
        });
    }

    // Header: transparent at the very top, swaps to the blue brand color (with light
    // text) while it sits directly over any blue section (hero, press/apartment,
    // discover-more), swaps to gold over the gold press section, and gains its cream
    // background otherwise once scrolled.
    var headerEl = document.getElementById('headerElement');
    var blueSections = document.querySelectorAll('.hero-v2:not(.hero-gold), .concept-next, .room-section, .has-dark-nav');
    var goldSections = document.querySelectorAll('.concept-press, .press-section, .hero-v2.hero-gold');
    if (headerEl) {
        function updateHeaderBg() {
            var headerHeight = headerEl.offsetHeight;
            var overBlueSection = false;
            var overGoldSection = false;
            blueSections.forEach(function (section) {
                var rect = section.getBoundingClientRect();
                if (rect.top <= headerHeight && rect.bottom >= 0) overBlueSection = true;
            });
            goldSections.forEach(function (section) {
                var rect = section.getBoundingClientRect();
                if (rect.top <= headerHeight && rect.bottom >= 0) overGoldSection = true;
            });
            headerEl.classList.toggle('on-gold', overGoldSection);
            headerEl.classList.toggle('on-blue', overBlueSection && !overGoldSection);
            headerEl.classList.toggle('scrolled', window.scrollY > 60 && !overBlueSection && !overGoldSection);
        }
        window.addEventListener('scroll', updateHeaderBg, { passive: true });
        window.addEventListener('resize', updateHeaderBg);
        updateHeaderBg();
    }

    // Sitewide cursor-following badge: a frosted-glass circle that tracks the actual
    // mouse position while hovering any .view-hover element (carousel images, about
    // photos, apartment/experience images, etc). Reads "View {Concept}" if the element
    // has a data-concept attribute, or a custom data-label (e.g. "Scroll") if set,
    // falling back to the generic "View".
    var cursorBadge = document.getElementById('cursorViewBadge');
    var cursorBadgeLabel = cursorBadge ? cursorBadge.querySelector('span') : null;
    var viewHoverTargets = document.querySelectorAll('.view-hover');
    if (cursorBadge && viewHoverTargets.length) {
        viewHoverTargets.forEach(function (target) {
            target.addEventListener('mouseenter', function () {
                var concept = target.getAttribute('data-concept');
                var label = target.getAttribute('data-label');
                if (cursorBadgeLabel) cursorBadgeLabel.textContent = label || (concept ? 'View ' + concept : 'View');
                cursorBadge.classList.add('active');
            });
            target.addEventListener('mousemove', function (e) {
                cursorBadge.style.left = e.clientX + 'px';
                cursorBadge.style.top = e.clientY + 'px';
            });
            target.addEventListener('mouseleave', function () {
                cursorBadge.classList.remove('active');
            });
        });
    }

    // Apartment/press image(s): subtle parallax drift as each section scrolls through
    // view, continuously scroll-linked (not a fixed animation) so it moves smoothly up
    // and down in both scroll directions, reversing cleanly if you scroll back up.
    document.querySelectorAll('.concept-press figure img').forEach(function (img) {
        var section = img.closest('section');

        function tick() {
            var rect = section.getBoundingClientRect();
            var vh = window.innerHeight;
            // 0 when the section's top is at the bottom of the viewport, 1 when its
            // bottom has reached the top of the viewport
            var progress = (vh - rect.top) / (vh + rect.height);
            progress = Math.min(Math.max(progress, 0), 1);
            var offset = (progress - 0.5) * (rect.height * 0.3);
            img.style.transform = 'translateY(' + offset + 'px)';
            requestAnimationFrame(tick);
        }
        tick();
    });

    // Image-zoom figure: narrower by default, widens to full-bleed continuously as the
    // section scrolls through view (scroll-linked, not a fixed-duration animation, so
    // it's fully reversible in both directions).
    (function () {
        var section = document.querySelector('.image-zoom-section');
        var figure = section ? section.querySelector('figure') : null;
        if (!section || !figure) return;
        var MIN_WIDTH = 55;
        var MAX_WIDTH = 100;
        var current = MIN_WIDTH;
        var target = MIN_WIDTH;
        var LERP = 0.1;

        function isDesktopWidth() {
            return window.matchMedia('(min-width: 769px)').matches;
        }

        function computeTarget() {
            if (!isDesktopWidth()) {
                target = MAX_WIDTH;
                return;
            }
            var rect = section.getBoundingClientRect();
            var vh = window.innerHeight;
            // 0 when the section's top is at the bottom of the viewport, 1 once it's
            // scrolled to be centered in view
            var raw = (vh - rect.top) / (vh * 0.9);
            var progress = Math.min(Math.max(raw, 0), 1);
            target = MIN_WIDTH + (MAX_WIDTH - MIN_WIDTH) * progress;
        }

        function tick() {
            current += (target - current) * LERP;
            figure.style.width = current + '%';
            requestAnimationFrame(tick);
        }

        window.addEventListener('scroll', computeTarget, { passive: true });
        window.addEventListener('resize', computeTarget);
        computeTarget();
        current = target;
        tick();
    })();

    // Smooth scroll for in-page anchors (skips the pinned room gallery links, handled separately below)
    document.querySelectorAll('a.scrollTo').forEach(function (link) {
        if (link.closest('.rooms-content-block')) return;
        link.addEventListener('click', function (e) {
            var href = link.getAttribute('href');
            if (!href || href === '#' || href.length < 2) return;
            var target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                document.body.classList.remove('active');
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Image reveal wipe: figure slides in from -50%, image inside slides from +50% while
    // scaling down from 1.2x, both converging together left-to-right. Progress is driven
    // continuously by scroll position (with a light lerp for smooth, weighted motion)
    // rather than a fixed-duration animation, so speed matches scroll velocity and it's
    // fully reversible in both directions.
    // Duo-photo figures (two side-by-side images) reveal each photo independently using
    // its own .duo-photo wrapper as the sliding container, rather than sliding the shared
    // flex parent — sliding the parent moved both photos as one block and glitched.
    var revealContainers = [];
    document.querySelectorAll('figure.image').forEach(function (figure) {
        if (figure.classList.contains('duo-image')) {
            figure.querySelectorAll('.duo-photo').forEach(function (photo) {
                revealContainers.push(photo);
            });
        } else {
            revealContainers.push(figure);
        }
    });

    if (revealContainers.length) {
        var LERP = 0.1;
        var reveals = revealContainers.map(function (container) {
            var imgs = Array.prototype.slice.call(container.querySelectorAll('img'));
            return { figure: container, imgs: imgs, current: 0, target: 0 };
        });

        function computeTargets() {
            var vh = window.innerHeight;
            reveals.forEach(function (r) {
                var rect = r.figure.getBoundingClientRect();
                // 0 when entering from below, 1 once settled into view
                var raw = (vh - rect.top) / (vh * 0.75);
                r.target = Math.min(Math.max(raw, 0), 1);
            });
        }

        function apply(r) {
            var p = r.current;
            var containerPct = -50 * (1 - p);
            var imgPct = 50 * (1 - p);
            var scale = 1 + 0.2 * (1 - p);
            r.figure.style.transform = 'translateX(' + containerPct + '%)';
            r.imgs.forEach(function (img) {
                img.style.transform = 'translateX(' + imgPct + '%) scale(' + scale + ')';
            });
        }

        function tick() {
            reveals.forEach(function (r) {
                r.current += (r.target - r.current) * LERP;
                if (Math.abs(r.target - r.current) < 0.001) r.current = r.target;
                apply(r);
            });
            requestAnimationFrame(tick);
        }

        window.addEventListener('scroll', computeTargets, { passive: true });
        window.addEventListener('resize', computeTargets);
        computeTargets();
        reveals.forEach(function (r) { r.current = r.target; apply(r); });
        tick();
    }

    // Pinned room gallery: images flow past continuously as the page scrolls,
    // like a vertical carousel, while the matching tab highlights.
    var section = document.querySelector('.room-section');
    var sticky = document.querySelector('.room-section-sticky');
    var track = document.querySelector('.rooms-images');
    var blocks = Array.prototype.slice.call(document.querySelectorAll('.rooms-image-block'));
    var links = document.querySelectorAll('.rooms-content-block .block-links li');

    if (section && sticky && track && blocks.length) {
        var maxScroll = 0;

        function isPinnable() {
            return window.matchMedia('(min-width: 992px)').matches;
        }

        function measure() {
            if (!isPinnable()) {
                section.style.height = '';
                track.style.transform = '';
                maxScroll = 0;
                return;
            }
            var viewportH = sticky.clientHeight;
            var trackH = track.scrollHeight;
            maxScroll = Math.max(trackH - viewportH, 0);
            section.style.height = trackH + 'px';
        }

        function update() {
            if (!isPinnable()) return;
            var rect = section.getBoundingClientRect();
            var scrolled = -rect.top;
            var progress = maxScroll > 0 ? Math.min(Math.max(scrolled / maxScroll, 0), 1) : 0;
            var offset = -progress * maxScroll;
            track.style.transform = 'translateY(' + offset + 'px)';

            // Highlight the tab whose image block is currently centered in the pinned viewport
            var viewportCenter = -offset + sticky.clientHeight / 2;
            var closest = null;
            var closestDist = Infinity;
            blocks.forEach(function (block) {
                var center = block.offsetTop + block.offsetHeight / 2;
                var dist = Math.abs(center - viewportCenter);
                if (dist < closestDist) {
                    closestDist = dist;
                    closest = block;
                }
            });
            if (closest) {
                blocks.forEach(function (block) {
                    block.classList.toggle('active', block === closest);
                });
                var tabIndex = parseInt(closest.getAttribute('data-tab'), 10);
                links.forEach(function (li, i) {
                    li.classList.toggle('active', i === tabIndex);
                });
            }
        }

        window.addEventListener('resize', function () {
            measure();
            update();
        });

        window.addEventListener('load', function () {
            measure();
            update();
        });

        window.addEventListener('scroll', update, { passive: true });

        // Clicking a tab scrolls so that block is centered while pinned
        links.forEach(function (li, tabIndex) {
            var a = li.querySelector('a');
            if (!a) return;
            a.addEventListener('click', function (e) {
                var block = blocks[tabIndex];
                if (!block || !isPinnable()) return;
                e.preventDefault();
                var targetCenter = block.offsetTop + block.offsetHeight / 2;
                var progress = maxScroll > 0 ? (targetCenter - sticky.clientHeight / 2) / maxScroll : 0;
                progress = Math.min(Math.max(progress, 0), 1);
                var sectionTop = section.getBoundingClientRect().top + window.scrollY;
                window.scrollTo({ top: sectionTop + progress * maxScroll, behavior: 'smooth' });
            });
        });

        blocks[0].classList.add('active');
        measure();
        update();
    }

    // Blog card stack: cards start separated with a gap; scrolling down pulls them
    // together into an overlapping stack (later cards painted on top, covering only the
    // trailing edge of the one before). Scrolling back up undoes it, since both the gap
    // and the track position are driven directly by scroll progress, not a one-way
    // animation.
    var blogWrapper = document.getElementById('blogStackWrapper');
    var blogStack = document.getElementById('blogStack');
    var blogCards = blogWrapper ? Array.prototype.slice.call(blogWrapper.querySelectorAll('.blog-card')) : [];

    if (blogWrapper && blogStack && blogCards.length) {
        var GAP_START = 30; // px, cards separated at rest
        var OVERLAP_END = -160; // px, fully overlapped at end of scroll

        function isBlogPinnable() {
            return window.matchMedia('(min-width: 901px)').matches;
        }

        function updateBlogStack() {
            if (!isBlogPinnable()) return;
            var rect = blogWrapper.getBoundingClientRect();
            var stickyH = window.innerHeight;
            var scrollable = rect.height - stickyH;
            var progress = scrollable > 0 ? -rect.top / scrollable : 0;
            progress = Math.min(Math.max(progress, 0), 1);

            var margin = GAP_START + (OVERLAP_END - GAP_START) * progress;
            blogCards.forEach(function (card, i) {
                if (i > 0) card.style.marginLeft = margin + 'px';
            });

            var viewportW = blogWrapper.parentElement.clientWidth;
            var trackW = blogStack.scrollWidth;
            var maxScroll = Math.max(trackW - viewportW, 0);
            blogStack.style.transform = 'translateX(-' + (progress * maxScroll) + 'px)';
        }

        function resetBlogStack() {
            blogStack.style.transform = '';
            blogCards.forEach(function (card, i) {
                if (i > 0) card.style.marginLeft = '';
            });
        }

        window.addEventListener('scroll', function () {
            if (isBlogPinnable()) updateBlogStack(); else resetBlogStack();
        }, { passive: true });
        window.addEventListener('resize', function () {
            if (isBlogPinnable()) updateBlogStack(); else resetBlogStack();
        });
        if (isBlogPinnable()) updateBlogStack();
    }
});
