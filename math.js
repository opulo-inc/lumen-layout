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
    var qty32 = document.getElementById('32qty').value;

    var qty8P = document.getElementById('8qtyPriority').value;
    var qty12P = document.getElementById('12qtyPriority').value;
    var qty16P = document.getElementById('16qtyPriority').value;
    var qty24P = document.getElementById('24qtyPriority').value;
    var qty32P = document.getElementById('32qtyPriority').value;

    //var priority = [qty8P, qty12P, qty16P, qty24P];
    var priority = [qty8P, qty12P, qty16P, qty24P, qty32P];
    var nonPriority =[qty8 - qty8P, qty12 - qty12P, qty16 - qty16P, qty24 - qty24P, qty32 - qty32P];

    //var uniquePartCount = qty8 + qty12 + qty16 + qty24; 
    
    //totalSlotCount = total8SlotCount + total12SlotCount + total16SlotCount + total24SlotCount;

    var slotIndex = 0;

    console.log(priority);

    // this determines which widths are supported for powered feeders
    var supportedPoweredIndex = 2;

    // first prioritized feeders, limiting just to 8 and 24 for powered
    for (let width = 0; width<supportedPoweredIndex; width++){
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
        nonPriority[i] = parseInt(nonPriority[i]) + parseInt(priority[i]);
    }

    console.log("non-prio after adding remaining prio: " + nonPriority);

    // if slots are NOT filled, try to fill
    if(slotIndex < slotCount){
        //redo filling but with nonPrio
        for (let width = 0; width<supportedPoweredIndex; width++){
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
    // so, for a given 45mm 1u spacing, we can fit one 24mm, two 16, three 12, and three 8.
    // knowing how many U are available, we start assigning non-pro feeders to trays.
    // the trick is that before we can assign four 8mm tapes to a U, we need to assign an 8mm feeder to a U.
    // if there are only 3 8mm remaining, we're nuking 1/4 of a U.
    // we should optimize for how many unique feeders we can fit in each U.
    // so, start with 8, and if there are still 4, assign them. if there are three, assign them.
    // if there are two, check if there are three 12s, because that's a more efficient use of 1U.

    // we start with 8 because it's the most efficient at reducing total unique part count

    var partsPerU = [3, 3, 2, 1, 1];
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
                else{
                    break;
                }
            }
        }

    }

    console.log("final usolve: " + uSolve)
    console.log("remaining nonprio: " + nonPriority)

// NOTIFYING ABOUT PARTS NOT ALLOCATED

    if(nonPriority[0] != 0 || nonPriority[1] != 0 || nonPriority[2] != 0 || nonPriority[3] != 0 || nonPriority[4] != 0 ){
        // something's not allocated
        var message = "Not enough space for some tapes:\n";

        if(nonPriority[0] != 0){
            message = message + "8mm: " + nonPriority[0] + "\n";
        }
        if(nonPriority[1] != 0){
            message = message + "12mm: " + nonPriority[1] + "\n";
        }
        if(nonPriority[2] != 0){
            message = message + "16mm: " + nonPriority[2] + "\n";
        }
        if(nonPriority[3] != 0){
            message = message + "24mm: " + nonPriority[3] + "\n";
        }
        if(nonPriority[4] != 0){
            message = message + "32mm: " + nonPriority[4] + "\n";
        }
        alert(message);
    }



// DRAWING THREEJS

    if(true){
        window.addFeeders(slotSolve);
        window.addStrips(uSolve);

    }


// WRITING ORDER
    if(true){

        // finding powered feeder occurances
        var poweredOccurrences = { };
        for (var i = 0, j = slotSolve.length; i < j; i++) {
            poweredOccurrences[slotSolve[i]] = (poweredOccurrences[slotSolve[i]] || 0) + 1;
        }

        console.log(poweredOccurrences);
        console.log(poweredOccurrences['0']);

        if (isNaN(poweredOccurrences['0'])) poweredOccurrences['0'] = 0;
        if (isNaN(poweredOccurrences['1'])) poweredOccurrences['1'] = 0;
        if (isNaN(poweredOccurrences['2'])) poweredOccurrences['2'] = 0;
        if (isNaN(poweredOccurrences['3'])) poweredOccurrences['3'] = 0;

        // finding strip feeder occurances

        var stripOccurrences = { };
        for (var i = 0, j = uSolve.length; i < j; i++) {
            stripOccurrences[uSolve[i]] = (stripOccurrences[uSolve[i]] || 0) + 1;
        }

        console.log(stripOccurrences);
        console.log(stripOccurrences['0']);

        if (isNaN(stripOccurrences['0'])) stripOccurrences['0'] = 0;
        if (isNaN(stripOccurrences['1'])) stripOccurrences['1'] = 0;
        if (isNaN(stripOccurrences['2'])) stripOccurrences['2'] = 0;
        if (isNaN(stripOccurrences['3'])) stripOccurrences['3'] = 0;
        if (isNaN(stripOccurrences['4'])) stripOccurrences['4'] = 0;

        // generating new html

        var lumenID = "40225822965947";

        var feederURLbase = "https://www.opulo.io/products/feeder?variant=";
        var feeder8mmID = "44790609150139";
        var feeder12mmID = "44790609182907";


        var stripURLbase= "https://www.opulo.io/products/lumenpnp-strip-feeder?variant=";
        var strip8ID = "44789644132539";
        var strip12ID = "44789644198075";
        var strip16ID = "44789644230843";
        var strip24ID = "44789644263611";
        var strip32ID = "44789644296379";
        var stripAdjID = "44789644329147";

        var checkout = "https://index-machines.myshopify.com/cart/";
        checkout = checkout + lumenID + ":1,";
        checkout = checkout + feeder8mmID + ":" + Math.ceil(poweredOccurrences['0'] / 5) + ",";
        checkout = checkout + feeder12mmID + ":" + Math.ceil(poweredOccurrences['1'] / 5) + ",";

        checkout = checkout + strip8ID + ":" + stripOccurrences['0'] + ",";
        checkout = checkout + strip12ID + ":" + stripOccurrences['1'] + ",";
        checkout = checkout + strip16ID + ":" + stripOccurrences['2'] + ",";
        checkout = checkout + strip24ID + ":" + stripOccurrences['3'] + ",";
        checkout = checkout + strip32ID + ":" + stripOccurrences['4'];

        var order = document.getElementById("order");

        order.innerHTML=`
        <div id="powered-result">
            <h3>Powered Feeders Required</h3>
            <p><a target='_blank' href='https://www.opulo.io/products/feeder?variant=44790609150139'>8mm 5-Packs</a>: ` + Math.ceil(poweredOccurrences['0'] / 5) + `</p>
            <p><a target='_blank' href='https://www.opulo.io/products/feeder?variant=44790609182907'>12mm 5-Packs</a>: ` + Math.ceil(poweredOccurrences['1'] / 5) + `</p>
        </div>

        <div id="strip-result">
            <h3>Strip Feeders Required</h3>
            <div id="strip-half-1">
                <p><a target='_blank' href='` + stripURLbase + strip8ID + `'>8mm</a>: ` + stripOccurrences['0'] + `</p>
                <p><a target='_blank' href='` + stripURLbase + strip12ID + `'>12mm</a>: ` + stripOccurrences['1'] + `</p>
                <p><a target='_blank' href='` + stripURLbase + strip16ID + `'>16mm</a>: ` + stripOccurrences['2'] + `</p> 
            </div>
            <div id="strip-half-2">
                <p><a target='_blank' href='` + stripURLbase + strip24ID + `'>24mm</a>: ` + stripOccurrences['3'] + `</p>
                <p><a target='_blank' href='` + stripURLbase + strip32ID + `'>32mm</a>: ` + stripOccurrences['4'] + `</p> 
            </div>
        </div>
        
        
        <a target='_blank' href='` + checkout + `'><button>Add to Cart</button></a>
        `;      
            
    }
    
}