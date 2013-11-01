
var FilesModel = function FilesModel(files) {
	'use strict';
	var self = this;

	function canPlay(type) {
		var a = document.createElement('audio');
		return !!(a.canPlayType && a.canPlayType(type).replace(/no/, ''));
	};
	var mp3 = canPlay('audio/mpeg;'),
	ogg = canPlay('audio/ogg; codecs="vorbis"');

	self.files = [];

	self.addFile = function (file) {
		self.files.push(file); 
      //what!
	};
	self.voteUp = function (file){
	file.votes += 1;
	};
	self.voteDown = function (file){
	file.votes -= 1;
	};
	function parseFile(file, callback) {
		
		if (localStorage[file.name]) {
			return callback(JSON.parse(localStorage[file.name]));
		}

		ID3v2.parseFile(file, function (tags) {

			localStorage[file.name] = JSON.stringify({
					Title : tags.Title,
					Artist : tags.Artist,
					Album : tags.Album,
					Genre : tags.Genre
				});
			callback(tags);
		});
	};

	var getUrl = function (queuedFile) {
		if (window.createObjectURL) {
			return window.createObjectURL(queuedFile)
		} else if (window.createBlobURL) {
			return window.createBlobURL(queuedFile)
		} else if (window.URL && window.URL.createObjectURL) {
			return window.URL.createObjectURL(queuedFile)
		} else if (window.webkitURL && window.webkitURL.createObjectURL) {
			return window.webkitURL.createObjectURL(queuedFile)
		}
	};

	self.addAndParseFiles = function (ifiles) {

		for (var i = 0; i < ifiles.length; i++) {
			var file = ifiles[i];

			var path = file.webkitRelativePath || file.mozFullPath || file.name;
			
			if (path.indexOf('.AppleDouble') != -1) {
				// Meta-data folder on Apple file systems, skip
				continue;
			}
			var size = file.size || file.fileSize || 4096;
			if (size < 4095) {
				// Most probably not a real MP3
				console.log(path);
				continue;
			}

			if (file.name.indexOf('mp3') != -1) { //only does mp3 for now
				if (mp3) {
					self.files.push(file);
				}
			}
			if (file.name.indexOf('ogg') != -1 || file.name.indexOf('oga') != -1) {
				if (ogg) {
					self.files.push(file);
				}
			}
		}
		var getUrl = function (queuedFile) {
			if (window.createObjectURL) {
				return window.createObjectURL(queuedFile)
			} else if (window.createBlobURL) {
				return window.createBlobURL(queuedFile)
			} else if (window.URL && window.URL.createObjectURL) {
				return window.URL.createObjectURL(queuedFile)
			} else if (window.webkitURL && window.webkitURL.createObjectURL) {
				return window.webkitURL.createObjectURL(queuedFile)
			}
		};

		self.files.forEach(
			function (item) {

			parseFile(item, function (tags) {
				var t2 = guessSong(item.webkitRelativePath || item.mozFullPath || item.name);

				item.title = tags.Title || t2.Title;
				item.artist = tags.Artist || t2.Artist;
				item.album = tags.Album || t2.Album;
				item.genre = tags.Genre || "";
				item.votes = 0;
				item.url = getUrl(item);
			});
			console.log(item);
		});

	};
	self.each = function (func) {
		self.files.forEach(func(item));
	};
	self.removeFile = function (file) {
		self.files.remove(file);
	};

	self.addAndParseFiles(files);

};
var filesModel;

function runSearch(query) {
	console.log(query);
	var regex = new RegExp(query.trim().replace(/\s+/g, '.*'), 'ig');
	for (var i = $('songtable').getElementsByTagName('tr'), l = i.length; l--; ) {
		if (regex.test(i[l].innerHTML)) {
			i[l].className = 'visible'
		} else {
			i[l].className = 'hidden';
		}
	}
};

function $(id) {
	return document.getElementById(id)
};



function getSongs(files) {
	console.log("begin getSongs");
	filesModel = new FilesModel(files);
	$("mask").style.display = 'none';
	$("startup").style.display = 'none';

	filesModel.files.forEach(function (item) {
		var tr = document.createElement('tr');
		var td = document.createElement('td');
		td.innerHTML = item.title; //tags.Title || t2.Title;
		tr.appendChild(td);

		var td = document.createElement('td');
		td.innerHTML = item.artist; //tags.Artist || t2.Artist;
		tr.appendChild(td);

		var td = document.createElement('td');
		td.innerHTML = item.album; //tags.Album || t2.Album;
		tr.appendChild(td);

		var td = document.createElement('td');
		td.innerHTML = item.genre; //tags.Genre || "";
		tr.appendChild(td);

		tr.onclick = function () {
			var pl = document.createElement('tr');
			var st = document.createElement('td');
			st.innerHTML = item.title; //tags.Title || t2.Title;
			pl.appendChild(st);
			$("playtable").appendChild(pl);
			pl.file = item;
			pl.className = 'visible';
			pl.onclick = function (e) {
				if (e && e.button == 1) {
					pl.parentNode.removeChild(pl);
				} else {
					playSong(item.url);

					for (var i = document.querySelectorAll('.playing'), l = i.length; l--; ) {
						i[l].className = '';
					}
					pl.className += ' playing';
					currentSong = pl;
				}
			}
			if ($("playtable").childNodes.length == 1)
				pl.onclick();
		};
		$('songtable').appendChild(tr);
	});

};

var currentSong = 0;

function playSong(srcUrl) {
	$("player").src = srcUrl;
	$("player").play();
};
function nextSong() {
	try {
		currentSong.nextSibling.onclick();
	} catch (e) {
		currentSong = document.querySelector("#playtable tr");
		currentSong.onclick();
	}
};

function shuffle() {
	var pt = document.getElementById('playtable');
	//fisher yates shuffle. hopefully.
	for (var i = document.querySelectorAll("#playtable tr"), l = i.length; l--; ) {
		var j = Math.floor(Math.random() * l);
		var jel = i[j],
		iel = i[l];
		var jref = jel.nextSibling,
		iref = iel.nextSibling;
		pt.insertBefore(jel, iref);
		pt.insertBefore(iel, jref);
	}
};

function empty() {
	var pt = document.getElementById('playtable');
	pt.innerHTML = '';
};

onload = function () {
	//with no dependencies, it should be fine to use this instead of ondomcontentloaded
	var a = document.createElement('audio');
	if (!a.canPlayType) {
		$("support").innerHTML += "Your browser does not support HTML5 Audio<br>";
	}
	if (!(a.canPlayType && a.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, ''))) {
		$("support").innerHTML += "Your browser does not support Ogg Vorbis Playback<br>";
	}
	if (!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''))) {
		$("support").innerHTML += "Your browser does not support MP3 Playback<br>";
	}

	var f = document.createElement('input');
	f.type = 'file';
	if (!('multiple' in f)) {
		$("support").innerHTML += "Your browser does not support selecting multiple files<br>";
	}
	if (!('webkitdirectory' in f)) {
		$("support").innerHTML += "Your browser probably does not support selecting directories<br>";
	}
	window.createObjectURL || window.createBlobURL || window.URL && window.URL.createObjectURL || window.webkitURL && window.webkitURL.createObjectURL || ($("support").innerHTML += "Your browser probably does not support Object URLs<br>");
	/*
	if (window.createObjectURL) {}
	else if (window.createBlobURL) {}
	else if (window.URL && window.URL.createObjectURL) {}
	else if (window.webkitURL && window.webkitURL.createObjectURL) {}
	else {
	$("support").innerHTML += "Your browser probably does not support Object URLs<br>";
	}
	 */
	document.querySelector('#search input').onkeydown = function (e) {
		if (e.keyCode == 13) {
			for (var i = document.querySelectorAll('#songtable tr.visible'), l = i.length; l--; ) {
				i[l].onclick();
			}
		}
	}
};
