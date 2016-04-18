var camera;
var scene;
var renderer;
var controls;
var octree;

var container = document.getElementById('container');
var overlay = document.getElementById('overlay');
var start = document.getElementById('start');
var notes = document.getElementById('notes');
var progress = document.getElementById('progress');


var on_pointerlock_change = function (event) {
  console.log('pointerlock enabled');
  var pointerlock = document.pointerLockElement;
  overlay.style.display = pointerlock ? 'none' : 'block';
}
var on_pointerlock_error = function (event) {
  console.log('pointerlock disabled');
}
var on_click_start = function (event) {
  container.requestPointerLock();
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

function stop_propagation (event) {
  event.stopPropagation();
}

function init() {
  var ua = navigator.userAgent;
  var chrome = /chrome|crios|crmo/i.test(ua);
  if (!chrome) {
    notes.style.display = 'block';
    start.style.display = 'none';
  }

  overlay.addEventListener('mousemove', stop_propagation, false);

  document.addEventListener('pointerlockerror', on_pointerlock_error, false);
  document.addEventListener('pointerlockchange', on_pointerlock_change, false);
  start.addEventListener('click', on_click_start);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);

  controls = new THREE.PointerLockControls(camera);
  scene.add(controls.getObject());

  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0xffffff);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

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

var onFillGeometry; // onFilledGeometries is called by THREE.GeometryLoader each time a geometry is filled
function downloadProgress (json) {
  var stats = statistics(json);
  var geometriesProgressValue = 0;
  var imagesProgressValue = 0;
  var progressValue = 0;
  
  function updateProgress () {
    progressValue = (geometriesProgressValue + imagesProgressValue) / 2;
    progress.textContent = progressValue.toFixed(1);
    if (progressValue >= 99.9) {
      // starting
      progress.style.display = 'none';
      start.style.display = 'block';
    }
  }

  function geometriesProgress () {
    var filledGeometries = 0;
    onFillGeometry = function onFillGeometry() {
      filledGeometries++;
      geometriesProgressValue = filledGeometries / stats.geometries * 100;
      updateProgress();
    }
  }

  function imagesProgress () {
    function nextUpdate () {
      imagesProgressValue = THREE.DefaultLoadingManager.itemsLoaded / stats.images * 100;
      updateProgress();
      if (THREE.DefaultLoadingManager.itemsLoaded !== stats.images) {
        setTimeout(nextUpdate, 500);
      }
    }
    nextUpdate();
  }

  geometriesProgress();
  imagesProgress();
}

function load_scene () {
  console.log('loading...');

  var on_parse = function (object) {
    scene.add(object);
    generate_envmap(object);
    generate_octree(object);
    animate();
  };

  // function on_progress (event) {
  //   if (!event.lengthComputable) {
  //     return;
  //   }
  //   var value = (event.loaded / event.total * 100).toFixed(1);
  //   progress.textContent = value;
  // }

  function on_complete (event) {
    setTimeout(function () {
      var json = JSON.parse(event.target.responseText);
      downloadProgress(json);
      var loader = new THREE.ObjectLoader();
      loader.parse(json, on_parse);
    }, 100);
  }

  function on_error (on_error) {
    console.log('An error occurred while transferring the file.');
  }

  function on_abort (event) {
    console.log('The transfer has been canceled by the user.');
  }

  var req = new XMLHttpRequest();
  // req.addEventListener('progress', on_progress);
  req.addEventListener('load', on_complete);
  req.addEventListener('error', on_error);
  req.addEventListener('abort', on_abort);
  req.open('GET', 'inputs/scene.json');
  req.setRequestHeader('Accept', 'application/json');
  req.setRequestHeader('Content-Type', 'application/json');
  req.send();
};

function statistics (json) {
  return {
    geometries: json.geometries.length,
    images: json.images.length
  };
};

THREE.DefaultLoadingManager = new THREE.CounterLoadingManager();
init();

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-54437653-1', 'auto');
ga('send', 'pageview');
