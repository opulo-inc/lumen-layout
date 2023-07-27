window.global ||= window;

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import "./math.js"

var deletables = [];

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

// importing the path 
import assyPath from './asm.glb'
import feederPath from './feeder.glb'

loader.load( assyPath, function ( gltf )
    {
        var part = gltf.scene;
        part.scale.set(.1, .1, .1);
        part.position.y = -3;
        part.position.x = -20;
        part.rotation.x = -1.57;
        
        scene.add( part );
    }, undefined, function ( error ) {
        console.error( error );
    }
);

camera.position.z = 50;

window.removeObject = function(object){
    scene.remove(object);
    // object.geometry.dispose();
    // object.material.dispose();
    // object = undefined;
}

window.clearScene = function(){
    for(let i of deletables){
        removeObject(i);
    }
    deletables = [];
}

window.render8 = function(x, z, rotation){
    loader.load( feederPath, function ( gltf )
    {
        var part = gltf.scene;
        part.scale.set(.1, .1, .1);
        part.position.y = -2;
        part.position.z = z;
        part.position.x = x;
        //this is to make them upright
        part.rotation.x = 0;
        //this is to flip them facing the right direction
        part.rotation.y = rotation;
        
        scene.add( part );
        deletables.push(part);
    }, undefined, function ( error ) {
        console.error( error );
    }
);
}

window.addFeeders = function(slotSolve){

    //clear scene:
    clearScene();


    //this is how far over the first slot is mounted, effectively
    var startingX = -8;

    var xPos = startingX;
    var zPos = 1;
    var feederWidth = 1.5;
    var spacing = 0.02;
    var rotation = 1.57;

    for(let i = 0; i < slotSolve.length; i++){
        if(i == 25){
            zPos = -44;
            xPos = startingX;
            rotation = -1.57;
        }

        //if an 8mm feeder
        if(slotSolve[i] == 0){
            render8(xPos, zPos, rotation)

            xPos = xPos + feederWidth + spacing;

        }
        // if a 12mm feeder
        else if(slotSolve[i] == 1){
            ctx.fillStyle = "#FF3333";
            ctx.fillRect(xPos, yPos, feederWidth, feederHeight);

            xPos = xPos + feederWidth + spacing;

        }
        else if(slotSolve[i] == 2){
            ctx.fillStyle = "#33FF33";
            ctx.fillRect(xPos, yPos, (feederWidth*2)+spacing, feederHeight);

            xPos = xPos + feederWidth*2 + spacing*2;


        }
        else if(slotSolve[i] == 3){
            ctx.fillStyle = "#3333FF";
            ctx.fillRect(xPos, yPos, (feederWidth*2)+spacing, feederHeight);

            xPos = xPos + feederWidth*2 + spacing*2;


        }
        
        
    }

}

function animate() {
	requestAnimationFrame( animate );
    // part.rotation.x += 0.01;
    // part.rotation.y += 0.01;

    controls.update()
	renderer.render( scene, camera );
}

animate();