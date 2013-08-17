var gameOptions = {
  height: 300,
  width: 500,
  nEnemies: 1,
  padding: 20
};

var gameStats = {
  score: 0,
  bestScore: 0
};

var axes = {
  x: d3.scale
    .linear()
    .domain([0,100])
    .range([0, gameOptions.width]),
  y: d3.scale
    .linear()
    .domain([0, 100])
    .range([0, gameOptions.height])
};

var gameBoard =
  d3.select('.container')
    .append('svg:svg')
    .attr('width', gameOptions.width)
    .attr('height', gameOptions.height);

var updateScore = function(){
  d3.select('.current-score')
  .text("Score = " + gameStats.score.toString());
};

var updateBestScore= function(){
  if (gameStats.score > gameStats.bestScore) {
    gameStats.bestScore = gameStats.score;
  }
  d3.select('.highScore').text("Highscore = " + gameStats.bestScore.toString());
};

var playerMaker = function(gameOptions) {
  var player = {};
  player.path = 'm-7.5,1.62413c0,-5.04095 4.08318,-9.12413 9.12414,-9.12413c5.04096,0 9.70345,5.53145 11.87586,9.12413c-2.02759,2.72372 -6.8349,9.12415 -11.87586,9.12415c-5.04096,0 -9.12414,-4.08318 -9.12414,-9.12415z';
  player.fill = '#ff6600';
  player.x = 0;
  player.y = 0;
  player.angle = 0;
  player.r = 5;
  player.gameOptions = gameOptions;

  player.moveRelative = function(dx, dy){
    this.transform({
      x: this.x + dx,
      y: this.y + dy,
      angle: 360 * (Math.atan2(dy, dx)/(Math.PI*2))
    });
  };

  player.setUpDragging = function(){
    var dragMove = function() {
      player.moveRelative(d3.event.dx, d3.event.dy);
    };
    var drag = d3.behavior.drag()
      .on('drag', dragMove);
    this.el.call(drag);
  };

  player.render = function(to) {
    this.el = to.append('svg:path')
      .attr('d', this.path)
      .attr('fill', this.fill);
    this.tranform = {
      x: this.gameOptions.width * 0.5,
      y: this.gameOptions.height * 0.5
    };
    this.setUpDragging();
    return this;
  };
  player.setX = function(x) {
    this.minX = this.gameOptions.padding;
    this.maxX = this.gameOptions.width - this.gameOptions.padding;
    if (x <= this.minX) {
      x = this.minX;
    } else if (x >= this.maxX) {
      x = this.maxX;
    }
    this.x = x;
  };

  player.getY = function(){
    return this.y;
  };

  player.setY = function(y){
    this.minY = this.gameOptions.padding;
    this.maxY = this.gameOptions.height - this.gameOptions.padding;
    if (y < this.minY){
      y = this.minY;
    }
    if (y > this.maxY){
      y = this.maxY;
    }
    this.y = y;
  };

  player.transform = function(opts){
    this.angle = opts.angle || this.angle;
    this.setX(opts.x || this.x);
    this.setY(opts.y || this.y);
    this.el.attr('transform', 'rotate(' + this.angle + ',' + this.x + ',' + this.y + ') ' + 'translate( ' + this.x + ' , ' + this.y + ')' );
  };

  player.moveAbsolute = function(x, y){
    this.transform({x:x, y:y});
  };

  return player;
};

var players = [];


players.push(playerMaker(gameOptions).render(gameBoard));

//ENEMIES

var createEnemies = function(){
  var enemies = _.range(0, gameOptions.nEnemies);
  enemies = _.map(enemies, function(item, index){
    return {
    id: item,
    x: Math.random()*100,
    y: Math.random()*100 };
  });
  return enemies;
};

var render = function(enemyData) {
  var enemies = gameBoard.selectAll('circle.enemy')
    .data(enemyData, function(d) {return d.id;});

  enemies.enter().append('svg:circle')
    .attr('class', 'enemy')
    .attr('cx', function(enemy) {return axes.x(enemy.x);})
    .attr('cy', function(enemy) {return axes.y(enemy.y);})
    .attr('r', 0);

  enemies.exit().remove();

  var checkCollision = function(enemy, collidedCallback) {
    _.each(players, function(player) {

      var radiusSum = parseFloat(enemy.attr('r')) + player.r;
      var xDiff = parseFloat(enemy.attr('cx')) - player.x;
      var yDiff = parseFloat(enemy.attr('cy')) - player.y;

      var separation = Math.sqrt( Math.pow(xDiff, 2) + Math.pow(yDiff,2));
      if (separation < radiusSum){
        collidedCallback(player, enemy);
      }
    });
  };

  var onCollision = function(){
    updateBestScore();
    gameStats.score = 0;
    gameStats.nEnemies = 1;
    updateScore();
  };

  var tweenWithCollisionDetection = function(endData){
    var enemy = d3.select(this);

    var startPos = {
      x: parseFloat(enemy.attr('cx')),
      y: parseFloat(enemy.attr('cy'))
    };

    var endPos = {
      x: axes.x(endData.x),
      y: axes.y(endData.y)
    };

    return function(t) {
      checkCollision(enemy, onCollision);
      enemyNextPos = {
        x: startPos.x + (endPos.x - startPos.x)*t,
        y: startPos.y + (endPos.y - startPos.y)*t
      };
      enemy.attr('cx', enemyNextPos.x).attr('cy', enemyNextPos.y);
    };
  };
  enemies.transition()
    .duration(500)
    .attr('r', 10)
    .transition()
    .duration(2000)
    .tween('custom', tweenWithCollisionDetection);
};

var play = function() {
  var gameTurn = function() {
    var newEnemyPositions = createEnemies();
    render(newEnemyPositions);
    gameOptions.nEnemies += 1;
  };
  var increaseScore = function() {
    gameStats.score += 1;
    updateScore();
  };

  gameTurn();
  setInterval(gameTurn, 2000);

  setInterval(increaseScore, 50);
};

play();



























