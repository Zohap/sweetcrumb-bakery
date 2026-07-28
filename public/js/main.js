document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('mainNav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  // Auto-dismiss alerts after a few seconds
  document.querySelectorAll('.alert').forEach(function (el) {
    setTimeout(function () {
      el.style.transition = 'opacity 0.5s ease';
      el.style.opacity = '0';
      setTimeout(function () { el.remove(); }, 500);
    }, 4000);
  });
  
  // Hero entrance animation
  var heroText = document.querySelector('.hero-text');
  var heroArt = document.querySelector('.hero-art');
  if (heroText) heroText.classList.add('hero-in');
  if (heroArt) heroArt.classList.add('hero-in-art');

  // Scroll reveal animation for cards and sections
  var animatedEls = document.querySelectorAll(
    '.category-card, .product-card, .promo-item, .stat-card'
  );
  animatedEls.forEach(function (el, i) {
    el.classList.add('scroll-fade');
    el.style.transitionDelay = (i % 6) * 0.06 + 's';
  });

  function revealIfVisible(el) {
    var rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('is-visible');
    }
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0 });
    animatedEls.forEach(function (el) { observer.observe(el); });

    // Safety net: force-reveal anything already on screen right away
    animatedEls.forEach(revealIfVisible);
    // Re-check once more after images finish loading (layout may shift)
    window.addEventListener('load', function () {
      animatedEls.forEach(revealIfVisible);
    });
  } else {
    animatedEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

 
});
