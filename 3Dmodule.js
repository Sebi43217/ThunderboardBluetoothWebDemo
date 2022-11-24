import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'

var sens;
const views = [];
let scene, renderer;

function animate() {
    requestAnimationFrame(animate)
    if(sens){
        sens.rotation.x = sensXRotation;
        sens.rotation.y = sensYRotation;
        sens.rotation.z = sensZRotation;
    }
    views[0].render();
}

init();
animate();

//---------------------------------
function init() {

    const canvas1 = document.getElementById( 'canvas1' );


    views.push( new View( canvas1) );


    scene = new THREE.Scene()
    scene.add(new THREE.AxesHelper(5))
    const light = new THREE.PointLight()
    light.position.set(1.5, 1.5, 0.2)
    scene.add(light)
    const ambientLight = new THREE.AmbientLight()
    scene.add(ambientLight)

    const loader = new THREE.TextureLoader();
    const material = new THREE.MeshBasicMaterial({
        map: loader.load('./3D/Texture.jpg'),
    })

    const fbxLoader = new FBXLoader()

    fbxLoader.load(
        '3D/models/test.fbx',
        (object) => {
            sens = object;
            sens.traverse(function (child) {
                if (child.isMesh) {
                    child.material = material
                    if (child.material) {
                        child.material.transparent = false
                    }
                }
            })
            sens.scale.set(0.001, 0.001, 0.001)
            scene.add(sens)
            progressBar.style.display = 'none'
        },
        (xhr) => {
            if (xhr.lengthComputable) {
                var percentComplete = (xhr.loaded / xhr.total) * 100
                progressBar.value = percentComplete
                progressBar.style.display = 'block'
            }
        },
        (error) => {
            console.log(error)
        }
    )

    renderer = new THREE.WebGLRenderer( { antialias: true } )
    renderer.setSize(1000, 1000)
    renderer.setPixelRatio( 1) 
}

function View( canvas) {
    canvas.width = 1000;
	canvas.height = 1000;
    const context = canvas.getContext( '2d' );

    const camera = new THREE.PerspectiveCamera(75, 385 / 385, 0.1, 1000);
    camera.position.set(0.5, 0.5, 0.5)
    camera.rotation.set( 0, 0, 0)

    this.render = function () {
        camera.lookAt( 0, 0, 0);

        renderer.render( scene, camera );

        context.drawImage( renderer.domElement, 0, 0 );

    };

}