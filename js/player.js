/* BBPlayer + LeapJS */


  var bbplayer = [];
  
  //Pad a number with leading zeros
  function zeroPad(number, places) {
    var zeros = places - number.toString().length + 1;
    return new Array(+(zeros > 0 && zeros)).join("0") + number;
  }


  // Convert seconds to mm:ss format
  function toTimeString(seconds) {
    if (isNaN(seconds)) {
      return "--:--";
    }
    var minutes = Math.floor(seconds / 60);
    seconds = seconds - minutes * 60;
    return zeroPad(minutes, 2) + ":" + zeroPad(seconds, 2);
  }


  // Parse out file name from path, unescape
  function parseTitle(path) {
    path = decodeURI(path);
    return path.split('/').pop().split('.').shift();
  }

  // Object to represent bbplayer
  var BBPlayer = function (bbplayer) {
    this.bbplayer  = bbplayer;
    this.bbaudio   = bbplayer.find("audio");
    this.bbdebug   = bbplayer.find(".bb-debug well");
    this.bbaudio.get(0).preload = "auto"; // seems not to preload on many mobile browsers.
    this.state     = "paused"; // TODO enum states
    this.trackList = [];
    this.init();
  };


  // Debug logger
  BBPlayer.prototype.log = function (msg) {
    if (this.bbdebug) {
      this.bbdebug.append(msg + "<br>");
      this.bbdebug.scrollTop(this.bbdebug.prop('scrollHeight') - this.bbdebug.height());
    }
  };
  
  // Converting console.log to a debug panel message
  if (typeof console  != "undefined") 
    if (typeof console.log != 'undefined')
              console.olog = console.log;
          else
              console.olog = function() {};
      
      console.log = function(message) {
          console.olog(message);
          $('#debug').append(message + '<br>');
      };
  console.error = console.debug = console.info =  console.log
  
  /** UI Warning Generation Module **/
  bootstrap_alert = function() {}
  bootstrap_alert.generate = function(message, errorType) {
              $('#alert-holder').html('<div class="alert alert-dismissable alert-'+errorType+'"> <button type="button" class="close" data-dismiss="alert">&times</button>'+message+'</div>').fadeIn('fast').delay(4000);
  }
  
  // Device Status Display
  device = function() {}
  device.status = function(status,statusType) {
  $('#device-status').html('<a class="dropdown-toggle"><span class="label label-'+statusType+'">'+status+'</span></a>');
  }
  
  // Socket Status Display
  socket = function() {}
  socket.status = function(status,statusType) {
  $('#socket-status').html('<a class="dropdown-toggle"><span class="label label-'+statusType+'">'+status+'</span></a>');
  }
  
  // Socket Status Display
  browserFocus = function() {}
  browserFocus.status = function(status,statusType) {
  $('#focus').html('<a class="dropdown-toggle"><span class="label label-'+statusType+'">'+status+'</span></a>');
  }
             
  // say if audio element can play file type
  BBPlayer.prototype.canPlay = function (extension) {
    var audioElem = this.bbaudio.get(0);
    if ((/mp3/i).test(extension) && audioElem.canPlayType('audio/mpeg')) {
      return true;
    }
    if ((/ogg/i).test(extension) && audioElem.canPlayType('audio/ogg')) {
      return true;
    }
    return false;
  };


  // Set up multiple sources as track list,
  // Remove duplicate and unplayable sources
  BBPlayer.prototype.loadSources = function () {
    var self = this;
    self.log('func: loadSources');
    self.bbaudio.find("source").each(function (x) {
      var fileName  = $(this).attr('src').split('/').pop();
      var extension = fileName.split('.').pop();
      var trackName = fileName.split('.').shift();
      var playable  = self.canPlay(extension);
      var audioElem = self.bbaudio.get(0);
      if ($.inArray(trackName, self.trackList) === -1 && playable === true) {
        self.trackList.push(trackName);
      } else {
        $(this).remove();
      }
    });
  };


  // Update display
  BBPlayer.prototype.updateDisplay = function () {
    var audioElem = this.bbaudio.get(0);
    var duration  = toTimeString(Math.ceil(audioElem.duration));
    var elapsed   = toTimeString(Math.ceil(audioElem.currentTime));
    var title     = parseTitle(audioElem.currentSrc);
    this.bbplayer.find('.bb-trackLength').html(duration);
    this.bbplayer.find('.bb-trackTime').html(elapsed);
    this.bbplayer.find('.bb-trackTitle').html(title);
  };


  // Set current source for audio to given track number
  BBPlayer.prototype.loadTrack = function (trackNumber) {
    var source  = this.bbaudio.find("source").eq(trackNumber).attr('src');
    this.bbaudio.get(0).src = source;
    this.currentTrack = trackNumber;
    console.log('func: loadTrack: loaded ' + source);
  };


  // Load next track in playlist
  BBPlayer.prototype.loadNext = function () {
    console.log('func: loadNext');
    var trackCount = this.bbaudio.find("source").length;
    var newTrack   = ((1 + this.currentTrack) % trackCount);
    this.loadTrack(newTrack);
  };


  // Load previous track in playlist
  BBPlayer.prototype.loadPrevious = function () {
    console.log('func: loadPrevious');
    var trackCount = this.bbaudio.find('source').length;
    var newTrack = (this.currentTrack + (trackCount - 1)) % trackCount;
    this.loadTrack(newTrack);
  };


  // Set up event handlers for audio element events
  BBPlayer.prototype.setAudioEventHandlers = function () {

    var self = this;
    self.log('func: setAudioEventHandlers');

    self.bbaudio.on('abort', function () {
      self.log('event: audio abort');
    });

    // Update display and continue play when song has loaded
    self.bbaudio.on('canplay', function () {
      self.log('event: audio canplay');
      if (self.state === 'playing' && $(this).get(0).paused) {
        $(this).get(0).play();
      }
      self.updateDisplay();
    });

    self.bbaudio.on('canplaythrough', function () {
      self.log('event: audio canplaythrough');
    });

    self.bbaudio.on('durationchange', function () {
      self.log('event: audio durationchange');
    });

    self.bbaudio.on('emptied', function () {
      self.log('event: audio emptied');
    });

    // Load next track when current one ends
    self.bbaudio.on('ended', function () {
      self.log('event: audio ended');
      self.loadNext();
    });

    self.bbaudio.on('error', function () {
      self.log('event: audio error');
    });

    self.bbaudio.on('loadeddata', function () {
      self.log('event: audio loadeddata');
    });

    self.bbaudio.on('loadedmetadata', function () {
      self.log('event: audio loadedmetadata');
    });

    self.bbaudio.on('loadstart', function () {
      self.log('event: audio loadstart');
    });

    self.bbaudio.on('pause', function () {
      self.log('event: audio pause');
    });

    self.bbaudio.on('play', function () {
      self.log('event: audio play');
    });

    self.bbaudio.on('playing', function () {
      self.log('event: audio playing');
    });

    self.bbaudio.on('progress', function () {
      self.log('event: audio progress');
    });

    self.bbaudio.on('ratechange', function () {
      self.log('event: audio ratechange');
    });

    self.bbaudio.on('seeked', function () {
      self.log('event: audio seeked');
    });

    self.bbaudio.on('seeking', function () {
      self.log('event: audio seeking');
    });

    self.bbaudio.on('stalled', function () {
      self.log('event: audio stalled');
    });

    self.bbaudio.on('suspend', function () {
      self.log('event: audio suspend');
    });

    self.bbaudio.on('timeupdate', function () {
      // self.log('event: audio timeupdate');
      self.updateDisplay();
    });

    self.bbaudio.on('volumechange', function () {
      self.log('event: audio volumechange');
    });

    self.bbaudio.on('waiting', function () {
      self.log('event: audio waiting');
    });

  };


  // Change BBPlayer to play state
  BBPlayer.prototype.play = function () {
    var self = this;
    self.log('func: play');
    self.bbaudio.get(0).play();
    self.state = "playing";
    var playButton = self.bbplayer.find(".bb-play");
    playButton.removeClass("bb-paused");
    playButton.addClass("bb-playing");
  };


  // Change BBPlayer to pause state
  BBPlayer.prototype.pause = function () {
    console.log('func: pause');
    this.bbaudio.get(0).pause();
    this.state = "paused";
    var playButton = this.bbplayer.find(".bb-play");
    playButton.removeClass("bb-playing");
    playButton.addClass("bb-paused");
  };


  // Set up button click handlers
  BBPlayer.prototype.setClickHandlers = function () {

    var self = this;
    self.log('func: setClickHandlers');
    var audioElem = self.bbaudio.get(0);

    // Activate fast-forward
    self.bbplayer.find('.bb-forward').click(function () {
      self.log('event: click .bb-forward');
      self.loadNext();
    });

    // Toggle play / pause
    self.bbplayer.find('.bb-play').click(function () {
      self.log('event: click .bb-play');
      if (self.state === "paused") { //(audioElem.paused) {
        self.play();
      } else {
        self.pause();
      }
      self.updateDisplay();
    });

    // Activate rewind
    self.bbplayer.find('.bb-rewind').click(function () {
      self.log('event: click .bb-rewind');
      var time = audioElem.currentTime;
      if (time > 1.5) {
        audioElem.currentTime = 0;
      } else {
        self.loadPrevious();
      }
    });

    // TODO make debug more "pluggy".
    if (self.bbdebug) {
      self.bbdebug.click(function () {
        $(this).empty();
      });
    }

  };


  // BBPlayer initialisation
  BBPlayer.prototype.init = function () {
    var self = this;
    self.setAudioEventHandlers();
    self.loadSources();
    // self.loadTrack (0);
    self.currentTrack = 0;
    self.setClickHandlers();
    self.updateDisplay();
  };


  // Create BBPlayer Object for each element of .bbplayer class
  $(document).ready(function () {
    $(".bbplayer").each(function (x) {
      // Initialize BBPlayer Object      
      bbplayer[x] = new BBPlayer($(this));
      player = bbplayer[0];
      // Initialize Progress Bar
      var progressBar = $(".progress-bar");
      // Set volume to 100%
      progressBar.css("width", "100%");
      
      // Troubleshooting Support
      /*
      var handsDivTag = document.getElementById("hands");
      var fingersDivTag = document.getElementById("fingers");
      
      var handsDescTag = document.getElementById("descr-hands");
      var fingersDescTag = document.getElementById("descr-fingers");
      */
      // Initialize Audio Object
      var audio = document.getElementById("audio");
 
      // Check for gestures and take appropriate action
      function checkGestures(obj){
              if(FRAME){
                      // Check whether a gesture is attached with the frame
                      if(FRAME.gestures[0]){
                              // Initialize a gesture
                              var gesture = FRAME.gestures[0];
                              // Check if the gesture is a key tap
                              if( gesture.type == 'keyTap' ){
                                      // Log debug window event
                                      console.log("key tap gesture");
                                      // Call player pause function to pause the playing song
                                      player.pause();
                                      // Remove alert HTML element if exits
                                      $('.alert').remove();
                                      // Generate UI message
                                      bootstrap_alert.generate('Pause!', 'warning');
                              }
                              // Check if gesture is a screen tap
                              else if(gesture.type == 'screenTap'){
                                      console.log('screen tap gesture');
                                      player.play();
                                      $('.alert').remove();                                      
                                      bootstrap_alert.generate('Play!', 'success');
                              }
                              // Check if gesture is a swipe
                              else if(gesture.type == 'swipe'){
                                      var Horizontal = Math.abs(gesture.direction[0]) > Math.abs(gesture.direction[1]);
                                      // Horizontal Gestures Right or Left
                                      if(Horizontal){
                                          if(gesture.direction[0] > 0){
                                            // Applying threshold value to have a better response
                                            if(gesture.duration > 32000){
                                              console.log("right!");
                                              // Load next song
                                              player.loadNext();
                                              $('.alert').remove();
                                              // Generate UI message
                                              bootstrap_alert.generate('Next Song!', 'info');
                                            }
                                          } else {
                                            // Applying threshold value to have a better response
                                              if(gesture.duration > 32000){
                                                console.log("left!");
                                                // Load previous song
                                                player.loadPrevious();
                                                $('.alert').remove();
                                                // Generate UI message
                                                bootstrap_alert.generate('Previous Song!', 'info');
                                              }
                                          }
                                      }
                                      // Vertical Gestures Up or Down
                                      else{ 
                                          if(gesture.direction[1] > 0){
                                            console.log("up");
                                            audio.volume = 0.0;
                                            progressBar.css("width", "0%");
                                            $('.alert').remove();    
                                            bootstrap_alert.generate('Mute!', 'warning');
                                          } else {
                                            console.log("down");
                                          }     
                                      }
                              }
                              // Check if the gesture is circular 
                              else if(gesture.type == 'circle'){
                                      console.log('circle gesture');
                                      volumeChange(gesture)
                              }
                            
                      }
              }
      }
      
      // Volume Up 
      function volumeChange(gesture){
        if(FRAME){
          // Number of circular movements
          var y = gesture.progress;
          // Round off to make a unit
          var unit = Math.round(y);
          // Compute Volume
          var val = unit*0.1;
          val = roundValue(val);
          console.log("Volume Unit: " + val);
          
          if(audio.volume>1){
            audio.volume = 0.0;
            
          }
          console.log("Actual Volume: " + audio.volume);
          rounded_vol = roundValue(audio.volume);
          console.log("Rounded Volume: " + rounded_vol);
          
          // Check Direction of the current pointable fingers
          var direction = FRAME.finger(gesture.pointableIds[0]).direction;
          // Get angle for normal vector
          var normal = gesture.normal;
          // Get if the movement was clockwise or not
          var clockwise = Leap.vec3.dot(direction, normal) > 0;
          
          // Increase Volume
          if(clockwise){
            console.log("Clockwise Circle Gesture!"); 
            if( val <= 0.2 ){
              audio.volume = 0.2;
              progressBar.css("width", "20%");
            }
            if((val > 0.2) && (val <= 0.3)){
              audio.volume = 0.5;
              progressBar.css("width", "50%");
            }
            if((val > 0.3) && (val<=0.4)){
              audio.volume = 0.8;
              progressBar.css("width", "80%");
            }
            if((val > 0.4)){
              audio.volume = 1.0;
              console.log("Max Volume!");
              progressBar.css("width", "100%");
              bootstrap_alert.generate('Maximum Volume!', 'danger');
            }
          }
          else{
            console.log("Anti-Clockwise Circle Gesture!");
          }
          
         }
      }
      
      // Rounding Function
      function roundValue(x){
         // Rounding HTML5 Audio Volume
          var rounded_vol = Math.round( x * 10 ) / 10;
          rounded_vol = rounded_vol.toFixed(1);
          return rounded_vol;
      }
      
      /* Leap Motion JS starts here */
      
      // Initialize Leap Motion Controller object
      var controller = new Leap.Controller();
          // Detect if web socket server is online
          controller.on('connect', function() {
          socket.status('Socket Connected','success');
         });
          // Detect if web socket server is offline
          controller.on('disconnect', function() {
          socket.status('Socket Disconnected','danger');
         });
          // Detect if a Leap Motion Controller was connected
          controller.on('deviceConnected', function() {
          device.status('Device Connected','success');
        });
          // Detect if a Leap Motion Controller was disconnected
          controller.on('deviceDisconnected', function() {
          device.status('Device Disconnected','danger');
        });                 
          // Detect if a Leap Motion browser application is the current focus of the user
          controller.on('focus', function() {
          browserFocus.status('App Focused', 'success')
        });
          // Detect if a Leap Motion browser application is out of focus
          controller.on('blur', function() {
          browserFocus.status('App Not Focused', 'danger')
        });
       controller.connect();
      
      // Leap Loop Starts here!
      var FRAME
      Leap.loop({enableGestures: true},function(obj) {
        
        FRAME = obj
        
        // Count number of hands
        var hands = obj.hands.length;
        // Count number of fingers
        var fingers = obj.pointables.length;

        /** Troubleshooting Code **/
        // Set the number of hands and fingers
        /*
        handsDivTag.innerHTML = hands;
        fingersDivTag.innerHTML = fingers;
        
        // Check the number of hands and fingers to decide the appropriate text
        var a, b;
        
        if( hands == 1 ){
            a = "hand";
        }else{
            a = "hands";
        }
        
        if( fingers == 1 ){
            b = "finger";
        }else{
            b = "fingers";
        }
        
        // Set the appropriate text for description
        handsDescTag.innerHTML = a;
        fingersDescTag.innerHTML = b;
        */
        
        // Check if we have atleast one hand in the interactive space
        if(hands != 0){ 
          if(hands == 1){
               // Check for gestures
              checkGestures()
          }else{
            // More than one hand in interactive space
            console.log("Warning: More than one hand detected!");
            $('.alert').remove();
            // Generate UI warning
            bootstrap_alert.generate('More than one hand detected!', 'danger');
          }
        }
        
        
      });
    });
  });