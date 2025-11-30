// Minimal realtime client — automatically connects via WebRTC
class OpenAIRealtime {
    constructor(options) {
        this.options = options;
        this.onAudioChunk = () => {};
        this.onReady = () => {};

        this._connect();
    }

    async _connect() {
        this.pc = new RTCPeerConnection();

        this.pc.ontrack = (e) => {
            const reader = new FileReader();
            reader.onload = () => {
                this.onAudioChunk(reader.result);
            };
            reader.readAsArrayBuffer(e.streams[0].getAudioTracks()[0]);
        };

        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);

        const response = await fetch("https://api.openai.com/v1/realtime?model=gpt-4o-mini-tts", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.options.apiKey}`,
                "Content-Type": "application/sdp"
            },
            body: offer.sdp
        });

        const answer = await response.text();
        await this.pc.setRemoteDescription({
            type: "answer",
            sdp: answer
        });

        this.onReady();
    }

    sendAudioChunk(float32audio) {
        // send live audio to OpenAI
    }

    startConversation() {
        // instruct OpenAI to begin
    }
}
