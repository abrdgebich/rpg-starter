// RPG starter with bulldog-headed hero (3x4 walk sheet, transparent bg)

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#111827',
  physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
  scene: { preload, create, update }
};

let game, player, targetPoint = null, speed = 200, cursors;
let facing = 'down';  // 'down' | 'left' | 'right' | 'up'
let fw = 0, fh = 0;   // frameWidth / frameHeight

function preload() {
  // Load as a plain image first. We’ll calculate frame size from the image dims.
  this.load.image('bulldogSheet', 'assets/animated_dog_character_walk.png');
}

function create() {
  // draw a soft grid so it feels like a map
  const g = this.add.graphics();
  g.lineStyle(1, 0x233043, 1);
  const tile = 64;
  for (let x = 0; x < this.scale.width; x += tile) g.lineBetween(x, 0, x, this.scale.height);
  for (let y = 0; y < this.scale.height; y += tile) g.lineBetween(0, y, this.scale.width, y);

  // ---- turn the image into a spritesheet (3 cols x 4 rows) ----
  const tex = this.textures.get('bulldogSheet');
  const img = tex.getSourceImage();
  const cols = 3, rows = 4;

  fw = Math.round(img.width / cols);
  fh = Math.round(img.height / rows);

  // create a real spritesheet texture from the image
  this.textures.addSpriteSheet('bulldog', img, { frameWidth: fw, frameHeight: fh, endFrame: cols * rows - 1 });

  // make the sprite
  player = this.physics.add.sprite(this.scale.width / 2, this.scale.height / 2, 'bulldog');

  // lock origin near the feet so the head never “jumps” between frames
  player.setOrigin(0.5, 0.85);

  // scale down cleanly but keep physics box sensible
  const scale = 0.5;
  player.setScale(scale);
  player.body.setCollideWorldBounds(true);

  // tighten the hitbox to the body (not the big head)
  player.body.setSize(fw * 0.35, fh * 0.35, true);

  // helper to generate frames for a row (direction)
  const rowFrames = (row) => {
    const start = row * cols;       // 0..2, 3..5, 6..8, 9..11
    const end = start + (cols - 1); // 2, 5, 8, 11
    return this.anims.generateFrameNumbers('bulldog', { start, end });
  };

  // idle = middle frame of the row (column 1)
  const idleIndex = (row) => row * cols + 1;

  // four walk animations
  this.anims.create({ key: 'walk-down',  frames: rowFrames(0), frameRate: 10, repeat: -1 });
  this.anims.create({ key: 'walk-left',  frames: rowFrames(1), frameRate: 10, repeat: -1 });
  this.anims.create({ key: 'walk-right', frames: rowFrames(2), frameRate: 10, repeat: -1 });
  this.anims.create({ key: 'walk-up',    frames: rowFrames(3), frameRate: 10, repeat: -1 });

  // start idle facing down
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
  const facingRow = { down: 0, left: 1, right: 2, up: 3 }[facing] ?? 0;
  player.setFrame(facingRow * 3 + 1); // middle column = nice neutral idle
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
    stopAndIdle();
  }
}

game = new Phaser.Game(config);
