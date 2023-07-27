// <canvas style="border: 2px solid black" id="canvas1" width="430" height="400"></canvas>
window.calculate = function () {

    // solution format 8mm powered array of locations, 12mm powered array of locations, 16mm powered array of locations, 24mm powered array of locations
    // 8mm strip, 12 strip, 16 strip, 24 strip, 32 strip, trays

    // ok, so first up, we need to know how many unique parts there are of each width, that are priority.
    // if we can't even get that many on a setup, non-priority ones dont matter, so we wont think about em yet.

    // we know that all prio feeders should be powered feeders. in order to have the most unique parts in powered feeders,
    // we start with feeders that are only 1u wide.

    // the solution here isnt just how many of each, but which slot as well. so we'll store which feeder type is in which slot
    // we'll fill an array of size 50 with either 8, 12, 16, 24, or - if it's a slot taken up by a 16 or 24.

    // if we get through all prio feeders and we still have space left,
    // we move to non-prio feeders and keep filling up the slots from the last index

        // at this point, if we finish non-prio, we're done

        // if we still don't finish non-prio, we move to strip feeders

    // if we fill up slots and still have prio, we move all prio to non-prio
    // then we fill non-prio into strip feeders
    
    var slotSolve = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
    var uSolve = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1];

    var slotCount = 50;

    var qty8 = document.getElementById('8qty').value;
    var qty12 = document.getElementById('12qty').value;
    var qty16 = document.getElementById('16qty').value;
    var qty24 = document.getElementById('24qty').value;

    var qty8P = document.getElementById('8qtyPriority').value;
    var qty12P = document.getElementById('12qtyPriority').value;
    var qty16P = document.getElementById('16qtyPriority').value;
    var qty24P = document.getElementById('24qtyPriority').value;

    var priority = [qty8P, qty12P, qty16P, qty24P];
    var nonPriority =[qty8 - qty8P, qty12 - qty12P, qty16 - qty16P, qty24 - qty24P];

    //var uniquePartCount = qty8 + qty12 + qty16 + qty24; 
    
    //totalSlotCount = total8SlotCount + total12SlotCount + total16SlotCount + total24SlotCount;

    var slotIndex = 0;

    console.log(priority);

    // first prioritized feeders
    for (let width = 0; width<priority.length; width++){
        // if the feeder width type we're on only takes up one slot
        console.log("processing feeder width " + width);
        if (width < 2){
            // for each feeder in this width
            for (let count = 0; count < priority[width]; priority[width]--){
                // if there are slots left
                if (slotIndex < slotCount){
                    slotSolve[slotIndex] = width;           // putting a 0 or 1 in slotSolve to indicate an 8 or 12mm
                    slotIndex = slotIndex + 1;              // incrementing the slot we're on
                }
                // if there aren't slots left
                else{
                    break;
                }

            }
            
        }
        // if the feeders take up two slots
        else{
            // for each feeder in this width
            for (let count = 0; count < priority[width]; priority[width]--){
                // if there are slots left
                if (slotIndex < slotCount){
                    slotSolve[slotIndex] = width;           // putting a 0 or 1 in slotSolve to indicate an 8 or 12mm
                    slotIndex = slotIndex + 1;              // incrementing the slot we're on
                    if(slotIndex != (26 || 51)){
                        slotSolve[slotIndex] = "-";             // adding a dash for the eaten slot by the wide feeder
                        slotIndex = slotIndex + 1;              // incrementing the slot we're on  
                    }                    
                }
                // if there aren't slots left
                else{
                    break;
                }

            }

        }
    }

    console.log("solution so far:" + slotSolve);
    console.log("remaining prio: " + priority);
    console.log("non-prio: " + nonPriority);

    // adding leftover prio to non-prio
    for (let i = 0; i<priority.length; i++){
        nonPriority[i] = nonPriority[i] + priority[i];
    }

    console.log("non-prio after adding remaining prio: " + nonPriority);

    // if slots are NOT filled, try to fill
    if(slotIndex < slotCount){
        //redo filling but with nonPrio
        for (let width = 0; width<nonPriority.length; width++){
            // if the feeder width type we're on only takes up one slot
            console.log("processing feeder width " + width);
            if (width < 2){
                // for each feeder in this width
                for (let count = 0; count < nonPriority[width]; nonPriority[width]--){
                    // if there are slots left
                    if (slotIndex < slotCount){
                        slotSolve[slotIndex] = width;           // putting a 0 or 1 in slotSolve to indicate an 8 or 12mm
                        slotIndex = slotIndex + 1;              // incrementing the slot we're on
                    }
                    // if there aren't slots left
                    else{
                        break;
                    }
    
                }
                
            }
            // if the feeders take up two slots
            else{
                // for each feeder in this width
                for (let count = 0; count < nonPriority[width]; nonPriority[width]--){
                    // if there are slots left
                    if (slotIndex < slotCount){
                        slotSolve[slotIndex] = width;           // putting a 0 or 1 in slotSolve to indicate an 8 or 12mm
                        slotIndex = slotIndex + 1;              // incrementing the slot we're on
                        if(slotIndex != (26 || 51)){
                            slotSolve[slotIndex] = "-";             // adding a dash for the eaten slot by the wide feeder
                            slotIndex = slotIndex + 1;              // incrementing the slot we're on   
                        }
                                           
                    }
                    // if there aren't slots left
                    else{
                        break;
                    }
    
                }
    
            }
        }
    }

    console.log("solution so far:" + slotSolve);
    console.log("remaining non-prio: " + nonPriority);


    // fill remaining into strips
    // ok, so we'll need a key of some sort deciding how many tapes of each width fit into what's effectively 1u of plate space
    // so, for a given 38mm 1u spacing, we can fit one 24mm, two 16, three 12, and four 8.
    // knowing how many U are available, we start assinging non-pro feeders to trays.
    // the trick is that before we can assign four 8mm tapes to a U, we need to assign an 8mm feeder to a U.
    // if there are only 3 8mm remaining, we're nuking 1/4 of a U.
    // we should optimize for how many unique feeders we can fit in each U.
    // so, start with 8, and if there are still 4, assign them. if there are three, assign them.
    // if there are two, check if there are three 12s, because that's a more efficient use of 1U.

    // we start with 8 because it's the most efficient at reducing total unique part count

    var partsPerU = [4, 3, 2, 1];
    var uIndex = 0;

    // for each tape width type
    for (let width = 0; width<nonPriority.length; width++){
        // if we still have another width coming after to optimize against
        console.log("about to process width: " + width);
        if(width < nonPriority.length - 1){
            // while there are still components of this width to allocate
            console.log("amount of tapes remaining of current width: " + nonPriority[width]);
            while(nonPriority[width] > 0){
                // if the most that can be allocated of the current feeder width is greater or equal to that of the next width
                console.log("current feeder width: " + width);
                console.log("best allocation of that width: " + Math.min(partsPerU[width], nonPriority[width]));
                console.log("best allocation of next width: " + Math.min(partsPerU[width+1], nonPriority[width+1]));
                if(Math.min(partsPerU[width], nonPriority[width]) >= Math.min(partsPerU[width+1], nonPriority[width+1])){
                    //if there are U left to allocate
                    if(uIndex < uSolve.length){
                        // marking down that we decided to allocate a U to the current
                        uSolve[uIndex] = width;
                        uIndex = uIndex + 1
                        // removing the amount of parts allocated
                        nonPriority[width] = nonPriority[width] - Math.min(partsPerU[width], nonPriority[width]);
                    }
                    else{
                        break;
                    }

                }
                // if next width feeder is a better use of U
                else{
                    if(uIndex < uSolve.length){
                        // marking down that we decided to allocate a U to the current
                        uSolve[uIndex] = width+1;
                        uIndex = uIndex + 1;
                        // removing the amount of parts allocated
                        nonPriority[width+1] = nonPriority[width+1] - Math.min(partsPerU[width+1], nonPriority[width+1]);
                    }
                    else{
                        break;
                    }

                }

            }
        }
        //just allocate the rest of what you got to remaining U, nothing left to optimize
        else{
            //while there are still feeders to allocate
            while(nonPriority[width] > 0){
                if(uIndex < uSolve.length){
                    // marking down that we decided to allocate a U to the current
                    uSolve[uIndex] = width;
                    uIndex = uIndex + 1
                    // removing the amount of parts allocated
                    nonPriority[width] = nonPriority[width] - Math.min(partsPerU[width], nonPriority[width]);
                }
            }
        }

    }

    console.log("final usolve: " + uSolve)
    console.log("remaining nonprio: " + nonPriority)


// DRAWING CANVAS FEEDERS
    if(false){

        //draw on canvas
        var c = document.getElementById("canvas1");
        var ctx = c.getContext("2d");

        //clearing canvas
        ctx.fillStyle = "#EEE";
        ctx.fillRect(0, 0, 410, 400);

        var startingX = 6;

        var xPos = startingX;
        var yPos = 333;
        var feederWidth = 14;
        var feederHeight = 60;
        var spacing = 2;


        for(let i = 0; i < slotSolve.length; i++){
            if(i == 25){
                yPos = 6;
                xPos = startingX;
            }

            //if an 8mm feeder
            if(slotSolve[i] == 0){
                ctx.fillStyle = "#DAA520";
                ctx.fillRect(xPos, yPos, feederWidth, feederHeight);

                xPos = xPos + feederWidth + spacing;


            }
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

    // DRAWING CANVAS STRIPS

        var xPos = startingX;
        var yPos = 200;
        var feederWidth = 30;
        var feederHeight = 50;
        var spacing = 2;

        for(let i = 0; i <= uSolve.length; i++){

        // not sure if we'll do a second row    
            // if(i == 25){
            //     yPos = 6;
            //     xPos = startingX;
            // }

            //if an 8mm feeder
            if(uSolve[i] == 0){
                ctx.fillStyle = "#DAA520";
                ctx.fillRect(xPos, yPos, feederWidth, feederHeight);

                xPos = xPos + feederWidth + spacing;


            }
            else if(uSolve[i] == 1){
                ctx.fillStyle = "#FF3333";
                ctx.fillRect(xPos, yPos, feederWidth, feederHeight);

                xPos = xPos + feederWidth + spacing;

            }
            else if(uSolve[i] == 2){
                ctx.fillStyle = "#33FF33";
                ctx.fillRect(xPos, yPos, feederWidth, feederHeight);

                xPos = xPos + feederWidth + spacing;


            }
            else if(uSolve[i] == 3){
                ctx.fillStyle = "#3333FF";
                ctx.fillRect(xPos, yPos, feederWidth, feederHeight);

                xPos = xPos + feederWidth + spacing;


            }
            
            
        }
    }

// DRAWING THREEJS

    if(true){
        window.addFeeders(slotSolve);

    }
    
}