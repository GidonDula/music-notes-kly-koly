const characterSelection = document.getElementById("character-selection");
let selectedCharacter;
let playerCharacter;
let currentColor;
let countMusicalNotesDroped = 0;
let loosing = false;
let winning = false;

const sounds = ["do-1", "re", "mi", "fa", "sol", "la", "ci", "do-2"];

// const selectYourCharacter = () => {
//   selectedCharacter = document.getElementById("select-char").value;
//   playerCharacter = document.getElementById("player-character");
//   if (selectedCharacter === "boy") {
//     playerCharacter.src = "music-notes-kly-kply/klyKoly-boys.png";
//   } else {
//     playerCharacter.src = "music-notes-kly-kply/klyKoly-girls.png";
//   }
//   playerCharacter.style.width = "350px";
//   playerCharacter.style.height = "350px";
// };

window.onload = function () {
  //characterSelection.style.display = "none";
  //getting the canvas and the context
  let canvas = document.getElementById("viewport");
  let context = canvas.getContext("2d");

  //Timing and frames per second
  let lastFrame = 0;
  let fpsTime = 0;
  let framecount = 0;
  let fps = 0;
  let initialized = false;

  const bubbleSize = 70;
  //level
  let level = {
    x: 4, //x position
    y: 83, // bubble distance from top
    width: 0, //width gets calculated
    height: 0, //height gets calculated
    colums: 10, //number of tiled colums
    rows: 10, //number of tiled rows
    tileWidth: bubbleSize, //visual width of a tile
    tileheight: bubbleSize, //visual height of a tile
    rowHeight: 70, //height of a row
    radius: bubbleSize / 2, //bubble colision radius
    tiles: [], //two dimensional tile array
  };

  let Tile = function (x, y, type, shift) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.removed = false;
    this.shift = shift;
    this.velocity = 0;
    this.alpha = 1;
    this.procseeed = false;
  };

  let player = {
    x: 0,
    y: 0,
    angle: 0,
    tileType: 0,
    buble: {
      x: 0,
      y: 0,
      angle: 0,
      speed: 1000,
      dropspeed: 900,
      tileType: 0,
      visible: false,
    },
    nextBuble: {
      x: 0,
      y: 0,
      tileType: 0,
    },
  };

  let neighborsOffsets = [
    [
      [1, 0],
      [0, 1],
      [-1, 1],
      [-1, 0],
      [-1, -1],
      [0, -1],
    ], //even row tiles
    [
      [1, 0],
      [1, 1],
      [0, 1],
      [-1, 0],
      [0, -1],
      [1, -1],
    ],
  ]; //odd row tiles
  //number of diffrent colors-for us
  let bublecolors = 8;

  let musicalNotes = 13;

  let gameStates = {
    init: 0,
    ready: 1,
    shotbuble: 2,
    removeCluster: 3,
    gameOver: 4,
    winning: 5,
  };

  let gameState = gameStates.init;

  let score = 0;
  let turnCounter = 0;
  let rowOffset = 0;
  //animation variables
  let animationState = 0;
  let animationTime = 0;
  let showCluster = false;
  let cluster = [];
  let floatingClusters = [];

  let images = [];

  const folderName = "assets";
  let Images = [
    `${folderName}/Sol do1 key-modified.png`,
    `${folderName}/Sol re key-modified.png`,
    `${folderName}/Sol mi key-modified.png`,
    `${folderName}/Sol fa key-modified.png`,
    `${folderName}/Sol sol key-modified.png`,
    `${folderName}/Sol La Key-modified.png`,
    `${folderName}/Sol ci key-modified.png`,
    `${folderName}/Sol do2key-modified.png`,
  ];

  let do1Ball = document.getElementById("do1 ball");
  let reBall = document.getElementById("re ball");
  let miBall = document.getElementById("mi ball");
  let faBall = document.getElementById("fa ball");
  let solBall = document.getElementById("sol ball");
  let laBall = document.getElementById("la ball");
  let ciBall = document.getElementById("ci ball");
  let do2Ball = document.getElementById("do2 ball");
  let redBall = document.getElementById("red-ball");
  let blueBall = document.getElementById("blue-ball");
  let yellowBall = document.getElementById("yellow-ball");
  let greenBall = document.getElementById("green-ball");
  let pupleBall = document.getElementById("purple-ball");

  let bubleImage;
  let loadCount = 0;
  let loadTotal = 0;
  let preloaded = false;

  function loadImages(imageFiles) {
    loadCount = 0;
    loadTotal = imageFiles.length;
    preloaded = false;
    let loadedImages = [];

    for (let i = 0; i < imageFiles.length; i++) {
      let image = new Image();
      image.onload = function () {
        loadCount++;
        if (loadCount == loadTotal) {
          preloaded = true;
        }
      };
      image.src = imageFiles[i];
      loadedImages[i] = image;
    }
    return loadedImages;
  }
  //initialze the game
  function init() {
    //images = loadImages(["https://github.com/GidonDula/music-notes-kly-kply/blob/main"]);
    images = loadImages(Images);
    bubleImage = images[0];
    //add mouse events
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);

    //initialize the two dimensional tile array
    for (let i = 0; i < level.colums; i++) {
      level.tiles[i] = [];
      for (let j = 0; j < level.rows; j++) {
        //define a tile type and a shift parameter for animation
        level.tiles[i][j] = new Tile(i, j, 0, 0);
      }
    }
    //console.log(level.tiles);
    level.width = level.colums * level.tileWidth + level.tileWidth / 2;
    level.height = (level.rows - 1) * level.rowHeight + level.tileheight;
    //console.log(level.width, level.height);
    //init the player
    player.x = level.x + level.width / 2 - level.tileWidth / 2;
    player.y = level.y + level.height;

    player.angle = 90;
    player.tileType = 0;
    player.nextBuble.x = player.x - 2 + level.tileWidth;
    player.nextBuble.y = player.y;

    //New game
    newGame();
    //enter main loop
    main(0);
  }

  function main(tframe) {
    //Request animatiopn frames
    window.requestAnimationFrame(main);
    if (!initialized) {
      //preloadere clear the canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
      //draw the frame
      //drawFrame();
      let loadPrecentage = loadCount / loadTotal;
      context.strokeStyle = "#56c204";
      context.lineWidth = 3;
      context.strokeRect(18.5, 0.5 + canvas.height - 51, canvas.width - 37, 32);
      context.fillStyle = "#56c204";
      context.fillRect(
        18.5,
        0.5 + canvas.height - 51,
        loadPrecentage * (canvas.width - 37),
        32
      );
      //draw the progress text
      let loadText = "loaded" + loadCount + "/" + loadTotal + "Images";
      context.fillStyle = "#000000";
      context.font = "16px Verdana";
      context.fillText(loadText, 18, 0.5 + canvas.height - 63);
      if (preloaded) {
        setTimeout(function () {
          initialized = true;
        }, 1000);
        //preloaded = false;
      }
    } else {
      //update and render the game
      update(tframe);
      render();
    }
  }

  function update(tframe) {
    let dt = (tframe - lastFrame) / 1000;
    lastFrame = tframe;
    //update the fps counter
    updateFps(dt);
    if (gameState == gameStates.ready) {
      //game is ready for player input
    } else if (gameState == gameStates.shotbuble) {
      //buble is moving
      stateShootBuble(dt);
    } else if (gameState == gameStates.removeCluster) {
      //remove cluster and droup tiles
      stateRemoveCluster(dt);
    }
  }

  function setGamestate(newgamestate) {
    gameState = newgamestate;
    animationState = 0;
    animationTime = 0;
  }

  function stateShootBuble(dt) {
    //buble is moving
    //move the buble in the direction of the mouse
    console.log("shooting the buble");
    document.getElementById("buble-move").play();

    // moves bubble
    player.buble.x +=
      dt * player.buble.speed * Math.cos(degToRad(player.buble.angle));
    player.buble.y +=
      dt * player.buble.speed * -1 * Math.sin(degToRad(player.buble.angle));

    //handle left and right colisions with the level
    if (player.buble.x <= level.x) {
      //left edge
      console.log("left edge");
      player.buble.angle = 180 - player.buble.angle;
      player.buble.x = level.x;
    } else if (player.buble.x + level.tileWidth >= level.x + level.width) {
      //right edge
      console.log("right edge");
      player.buble.angle = 180 - player.buble.angle;
      player.buble.x = level.x + level.width - level.tileWidth;
    }

    //colisions width the top of the level
    if (player.buble.y <= level.y) {
      //top colision
      console.log("top colision");
      player.buble.y = level.y;
      snapBubbleToGrid(); //ניפוץ בועה
      return;
    }
    //colisions with other tiles
    for (let i = 0; i < level.colums; i++) {
      for (let j = 0; j < level.rows; j++) {
        let tile = level.tiles[i][j];
        //skip empty tiles
        if (tile == undefined || tile.type < 0) {
          continue;
        }
        //check for intersections
        let coord = getTileCoordinate(i, j);
        if (
          circleIntersection(
            player.buble.x + level.tileWidth / 2,
            player.buble.y + level.tileheight / 2,
            level.radius,
            coord.tileX + level.tileWidth / 2,
            coord.tileY + level.tileheight / 2,
            level.radius
          )
        ) {
          //intersection with a level buble
          console.log("circle intersection");
          snapBubbleToGrid();
          return;
        }
      }
    }
    let tempTiles = [];
    let tilesMoveUp = false;
    for (let i = 0; i < level.colums; i++) {
      tempTiles[i] = [];
      for (let j = 0; j < level.rows; j++) {
        tempTiles[i][j] = new Tile(i, j, level.tiles[i][j].type, 0);
        if (j > 0) {
          let tile1 = tempTiles[i][j - 1];
          let tile2 = tempTiles[i][j];
          if (tile1.type < 0 && tile2.type > 0) {
            tilesMoveUp = true;
            let tempType = tile1.type;
            tile1.type = tile2.type;
            tile2.type = tempType;
            drawBuble(i, j - 1, tile1.type);
          }
        }
      }
    }
    if (tilesMoveUp) {
      level.tiles = tempTiles;
    }
    console.log(player);
    console.log(level.tiles);
  }

  function stateRemoveCluster(dt) {
    let yOffset = level.tileheight / 2;
    document.getElementById("buble-pop").play();
    if (animationState == 0) {
      resetRemoved();
      for (let i = 0; i < cluster.length; i++) {
        //set the removed flag
        cluster[i].removed = true;
      }
      //Add cluster score
      score += cluster.length * 100;
      console.log(cluster);
      console.log(cluster.length);
      console.log(player.tileType);
      if (player.tileType < 8) {
        if (loosing == false) {
          currentColor = player.tileType;
          const sound = sounds[currentColor];
          console.log({ currentColor, sound });
          document.getElementById(sound)?.play();
        }
        //countMusicalNotesDroped++;
        //console.log(countMusicalNotesDroped);
        // if (countMusicalNotesDroped >= 3) {
        //   nextBuble();
        //   document.getElementById("winning").play();
        //   setGamestate(gameStates.winning);
        // }
      }
      //find floating clusters
      floatingClusters = findFloatingClusters();
      if (floatingClusters.length > 0) {
        //setup drop animation
        for (let i = 0; i < floatingClusters.length; i++) {
          for (let j = 0; j < floatingClusters[i].length; j++) {
            let tile = floatingClusters[i][j];
            tile.shift = 0;
            tile.shift = 1;
            tile.velocity = player.buble.dropspeed;
            score += 100;
          }
        }
      }
      animationState = 1;
    }
    if (animationState == 1) {
      //pop bubles
      let tilesleft = false;
      for (let i = 0; i < cluster.length; i++) {
        let tile = cluster[i];
        if (tile.type >= 0) {
          tilesleft = true;
          //alpha animations
          tile.alpha -= dt * 15;
          if (tile.alpha < 0) {
            tile.alpha = 0;
          }
          if (tile.alpha == 0) {
            tile.type = -1;
            tile.alpha = 1;
          }
        }
      }
      //drop bubles
      for (let i = 0; i < floatingClusters.length; i++) {
        for (let j = 0; j < floatingClusters[i].length; j++) {
          let tile = floatingClusters[i][j];
          if (tile.type >= 0) {
            tilesleft = true;
            tile.velocity += dt * 700;
            tile.shift += dt * tile.velocity;
            //alpha animation
            tile.alpha -= dt * 8;
            if (tile.alpha < 0) {
              tile.alpha = 0;
            }
            //check if the bubels are past the bottom of the level
            if (
              tile.alpha == 0 ||
              tile.y * level.rowHeight + tile.shift >
                (level.rows - 1) * level.rowHeight + level.tileheight
            ) {
              tile.type = -1;
              tile.shift = 0;
              tile.alpha = 1;
            }
          }
        }
      }

      if (!tilesleft) {
        //next buble
        nextBuble();
        //check for game over
        let tilefound = false;
        for (let i = 0; i < level.colums; i++) {
          for (let j = 0; j < level.rows; j++) {
            if (level.tiles[i][j].type != -1) {
              tilefound = true;
              break;
            }
          }
        }
        if (tilefound) {
            if (checkWinningTheGame()) {
            setGamestate(gameStates.winning);
          } else {
            setGamestate(gameStates.ready);
          }
        } else {
          //no tiles left game over
          setGamestate(gameStates.gameOver);
        }
      }
    }
  }
  //snap buble to the grid
  function snapBubbleToGrid() {
    //get the grid position
    console.log("snapping the buble");

    let centrex = player.buble.x + level.tileWidth / 2;
    let centery = player.buble.y + level.tileheight / 2;
    let gridpos = getGridPosition(centrex, centery);
    console.log("centrex", centrex);
    console.log("centery", centery);
    console.log("gridpos", gridpos);
    if (
      player.y > level.y &&
      gridpos.y < level.rows &&
      gridpos.x < level.colums &&
      level.tiles[gridpos.x][gridpos.y + 1] != undefined &&
      level.tiles[gridpos.x][gridpos.y + 1].type == -1
    ) {
      console.log("floating bubble", player.buble.tileType);
      gridpos = getGridPosition(centrex, centery - level.tileheight / 2);
    }
    //make shure the gridposition is valid
    if (gridpos.x < 0) {
      gridpos.x = 0;
    }
    if (gridpos.x >= level.colums) {
      gridpos.x = level.colums - 1;
    }

    if (gridpos.y < 0) {
      gridpos.y = 0;
    }

    if (gridpos.y >= level.rows) {
      gridpos.y = level.rows - 1;
    }
    //check if the tile is empty
    let shouldAddTile = false;
    if (level.tiles[gridpos.x][gridpos.y].type != -1) {
      console.log(level.tiles[gridpos.x][gridpos.y].type);
      //tile is not empty shift the new tile downwords
      for (let newrow = gridpos.y + 1; newrow < level.rows; newrow++) {
        if (level.tiles[gridpos.x][newrow].type == -1) {
          gridpos.y = newrow;
          shouldAddTile = true;
          break;
        }
      }
    } else {
      shouldAddTile = true;
    }

    console.log("shouldAddTile", shouldAddTile);
    //add the tile to the grid
    if (shouldAddTile) {
      console.log("adding tile");
      //hide the player buble
      player.buble.visible = false;
      //set the tile
      level.tiles[gridpos.x][gridpos.y].type = player.buble.tileType;
      //check for game over
      if (checkGameOver() || checkWinningTheGame()) {
        return;
      }
      //find clusters
      cluster = findCluster(gridpos.x, gridpos.y, true, true, false);
      if (cluster.length > 3) {
        console.log("changing to remove cluster", cluster);
        //remove the cluster
        setGamestate(gameStates.removeCluster);
        return;
      }
    }
    //no clusters found
    turnCounter++;
    if (turnCounter >= 5) {
      //add a row of a bubels
      addBubbles();
      turnCounter = 0;
      rowOffset = (rowOffset + 1) % 2;
      if (checkGameOver() || checkWinningTheGame()) {
        return;
      }
    }
    //next buble
    nextBuble();
    setGamestate(gameStates.ready);
  }

  function checkWinningTheGame() {
    let hasmusicNotes = false;
    for (let i = 0; i < level.colums; i++) {
      for (let j = 0; j < level.rows; j++) {
        if (level.tiles[i][j].type >= 0 && level.tiles[i][j].type <= 7) {
          hasmusicNotes = true;
        }
      }
    }
    if (hasmusicNotes == false) {
      nextBuble();
      winning = true;
      document.getElementById("winning").play();
      setGamestate(gameStates.winning);
      return true;
    } else {
      return false;
    }
  }

  function checkGameOver() {
    //check for game over
    for (let i = 0; i < level.colums; i++) {
      //check if there are bubels in the buttom row
      if (level.tiles[i][level.rows - 1].type != -1) {
        nextBuble();
        loosing = true;
        document.getElementById("loosing").play();
        setGamestate(gameStates.gameOver);
        return true;
      }
    }
    return false;
  }

  function addBubbles() {
    //move the rows downwords
    for (let i = 0; i < level.colums; i++) {
      for (let j = 0; j < level.rows - 1; j++) {
        level.tiles[i][level.rows - 1 - j].type =
          level.tiles[i][level.rows - 1 - j - 1].type;
      }
    }

    //add a new row of bubels at the top
    for (let i = 0; i < level.colums; i++) {
      level.tiles[i][0].type = Math.floor(Math.random() * 5) + bublecolors;
      if (level.tiles[i][0].type == 7) {
        level.tiles[i][0].type++;
      }
    }
  }

  //find the remaining colors
  function findColors() {
    let foundColors = [];
    let colorTable = [];
    for (let i = 0; i < musicalNotes; i++) {
      colorTable.push(false);
    }
    //check all tiles
    for (let i = 0; i < level.colums; i++) {
      for (let j = 0; j < level.rows; j++) {
        let tile = level.tiles[i][j];
        if (tile.type >= 0) {
          if (!colorTable[tile.type]) {
            colorTable[tile.type] = true;
            foundColors.push(tile.type);
          }
        }
      }
    }
    return foundColors;
  }
  //find clusters at the specified tile location
  function findCluster(tx, ty, matchType, reset, skipRemoved) {
    //reset the processed flags
    if (reset) {
      resetProcesed();
    }
    //get the target tile, tile cord must be valid
    let targetTile = level.tiles[tx][ty];
    //initialize the top procsess array with the specified tile
    let topProcess = [targetTile];
    targetTile.procseeed = true;
    let foundCluster = [];
    while (topProcess.length > 0) {
      //pop the last element from the array
      let currentTile = topProcess.pop();
      //skip processed and empty tiles
      if (currentTile.type == -1) {
        continue;
      }
      //skip tiles with the removed flag
      if (skipRemoved && currentTile.reemoved) {
        continue;
      }
      //check if current tile has the right type, if matchtype is true
      if (!matchType || currentTile.type == targetTile.type) {
        //add current tile to the cluster
        foundCluster.push(currentTile);
        let tileUnderCurrent = level.tiles[currentTile.x][currentTile.y + 1];
        if (tileUnderCurrent.type != -1) {
          foundCluster.push(tileUnderCurrent);
        }
        //get the neighbors of the current tile
        let neighbors = getNeighbors(currentTile);
        //check the type of each neighbor
        for (let i = 0; i < neighbors.length; i++) {
          if (!neighbors[i].procseeed) {
            //add the neighbor to the top process array
            topProcess.push(neighbors[i]);
            neighbors[i].procseeed = true;
          }
        }
      }
    }
    //return the found cluster
    return foundCluster;
  }

  //find floating clusters
  function findFloatingClusters() {
    //reset the processsed flags
    resetProcesed();
    let foundClusters = [];
    //check all tiles
    for (let i = 0; i < level.colums; i++) {
      for (let j = 0; j < level.rows; j++) {
        let tile = level.tiles[i][j];
        if (!tile.procseeed) {
          //find all attached tiles
          let foundCluster = findCluster(i, j, false, false, true);
          //there must be a tile in the cluster
          if (foundCluster.length <= 0) {
            continue;
          }
          //check if the cluster is floating
          let floating = true;
          for (let k = 0; k < foundCluster.length; k++) {
            if (foundCluster[k].y == 0) {
              //tile is attached to the roof
              floating = false;
              break;
            }
          }
          if (floating) {
            //found a floating cluster
            foundClusters.push(foundCluster);
          }
        }
      }
    }
    return foundClusters;
  }
  //reset the proceed flags
  function resetProcesed() {
    for (let i = 0; i < level.colums; i++) {
      for (let j = 0; j < level.rows; j++) {
        level.tiles[i][j].procseeed = false;
      }
    }
  }
  //reset the removed flags
  function resetRemoved() {
    for (let i = 0; i < level.rows; i++) {
      for (let j = 0; j < level.rows; j++) {
        level.tiles[i][j].reemoved = false;
      }
    }
  }
  //get the neighnbors of the specified tile
  function getNeighbors(tile) {
    let tileRow = (tile.y + rowOffset) % 2; //even or odd row
    let neighbors = [];
    //get the neighbor offset for the specified tile
    let n = neighborsOffsets[tileRow];
    //get the neighbors
    for (let i = 0; i < n.length; i++) {
      //neighboor cordinate
      let nx = tile.x + n[i][0];
      let ny = tile.y + n[i][1];
      ///make shure the tile is valid
      if (nx >= 0 && nx < level.colums && ny >= 0 && ny < level.rows) {
        neighbors.push(level.tiles[nx][ny]);
      }
    }
    return neighbors;
  }

  function updateFps(dt) {
    if (fpsTime > 0.25) {
      ///calculate fps
      fps = Math.round(framecount / fpsTime);
      //reset time and frame count
      fpsTime = 0;
      framecount = 0;
    }
    //increese time and frame count
    fpsTime += dt;
    framecount++;
  }
  //draw text that is centered
  function drawCenterText(text, x, y, width) {
    let textDim = context.measureText(text);
    context.fillText(text, x + (width - textDim.width) / 2, y);
  }

  //render the game
  function render() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    //draw the frame around the game
    //drawFrame();
    let yOffset = level.tileheight / 2;
    //drawlevel background
    //context.fillStyle = "#dbdbdb";
    //context.fillRect(level.x - 4, level.y - 4, level.width + 8, level.height + 4 - yOffset);
    //render tiles
    renderTiles();
    //draw level bottom
    context.fillStyle = "#000000";
    context.fillRect(
      level.width - 200,
      level.y - 84 + level.height + 4 - yOffset,
      250,
      150
    );
    //draw score
    context.fillStyle = "#ffffff";
    context.font = "36px Verdana";
    let scorex = level.x + level.width - 150;
    let scorey = level.y + level.height + level.tileheight - yOffset - 8;
    drawCenterText("score", scorex, scorey - 80, 150);
    context.font = "36px Verdana";
    drawCenterText(score, scorex, scorey - 50, 150);
    //render cluster
    if (showCluster) {
      renderCluster(cluster, 255, 128, 128);
      for (let i = 0; i < floatingClusters.length; i++) {
        let col = Math.floor(100 + (100 * i) / floatingClusters.length);
        renderCluster(floatingClusters[i], col, col, col);
      }
    }
    //render player buble
    renderPlayer();
    //game over overlay
    if (gameState == gameStates.gameOver) {
      context.fillStyle = "rgba(0,0,0,0.8)";
      context.fillRect(
        level.x - 4,
        level.y - 4,
        level.width + 8,
        level.height + 2 * level.tileheight + 8 - yOffset
      );
      context.fillStyle = "#ffffff";
      context.font = "24px Verdana";
      drawCenterText(
        "Game over, try again",
        level.x,
        level.y + level.height / 2 + 10,
        level.width
      );
      drawCenterText(
        "click to start",
        level.x,
        level.y + level.height / 2 + 40,
        level.width
      );
    } else if (gameState == gameStates.winning) {
      context.fillStyle = "rgba(0,0,0,0.8)";
      context.fillRect(
        level.x - 4,
        level.y - 4,
        level.width + 8,
        level.height + 2 * level.tileheight + 8 - yOffset
      );
      context.fillStyle = "#ffffff";
      context.font = "24px Verdana";
      drawCenterText(
        "Congrats! You are a music master🥳🎵🎶",
        level.x,
        level.y + level.height / 2 + 10,
        level.width
      );
      drawCenterText(
        "game over",
        level.x,
        level.y + level.height / 2 + 40,
        level.width
      );
      drawCenterText(
        "click to start",
        level.x,
        level.y + level.height / 2 + 70,
        level.width
      );
    }
  }

  //draw a frame around the game

  //render tiles
  function renderTiles() {
    for (let j = 0; j < level.rows; j++) {
      for (let i = 0; i < level.colums; i++) {
        let tile = level.tiles[i][j];
        let shift = tile.shift;
        //calculate the tile cordinates
        let coord = getTileCoordinate(i, j);
        //check if there is a tile present
        if (tile.type >= 0) {
          //support transperency
          context.save();
          context.globalAlpha = tile.alpha;
          //draw the tile using the color
          drawBuble(coord.tileX, coord.tileY + shift, tile.type);
          context.restore();
        }
      }
    }
  }

  function renderCluster(cluster, r, g, b) {
    for (let i = 0; i < cluster.length; i++) {
      //calculate the tile coordinates
      let coord = getTileCoordinate(cluster[i].x, cluster[i].y);
      //draw the tile using the color
      context.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
      context.fillRect(
        coord.tileX + level.tileWidth / 4,
        coord.tileY + level.tileheight / 4,
        level.tileWidth / 2,
        level.tileheight / 2
      );
    }
  }
  //render the player buble
  function renderPlayer() {
    let centerx = player.x + level.tileWidth / 2;
    let centery = player.y + level.tileheight / 2;

    //draw player background circle
    //context.fillStyle = "#7a7a7a";
    context.beginPath();
    context.arc(
      centerx + 50,
      centery - 80,
      level.radius + 12,
      0,
      2 * Math.PI,
      false
    );
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = "#8c8c8c";
    context.stroke();
    //draw the angle
    context.lineWidth = 2;
    context.strokeStyle = "#000033";
    context.beginPath();
    context.moveTo(centerx + 50, centery - 80);
    context.lineTo(
      centerx + 50 + 1.5 * level.tileWidth * Math.cos(degToRad(player.angle)),
      centery - 80 - 1.5 * level.tileheight * Math.sin(degToRad(player.angle))
    );
    context.stroke();
    //draw the next buble
    //context.drawImage(playerCharacter, player.buble.x, player.buble.y);
    drawBuble(
      player.nextBuble.x + 50,
      player.nextBuble.y - 80,
      player.nextBuble.tileType
    );
    //draw the buble
    if (player.buble.visible) {
      drawBuble(
        player.buble.x + 50,
        player.buble.y - 80,
        player.buble.tileType
      );
    }
  }

  //get the tile cordinate
  function getTileCoordinate(column, row) {
    let tileX = level.x + 25 + column * level.tileWidth;
    //X odffset for odd or even rows
    if ((row + rowOffset) % 2) {
      tileX += level.tileWidth / 2;
    }
    let tileY = level.y + row * level.rowHeight;
    return { tileX: tileX, tileY: tileY };
  }
  //get the closest grid position
  function getGridPosition(x, y) {
    const yDistance = y - level.y;
    console.log("yDistance", yDistance);
    console.log("level.rowHeight", level.rowHeight);
    console.log("yDistance / level.rowHeight", yDistance / level.rowHeight);
    const gridY = Math.floor(yDistance / level.rowHeight);
    //check for offset
    let xoffset = 0;
    if ((gridY + rowOffset) % 2) {
      xoffset = level.tileWidth / 2;
    }
    let gridX = Math.floor((x - xoffset - level.x) / level.tileWidth);
    return { x: gridX, y: gridY };
  }
  //draw the bubble
  function drawBuble(x, y, index) {
    if (index < 0 || index >= musicalNotes) {
      return;
    }
    const imageList = [
      do1Ball,
      reBall,
      miBall,
      faBall,
      solBall,
      laBall,
      ciBall,
      do2Ball,
      redBall,
      greenBall,
      blueBall,
      yellowBall,
      pupleBall,
    ];
    const image = imageList[index];
    context.drawImage(
      image,
      0,
      0,
      200,
      200,
      x,
      y,
      level.tileWidth,
      level.tileheight
    );
    //draw the buble sprite
  }

  //start a new game
  function newGame() {
    //reset score
    score = 0;
    turnCounter = 0;
    rowOffset = 0;
    loosing = false;
    winning = false;
    countMusicalNotesDroped = 0;
    //set the gamestate to ready
    setGamestate(gameStates.ready);
    //create the level
    createLevelNew();
    //init the next buble and set current bubble

    nextBuble();
    nextBuble();
  }

  //create a random level
  function createLevelNew() {
    //create a level with random tiles
    let countMusicalNotesPerRow = 0;
    let maxMusicalNotesAtRow = 4;
    for (let j = 0; j < level.rows; j++) {
      let randomTile = randRange(0, musicalNotes - 1);
      let count = 0;
      for (let i = 0; i < level.colums; i++) {
        if (count >= 2) {
          //change the random tile
          let newTile = randRange(0, musicalNotes - 1);
          //make shure the new tile is diffrent from the previous tile
          if (newTile == randomTile) {
            newTile = (newTile + 1) % musicalNotes;
          }
          randomTile = newTile;
          count = 0;
        }
        count++;

        if (j < level.rows / 2) {
          //console.log(i, j, randomTile);
          if (randomTile <= 7) {
            countMusicalNotesPerRow++;
            if (countMusicalNotesPerRow > maxMusicalNotesAtRow) {
              randomTile = Math.floor(Math.random() * 5) + bublecolors;
              if (randomTile == 7) {
                randomTile++;
              }
            }
          }
          level.tiles[i][j].type = randomTile;
          //          console.log(i, j, randomTile, countMusicalNotesPerRow);
        } else {
          level.tiles[i][j].type = -1;
        }
      }
      countMusicalNotesPerRow = 0;
    }
  }

  //create a random level
  // function createLevel() {
  //   //create a level with random tiles

  //   for (let j = 0; j < level.rows; j++) {
  //     let randomTile = randRange(0, musicalNotes - 1);
  //     let count = 0;
  //     for (let i = 0; i < level.colums; i++) {
  //       if (count >= 2) {
  //         //change the random tile
  //         let newTile = randRange(0, musicalNotes - 1);
  //         //make shure the new tile is diffrent from the previous tile
  //         if (newTile == randomTile) {
  //           newTile = (newTile + 1) % musicalNotes;
  //         }
  //         randomTile = newTile;
  //         count = 0;
  //       }
  //       count++;

  //       if (j < level.rows / 2) {
  //         level.tiles[i][j].type = randomTile;
  //       } else {
  //         level.tiles[i][j].type = -1;
  //       }
  //     }
  //   }
  // }
  //create a random buble for the player
  function nextBuble() {
    //set the current buble
    console.log("setting next buble");
    player.tileType = player.nextBuble.tileType;
    player.buble.tileType = player.nextBuble.tileType;
    player.buble.x = player.x;
    player.buble.y = player.y;
    player.buble.visible = true;
    //get the random type from the exsisting colors
    let nextColor = getExsistingColor();

    //set the next buble
    player.nextBuble.tileType = nextColor;
  }

  //get a random exsisting color
  function getExsistingColor() {
    let exsistingColors = findColors();
    let bubleType = 0;
    if (exsistingColors.length > 0) {
      bubleType = exsistingColors[randRange(0, exsistingColors.length - 1)];
    }
    return bubleType;
  }
  //get a random int between low and high inclusive
  function randRange(low, high) {
    return Math.floor(low + Math.random() * high - low + 1);
  }
  //shoote the buble
  function shotbuble() {
    //shoote the buble with the direction of the mouse
    player.buble.x = player.x;
    player.buble.y = player.y;
    player.buble.angle = player.angle;
    player.buble.tileType = player.tileType;
    //set the game state
    setGamestate(gameStates.shotbuble);
    console.log(gameState);
    console.log(player);
    // update(0);
  }
  //check if two circels intersect
  function circleIntersection(x1, y1, r1, x2, y2, r2) {
    //calculate the distance between the centers
    let dx = x1 - x2;
    let dy = y1 - y2;
    let len = Math.sqrt(dx * dx + dy * dy);
    if (len < r1 + r2) {
      //circels intersect
      return true;
    }
    return false;
  }

  //convert radions to degrees
  function radToDeg(angle) {
    return angle * (180 / Math.PI);
  }

  //convert degrees to radions
  function degToRad(angle) {
    return angle * (Math.PI / 180);
  }
  //on mouse movement
  function onMouseMove(e) {
    //get the mouse position
    let pos = getMousePos(canvas, e);
    //get the mouse angle
    let mouseAngle = radToDeg(
      Math.atan2(
        player.y + level.tileheight / 2 - pos.y,
        pos.x - (player.x + level.tileWidth / 2)
      )
    );
    //convert range to 0,360 degress
    if (mouseAngle < 0) {
      mouseAngle = 180 + (180 + mouseAngle);
    }
    // player.angle = mouseAngle;

    //restrict angle to 8,172 degrees
    const MIN_RANGE = 8;
    const MAX_RANGE = 172;

    const inRangeAngle = Math.max(Math.min(MAX_RANGE, mouseAngle), MIN_RANGE);
    player.angle = inRangeAngle;
    //  if (mouseAngle > 90 && mouseAngle < 270) {

    //      //left
    //      if (mouseAngle > ubound) {
    //          mouseAngle = ubound;
    //      } else {
    //          //right
    //          if (mouseAngle < ubound || mouseAngle >= 270) {
    //              mouseAngle = lbound;
    //          }
    //      }
    //      //set the player angle
    //      player.angle = mouseAngle
    //  }
    //renderPlayer();
  }

  //on mouse button click
  function onMouseDown(e) {
    //get the mouse position
    console.log("mouse down");
    let pos = getMousePos(canvas, e);

    if (gameState == gameStates.ready) {
      shotbuble();
    } else if (
      gameState == gameStates.gameOver ||
      gameState == gameStates.winning
    ) {
      newGame();
    }
  }

  //get the mouse position
  function getMousePos(canvas, e) {
    let rect = canvas.getBoundingClientRect();
    return {
      x: Math.round(
        ((e.clientX - rect.left) / (rect.right - rect.left)) * canvas.width
      ),
      y: Math.round(
        ((e.clientY - rect.top) / (rect.bottom - rect.top)) * canvas.height
      ),
    };
  }

  // }

  //call init to start the game
  init();
};
