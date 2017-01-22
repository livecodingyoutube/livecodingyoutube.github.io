
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

function pauseall(){
  for (var i=0; i<targetVideos.length; i++){
    targetVideos[i].pauseVideo();
  }
}

function playall(){
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
    (function(index){
      setTimeout(function(){
        targetVideos[index].seekTo(targetVideos[index].getCurrentTime() + num,true);
      }, phase * index)
    })(i);
    return;
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

$(document).ready(function () {
  var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
        lineNumbers: false,
        styleActiveLine: true,
        matchBrackets: true
    });

    $( "#resizable" ).resizable();
    $( "#resizable" ).draggable();

    var livecode = function(cm){
      var code = cm.getDoc().getSelection();
      if(code.length > 0){
        console.log(code);
        try {
            eval(code);
        } catch (e) {
            if (e instanceof SyntaxError) {
                alert(e.message);
            }
        }
      }else{
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
