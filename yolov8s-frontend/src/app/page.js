import React, { useState, useRef } from 'react';
import { Upload, Camera, AlertCircle, CheckCircle, Loader } from 'lucide-react';

export default function YOLODetectionApp() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [apiUrl, setApiUrl] = useState('https://huggingface.co/spaces/knighttto/yolov8s-safety-detection'); // Replace with actual URL
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [useCamera, setUseCamera] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResults(null);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResults(null);
      setError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setUseCamera(true);
        setError(null);
      }
    } catch (err) {
      setError('Camera access denied or not available');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setUseCamera(false);
    }
  };

  const captureFromCamera = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        stopCamera();
      });
    }
  };

  const handleDetect = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${apiUrl}/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Detection failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError('Error: ' + err.message + '. Make sure the API URL is correct.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            YOLOv8s Safety Detection
          </h1>
          <p className="text-gray-600">Upload an image or use your camera to detect safety objects</p>
        </div>

        {/* API URL Config */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Endpoint URL:
          </label>
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="https://your-space.hf.space"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Upload/Camera */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Input Source</h2>
            
            {/* Camera Section */}
            {!useCamera ? (
              <button
                onClick={startCamera}
                className="w-full mb-4 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <Camera size={20} />
                Use Camera
              </button>
            ) : (
              <div className="mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={captureFromCamera}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Capture
                  </button>
                  <button
                    onClick={stopCamera}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Upload Section */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-600 mb-2">Drag & drop an image here</p>
              <p className="text-sm text-gray-500">or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="mt-4">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full rounded-lg shadow-md"
                />
                <button
                  onClick={handleDetect}
                  disabled={loading}
                  className="w-full mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      Detecting...
                    </>
                  ) : (
                    'Detect Objects'
                  )}
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Right Panel - Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Detection Results</h2>
            
            {!results ? (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <p>Results will appear here after detection</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Annotated Image */}
                {results.annotated_image && (
                  <div className="rounded-lg overflow-hidden shadow-md">
                    <img
                      src={results.annotated_image}
                      alt="Detected objects"
                      className="w-full"
                    />
                  </div>
                )}

                {/* Stats */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={20} />
                  <p className="text-green-700 font-medium">
                    {results.num_detections} object(s) detected
                  </p>
                </div>

                {/* Predictions List */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-700">Detections:</h3>
                  {results.predictions.map((pred, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-800">
                          {pred.class_name}
                        </span>
                        <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                          {(pred.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Box: [{pred.bbox.map(v => v.toFixed(0)).join(', ')}]
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}