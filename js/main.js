var rand = Math.random;
var iter = setInterval;
var overallQuality = 'small';
var playbakQualityStrings = ['small','medium','large','hd720','hd1080','highres']
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
var targetVideos = [];
var initialLoading = true;
var youtubeid = "";
var gridVideos = [];
var clickedVideos = [];

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
  event.target.setPlaybackQuality(overallQuality);

  if(!gridVideos[i]) gridVideos[i] = [];
  gridVideos[i][j] = event.target;
  event.target.lcy_i = i;
  event.target.lcy_j = j;
  function initialize(){
    if(event.target.mute == undefined){
      setTimeout(initialize,10);
      return;
    }
    event.target.mute()
    event.target.seekTo(0);
  }
  event.target.initialized = true;
  initialize();

}

function onPlayerPlaybackQualityChange(event) {
    var playbackQuality = event.target.getPlaybackQuality();

    if( playbackQuality != overallQuality) {
        console.log("Quality changed to: " + playbackQuality );
        var currentTime = event.target.getCurrentTime();
        event.target.setPlaybackQuality( overallQuality );
//        event.target.seekTo(currentTime, false);
    }
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

function gridSelected(i,j){
  console.log("selected(" + i+ "," + j + ")");
  $("#state-div-"+ i +"-"+ j).toggleClass("div_selected");
  clickedVideos[i * gridVideos[0].length + j] = !clickedVideos[i * gridVideos[0].length + j];
  console.log("clickedVideos:" + clickedVideos);
}

function indexToIJ(index){
  return [Math.floor(index /gridVideos.length), index % gridVideos.length];
}

// run the function when the document is ready
$(document).ready(function () {
  var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
        lineNumbers: false,
        styleActiveLine: true,
        matchBrackets: true,
        height: 'auto',
        mode:{name: "javascript", json: true}
    });
    // jquery ui
    $( "#resizable" ).resizable();
    $( "#resizable" ).draggable();

    var livecode = function(cm){
      var doc = cm.getDoc();
      var code = doc.getSelection();
      if(code.length > 0){ // when there is any selected text
        if(DEBUG)console.log(code);
        try {
            if(code.includes("setInterval")){
              var sure;
              if(code.substring(0,10)== "setInterval"){
                sure = confirm("Are you sure you that want setInterval without a handle?");
                if(!sure)return;
              }
              if(!code.includes("clearInterval")){
                var sure = confirm("Are you sure? This does not have clearInterval. ");
                if(!sure) return;
              }
            }
            eval(code);
            _.defer(function(){
              var start = doc.getCursor("anchor");
              var end = doc.getCursor("head");
              if(start.line > end.line || (start.line == end.line && start.ch > end.ch)){
                var temp = start;
                start = end;
                end = temp;
              }
              var obj = doc.markText(start,end,{className:"ex-high"});
              setTimeout(function(){
                _.defer(function(){
                  obj.clear();
                });
              },100);
            });

        } catch (e) {
            alert(e.message);
            console.error(e);
        }
      }else{ // when there is no selectino, evaluate the line where the cursor is
        code = doc.getLine(cm.getDoc().getCursor().line);
        if(DEBUG)console.log(code);
        try {
            eval(code);
            _.defer(function(){
              var start = doc.getCursor();
              var obj = doc.markText({line:start.line, ch:0},{line:start.line, ch:code.length},{className:"ex-high"});
              setTimeout(function(){
                _.defer(function(){
                  obj.clear();
                });
              },100);
            });
        } catch (e) {
            alert(e.message);
            console.error(e);
        }
      }
    };

    var map = {"Shift-Enter": livecode};
    var showHelp = function(cm){
      var code = cm.getDoc().getSelection();
      if (code.length <= 0){ // when there is any selected text
        code = cm.getDoc().getLine(cm.getDoc().getCursor().line);
      }
      var index = code.indexOf('(');
      var fName = code.substring(0, index);
      console.log(fName);
      help(fName);
    };

    var map = {
      "Shift-Enter": livecode,
      "Alt-Enter": showHelp
    };
    editor.addKeyMap(map);

	$(".youtube-result").hide();

  $(window).keydown(function(ev){
    var keycode = ev.which;
      if (keycode == 93 || keycode == 18){ // need to get
        $(".div_selected").removeClass("div_selected");

        if($(".go-back-editor").is(':visible') ){
          $("#code-container").show();
          $(".go-back-editor").hide();
          $("#youtubegrid-state").show();
        }else{
          $("#code-container").hide();
          $(".go-back-editor").show();
          $("#youtubegrid-state").hide();
        }
        clickedVideos = [];

      }else if (keycode==27){
        var list =[];
        $(".div_selected").removeClass("div_selected");
        if($("#code-container").is(':visible') ){
          $("#code-container").hide();
          $(".go-back-editor").hide();
        }else{
          $("#code-container").show();
          $(".go-back-editor").hide();
        }

        if(clickedVideos.length>0){
          for (var i=0; i < clickedVideos.length; i++){
            if (clickedVideos[i]){
              list.push(i);
            }
          }
          if(list.length == 1){
            updateCodeMirror(JSON.stringify(list[0]));
          }else if (list.length >1){
            updateCodeMirror(JSON.stringify(list));
          }
        }

        clickedVideos = [];

      }
  });

  $(".go-back-button").click(function(){
    $("#code-container").toggle();
    $(".go-back-editor").toggle();
    $("#youtubegrid-state").show();
  });

  $(".search-result-close-button").click(function(){
    $(".youtube-result").toggle();
  })
});

/**
 * Add columns and rows to the grid
 * @param {integer} addRow - number of rows to add.
 * @param {integer} addCol - number of columns to add.
 * @param {string} id - YouTube identifier.
 */
function add(addRow,addCol,id){
  initialLoading = true;

  var row = gridVideos.length + addRow;
  var col = addCol;

  if(gridVideos[0])
    col +=  gridVideos[0].length;
  if(12%row!=0 || 12%col!=0){
    alert("we can only take a divisor of 12.");
    return;
  }
  if(id)
    youtubeid = id;

  if(row <0 || col < 0){
    alert("Row col value negatives.!");
    return;
  }

  var rowHeight = 12/row;
  var colWidth = 12/col;

  var divrowclass = 'row-xs-'+rowHeight;
  var divcolclass = 'col-sm-'+colWidth+' col-md-'+colWidth+' col-lg-'+colWidth+' col-xs-'+colWidth;

  var divrowhtml = '<div class="'+divrowclass+'">'
  var divcolhtml = '<div class = "'+divcolclass+'"></div>'
  var spanhtml = '<span class = "player_state">state</span>'

  // let's add the videos
  cellWidth = $(document).width() / col;
  cellHeight = $(document).height() / row;

  // let's resize the existing divs in gridstack.
  for (var i=0; i < gridVideos.length; i++){
    $(".row-"+i).removeClass().addClass(divrowclass).addClass("row-"+i);
    $(".row-state-"+i).removeClass().addClass(divrowclass).addClass("row-state-"+i);
    for (var j=0; j< gridVideos[0].length; j++){
      $(gridVideos[i][j].getIframe()).removeClass().addClass(divcolclass);
      gridVideos[i][j].setSize(cellWidth,cellHeight);
      $("#state-div-"+ i +"-"+ j).removeClass()
      .addClass(divcolclass)
      .addClass("div_state");
    }
  }

  // add cols first
  for (var i=0; i <gridVideos.length; i++){
    if(!gridVideos[0])
      gridVideos = [];
    var ddiv_state = $(".row-state-" + i);
    for (var j= gridVideos[0].length; j< col; j++){
      numLoadingVideo++;
      var dcol = $(divcolhtml);
      dcol.attr("id","cell-"+ i +"-"+ j);
      dcol.attr("row",i);
      dcol.attr("col",j);
      $(".row-"+i).append(dcol);
      var dcol_state = $(divcolhtml);
      dcol_state.addClass("div_state").attr("id","state-div-"+ i +"-"+ j);
      dcol_state.addClass("div_state").attr("onclick","gridSelected(" + i+ "," + j + ")");
      dcol_state.appendTo(ddiv_state);

      if(DEBUG){
        $(spanhtml).attr("id","state-cell-"+ i +"-"+ j).appendTo(dcol_state);
      }
      if(id)addVideo(i,j);
    }
  }

  // and then add rows
  for (var i=gridVideos.length; i <row; i++){
    var ddiv = $(divrowhtml).addClass("row-" + i);
    var ddiv_state = $(divrowhtml);
    ddiv_state.addClass("row-state-" + i);

    $("#youtubegrid").append(ddiv);
    $("#youtubegrid-state").append(ddiv_state);
    for (var j= 0; j< col; j++){
      numLoadingVideo++;
      var dcol = $(divcolhtml);
      dcol.attr("id","cell-"+ i +"-"+ j);
      dcol.attr("row",i);
      dcol.attr("col",j);
      ddiv.append(dcol)
      var dcol_state = $(divcolhtml).addClass("div_state").attr("id","state-div-"+ i +"-"+ j).appendTo(ddiv_state).attr("onclick","gridSelected(" + i+ "," + j + ")");

      if(DEBUG){
        $(spanhtml).attr("id","state-cell-"+ i +"-"+ j).appendTo(dcol_state);
      }
      if(id)addVideo(i,j);
    }
  }
}

/**
 * Create a grid
 * @param {integer} row - number of rows to create.
 * @param {integer} col - number of columns to create.
 * @param {string} id - YouTube identifier.
 */
function create(row,col,id){
  if(12%row!=0 || 12%col!=0){
    alert("we can only take a divisor of 12.");
    return
  }
  youtubeid = id;
  initialLoading = true;
  gridVideos = [];
  unloop();
  $("#youtubegrid").empty();
  $("#youtubegrid-state").empty();
  targetVideos = [];

  numLoadingVideo = row * col;

  var rowHeight = 12/row;
  var colWidth = 12/col;
  var divrowhtml = '<div class="row-xs-'+rowHeight+'">'
  var divcolhtml = '<div class = "col-sm-'+colWidth+' col-md-'+colWidth+' col-lg-'+colWidth+' col-xs-'+colWidth+'"></div>'
  var spanhtml = '<span class = "player_state">state</span>'
  for (var i=0; i<row; i++){
    var ddiv = $(divrowhtml);
    ddiv.addClass("row-"+i);
    var ddiv_state = $(divrowhtml);
    ddiv_state.addClass("row-state-"+i);
    for  (var j=0; j<col; j++){
      var dcol = $(divcolhtml);
      dcol.appendTo(ddiv);
      dcol.attr("id","cell-"+ i +"-"+ j);
      dcol.attr("row",i);
      dcol.attr("col",j);
        var dcol_state = $(divcolhtml);
        dcol_state.addClass("div_state");
        dcol_state.attr("id","state-div-"+ i +"-"+ j).attr("onclick","gridSelected(" + i+ "," + j + ")");
;
      if(DEBUG){
        $(spanhtml).attr("id","state-cell-"+ i +"-"+ j).appendTo(dcol_state);
      }
      dcol_state.appendTo(ddiv_state);
    }
    $("#youtubegrid").append(ddiv);
    $("#youtubegrid-state").append(ddiv_state);
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
       'onStateChange': onPlayerStateChange,
       'onPlaybackQualityChange':onPlayerPlaybackQualityChange,
     },
     suggestedQuality:overallQuality
  });
}
var searchResult = [];

/**
 * Search YouTube. Selecto item on the right of the screen to get the YouTube identifier text.
 * @param {string} query - Query to search.
 */
function search(query) {
	$(".youtube-result").show();
	$('.youtube-result-list').empty();

	url = 'https://www.googleapis.com/youtube/v3/search';
	var params = {
		part: 'snippet',
//		key: 'AIzaSyDAKDaBy_JDwcScSHqDQimOOLjdPImLanc', // github gist에서 본 api_token 이라서 새로 하나 받아야 할 것 같아요.
		key: 'AIzaSyCOBqbpI5_-ePjfJ91Tbr1ElADByO57gEQ',
		q: query,
		type: "video",
    maxResults: 20,
    videoEmbeddable	:"true",
    videoLicense:"youtube"
	};

	$.getJSON(url, params, function (query) {
		searchResult = query.items
		searchResult.forEach(function(entry) {
		  if(DEBUG)console.log(entry.snippet.title);
	    console.log(entry.snippet.title);

			title = entry.snippet.title;
			thumburl =  entry.snippet.thumbnails.default.url;
			thumbimg = '<img class="thumb-img" src="'+thumburl+'">';

			$('.youtube-result-list').append('<div class = "thumb" id="yt-r-' +entry.id.videoId+ '" yt-id="' +entry.id.videoId+ '"><div>' + thumbimg +'</div><div class = "thumb-title" >'+ title + '</div>');

      $("#yt-r-" +entry.id.videoId).click(function(){
        updateCodeMirror("\"" + entry.id.videoId + "\"");
      });
		});
	});
}

function updateCodeMirror(data){
    var doc = $('.CodeMirror')[0].CodeMirror.getDoc();
    doc.replaceSelection(data); // adds a new line
    $(".youtube-result").hide();
    $('.CodeMirror')[0].CodeMirror.focus();

}


/**
 * Change playback speed of the selected videos.
 * @param {select} videos - See [how to select videos]{@link _howToSelectVideos}.
 * @param {float} newSpeed - New speed.
 */
function speed(list, newSpeed) {
    var selectedVideos =  selectVideos(list);
    selectedVideos.forEach(function(video){
      video.setPlaybackRate(newSpeed)
    });
}

/**
 * mute/unMute the selected videos.
 * @param {select} videos - See [how to select videos]{@link _howToSelectVideos}.
 * @param {bool} mute - true = mute / false = unMute.
 */
function mute(list, mute) {
    var selectedVideos =  selectVideos(list);
    selectedVideos.forEach(function(video){
      if (mute)
        video.mute()
      else
        video.unMute()
    });
}

/**
 * Set volume of the selected videos.
 * @param {select} videos - See [how to select videos]{@link _howToSelectVideos}.
 * @param {integer} vol - New volume. (0 ~ 100)
 */
function volume(list,vol) {
  var selectedVideos =  selectVideos(list);
  selectedVideos.forEach(function(video){
    //video.setVolume(vol);
    adjustVolume(video, vol);
  });
}

function adjustVolume(video, vol){
  video.setVolume(vol);
  var opacity = 1 - vol/100;
  $("#state-div-"+ video.lcy_i +"-"+ video.lcy_j).css("opacity", opacity);
}

/**
 * Increase (or decrease) volume of the selected videos.
 * @param {select} videos - See [how to select videos]{@link _howToSelectVideos}.
 * @param {integer} diff - To decrease volume, pass negative number.
 */
function turnup(list, diff) {
  var selectedVideos =  selectVideos(list);
  selectedVideos.forEach(function(video){
    var newVolume = video.getVolume() + diff
    //video.setVolume(newVolume)
    adjustVolume(video, newVolume);
  });
}
//function alternate(list, )

/**
 * Replace the selected videos with id.
 * @param {select} videos - See [how to select videos]{@link _howToSelectVideos}.
 * @param {string} id - YouTube identifier.
 * @param {bool} cancelloop - To cancel the loop that may have been set earlier.
 */
 function cue(list, id, cancelloop) {
   if(!cancelloop) cancelloop = true;
  var selectedVideos =  selectVideos(list);
  selectedVideos.forEach(function(video){
    video.cueVideoById(id)
    video.initialized = true;
    video.mute();
    video.playVideo();
    video.setPlaybackRate(1);
    adjustVolume(video, 100);
    event.target.initialized = true;
    if(video.loopHandle && cancelloop){
      clearInterval(video.loopHandle);
    }
    if(video.here)video.here = null;
  });
}

function fadeInInner(video, diff) {
    video.lcy_fading = true;

    var currentVolume = video.getVolume();
    // console.log("cur: " + currentVolume + "/ diff: "+diff);
    if (currentVolume < 100) {
        //video.setVolume(currentVolume + diff);
        adjustVolume(video,currentVolume + diff );
        return setTimeout((function() {
            return fadeInInner(video, diff);
        }), 100);
    }
    video.lcy_fading = false;

}

/**
 * Start playing the selected videos with increasing volume.
 * @param {select} videos - See [how to select videos]{@link _howToSelectVideos}.
 * @param {integer} duration - Duration of time in seconds.
 */
function fadeIn(list,duration) {
    if(!duration) duration = 5;
    var diff = 10.0 / duration;
    var selectedVideos =  selectVideos(list);
    /*selectedVideos.forEach(function(v){
      v.setVolume(0);
    });
*/
    var fadeInCall = function(v){
      if(!v.lcy_fading){
        fadeInInner(v, diff);
      }else{
        setTimeout(function(){
          fadeInCall(v);
        },100);
      }
    };
    selectedVideos.forEach(fadeInCall);
    /*
    selectedVideos.forEach(function(v){
      fadeInInner(v, diff);
    });
*/
}

function fadeOutInner(video, diff) {
    video.lcy_fading = true;
    var currentVolume = video.getVolume();
    if (currentVolume > 0) {
        //video.setVolume(currentVolume - diff);
        adjustVolume(video, currentVolume - diff);
        return setTimeout((function() {
            return fadeOutInner(video, diff);
        }), 100);
    }
    video.lcy_fading = false;
}

/**
 * Fade out the volume of selected videos.
 * @param {select} videos - See [how to select videos]{@link _howToSelectVideos}.
 * @param {integer} duration - Duration of time in seconds.
 */
function fadeOut(list,duration) {
    if(!duration) duration = 5;
    var diff = 10.0 / duration;
    var selectedVideos =  selectVideos(list);
    var fadeOutCall = function(v){
      if(!v.lcy_fading){
        fadeOutInner(v, diff);
      }else{
        setTimeout(function(){
          fadeOutCall(v);
        },100);
      }
    };
    selectedVideos.forEach(fadeOutCall);
}

/**
 * Returns an array of video index that excludes the specified video index.
 * e.g. if the current grid is 3X3.
 * not(1) returns [0,2,3,4,5,6,7,8]
 * e.g. if the current grid is 4X4.
 * not(8,7) returns [0,1,2,3,4,5,6,9,10,11,12,13,14,15]
 * @param {integer[]} indices - Indices to exclude.
 */
 function not() {
 	var list = [...Array(targetVideos.length).keys()];
 	for (var i = 0; i < arguments.length; i++) {
 		target = arguments[i];
 		index = list.indexOf(target);
 		if (index > -1) {
 			list.splice(index, 1);
 		}
 	}
 	return list;
 }

function selectVideos(list){
  var selectedVideos = []

  if (typeof(list) == "string") {
  	var condition = list;
  	var selectedVideos = [];
	for (var i = 0; i < targetVideos.length; i++) {
   		if (eval(i + condition))
   			selectedVideos.push(targetVideos[i]);
	}
	return selectedVideos;
  }
  else if (list === parseInt(list, 10) ){
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
    return null;
  }
  return selectedVideos;
}

/**
 * Phase
 * @param {select} videos - See [how to select videos]{@link _howToSelectVideos}.
 * @param {integer} interval - interval
 */
function phase(list,interval){ // interval and video id

  var selectedVideos =  selectVideos(list);
  if(interval>=0){
    for (var i=1; i<selectedVideos.length; i++){
      (function(vindex){
        if(DEBUG)console.log("vindex",vindex);
          setTimeout(function(){
          selectedVideos[vindex].seekTo(selectedVideos[vindex].getCurrentTime()- vindex*interval);
        },vindex*interval* 1000);
      })(i)
    }
    return ;
  }
 // interval < 0
  for (var i=selectedVideos.length-2; i>=0; i--){
    (function(vindex){
        if(DEBUG)console.log("vindex",vindex);
        setTimeout(function(){
          selectedVideos[vindex].seekTo(selectedVideos[vindex].getCurrentTime()- (selectedVideos.length - vindex-1)*-interval);
        },(selectedVideos.length - vindex-1)*-interval* 1000);
    })(i)
  }

}

/**
 * Delay
 * @param {select} videos - See [how to select videos]{@link _howToSelectVideos}.
 * @param {integer} interval - interval
 */
function delay(list,interval){ // interval and video id

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

/**
 * Sync
 * @param {select} videos - See [how to select videos]{@link _howToSelectVideos}.
 * @param {integer} index - index
 */
function sync(list, index){
    seek(list, targetVideos[index].getCurrentTime());
}

/**
 * Pause the selected videos
 * @param {select} videos - See [how to select videos]{@link _howToSelectVideos}.
 */
function pause(list){
  var selectedVideos =  selectVideos(list);

  selectedVideos.forEach(function(video){
      video.pauseVideo();
  });
}

/**
 * Set the quality of videos (any video that is retrieved after this code runs will be set with the specified quality
 * @param {select} videos - See [how to select videos]{@link _howToSelectVideos}.
 * @param {string} quality - small, medium, large, hd720, hd1080, highres, or default.
 */
function setQ(list, quality){
  if(playbakQualityStrings.includes(quality))
  {
    //overallQuality = quality;
    var selectedVideos =  selectVideos(list);
    selectedVideos.forEach(function(video){
      video.setPlaybackQuality(quality);
    });
  }
  else{
    alert(quality + ' is not a possible value.')
  }

}

/**
 * Set the quality of videos (any video that is retrieved after this code runs will be set with the specified quality
 * @param {string} quality - small, medium, large, hd720, hd1080, highres, or default.
 */
function setQoverall(quality){
  if(playbakQualityStrings.includes(quality))
  {
    overallQuality = quality;
  }
  else{
    alert(quality + ' is not a possible value.')
  }

}

/**
 * Play the selected videos
 * @param {select} videos - See [how to select videos]{@link _howToSelectVideos}.
 */
function play(list){
  var selectedVideos =  selectVideos(list);
  selectedVideos.forEach(function(video){
      video.playVideo();
  });
}

/**
 * Seek to specified time.
 * @param {select} videos - See [how to select videos]{@link _howToSelectVideos}.
 * @param {integer} seconds - time in seconds.
 */
function seek(list, seconds){
  var selectedVideos =  selectVideos(list);
  selectedVideos.forEach(function(video){
      video.seekTo(seconds,true);
  });
}

/**
 * Loop
 * @param {select} videos - See [how to select videos]{@link _howToSelectVideos}.
 * @param {integer} back - back
 * @param {integer} interval - interval
 * @param {integer} phase - phase
 */
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
function here(list){
  var selectedVideos =  selectVideos(list);
  selectedVideos.forEach(function(video, index){
    if(!video.here){
      video.here = video.getCurrentTime();
      return;
    }
    // this is problematic
    loopAt(list,video.here,video.getCurrentTime() - video.here);
    video.here = null;
  });
}

/**
 * LoopAt
 * @param {select} videos - See [how to select videos]{@link _howToSelectVideos}.
 * @param {integer} atTime - atTime
 * @param {integer} interval - interval
 * @param {integer} phase - phase
 */
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

/**
 * Unloop
 * @param {select} videos - See [how to select videos]{@link _howToSelectVideos}.
 */
function unloop(list){
  var selectedVideos =  selectVideos(list);
  selectedVideos.forEach(function(video){
    if(video.loopHandle){
      clearInterval(video.loopHandle);
      video.loopHandle = null;
    }
  });
}

/**
 * Jump
 * @param {select} videos - See [how to select videos]{@link _howToSelectVideos}.
 * @param {integer} num - num
 * @param {integer} phase - phase
 */
function jump(list,num,phase){
  var selectedVideos =  selectVideos(list);
  if(phase){
    selectedVideos.forEach(function(video){
        video.seekTo(video.getCurrentTime() + num,true);
    });
  }
  else{
    selectedVideos.forEach(function(video, index){
      setTimeout(function(){
        video.seekTo(video.getCurrentTime() + num,true);
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
  if(event.target.initialized){
    targetVideos = [];
    for(var i = 0; i < gridVideos.length; i++)
    {
      targetVideos = targetVideos.concat(gridVideos[i]);
    }
    if( event.data == YTSTATE_PLAYING){
      event.target.initialized = false;
      event.target.pauseVideo();
      event.target.seekTo(0);
      event.target.unMute()
        event.target.setPlaybackQuality(overallQuality);

      initialLoading = false;
    }


  }
  if( event.data == YTSTATE_ENDED){
     event.target.seekTo(0);
      event.target.playVideo();
  }
}

function help() {
  var path = '/doc/global.html'
  if (arguments.length == 1) {
    var fName = arguments[0];
    path += '#' + fName;
  }
  console.log(path);
  var win = window.open(path, '_blank');
  win.focus();
}

/**
 * For the most of the methods below, you need to specify which videos to control.
 * There are various ways to select videos.
 * @param {integer} index - Single index of video
 * @param {null|all} all - All the videos
 * @param {integer[]} list - Indices of videos
 * @param {not(indices)} not - All except indices. See [not()]{@link not}
 * @param {string} expression - Condition text (e.g. ">3" or "%2==0")
 */
function _howToSelectVideos() {
}
