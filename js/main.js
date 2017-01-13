var testYTLink = '<iframe width="300" height="200" src="https://www.youtube.com/embed/UOQ40DqGZ5A?playlist=UOQ40DqGZ5A&autoplay=1&start=30&end=35&loop=1&vq=tiny" frameborder="0" allowfullscreen></iframe>';
$(document).ready(function () {
  var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
        lineNumbers: false,
        styleActiveLine: true,
        matchBrackets: true
    });

    $( "#resizable" ).resizable();
    $( "#resizable" ).draggable();
    for (var i=1; i<= 16; i++){
      $("#cell" + i).append(testYTLink);
    }
});


function addGrid(i,j){
  if(12%i!=0 || 12%k!=0){
    alert("we can only take a divisor of 12.");
  }

  var row = 12/i;
  var col = 12/i;
  var divrowhtml = '<div class="row-xs-'+row+'">'
  var divcolhtml = '<div class = "col-sm-'+col+' col-md-'+col+' col-lg-'+col+' col-xs-'+col+'">1</div>'
  for (var i=0; i<row; i++){
    var ddiv = $(divrowhtml);
    for  (var j=0; j<col; j++){
      ddive.appendTo(divcolhtml);
    }
  }
}
