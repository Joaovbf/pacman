/**
 * A player who uses the Greedy Search as search strategy, 
 * looking to nearests map items in the four directions, without memory.
 * 
 * @param {*} user 
 * @param {*} map 
 * @param {*} ghosts 
 */
const UnreportedPlayer = (function (user,map,ghosts){

    var playCount = 0;
    var waitPlays = 0;
    const directions = {"UP": 3, "DOWN": 1, "RIGHT": 11, "LEFT": 2};
    const mapItems = {"WALL": 0,"BISCUIT": 1, "EMPTY": 2, "BLOCK": 3,"PILL": 4, "GHOST": 5 , "EATABLE_GHOST": 6};
    const directionsKeys = {"LEFT" : 37,"UP": 38,"RIGHT": 39,"DOWN": 40}

    function getPlayCount(){
        return playCount;
    }

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
        playCount++;
        let status = getDirectionsStatus();
        let nextDirection = nextMove(status,user.getDirection())
        var nextKey = directionsKeys[nextDirection]
        
        if (nextKey)
            document.dispatchEvent(new KeyboardEvent('keydown',{'keyCode':nextKey}));
    }

    return {
        "getPlayCount": getPlayCount,
        "play": play
    }
})

/**
 * 
 * @param {*} user 
 * @param {*} map 
 * @param {*} ghosts 
 */
const ReportedPlayer = (function (user,map,ghosts){

    var playCount = 0;
    var distancesMap;
    var waitPlays = 0;
    const directions = {"UP": 3, "DOWN": 1, "RIGHT": 11, "LEFT": 2};
    const mapItems = {"WALL": 0,"BISCUIT": 1, "EMPTY": 2, "BLOCK": 3,"PILL": 4, "GHOST": 5 , "EATABLE_GHOST": 6};
    const directionsKeys = {"LEFT" : 37,"UP": 38,"RIGHT": 39,"DOWN": 40}

    function getPlayCount(){
        return playCount;
    }

    function updateDistancesMap(map){
        distancesMap = map.map(row => row.map(mapItem => {
            if (mapItem == mapItems.WALL || mapItem == mapItems.BLOCK) return 0

            if (mapItem == mapItems.BISCUIT || mapItem == mapItems.PILL) return "*"
                
            return null
        }));
    }

    function getNeighborCells(position) {
        let neighbors = []
        for (let direction in directions) {
            neighbors[direction] = getNextPos(position,directions[direction])
            let instantMap = map.getMap()
            if (instantMap[neighbors[direction].y] && instantMap[neighbors[direction].y][neighbors[direction].x] == 0) delete neighbors[direction]
        }
        return neighbors
    }

    function nextMove(position, currentDir){
        let positionQueue = [];
        let foundFood = false;
        let newDirection;

        // let nearGhostsDirections = getDirectionOfNearestsGhosts(position)
        // if (nearGhostsDirections.length > 0){
        //     let fleeDirections = []
        //     for (const index in getNeighborCells(position)) {
        //         if (index == "clone") continue
        //         if (!nearGhostsDirections.includes(index)){ 
        //             if (directions[index] == currentDir) return null
        //             fleeDirections.push(index)
        //         }
        //     }
        //     waitPlays = 2
        //     return fleeDirections[Math.floor(Math.random()*fleeDirections.length-0.01)]
        // }

        //initializing queue
        let neighborCells = getNeighborCells(position)
        for (const index in neighborCells) {
            if (index == "clone") continue
            let mapItem = distancesMap[neighborCells[index].y][neighborCells[index].x]
            if(mapItem == "*"){
                foundFood = true
                newDirection = directions[index]
                break
            }
            distancesMap[neighborCells[index].y][neighborCells[index].x] = directions[index]
            positionQueue.push(neighborCells[index]);
        }

        while(positionQueue.length > 0 && !foundFood){
            position = positionQueue.shift();
            neighborCells = getNeighborCells(position)
            for (const index in neighborCells) {
                let mapItem = distancesMap[neighborCells[index].y][neighborCells[index].x]
                if(mapItem == "*"){
                    foundFood = true
                    newDirection = distancesMap[position.y][position.x]
                    break
                }
                else if(mapItem == null){
                    distancesMap[neighborCells[index].y][neighborCells[index].x] = distancesMap[position.y][position.x]
                    positionQueue.push(neighborCells[index])
                }
            }
        }
        
        //Converting integer value to string
        for (let index in directions){
            if (directions[index] == newDirection) newDirection = index
        }

        return newDirection;
    }

    function getOppositeDirection(direction){
        switch(direction){
            case directions.DOWN:
                return directions.UP;
            case directions.UP:
                return directions.DOWN;
            case directions.LEFT:
                return directions.RIGHT;
            case directions.RIGHT:
                return directions.LEFT;
        }
    }

    function getDirectionOfNearestsGhosts(position, direction = null, searchLength = 3){
        let ghostsPos = [];
        let ghostDirections = [];
        for (const ghost of ghosts) {
            const ghostPosition = ghost.getPosition()
            ghostPosition.x = Math.round(ghostPosition.x/10)
            ghostPosition.y = Math.round(ghostPosition.y/10)
            if (!ghost.getEatable())
                ghostsPos.push(ghostPosition)
        }

        if(searchLength == 0) return ghostDirections;

        let oppositeDirection = getOppositeDirection(direction)
        let neighborCells = getNeighborCells(position)
        let logDir = []
        for (const index in neighborCells) {
            //avoid the clone index and the original direction
            if (index == "clone" || directions[index] == oppositeDirection) continue
            logDir.push(index); 
            let countDirections = ghostDirections.length
            for (const ghostPos of ghostsPos) {
                if (neighborCells[index].x == ghostPos.x && neighborCells[index].y == ghostPos.y){
                    ghostDirections.push(index)
                    break
                }
            }
            if (countDirections == ghostDirections.length){
                let nextPos = getNextPos(neighborCells[index],directions[index])
                let nextDirections = getDirectionOfNearestsGhosts(nextPos,directions[index],searchLength-1)
                if (nextDirections.length > 0) ghostDirections.push(index)
            }
        }

        return ghostDirections;
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

    function play(){
        if (waitPlays > 0){
            waitPlays--;
            return;
        }
        playCount++;
        let position = user.getPosition()
        position.x = Math.round(position.x/10)
        position.y = Math.round(position.y/10)
        updateDistancesMap(map.getMap())
        let nextDirection = nextMove(position, user.getDirection())
        
        var nextKey = directionsKeys[nextDirection]
        
        if (nextKey)
            document.dispatchEvent(new KeyboardEvent('keydown',{'keyCode':nextKey}));
    }

    return {
        "getPlayCount": getPlayCount,
        "play": play
    }
})