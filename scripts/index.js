var camera;
var scene;
var renderer;
var controls;
var octree;

function init_pointerlock () {
  var container = document.body;

  var on_pointerlock_change = function (event) {
    console.log('first-person enabled');
  }
  var on_pointerlock_error = function (event) {
    console.log('first-person disabled');
  }
  var on_click_start = function (event) {
    container.webkitRequestFullscreen();
    container.requestPointerLock();
  }

  document.addEventListener('pointerlockerror', on_pointerlock_error, false);
  document.addEventListener('pointerlockchange', on_pointerlock_change, false);
  container.addEventListener('click', on_click_start);
}

function generate_envmap (object) {
  var cameras = []

  object.traverse(function (obj) {
    if (obj instanceof THREE.CubeCamera) {
      cameras.push(obj);
    }
  });

  object.updateMatrixWorld(true);
  cameras.forEach(function (camera) {
    var parent = camera.parent;
    camera.position.getPositionFromMatrix(parent.matrixWorld);
    camera.renderTarget.mapping = camera.mapping;
    object.add(camera);
    parent.material.envMap = camera.renderTarget;
  });

  cameras.forEach(function (camera) {
    camera.updateCubeMap(renderer,scene);
  });
}

function generate_octree (object) {
  octree = new THREE.Octree({
    radius: 1,
    undeferred: false,
    depthMax: Infinity,
    objectsThreshold: 1,
    overlapPct: 0.15
  });

  object.traverse(function (obj) {
    if (obj instanceof THREE.Mesh) {
      octree.add(obj);
    }
  });
}

function init() {
  init_pointerlock();

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);

  controls = new THREE.PointerLockControls(camera);
  scene.add(controls.getObject());

  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0xffffff);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  load_scene();
}

function on_resize () {
  var width = window.innerWidth;
  var height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

window.addEventListener('resize', on_resize, false);

function animate () {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function load_scene () {
  var progress = document.getElementById('progress');
  console.log('loading...');

  var on_parse = function (object) {
    scene.add(object);
    generate_envmap(object);
    generate_octree(object);
    animate();
  };

  function on_progress (event) {
    if (!event.lengthComputable) {
      return;
    }
    var value = (event.loaded / event.total * 100).toFixed(1);
    progress.textContent = value;
  }

  function on_complete (event) {
    setTimeout(function () {
      var json = JSON.parse(event.target.responseText);
      var loader = new THREE.ObjectLoader();
      loader.parse(json, on_parse);
    }, 100);
    progress.style.display = 'none';
  }

  function on_error (on_error) {
    console.log('An error occurred while transferring the file.');
  }

  function on_abort (event) {
    console.log('The transfer has been canceled by the user.');
  }

  var req = new XMLHttpRequest();
  req.addEventListener('progress', on_progress);
  req.addEventListener('load', on_complete);
  req.addEventListener('error', on_error);
  req.addEventListener('abort', on_abort);
  req.open('GET', 'inputs/scene.json');
  req.setRequestHeader('Accept', 'application/json');
  req.setRequestHeader('Content-Type', 'application/json');
  req.send();
};

init();

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-54437653-1', 'auto');
ga('send', 'pageview');
