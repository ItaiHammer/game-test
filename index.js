const canvas = document.querySelector('#game');
const c = canvas.getContext('2d');
const scoreElement = document.querySelector('#score');
const startGameButton = document.querySelectorAll('.button');
const startGamePopup = document.querySelector('#start-game-popup');
const endGamePopup = document.querySelector('#end-game-popup');
const endGameScore = document.querySelector('#end-game-score');

canvas.width = innerWidth;
canvas.height = innerHeight + 100;
document.querySelector('#start-game-score').innerHTML =
  localStorage.getItem('bestScore') == null ||
  localStorage.getItem('bestScore') === ''
    ? 0
    : localStorage.getItem('bestScore');

function Player(x, y, radius, color) {
  this.x = x;
  this.y = y;
  this.radius = radius;
  this.color = color;

  this.draw = () => {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
  };
}

function Projectile(x, y, radius, color, velocity) {
  this.x = x;
  this.y = y;
  this.radius = radius;
  this.color = color;
  this.velocity = velocity;

  this.draw = () => {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
  };

  this.update = () => {
    this.x += this.velocity.x;
    this.y += this.velocity.y;

    this.draw();
  };
}

function Enemy(x, y, radius, color, velocity) {
  this.x = x;
  this.y = y;
  this.radius = radius;
  this.color = color;
  this.velocity = velocity;
  this.newRad = radius;

  this.draw = () => {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
  };

  this.update = () => {
    this.x += this.velocity.x;
    this.y += this.velocity.y;

    this.draw();
  };
}

function Particle(x, y, radius, color, velocity) {
  this.x = x;
  this.y = y;
  this.radius = radius;
  this.color = color;
  this.velocity = velocity;
  this.alpha = 1;
  this.friction = 0.99;

  this.draw = () => {
    c.save();
    c.globalAlpha = this.alpha;
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
    c.restore();
  };

  this.update = () => {
    this.velocity.x *= this.friction;
    this.velocity.y *= this.friction;
    this.x += this.velocity.x;
    this.y += this.velocity.y;

    this.alpha -= 0.003;

    this.draw();
  };
}

const player = new Player(
  canvas.width / 2,
  canvas.height / 2,
  30,
  'white',
  null
);

let projectiles = [];
let enemies = [];
let particles = [];
let score = 0;
let enemySpeed = 1000;
let isGamePaused = false;

function init() {
  projectiles = [];
  enemies = [];
  particles = [];
  score = 0;
  scoreElement.innerHTML = 0;
  enemySpeed = 1000;
  let isGamePaused = false;
}

let enemiesInterval;
let enemySpeedInterval;

function spawnEnemies() {
  enemySpeedInterval = setInterval(() => {
    const type = Math.round(Math.random());
    const x = type === 0 ? Math.random() * canvas.width : 0;
    const y = type === 1 ? Math.random() * canvas.height : 0;
    const radius = Math.random() * (40000 / enemySpeed - 8) + 8;
    const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
    const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
    const velocity = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };

    enemies.push(new Enemy(x, y, radius, color, velocity));
  }, 1000);
  enemySpeedInterval = setInterval(() => enemySpeed--, 4000);
}

let animationId;

function animate() {
  c.fillStyle = 'rgba(0,0,0,0.1)';
  c.fillRect(0, 0, canvas.width, canvas.height);
  animationId = requestAnimationFrame(animate);
  player.draw();

  projectiles.forEach((projectile, index) => {
    projectile.update();
    //clearing projectiles off the screen
    if (
      projectile.x + projectile.radius <= 0 ||
      projectile.x - projectile.radius >= canvas.width ||
      projectile.y + projectile.radius <= 0 ||
      projectile.y - projectile.radius >= canvas.height
    ) {
      setTimeout(() => {
        projectiles.splice(index, 1);
      }, 0);
    }
  });

  particles.forEach((particle, index) => {
    if (particle.alpha <= 0) {
      setTimeout(() => {
        particles.splice(index, 1);
      }, 0);
    } else {
      particle.update();
    }
  });

  enemies.forEach((enemy, enemyIndex) => {
    enemy.update();
    //checking if the enemy is touching the player
    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

    //game ending
    if (dist - enemy.radius <= player.radius) {
      cancelAnimationFrame(animationId);

      endGamePopup.style.display = 'flex';
      endGameScore.innerHTML = score;
      if (
        localStorage.getItem('bestScore') == null ||
        localStorage.getItem('bestScore') === ''
      ) {
        localStorage.setItem('bestScore', score);
      } else if (score > parseInt(localStorage.getItem('bestScore'))) {
        localStorage.setItem('bestScore', score);
      }
      document.querySelector('#end-game-best-score').innerHTML =
        localStorage.getItem('bestScore');
    }

    if (enemy.radius >= enemy.newRad) {
      enemy.radius--;
    }

    //checking if projectiles are touching enemies
    projectiles.forEach((projectile, projectileIndex) => {
      const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

      if (dist - projectile.radius - enemy.radius < 1) {
        for (let i = 0; i < enemy.radius * 2; i++) {
          particles.push(
            new Particle(enemy.x, enemy.y, Math.random() * 3 + 1, enemy.color, {
              x: (Math.random() - 0.5) * (Math.random() * 6),
              y: (Math.random() - 0.5) * (Math.random() * 6),
            })
          );
        }

        if (enemy.radius - 30 <= 0) {
          score += 250;
          scoreElement.innerHTML = score;
          setTimeout(() => {
            enemies.splice(enemyIndex, 1);
            projectiles.splice(projectileIndex, 1);
          }, 0);
        } else {
          score += 100;
          scoreElement.innerHTML = score;
          if (enemy.radius - 20 < 10) {
            enemy.newRad -= 10;
          } else {
            enemy.newRad -= 20;
          }
          setTimeout(() => {
            projectiles.splice(projectileIndex, 1);
          }, 0);
        }
      }
    });
  });
}

window.addEventListener('click', (e) => {
  const angle = Math.atan2(
    e.clientY - canvas.height / 2,
    e.clientX - canvas.width / 2
  );
  const velocityFac = 4;
  const velocity = {
    x: Math.cos(angle) * velocityFac,
    y: Math.sin(angle) * velocityFac,
  };
  const projectile = new Projectile(
    canvas.width / 2,
    canvas.height / 2,
    5,
    'white',
    { x: velocity.x, y: velocity.y }
  );

  projectiles.push(projectile);
});

startGameButton.forEach((button) => {
  button.addEventListener('click', () => {
    init();
    animate();
    spawnEnemies();
    startGamePopup.style.display = 'none';
    endGamePopup.style.display = 'none';
  });
});

// function pause() {
//   console.log('pause');
//   isGamePaused = true;
//   c.fillStyle = 'white';
//   c.fillRect(50, 50, 13.5, 50);
//   c.fillStyle = 'white';
//   c.fillRect(75, 50, 13.5, 50);
//   cancelAnimationFrame(animationId);
//   clearInterval(enemiesInterval);
//   clearInterval(enemySpeedInterval);
// }

// function resume() {
//   console.log('resume');
//   isGamePaused = false;
//   canvas.style.fiter = 'contrast(1000%)';
//   animate();
//   spawnEnemies();
// }

// window.addEventListener('keydown', (e) => {
//   let f = !isGamePaused ? pause : resume;
//   if (e.key === 'Escape') f();
// });
