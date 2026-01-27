import { useState, useRef, useEffect } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';

export default function BookScanner({ onScanComplete, onCancel }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [scanning, setScanning] = useState(false);
    const [stream, setStream] = useState(null);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            // Prefer rear camera on mobile
            const constraints = {
                video: { facingMode: { ideal: "environment" } }
            };
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera access denied:", err);
            alert("Unable to access camera. Please try manual entry.");
            onCancel();
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const captureAndProcess = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        setScanning(true);

        // Capture frame
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to Base64 (remove data URL prefix for API)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64Data = dataUrl.split(',')[1];

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: "Extract the exact book title and author from this image. Return a raw JSON object with keys 'title' and 'author'. Do not include markdown formatting or ANY other text. If no book is found, return { 'title': '', 'author': '' }.",
                    image: {
                        data: base64Data,
                        mimeType: 'image/jpeg'
                    }
                })
            });

            const data = await response.json();

            // Clean the response in case the model adds markdown
            let cleanText = data.text;
            if (cleanText.startsWith('```json')) {
                cleanText = cleanText.replace(/```json\n|\n```/g, '');
            } else if (cleanText.startsWith('```')) {
                cleanText = cleanText.replace(/```\n|\n```/g, '');
            }

            const bookDetails = JSON.parse(cleanText);

            // Stop camera before proceeding
            stopCamera();

            onScanComplete(bookDetails);

        } catch (err) {
            console.error("Scanning failed:", err);
            alert("Failed to identify book. Please try again or type manually.");
            setScanning(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#000',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <button
                onClick={() => { stopCamera(); onCancel(); }}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    padding: '10px',
                    cursor: 'pointer',
                    zIndex: 1100
                }}
            >
                <X size={24} />
            </button>

            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* Overlay guides */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '70%',
                    height: '50%',
                    border: '2px dashed rgba(255,255,255,0.7)',
                    borderRadius: '20px',
                    pointerEvents: 'none'
                }}></div>

                <div style={{
                    position: 'absolute',
                    bottom: '50px',
                    left: '0',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <button
                        onClick={captureAndProcess}
                        disabled={scanning}
                        style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: scanning ? '#ccc' : '#fff',
                            border: '4px solid rgba(0,0,0,0.2)',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                        }}
                    >
                        {scanning ? <Loader2 className="spin" color="#000" /> : <Camera color="#000" size={32} />}
                    </button>
                </div>

                {scanning && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: 'white',
                        background: 'rgba(0,0,0,0.7)',
                        padding: '20px',
                        borderRadius: '10px',
                        textAlign: 'center'
                    }}>
                        <p>Identifying Book...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Spin animation style is now assumed to be in CSS or handled via inline style injection safely
// If needed, we can add it to index.css or Dashboard.css

