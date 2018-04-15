// Trying to implement the black sphere with white spheres on its
// surface from https://www.behance.net/gallery/3565597/Spherikal
//
// https://tmcw.github.io/literate-raytracer/

// Let's clean up as best we can right now, but then look into ES6 classes.

// Collect all initialization variables here.
//
// This factor affects the number of rays we use to render the scene.
// Warning: small changes to this number exponentially increase the
// number of rays we use, meaning a much longer rendering time, likely
// unnacceptable for animation purposes.
//
// 1 -> 0.5s
// 4 -> 30s
var resolutionFactor = 1;

// Canvas element that will hold sphere
var c = document.getElementById('c'),

// It's a sphere, so width and height can be the same.
height = 1024 * 0.5 * Math.pow(2,resolutionFactor);
width = 1024 * 0.5 * Math.pow(2,resolutionFactor);

c.width = width;
c.height = height;
c.style.cssText = 'width:' + (width / Math.pow(2,resolutionFactor)) + 'px;height:' + (height / Math.pow(2,resolutionFactor)) + 'px';
var ctx = c.getContext('2d'),
data = ctx.getImageData(0, 0, width, height);

scene = {};

/* Our camera is pretty simple: it's a point in space, where you can
 * imagine that the camera 'sits', a fieldOfView, which is the angle
 * from the right to the left side of its frame, and a vector which
 * determines what angle it points in.
 */
scene.camera = {
  point: {
    x: 3,
    y: 3,
    z: 3,
  },
  fieldOfView: 15,
  vector: {
    x: 0,
    y: 0,
    z: 0,
  }
};

/* In our scene, we only care if our rays intersect with an object
 * once, so no need for lights, really.
 */
scene.lights = [];

/* This raytracer handles sphere objects, with any color, position,
 * radius, and surface properties.
 *
 * Will want to generate random spheres (completely random, or spheres
 * that intersect with the surface of the main large dark sphere).
 *
 * Let's paint these spheres white.
 */

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function randomSphere(radius, color) {
  var x = getRandomArbitrary(-radius, radius),
  y = getRandomArbitrary(-radius, radius),
  z = getRandomArbitrary(-radius, radius);

  var sphere = {
    type: 'sphere',
    point: {
      x: x / Math.sqrt(x*x + y*y + z*z) * radius,
      y: y / Math.sqrt(x*x + y*y + z*z) * radius,
      z: z / Math.sqrt(x*x + y*y + z*z) * radius,
    },
    color: color,
    radius: radius / 10.0,
  };

  // console.log("Random sphere: ");
  // console.log(sphere);

  return sphere;
}

// Mutate sphere randomly changes the size of a sphere;
// if we just randomly select to grow or shrink it, it might
// look janky.
//
// Plan: we have a set number of spheres on the surface at any moment,
// and they start small and grow to the max size, then shrink again. Once
// they're completely gone, a new sphere can take its place. This means
// we need the entire blightSphere context to know the state of teh spheres.
function mutateSphere(sphere) {

}

scene.objects = [
  {
    type: 'sphere',
    point: {
      x: 0,
      y: 0,
      z: 0,
    },
    color: {
      x: 0,
      y: 0,
      z: 0,
    },
    radius: 0.5,
  },
];

for (i = 0; i < 50; i++ ) {
  scene.objects.push(randomSphere(getRandomArbitrary(0.45, 0.5), { x: 255, y: 255, z: 255 }));
}

/* For each pixel in the canvas, there needs to be at least one
 * ray of light that determines its color by bouncing through the scene.
 *
 * ctx is the canvas context
 *
 * If we can't get this to work fast enough, then we'll need to buffer the images. Generate first frame,
 * then generate all the rest of the frames in the background and animate once they're all done.
 */
function render(scene, ctx) {
  var camera = scene.camera,
  objects = scene.objects;

  /* Seems like what we do next is generate vectors that make the camera
  * point at each pixel in the scene. For each pixel we point the camera at,
  * we'll get back an RGB value (or in this case, a binary value (0,1) that
  * tells us whether or not that pixel is occluded.
  */

  /* Given a ray, shoot it until it hits an object and return that object's
  * color, or Vector.WHITE if no object is found.
  */

  /* In our case, simply return 0 or 1 depending on whether or not we hit an object.
   * Rather, our spheres are colored either black or white.
   */

  /* "Shooting the ray" means iterating over all the objects in the scene
  * and determining whether or not the ray's vector intersects with said object.
  * Also need to take into account whether the intersection is closer or further
  * away than other objects that intersect with the ray. The closest intersection
  * wins (again, important for determining if the large sphere in the center is
  * occluding any of the other spheres.
  */

  /* All the variables. All. Of. Them. */
  var eyeVector = Vector.unitVector(Vector.subtract(camera.vector, camera.point)),
  vpRight = Vector.unitVector(Vector.crossProduct(eyeVector, Vector.UP)),
  vpUp = Vector.unitVector(Vector.crossProduct(vpRight, eyeVector)),
  fovRadians = Math.PI * (camera.fieldOfView / 2) / 180,
  heightWidthRatio = height / width,
  halfWidth = Math.tan(fovRadians),
  halfHeight = heightWidthRatio * halfWidth,
  camerawidth = halfWidth * 2,
  cameraheight = halfHeight * 2,
  pixelWidth = camerawidth / (width - 1) / 1,
  pixelHeight = cameraheight / (height - 1) / 1;

  var index, color;
  var ray = {
    point: camera.point
  };
  for (var x = 0; x < width; x += 1) {
    for (var y = 0; y < height; y += 1) {
      var xcomp = Vector.scale(vpRight, (x * pixelWidth) - halfWidth),
      ycomp = Vector.scale(vpUp, (y * pixelHeight) - halfHeight);

      ray.vector = Vector.unitVector(Vector.add3(eyeVector, xcomp, ycomp));
      color = trace(ray, scene, 0);
      index = (x * 4) + (y * width * 4),
      data.data[index + 0] = color.x;
      data.data[index + 1] = color.y;
      data.data[index + 2] = color.z;
      data.data[index + 3] = 255;
    }
  }

  ctx.putImageData(data, 0, 0);
}

function trace(ray, scene, depth) {
  /* No real need for depth; we aren't using reflection */
  if (depth > 0) return;

  var distObject = intersectScene(ray, scene);
  if (distObject[0] === Infinity) {
    // Changing this from white to black since we want a black background
    return Vector.DEFAULT;
  }

  var dist = distObject[0],
  object = distObject[1];

  // Otherwise, means we hit something. Returning White for now,
  // will want to return actual color of object?
  return object.color;
}


function intersectScene(ray, scene) {
  var closest = [Infinity, null];

  for (var i = 0; i < scene.objects.length; i++) {
    var object = scene.objects[i],
    dist = sphereIntersection(object, ray);
    if (dist !== undefined && dist < closest[0]) {
      closest = [dist, object];
    }
  }
  return closest;
}

function sphereIntersection(sphere, ray) {
  var eye_to_center = Vector.subtract(sphere.point, ray.point),
  v = Vector.dotProduct(eye_to_center, ray.vector),
  eoDot = Vector.dotProduct(eye_to_center, eye_to_center),
  // Don't understand the match for the discriminant. :(
  discriminant = (sphere.radius * sphere.radius) - eoDot + (v * v);

  if (discriminant < 0) {
    return;
  } else {
    return v - Math.sqrt(discriminant);
  }
}

// # Vector Operations
//
// These are general-purpose functions that deal with vectors - in this case,
// three-dimensional vectors represented as objects in the form
//
//     { x, y, z }
//
// Since we're not using traditional object oriented techniques, these
// functions take and return that sort of logic-less object, so you'll see
// `add(a, b)` rather than `a.add(b)`.
var Vector = {};

// # Constants
Vector.UP = { x: 0, y: 1, z: 0 };
Vector.ZERO = { x: 0, y: 0, z: 0 };
Vector.WHITE = { x: 255, y: 255, z: 255 };
Vector.GRAY = { x: 127, y: 127, z: 127 };
Vector.DEFAULT = Vector.ZERO;
Vector.BLACK = Vector.ZERO;

// # Operations
//
// ## [Dot Product](https://en.wikipedia.org/wiki/Dot_product)
// is different than the rest of these since it takes two vectors but
// returns a single number value.
Vector.dotProduct = function(a, b) {
  return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
};

// ## [Cross Product](https://en.wikipedia.org/wiki/Cross_product)
//
// generates a new vector that's perpendicular to both of the vectors
// given.
Vector.crossProduct = function(a, b) {
  return {
    x: (a.y * b.z) - (a.z * b.y),
    y: (a.z * b.x) - (a.x * b.z),
    z: (a.x * b.y) - (a.y * b.x)
  };
};

// Enlongate or shrink a vector by a factor of `t`
Vector.scale = function(a, t) {
  return {
    x: a.x * t,
    y: a.y * t,
    z: a.z * t
  };
};

// ## [Unit Vector](http://en.wikipedia.org/wiki/Unit_vector)
//
// Turn any vector into a vector that has a magnitude of 1.
//
// If you consider that a [unit sphere](http://en.wikipedia.org/wiki/Unit_sphere)
// is a sphere with a radius of 1, a unit vector is like a vector from the
// center point (0, 0, 0) to any point on its surface.
Vector.unitVector = function(a) {
  return Vector.scale(a, 1 / Vector.length(a));
};

// Add two vectors to each other, by simply combining each
// of their components
Vector.add = function(a, b) {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z
  };
};

// A version of `add` that adds three vectors at the same time. While
// it's possible to write a clever version of `Vector.add` that takes
// any number of arguments, it's not fast, so we're keeping it simple and
// just making two versions.
Vector.add3 = function(a, b, c) {
  return {
    x: a.x + b.x + c.x,
    y: a.y + b.y + c.y,
    z: a.z + b.z + c.z
  };
};

// Subtract one vector from another, by subtracting each component
Vector.subtract = function(a, b) {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z
  };
};

// Length, or magnitude, measured by [Euclidean norm](https://en.wikipedia.org/wiki/Euclidean_vector#Length)
Vector.length = function(a) {
  return Math.sqrt(Vector.dotProduct(a, a));
};

function scaleCamera(scene) {
  var camera = scene.camera;

  //camera.point.x = camera.point.x + 0.1;
  //camera.point.y = camera.point.y + 0.1;
  //camera.point.z = camera.point.z + 0.1;

  scene.camera = camera;
}

function animate() {
  render(scene, ctx);
  setTimeout(function() {
    // mutate scene;
    // for now, let's just make the sphere rotate by moving the camera
    scaleCamera(scene);
    animate();
  }, 33); // aim for 30 frames per second
}

render(scene, ctx);
//animate();
