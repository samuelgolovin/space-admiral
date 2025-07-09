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

    let y = 10;
    ctx.fillText('Key States:', 10, y);
    y += 20;

    for (const key in keys) {
        ctx.fillText(`${key}: ${keys[key]}`, 10, y);
        y += 20;
    }

    ctx.restore();
}





const rocket = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    thrust: 0.1,
    rotationSpeed: 0.05,
    width: 20,
    height: 40
};

const keys = {
    ArrowUp: false,
    ArrowLeft: false,
    ArrowRight: false
};

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

function update() {
    //Rotation
    if (keys.ArrowLeft) rocket.angle -= rocket.rotationSpeed;
    if (keys.ArrowRight) rocket.angle += rocket.rotationSpeed;

    //Thrust
    if (keys.ArrowUp) {
        rocket.vx += Math.cos(rocket.angle - Math.PI / 2) * rocket.thrust;
        rocket.vy += Math.sin(rocket.angle - Math.PI / 2) * rocket.thrust;
    }

    //Gravity
    rocket.vy += 0.05;

    //Update Position
    rocket.x += rocket.vx;
    rocket.y += rocket.vy;

    //Screen X Wrap
    if (rocket.x > canvas.width) rocket.x = 0;
    if (rocket.x < 0) rocket.x = canvas.width;
    
    //Screen Y Bound
    if (rocket.y < 0) {
        rocket.y = 0;
        rocket.vy = 0;
    };
    if (rocket.y > canvas.height - rocket.height / 2) {
        rocket.y = canvas.height - rocket.height / 2
        rocket.vy = 0
        // Friction on the ground
        rocket.vx *= 0.98;
        if (Math.abs(rocket.vx) < 0.2) rocket.vx = 0
    };
}

function drawRocket() {
    ctx.save();
    ctx.translate(rocket.x, rocket.y);
    ctx.rotate(rocket.angle);
    ctx.fillStyle = 'white';
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
    drawRocket();
    drawDebugOverlay();
    requestAnimationFrame(loop);
}

loop();