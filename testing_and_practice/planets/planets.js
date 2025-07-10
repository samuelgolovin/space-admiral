const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function drawDebugOverlay() {
    ctx.save();
    ctx.font = '16px monospace';
    ctx.fillStyle = 'lime';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    let x = 10;
    let y = 10;
    ctx.fillText('Key States:', x, y);
    y += 20;

    for (const key in keys) {
        ctx.fillText(`${key}: ${keys[key]}`, x, y);
        y += 20;
    }

    ctx.fillText(`Angle: ${(rocket.angle * 180 / Math.PI).toFixed(1)}°`, x, y);
    y += 20;

    ctx.fillText(`Velocity: (${rocket.vx.toFixed(2)}, ${rocket.vy.toFixed(2)})`, x, y);
    y += 20;

    // Orientation triangle
    const centerX = x + 50;
    const centerY = y + 40;
    const size = 20;

    ctx.translate(centerX, centerY);
    ctx.rotate(rocket.angle);

    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(-size / 2, size / 2);
    ctx.lineTo(size / 2, size / 2);
    ctx.closePath();
    ctx.fillStyle = 'orange';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.stroke();

    ctx.restore();

    // Movement direction arrow
    const speed = Math.sqrt(rocket.vx ** 2 + rocket.vy ** 2);
    if (speed > 0.1) {
        const dirAngle = Math.atan2(rocket.vy, rocket.vx) - Math.PI / 2;
        const arrowX = 100;
        const arrowY = y + 80;

        ctx.save();
        ctx.translate(arrowX, arrowY);
        ctx.rotate(dirAngle);

        ctx.beginPath();
        ctx.moveTo(0, 10);   // tip (was -10)
        ctx.lineTo(-5, -5);  // left
        ctx.lineTo(5, -5);   // right
        ctx.closePath();

        ctx.fillStyle = 'cyan';
        ctx.fill();
        ctx.restore();
    }



    // Off-screen marker
    if (
        rocket.x < 0 || rocket.x > canvas.width ||
        rocket.y < 0 || rocket.y > canvas.height
    ) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const dx = rocket.x - centerX;
        const dy = rocket.y - centerY;
        const angle = Math.atan2(dy, dx) - Math.PI / 2;
    
        const edgeDist = Math.min(canvas.width, canvas.height) / 2 - 20;
        const markerX = centerX + Math.cos(angle + Math.PI / 2) * edgeDist;
        const markerY = centerY + Math.sin(angle + Math.PI / 2) * edgeDist;
    
        ctx.save();
        ctx.translate(markerX, markerY);
        ctx.rotate(angle);
    
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(-6, 6);
        ctx.lineTo(6, 6);
        ctx.closePath();
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.restore();
    }    


    if (rocket.landed || rocket.crashed) {
        const planet = planets.find(p => {
            const dx = rocket.x - p.x;
            const dy = rocket.y - p.y;
            return Math.sqrt(dx * dx + dy * dy) <= p.radius + 5;
        });
        if (planet) {
            const dx = rocket.x - planet.x;
            const dy = rocket.y - planet.y;
            const surfaceAngle = Math.atan2(dy, dx);
            const angleDiff = ((rocket.angle - surfaceAngle + Math.PI) % (2 * Math.PI)) - Math.PI;
            ctx.fillText(`Angle to Surface: ${(angleDiff * 180 / Math.PI).toFixed(1)}°`, x, y);
            y += 20;
        }
    }
    
}



const planets = [
    { x: 300, y: 400, radius: 60, gravity: 200 },
    { x: 800, y: 200, radius: 80, gravity: 150 },
    { x: 1200, y: 600, radius: 100, gravity: 100 }
];

function drawPlanets() {
    for (const planet of planets) {
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'blue';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.stroke();
    }
}

const rocket = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    thrust: 0.02,
    rotationSpeed: 0.02,
    width: 20,
    height: 40,
    crashed: false,
    landed: false
};

const keys = {
    ArrowUp: false,
    ArrowLeft: false,
    ArrowRight: false
};

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

function update() {
    if (rocket.landed) {
        if (keys.ArrowUp) {
            rocket.landed = false;
            rocket.vx += Math.cos(rocket.angle - Math.PI / 2) * rocket.thrust;
            rocket.vy += Math.sin(rocket.angle - Math.PI / 2) * rocket.thrust;
        }
        return; // Skip physics while landed
    }

    if (keys.ArrowLeft) rocket.angle -= rocket.rotationSpeed;
    if (keys.ArrowRight) rocket.angle += rocket.rotationSpeed;

    if (keys.ArrowUp) {
        rocket.vx += Math.cos(rocket.angle - Math.PI / 2) * rocket.thrust;
        rocket.vy += Math.sin(rocket.angle - Math.PI / 2) * rocket.thrust;
    }

    for (const planet of planets) {
        const dx = planet.x - rocket.x;
        const dy = planet.y - rocket.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);
        const force = planet.gravity / distSq;

        rocket.vx += force * dx / dist;
        rocket.vy += force * dy / dist;
    }

    rocket.x += rocket.vx;
    rocket.y += rocket.vy;

    if (!rocket.crashed) {
        checkLanding();
    }
}


function getRocketVertices() {
    const cos = Math.cos(rocket.angle);
    const sin = Math.sin(rocket.angle);
    const cx = rocket.x;
    const cy = rocket.y;
    const halfW = rocket.width / 2;
    const halfH = rocket.height / 2;

    const points = [
        { x: 0, y: -halfH },
        { x: -halfW, y: halfH },
        { x: halfW, y: halfH },
    ];

    return points.map(p => ({
        x: cx + p.x * cos - p.y * sin,
        y: cy + p.x * sin + p.y * cos
    }));
}

function checkLanding() {
    const [tip, left, right] = getRocketVertices();

    for (const planet of planets) {
        const points = [tip, left, right];
        for (const point of points) {
            const dx = point.x - planet.x;
            const dy = point.y - planet.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= planet.radius) {
                // Surface normal angle (from planet center to rocket)
                const surfaceAngle = Math.atan2(dy, dx);

                // Rocket's "up" direction is angle - PI/2
                const rocketUp = rocket.angle - Math.PI / 2;

                // Calculate smallest angle difference
                const angleDiff = Math.abs(((rocketUp - surfaceAngle + Math.PI) % (2 * Math.PI)) - Math.PI);

                // Easier landing thresholds
                const verticalSpeedSafe = Math.abs(rocket.vy) < 2.5;
                const horizontalSpeedSafe = Math.abs(rocket.vx) < 2.5;
                const angleSafe = angleDiff < 0.6;

                if (verticalSpeedSafe && horizontalSpeedSafe && angleSafe) {
                    rocket.vx = 0;
                    rocket.vy = 0;
                    rocket.landed = true;
                    rocket.angle = surfaceAngle + Math.PI / 2; // Align rocket "up" with surface normal
                    const offset = planet.radius + rocket.height / 2;
                    rocket.x = planet.x + Math.cos(surfaceAngle) * offset;
                    rocket.y = planet.y + Math.sin(surfaceAngle) * offset;
                } else {
                    // Crash recovery: reset on surface, allow takeoff
                    const offset = planet.radius + rocket.height / 2;
                    rocket.x = planet.x + Math.cos(surfaceAngle) * offset;
                    rocket.y = planet.y + Math.sin(surfaceAngle) * offset;
                    rocket.vx = 0;
                    rocket.vy = 0;
                    rocket.landed = true;
                    rocket.crashed = false;
                    rocket.angle = surfaceAngle + Math.PI / 2;

                }
                return;
            }
        }
    }
}



function constantOrbitSimulate(x, y, vx, vy, planets, steps = 100, G = 1) {
    const path = [];
    let simVx = vx;
    let simVy = vy;

    for (let i = 0; i < steps; i++) {
        let ax = 0;
        let ay = 0;

        for (const planet of planets) {
            const dx = planet.x - x;
            const dy = planet.y - y;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq);

            // Stop if we hit the surface of any planet
            if (dist <= planet.radius) {
                return path;
            }

            const force = (G * planet.gravity) / distSq;
            ax += force * dx / dist;
            ay += force * dy / dist;
        }

        simVx += ax;
        simVy += ay;
        x += simVx;
        y += simVy;

        path.push({ x, y });
    }

    return path;
}




function drawOrbitPath() {
    const path = constantOrbitSimulate(
        rocket.x,
        rocket.y,
        rocket.vx,
        rocket.vy,
        planets,
        10000 // steps
    );

    if (!path || path.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
}


function drawRocket() {
    ctx.save();
    ctx.translate(rocket.x, rocket.y);
    ctx.rotate(rocket.angle);
    ctx.fillStyle = rocket.crashed ? 'red' : rocket.landed ? 'lime' : 'white';
    ctx.beginPath();
    ctx.moveTo(0, -rocket.height / 2);
    ctx.lineTo(-rocket.width / 2, rocket.height / 2);
    ctx.lineTo(rocket.width / 2, rocket.height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
    drawOrbitPath();
    drawPlanets();
    drawRocket();
    drawDebugOverlay();
    requestAnimationFrame(loop);
}

loop();
