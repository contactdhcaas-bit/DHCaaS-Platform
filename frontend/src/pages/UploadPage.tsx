// src/pages/UploadPage.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type UploadStatus = 'idle' | 'uploading' | 'validating' | 'processing' | 'success' | 'error';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [jobId, setJobId] = useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'application/json'];
    const maxSize = 100 * 1024 * 1024; // 100MB

    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls|json)$/i)) {
      setErrorMessage('Invalid file type. Please upload CSV, Excel, or JSON files only.');
      setUploadStatus('error');
      return;
    }

    if (file.size > maxSize) {
      setErrorMessage('File size exceeds 100MB limit. Please upload a smaller file.');
      setUploadStatus('error');
      return;
    }

    console.log('📄 File selected:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);
    setSelectedFile(file);
    setErrorMessage('');
    setUploadStatus('idle');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    console.log('📤 Starting upload:', selectedFile.name);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('datasource_name', selectedFile.name);
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const owner = user.email || 'System';
      formData.append('owner', owner);

      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const url = `${API_BASE}/api/v1/scan-jobs/`;

      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(localStorage.getItem('token') && {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          }),
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 100)
          );
          setUploadProgress(percentCompleted);
          
          if (percentCompleted === 100) {
            setUploadStatus('validating');
            setTimeout(() => setUploadStatus('processing'), 1000);
          }
        },
      });

      console.log('✅ Upload successful:', response.data.job_id);
      setJobId(response.data.job_id);
      setUploadStatus('success');

    } catch (error: any) {
      console.error('❌ Upload failed:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Upload failed. Please try again.';
      setErrorMessage(errorMsg);
      setUploadStatus('error');
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setErrorMessage('');
    setUploadProgress(0);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getStatusDisplay = () => {
    switch (uploadStatus) {
      case 'uploading':
        return { text: 'Uploading file...', color: 'text-purple-400' };
      case 'validating':
        return { text: 'Validating format...', color: 'text-blue-400' };
      case 'processing':
        return { text: 'Processing data...', color: 'text-indigo-400' };
      case 'success':
        return { text: 'Upload complete!', color: 'text-green-400' };
      case 'error':
        return { text: 'Upload failed', color: 'text-red-400' };
      default:
        return { text: '', color: '' };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header with Gradient Text */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-purple-400" />
            <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
              Upload Data File
            </h1>
            <Sparkles className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Upload your CSV, Excel, or JSON file for AI-powered data quality analysis
          </p>
        </div>

        {/* Glassmorphism Main Container */}
        <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
          {/* Gradient Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-blue-600/10 pointer-events-none" />
          
          <div className="relative p-10">
            
            {/* Success State */}
            {uploadStatus === 'success' ? (
              <div className="text-center py-16">
                <div className="relative inline-flex items-center justify-center w-24 h-24 mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-ping opacity-20" />
                  <div className="relative flex items-center justify-center w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg shadow-green-500/50">
                    <CheckCircle className="w-14 h-14 text-white" />
                  </div>
                </div>
                
                <h2 className="text-4xl font-bold text-white mb-3">Upload Successful!</h2>
                <p className="text-slate-300 mb-2">Your file has been processed and analyzed.</p>
                <div className="inline-block px-4 py-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 mb-10">
                  <p className="text-sm text-slate-400">Job ID: <span className="text-purple-400 font-mono">{jobId}</span></p>
                </div>
                
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setUploadStatus('idle');
                      setJobId('');
                    }}
                    className="px-8 py-4 bg-white/5 backdrop-blur-sm text-slate-300 font-semibold rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
                  >
                    Upload Another File
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Error Display */}
                {uploadStatus === 'error' && errorMessage && (
                  <div className="mb-6 p-5 bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-300 mb-1">Upload Failed</h3>
                      <p className="text-sm text-red-200/80">{errorMessage}</p>
                    </div>
                  </div>
                )}

                {/* File Not Selected - Enhanced Drag & Drop Zone */}
                {!selectedFile ? (
                  <div
                    className={`relative border-3 border-dashed rounded-2xl p-20 text-center transition-all duration-300 ${
                      dragActive
                        ? 'border-purple-400 bg-purple-500/10 shadow-lg shadow-purple-500/30 scale-[1.01]'
                        : 'border-white/20 hover:border-purple-400/50 hover:bg-white/5'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {/* Animated Glow Ring */}
                    {dragActive && (
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 animate-pulse" />
                    )}

                    <div className="relative flex flex-col items-center">
                      {/* Icon with Gradient Background */}
                      <div className={`mb-8 p-8 rounded-full transition-all duration-300 ${
                        dragActive 
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg shadow-purple-500/50 scale-110' 
                          : 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-white/10'
                      }`}>
                        <Upload className={`w-20 h-20 transition-all duration-300 ${
                          dragActive ? 'text-white animate-bounce' : 'text-purple-400'
                        }`} />
                      </div>

                      <h3 className="text-3xl font-bold text-white mb-3">
                        {dragActive ? 'Drop it like it\'s hot! 🔥' : 'Drag & Drop Your File'}
                      </h3>
                      <p className="text-slate-400 text-lg mb-8">or click below to browse</p>

                      {/* Gradient Button */}
                      <label
                        htmlFor="file-upload"
                        className="group relative inline-flex items-center px-10 py-5 text-xl font-bold text-white cursor-pointer transition-all duration-300 transform hover:scale-105"
                      >
                        {/* Button Background with Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-xl opacity-100 group-hover:opacity-90 transition-opacity" />
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                        
                        {/* Button Content */}
                        <div className="relative flex items-center gap-3">
                          <Upload className="w-6 h-6" />
                          <span>Browse Files</span>
                        </div>
                      </label>
                      
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept=".csv,.xlsx,.xls,.json"
                        onChange={handleFileSelect}
                        disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
                      />

                      {/* File Info */}
                      <div className="mt-10 space-y-2">
                        <p className="text-sm text-slate-400">
                          <span className="font-semibold text-purple-400">Supported:</span> CSV, Excel (.xlsx, .xls), JSON
                        </p>
                        <p className="text-sm text-slate-400">
                          <span className="font-semibold text-purple-400">Max Size:</span> 100 MB
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* File Selected - Glass Preview Card */
                  <div className="space-y-6">
                    {/* File Preview Card */}
                    <div className="group relative flex items-center justify-between p-6 bg-gradient-to-r from-purple-600/10 to-blue-600/10 backdrop-blur-sm rounded-2xl border border-purple-400/30 hover:border-purple-400/50 transition-all">
                      <div className="flex items-center gap-5">
                        <div className="flex-shrink-0 p-5 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg shadow-purple-500/30">
                          <FileText className="w-12 h-12 text-white" />
                        </div>
                        <div>
                          <p className="text-xl font-bold text-white mb-1">
                            {selectedFile.name}
                          </p>
                          <p className="text-sm text-slate-400">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={removeFile}
                        disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
                        className="flex-shrink-0 p-3 text-red-400 hover:bg-red-500/10 rounded-xl border border-red-400/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove file"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Progress Section */}
                    {(uploadStatus === 'uploading' || uploadStatus === 'validating' || uploadStatus === 'processing') && (
                      <div className="space-y-6">
                        {/* Status Steps */}
                        <div className="flex items-center justify-between px-4">
                          {[
                            { key: 'uploading', label: 'Upload' },
                            { key: 'validating', label: 'Validate' },
                            { key: 'processing', label: 'Process' }
                          ].map((step, index) => {
                            const isActive = uploadStatus === step.key;
                            const isCompleted = ['uploading', 'validating', 'processing'].indexOf(uploadStatus) > index;
                            
                            return (
                              <div key={step.key} className="flex items-center flex-1">
                                <div className="flex flex-col items-center">
                                  <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold transition-all duration-300 ${
                                    isCompleted 
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/50' 
                                      : isActive 
                                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white animate-pulse shadow-lg shadow-purple-500/50' 
                                      : 'bg-white/5 text-slate-500 border border-white/10'
                                  }`}>
                                    {isCompleted ? <CheckCircle className="w-6 h-6" /> : index + 1}
                                  </div>
                                  <p className={`mt-2 text-xs font-medium ${
                                    isActive ? 'text-purple-400' : isCompleted ? 'text-green-400' : 'text-slate-500'
                                  }`}>
                                    {step.label}
                                  </p>
                                </div>
                                {index < 2 && (
                                  <div className={`flex-1 h-1 mx-3 rounded transition-all duration-500 ${
                                    isCompleted 
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                      : 'bg-white/10'
                                  }`} />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className={`font-semibold ${statusDisplay.color}`}>
                              {statusDisplay.text}
                            </span>
                            {uploadStatus === 'uploading' && (
                              <span className="text-purple-400 font-bold text-lg">{uploadProgress}%</span>
                            )}
                          </div>
                          <div className="relative w-full h-4 bg-white/5 backdrop-blur-sm rounded-full overflow-hidden border border-white/10">
                            <div
                              className="h-full bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-full transition-all duration-300 ease-out shadow-lg shadow-purple-500/50"
                              style={{ 
                                width: uploadStatus === 'uploading' ? `${uploadProgress}%` : 
                                       uploadStatus === 'validating' ? '66%' : 
                                       uploadStatus === 'processing' ? '90%' : '0%' 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Upload Button */}
                    {uploadStatus === 'idle' && (
                      <button
                        onClick={handleUpload}
                        className="group relative w-full flex items-center justify-center px-8 py-5 text-xl font-bold text-white transition-all duration-300 transform hover:scale-[1.02]"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-xl opacity-100 group-hover:opacity-90" />
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-xl blur-xl opacity-50 group-hover:opacity-75" />
                        
                        <div className="relative flex items-center gap-3">
                          <Upload className="w-7 h-7" />
                          <span>Upload & Analyze</span>
                        </div>
                      </button>
                    )}

                    {(uploadStatus === 'uploading' || uploadStatus === 'validating' || uploadStatus === 'processing') && (
                      <div className="flex items-center justify-center py-6 text-slate-300">
                        <Loader2 className="w-6 h-6 mr-3 animate-spin text-purple-400" />
                        <span className="text-lg">Processing your file...</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Info Section with Glass Effect */}
          <div className="relative bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-sm border-t border-white/10 p-8">
            <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              What happens after upload?
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                'AI-powered data quality analysis',
                'PII detection & compliance (GDPR, CCPA, HIPAA)',
                'Anomaly detection & pattern analysis',
                'Comprehensive PDF report generation'
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/5">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
