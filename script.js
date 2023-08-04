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

const light1 = new THREE.AmbientLight( 0xFFFFFF, 3 ); // soft white light
scene.add( light1 );

const light2 = new THREE.SpotLight()
light2.position.set(10, 20, 50)
scene.add(light2)

const light3 = new THREE.SpotLight()
light3.position.set(-10, -40, -10)
scene.add(light3)

const light4 = new THREE.SpotLight()
light4.position.set(10, 35, -50)
scene.add(light4)

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0xDAA520 } );
const cube = new THREE.Mesh( geometry, material );
//scene.add( cube );

var qty8 = document.getElementById("8qty");
var prio8 = document.getElementById("8qtyPriority");
var prio8out = document.getElementById("prio8out");

prio8out.innerHTML = prio8.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
prio8.oninput = function() {
  prio8out.innerHTML = this.value;
}

qty8.oninput = function() {
    prio8.max = this.value;
    prio8.value = 0;
    prio8out.innerHTML = prio8.value;
}

var qty12 = document.getElementById("12qty");
var prio12 = document.getElementById("12qtyPriority");
var prio12out = document.getElementById("prio12out");

prio12out.innerHTML = prio12.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
prio12.oninput = function() {
  prio12out.innerHTML = this.value;
}

qty12.oninput = function() {
    prio12.max = this.value;
    prio12.value = 0;
    prio12out.innerHTML = prio12.value;
}

var qty16 = document.getElementById("16qty");
var prio16 = document.getElementById("16qtyPriority");
var prio16out = document.getElementById("prio16out");

prio16out.innerHTML = prio16.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
prio16.oninput = function() {
  prio16out.innerHTML = this.value;
}

qty16.oninput = function() {
    prio16.max = this.value;
    prio16.value = 0;
    prio16out.innerHTML = prio16.value;
}

var qty24 = document.getElementById("24qty");
var prio24 = document.getElementById("24qtyPriority");
var prio24out = document.getElementById("prio24out");

prio24out.innerHTML = prio24.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
prio24.oninput = function() {
  prio24out.innerHTML = this.value;
}

qty24.oninput = function() {
    prio24.max = this.value;
    prio24.value = 0;
    prio24out.innerHTML = prio24.value;
}


// importing the path 
import assyPath from './asm.glb'
import slotPath from './slots.glb'
import feeder8Path from './feeder.glb'
import feeder12Path from './feeder.glb'
import feeder16Path from './feeder.glb'
import feeder24Path from './feeder.glb'

//load lumen
loader.load( assyPath, function ( gltf )
    {
        var part = gltf.scene;
        //part.scale.set(.1, .1, .1);
        part.position.y = 0; //-3
        part.position.x = -20; //-20
        part.rotation.x = 0;
        
        scene.add( part );
    }, undefined, function ( error ) {
        console.error( error );
    }
);

//load slots
loader.load( slotPath, function ( gltf )
    {
        var part = gltf.scene;
        //part.scale.set(.1, .1, .1);
        part.position.y = 0; //-3
        part.position.x = -20; //-20
        part.rotation.x = -1.5708;
        
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
    loader.load( feeder8Path, function ( gltf )
        {
            var part = gltf.scene;
            part.scale.set(.1, .1, .1);
            part.position.y = 1;
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

window.render12 = function(x, z, rotation){
    loader.load( feeder12Path, function ( gltf )
        {
            var part = gltf.scene;
            part.scale.set(.1, .1, .1);
            part.position.y = 1;
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

window.render16 = function(x, z, rotation){
    loader.load( feeder16Path, function ( gltf )
        {
            var part = gltf.scene;
            part.scale.set(.1, .1, .1);
            part.position.y = 1;
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

window.render24 = function(x, z, rotation){
    loader.load( feeder24Path, function ( gltf )
        {
            var part = gltf.scene;
            part.scale.set(.1, .1, .1);
            part.position.y = 1;
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
            render12(xPos, zPos, rotation)

            xPos = xPos + feederWidth + spacing;

        }
        else if(slotSolve[i] == 2){
            render16(xPos, zPos, rotation)

            xPos = xPos + feederWidth*2 + spacing*2;


        }
        else if(slotSolve[i] == 3){
            render24(xPos, zPos, rotation)

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