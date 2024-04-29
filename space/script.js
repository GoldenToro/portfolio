import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module'
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {Atmosphere} from './atmosphere.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

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

    // Create a sphere geometry
    const geometryClickSphere = new THREE.SphereGeometry(size * material.uniforms.radius.value + 5, 32, 32);

    // Create a mesh with the geometry and material
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

function createRocket(scene) {

    let gltfLoader = new GLTFLoader();

    return new Promise((resolve, reject) => {
        gltfLoader.load(
            '/scr/objects/rocket/scene.gltf', // Path to your GLTF file
            // onLoad callback
            function (gltf) {

                var rocket = gltf.scene;

                rocket.position.set(0, 0, 500);

                rocket.scale.set(100, 100, 100); // Set scale factors (adjust as needed)

                // Add the object to the scene


                // Create a directional light
                var rocketLight = new THREE.DirectionalLight(0xffffff, 1);

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
    let sun = createPlanet("Sun-Center", materialSun, 0.0005, 'z', 0, 10);
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


    console.log(data);


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
        circleMesh.name = "orbit-" + i
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

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(2.0);
    document.body.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
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
    let stars = createTheStars(scene, maxSunDistance * 5)

    let rocket, rocketLight
    createRocket(scene).then(function (rocketNew) {
        // Do something with the loaded rocket object
        rocket = rocketNew

        rocket.traverse(function (child) {
            if (child instanceof THREE.DirectionalLight) {
                rocketLight = child;
            }
        });

    }).catch(function (error) {
        // Handle errors
    });

    console.log(rocket)
    camera.position.set(0, 0, maxSunDistance * 1.33);

    // ##################### Handling ####################

    // Arrow key handling
    const keyState = {};
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


    // Function to move the camera to the position of the clicked object
    function checkClick(event) {
        // Calculate mouse coordinates in normalized device space (-1 to 1)
        //console.log("Start");
        //console.log(activePlanet);
        //console.log(lastCameraPosition);
        if (activePlanet == null) {

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
            camera.position.set(lastCameraPosition.x, lastCameraPosition.y, lastCameraPosition.z);
            updatePlanetText();
        }


        console.log(activePlanet);
        //console.log(lastCameraPosition);

    }

    function updatePlanetText() {

        console.log("gothere");
        if (activePlanet == null) {

            document.getElementById('overlay-universe').classList.add('overlay-hide');
        } else {

            let {title, status, link, description} = activePlanet.userData;
            document.getElementById('TL').textContent = `Project Planet: \n ${title}`;
            document.getElementById('TR').textContent = `STATUS: ${status}`;
            document.getElementById('BL').textContent = `${description}`;

            document.getElementById('overlay-universe').classList.remove('overlay-hide');

        }

    }

    function animate() {

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

                rocket.rotation['y'] += 0.005;

                if (rocketLight) {

                    let distance = distanceBetweenPointsXY(rocket.position, sun.position);

                    let theoreticalLightPosition = new THREE.Vector3();

                    theoreticalLightPosition.subVectors(sun.position, rocket.position);
                    theoreticalLightPosition.z = 0;

                    var rocketRotation = rocket.quaternion;
                    var inverseRocketRotation = rocketRotation.clone().conjugate();
                    theoreticalLightPosition.applyQuaternion(inverseRocketRotation);

                    console.log(theoreticalLightPosition)

                    rocketLight.position.copy(theoreticalLightPosition);
                    //console.log(rocketLight.position)


                    let distancePercentage = distance / maxSunDistance;

                    let light = 0 ;

                    if  (distancePercentage <= 0.4) {

                        light = (((1 - distancePercentage) + 0.4) - 1) * 200 + 10;

                    } else {

                        light =( 1 - (distancePercentage - 0.4 ) ) * 10;

                    }

                    console.log(light)
                    rocketLight.intensity = light;

                }

            }


        }

        function moveCamera() {

            // Move camera based on arrow key input
            const speed = window.innerWidth / 500;
            if (keyState['Numpad8']) {
                camera.position.y += speed;
                rocket.position.y += speed;
            }
            if (keyState['Numpad2']) {
                camera.position.y -= speed;
                rocket.position.y -= speed;
            }
            if (keyState['Numpad4']) {
                camera.position.x -= speed;
                rocket.position.x -= speed;
            }
            if (keyState['Numpad6']) {
                camera.position.x += speed;
                rocket.position.x += speed;
            }
            if (keyState['NumpadSubtract']) {
                camera.position.z += speed * 10;
            }
            if (keyState['NumpadAdd']) {
                camera.position.z -= speed * 10;
            }

        }

        function updateTextOverlay() {
            const visitedCount = planets.filter(planet => planet.userData.visited).length;
            const totalCount = planets.length;
            document.getElementById('text-planetNr').textContent = `${visitedCount} / ${totalCount} Planets visited`;
        }

        stats.begin();

        requestAnimationFrame(animate);

        updateTextOverlay();

        moveAndRotatePlanets();

        if (activePlanet == null) {

            moveCamera();

        } else {

            camera.position.set(activePlanet.position.x, activePlanet.position.y, activePlanet.userData.size * 2)

        }

        stats.update();
        composer.render();
    }

    // Events
    window.addEventListener('resize', () => {
        // Resize camera aspect ratio and renderer size to the new window size
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
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