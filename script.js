document.addEventListener('scroll', function() {
    const hero = document.querySelector('.hero');
    if (hero) {
        let offset = window.pageYOffset;
        hero.style.backgroundPositionY = offset * 0.7 + 'px';
    }
});