// Tiny RPG starter, tap anywhere to walk there, or use arrow keys if you have a keyboard.

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#111827',
  physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
  scene: { preload, create, update }
};

let game, player, targetPoint = null, speed = 200, cursors;

function preload() {}

function create() {
  // draw a soft grid so it feels like a map
  const g = this.add.graphics();
  g.lineStyle(1, 0x233043, 1);
  const tile = 64;
  for (let x = 0; x < this.scale.width; x += tile) g.lineBetween(x, 0, x, this.scale.height);
  for (let y = 0; y < this.scale.height; y += tile) g.lineBetween(0, y, this.scale.width, y);

  // player as a simple square for now
  player = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, 40, 40, 0x4cc9f0);
  this.physics.add.existing(player);
  player.body.setCollideWorldBounds(true);

  // on screen tap to move
  this.input.on('pointerdown', p => {
    targetPoint = new Phaser.Math.Vector2(p.x, p.y);
  });

  // arrow keys work if you connect a keyboard
  cursors = this.input.keyboard.createCursorKeys();

  // keep canvas sized to the phone
  window.addEventListener('resize', () => {
    this.scale.resize(window.innerWidth, window.innerHeight);
  });
}

function update() {
  const body = player.body;
  if (!body) return;

  // stop old movement
  body.setVelocity(0, 0);

  // keyboard movement
  if (cursors?.left?.isDown)  body.setVelocityX(-speed);
  if (cursors?.right?.isDown) body.setVelocityX(speed);
  if (cursors?.up?.isDown)    body.setVelocityY(-speed);
  if (cursors?.down?.isDown)  body.setVelocityY(speed);

  // touch to point movement
  if (targetPoint) {
    const angle = Phaser.Math.Angle.Between(player.x, player.y, targetPoint.x, targetPoint.y);
    body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    const dist = Phaser.Math.Distance.Between(player.x, player.y, targetPoint.x, targetPoint.y);
    if (dist < 8) targetPoint = null;
  }
}

game = new Phaser.Game(config);
