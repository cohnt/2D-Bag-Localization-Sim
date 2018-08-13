///////////////////////////////////////////
/// CONSTANTS
///////////////////////////////////////////

var canvasSize = {width: 800, height: 500};
var bagHandleLocations = [[380, 280], [420, 220]];
var bagHandleLength = 40;
var bagHandleAngle = Math.PI / 6;

///////////////////////////////////////////
/// GLOBAL VARIABLES
///////////////////////////////////////////

var canvas;
var ctx;

///////////////////////////////////////////
/// CLASSES
///////////////////////////////////////////

function Particle(loc) {
	this.loc = loc.slice();
	this.weight = 0;
	this.isExploration = false;

	this.randomize = function() {
		this.pos = [Math.random() * canvasSize.width, Math.random() * canvasSize.height];
		this.isExploration = true;
	}
}

///////////////////////////////////////////
/// FUNCTIONS
///////////////////////////////////////////

function setup() {
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");

	drawBag();
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

///////////////////////////////////////////
/// EXECUTED CODE
///////////////////////////////////////////

setup();