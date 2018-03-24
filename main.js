let camera;
let scene;
let renderer;
let materialLoader;
let orbitcont;
let whiteBall;
let whiteBallX = -0.75;
let otherBalls = [];
let cueStick;
const prod = true;

window.addEventListener('load', () => {
    Physijs.scripts.worker = 'lib/physijs_worker.js';
    Physijs.scripts.ammo = './ammo.js';
    init();
    renderFrame();
});

function Position(x, y) {
    return { x, y }
}


function initLights() {
    const spotlight = new THREE.SpotLight(0xFFFFFF);
    spotlight.position.set(0, 50, 0);
    scene.add(spotlight);
}

function init() {
    scene = new Physijs.Scene();
    scene.setGravity(0, -10, 0);
    materialLoader = new THREE.MTLLoader();

    initCam();
    createRenderer();
    loadTable();

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
    createStick();
    initLights();
    window.addEventListener("keyup", event => {
        if (event.keyCode == 32) {
            event.preventDefault();
            console.log("SPACEBAR");
            //TODO allow rotation of impulse
            whiteBall.applyCentralImpulse(new THREE.Vector3(0.0001, 0, 0));
            cueStick.material.opacity = 0;
            cueStick.material.transparent = true;
        } else if (event.keyCode == 16) {
            event.preventDefault();
            console.log("SHIFT");
            cueStick.material.transparent = false;
        }
    }, false);

    window.addEventListener("keydown", event => {
        if (event.keyCode == 68) {
            console.log("rotating right");
            event.preventDefault();
            cueStick.rotation.z += Math.PI / 10;
            return false;
        } else if (event.keyCode == 65) {
            console.log("rotating left");
            event.preventDefault();
            cueStick.rotation.z -= Math.PI / 10;
            return false;
        }
    }, false)
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
    const bounciness = 0.5
    const friction = 0.5
    const tableBase = new Physijs.BoxMesh(
        new THREE.BoxGeometry(width, height, depth),
        Physijs.createMaterial(new THREE.MeshBasicMaterial({
            color: 0x005500,
            side: THREE.DoubleSide,
            transparent: prod,
            opacity: 0
        }), friction, 0),
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
                }), friction * 2, bounciness),
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
            }), friction, bounciness),
            0
        );
        border.position.set(i * width / 2 + (i == -1 ? -0.04 : 0.04), 0.95, 0);
        scene.add(border);
    }
}

function createBall(x, z, number) {
    let color = 0xffffff;
    switch (number) {
        case 1:
        case 9:
            color = 0xEEF200; //yellow
            break;
        case 2:
        case 10:
            color = 0x0000ff; //blue
            break;
        case 3:
        case 11:
            color = 0xff0000; //red
            break;
        case 4:
        case 12:
            color = 0x7900F2; //purple
            break;
        case 5:
        case 13:
            color = 0xF2B700; //orange
            break;
        case 6:
        case 14:
            color = 0x00ff00; //gren
            break;
        case 7:
        case 15:
            color = 0x900C3F; //marroon
            break;
        case 8:
            color = 0x000000; //black
            break;
        default: break;
    }
    console.log({ number, color });
    let radius = 0.02;
    let width = 32;
    let height = 32;
    let ball = new Physijs.SphereMesh(
        new THREE.SphereGeometry(radius, width, height),
        Physijs.createMaterial(new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide }), 0.5, 1),
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
    const radiusTop = 0.01;
    const radiusBottom = 0.02;
    const height = 1;
    const radialSegment = 32;

    const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegment);
    geometry.translate(0, -height / 2 - 0.02, 0);
    cueStick = new THREE.Mesh(
        geometry,
        Physijs.createMaterial(new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide }), 0, 1),
        0
    );
    cueStick.rotation.x = Math.PI / 2 + Math.PI / 4;
    cueStick.rotation.z = - Math.PI / 2;
    cueStick.position.y = 0.98;
    scene.add(cueStick);
}
function placeCueStickOnWhiteBall() {
    cueStick.position.x = whiteBall.position.x;
    cueStick.position.z = whiteBall.position.z;
}

function renderFrame() {

    requestAnimationFrame(renderFrame);
    if (whiteBall.position.y < 0.9) {
        scene.remove(whiteBall);
        whiteBall = createBall(whiteBallX, 0, 0);
    }
    otherBalls.forEach(b => {
        if (b.position.y < 0.9 && !b.removed) {
            b.removed = true;
            scene.remove(b);
        }
    });
    placeCueStickOnWhiteBall();
    orbitcont.update();
    scene.simulate();
    renderer.render(scene, camera);

}