import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.01, 2000 );
const loader = new GLTFLoader();

const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true
renderer.setSize( window.innerWidth, window.innerHeight );
document.getElementById('output').appendChild( renderer.domElement );

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

const light1 = new THREE.AmbientLight( 0xFFFFFF ); // soft white light
scene.add( light1 );

const light2 = new THREE.SpotLight()
light2.position.set(5, 5, 5)
scene.add(light2)

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0xDAA520 } );
const cube = new THREE.Mesh( geometry, material );
//scene.add( cube );

loader.load( './asm.glb', function ( gltf )
    {
        var part = gltf.scene;
        part.scale.set(.1, .1, .1);
        part.position.y = -3;
        part.position.x = -20;
        part.rotation.x = -1;
        
        scene.add( part );
    }, undefined, function ( error ) {
        console.error( error );
    }
);

camera.position.z = 50;

function animate() {
	requestAnimationFrame( animate );
    // part.rotation.x += 0.01;
    // part.rotation.y += 0.01;

    controls.update()
	renderer.render( scene, camera );
}

animate();