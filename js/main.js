
var DEBUG = false;
var markTimestamp = -1;
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
var all = null;
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

function onPlayerReady(event) {
  var i = parseInt(event.target.getIframe().getAttribute("row"))
  var j = parseInt(event.target.getIframe().getAttribute("col"))
  if(!gridVideos[i]) gridVideos[i] = [];
  gridVideos[i][j] = event.target;
  function initialize(){
    if(event.target.mute == undefined){
      setTimeout(initialize,10);
      return;
    }
    event.target.mute()
    event.target.seekTo(0);
  }
  initialize();

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

// run the function when the document is ready
$(document).ready(function () {
  var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
        lineNumbers: false,
        styleActiveLine: true,
        matchBrackets: true,
        height: 'auto'
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


    editor.addKeyMap(map);

	$("#youtube-result").hide();

  $(window).keydown(function(e){
      if (e.ctrlKey){
        $("#code-container").toggle();
      }
  });
});

function addGrid(addRow,addCol,id){
  initialLoading = true;

  var row = gridVideos.length + addRow;
  var col = addCol;
  if(gridVideos[0])
    col +=  gridVideos[0].length;

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
  // let's add the videos
  cellWidth = $(document).width() / col;
  cellHeight = $(document).height() / col;

  // let's resize the existing divs in gridstack.
  for (var i=0; i < gridVideos.length; i++){
    divRowGrid[i].removeClass();
    divRowGrid[i].addClass(divrowclass);
    for (var j=0; j< gridVideos[0].length; j++){
      $(gridVideos[i][j].getIframe()).removeClass().addClass(divcolclass);
      gridVideos[i][j].setSize(cellWidth,cellHeight);
    }
  }


  // add cols first
  for (var i=0; i <gridVideos.length; i++){
    if(!gridVideos[0])
      gridVideos = [];
    for (var j= gridVideos[0].length; j< col; j++){
      numLoadingVideo++;
      var dcol = $(divcolhtml);
      dcol.attr("id","cell-"+ i +"-"+ j);
      dcol.attr("row",i);
      dcol.attr("col",j);
      divRowGrid[i].append(dcol)
      if(id)addVideo(i,j);
    }
  }

  // add rows first
  for (var i=gridVideos.length; i <row; i++){
    var ddiv = $(divrowhtml);
    var ddiv_state = $(divrowhtml);
    $("#youtubegrid").append(ddiv);

    for (var j= 0; j< col; j++){
      numLoadingVideo++;
      var dcol = $(divcolhtml);
      dcol.attr("id","cell-"+ i +"-"+ j);
      dcol.attr("row",i);
      dcol.attr("col",j);
      ddiv.append(dcol)
      if(id)addVideo(i,j);
    }
    divRowGrid[i] = ddiv;
  }
}

function createGrid(row,col,id){
  youtubeid = id;
  initialLoading = true;
  divRowGrid  = [];
  gridVideos = [];
  unloop();
  $("#youtubegrid").empty();
  $("#youtubegrid-state").empty();
  numReadyVideo = 0;
  targetVideos = [];
  if(12%row!=0 || 12%col!=0){
    alert("we can only take a divisor of 12.");
    return
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
    for  (var j=0; j<col; j++){
      var dcol = $(divcolhtml);
      var dcol_state = $(divcolhtml);
      dcol.appendTo(ddiv);
      dcol.attr("id","cell-"+ i +"-"+ j);
      dcol.attr("row",i);
      dcol.attr("col",j);
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

function search(query) {
	$("#youtube-result").show();
	$('#youtube-result').empty();

	url = 'https://www.googleapis.com/youtube/v3/search';
	var params = {
		part: 'snippet',
		key: 'AIzaSyDAKDaBy_JDwcScSHqDQimOOLjdPImLanc', // github gist에서 본 api_token 이라서 새로 하나 받아야 할 것 같아요.
		q: query,
		type: "video"
	};

	$.getJSON(url, params, function (query) {
		searchResult = query.items
		searchResult.forEach(function(entry) {
		  if(DEBUG)console.log(entry.snippet.title); // 화면에 출력해보려고 했는데, codemirror에 output은 어떻게 하는지 잘 모르겠네요.
	    console.log(entry.snippet.title); // 화면에 출력해보려고 했는데, codemirror에 output은 어떻게 하는지 잘 모르겠네요.

			title = entry.snippet.title;
			thumburl =  entry.snippet.thumbnails.default.url;
			thumbimg = '<img class="thumb-img" src="'+thumburl+'">';

			$('#youtube-result').append('<div class = "thumb" id="yt-r-' +entry.id.videoId+ '" yt-id="' +entry.id.videoId+ '"><div>' + thumbimg +'</div><div class = "thumb-title" >'+ title + '</div>');

        // $("#youtube-result").append(entry.snippet.title + ",<span id=yt-r-" +entry.id.videoId+ " yt-id=" +entry.id.videoId+ ">" + entry.id.videoId + "</span><br>")
      $("#yt-r-" +entry.id.videoId).click(function(){
        updateCodeMirror(entry.id.videoId);
      });
		});
	});
}

function updateCodeMirror(data){
    var doc = $('.CodeMirror')[0].CodeMirror.getDoc();
    doc.replaceSelection(data); // adds a new line
    $("#youtube-result").hide();
}


// methods to control playback
// scheme: func (param, index0, index1, index2, ...)

function playbackControl(indices, func) {
    var selectedVideos = []
    if (indices.length > 1) {
        for(var i=1; i< indices.length; i++){
            var index = indices[i];
            selectedVideos.push(targetVideos[index]);
        }
    } else if (indices.length == 1) {
        selectedVideos = targetVideos
    }

    var param = indices[0];

    for (var i=0; i<selectedVideos.length; i++) {
        func(selectedVideos[i], param)
    }
}

function speed(list, newSpeed) {
    var selectedVideos =  selectVideos(list);
    selectedVideos.forEach(function(video){
      video.setPlaybackRate(newSpeed)
    });
}

function mute(list, mute) {
    var selectedVideos =  selectVideos(list);
    selectedVideos.forEach(function(video){
      if (mute)
        video.mute()
      else
        video.unMute()
    });
}

function volume(list,vol) {
  var selectedVideos =  selectVideos(list);
  selectedVideos.forEach(function(video){
    video.setVolume(vol);
  });
}

function turnup(list, diff) {
  var selectedVideos =  selectVideos(list);
  selectedVideos.forEach(function(video){
    var newVolume = video.getVolume() + diff
    video.setVolume(newVolume)
  });
}
//function alternate(list, )
function replaceVideo(list, id, cancelloop) {
  var selectedVideos =  selectVideos(list);
  selectedVideos.forEach(function(video){
    video.cueVideoById(id)
    video.playVideo();
    if(video.loopHandle && cancelloop){
      clearInterval(video.loopHandle);
    }
  });
}

function fadeInInner(video, diff) {
    var currentVolume = video.getVolume();
    // console.log("cur: " + currentVolume + "/ diff: "+diff);
    if (currentVolume < 100) {
        video.setVolume(currentVolume + diff);
        return setTimeout((function() {
            return fadeInInner(video, diff);
        }), 100);
    }
}


function fadeIn(list,duration) {
    if(!duration) duration = 5;
    var diff = 10.0 / duration;
    var selectedVideos =  selectVideos(list);
    selectedVideos.forEach(function(v){
      v.setVolume(0);
      if(v.getPlayerState() != YTSTATE_PLAYING)
        v.playVideo();
    });

    selectedVideos.forEach(function(v){
      fadeInInner(v, diff);
    });

}

function fadeOutInner(video, diff) {
    var currentVolume = video.getVolume();
    if (currentVolume > 0) {
        video.setVolume(currentVolume - diff);
        return setTimeout((function() {
            return fadeOutInner(video, diff);
        }), 100);
    }
}

function fadeOut(list,duration) {
    if(!duration) duration = 5;
    var diff = 10.0 / duration;
    var selectedVideos =  selectVideos(list);
    selectedVideos.forEach(function(v){
      fadeOutInner(v, diff);
    });
}

function selectVideos(list){
  var selectedVideos = []
  if (list === parseInt(list, 10) ){
      selectedVideos.push(targetVideos[list])
  }
  else if (list == null) {
      selectedVideos = targetVideos
  }
  else if (list.length > 1) {
      for(var i=0; i< list.length; i++){
          var index = list[i];
          selectedVideos.push(targetVideos[index]);
      }
  }
  else{
    alert("ERROR: edge case found", list);
  }
  return selectedVideos;
}

function phase(list,interval){ // interval and video id

  var selectedVideos =  selectVideos(list);
  if(interval>=0){
    for (var i=1; i<selectedVideos.length; i++){
      (function(vindex){
        if(DEBUG)console.log("vindex",vindex);
          setTimeout(function(){
          selectedVideos[vindex].playVideo();
        },vindex*interval* 1000);
      })(i)
      selectedVideos[i].pauseVideo(); // do not need to
    }
    return ;
  }
 // interval < 0
  for (var i=selectedVideos.length-2; i>=0; i--){
    (function(vindex){
        if(DEBUG)console.log("vindex",vindex);
        setTimeout(function(){
          selectedVideos[vindex].playVideo();
        },(selectedVideos.length - vindex-1)*-interval* 1000);
    })(i)
    selectedVideos[i].pauseVideo();
  }

}

function sync(list, index){
    seek(list, targetVideos[index].getCurrentTime());
}

function pause(list){
  var selectedVideos =  selectVideos(list);

  selectedVideos.forEach(function(video){
      video.pauseVideo();
  });
}

function setQ(list, quality){
  var selectedVideos =  selectVideos(list);

  selectedVideos.forEach(function(video){
      video.setPlaybackQuality(quality);
  });
}

function play(list){
  var selectedVideos =  selectVideos(list);
  selectedVideos.forEach(function(video){
      video.playVideo();
  });
}

function seek(list, num){
  var selectedVideos =  selectVideos(list);
  selectedVideos.forEach(function(video){
      video.seekTo(num,true);
  });
}

function loop(list,back,interval, phase){
  var selectedVideos =  selectVideos(list);
  if(!phase) phase = 0;
/*  for (var i=0; selectedVideos.length; i++){
    var video = selectedVideos[i];
    var atTime = video.getCurrentTime() - back;
    video.seekTo(atTime)
    if(video.loopHandle){
      clearInterval(video.loopHandle);
    }
    video.loopHandle = setInterval(function(){
      video.seekTo(atTime)
    },(interval + i * phase)* 1000);
  }*/
  selectedVideos.forEach(function(video, index){
    var atTime = video.getCurrentTime() - back;
    video.seekTo(atTime)
    if(video.loopHandle){
      clearInterval(video.loopHandle);
    }
    video.loopHandle = setInterval(function(){
      video.seekTo(atTime)
    },(interval + index * phase)* 1000);
  });
}

function loopAt(list,atTime,interval, phase){
  var selectedVideos =  selectVideos(list);
  if(!phase) phase = 0;
/*  for (var i=0; selectedVideos.length; i++){
    var video = selectedVideos[i];
    video.seekTo(atTime)
    if(video.loopHandle){
      clearInterval(video.loopHandle);
    }
    (function(v){
      v.loopHandle = setInterval(function(){
        v.seekTo(atTime)
      },(interval + i * phase)* 1000);
    })(video);
  }*/
  selectedVideos.forEach(function(video, index){
    video.seekTo(atTime)
    if(video.loopHandle){
      clearInterval(video.loopHandle);
    }
    video.loopHandle = setInterval(function(){
      video.seekTo(atTime)
    },(interval + index * phase)* 1000);
  });
}

function unloop(list){
  var selectedVideos =  selectVideos(list);
  selectedVideos.forEach(function(video){
    if(video.loopHandle){
      clearInterval(video.loopHandle);
      video.loopHandle = null;
    }
  });
}

function jump(list,num,phase){
  var selectedVideos =  selectVideos(list);
  if(phase){
    selectedVideos.forEach(function(video){
        video.seekTo(video.getCurrenttime() + num,true);
    });
  }
  else{
    selectedVideos.forEach(function(video, index){
      setTimeout(function(){
        video.seekTo(video.getCurrenttime() + num,true);
      }, phase * index * 1000)
    });
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
