///////////////////////////////////////////
/// CONSTANTS
///////////////////////////////////////////

var canvasSize = {width: 800, height: 500};
var bagHandleLocations = [[380, 280], [420, 220]];
var bagHandleLength = 40;
var bagHandleAngle = Math.PI / 6;
var numParticles = 500;
var particleDispRadius = 3;
var errorColorDivisor = 100; //Error is mapped to (0, 1] with e^(-error/errorColorDivisor).

///////////////////////////////////////////
/// GLOBAL VARIABLES
///////////////////////////////////////////

var canvas;
var ctx;
var particles = [];
var mousePos = [];

///////////////////////////////////////////
/// CLASSES
///////////////////////////////////////////

function Particle(pos=[0, 0]) {
	this.pos = pos.slice();
	this.weight = 0;
	this.isExploration = false;

	this.randomize = function() {
		this.pos = [Math.random() * canvasSize.width, Math.random() * canvasSize.height];
		this.isExploration = true;
	}
	this.draw = function(ctx) {
		color = errorToColor(this.getError());
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

	ctx = canvas.getContext("2d");

	generateParticles();

	drawFrame();
}

function mouseMoveCanvas(event) {
	var rect = canvas.getBoundingClientRect();
	var x = event.clientX - rect.left;
	var y = event.clientY - rect.top;
	mouseLoc = [x, y];
}
function mouseClickCanvas() {
	//
	tick();
}

function drawFrame() {
	clearCanvas();
	drawBag();
	for(var i=0; i<particles.length; ++i) {
		particles[i].draw(ctx);
	}
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
function errorToColor(error) {
	var mappedVal = Math.pow(Math.E, -1 * error / errorColorDivisor);

	//Create HSL
	var h = ((1-mappedVal)*240)/360;
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

function tick() {
	measureParticles();
	calculateWeights();
	//TODO: Save frame here
	resampleParticles();
	drawFrame();
}

function generateParticles() {
	for(var i=0; i<numParticles; ++i) {
		particles[i] = new Particle();
		particles[i].randomize();
	}
}
function measureParticles() {
	//TODO
}
function calculateWeights() {
	//TODO
}
function resampleParticles() {
	//TODO
}

function dist2(a, b) {
	//
	return Math.pow(a[0]-b[0], 2) + Math.pow(a[1]-b[1], 2);
}
function dist(a, b) {
	//
	return Math.sqrt(dist2(a, b));
}

///////////////////////////////////////////
/// EXECUTED CODE
///////////////////////////////////////////

setup();