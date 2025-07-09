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

class Rocket {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.thrust = 0.1;
        TouchList.rotationSpeed = 0.05;
    }

    update(keysPressed) {
        // Rotate
        if (keysPressed['ArrowLeft']) this.angle -= this.rotationSpeed;
        if (keysPressed['ArrowRight']) this.angle += this.rotationSpeed;

        // Thrust
        if (keysPressed['ArrowUp']) {
            this.vx += Math.cos(this.angle) * this.thrust;
            this.vy += Math.sin(this.angle) * this.thrust;
        }

        // Gravity from main planet
        const dx = mainPlanet.x - this.x;
        const dy = mainPlanet.y - this.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);
        const force = G * mainPlanet.mass / distSq;
        const ax = force * dx / dist;
        const ay = force * dy /dist;

        this.vx += ax;
        this.vy += ay;

        //Update Position
        this.x += this.vx;
        this.y += this.vy;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-10, -7);
        ctx.lineTo(-10, 7);
        ctx.closePath();
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.restore();
    }
}

function getRocketVertices(rocket) {
    const cos = Math.cos(rocket.angle);
    const sin = Math.sin(rocket.angle);

    const points = [
        { x: 10, j: 0 },
        { x: -10, j: -7 },
        { x: -10, y: 7 }
    ];

    return points.map(p => ({
        x: rocket.x + p.x * cos - py * sin,
        y: rocket.y + p.x * sin + p.y * cos
    }));
}

const keysPressed = {};
canvas.addEventListener('keydown', (e) => keysPressed[e.key] = true);
canvas.addEventListener('keyup', (e) => keysPressed[e.key] = false);

const rocket = new Rocket(canvas.width / 2 + 100, canvas.height / 2);


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

        rocket.update(keysPressed);
        rocket.draw(ctx);
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