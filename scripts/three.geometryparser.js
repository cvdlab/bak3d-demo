// async-each MIT license (by Paul Miller from http://paulmillr.com).
(function(globals) {
  'use strict';
  var each = function(items, next, callback) {
    if (!Array.isArray(items)) throw new TypeError('each() expects array as first argument');
    if (typeof next !== 'function') throw new TypeError('each() expects function as second argument');
    if (typeof callback !== 'function') callback = Function.prototype; // no-op

    if (items.length === 0) return callback(undefined, items);

    var transformed = new Array(items.length);
    var count = 0;
    var returned = false;

    items.forEach(function(item, index) {
      next(item, function(error, transformedItem) {
        if (returned) return;
        if (error) {
          returned = true;
          return callback(error);
        }
        transformed[index] = transformedItem;
        count += 1;
        if (count === items.length) return callback(undefined, transformed);
      });
    });
  };

  if (typeof define !== 'undefined' && define.amd) {
    define([], function() {
      return each;
    }); // RequireJS
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = each; // CommonJS
  } else {
    globals.asyncEach = each; // <script>
  }
})(this);

//serail-each
(function(global) {
  function eachy(items, iterator, callback) {
    var index = 0, results = [];
    (function next(err) {
      if (err || index === items.length) return (callback || function(){})(err, results);
      iterator(items[index], function(err, result) {
        results[index++] = result;
        next(err);
      }, index);
    })();
  }
  if (typeof define !== 'undefined' && define.amd) {
    define(function() { return eachy; });
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = eachy;
  } else {
    global.seriesEach = eachy;
  }
})(this);

function get (url, callback) {
  var oReq = new XMLHttpRequest();
  oReq.open('GET', url, true);
  oReq.responseType = 'arraybuffer';

  oReq.onload = function (oEvent) {
    var arrayBuffer = oReq.response;
    if (arrayBuffer) {
      var byteArray = new DataView(arrayBuffer);
      var typed_array = new Float32Array(byteArray.byteLength / Float32Array.BYTES_PER_ELEMENT);
      var len = typed_array.length;
      for (var jj = 0; jj < len; ++jj) {
        typed_array[jj] = byteArray.getFloat32(jj * Float32Array.BYTES_PER_ELEMENT, true);
      }
      callback(typed_array);
    }
  };

  oReq.send(null);
}

function fillGeometryAttributes (geometry, data) {
  var attrs = data.data.attributes;
  var attrs_keys = Object.keys(attrs);
  seriesEach(attrs_keys, function (attr_name, done) {
    var attr_data = attrs[attr_name];
    var url = attr_data.array_url;

    if (!url) { done(); return; }

    get(attr_data.array_url, function (typed_array) {
      delete attr_data.array_url;
      attr_data.array = typed_array;
      done();
    });
  }, function (err) {
    if (err) { console.error(err); return; }
    attrs_keys.forEach(function (attr_name) {
      var attr = attrs[attr_name];
      var array = attr.array;
      var size = attr.itemSize;
      geometry.addAttribute(attr_name, new THREE.BufferAttribute(array, size));
      // console.log(attr_name, attrs[attr_name]);
    });
  });
}

function parseGeometry (data) {
  var geometryLoader = new THREE.JSONLoader();
  var bufferGeometryLoader = new THREE.BufferGeometryLoader();
  var attrs = data.data.attributes;
  var geometry;

  var toBeFilled = {
    position: attrs.position !== undefined && attrs.position.array === undefined && attrs.position.array_url,
    normal: attrs.normal !== undefined && attrs.normal.array === undefined && attrs.normal.array_url,
    uv: attrs.uv !== undefined && attrs.uv.array === undefined && attrs.uv.array_url,
    uv2: attrs.uv2 !== undefined && attrs.uv2.array === undefined && attrs.uv2.array_url
  };

  var isFilled = !toBeFilled.position && !toBeFilled.normal && !toBeFilled.uv && !toBeFilled.uv2;

  attrs.position.array && ( attrs.position.array = attrs.position.array || [] );
  attrs.normal && ( attrs.normal.array = attrs.normal.array || [] );
  attrs.uv && ( attrs.uv.array = attrs.uv.array || [] );
  attrs.uv2 && ( attrs.uv2.array = attrs.uv2.array || [] );

  geometry = bufferGeometryLoader.parse( data );

  switch ( data.type ) {

    case 'PlaneGeometry':
    case 'PlaneBufferGeometry':

      geometry = new THREE[ data.type ](
        data.width,
        data.height,
        data.widthSegments,
        data.heightSegments
      );

      break;

    case 'BoxGeometry':
    case 'CubeGeometry': // backwards compatible

      geometry = new THREE.BoxGeometry(
        data.width,
        data.height,
        data.depth,
        data.widthSegments,
        data.heightSegments,
        data.depthSegments
      );

      break;

    case 'CircleBufferGeometry':

      geometry = new THREE.CircleBufferGeometry(
        data.radius,
        data.segments,
        data.thetaStart,
        data.thetaLength
      );

      break;

    case 'CircleGeometry':

      geometry = new THREE.CircleGeometry(
        data.radius,
        data.segments,
        data.thetaStart,
        data.thetaLength
      );

      break;

    case 'CylinderGeometry':

      geometry = new THREE.CylinderGeometry(
        data.radiusTop,
        data.radiusBottom,
        data.height,
        data.radialSegments,
        data.heightSegments,
        data.openEnded,
        data.thetaStart,
        data.thetaLength
      );

      break;

    case 'SphereGeometry':

      geometry = new THREE.SphereGeometry(
        data.radius,
        data.widthSegments,
        data.heightSegments,
        data.phiStart,
        data.phiLength,
        data.thetaStart,
        data.thetaLength
      );

      break;

    case 'SphereBufferGeometry':

      geometry = new THREE.SphereBufferGeometry(
        data.radius,
        data.widthSegments,
        data.heightSegments,
        data.phiStart,
        data.phiLength,
        data.thetaStart,
        data.thetaLength
      );

      break;

    case 'DodecahedronGeometry':

      geometry = new THREE.DodecahedronGeometry(
        data.radius,
        data.detail
      );

      break;

    case 'IcosahedronGeometry':

      geometry = new THREE.IcosahedronGeometry(
        data.radius,
        data.detail
      );

      break;

    case 'OctahedronGeometry':

      geometry = new THREE.OctahedronGeometry(
        data.radius,
        data.detail
      );

      break;

    case 'TetrahedronGeometry':

      geometry = new THREE.TetrahedronGeometry(
        data.radius,
        data.detail
      );

      break;

    case 'RingGeometry':

      geometry = new THREE.RingGeometry(
        data.innerRadius,
        data.outerRadius,
        data.thetaSegments,
        data.phiSegments,
        data.thetaStart,
        data.thetaLength
      );

      break;

    case 'TorusGeometry':

      geometry = new THREE.TorusGeometry(
        data.radius,
        data.tube,
        data.radialSegments,
        data.tubularSegments,
        data.arc
      );

      break;

    case 'TorusKnotGeometry':

      geometry = new THREE.TorusKnotGeometry(
        data.radius,
        data.tube,
        data.radialSegments,
        data.tubularSegments,
        data.p,
        data.q,
        data.heightScale
      );

      break;

    case 'TextGeometry':

      geometry = new THREE.TextGeometry(
        data.text,
        data.data
      );

      break;

    case 'BufferGeometry':

      geometry = bufferGeometryLoader.parse( data );

      break;

    case 'Geometry':

      geometry = geometryLoader.parse( data.data, this.texturePath ).geometry;

      break;

    default:

      console.warn( 'THREE.ObjectLoader: Unsupported geometry type "' + data.type + '"' );

      // continue;

  }

  geometry.uuid = data.uuid;

  if ( data.name !== undefined ) {
    geometry.name = data.name;
  }

  !isFilled && fillGeometryAttributes(geometry, data);

  return geometry;

}

THREE.ObjectLoader.prototype.parseGeometries = function ( json ) {
  var geometries = {};
  var data

  if ( json !== undefined ) {
    for ( var i = 0, l = json.length; i < l; i ++ ) {
      var data = json[ i ];
      geometries[ data.uuid ] = parseGeometry(data);
    }
  }

  return geometries;
};
