///////////////////////////////////////////
/// CONSTANTS
///////////////////////////////////////////

//GLOBAL SETTINGS
var bagHandleLocations = [[380, 280, 80], [420, 220, 80]];
var bagHandleLength = 40;
var bagHandleAngle = Math.PI / 6;
var animatedModeTickRate = 100; //ms per frame
var worldHeight = 200;
var robotHeight = 125;

//PARTICLE FILTER
var numParticles = 1000;
var explorationFactor = 0.05; //0.0 means no particles are randomly placed for exploration, 0.5 means 50%, 1.0 means 100%
var resamplingNoise = 15; //The maximum lateral distance in resampling
var resamplingHeightNoise = 5; //Dito above, but for height
var numFramesToUse = Infinity;

//CANVAS
var canvasSize = {width: 800, height: 500};
var particleDispRadius = 2;
var errorColorDivisor = 100; //Error is mapped to (0, 1] with e^(-error/errorColorDivisor).
var colorMode = "dbscan"; //"dbscan", "error", "weight", or height

//DBSCAN
var epsilon = 10;
var minClusterSize = 25;
var noiseColor = "grey";
var unassignedColor = "black";

///////////////////////////////////////////
/// GLOBAL VARIABLES
///////////////////////////////////////////

var canvas;
var ctx;
var particles = [];
var mousePos = [];
var mousePosHistory = [];
var clusterColors = [];
var animatedMode = true;
var started = false;
var running = false;
var stop = false;

///////////////////////////////////////////
/// CLASSES
///////////////////////////////////////////

function Particle(pos=[0, 0, 0]) {
	this.pos = pos.slice();
	this.weight = 0;
	this.isExploration = false;
	this.angleDistFromLine = [];

	this.type = "unassigned";
	this.cID = -1;

	this.randomize = function() {
		this.pos = [Math.random() * canvasSize.width, Math.random() * canvasSize.height, Math.random() * worldHeight];
		this.isExploration = true;
	}
	this.draw = function(ctx, maxWeight=1) {
		if(colorMode == "error") {
			color = errorToColor(this.getError());
		}
		else if(colorMode == "weight") {
			color = weightToColor(this.weight / maxWeight);
		}
		else if(colorMode == "dbscan") {
			if(this.type == "noise") {
				color = noiseColor;
			}
			else if(this.type == "unassigned") {
				color = unassignedColor;
			}
			else {
				color = clusterColors[this.cID];
			}
		}
		else if(colorMode == "height") {
			color = heightToColor(this.pos[2]);
		}
		ctx.strokeStyle = color;
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.moveTo(this.pos[0], this.pos[1]);
		ctx.arc(this.pos[0], this.pos[1], particleDispRadius, 0, 2*Math.PI, true);
		ctx.closePath();
		ctx.fill();
	}
	this.getError = function() {
		var dists = [dist(this.pos, bagHandleLocations[0]),
		             dist(this.pos, bagHandleLocations[1])];
		var error = Math.min(dists[0], dists[1]);
		return error;
	}
}

///////////////////////////////////////////
/// FUNCTIONS
///////////////////////////////////////////

function setup() {
	canvas = document.getElementById("canvas");
	canvas.setAttribute("width", String(canvasSize.width) + "px");
	canvas.setAttribute("height", String(canvasSize.height) + "px");
	canvas.addEventListener("mousemove", function(event) { mouseMoveCanvas(event); });
	canvas.addEventListener("click", mouseClickCanvas);
	canvas.addEventListener("mouseleave", mouseLeaveCanvas);

	ctx = canvas.getContext("2d");

	drawBag();
}

function mouseMoveCanvas(event) {
	var rect = canvas.getBoundingClientRect();
	var x = event.clientX - rect.left;
	var y = event.clientY - rect.top;
	mousePos = [x, y];
}
function mouseClickCanvas() {
	if(!started) {
		generateParticles();
		started = true;
		var elts = document.getElementsByClassName("parameterForm");
		for(var i=0; i<elts.length; ++i) {
			elts[i].readOnly = "true";
			elts[i].style.color = "grey";
		}
	}

	if(running) {
		stop = true;
	}
	else {
		if(animatedMode) {
			running = true;
		}
		tick();
	}
}
function mouseLeaveCanvas() {
	if(running) {
		stop = true;
	}
}

function drawFrame(maxWeight) {
	clearCanvas();
	drawMouseToHandles();
	for(var i=0; i<particles.length; ++i) {
		particles[i].draw(ctx, maxWeight);
	}
	drawBag();
}
function clearCanvas() {
	//
	ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
}
function drawBag() {
	var s0 = [0, 0];
	var e0 = [0, 0];
	var s1 = [0, 0];
	var e1 = [0, 0];

	s0[0] = bagHandleLocations[0][0] - (0.5 * bagHandleLength * Math.cos(bagHandleAngle));
	s0[1] = bagHandleLocations[0][1] - (0.5 * bagHandleLength * Math.sin(bagHandleAngle));
	e0[0] = bagHandleLocations[0][0] + (0.5 * bagHandleLength * Math.cos(bagHandleAngle));
	e0[1] = bagHandleLocations[0][1] + (0.5 * bagHandleLength * Math.sin(bagHandleAngle));

	s1[0] = bagHandleLocations[1][0] - (0.5 * bagHandleLength * Math.cos(bagHandleAngle));
	s1[1] = bagHandleLocations[1][1] - (0.5 * bagHandleLength * Math.sin(bagHandleAngle));
	e1[0] = bagHandleLocations[1][0] + (0.5 * bagHandleLength * Math.cos(bagHandleAngle));
	e1[1] = bagHandleLocations[1][1] + (0.5 * bagHandleLength * Math.sin(bagHandleAngle));

	var oldLineWidth = ctx.lineWidth;
	ctx.lineWidth = 5;
	ctx.strokeStyle = "#663300";

	ctx.beginPath();
	ctx.moveTo(s0[0], s0[1]);
	ctx.lineTo(e0[0], e0[1]);
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(s1[0], s1[1]);
	ctx.lineTo(e1[0], e1[1]);
	ctx.stroke();

	ctx.lineWidth = oldLineWidth;
}
function drawMouseToHandles() {
	ctx.strokeStyle = "black";
	ctx.beginPath();
	ctx.moveTo(mousePos[0], mousePos[1]);
	ctx.lineTo(bagHandleLocations[0][0], bagHandleLocations[0][1]);
	ctx.stroke();
	ctx.moveTo(mousePos[0], mousePos[1]);
	ctx.lineTo(bagHandleLocations[1][0], bagHandleLocations[1][1]);
	ctx.stroke();
}
function errorToColor(error) {
	var mappedVal = Math.pow(Math.E, -1 * error / errorColorDivisor);
	return weightToColor(mappedVal);
}
function weightToColor(weight) {
	if(weight > 1) {
		weight = 1;
	}

	//Create HSL
	var h = ((1-weight)*240)/360;
	var s = 1;
	var l = 0.5;

	//Convert to RGB (from https://gist.github.com/mjackson/5311256)
	var r, g, b;

	function hue2rgb(p, q, t) {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1/6) return p + (q - p) * 6 * t;
		if (t < 1/2) return q;
		if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
		return p;
	}

	var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	var p = 2 * l - q;

	r = hue2rgb(p, q, h + 1/3);
	g = hue2rgb(p, q, h);
	b = hue2rgb(p, q, h - 1/3);

	r = Math.floor(r * 255);
	g = Math.floor(g * 255);
	b = Math.floor(b * 255);

	//Convert to RGB color code
	function componentToHex(c) {
		var hex = c.toString(16);
		return hex.length == 1 ? "0" + hex : hex;
	}
	function rgbToHex(r, g, b) {
		return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
	}

	return rgbToHex(r, g, b);
}
function heightToColor(height) {
	//
	return weightToColor(1 - (Math.abs(bagHandleLocations[0][2] - height) / worldHeight));
}

function getClusterCentroids() {
	var centroids = clusterColors.slice();
	var num = clusterColors.slice();
	for(var i=1; i<centroids.length; ++i) {
		centroids[i] = [0, 0, 0];
		num[i] = 0;
	}

	for(var i=0; i<particles.length; ++i) {
		var id = particles[i].cID;
		if(id == -1) {
			continue;
		}
		centroids[id][0] += particles[i].pos[0];
		centroids[id][1] += particles[i].pos[1];
		centroids[id][2] += particles[i].pos[2];
		++num[id];
	}

	for(var i=1; i<centroids.length; ++i) {
		centroids[i][0] /= num[i];
		centroids[i][1] /= num[i];
		centroids[i][2] /= num[i];
	}

	return centroids;
}
function drawCentroids(centroids) {
	for(var i=1; i<centroids.length; ++i) {
		ctx.beginPath();
		ctx.moveTo(centroids[i][0], centroids[i][1]);
		ctx.arc(centroids[i][0], centroids[i][1], 5, 0, 2*Math.PI);
		ctx.closePath();
		ctx.fillStyle = "black";
		ctx.fill();
	}
}

function tick() {
	if(animatedMode && stop) {
		stop = false;
		running = false;
		return;
	}

	var currentMousePos = mousePos.slice();
	currentMousePos.push(robotHeight);
	mousePosHistory.push(currentMousePos.slice());

	measureParticles(currentMousePos);
	calculateWeights();
	//TODO: Save frame here
	resampleParticles();
	measureParticles(currentMousePos);
	calculateWeights();

	clearIDs();
	dbscan();

	var weights = particles.map(a => a.weight);
	var maxWeight = weights.reduce(function(a, b) { return Math.max(a, b); });
	if(maxWeight == 0) { maxWeight = 1; }

	drawFrame(maxWeight);

	var centroids = getClusterCentroids();
	console.log("Centroids:");
	for(var i=1; i<centroids.length; ++i) {
		console.log(centroids[i] + "\t\tError: " + Math.min(dist(centroids[i], bagHandleLocations[0]), dist(centroids[i], bagHandleLocations[1])));
	}
	console.log('');
	drawCentroids(centroids);

	if(animatedMode) {
		window.setTimeout(tick, animatedModeTickRate);
	}
}

function generateParticles() {
	for(var i=0; i<numParticles; ++i) {
		particles[i] = new Particle();
		particles[i].randomize();
	}
}
function measureParticles(currentMousePos) {
	function angleDistPointLine(mouse, bag, particle) {
		// //https://stackoverflow.com/questions/1211212/how-to-calculate-an-angle-from-three-points
		// return Math.atan2(bag[1] - mouse[1], bag[0] - mouse[0]) - Math.atan2(particle[1] - mouse[1], particle[0] - mouse[0]);

		//https://stackoverflow.com/questions/19729831/angle-between-3-points-in-3d-space
		var v1 = [bag[0] - mouse[0], bag[1] - mouse[1], bag[2] - mouse[2]];
		var v2 = [particle[0] - mouse[0], particle[1] - mouse[1], particle[2] - mouse[2]];

		var v1mag = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2]);
		var v1norm = [v1[0] / v1mag, v1[1] / v1mag, v1[2] / v1mag];

		var v2mag = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1] + v2[2] * v2[2]);
		var v2norm = [v2[0] / v2mag, v2[1] / v2mag, v2[2] / v2mag];

		var res = v1norm[0] * v2norm[0] + v1norm[1] * v2norm[1] + v1norm[2] * v2norm[2];

		var angle = Math.acos(res);

		return angle;
	}

	for(var i=0; i<particles.length; ++i) {
		for(var j=0; j<mousePosHistory.length; ++j) {
			var d0 = Math.abs(angleDistPointLine(mousePosHistory[j], bagHandleLocations[0], particles[i].pos));
			var d1 = Math.abs(angleDistPointLine(mousePosHistory[j], bagHandleLocations[1], particles[i].pos));
			particles[i].angleDistFromLine[j] = Math.min(d0, d1);
		}
	}

	for(var i=0; i<particles.length; ++i) {
		var d0 = Math.sqrt(Math.pow(particles[i].pos[0] - bagHandleLocations[0][0], 2) + Math.pow(particles[i].pos[1] - bagHandleLocations[0][1], 2));
		var d1 = Math.sqrt(Math.pow(particles[i].pos[0] - bagHandleLocations[1][0], 2) + Math.pow(particles[i].pos[1] - bagHandleLocations[1][1], 2));
		particles[i].actualHorizontalDist = Math.min(d0, d1);
		particles[i].actualVerticalDist = Math.abs(particles[i].pos[2] - bagHandleLocations[0][2]);
		//For debugging, if needed
	}
}
function calculateWeights() {
	var data = [];
	var dataWeights = [];
	for(var i=Math.max(0, mousePosHistory.length - numFramesToUse); i<mousePosHistory.length; ++i) {
		data.push(particles.map(a => a.angleDistFromLine[i]));
		dataWeights.push(normalizeWeight(calculateWeight(data[data.length-1], 0, true)));
	}
 	//Combine all
	var combinedWeights = [];
	for(var i=0; i<dataWeights[0].length; ++i) {
		combinedWeights[i] = 1;
		for(var j=0; j<dataWeights.length; ++j) {
			combinedWeights[i] *= dataWeights[j][i];
		}
	}
 	//Renormalize
	var normalizedCombined = normalizeWeight(combinedWeights);

	for(var i=0; i<particles.length; ++i) {
		particles[i].weight = normalizedCombined[i];
	}

	// var maxInd = 0;
	// var max = dataWeights[maxInd];
	// for(var i=1; i<dataWeights.length; ++i) {
	// 	if(dataWeights[i] > max) {
	// 		maxInd = i;
	// 		max = dataWeights[maxInd];
	// 	}
	// }
	// console.log(dataWeights);
	// console.log(maxInd);
	// console.log(max);
}
function resampleParticles() {
	var weightData = particles.map(a => a.weight);
	var newParticles = [];
	var cs = cumsum(weightData);
	var step = 1/((numParticles * (1 - explorationFactor))+1);
	var chkVal = step;
	var chkIndex = 0;
	for(var i=0; i<numParticles * (1 - explorationFactor); ++i) {
		while(cs[chkIndex] < chkVal) {
			++chkIndex;
		}
		chkVal += step;
		newParticles[i] = new Particle(particles[chkIndex].pos);
		var randAngle = Math.random() * 2 * Math.PI;
		var randDist = Math.random() * resamplingNoise;
		var randHeight = (Math.random() * resamplingHeightNoise * 2) - resamplingHeightNoise;
		newParticles[i].pos[0] += randDist * Math.cos(randAngle);
		newParticles[i].pos[1] += randDist * Math.sin(randAngle);
		newParticles[i].pos[2] += randHeight;

		if(newParticles[i].pos[0] < 0) { newParticles[i].pos[0] = 0; }
		if(newParticles[i].pos[1] < 0) { newParticles[i].pos[1] = 0; }
		if(newParticles[i].pos[2] < 0) { newParticles[i].pos[2] = 0; }

		if(newParticles[i].pos[0] > canvasSize.width) { newParticles[i].pos[0] = canvasSize.width; }
		if(newParticles[i].pos[1] > canvasSize.height) { newParticles[i].pos[1] = canvasSize.height; }
		if(newParticles[i].pos[2] > worldHeight) { newParticles[i].pos[2] = worldHeight; }
	}
	for(var i=newParticles.length; i<numParticles; ++i) {
		newParticles[i] = new Particle();
		newParticles[i].randomize();
	}
	particles = newParticles.slice();
}

function clearIDs() {
	for(var i=0; i<particles.length; ++i) {
		particles[i].cID = -1;
		particles[i].type = "unassigned";
	}
	clusterColors = [];
}
function dbscan() {
	var cID = 0;
	for(var i=0; i<particles.length; ++i) {
		if(particles[i].type != "unassigned") {
			continue;
		}

		var neighbors = findNeighbors(particles, particles[i]);
		if(neighbors.length < minClusterSize) {
			particles[i].type = "noise";
			continue;
		}

		++cID;
		particles[i].cID = cID;
		particles[i].type = "core";

		for(var j=0; j<neighbors.length; ++j) {
			if(particles[neighbors[j]].type == "noise") {
				particles[neighbors[j]].type = "border";
				particles[neighbors[j]].cID = cID;
			}
			else if(particles[neighbors[j]].type != "unassigned") {
				continue;
			}
			else {
				particles[neighbors[j]].cID = cID;
				var newNeighbors = findNeighbors(particles, particles[neighbors[j]]);
				if(newNeighbors.length > minClusterSize) {
					particles[neighbors[j]].type = "core";
					for(var k=0; k<newNeighbors.length; ++k) {
						if(!neighbors.includes(newNeighbors[k])) {
							neighbors.push(newNeighbors[k]);
						}
					}
				}
				else {
					particles[neighbors[j]].type = "border";
				}
			}
		}
	}
	clusterColors.push(null);
	for(var i=1; i<=cID; ++i) {
		clusterColors.push(getRandColor(1));
	}
}
function findNeighbors(points, point) {
	var out = [];
	for(var i=0; i<points.length; ++i) {
		if(dist(points[i].pos, point.pos) < epsilon) {
			out.push(i);
		}
	}
	return out;
}
function getRandColor(brightness){
	// From https://stackoverflow.com/questions/1484506/random-color-generator
	// Six levels of brightness from 0 to 5, 0 being the darkest
	var rgb = [Math.random() * 256, Math.random() * 256, Math.random() * 256];
	var mix = [brightness*51, brightness*51, brightness*51]; //51 => 255/5
	var mixedrgb = [rgb[0] + mix[0], rgb[1] + mix[1], rgb[2] + mix[2]].map(function(x){ return Math.round(x/2.0)})
	return "rgb(" + mixedrgb.join(",") + ")";
}

function dist2(a, b) {
	//
	return Math.pow(a[0]-b[0], 2) + Math.pow(a[1]-b[1], 2) + Math.pow(a[2]-b[2], 2);
}
function dist(a, b) {
	//
	return Math.sqrt(dist2(a, b));
}
function mean(arr) {
	var total = 0;
	for(var i=0; i<arr.length; ++i) {
		total += arr[i];
	}
	return total / arr.length;
}
function variance(arr) {
	var v = 0;
	var m = mean(arr);
	for(var i=0; i<arr.length; ++i) {
		v += arr[i]*arr[i];
	}
	v /= arr.length;
	v -= m*m;
	return v;
}
function cumsum(arr) {
	for(var i=1; i<arr.length; ++i) {
		arr[i] += arr[i-1];
	}
	return arr;
}
function angleDist(a, b) {
	var diff = a - b;
	function specialMod(lhs, rhs) {
		return lhs - (Math.floor(lhs/rhs) * rhs);
	}
	return (specialMod(diff + Math.PI, Math.PI*2)) - Math.PI;
}
function calculateWeight(raw, actual, isAngle) {
	var v = variance(raw);
	var m = 1/(Math.sqrt(2*Math.PI*v));
	var weights = [];
	if(isAngle) {
		for(var i=0; i<raw.length; ++i) {
			weights[i] = Math.pow(Math.E, -(Math.pow((angleDist(raw[i], actual)), 2) / (2*v))) * m;
		}
	}
	else {
		for(var i=0; i<raw.length; ++i) {
			weights[i] = Math.pow(Math.E, -(Math.pow((raw[i]-actual), 2) / (2*v))) * m;
		}
	}
	return weights;
}
function normalizeWeight(arr) {
	var total = 0;
	for(var i=0; i<arr.length; ++i) {
		total += arr[i];
	}
	for(var i=0; i<arr.length; ++i) {
		arr[i] /= total;
	}
	return arr;
}

///////////////////////////////////////////
/// EXECUTED CODE
///////////////////////////////////////////

setup();