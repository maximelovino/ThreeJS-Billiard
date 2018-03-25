let camera;
let scene;
let renderer;
let materialLoader;
let orbitcont;
let whiteBall;
let whiteBallX = -0.75;
let otherBalls = [];
let stick;
let points = 0;
const rotationStep = Math.PI / 40;
const prod = true;
let infoDiv;

const ballFriction = 0.9;
const ballBounciness = 0.7;
const borderBounciness = 0.4;
const borderFriction = 0.2;
const tableFriction = 1;
const tableBounciness = 0;

window.addEventListener('load', () => {
    Physijs.scripts.worker = 'lib/physijs_worker.js';
    Physijs.scripts.ammo = './ammo.js';
    infoDiv = document.querySelector('#info');
    init();
    renderFrame();
});

function initLights() {
    const spotlight = new THREE.SpotLight(0xFFFFFF);
    spotlight.position.set(0, 300, 0);
    scene.add(spotlight);
}

function init() {
    scene = new Physijs.Scene();
    scene.setGravity(0, -10, 0);
    materialLoader = new THREE.MTLLoader();

    initCam();
    createRenderer();
    loadTable();

    createAllBalls();
    createStick();
    initLights();
    window.addEventListener("keyup", event => {
        if (event.keyCode == 32 && !stick.material.transparent) {
            event.preventDefault();
            console.log("SPACEBAR");
            const ballForce = new THREE.Vector3(Math.cos(stick.rotation.y) / 10000, 0, -Math.sin(stick.rotation.y) / 10000);
            whiteBall.applyCentralImpulse(ballForce);
            stick.material.opacity = 0;
            stick.material.transparent = true;
        } else if (event.keyCode == 16) { //shift to enable the stick
            event.preventDefault();
            console.log("SHIFT");
            enableStick();
        }
    });

    window.addEventListener("keydown", event => {
        if (event.keyCode == 68) { //d key
            console.log("rotating right");
            event.preventDefault();
            stick.rotation.y += rotationStep;
        } else if (event.keyCode == 65) { //a key
            console.log("rotating left");
            event.preventDefault();
            stick.rotation.y -= rotationStep;
        }
    })
}

function createAllBalls() {
    whiteBall = createBall(whiteBallX, 0, 0);

    let ballNumber = 1
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            if (j <= i) {
                otherBalls.push(createBall(0.5 + i * 0.05, j * 0.05 - i * 0.05 / 2, ballNumber));
                ballNumber++;
            }
        }
    }
}

function loadTable() {
    materialLoader.setPath('objs/');
    materialLoader.load('pool_table.mtl', (materials) => {
        materials.preload();
        let objLoader = new THREE.OBJLoader();
        objLoader.setPath('objs/');
        objLoader.setMaterials(materials);
        objLoader.load('pool_table.obj', (object) => {
            if (object instanceof THREE.Object3D) {
                object.traverse(function (mesh) {
                    if (!(mesh instanceof THREE.Mesh)) return;
                    mesh.material.side = THREE.DoubleSide;
                });
            }
            scene.add(object);
        })
    });
    const width = 2.25;
    const height = 0.1;
    const depth = 1.2;

    const tableBase = new Physijs.BoxMesh(
        new THREE.BoxGeometry(width, height, depth),
        Physijs.createMaterial(new THREE.MeshBasicMaterial({
            color: 0x005500,
            side: THREE.DoubleSide,
            transparent: prod,
            opacity: 0
        }), tableFriction, tableBounciness),
        0
    );
    tableBase.position.set(0, 0.90, 0);
    scene.add(tableBase);

    for (let i = -1; i <= 1; i += 2) {
        for (let j = -1; j <= 1; j += 2) {
            let border = new Physijs.BoxMesh(
                new THREE.BoxGeometry(width / 2 - width / 12, 0.3, height),
                Physijs.createMaterial(new THREE.MeshBasicMaterial({
                    color: 0x002200,
                    side: THREE.DoubleSide,
                    transparent: prod,
                    opacity: 0
                }), borderFriction, borderBounciness),
                0
            );

            border.position.set(i * width / 4 + (i == -1 ? 0.02 : -0.02), 0.95, j * depth / 2 + (j == 1 ? 0.02 : -0.02));
            scene.add(border);
        }
    }

    for (let i = -1; i <= 1; i += 2) {
        let border = new Physijs.BoxMesh(
            new THREE.BoxGeometry(height, 0.3, width / 2 - width / 11),
            Physijs.createMaterial(new THREE.MeshBasicMaterial({
                color: 0x002200,
                side: THREE.DoubleSide,
                transparent: prod,
                opacity: 0
            }), borderFriction, borderBounciness), 0);
        border.position.set(i * width / 2 + (i == -1 ? -0.04 : 0.04), 0.95, 0);
        scene.add(border);
    }
}

function colorForBall(number) {
    switch (number) {
        case 1:
        case 9:
            return 0xEEF200; //yellow
        case 2:
        case 10:
            return 0x0000ff; //blue
        case 3:
        case 11:
            return 0xff0000; //red
        case 4:
        case 12:
            return 0x7900F2; //purple
        case 5:
        case 13:
            return 0xF2B700; //orange
        case 6:
        case 14:
            return 0x00ff00; //gren
        case 7:
        case 15:
            return 0x900C3F; //marroon
        case 8:
            return 0x000000; //black
        default:
            return 0xffffff;
    }
}

function createBall(x, z, number) {
    let color = colorForBall(number);

    console.log({ number, color });
    let radius = 0.02;
    let width = 32;
    let height = 32;
    let ball = new Physijs.SphereMesh(
        new THREE.SphereGeometry(radius, width, height),
        Physijs.createMaterial(new THREE.MeshPhongMaterial({
            color: color,
            side: THREE.DoubleSide
        }), ballFriction, ballBounciness),
    );
    ball.position.set(x, 1, z);
    scene.add(ball);
    return ball;
}

function initCam() {
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10);
    camera.lookAt(scene.position)
    camera.position.set(0, 2, 2)
    orbitcont = new THREE.OrbitControls(camera);
    orbitcont.update()
}

function createRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
}

function createStick() {
    const radiusTop = 0.005;
    const radiusBottom = 0.02;
    const height = 1;
    const length = 30;

    const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, length);
    geometry.translate(0, -height / 2 - 0.02, 0);
    stick = new THREE.Mesh(
        geometry,
        Physijs.createMaterial(new THREE.MeshPhongMaterial({
            color: 0xA95200,
            side: THREE.DoubleSide
        }), 0, 1),
        0
    );
    if (!prod) {
        const sphereAxis = new THREE.AxesHelper(20);
        stick.add(sphereAxis);

    }
    stick.rotation.z = - Math.PI / 2 - Math.PI / 20;
    stick.position.y = 0.98;
    scene.add(stick);
}
function placeCueStickOnWhiteBall() {
    stick.position.x = whiteBall.position.x;
    stick.position.z = whiteBall.position.z;
}

function enableStick() {
    placeCueStickOnWhiteBall();
    stick.material.opacity = 100;
    stick.material.transparent = false;
}

function renderFrame() {
    requestAnimationFrame(renderFrame);
    if (whiteBall.position.y < 0.9) {
        scene.remove(whiteBall);
        whiteBall = createBall(whiteBallX, 0, 0);
        enableStick()
    }

    otherBalls.forEach(b => {
        if (b.position.y < 0.9 && !b.removed) {
            b.removed = true;
            scene.remove(b);
            points++;
        }
    });
    infoDiv.innerHTML = `Points: ${points}`;
    placeCueStickOnWhiteBall();
    orbitcont.update();
    scene.simulate();
    renderer.render(scene, camera);
}