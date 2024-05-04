import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module'
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {Atmosphere} from './atmosphere.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const _VS = `
uniform float pointMultiplier;

attribute float size;
attribute float angle;
attribute vec4 colour;

varying vec4 vColour;
varying vec2 vAngle;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = size * pointMultiplier / gl_Position.w;

  vAngle = vec2(cos(angle), sin(angle));
  vColour = colour;
}`;

const _FS = `

uniform sampler2D diffuseTexture;

varying vec4 vColour;
varying vec2 vAngle;

void main() {
  vec2 coords = (gl_PointCoord - 0.5) * mat2(vAngle.x, vAngle.y, -vAngle.y, vAngle.x) + 0.5;
  gl_FragColor = texture2D(diffuseTexture, coords) * vColour;
}`;

var paused = true;
var won = false;

class LinearSpline {
    constructor(lerp) {
        this._points = [];
        this._lerp = lerp;
    }

    AddPoint(t, d) {
        this._points.push([t, d]);
    }

    Get(t) {
        let p1 = 0;

        for (let i = 0; i < this._points.length; i++) {
            if (this._points[i][0] >= t) {
                break;
            }
            p1 = i;
        }

        const p2 = Math.min(this._points.length - 1, p1 + 1);

        if (p1 == p2) {
            return this._points[p1][1];
        }

        return this._lerp(
            (t - this._points[p1][0]) / (
                this._points[p2][0] - this._points[p1][0]),
            this._points[p1][1], this._points[p2][1]);
    }
}


class ParticleSystem {
    constructor(params) {
        const uniforms = {
            diffuseTexture: {
                value: new THREE.TextureLoader().load('/scr/fire.png')
            },
            pointMultiplier: {
                value: window.innerHeight / (2.0 * Math.tan(0.5 * 60.0 * Math.PI / 180.0))
            }
        };

        this._material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: _VS,
            fragmentShader: _FS,
            blending: THREE.AdditiveBlending,
            depthTest: true,
            depthWrite: false,
            transparent: true,
            vertexColors: true
        });

        this._camera = params.camera;
        this._rocket = params.rocket;
        this._particles = [];

        this._geometry = new THREE.BufferGeometry();
        this._geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
        this._geometry.setAttribute('size', new THREE.Float32BufferAttribute([], 1));
        this._geometry.setAttribute('colour', new THREE.Float32BufferAttribute([], 4));
        this._geometry.setAttribute('angle', new THREE.Float32BufferAttribute([], 1));

        this._points = new THREE.Points(this._geometry, this._material);
        this._points.frustumCulled = false;

        params.parent.add(this._points);

        this._alphaSpline = new LinearSpline((t, a, b) => {
            return a + t * (b - a);
        });
        this._alphaSpline.AddPoint(0.0, 0.0);
        this._alphaSpline.AddPoint(0.1, 1.0);
        this._alphaSpline.AddPoint(0.6, 1.0);
        this._alphaSpline.AddPoint(1.0, 0.0);

        this._colourSpline = new LinearSpline((t, a, b) => {
            const c = a.clone();
            return c.lerp(b, t);
        });
        this._colourSpline.AddPoint(0.0, new THREE.Color(0xFFFF80));
        this._colourSpline.AddPoint(1.0, new THREE.Color(0xFF8080));

        this._sizeSpline = new LinearSpline((t, a, b) => {
            return a + t * (b - a);
        });
        this._sizeSpline.AddPoint(0.0, 1.0);
        this._sizeSpline.AddPoint(0.5, 5.0);
        this._sizeSpline.AddPoint(1.0, 1.0);

        this._UpdateGeometry();
    }

    _AddParticles(timeElapsed) {
        if (!this.gdfsghk) {
            this.gdfsghk = 0.0;
        }
        this.gdfsghk += timeElapsed;

        let velocityPercentage = this._rocket.velocity / this._rocket.maxVelocity
        const ParticleSpeed = 1 * velocityPercentage + 0.2
        const ParticleSize = 4 * velocityPercentage + 0.2
        var ParticleLife = (1 * velocityPercentage / 3) + 0.5
        const ParticleOffset = -20
        const n = Math.floor(this.gdfsghk * ParticleSpeed);
        this.gdfsghk -= n / 150.0;

        if (velocityPercentage <= 0.01) {

            ParticleLife = 0
        }

        var pointDirection = new THREE.Vector3(0, ParticleOffset + 15, 0);

        var rotationZ = this._rocket.rotation.z;

        // Create a rotation matrix based on the rotationZ
        var rotationMatrix = new THREE.Matrix4().makeRotationZ(rotationZ);

        // Apply the rotation matrix to the point
        pointDirection.applyMatrix4(rotationMatrix);

        // Add the rotated point to the initial object's position to get the final point position
        var finalPoint = this._rocket.firePosition.clone()
        var direction = pointDirection.clone();

        let rocketPosition = finalPoint
        //console.log(rocketPosition);

        let startPosition = new THREE.Vector3((Math.random() * 2 - 1) * 1.0, (Math.random() * 2 - 1) * 1.0, (Math.random() * 2 - 1) * 1.0 + 800)

        for (let i = 0; i < n; i++) {
            const life = (Math.random() * 0.75 + 0.25) * ParticleLife;
            this._particles.push({
                position: rocketPosition,
                size: (Math.random() * 0.5 + 0.5) * 4.0 * ParticleSize,
                colour: new THREE.Color(),
                alpha: 1,
                life: life,
                maxLife: life,
                rotation: Math.random() * 2.0 * Math.PI,
                velocity: new THREE.Vector3(direction.x, direction.y, 0),
            });
        }
    }

    _UpdateGeometry() {
        const positions = [];
        const sizes = [];
        const colours = [];
        const angles = [];

        for (let p of this._particles) {
            positions.push(p.position.x, p.position.y, p.position.z);
            colours.push(p.colour.r, p.colour.g, p.colour.b, p.alpha);
            sizes.push(p.currentSize);
            angles.push(p.rotation);
        }

        this._geometry.setAttribute(
            'position', new THREE.Float32BufferAttribute(positions, 3));
        this._geometry.setAttribute(
            'size', new THREE.Float32BufferAttribute(sizes, 1));
        this._geometry.setAttribute(
            'colour', new THREE.Float32BufferAttribute(colours, 4));
        this._geometry.setAttribute(
            'angle', new THREE.Float32BufferAttribute(angles, 1));

        this._geometry.attributes.position.needsUpdate = true;
        this._geometry.attributes.size.needsUpdate = true;
        this._geometry.attributes.colour.needsUpdate = true;
        this._geometry.attributes.angle.needsUpdate = true;
    }

    _UpdateParticles(timeElapsed) {
        for (let p of this._particles) {
            p.life -= timeElapsed;
        }

        this._particles = this._particles.filter(p => {
            return p.life > 0.0;
        });

        for (let p of this._particles) {
            const t = 1.0 - p.life / p.maxLife;

            p.rotation += timeElapsed * 0.5;
            p.alpha = this._alphaSpline.Get(t);
            p.currentSize = p.size * this._sizeSpline.Get(t);
            p.colour.copy(this._colourSpline.Get(t));

            p.position.add(p.velocity.clone().multiplyScalar(timeElapsed));

            const drag = p.velocity.clone();
            drag.multiplyScalar(timeElapsed * 0.1);
            drag.x = Math.sign(p.velocity.x) * Math.min(Math.abs(drag.x), Math.abs(p.velocity.x));
            drag.y = Math.sign(p.velocity.y) * Math.min(Math.abs(drag.y), Math.abs(p.velocity.y));
            drag.z = Math.sign(p.velocity.z) * Math.min(Math.abs(drag.z), Math.abs(p.velocity.z));
            p.velocity.sub(drag);
        }

        this._particles.sort((a, b) => {
            const d1 = this._camera.position.distanceTo(a.position);
            const d2 = this._camera.position.distanceTo(b.position);

            if (d1 > d2) {
                return -1;
            }

            if (d1 < d2) {
                return 1;
            }

            return 0;
        });
    }

    Step(timeElapsed) {
        this._AddParticles(timeElapsed);
        this._UpdateParticles(timeElapsed);
        this._UpdateGeometry();
    }
}

let data = [];

const systemParams = {
    debugPlanets: false,
    rotationSpeed: {
        min: 0.001,
        max: 0.001
    },
    planetSize: {
        min: 0.8,
        max: 3
    },
    clickablePlanet: {
        color: 0x00FF00,
        opacity: 0.0
    }

}

const sunParam = {
    type: {value: 2},
    radius: {value: 20.0},
    amplitude: {value: 1.076},
    sharpness: {value: 3.54},
    offset: {value: 0.084},
    period: {value: 0.2},
    persistence: {value: 1},
    lacunarity: {value: 3},
    octaves: {value: 8},

    undulation: {value: 0.0},

    ambientIntensity: {value: 1},
    diffuseIntensity: {value: 0},
    specularIntensity: {value: 0},
    shininess: {value: 0},
    lightDirection: {value: new THREE.Vector3(1, 1, 1)},
    lightColor: {value: new THREE.Color(0xffffff)},

    bumpStrength: {value: 1.0},
    bumpOffset: {value: 0.00001},

    color1: {value: new THREE.Color(1, 0.89, 0.729)},
    color2: {value: new THREE.Color(0.949, 0.513, 0.121)},
    color3: {value: new THREE.Color(0.940, 0.365, 0.133)},
    color4: {value: new THREE.Color(0.85, 0.219, 0.145)},
    color5: {value: new THREE.Color(0.643, 0.1137, 0.133)},
    transition2: {value: 0.15},
    transition3: {value: 0.285},
    transition4: {value: 0.318},
    transition5: {value: 1.2},
    blend12: {value: 0},
    blend23: {value: 0},
    blend34: {value: 0},
    blend45: {value: 0}
}

/*
const standardPlanetParams = {
    type: {value: 2}, //Fixed
    radius: {value: 20.0}, //Fixed
    amplitude: {value: 0.8778},
    sharpness: {value: 1.915},
    offset: {value: -0.05},
    period: {value: 2.6226},
    persistence: {value: 0.531},
    lacunarity: {value: 1.8},
    octaves: {value: 10},
    undulation: {value: 0.0},
    ambientIntensity: {value: 0.054},
    diffuseIntensity: {value: 2},
    specularIntensity: {value: 0.0},
    shininess: {value: 25},
    lightDirection: {value: new THREE.Vector3(1, 1, 1)},
    lightColor: {value: new THREE.Color(0xffffff)},
    bumpStrength: {value: 1.0},
    bumpOffset: {value: 0.001},
    color1: {value: new THREE.Color(0.014, 0.117, 0.279)},
    color2: {value: new THREE.Color(0.080, 0.527, 0.351)},
    color3: {value: new THREE.Color(0.620, 0.516, 0.372)},
    color4: {value: new THREE.Color(0.149, 0.254, 0.084)},
    color5: {value: new THREE.Color(0.150, 0.150, 0.150)},
    transition2: {value: 0.153},
    transition3: {value: 0.215},
    transition4: {value: 0.282},
    transition5: {value: 0.543},
    blend12: {value: 0.152},
    blend23: {value: 0.039},
    blend34: {value: 0.104},
    blend45: {value: 0.168}
}
*/

const planetParams = {
    //Planet Structure
    type: {value: 2}, //Fixed
    radius: {value: 20.0}, //Fixed
    amplitude: {
        min: 0.8,
        max: 1
    },
    sharpness: {
        min: 1,
        max: 4
    },
    offset: {value: -0.05},  //Fixed
    period: {
        min: 1,
        max: 2.5
    },
    persistence: {
        min: 0.531,
        max: 0.6
    },
    lacunarity: {value: 1.8}, //Fixed
    octaves: {value: 10},//Fixed
    undulation: {value: 10.0},
    // Light
    ambientIntensity: {value: 0.054},
    diffuseIntensity: {value: 2},
    specularIntensity: {value: 0.0},
    shininess: {value: 25},
    lightDirection: {value: new THREE.Vector3(1, 1, 1)},
    lightColor: {value: new THREE.Color(0xffffff)},
    // ???
    bumpStrength: {value: 1.0},
    bumpOffset: {value: 0.00001},
    //Colors
}

const planetColors = [

    {
        name: "Green",
        colors: {
            color1: [3.57, 29.835, 71.145],
            color2: [20.4, 134.385, 89.505],
            color3: [153.51, 131.58, 94.86],
            color4: [37.995, 64.77, 21.42],
            color5: [38.25, 38.25, 38.25]
        },
        transition2: {value: 0.153},
        transition3: {value: 0.215},
        transition4: {value: 0.282},
        transition5: {value: 0.543},
        blend12: {value: 0.152},
        blend23: {value: 0.039},
        blend34: {value: 0.104},
        blend45: {value: 0.168}
    },
    {
        name: "Green2",
        colors: {
            color1: [3.57, 29.835, 71.145],
            color2: [20.4, 134.385, 89.505],
            color3: [153.51, 131.58, 94.86],
            color4: [37.995, 64.77, 21.42],
            color5: [38.25, 38.25, 38.25]
        },
        transition2: {value: 0.153},
        transition3: {value: 0.215},
        transition4: {value: 0.282},
        transition5: {value: 0.543},
        blend12: {value: 0.152},
        blend23: {value: 0.039},
        blend34: {value: 0.104},
        blend45: {value: 0.168}
    },
    {
        name: "Sun",
        colors: {
            color1: [242, 131, 31],
            color2: [241, 93, 34],
            color3: [217, 65, 37],
            color4: [164, 29, 34],
            color5: [12, 12, 12],
        },
        transition2: {value: 0.153},
        transition3: {value: 0.215},
        transition4: {value: 0.282},
        transition5: {value: 0.443},
        blend12: {value: 0.252},
        blend23: {value: 0.139},
        blend34: {value: 0.204},
        blend45: {value: 0.268},
        //Extra:
        sharpness: {value: 5},  //Fixed
        offset: {value: 0.164},  //Fixed
    },
    {
        name: "Mercury",
        colors: {
            color1: [90, 88, 86],
            color2: [191, 189, 188],
            color3: [140, 138, 137],
            color4: [244, 246, 248],
            color5: [12, 12, 12],
        },
        transition2: {value: 0.153},
        transition3: {value: 0.215},
        transition4: {value: 0.282},
        transition5: {value: 0.643},
        blend12: {value: 0.152},
        blend23: {value: 0.1},
        blend34: {value: 0.104},
        blend45: {value: 0.3},
        //Extra:
        offset: {value: 0.164},  //Fixed
    },
    {
        name: "Earth",
        colors: {
            color1: [65, 107, 143],
            color2: [98, 136, 168],
            color3: [183, 203, 219],
            color4: [223, 235, 245],
            color5: [12, 12, 12]
        },
        transition2: {value: 0.153},
        transition3: {value: 0.215},
        transition4: {value: 0.282},
        transition5: {value: 0.543},
        blend12: {value: 0.152},
        blend23: {value: 0.039},
        blend34: {value: 0.104},
        blend45: {value: 0.168}
    },
    {
        name: "Jupiter",
        colors: {
            color1: [40, 36, 17],
            color2: [192, 129, 55],
            color3: [191, 176, 156],
            color4: [166, 112, 91],
            color5: [12, 12, 12]
        },
        transition2: {value: 0.153},
        transition3: {value: 0.215},
        transition4: {value: 0.282},
        transition5: {value: 0.643},
        blend12: {value: 0.152},
        blend23: {value: 0.1},
        blend34: {value: 0.104},
        blend45: {value: 0.3},
        //Extra:
        offset: {value: 0.164},  //Fixed
    },
]

function createMaterial(param) {

    const noiseFunctions = document.getElementById('noise-functions').innerHTML;
    const vertexShader = document.getElementById('planet-vert-shader').innerHTML;
    const fragmentShader = document.getElementById('planet-frag-shader').innerHTML;

    return new THREE.ShaderMaterial({
        uniforms: param,
        vertexShader: vertexShader.replace(
            'void main() {',
            `${noiseFunctions}
       void main() {`
        ),
        fragmentShader: fragmentShader.replace(
            'void main() {',
            `${noiseFunctions}
       void main() {`
        ),
    });
}

function valueTowards(value, goal, step = 0.01, digits = 3) {


    if (value < goal) {
        return +(Number(Number(value) + step).toFixed(digits))
    } else if (value > goal) {
        return +(Number(Number(value) - step).toFixed(digits))
    } else {
        return Number(value)
    }
}

function moveOneUnitCloserToObject(object, goalPosition, distance = 1) {
    // Calculate the direction from the current position of the object to the goal position
    var direction = new THREE.Vector3();
    direction.subVectors(goalPosition, object.position)

    // Multiply the direction by the desired distance to move (1 unit)
    var movement = direction.multiplyScalar(distance);

    // Update the position of the object
    object.position.add(movement);
}

function scaleObjectSlowly(object, scale, speed = 0.05) {


    function changeScale(actualScale, newScale) {
        if (actualScale < newScale) {
            return Number(Number(actualScale) + speed).toFixed(3)
        } else if (actualScale > newScale) {
            return Number(Number(actualScale) - speed).toFixed(3)
        } else {
            return actualScale
        }
    }

    //console.log("Now: "+object.scale.x+" ; Goal: "+scale+" ; Next: "+ changeScale(object.scale.x, scale))

    object.scale.set(
        changeScale(object.scale.x, scale),
        changeScale(object.scale.y, scale),
        changeScale(object.scale.z, scale),
    )

}

function rotateTowardsGoal(object, goalRotation, speed) {
    // Get the current rotation of the object
    var currentRotation = new THREE.Euler().setFromQuaternion(object.quaternion);

    // Calculate the difference between the current rotation and the goal rotation
    var rotationDifference = {
        x: goalRotation.x - currentRotation.x,
        y: goalRotation.y - currentRotation.y,
        z: goalRotation.z - currentRotation.z
    };

    // Calculate the rotation step based on the speed
    var rotationStep = {
        x: rotationDifference.x > 0 ? Math.min(rotationDifference.x, speed) : Math.max(rotationDifference.x, -speed),
        y: rotationDifference.y > 0 ? Math.min(rotationDifference.y, speed) : Math.max(rotationDifference.y, -speed),
        z: rotationDifference.z > 0 ? Math.min(rotationDifference.z, speed) : Math.max(rotationDifference.z, -speed)
    };

    // Incrementally adjust the rotation towards the goal
    currentRotation.x += rotationStep.x;
    currentRotation.y += rotationStep.y;
    currentRotation.z += rotationStep.z;

    // Set the new rotation to the object
    object.quaternion.setFromEuler(currentRotation);
}

function distanceBetweenPointsXY(Pos1, Pos2) {
    var distance = Math.sqrt(Math.pow(Pos2.x - Pos1.x, 2) + Math.pow(Pos2.y - Pos1.y, 2));
    return Math.round(distance);
}

function distanceBetweenPoints(Pos1, Pos2) {
    var distance = Math.sqrt(Math.pow(Pos2.x - Pos1.x, 2) + Math.pow(Pos2.y - Pos1.y, 2) + Math.pow(Pos2.z - Pos1.z, 2));
    return Math.round(distance);
}

function calcLightSourcePosition(sunDistance, Object) {

    let lightX = ((Object.position.x / sunDistance) * -1);
    let lightY = ((Object.position.y / sunDistance) * -1);
    let lightZ = (THREE.MathUtils.degToRad(Object.rotation.y) / 360);

    // Calculate the light direction from the origin to the sphere's position
    const inverseQuaternion = Object.quaternion.clone().conjugate();
    return new THREE.Vector3(lightX, lightY, lightZ).applyQuaternion(inverseQuaternion).normalize()
}

function createPlanet(name, material, rotationSpeed = 0, rotationAxis = '', rotationPosition = 0, size = 1, sunDistance = 200, projektData = {}) {

    function createAtmosphere(planetParams) {

        const atmosphereParams = {
            particles: {value: 4000},
            minParticleSize: {value: 50},
            maxParticleSize: {value: 100},
            radius: {value: planetParams.radius.value + 1},
            thickness: {value: 1.5},
            density: {value: 0},
            opacity: {value: 0.35},
            scale: {value: 8},
            color: {value: new THREE.Color(0xffffff)},
            speed: {value: 0.03},
            lightDirection: planetParams.lightDirection
        };

        return new Atmosphere(atmosphereParams)
    }

    let planet = new THREE.Mesh(new THREE.SphereGeometry(size, 64, 64).clone(), material.clone());
    planet.frustumCulled = false;
    planet.position.set(0, 0, 0);
    planet.geometry.computeTangents();
    //let atmosphere = createAtmosphere(material.uniforms)
    //planet.add(atmosphere);

    planet.name = name;
    // Set rotation properties for each sphere
    planet.userData.rotationSpeed = rotationSpeed;
    planet.userData.rotationAxis = rotationAxis;
    planet.userData.rotationPosition = rotationPosition;
    planet.userData.sunDistance = sunDistance;
    planet.userData.size = size * material.uniforms.radius.value + 2;
    planet.userData.visited = false;

    planet.userData.title = projektData?.title || '';
    planet.userData.status = projektData?.status || '';
    planet.userData.description = projektData?.text || '';
    planet.userData.link = projektData?.link || '';


    // Create clickable Sphere for Planet
    // Create a green semi-transparent material
    const materialClickSphere = new THREE.MeshBasicMaterial({
        color: systemParams.clickablePlanet.color, // Green color
        transparent: true,
        opacity: systemParams.clickablePlanet.opacity  // Adjust opacity for semi-transparency
    });

    var geometryClickSphere = new THREE.SphereGeometry(size * material.uniforms.radius.value + 5, 32, 32);
    // Create a mesh with the geometry and material
    if (sunDistance === 0) {

        geometryClickSphere = new THREE.SphereGeometry(size * material.uniforms.radius.value * 0.97, 32, 32);
    }

    const clickSphere = new THREE.Mesh(geometryClickSphere, materialClickSphere);
    clickSphere.name = name + "-clickable"
    planet.add(clickSphere);
    return planet
}

function createRandomPlanet(distance, id, name = '', projektData = {}) {

    // Function to generate a random rotation axis
    function getRandomBetween(element) {
        return ((Math.random() * (element.max - element.min)) + element.min);
    }

    // Function to get a random color from planetColors
    function getRandomPlanetColor() {
        let randomColors = planetColors[Math.floor(Math.random() * planetColors.length)];

        let convertedColors = {}

        for (let key in randomColors) {
            if (key === "colors") {
                for (let color in randomColors[key]) {
                    convertedColors[color] = {
                        value: new THREE.Color(randomColors[key][color][0] / 255, randomColors[key][color][1] / 255, randomColors[key][color][2] / 255)
                    };
                }
            } else {
                convertedColors[key] = randomColors[key];
            }
        }

        return convertedColors;
    }

    // Function to generate random Planet Params
    function getRandomPlanetParams() {

        //also gets Name of Planet
        let colors = getRandomPlanetColor();

        let params = {
            type: {value: planetParams.type.value},
            radius: {value: planetParams.radius.value},
            amplitude: {value: getRandomBetween(planetParams.amplitude)},
            sharpness: {value: getRandomBetween(planetParams.sharpness)},
            offset: {value: planetParams.offset.value},
            period: {value: getRandomBetween(planetParams.period)},
            persistence: {value: getRandomBetween(planetParams.persistence)},
            lacunarity: {value: planetParams.lacunarity.value},
            octaves: {value: planetParams.octaves.value},
            undulation: {value: planetParams.undulation.value},
            ambientIntensity: {value: planetParams.ambientIntensity.value},
            diffuseIntensity: {value: planetParams.diffuseIntensity.value},
            specularIntensity: {value: planetParams.specularIntensity.value},
            shininess: {value: planetParams.shininess.value},
            lightDirection: {value: planetParams.lightDirection.value},
            lightColor: {value: planetParams.lightColor.value},
            bumpStrength: {value: planetParams.bumpStrength.value},
            bumpOffset: {value: planetParams.bumpOffset.value},
        }

        for (let key in colors) {
            params[key] = colors[key];
        }

        return params
    }

    // Function to generate a random rotation axis
    function getRandomAxis() {
        const axes = ['x', 'y', 'xy', 'xz', 'yz'];
        return axes[Math.floor(Math.random() * axes.length)];
    }


    const params = getRandomPlanetParams()

    // Is random, for planetParams are created randomly
    const material = createMaterial(params);

    if (name === '') {
        name = params.name + "-" + id
    }

    let size = getRandomBetween(systemParams.planetSize);
    let rotationSpeed = getRandomBetween(systemParams.rotationSpeed) + (1 / distance);
    let rotationAxis = getRandomAxis()
    let rotationPosition = Math.random() * 100;

    if (systemParams.debugPlanets) {

        rotationPosition = 0;
        distance = distance / 2;

    }


    return createPlanet(name, material, rotationSpeed, rotationAxis, rotationPosition, size, distance, projektData)

}

function createTheStars(scene, maxDistance) {

    // Create stars
    const starCount = maxDistance / 2;
    const starsGeometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];

    for (let i = 0; i < starCount; i++) {
        const x = THREE.MathUtils.randFloatSpread(maxDistance);
        const y = THREE.MathUtils.randFloatSpread(maxDistance);
        const z = THREE.MathUtils.randFloatSpread(2000) - 2100;
        positions.push(x, y, z);
        colors.push(1, 1, 1);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 5,
        vertexColors: true
    });
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);

    return starField
}

function createFire(scene, camera, rocket) {

    return new ParticleSystem({
        parent: scene,
        camera: camera,
        rocket: rocket,
    });
}

// Define a recursive function to traverse the scene hierarchy
function traverseScene(object, callback) {
    // If the object has children, traverse each child
    if (object.children.length > 0) {
        object.children.forEach(child => {
            traverseScene(child, callback);
        });
    }

    // If the object has a name and a position, print its name and position
    if (object.name && object.position) {
        callback(object.name, object.position);
    }
}

function createRocket(scene, camera) {

    let gltfLoader = new GLTFLoader();
    // rocket model from https://sketchfab.com/3d-models/rocket-high-poly-simple-free-34eb9f0902f640a0a112e6f16261b755
    return new Promise((resolve, reject) => {
        gltfLoader.load(
            '/scr/objects/rocket/scene.gltf', // Path to your GLTF file
            // onLoad callback
            function (gltf) {

                var rocket = gltf.scene;

                rocket.position.set(0, 0, 0);
                rocket.scale.set(5, 5, 5); // Set scale factors (adjust as needed)


                rocket.velocity = 0.001
                rocket.maxVelocity = 20.0; // Maximum velocity
                rocket.minVelocity = 0.0; // Minimum velocity
                rocket.acceleration = 0.05; // Acceleration rate

                rocket.firePosition = new THREE.Vector3(0, 0, 0);

                // Add the object to the scene

                rocket.increaseVelocity = function () {
                    if (this.velocity < this.maxVelocity) {
                        this.velocity += this.acceleration;
                    }
                };

                // Function to decrease velocity
                rocket.decreaseVelocity = function () {
                    if (this.velocity > this.minVelocity) {
                        this.velocity -= this.acceleration;
                    }
                };


                // Create a directional light
                var rocketLight = new THREE.DirectionalLight(0xffffff, 1);
                rocketLight.name = 'rocketLight';

                // Set the position of the light
                rocketLight.position.set(10, 10, 0); // Adjust the position as needed

                // Add the light to the scene
                rocket.add(rocketLight);

                scene.add(rocket);

                resolve(rocket)
            },
            // onProgress callback
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function (error) {
                console.error('An error happened:', error);
            }
        );
    });
}

function createTheSun(scene) {

    const materialSun = createMaterial(sunParam)
    let sun = createPlanet("Sun-Center", materialSun, 0.0005, 'z', 0, 10, 0);
    scene.add(sun)
    return sun;

}

function createThePlanets(scene) {

    function createCircle(diameter, color) {
        const segments = 256; // Number of segments to approximate the circle
        const circleGeometry = new THREE.RingGeometry(diameter - 2, diameter + 2, segments);
        const material = new THREE.MeshBasicMaterial({color: color, side: THREE.DoubleSide});
        material.polygonOffset = -0.5;
        let circle = new THREE.Mesh(circleGeometry, material);

        circle.position.set(0, 0, 0);


        return circle;
    }


    //console.log(data);


    let planets = []
    let lastDistance = 500;
    const planetPlanetDistance = 200;
    let i = 0;

    data.forEach(function (object) {
        // Process each object here

        lastDistance += (Math.random() * planetPlanetDistance) + 100
        let planet = createRandomPlanet(lastDistance, i, 'projekt-' + object.id, object);
        planets.push(planet);
        scene.add(planet)

        const circleMesh = createCircle(lastDistance, 0x555555);
        circleMesh.name = "orbit-" + (i + 1)
        scene.add(circleMesh);
        i++;
    });


    return planets;
}

function loadScene() {
    console.log('loading scene');

    // ##################### Pregame ####################


    const stats = new Stats()
    if (systemParams.debugPlanets) {
        document.body.appendChild(stats.dom)
    }

    const SizeFaktor = 1

    const renderer = new THREE.WebGLRenderer();
    var body = document.body;

// Get the body's width and height
    var bodyWidth = body.offsetWidth;
    var bodyHeight = body.offsetHeight;

    console.log("Height: "+bodyHeight+" ; Width: "+bodyWidth)
    renderer.setSize(bodyWidth, bodyHeight);
    renderer.setPixelRatio(1.0);
    document.body.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.set(0, 0, 2500);

    if (systemParams.debugPlanets) {
        camera.position.z = 300;
        camera.position.x = -350;
        camera.position.y = -200;

    }

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass();
    bloomPass.threshold = 0;
    bloomPass.strength = 0.2;
    bloomPass.radius = 0;
    composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    // ##################### Content ####################


    //let stars = createTheSun(scene);
    let sun = createTheSun(scene);
    let planets = createThePlanets(scene);

    let maxSunDistance = 0;
    planets.forEach(planet => {
        // Get the sunDistance of the current planet
        const sunDistance = planet.userData.sunDistance;

        // Update maxSunDistance if sunDistance is higher
        if (sunDistance > maxSunDistance) {
            maxSunDistance = sunDistance;
        }
    });
    let stars = createTheStars(scene, maxSunDistance * 10)

    let rocket, rocketLight, fire, lightFire
    createRocket(scene, camera).then(function (rocketNew) {
        // Do something with the loaded rocket object
        rocket = rocketNew

        rocket.traverse(function (child) {
            if (child.name == "rocketLight") {
                rocketLight = child;
            }
        });

        rocket.position.set(-300, -300, 60);

        fire = createFire(scene, camera, rocket);
        //console.log(fire)

// Create a point light
        lightFire = new THREE.PointLight(0xffffff, 10000, 100); // Green light
        lightFire.position.set(0, -5, 0); // Set the position of the light

// Add the light to the ball
        rocket.add(lightFire);

    }).catch(function (error) {
        // Handle errors
    });

    camera.position.set(0, 0, 250);

// Create an AudioListener
    var listener = new THREE.AudioListener();
    camera.add(listener)

// Create an Audio object and load your music file
    var audioLoader = new THREE.AudioLoader();
    var audio = new THREE.Audio(listener);
    audioLoader.load('/scr/music/space-atmospheric-background-124841.mp3', function (buffer) {
        audio.setBuffer(buffer);
        audio.setLoop(true); // Set the music to loop
        audio.setVolume(0.3); // Adjust the volume (0.0 to 1.0)
        audio.pause(); // Start playing the music
    });

    var audioLoader2 = new THREE.AudioLoader();
    var audio2 = new THREE.Audio(listener);
    audioLoader2.load('/scr/music/spaceship-ambient-sfx-164114.mp3', function (buffer) {
        audio2.setBuffer(buffer);
        audio2.setLoop(true); // Set the music to loop
        audio2.setVolume(0.1); // Set the volume (customizable parameter)
        audio2.pause(); // Start playing the second music
    });

    // Get the button element
    var toggleButton = document.getElementById('toggleButton');
    var pauseButton = document.getElementById('pauseButton');

    // Function to toggle audio mute/unmute
    var muteIcon = document.getElementById('muteIcon');
    var unmuteIcon = document.getElementById('unmuteIcon');

    function toggleAudio() {
        // Check if audio is currently muted

        if (audio.isPlaying) {
            // If muted, unmute the audio
            audio.pause();
            audio2.pause();
            muteIcon.style.display = 'none';
            unmuteIcon.style.display = 'inline';
        } else {
            // If unmuted, mute the audio
            audio.play();
            audio2.play();
            muteIcon.style.display = 'inline';
            unmuteIcon.style.display = 'none';
        }
    }

    var playIcon = document.getElementById('playIcon');
    var pauseIcon = document.getElementById('pauseIcon');

    function toggleRendering() {
        if (paused) {
            paused = false;
            animate();
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'inline';
            var overlay = document.getElementById('overlay-pause');
            overlay.classList.remove('fade-in');
        } else {
            paused = true;
            playIcon.style.display = 'inline';
            pauseIcon.style.display = 'none';
            var overlay = document.getElementById('overlay-pause');
            overlay.classList.add('fade-in');
        }// Toggle the paused state
    }

    // Add click event listener to the button
    toggleButton.addEventListener('click', toggleAudio);
    pauseButton.addEventListener('click', toggleRendering);



    // ##################### Handling ####################

    // Arrow key handling
    document.addEventListener('keydown', (event) => {
        keyState[event.code] = true;
    });
    document.addEventListener('keyup', (event) => {
        keyState[event.code] = false;
    });


    renderer.domElement.addEventListener('click', checkClick, false)

    // ##################### Animation ####################

    let lastCameraPosition = new THREE.Vector3(0, 0, 0);
    let activePlanet = null;

    var clock = new THREE.Clock();

    // Function to move the camera to the position of the clicked object
    function checkClick(event) {
        // Calculate mouse coordinates in normalized device space (-1 to 1)
        //console.log("Start");
        //console.log(activePlanet);
        //console.log(lastCameraPosition);
        if ((activePlanet == null) && (!keyState['Space'])) {

            var raycaster = new THREE.Raycaster(); // create once
            var mouse = new THREE.Vector2(); // create once

            // Ich weiß nicht woher 1.73205, außer das es die Wurzel 3 ist, aber sie wird benötigt

            mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
            mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);

            // Check for intersections with the objects in the scene
            const intersects = raycaster.intersectObjects(planets);

            // If there's an intersection, move the camera to the position of the clicked object
            if (intersects.length > 0) {
                lastCameraPosition = camera.position.clone();

                let object = intersects[0].object;
                // Check if the object's name contains "clickable"
                if (object.name && object.name.includes("clickable")) {
                    // If the object's name contains "clickable", save its parent
                    activePlanet = object.parent;
                } else {
                    // If the object's name does not contain "clickable", save the original object
                    activePlanet = object;
                }

                activePlanet.userData.visited = true;

                const planetID = parseInt(activePlanet.name.split("-")[1]);
                // Retrieve the orbit object by its name
                const orbitObject = scene.getObjectByName("orbit-" + planetID);
                // Check if the orbit object is found
                if (orbitObject) {
                    // Orbit object found, you can use it here
                    orbitObject.material.color.set(0x111111);
                }

                updatePlanetText();
            }

        } else {

            activePlanet = null;
            updatePlanetText();

            if (won) {
                var overlay = document.getElementById('youWon');
                overlay.classList.add('fade-in');
                overlay.style.display = 'block'; // Show the overlay
                paused = true
                audio2.pause()
            }
        }


        //console.log(activePlanet);
        //console.log(lastCameraPosition);

    }

    function updatePlanetText() {

        if (activePlanet == null) {

            document.getElementById('overlay-planet').classList.add('overlay-hide');
        } else {

            let {title, status, link, description} = activePlanet.userData;
            document.getElementById('TL').textContent = `Project Planet: \n ${title}`;
            document.getElementById('TR').textContent = `STATUS: ${status}`;
            document.getElementById('BL').textContent = `${description}`;

            document.getElementById('overlay-planet').classList.remove('overlay-hide');

        }

    }

    let RocketPlanetSpeed = 0

    function animate() {

        //console.log(paused)

        function moveAndRotatePlanets() {

            sun.rotation['z'] += 0.001;
            planets.forEach((planet) => {
                // Get rotation speed and axis from userData
                let {rotationSpeed, rotationAxis, rotationPosition, sunDistance} = planet.userData;

                // Rotate the sphere based on the specified axis and speed
                for (let i = 0; i < rotationAxis.length; i++) {
                    const char = rotationAxis[i];
                    planet.rotation[char] += rotationSpeed;
                }
                const angle = (rotationPosition / 100) * Math.PI * 2;
                const newX = Math.cos(angle + 10) * sunDistance;
                const newY = Math.sin(angle + 10) * sunDistance;
                planet.position.set(newX, newY, 0);

                if (!systemParams.debugPlanets) {

                    planet.userData.rotationPosition += (10 / sunDistance);
                }

                var lightPosition = calcLightSourcePosition(sunDistance, planet);

                planet.material.uniforms.lightDirection.value.copy(lightPosition);

            });

            if (rocket) {

                const FireOffset = -6.5
                var pointPosition = new THREE.Vector3(0, FireOffset, 0);
                var pointDirection = new THREE.Vector3(0, -100, 0);
                var rotationZ = rocket.rotation.z;

                audio2.setVolume((rocket.velocity / rocket.maxVelocity) * 0.25);

                // Create a rotation matrix based on the rotationZ
                var rotationMatrix = new THREE.Matrix4().makeRotationZ(rotationZ);

                // Apply the rotation matrix to the point
                pointPosition.applyMatrix4(rotationMatrix);
                pointDirection.applyMatrix4(rotationMatrix);

                // Add the rotated point to the initial object's position to get the final point position
                rocket.firePosition = pointPosition.clone().add(rocket.position);
                rocket.fireDestination = pointDirection.clone().add(rocket.position);


                //console.log(rocket.velocity)

                if (rocket.velocity >= 0.1) {

                    // Create a direction vector pointing forward in the local coordinate system
                    var direction = new THREE.Vector3(0, 1, 0); // Assuming Z-axis is forward

                    // Apply the object's rotation to the direction vector
                    direction.applyQuaternion(rocket.quaternion);

                    // Adjust the object's position using the direction vector
                    // rocket.position.add(direction.multiplyScalar(0.1 * rocket.velocity));
                    var position = rocket.position.add(direction.multiplyScalar(0.1 * rocket.velocity)).clone()
                    moveOneUnitCloserToObject(rocket, new THREE.Vector3(position.x, position.y, 60), 0.01)


                    var raycaster = new THREE.Raycaster();

                    var direction = new THREE.Vector3(0, 0, -1);

                    raycaster.set(rocket.position, direction);

                    var intersects = raycaster.intersectObject(sun);

                    if (intersects.length > 0) {

                        var overlay = document.getElementById('youDied');
                        overlay.classList.add('fade-in');
                        overlay.style.display = 'block'; // Show the overlay
                        paused = true
                        audio2.pause()

                    }
                }

                if (rocketLight) {

                    let distance = distanceBetweenPointsXY(rocket.position, sun.position);

                    let theoreticalLightPosition = new THREE.Vector3();

                    theoreticalLightPosition.subVectors(sun.position, rocket.position);
                    theoreticalLightPosition.z = 0;

                    var rocketRotation = rocket.quaternion;
                    var inverseRocketRotation = rocketRotation.clone().conjugate();
                    theoreticalLightPosition.applyQuaternion(inverseRocketRotation);


                    rocketLight.position.copy(theoreticalLightPosition);
                    //console.log(rocketLight.position)


                    let distancePercentage = distance / maxSunDistance;

                    let light = 0;

                    if (distancePercentage <= 0.4) {

                        light = (((1 - distancePercentage) + 0.4) - 1) * 200 + 10;

                    } else {

                        light = (1 - (distancePercentage - 0.4)) * 10;

                    }

                    rocketLight.intensity = light;

                }

                if (lightFire) {
                    lightFire.intensity = 10000 * (rocket.velocity / rocket.maxVelocity)
                    //console.log(lightFire.intensity)
                }
            }


        }

        function moveCamera() {

            // Move camera based on arrow key input
            const speed = window.innerWidth / 500;

            if (keyState['Space']) {

                moveOneUnitCloserToObject(camera, new THREE.Vector3(0, 0, 2500), 0.01)

            } else if (rocket) {

                moveOneUnitCloserToObject(camera, new THREE.Vector3(rocket.position.x, rocket.position.y, 250), 0.02)

                if (keyState['Numpad8']) {
                    rocket.position.y += speed;
                }
                if (keyState['Numpad2']) {
                    rocket.position.y -= speed;
                }
                if (keyState['Numpad4']) {
                    rocket.position.x -= speed;
                }
                if (keyState['Numpad6']) {
                    rocket.position.x += speed;
                }
            }

        }

        function moveRocket() {

            rocket.rotation.y = valueTowards(rocket.rotation.y, 0)

            //console.log(rocket.position.z)
            if (keyState['ArrowUp'] || keyState['KeyW']) {
                rocket.increaseVelocity();
            }
            if (keyState['ArrowDown'] || keyState['KeyS']) {
                rocket.decreaseVelocity();
            }
            if (keyState['ArrowLeft'] || keyState['KeyA']) {
                let rotationSpeed = 0.012 - (0.01 * (rocket.velocity / rocket.maxVelocity))
                rocket.rotation['z'] += rotationSpeed;
            }
            if (keyState['ArrowRight'] || keyState['KeyD']) {
                let rotationSpeed = 0.012 - (0.01 * (rocket.velocity / rocket.maxVelocity))
                rocket.rotation['z'] -= rotationSpeed;
            }

        }

        function updateTextOverlay() {
            const visitedCount = planets.filter(planet => planet.userData.visited).length;
            const totalCount = planets.length;
            document.getElementById('text-planetNr').textContent = `${visitedCount} / ${totalCount} Planets visited`;

            if (visitedCount === totalCount) {
                won = true
            }
        }

        stats.begin();

        if (!paused) {

            requestAnimationFrame(animate);
        }

        var deltaTime = clock.getDelta();

        updateTextOverlay();

        moveAndRotatePlanets();

        if (activePlanet == null) {

            moveCamera();
            if (rocket && !keyState['Space']) {

                moveRocket();

                scaleObjectSlowly(rocket, 5);

            }

        } else {

            moveOneUnitCloserToObject(camera, new THREE.Vector3(activePlanet.position.x, activePlanet.position.y, activePlanet.userData.size * 2), 0.2)

            if (rocket) {

                rocket.decreaseVelocity()

                scaleObjectSlowly(rocket, 1);

                var orbitRadius = activePlanet.userData.size * 1.1; // Radius of the orbit circle
                var orbitSpeed = 0.001; // Speed of the orbit motion

                var angle = Date.now() * orbitSpeed; // Calculate angle based on time
                var orbitPosition = new THREE.Vector3(
                    Math.cos(angle) * orbitRadius, // X position
                    0,                              // Y position (assuming orbit is on the XZ plane)
                    Math.sin(angle) * orbitRadius  // Z position
                );

                //console.log(Math.cos(angle))
                rocket.rotation.set(
                    0,
                    (-1 * Math.acos(Math.cos(angle))) + Math.PI * 0.5,
                    Math.PI * 0.5
                )

                // Set the position of the orbiting object relative to the orbit center
                var newPosition = activePlanet.position.clone().add(orbitPosition)
                moveOneUnitCloserToObject(rocket, newPosition, RocketPlanetSpeed);

                RocketPlanetSpeed = RocketPlanetSpeed > 1 ? 1 : RocketPlanetSpeed + 0.0005;
                //console.log(RocketPlanetSpeed)
            }

        }


        if (fire) {
            fire.Step(deltaTime);
        }

        stats.update();
        composer.render();
    }

    // Events
    window.addEventListener('resize', () => {
        // Resize camera aspect ratio and renderer size to the new window size
        camera.aspect = window.innerWidth / window.innerHeight ;
        camera.updateProjectionMatrix();
        var body = document.body;

// Get the body's width and height
        var bodyWidth = body.offsetWidth;
        var bodyHeight = body.offsetHeight;

        console.log("Height: "+bodyHeight+" ; Width: "+bodyWidth)
        renderer.setSize(bodyWidth, bodyHeight);
    });

    animate();


    console.log('done');
}

function loadData() {

    fetch('/data.json')
        .then(response => {
            // Check if the request was successful
            if (!response.ok) {
                throw new Error('Failed to load JSON data');
            }
            // Parse the JSON response
            return response.json()

        })
        .then(jsonArray => {
            data = jsonArray;
            loadScene();
        })
        .catch(error => {
            console.error(error);
        });
}

window.onload = () => loadData();