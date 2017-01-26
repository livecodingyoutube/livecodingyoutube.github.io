
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var row = 4;
var col = 4;
var numReadyVideo = 0;
var targetVideos = [];
var initialLoading = true;
function onYouTubeIframeAPIReady() {
  console.log("is ready");

}

function phase(interval){
  var sign = 1;
  if(interval<0){
    sign = -1;
    interval = -interval;
  }
  var index;
  for (var i=0; i<targetVideos.length; i++){
    index = i;
    if(sign<0) index= targetVideos.length-1-i;
    targetVideos[index].pauseVideo();
    (function(vindex,interval_order){
      console.log("vindex",vindex, ",interval_order", interval_order);
        setTimeout(function(){
        targetVideos[vindex].playVideo();
      },interval_order*interval);
    })(i,index)
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

function playall(sync){

  // check if all videos are in non-buffering state;
  if(sync){
    for (var i=0; i<targetVideos.length; i++){
      if(targetVideos[i].getPlayerState() == 3){
        setTimeout(function(){
          playall();
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
  targetVideos.push(  event.target);
  event.target.playVideo();

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

function re(num, phase){
  if(phase){
    for(var i=0; i< targetVideos.length; i++){
      (function(index){
        setTimeout(function(){
          targetVideos[index].seekTo(targetVideos[index].getCurrentTime() - num,true);
        }, phase * index)
      })(i);
    }
    return;
  }
  for(var i=0; i< targetVideos.length; i++){
    targetVideos[i].seekTo(targetVideos[i].getCurrentTime() - num,true);
  }
}

function ff(num, phase){
  if(phase){
    for(var i=0; i< targetVideos.length; i++){
      (function(index){
        setTimeout(function(){
          targetVideos[index].seekTo(targetVideos[index].getCurrentTime() + num,true);
        }, phase * index)
      })(i);
    }
  }

  for(var i=0; i< targetVideos.length; i++){
    targetVideos[i].seekTo(targetVideos[i].getCurrentTime() + num,true);
  }
}

function onPlayerStateChange(event) {
  $("#state-" + event.target.h.id).text(parseYTState(event.data));
  if(initialLoading && event.data == 1){
    numReadyVideo++;
    event.target.pauseVideo();
  }
  if(numReadyVideo == row * col){
    initialLoading = false;
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
        console.log(code);
        try {
            eval(code);
        } catch (e) {
            if (e instanceof SyntaxError) {
                alert(e.message);
            }
        }
      }else{ // when there is no selectino, evaluate the line where the cursor is
        code = cm.getDoc().getLine(cm.getDoc().getCursor().line);
        console.log(code);
        try {
            eval(code);
        } catch (e) {
            if (e instanceof SyntaxError) {
                alert(e.message);
            }
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
});

function addGrid(pRow,pCol, youtubeid){
  initialLoading = true;
  $("#youtubegrid").empty();
  $("#youtubegrid-state").empty();
  numReadyVideo = 0;
  row = pRow;
  col = pCol;
  targetVideos = [];
  if(12%row!=0 || 12%col!=0){
    alert("we can only take a divisor of 12.");
  }

  var rowHeight = 12/row;
  var colWidth = 12/col;
  var divrowhtml = '<div class="border-1px row-xs-'+rowHeight+'">'
  var divcolhtml = '<div class = "border-1px col-sm-'+colWidth+' col-md-'+colWidth+' col-lg-'+colWidth+' col-xs-'+colWidth+'"></div>'
  var spanhtml = '<span class = "player_state">state</span>'
  for (var i=0; i<row; i++){
    var ddiv = $(divrowhtml);
    var ddiv_state = $(divrowhtml);
    for  (var j=0; j<col; j++){
      var dcol = $(divcolhtml);
      var dcol_state = $(divcolhtml);
      dcol.appendTo(ddiv);
      dcol.attr("id","cell-"+(i * row + j));
      var spanElem = $(spanhtml);
      spanElem.attr("id","state-cell-"+(i * row + j));
      spanElem.appendTo(dcol_state);
      dcol_state.appendTo(ddiv_state);
    }
    $("#youtubegrid").append(ddiv);
    $("#youtubegrid-state").append(ddiv_state);
  }

  for (i=0; i<row; i++){
    for  (j=0; j<col; j++){
     var player = new YT.Player("cell-"+(i * row + j), {
        height: ddiv.height(),
        width:  dcol.width(),
        videoId: youtubeid,
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
        },
        suggestedQuality:"small"
      });
    }
  }

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
	url = 'https://www.googleapis.com/youtube/v3/search';
	var params = {
		part: 'snippet',
		key: 'AIzaSyDAKDaBy_JDwcScSHqDQimOOLjdPImLanc', // github gist에서 본 api_token 이라서 새로 하나 받아야 할 것 같아요.
		q: query
	};

	$.getJSON(url, params, function (query) {
		searchResult = query.items
		searchResult.forEach(function(entry) {
		    console.log(entry.snippet.title); // 화면에 출력해보려고 했는데, codemirror에 output은 어떻게 하는지 잘 모르겠네요.
        $("#youtube-result").append(entry.snippet.title + ",<span id=yt-r-" +entry.id.videoId+ " yt-id=" +entry.id.videoId+ ">" + entry.id.videoId + "</span><br>")
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
}
