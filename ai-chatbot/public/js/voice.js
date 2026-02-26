console.log('RicoAI voice.js loaded');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const voiceBtn = document.getElementById('voiceBtn');
const voiceUserInput = document.getElementById('userInput');
const voiceHint = document.getElementById('voiceHint');
const voiceModalOverlay = document.getElementById('voiceModalOverlay');
const voiceGotIt = document.getElementById('voiceGotIt');

if (!SpeechRecognition) {
  console.warn('Speech Recognition not supported in this browser.');
  if (voiceBtn) {
    voiceBtn.style.opacity = '0.3';
    voiceBtn.title = 'Voice input not supported in this browser';
    voiceBtn.disabled = true;
  }
} else {

  let isListening = false;
  let isPaused = false;
  let manualStop = false;
  let globalFinalText = '';
  let currentRecognition = null;
  let restartTimer = null;

  // create a new SpeechRecognition instance with proper event handlers
  function createRecognition() {
    const r = new SpeechRecognition();
    r.continuous = false;
    r.interimResults = true;
    r.lang = 'en-US';

    r.onresult = (event) => {
      let interim = '';
      let sessionFinal = '';

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          sessionFinal += transcript + ' ';
        } else {
          interim = transcript;
        }
      }

      voiceUserInput.value = (globalFinalText + sessionFinal + interim).trim();
      voiceUserInput.style.height = 'auto';
      voiceUserInput.style.height = Math.min(voiceUserInput.scrollHeight, 200) + 'px';

      if (sessionFinal) {
        globalFinalText += sessionFinal;
      }
    };

    r.onend = () => {
      if (manualStop || isPaused || !isListening) return;
      restartTimer = setTimeout(() => {
        if (isListening && !isPaused && !manualStop) {
          currentRecognition = createRecognition();
          try {
            currentRecognition.start();
          } catch (e) {
            isListening = false;
            resetBtn();
          }
        }
      }, 100);
    };

    r.onerror = (event) => {
      if (event.error === 'aborted') return;
      if (event.error === 'no-speech') {
        if (isListening && !isPaused && !manualStop) {
          restartTimer = setTimeout(() => {
            currentRecognition = createRecognition();
            try { currentRecognition.start(); } catch(e) {}
          }, 100);
        }
        return;
      }
      isListening = false;
      isPaused = false;
      manualStop = false;
      resetBtn();
      const messages = {
        'not-allowed': 'Microphone access denied. Please allow microphone in browser settings.',
        'network': 'Network error. Please try again.',
      };
      showVoiceError(messages[event.error] || 'Voice error: ' + event.error);
    };

    return r;
  }

  // start listening
  function startListening() {
    manualStop = false;
    isPaused = false;
    isListening = true;
    const existing = voiceUserInput.value.trim();
    globalFinalText = existing ? existing + ' ' : '';
    setBtn('🔴', 'listening', 'Click to pause | Hold 1sec to stop');
    if (voiceHint) voiceHint.classList.add('show');
    currentRecognition = createRecognition();
    currentRecognition.start();
  }

  // pause without finalizing input
  function pauseListening() {
    isPaused = true;
    clearTimeout(restartTimer);
    if (currentRecognition) currentRecognition.stop();
    voiceBtn.classList.remove('listening');
    setBtn('⏸️', '', 'Paused — Click to resume | Hold to stop');
    if (voiceHint) voiceHint.textContent = '⏸️ Paused — Click mic to resume | Hold to stop';
  }

  // resume from pause
  function resumeListening() {
    isPaused = false;
    setBtn('🔴', 'listening', 'Click to pause | Hold 1sec to stop');
    if (voiceHint) voiceHint.textContent = '🔴 Listening — Click to pause | Hold 1 sec to stop';
    currentRecognition = createRecognition();
    currentRecognition.start();
  }

  // stop listening and finalize input
  function stopListening() {
    manualStop = true;
    isPaused = false;
    isListening = false;
    clearTimeout(restartTimer);
    if (currentRecognition) currentRecognition.stop();
    resetBtn();
    if (voiceHint) voiceHint.classList.remove('show');
    voiceUserInput.value = globalFinalText.trim();
    voiceUserInput.style.height = 'auto';
    voiceUserInput.style.height = Math.min(voiceUserInput.scrollHeight, 200) + 'px';
    voiceUserInput.focus();
  }

  // helper to set button state
  function setBtn(icon, className, title) {
    voiceBtn.textContent = icon;
    voiceBtn.title = title;
    if (className) voiceBtn.classList.add(className);
  }

  function resetBtn() {
    voiceBtn.textContent = '🎤';
    voiceBtn.title = 'Voice input';
    voiceBtn.classList.remove('listening');
  }

  function showVoiceError(message) {
    if (typeof showToast === 'function') {
      showToast('🎤 ' + message);
    } else {
      console.warn('Voice error:', message);
    }
  }

  // long press to stop
  let pressTimer = null;
  function startPressTimer() {
    pressTimer = setTimeout(() => {
      if (isListening) stopListening();
    }, 800);
  }
  function clearPressTimer() { clearTimeout(pressTimer); }

  voiceBtn.addEventListener('mousedown', startPressTimer);
  voiceBtn.addEventListener('mouseup', clearPressTimer);
  voiceBtn.addEventListener('mouseleave', clearPressTimer);
  voiceBtn.addEventListener('touchstart', startPressTimer);
  voiceBtn.addEventListener('touchend', clearPressTimer);

  // onboarding modal handlers
  // Placed here AFTER all functions are defined so startListening is available
  function showVoiceOnboarding() {
    voiceModalOverlay.classList.add('open');
  }

  if (voiceGotIt) {
    voiceGotIt.addEventListener('click', () => {
      voiceModalOverlay.classList.remove('open');
      localStorage.setItem('rico-voice-onboarding', 'true');
      startListening(); // Now safely defined above
    });
  }

  if (voiceModalOverlay) {
    voiceModalOverlay.addEventListener('click', (e) => {
      if (e.target === voiceModalOverlay) {
        voiceModalOverlay.classList.remove('open');
        localStorage.setItem('rico-voice-onboarding', 'true');
      }
    });
  }

  // voice button main click handler
  voiceBtn.addEventListener('click', () => {
    if (!isListening) {
      const seen = localStorage.getItem('rico-voice-onboarding');
      if (!seen) {
        showVoiceOnboarding();
      } else {
        startListening();
      }
    } else if (isPaused) {
      resumeListening();
    } else {
      pauseListening();
    }
  });

}