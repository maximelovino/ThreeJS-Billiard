let camera;
let scene;
let renderer;
let materialLoader;
let orbitcont;

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
    for (let i = 0; i < 16; i++) {
        createBall(-1 + 0.1 * i, 0, i)
    }
    initLights();
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
    const width = 2.4;
    const height = 0.1;
    const depth = 1.2;
    const bounciness = 0.5
    const tableBase = new Physijs.BoxMesh(
        new THREE.BoxGeometry(width, height, depth),
        Physijs.createMaterial(new THREE.MeshBasicMaterial({ color: 0x005500, side: THREE.DoubleSide, transparent: true, opacity: 0 }), 0, bounciness),
        0
    );
    tableBase.position.set(0, 0.90, 0);
    scene.add(tableBase);

    for (let i = -1; i <= 1; i += 2) {
        for (let j = -1; j <= 1; j += 2) {
            let border = new Physijs.BoxMesh(
                new THREE.BoxGeometry(width / 2 - width / 12, height, height),
                Physijs.createMaterial(new THREE.MeshBasicMaterial({
                    color: 0x002200,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0
                }), 0, bounciness),
                0
            );

            border.position.set(i * width / 4 + (i == -1 ? 0.02 : -0.02), 0.95, j * depth / 2 + (j == 1 ? 0.02 : -0.02));
            scene.add(border);
        }
    }

    for (let i = -1; i <= 1; i += 2) {
        let border = new Physijs.BoxMesh(
            new THREE.BoxGeometry(height, height, width / 2 - width / 11),
            Physijs.createMaterial(new THREE.MeshBasicMaterial({
                color: 0x002200,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0
            }), 0, bounciness),
            0
        );
        border.position.set(i * width / 2 + (i == -1 ? 0.04 : -0.04), 0.95, 0);
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
        Physijs.createMaterial(new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide }), 0, 1),
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

function renderFrame() {

    requestAnimationFrame(renderFrame);

    orbitcont.update();
    scene.simulate();
    renderer.render(scene, camera);

}