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
let facing = 'down';   // 'down' | 'left' | 'right' | 'up'

// ---- if you ever switch to a known-size sheet (e.g. 768x1024), you can set these to 256 ----
const KNOWN_FRAME_WIDTH  = null; // e.g. 256
const KNOWN_FRAME_HEIGHT = null; // e.g. 256

function preload() {
  // Load as an image first so we can compute the exact frame size safely.
  this.load.image('bulldogSheet', 'assets/animated_dog_character_walk.png');
}

function create() {
  // soft grid background
  const g = this.add.graphics();
  g.lineStyle(1, 0x233043, 1);
  const tile = 64;
  for (let x = 0; x < this.scale.width; x += tile) g.lineBetween(x, 0, x, this.scale.height);
  for (let y = 0; y < this.scale.height; y += tile) g.lineBetween(0, y, this.scale.width, y);

  // ---- Build a proper spritesheet from the image (3 cols x 4 rows) ----
  const cols = 3, rows = 4;

  const tex = this.textures.get('bulldogSheet');
  const img = tex.getSourceImage();
  let fw, fh;

  if (KNOWN_FRAME_WIDTH && KNOWN_FRAME_HEIGHT) {
    fw = KNOWN_FRAME_WIDTH;
    fh = KNOWN_FRAME_HEIGHT;
  } else {
    // Floor (not round) so we never spill into the next cell.
    fw = Math.floor(img.width  / cols);
    fh = Math.floor(img.height / rows);
  }

  // Rebuild spritesheet texture from the image using those exact cell sizes.
  // Any remainder pixels on the right/bottom are ignored (safe).
  if (this.textures.exists('bulldog')) this.textures.remove('bulldog');
  this.textures.addSpriteSheet('bulldog', img, {
    frameWidth: fw,
    frameHeight: fh,
    endFrame: cols * rows - 1
  });

  // make the sprite and lock origin to the feet so the head never pops
  player = this.physics.add.sprite(this.scale.width / 2, this.scale.height / 2, 'bulldog', 1);
  player.setOrigin(0.5, 0.9);   // a touch lower = feet anchor
  player.setScale(0.5);
  player.body.setCollideWorldBounds(true);

  // tighten hitbox to body (not head); re-center it
  player.body.setSize(fw * 0.35, fh * 0.35);
  player.body.setOffset((fw * 0.5) - (fw * 0.35) / 2, (fh * 0.9) - (fh * 0.35)); // keep near lower body

  // helper to generate frames for a row (direction)
  const rowFrames = (row) => {
    const start = row * cols;      // row 0: 0..2, row1: 3..5, row2: 6..8, row3: 9..11
    const end = start + (cols - 1);
    return this.anims.generateFrameNumbers('bulldog', { start, end });
  };

  // idle = middle frame of the row (column 1)
  const idleIndex = (row) => row * cols + 1;

  // walk cycles
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

  // keyboard controls
  cursors = this.input.keyboard.createCursorKeys();

  // keep canvas sized to the phone
  window.addEventListener('resize', () => {
    this.scale.resize(window.innerWidth, window.innerHeight);
  });
}

function setAnimByVelocity(vx, vy) {
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
  player.setFrame(facingRow * 3 + 1); // middle column as neutral idle
}

function update() {
  const body = player.body;
  if (!body) return;

  body.setVelocity(0, 0);

  // keyboard movement overrides tap-to-move
  if (cursors?.left?.isDown)      { body.setVelocityX(-speed); setAnimByVelocity(-speed, 0); targetPoint = null; }
  else if (cursors?.right?.isDown){ body.setVelocityX(speed);  setAnimByVelocity(speed, 0);  targetPoint = null; }
  else if (cursors?.up?.isDown)   { body.setVelocityY(-speed); setAnimByVelocity(0, -speed); targetPoint = null; }
  else if (cursors?.down?.isDown) { body.setVelocityY(speed);  setAnimByVelocity(0,  speed); targetPoint = null; }
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
