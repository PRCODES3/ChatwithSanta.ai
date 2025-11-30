/* ==========================================================
   ChatwithSanta.ai — REAL AI CALLING ENGINE (Hybrid Mode)
   Voice: Santa-Deep (slow, warm, magical)
   ========================================================== */

let santaConnection = null;
let santaStream = null;
let santaAudio = null;

// 🔑 Insert your OpenAI API key here (Hybrid Mode: Client first, server later)
let OPENAI_API_KEY = "YOUR_OPENAI_API_KEY";

/* ==========================================================
   START AI SANTA CALL
   ========================================================== */
async function callSantaAI() {

  if (!OPENAI_API_KEY || OPENAI_API_KEY.length < 20) {
    alert("⚠️ Please add your OpenAI API key inside /assets/js/ai.js");
    return;
  }

  document.getElementById("call-status").innerText = "Connecting to Santa… 🎅✨";

  try {
    santaConnection = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-mini-tts");

    santaConnection.onopen = () => {
      santaConnection.send(JSON.stringify({
        type: "session.update",
        session: {
          modalities: ["audio", "text"],
          instructions:
            "You are Santa Claus. Warm, magical, gentle. Use the Santa-Deep voice. Speak slowly. Respond to children in a joyful, safe tone.",
          voice: {
            name: "santa-deep",       // ⭐ Your selected voice
            speed: 0.93,
            style: "warm",
          }
        }
      }));

      document.getElementById("call-status").innerText =
        "Santa is listening… Speak to him! 🎙️";
    };

    santaConnection.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      // Santa sends audio
      if (data.type === "response.audio.delta") {
        if (!santaAudio) {
          santaAudio = new Audio();
          santaAudio.autoplay = true;
        }
        const audioData = Uint8Array.from(atob(data.delta), c => c.charCodeAt(0));
        santaAudio.src = URL.createObjectURL(new Blob([audioData], { type: "audio/wav" }));
      }
    };

    santaConnection.onerror = (err) => {
      document.getElementById("call-status").innerText = "Error connecting to Santa.";
      console.error(err);
    };

  } catch (error) {
    console.error("Error:", error);
  }

  /* ==========================================================
     Microphone Streaming → Santa
     ========================================================== */
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  santaStream = stream;

  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const processor = ctx.createScriptProcessor(2048, 1, 1);

  source.connect(processor);
  processor.connect(ctx.destination);

  processor.onaudioprocess = (e) => {
    if (!santaConnection || santaConnection.readyState !== 1) return;

    const input = e.inputBuffer.getChannelData(0);
    const pcm = floatTo16BitPCM(input);

    santaConnection.send(JSON.stringify({
      type: "input_audio_buffer.append",
      audio: btoa(String.fromCharCode(...pcm))
    }));

    santaConnection.send(JSON.stringify({
      type: "input_audio_buffer.commit"
    }));
  };
}

/* ==========================================================
   Helper — Convert raw mic audio to 16-bit PCM
   ========================================================== */
function floatTo16BitPCM(float32Array) {
  const pcm = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    pcm[i] = Math.max(-1, Math.min(1, float32Array[i])) * 0x7fff;
  }
  return pcm;
}
