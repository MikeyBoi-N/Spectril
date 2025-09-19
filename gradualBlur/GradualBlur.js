function GradualBlur(config) {
    const DEFAULT_CONFIG = {
        position: 'bottom',
        strength: 2,
        height: '6rem',
        divCount: 5,
        exponential: false,
        opacity: 1,
        curve: 'linear',
        zIndex: 9
    };

    const mergedConfig = { ...DEFAULT_CONFIG, ...config };

    const { position, strength, height, divCount, exponential, opacity, curve, zIndex } = mergedConfig;

    const CURVE_FUNCTIONS = {
        linear: p => p,
        bezier: p => p * p * (3 - 2 * p),
        'ease-in': p => p * p,
        'ease-out': p => 1 - Math.pow(1 - p, 2),
        'ease-in-out': p => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2)
    };

    const getGradientDirection = position =>
        ({
            top: 'to top',
            bottom: 'to bottom',
            left: 'to left',
            right: 'to right'
        })[position] || 'to bottom';

    const container = document.createElement('div');
    container.className = 'gradual-blur';
    const isVertical = ['top', 'bottom'].includes(position);
    
    container.style.position = 'fixed';
    container.style.pointerEvents = 'none';
    container.style.zIndex = zIndex;
    if (isVertical) {
        container.style.height = height;
        container.style.width = '100%';
        container.style[position] = 0;
        container.style.left = 0;
        container.style.right = 0;
    } else {
        container.style.width = height;
        container.style.height = '100%';
        container.style[position] = 0;
        container.style.top = 0;
        container.style.bottom = 0;
    }


    const inner = document.createElement('div');
    inner.className = 'gradual-blur-inner';
    inner.style.position = 'relative';
    inner.style.width = '100%';
    inner.style.height = '100%';
    container.appendChild(inner);

    const increment = 100 / divCount;
    const curveFunc = CURVE_FUNCTIONS[curve] || CURVE_FUNCTIONS.linear;

    for (let i = 1; i <= divCount; i++) {
        let progress = i / divCount;
        progress = curveFunc(progress);

        let blurValue;
        if (exponential) {
            blurValue = Math.pow(2, progress * 4) * 0.0625 * strength;
        } else {
            blurValue = 0.0625 * (progress * divCount + 1) * strength;
        }

        const p1 = Math.round((increment * i - increment) * 10) / 10;
        const p2 = Math.round(increment * i * 10) / 10;
        const p3 = Math.round((increment * i + increment) * 10) / 10;
        const p4 = Math.round((increment * i + increment * 2) * 10) / 10;

        let gradient = `transparent ${p1}%, black ${p2}%`;
        if (p3 <= 100) gradient += `, black ${p3}%`;
        if (p4 <= 100) gradient += `, transparent ${p4}%`;

        const direction = getGradientDirection(position);

        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.inset = '0';
        div.style.maskImage = `linear-gradient(${direction}, ${gradient})`;
        div.style.webkitMaskImage = `linear-gradient(${direction}, ${gradient})`;
        div.style.backdropFilter = `blur(${blurValue.toFixed(3)}rem)`;
        div.style.webkitBackdropFilter = `blur(${blurValue.toFixed(3)}rem)`;
        div.style.opacity = opacity;
        inner.appendChild(div);
    }

    document.body.appendChild(container);
}
