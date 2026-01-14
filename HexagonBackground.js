// HexagonBackground.js
class HexagonBackground {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error("Container not found for HexagonBackground:", containerId);
            return;
        }

        this.options = {
            hexSize: options.hexSize || 40, // Taille de chaque hexagone (côté)
            gap: options.gap || 5,         // Espace entre les hexagones
            glowRadius: options.glowRadius || 150, // Rayon d'effet de la souris
            glowColor: options.glowColor || 'rgba(70, 130, 255, 0.4)', // Couleur du halo
            hexColor: options.hexColor || 'rgba(255, 255, 255, 0.03)', // Couleur de base de l'hexagone
            borderColor: options.borderColor || 'rgba(255, 255, 255, 0.08)', // Couleur de la bordure
            animationSpeed: options.animationSpeed || 0.005, // Vitesse de l'animation
            pulseSpeed: options.pulseSpeed || 0.002, // Vitesse du puls
        };

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);

        this.mouseX = -999;
        this.mouseY = -999;

        this.hexagons = [];
        this.resizeObserver = null;

        this.init();
    }

    init() {
        this.setupCanvas();
        this.generateHexagons();
        this.addEventListeners();
        this.startAnimation();
        this.setupResizeObserver();
    }

    setupCanvas() {
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '-2'; // Plus bas que bg-glow
        this.canvas.style.pointerEvents = 'none'; // Pour que les clics passent au-travers

        // Résolution du canvas (pour éviter le pixelisé)
        this.canvas.width = this.container.clientWidth * window.devicePixelRatio;
        this.canvas.height = this.container.clientHeight * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    setupResizeObserver() {
        this.resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.target === this.container) {
                    this.canvas.width = entry.contentRect.width * window.devicePixelRatio;
                    this.canvas.height = entry.contentRect.height * window.devicePixelRatio;
                    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
                    this.generateHexagons(); // Régénère les hexagones sur le nouveau redimensionnement
                }
            }
        });
        this.resizeObserver.observe(this.container);
    }

    // Calcule les points d'un hexagone
    getHexPoints(x, y, size) {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 3 * i;
            points.push({
                x: x + size * Math.cos(angle),
                y: y + size * Math.sin(angle)
            });
        }
        return points;
    }

    generateHexagons() {
        this.hexagons = [];
        const { hexSize, gap } = this.options;
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;

        const hexHeight = Math.sqrt(3) * hexSize;
        const hexWidth = 2 * hexSize;
        const vertDist = hexHeight + gap;
        const horizDist = hexWidth * 3 / 4 + gap;

        let row = 0;
        for (let y = -hexHeight; y < height + hexHeight; y += vertDist) {
            let startX = (row % 2 === 0) ? -hexWidth / 2 : -hexWidth / 2 - horizDist / 2;
            for (let x = startX; x < width + hexWidth; x += horizDist) {
                this.hexagons.push({
                    x: x,
                    y: y,
                    initialOffset: Math.random() * Math.PI * 2, // Pour un mouvement aléatoire
                    pulseOffset: Math.random() * Math.PI * 2,   // Pour un pulse aléatoire
                    glowAlpha: 0 // Alpha de la lueur de la souris
                });
            }
            row++;
        }
    }

    addEventListeners() {
        this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.container.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    }

    onMouseMove(e) {
        // Coordonnées de la souris par rapport au conteneur
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
    }

    onMouseLeave() {
        this.mouseX = -999;
        this.mouseY = -999;
    }

    drawHexagon(hex, time) {
        const { hexSize, glowRadius, glowColor, hexColor, borderColor, animationSpeed, pulseSpeed } = this.options;
        const ctx = this.ctx;

        // Mouvement de pulsation basé sur le temps
        const pulseScale = 1 + Math.sin(time * pulseSpeed + hex.pulseOffset) * 0.05;
        const currentHexSize = hexSize * pulseScale;

        // Mouvement vertical lent
        const yOffset = Math.sin(time * animationSpeed + hex.initialOffset) * 10;

        const points = this.getHexPoints(hex.x, hex.y + yOffset, currentHexSize);

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();

        // Calcul de la distance à la souris
        const dist = Math.sqrt(
            Math.pow(hex.x - this.mouseX, 2) +
            Math.pow(hex.y + yOffset - this.mouseY, 2)
        );

        // Effet de lueur autour de la souris
        if (dist < glowRadius) {
            const normalizedDist = dist / glowRadius;
            hex.glowAlpha = Math.max(0, (1 - normalizedDist * normalizedDist) * 0.8); // Effet de déclin plus doux
        } else {
            hex.glowAlpha = Math.max(0, hex.glowAlpha - 0.05); // Déclin progressif
        }

        if (hex.glowAlpha > 0) {
            ctx.fillStyle = glowColor.replace('0.4', hex.glowAlpha.toFixed(2));
            ctx.fill();
        } else {
            ctx.fillStyle = hexColor;
            ctx.fill();
        }
        
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width / window.devicePixelRatio, this.canvas.height / window.devicePixelRatio); // Clear with scaled context
        const time = Date.now();

        this.hexagons.forEach(hex => this.drawHexagon(hex, time));

        requestAnimationFrame(this.animate.bind(this));
    }

    startAnimation() {
        this.animate();
    }

    destroy() {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        this.container.removeEventListener('mousemove', this.onMouseMove);
        this.container.removeEventListener('mouseleave', this.onMouseLeave);
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Le container pour le fond est le <body>
    new HexagonBackground('body', {
        hexSize: 50,
        gap: 8,
        glowRadius: 200, // Rayon plus grand pour un effet plus doux
        glowColor: 'rgba(70, 130, 255, 0.4)',
        hexColor: 'rgba(255, 255, 255, 0.01)', // Très transparent
        borderColor: 'rgba(255, 255, 255, 0.05)', // Très transparent
        animationSpeed: 0.0003, // Plus lent pour un mouvement subtil
        pulseSpeed: 0.001 // Vitesse du puls
    });
});