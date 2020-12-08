
const Player = (function (user,map,ghosts){

    const directions = {"UP": 3, "DOWN": 1, "RIGHT": 11, "LEFT": 2};
    const mapItems = {"WALL": 0,"BISCUIT": 1, "EMPTY": 2, "BLOCK": 3,"PILL": 4, "GHOST": 5};
    const directionsKeys = {"LEFT" : 37,"UP": 38,"RIGHT": 39,"DOWN": 40}

    function nextMove(directionsStatus,currentDir){
        let availableDir = [];
        let bestDir = [];
        for (let index in directionsStatus) {
            if (!(directionsStatus[index].item === mapItems.GHOST ||
                directionsStatus[index].item === mapItems.WALL && directionsStatus[index].distance == 0)){
                if (directions[index] === currentDir) return null;
                availableDir.push(index);
            }
        }
        

        return bestDir.length > 0 
            ? bestDir[Math.floor(Math.random()*(bestDir.length-1))] 
            : availableDir[Math.floor(Math.random()*(availableDir.length-1))]
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
        const searchLength = 5
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

            //search in this direction any item
            while (directionsStatus[index] == null && i < searchLength) {
                nextPos = getNextPos(nextPos,directions[index])

                if(mustVerifyGhosts)
                    for (const ghost of ghostsPos) {
                        if (ghost.x === nextPos.x && ghost.y === nextPos.y){
                            directionsStatus[index] = {
                                "item" : mapItems["GHOST"],
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
        let status = getDirectionsStatus();
        var nextKey = directionsKeys[nextMove(status,user.getDirection())]
        if (nextKey)
            document.dispatchEvent(new KeyboardEvent('keydown',{'keyCode':nextKey}));
    }

    return {
        "play": play
    }
})
