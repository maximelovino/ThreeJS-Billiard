let camera;
let scene;
let renderer;
let materialLoader;

window.addEventListener('load', () => {
    init();
    renderFrame();
});

function Position(x, y) {
    return {x, y}
}


function initLights() {
    const ambientLight = new THREE.AmbientLight(0xFFFFFF,10);
    scene.add(ambientLight);
}

function init() {
    scene = new THREE.Scene();
    materialLoader = new THREE.MTLLoader();

    initCam();
    createRenderer();
    loadTable();
    initLights();
}

function loadTable(){
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
                object.scale.x = object.scale.y = object.scale.z = 2;

            }
            scene.add(object);
        })
    });
}

function initCam() {
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
    camera.position.z = 1;
    let controls = new THREE.OrbitControls(camera);
}

function createRenderer() {
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
}

function renderFrame() {

    requestAnimationFrame(renderFrame);

    renderer.render(scene, camera);

}