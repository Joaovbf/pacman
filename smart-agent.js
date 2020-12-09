
const Player = (function (user,map,ghosts){

    var waitPlays = 0;
    const directions = {"UP": 3, "DOWN": 1, "RIGHT": 11, "LEFT": 2};
    const mapItems = {"WALL": 0,"BISCUIT": 1, "EMPTY": 2, "BLOCK": 3,"PILL": 4, "GHOST": 5 , "EATABLE_GHOST": 6};
    const directionsKeys = {"LEFT" : 37,"UP": 38,"RIGHT": 39,"DOWN": 40}

    function nextMove(directionsStatus,currentDir){
        let availableDir = [];
        let goodDir = [];
        let bestDir = null;
        let currentDirIsAvailable = false;
        //Getting the available directions
        for (let index in directionsStatus) {
            //it makes the player avoid walls, blocks and ghosts
            if (!(directionsStatus[index].item === mapItems.GHOST 
                || (directionsStatus[index].item === mapItems.WALL || directionsStatus[index].item === mapItems.BLOCK)
                && directionsStatus[index].distance == 0 || index == "clone")){
                    if (directions[index] == currentDir) currentDirIsAvailable = true;
                    availableDir.push(index);
            }
        }

        //Avoid to unnecessary changes of direction
        const allDirEmpty = availableDir.reduce((carry, direction) => {
            let status = directionsStatus[direction]
            return (status.item == mapItems.EMPTY 
                || status.item == mapItems.WALL && status.distance > 0)
                && carry;
        }, true)
        if(allDirEmpty && currentDirIsAvailable) {
            waitPlays = 3;
            return null;
        }

        //Getting good options
        for (const direction of availableDir) {
            if (directionsStatus[direction].item == mapItems.BISCUIT
                || directionsStatus[direction].item == mapItems.PILL
                || directionsStatus[direction].item == mapItems.EATABLE_GHOST){
                    if (directions[direction] == currentDir) return null;
                    goodDir.push(direction);
                }
        }

        //Getting the best option to make a Greedy choice
        for (const direction of goodDir) {
            if (directionsStatus[direction].item == mapItems.EATABLE_GHOST 
                || directionsStatus[direction].item == mapItems.PILL){
                    bestDir = direction;
                    break;
                }
            if(directionsStatus[bestDir]?.distance < directionsStatus[direction].distance)
                bestDir = direction;
        }

        if(bestDir) return bestDir;

        let sameDir = currentDir == 4/*NONE*/ ? ["UP", "DOWN", "RIGHT", "LEFT"] : (currentDir == directions.LEFT || currentDir == directions.RIGHT) ? 
            ["UP", "DOWN"] : ["RIGHT", "LEFT"];
        
        if (goodDir.length > 0){ 
            return goodDir[Math.floor(Math.random()*goodDir.length)] 
        } else {
            let intersection = availableDir.filter(x => sameDir.includes(x));
            waitPlays = 2;
            return intersection[Math.floor(Math.random()*intersection.length)] ?? availableDir[Math.floor(Math.random()*availableDir.length)]
        }
    }

    function getNextPos(position,direction) {
        let xInc = 0
            , yInc = 0

        if(direction === directions.UP)
            yInc--;
        else if(direction === directions.DOWN)
            yInc++;
        else if(direction === directions.RIGHT)
            xInc++;
        else if(direction === directions.LEFT)
            xInc--;

        return {
            x: position.x + xInc,
            y: position.y + yInc
        }
    }

    function getDirectionsStatus(){
        let directionsStatus = []
        const searchLength = 4
        let currentPos = user.getPosition()
        //Acquiring the ghosts and user position, fitted to the squared
        currentPos.x = Math.round(currentPos.x/10)
        currentPos.y = Math.round(currentPos.y/10)
        
        let ghostsPos = []
        for (const ghost of ghosts){
            let pos = ghost.getPosition()
            ghostsPos.push({
                x: Math.round(pos.x/10),
                y: Math.round(pos.y/10),
            })
        }
        const mustVerifyGhosts = ghostsPos.reduce((previous, current) => {
                return previous || current.x === currentPos.x || current.y === currentPos.y
            },false)
        
        //getting the status of directions
        for(let index in directions){
            let nextPos = currentPos
            let i = 0

            //search for ghosts in this direction
            if(mustVerifyGhosts){
                while (directionsStatus[index] == null && i < searchLength-2) {
                    nextPos = getNextPos(nextPos,directions[index])

                    for (let ghostIndex in ghostsPos) {
                        if (ghostsPos[ghostIndex].x === nextPos.x && ghostsPos[ghostIndex].y === nextPos.y){
                            directionsStatus[index] = {
                                "item" : ghosts[ghostIndex].getEatable() ? mapItems.EATABLE_GHOST : mapItems.GHOST,
                                "distance": i,
                            }
                            continue
                        }
                    }
                    i++
                }
            }

            nextPos = currentPos
            i = 0
            //search any item in this direction 
            while (directionsStatus[index] == null && i < searchLength) {
                nextPos = getNextPos(nextPos,directions[index])

                if(mustVerifyGhosts)
                    for (let ghostIndex in ghostsPos) {
                        if (ghostsPos[ghostIndex].x === nextPos.x && ghostsPos[ghostIndex].y === nextPos.y){
                            directionsStatus[index] = {
                                "item" : ghosts[ghostIndex].getEatable() ? mapItems.EATABLE_GHOST : mapItems.GHOST,
                                "distance": i,
                            }
                            continue
                        }
                    }
                let mapItem = map.getMap()[nextPos.y][nextPos.x]
                if (mapItem == mapItems.EMPTY) {
                    i++
                    continue
                }
                directionsStatus[index] = {
                    item     : mapItem,
                    distance : i
                }
                i++
            }
            //identifying an empty path
            if(directionsStatus[index] == null)
                directionsStatus[index] = {
                    item: mapItems.EMPTY,
                    distance: i-1
                }
        }

        return directionsStatus;
    }

    function play(){
        if (waitPlays > 0){
            waitPlays--;
            return;
        }
        let status = getDirectionsStatus();
        let nextDirection = nextMove(status,user.getDirection())
        var nextKey = directionsKeys[nextDirection]
        //console.log(status,nextDirection)
        if (nextKey)
            document.dispatchEvent(new KeyboardEvent('keydown',{'keyCode':nextKey}));
    }

    return {
        "play": play
    }
})
