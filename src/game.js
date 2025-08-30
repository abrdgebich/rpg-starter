// My tiny RPG starter with a bulldog-headed hero.
// Tap anywhere to walk there. Arrow keys work if you have a keyboard.

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#111827',
  physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
  scene: { preload, create, update }
};

let game, player, targetPoint = null, speed = 200, cursors;
let facing = 'down'; // 'down' | 'left' | 'right' | 'up'

function preload() {
  // 3 columns × 4 rows sprite sheet (12 frames total)
  // Each row is a direction: 0=down, 1=left, 2=right, 3=up
  // Each row has 3 frames for walking: col 0..2
  //
  // NOTE: These frame sizes assume each cell is 256×256.
  // If your sheet uses a different cell size, change these two numbers.
  this.load.spritesheet('bulldog', 'assets/animated_dog_character_walk.png', {
    frameWidth: 256,
    frameHeight: 256
  });
}

function create() {
  // soft grid background so it feels like a map
  const g = this.add.graphics();
  g.lineStyle(1, 0x233043, 1);
  const tile = 64;
  for (let x = 0; x < this.scale.width; x += tile) g.lineBetween(x, 0, x, this.scale.height);
  for (let y = 0; y < this.scale.height; y += tile) g.lineBetween(0, y, this.scale.width, y);

  // bulldog player sprite
  player = this.physics.add.sprite(this.scale.width / 2, this.scale.height / 2, 'bulldog');
  player.setScale(0.5); // shrink a bit so it fits nicely on phone screens
  player.body.setCollideWorldBounds(true);

  // helper to generate frames for a row (direction)
  const rowFrames = (row) => {
    const start = row * 3;        // 3 columns per row
    const end = start + 2;        // 0..2
    return this.anims.generateFrameNumbers('bulldog', { start, end });
  };

  // idle frames are the first frame of each row
  const idleIndex = (row) => row * 3;

  // four walk animations
  this.anims.create({ key: 'walk-down',  frames: rowFrames(0), frameRate: 10, repeat: -1 });
  this.anims.create({ key: 'walk-left',  frames: rowFrames(1), frameRate: 10, repeat: -1 });
  this.anims.create({ key: 'walk-right', frames: rowFrames(2), frameRate: 10, repeat: -1 });
  this.anims.create({ key: 'walk-up',    frames: rowFrames(3), frameRate: 10, repeat: -1 });

  // set an initial idle frame (down)
  player.setFrame(idleIndex(0));

  // tap/click to move
  this.input.on('pointerdown', p => {
    targetPoint = new Phaser.Math.Vector2(p.x, p.y);
  });

  // keyboard controls (optional)
  cursors = this.input.keyboard.createCursorKeys();

  // keep canvas sized to the phone
  window.addEventListener('resize', () => {
    this.scale.resize(window.innerWidth, window.innerHeight);
  });
}

function setAnimByVelocity(vx, vy) {
  // choose facing and animation by velocity
  if (Math.abs(vx) > Math.abs(vy)) {
    if (vx > 0) { facing = 'right'; player.anims.play('walk-right', true); }
    else if (vx < 0) { facing = 'left'; player.anims.play('walk-left', true); }
  } else if (Math.abs(vy) > 0) {
    if (vy > 0) { facing = 'down'; player.anims.play('walk-down', true); }
    else if (vy < 0) { facing = 'up'; player.anims.play('walk-up', true); }
  }
}

function stopAndIdle() {
  player.anims.stop();
  // set idle frame for current facing direction
  const facingRow = { down: 0, left: 1, right: 2, up: 3 }[facing] ?? 0;
  player.setFrame(facingRow * 3); // first column of that row
}

function update() {
  const body = player.body;
  if (!body) return;

  // stop old movement each frame
  body.setVelocity(0, 0);

  // keyboard movement overrides tap-to-move
  if (cursors?.left?.isDown)  { body.setVelocityX(-speed); setAnimByVelocity(-speed, 0); targetPoint = null; }
  else if (cursors?.right?.isDown) { body.setVelocityX(speed); setAnimByVelocity(speed, 0); targetPoint = null; }
  else if (cursors?.up?.isDown)    { body.setVelocityY(-speed); setAnimByVelocity(0, -speed); targetPoint = null; }
  else if (cursors?.down?.isDown)  { body.setVelocityY(speed); setAnimByVelocity(0, speed); targetPoint = null; }
  else if (targetPoint) {
    // tap-to-point movement
    const angle = Phaser.Math.Angle.Between(player.x, player.y, targetPoint.x, targetPoint.y);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    body.setVelocity(vx, vy);
    setAnimByVelocity(vx, vy);

    const dist = Phaser.Math.Distance.Between(player.x, player.y, targetPoint.x, targetPoint.y);
    if (dist < 8) { targetPoint = null; stopAndIdle(); }
  } else {
    // no input → idle
    stopAndIdle();
  }
}

game = new Phaser.Game(config);
