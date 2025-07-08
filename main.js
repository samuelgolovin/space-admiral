const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Planet {
    constructor(x, y, radius, color, vx = 0, vy = 0) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.vx = vx;
        this.vy = vy;
        this.mass = radius * 100
    }
    update(ax = 0, ay = 0) {
        this.vx += ax;
        this.vy += ay;
        this.x += this.vx;
        this.y += this.vy;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

const G = 0.1
const mainPlanet = new Planet(canvas.width / 2, canvas.height / 2, 20, 'white');
const planets = [mainPlanet];

let dragStart = null;
let currentMouse = null;
const velocityScale = 0.01;

canvas.addEventListener('mousedown', (e) => {
    dragStart = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('mousemove', (e) => {
    if (dragStart) {
        currentMouse = { x: e.clientX, y: e.clientY };
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (!dragStart) return;

    const dragEnd = { x: e.clientX, y: e.clientY };
    const dx = dragEnd.x - dragStart.x;
    const dy = dragEnd.y - dragStart.y;
    const vx = -dx * velocityScale;
    const vy = -dy * velocityScale;

    const newPlanet = new Planet(dragStart.x, dragStart.y, 10, 'green', vx, vy);
    planets.push(newPlanet);

    dragStart = null;
    currentMouse = null;
});

function simulateOrbit(startX, startY, vx, vy, steps = 1000) {
    const path = [];
    let x = startX;
    let y = startY;
    let simVx = vx;
    let simVy = vy;

    for (let i = 0; i < steps; i++) {
        const dx = mainPlanet.x - x;
        const dy = mainPlanet.y - y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);
        const force = G * mainPlanet.mass / distSq;
        const ax = force * dx / dist;
        const ay = force * dy / dist;

        simVx += ax;
        simVy += ay;
        x += simVx;
        y += simVy;

        path.push({ x, y });
    }

    return path;
}

function constantOrbitSimulate(x, y, vx, vy, steps = 100) {
    const path = [];
    let simVx = vx;
    let simVy = vy;

    for (let i = 0; i < steps; i++) {
        const dx = mainPlanet.x - x;
        const dy = mainPlanet.y - y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);
        const force = G * mainPlanet.mass / distSq;
        const ax = force * dx / dist;
        const ay = force * dy / dist;

        simVx += ax;
        simVy += ay;
        x += simVx;
        y += simVy;

        path.push({ x, y });
    }
    return path;
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    planets.forEach(planet => {
        if (planet !== mainPlanet) {
            const planetPath = constantOrbitSimulate(planet.x, planet.y, planet.vx, planet.vy);
            ctx.beginPath();
            ctx.moveTo(planetPath[0].x, planetPath[0].y);
            for (let i = 1; i < planetPath.length; i++) {
                ctx.lineTo(planetPath[i].x, planetPath[i].y);
            }
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
            // ctx.setLineDash([5, 5]);
            ctx.stroke();
            // ctx.setLineDash([]);

            const dx = mainPlanet.x - planet.x;
            const dy = mainPlanet.y - planet.y;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq);
            const force = G * mainPlanet.mass / distSq;
            const ax = force * dx / dist;
            const ay = force *  dy / dist;
            planet.update(ax, ay);
        }
        planet.draw(ctx);
    });

    if (dragStart && currentMouse) {
        const dx = currentMouse.x - dragStart.x;
        const dy = currentMouse.y - dragStart.y;
        const vx = -dx * velocityScale;
        const vy = -dy * velocityScale;

        const path = simulateOrbit(dragStart.x, dragStart.y, vx, vy);
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    requestAnimationFrame(animate);
}

animate();