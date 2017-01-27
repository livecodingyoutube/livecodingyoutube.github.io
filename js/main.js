
var DEBUG = false;
var markTimestamp = -1;
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
var loopHandles = [];
var jumpTimestamp = 0;
var row = 4;
var col = 4;
var cellWidth = 50;
var cellHeight = 50;
var numReadyVideo = 0;
var targetVideos = [];
var initialLoading = true;
var youtubeid = "";
var divGrid = [];
var gridVideos = [];

var YTSTATE_UNSTARTED = -1;
var YTSTATE_ENDED = 0;
var YTSTATE_PLAYING = 1;
var YTSTATE_PAUSED = 2;
var YTSTATE_BUFFERING = 3;
var YTSTATE_VIDEOCUED = 5;

function onYouTubeIframeAPIReady() {
  if(DEBUG)console.log("is ready");
}

function phase(interval){
  if(interval>=0){
    for (var i=1; i<targetVideos.length; i++){
      (function(vindex){
        if(DEBUG)console.log("vindex",vindex, ",interval_order", interval_order);
          setTimeout(function(){
          targetVideos[vindex].playVideo();
        },vindex*interval);
      })(i)
      targetVideos[i].pauseVideo(); // do not need to
    }
    return ;
  }
 // interval < 0
  for (var i=targetVideos.length-2; i>=0; i--){
    (function(vindex){
        if(DEBUG)console.log("vindex",vindex, ",interval_order", interval_order);
        setTimeout(function(){
        targetVideos[vindex].playVideo();
      },(targetVideos.length - vindex-1)*-interval);
    })(i)
    targetVideos[i].pauseVideo();
  }

}

function syncallt(time){
    pauseall();
    seekall(time);
    playall();
}

function syncalli(index){
    pauseall();
    seekall(targetVideos[index].getCurrentTime());
    playall();
}

function pauseall(){
  for (var i=0; i<targetVideos.length; i++){
    targetVideos[i].pauseVideo();
  }
}

function pause(index){
  targetVideos[index].pauseVideo();
}

function playall(sync){
  // check if all videos are in non-buffering state;
  if(sync){
    for (var i=0; i<targetVideos.length; i++){
      if(targetVideos[i].getPlayerState() == 3){
        setTimeout(function(){
          playall(sync);
        },50);
        return;
      }
    }
  }

  for (var i=0; i<targetVideos.length; i++){
    targetVideos[i].playVideo();
  }
}

function seekall(num){
  for (var i=0; i<targetVideos.length; i++){
    targetVideos[i].seekTo(num,true);
  }
}

function onPlayerReady(event) {
  var i = parseInt(event.target.getIframe().id.substr(5,1))
  var j = parseInt(event.target.getIframe().id.substr(7,1))
  if(!gridVideos[i]) gridVideos[i] = [];
  gridVideos[i][j] = event.target;
  event.target.mute()
  event.target.seekTo(0);
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
var done = false;

function parseYTState(num){
  if( num == -1) return "unstarted";
  if( num == 0) return "ended";
  if( num == 1) return "playing";
  if( num == 2) return "paused";
  if( num == 3) return "buffering";
  if( num == 5) return "video cued";
  return "unknown";
}

function setMark(){
  markTimestamp = (new Date()).getTime();
}

function unloop(index){
  if(index){
    clearInterval(loopHandles[index]);
    loopHandles[index] = null;
    return;
  }
  loopHandles.forEach(function(item){
    clearInterval(item);
  });
  loopHandles = [];
}

function loop(index,back,interval, phase){
  var goToTime = targetVideos[index].getCurrentTime() - back;
  targetVideos[index].seekTo(goToTime)
  var handle = setInterval(function(){
    targetVideos[index].seekTo(goToTime)
  },interval * 1000);
  if(loopHandles[index]){
    clearInterval(loopHandles[index]);
  }
  loopHandles[index] = handle;
}

function loopall(back, interval, phase){
  var now = (new Date()).getTime();
  if(!back){
    if(markTimestamp < 0){
      alert("set the marker first");
    }
    back = now - markTimestamp;
  }
  if(!interval) interval = back;
  for (var i=0; i<targetVideos.length; i++){
    loop(i,back,interval)
  }
}

function jump(i,num){
  jumpTimestamp = (new Date()).getTime();
  console.log("timeStamp:",jumpTimestamp, " i:", i);
  targetVideos[i].seekTo(targetVideos[i].getCurrentTime() + num,true);
}

function jumpall(num, phase){

  if(phase){
    for(var i=1; i< targetVideos.length; i++){
      var now = (new Date()).getTime();
      (function(index){
        setTimeout(function(){
          console.log("time taken: ", ((new Date()).getTime() - now));
          console.log("phase * index ", phase * index);
          jump(index,num)
        }, phase * index)
      })(i);
    }
    jump(0,num)
    return;
  }

  for(var i=0; i< targetVideos.length; i++){
    jump(i,num)
  }
}



function onPlayerStateChange(event) {
  var now = (new Date()).getTime();
  if(DEBUG)$("#state-" + event.target.h.id).text(parseYTState(event.data));
  if(DEBUG&&event.data == YTSTATE_PLAYING){
    console.log("now - jumpTimestamp:", (now - jumpTimestamp));
  }
  if(initialLoading && event.data == YTSTATE_PLAYING){
    numReadyVideo++;
    event.target.pauseVideo();
    event.target.seekTo(0);
    event.target.unMute()
  //  addVideo(numReadyVideo);
  }
  if(numReadyVideo == numLoadingVideo){
    initialLoading = false;
    targetVideos = [];
    for(var i = 0; i < gridVideos.length; i++)
    {
      targetVideos = targetVideos.concat(gridVideos[i]);
    }
  }
}

// run the function when the document is ready
$(document).ready(function () {
  var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
        lineNumbers: false,
        styleActiveLine: true,
        matchBrackets: true
    });
    // jquery ui
    $( "#resizable" ).resizable();
    $( "#resizable" ).draggable();

    var livecode = function(cm){
      var code = cm.getDoc().getSelection();
      if(code.length > 0){ // when there is any selected text
        if(DEBUG)console.log(code);
        try {
            eval(code);
        } catch (e) {
            if (e instanceof SyntaxError) {
                alert(e.message);
            }
            console.error(e);
        }
      }else{ // when there is no selectino, evaluate the line where the cursor is
        code = cm.getDoc().getLine(cm.getDoc().getCursor().line);
        if(DEBUG)console.log(code);
        try {
            eval(code);
        } catch (e) {
            if (e instanceof SyntaxError) {
                alert(e.message);
            }
            console.error(e);
        }
      }
    };
    var map = {"Shift-Enter": livecode};

	// for (i = 1; i <= 5; i++) {
	//     map["Ctrl-" + i] = function(cm) {
	//     	selectFromResult(i)
	//     }
	// }
	var jsCode = ""
	for (i = 1; i <= 5; i++) {
		jsCode += "map[\"Ctrl-\" + "+i+"] = function(cm) { selectFromResult("+i+") };\n";
	}
	eval(jsCode)

    editor.addKeyMap(map);

	$("#youtube-result").hide();
});

function addGrid(addRow,addCol,id){
  initialLoading = true;

  var row = divGrid.length + addRow;
  var col = addCol;
  if(divGrid[0])
    col +=  divGrid[0].length;

  if(id)
    youtubeid = id;

  if(row <0 || col < 0){
    alert("Row col value negatives.!");
    return;
  }

  var rowHeight = 12/row;
  var colWidth = 12/col;

  if(12%row!=0 || 12%col!=0){
    alert("we can only take a divisor of 12.");
    return;
  }

  var divrowclass = 'row-xs-'+rowHeight;
  var divcolclass = 'yt-cell col-sm-'+colWidth+' col-md-'+colWidth+' col-lg-'+colWidth+' col-xs-'+colWidth;

  var divrowhtml = '<div class='+divrowclass+'">'
  var divcolhtml = '<div class = "'+divcolclass+'"></div>'
  // let's resize the existing divs in grid.
  for (var i=0; i < divGrid.length; i++){
    divRowGrid[i].removeClass();
    divRowGrid[i].addClass(divrowclass);
    for (var j=0; j< divGrid[0].length; j++){
      $("#" + divGrid[i][j]).removeClass();
      $("#" + divGrid[i][j]).addClass(divcolclass);
      $("#" + divGrid[i][j]).attr('width',($("#" + divGrid[i][j]).attr('width') * divGrid[0].length / col));
      $("#" + divGrid[i][j]).attr('height',($("#" + divGrid[i][j]).attr('height') * divGrid.length / row));
    }
  }
  // let's add the videos
  cellWidth = $("#" + divGrid[0][0]).attr('width');
  cellHeight = $("#" + divGrid[0][0]).attr('height');

  // add cols first
  for (var i=0; i <divGrid.length; i++){
    if(!divGrid[0])
      divGrid = [];
    for (var j= divGrid[0].length; j< col; j++){
      numLoadingVideo++;
      var dcol = $(divcolhtml);
      dcol.attr("id","cell-"+ i +"-"+ j);
      divRowGrid[i].append(dcol)
      if(id)addVideo(i,j);
    }
  }

  // add rows first
  for (var i=divGrid.length; i <row; i++){
    var ddiv = $(divrowhtml);
    var ddiv_state = $(divrowhtml);
    divGrid[i] = [];
    $("#youtubegrid").append(ddiv);

    for (var j= 0; j< col; j++){
      numLoadingVideo++;
      var dcol = $(divcolhtml);
      dcol.attr("id","cell-"+ i +"-"+ j);
      ddiv.append(dcol)
      divGrid[i][j] = "cell-"+ i +"-"+ j;
      if(id)addVideo(i,j);
    }
    divRowGrid[i] = ddiv;
  }
}

function createGrid(row,col,id){
  youtubeid = id;
  initialLoading = true;
  divGrid  = [];
  divRowGrid  = [];
  unloop();
  $("#youtubegrid").empty();
  $("#youtubegrid-state").empty();
  numReadyVideo = 0;
  targetVideos = [];
  if(12%row!=0 || 12%col!=0){
    alert("we can only take a divisor of 12.");
    return;
  }
  numLoadingVideo = row * col;

  var rowHeight = 12/row;
  var colWidth = 12/col;
  var divrowhtml = '<div class="row-xs-'+rowHeight+'">'
  var divcolhtml = '<div class = "yt-cell col-sm-'+colWidth+' col-md-'+colWidth+' col-lg-'+colWidth+' col-xs-'+colWidth+'"></div>'
  var spanhtml = '<span class = "player_state">state</span>'
  for (var i=0; i<row; i++){
    var ddiv = $(divrowhtml);
    var ddiv_state = $(divrowhtml);
    divGrid[i] = [];
    for  (var j=0; j<col; j++){
      var dcol = $(divcolhtml);
      var dcol_state = $(divcolhtml);
      dcol.appendTo(ddiv);
      dcol.attr("id","cell-"+ i +"-"+ j);
      divGrid[i][j] = "cell-"+ i +"-"+ j;
      divRowGrid[i] = ddiv;
      if(DEBUG){
        dcol_state.addClass("div_state");
        var spanElem = $(spanhtml);
        spanElem.attr("id","state-cell-"+ i +"-"+ j);
        spanElem.appendTo(dcol_state);
      }
      dcol_state.appendTo(ddiv_state);
    }
    $("#youtubegrid").append(ddiv);
    if(DEBUG)$("#youtubegrid-state").append(ddiv_state);
    if(!DEBUG) $("#youtubegrid-state").remove();
  }

  cellHeight = ddiv.height();
  cellWidth = dcol.width();

  for ( i=0; i< row; i++){
    for ( j=0 ; j<col; j++){
      addVideo(i,j);
    }
  }
}

function addVideo(i,j){
  var player = new YT.Player("cell-"+ i +"-"+ j, {
     height: cellHeight,
     width:  cellWidth,
     videoId: youtubeid,
     events: {
       'onReady': onPlayerReady,
       'onStateChange': onPlayerStateChange
     },
     suggestedQuality:"small"
  });
}
var searchResult = [];

function setGrid(pRow,pCol) {
    row = pRow;
    col = pCol;
}

function setVideoId(text){
  alert(text);
}

function search(query) {
	$("#youtube-result").show();
	$('#youtube-result').empty();

	url = 'https://www.googleapis.com/youtube/v3/search';
	var params = {
		part: 'snippet',
		key: 'AIzaSyDAKDaBy_JDwcScSHqDQimOOLjdPImLanc', // github gist에서 본 api_token 이라서 새로 하나 받아야 할 것 같아요.
		q: query
	};

	$.getJSON(url, params, function (query) {
		searchResult = query.items
		searchResult.forEach(function(entry) {
		    if(DEBUG)console.log(entry.snippet.title); // 화면에 출력해보려고 했는데, codemirror에 output은 어떻게 하는지 잘 모르겠네요.
	    console.log(entry.snippet.title); // 화면에 출력해보려고 했는데, codemirror에 output은 어떻게 하는지 잘 모르겠네요.

			title = entry.snippet.title;
			thumburl =  entry.snippet.thumbnails.default.url;
			thumbimg = '<pre><img class="thumb" src="'+thumburl+'"></pre>';

			$('#youtube-result').append('<span id=yt-r-" +entry.id.videoId+ " yt-id=" +entry.id.videoId+ ">' + thumbimg + title + '</span>');

        // $("#youtube-result").append(entry.snippet.title + ",<span id=yt-r-" +entry.id.videoId+ " yt-id=" +entry.id.videoId+ ">" + entry.id.videoId + "</span><br>")
        $("#yt-r-" +entry.id.videoId).click(function(){
          updateCodeMirror(entry.id.videoId);
        });
		});
	});
}

function updateCodeMirror(data){
    var cm = $('.CodeMirror')[0].CodeMirror;
    var doc = cm.getDoc();
    var cursor = doc.getCursor(); // gets the line number in the cursor position
    var line = doc.getLine(cursor.line); // get the line contents
    var pos = { // create a new object to avoid mutation of the original selection
        line: cursor.line,
        ch: cursor.ch // set the character position to the end of the line
    }
    doc.replaceRange(data, pos); // adds a new line
}


function selectFromResult(index) {
	var videoId = searchResult[index-1].id.videoId;
	updateCodeMirror(videoId);
	// addGrid(row,col, videoId)

	$("#youtube-result").hide();


}
