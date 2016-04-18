/**
 * @author mrdoob / http://mrdoob.com/
 */
THREE.PointerLockControls = function ( camera ) {

  var scope = this;

  camera.rotation.set( 0, 0, 0 );

  var pitchObject = new THREE.Object3D();
  pitchObject.add( camera );

  var yawObject = new THREE.Object3D();
  yawObject.position.x = 100;
  yawObject.position.z = 100;
  yawObject.position.y = 160;
  yawObject.add( pitchObject );

  var pressForward = false;
  var pressBackward = false;
  var pressRight = false;
  var pressLeft = false;

  var moveForward = false;
  var moveLeft = false;
  var moveBackward = false;
  var moveRight = false;

  var canMoveForward = true;
  var canMoveLeft = true;
  var canMoveBackward = true;
  var canMoveRight = true;

  var isOnObject = false;
  var canJump = false;

  var prevTime = performance.now();

  var velocity = new THREE.Vector3();

  var PI_2 = Math.PI / 2;

  var rays = [
    new THREE.Vector3(0, 1, 0.55),      //backward
    new THREE.Vector3(0.27, 1, 0.27),   //backward right
    new THREE.Vector3(0.55, 1, 0),      //right
    new THREE.Vector3(0.27, 1, -0.27),  //forward right
    new THREE.Vector3(0, 1, -0.55),     //forward
    new THREE.Vector3(-0.27, 1, -0.27), //forward left
    new THREE.Vector3(-0.55, 1, 0),     //left
    new THREE.Vector3(-0.27, 1, 0.27),  //backward_left
    new THREE.Vector3(0, -1, 0),        //bottom
    new THREE.Vector3(0, -1, 0.75),     //bottom backward
    new THREE.Vector3(0.75, -1, 0),     //bottom right
    new THREE.Vector3(0, -1, -0.75),    //bottom forward
    new THREE.Vector3(-0.75, -1, 0)     //bottom left
  ];
  var caster = new THREE.Raycaster();

  var onMouseMove = function ( event ) {
    var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    yawObject.rotation.y -= movementX * 0.002;
    pitchObject.rotation.x -= movementY * 0.002;
    pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, pitchObject.rotation.x));
  };

  var onKeyDown = function (event) {
    switch (event.keyCode) {
      case 38: // up
      case 87: // w
        pressForward = true;
        break;
      case 37: // left
      case 65: // a
        pressLeft = true;
        break;
      case 40: // down
      case 83: // s
        pressBackward = true;
        break;
      case 39: // right
      case 68: // d
        pressRight = true;
        break;
      case 32: // space
        if (canJump === true) velocity.y += 350;
        canJump = false;
        break;
    }
  };

  var onKeyUp = function (event) {
    switch (event.keyCode) {
      case 38: // up
      case 87: // w
        pressForward = false;
        break;
      case 37: // left
      case 65: // a
        pressLeft = false;
        break;
      case 40: // down
      case 83: // s
        pressBackward = false;
        break;
      case 39: // right
      case 68: // d
        pressRight = false;
        break;
    }
  };

  document.addEventListener('mousemove', onMouseMove, false);
  document.addEventListener('keydown', onKeyDown, false);
  document.addEventListener('keyup', onKeyUp, false);

  this.enabled = false;

  this.getObject = function () {
    return yawObject;
  };

  this.isOnObject = function (boolean) {
    isOnObject = boolean;
    canJump = boolean;
  };

  this.canMove = function () {
    this.checkObstacles();
    moveForward = pressForward && canMoveForward;
    moveLeft = pressLeft && canMoveLeft;
    moveRight = pressRight && canMoveRight;
    moveBackward = pressBackward && canMoveBackward;
  };

  var sorting = function (a, b) { return a.distance - b.distance };

  this.checkObstacles = function () {
    var collisions = [];
    var i;
    var octreeResults;
    var vec;
    var ray;
    var move;
    var distance = 78;
    var bottomDistance = 15;
    var rampDistance = 14;

    canMoveBackward = canMoveRight = canMoveForward = canMoveLeft = true;
    isOnObject = false;

    vec = new THREE.Vector3();
    vec.x = yawObject.position.x;
    vec.y = yawObject.position.y - 145;
    vec.z = yawObject.position.z;

    for (i = 0; i < rays.length; i += 1) {
      ray = rays[i];
      caster.set(vec, this.getDirection(ray));

      octreeResults = octree.search(caster.ray.origin, caster.ray.far, true, caster.ray.direction);
      collisions = caster.intersectOctreeObjects(octreeResults);
      collisions.sort(sorting);

      if (collisions.length > 0 && collisions[0].distance <= distance) {
        switch (i) {
          case 0: // backward
            canMoveBackward = false;
            break;
          case 1: // backward right
            canMoveBackward = canMoveRight = false;
            break;
          case 2: // right
            canMoveRight = false;
            break;
          case 3: // forward right
            canMoveForward = canMoveRight = false;
            break;
          case 4: // forward
            canMoveForward = false;
            break;
          case 5: // forward left
            canMoveForward = canMoveLeft = false;
            break;
          case 6: // left
            canMoveLeft = false;
            break;
          case 7: // backward left
            canMoveBackward = canMoveLeft = false;
            break;
        }
      }

      if (i === 8 && collisions.length > 0) {
        if (collisions[0].distance <= bottomDistance) {
          isOnObject = canJump = true;
        }
      }

      if (i > 8 && collisions.length > 0) {
        if (collisions[0].distance <= rampDistance) {
          switch (i) {
            case 9: // backward
               yawObject.position.y += 2;
               canMoveBackward = true;
              break;
            case 10: // right
               yawObject.position.y += 2;
               canMoveRight = true;
              break;
            case 11: // forward
              yawObject.position.y += 2;
              canMoveForward = true;
              break;
            case 12: // left
               yawObject.position.y += 2;
               canMoveLeft = true;
              break;
          }
        }
      }
    }
  };

  this.getDirection = function () {
    var rotation = new THREE.Euler( 0, 0, 0, "YXZ" );

    return function (direction) {
      var v = new THREE.Vector3();
      rotation.set(0, yawObject.rotation.y, 0 );
      v.copy( direction ).applyEuler( rotation );
      return v;
    }
  }();

  this.update = function () {
    this.canMove();

    var time = performance.now();
    var delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 100.0 * delta;

    if (moveForward) { velocity.z -= 1000.0 * delta; }
    if (moveBackward) { velocity.z += 1000.0 * delta; }
    if (moveLeft) { velocity.x -= 1000.0 * delta; }
    if (moveRight) { velocity.x += 1000.0 * delta; }
    if (isOnObject) { velocity.y = Math.max( 0, velocity.y ); }

    yawObject.translateX(velocity.x * delta);
    yawObject.translateY(velocity.y * delta);
    yawObject.translateZ(velocity.z * delta);

    if (yawObject.position.y < 160) {
      velocity.y = 0;
      yawObject.position.y = 160;
      canJump = true;
    }

    prevTime = time;
  };

};