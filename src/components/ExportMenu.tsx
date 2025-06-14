import React, { useState, useRef } from 'react';
import { Download, Settings, FileImage, FileText, Image, Loader2, CheckCircle, XCircle, RefreshCw, Package, Zap, Clock, HardDrive } from 'lucide-react';
import { saveAs } from 'file-saver';

interface ExportMenuProps {
  isOpen: boolean;
  onClose: () => void;
  thumbnailUrl?: string;
  variations?: Array<{ url: string; label: string }>;
  videoTitle?: string;
}

interface ExportSettings {
  format: 'PNG' | 'JPG' | 'PDF' | 'SVG';
  resolution: '1280x720' | '1920x1080' | '2560x1440' | '3840x2160';
  quality: number;
  optimizeSize: boolean;
  includeMetadata: boolean;
  filenamePattern: string;
}

interface ExportProgress {
  status: 'idle' | 'preparing' | 'exporting' | 'completed' | 'error';
  progress: number;
  currentFile?: string;
  totalFiles?: number;
  completedFiles?: number;
  errorMessage?: string;
}

const ExportMenu: React.FC<ExportMenuProps> = ({
  isOpen,
  onClose,
  thumbnailUrl,
  variations = [],
  videoTitle = 'thumbnail'
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'PNG',
    resolution: '1920x1080',
    quality: 90,
    optimizeSize: false,
    includeMetadata: true,
    filenamePattern: '{title}_{timestamp}'
  });
  const [selectedVariations, setSelectedVariations] = useState<number[]>([]);
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    status: 'idle',
    progress: 0
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (!isOpen) return null;

  const formatOptions = [
    { 
      value: 'PNG', 
      label: 'PNG (High Quality)', 
      icon: FileImage, 
      description: 'Lossless compression, supports transparency',
      size: 'Large',
      quality: 'Excellent'
    },
    { 
      value: 'JPG', 
      label: 'JPG (Compressed)', 
      icon: Image, 
      description: 'Smaller file size, good for web',
      size: 'Medium',
      quality: 'Good'
    },
    { 
      value: 'PDF', 
      label: 'PDF (Print Ready)', 
      icon: FileText, 
      description: 'Vector format, perfect for printing',
      size: 'Small',
      quality: 'Vector'
    },
    { 
      value: 'SVG', 
      label: 'SVG (Vector)', 
      icon: Settings, 
      description: 'Scalable vector graphics',
      size: 'Smallest',
      quality: 'Infinite'
    }
  ];

  const resolutionOptions = [
    { value: '1280x720', label: '720p HD', description: 'Standard YouTube thumbnail' },
    { value: '1920x1080', label: '1080p Full HD', description: 'High quality, recommended' },
    { value: '2560x1440', label: '1440p QHD', description: 'Ultra high quality' },
    { value: '3840x2160', label: '4K UHD', description: 'Maximum quality' }
  ];

  const updateSettings = (updates: Partial<ExportSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const generateFilename = (variation?: string, index?: number) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const title = videoTitle.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50);
    
    let filename = settings.filenamePattern
      .replace('{title}', title)
      .replace('{timestamp}', timestamp)
      .replace('{variation}', variation || 'thumbnail')
      .replace('{index}', (index || 0).toString().padStart(2, '0'));
    
    return `${filename}.${settings.format.toLowerCase()}`;
  };

  const captureCanvas = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const previewElement = document.querySelector('[data-thumbnail-preview]') as HTMLElement;
      if (!previewElement) {
        reject(new Error('Preview element not found'));
        return;
      }

      import('html2canvas').then(html2canvas => {
        html2canvas.default(previewElement, {
          useCORS: true,
          allowTaint: true,
          scale: settings.resolution === '3840x2160' ? 3 : 
                 settings.resolution === '2560x1440' ? 2 : 
                 settings.resolution === '1920x1080' ? 1.5 : 1,
          width: parseInt(settings.resolution.split('x')[0]),
          height: parseInt(settings.resolution.split('x')[1])
        }).then(canvas => {
          const dataURL = canvas.toDataURL(
            settings.format === 'PNG' ? 'image/png' : 'image/jpeg',
            settings.quality / 100
          );
          resolve(dataURL);
        }).catch(reject);
      }).catch(reject);
    });
  };

  const downloadFile = (dataURL: string, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSingleExport = async () => {
    setExportProgress({ status: 'preparing', progress: 0 });
    
    try {
      setExportProgress({ status: 'exporting', progress: 50, currentFile: generateFilename() });
      
      const dataURL = await captureCanvas();
      const filename = generateFilename();
      
      downloadFile(dataURL, filename);
      
      setExportProgress({ 
        status: 'completed', 
        progress: 100, 
        completedFiles: 1, 
        totalFiles: 1 
      });
      
      setTimeout(() => {
        setExportProgress({ status: 'idle', progress: 0 });
      }, 3000);
      
    } catch (error) {
      setExportProgress({ 
        status: 'error', 
        progress: 0, 
        errorMessage: error instanceof Error ? error.message : 'Export failed' 
      });
    }
  };

  const handleBatchExport = async () => {
    if (selectedVariations.length === 0) {
      alert('Please select at least one variation to export');
      return;
    }

    setExportProgress({ 
      status: 'preparing', 
      progress: 0, 
      totalFiles: selectedVariations.length,
      completedFiles: 0
    });

    try {
      for (let i = 0; i < selectedVariations.length; i++) {
        const variationIndex = selectedVariations[i];
        const variation = variations[variationIndex];
        
        setExportProgress(prev => ({ 
          ...prev,
          status: 'exporting',
          progress: (i / selectedVariations.length) * 100,
          currentFile: generateFilename(variation.label, i + 1)
        }));

        // Simulate processing time for each variation
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const dataURL = await captureCanvas();
        const filename = generateFilename(variation.label, i + 1);
        
        downloadFile(dataURL, filename);
        
        setExportProgress(prev => ({ 
          ...prev,
          completedFiles: i + 1
        }));
      }

      setExportProgress({ 
        status: 'completed', 
        progress: 100, 
        completedFiles: selectedVariations.length,
        totalFiles: selectedVariations.length
      });

      setTimeout(() => {
        setExportProgress({ status: 'idle', progress: 0 });
      }, 3000);

    } catch (error) {
      setExportProgress({ 
        status: 'error', 
        progress: 0, 
        errorMessage: error instanceof Error ? error.message : 'Batch export failed' 
      });
    }
  };

  const toggleVariationSelection = (index: number) => {
    setSelectedVariations(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const selectAllVariations = () => {
    setSelectedVariations(variations.map((_, index) => index));
  };

  const clearSelection = () => {
    setSelectedVariations([]);
  };

  const getEstimatedFileSize = () => {
    const baseSize = settings.resolution === '3840x2160' ? 8 : 
                    settings.resolution === '2560x1440' ? 4 : 
                    settings.resolution === '1920x1080' ? 2 : 1;
    
    const formatMultiplier = settings.format === 'PNG' ? 1.5 : 
                            settings.format === 'JPG' ? 0.3 : 
                            settings.format === 'PDF' ? 0.8 : 0.1;
    
    const qualityMultiplier = settings.quality / 100;
    
    return Math.round(baseSize * formatMultiplier * qualityMultiplier * 10) / 10;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        data-testid="export-menu"
        className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center">
            <Download className="h-6 w-6 mr-3 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Export Thumbnails</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('single')}
            className={`flex-1 py-3 px-6 text-sm font-medium transition-colors ${
              activeTab === 'single'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileImage className="h-4 w-4 mr-2 inline" />
            Single Export
          </button>
          <button
            data-testid="batch-export-tab"
            onClick={() => setActiveTab('batch')}
            className={`flex-1 py-3 px-6 text-sm font-medium transition-colors ${
              activeTab === 'batch'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Package className="h-4 w-4 mr-2 inline" />
            Batch Export ({variations.length} variations)
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Export Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Format Selection */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Export Format</h3>
                <div className="space-y-3">
                  {formatOptions.map((format) => (
                    <label
                      key={format.value}
                      data-testid={`format-${format.value.toLowerCase()}`}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                        settings.format === format.value
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="format"
                        value={format.value}
                        checked={settings.format === format.value}
                        onChange={(e) => updateSettings({ format: e.target.value as any })}
                        className="sr-only"
                      />
                      <format.icon className="h-5 w-5 mr-3 text-purple-400" />
                      <div className="flex-1">
                        <div className="text-white font-medium">{format.label}</div>
                        <div className="text-sm text-gray-400">{format.description}</div>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-500">Size: {format.size}</span>
                          <span className="text-xs text-gray-500">Quality: {format.quality}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Quality & Resolution Settings */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Quality Settings</h3>
                
                {/* Resolution */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Resolution
                  </label>
                  <select
                    data-testid="resolution-select"
                    value={settings.resolution}
                    onChange={(e) => updateSettings({ resolution: e.target.value as any })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    {resolutionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} - {option.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quality Slider */}
                {(settings.format === 'JPG' || settings.format === 'PNG') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Quality: {settings.quality}%
                    </label>
                    <input
                      data-testid="quality-slider"
                      type="range"
                      min="10"
                      max="100"
                      value={settings.quality}
                      onChange={(e) => updateSettings({ quality: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Smaller file</span>
                      <span>Better quality</span>
                    </div>
                  </div>
                )}

                {/* Additional Options */}
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      data-testid="optimize-size"
                      type="checkbox"
                      checked={settings.optimizeSize}
                      onChange={(e) => updateSettings({ optimizeSize: e.target.checked })}
                      className="rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-300">Optimize file size</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.includeMetadata}
                      onChange={(e) => updateSettings({ includeMetadata: e.target.checked })}
                      className="rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-300">Include metadata</span>
                  </label>
                </div>

                {/* File Size Estimate */}
                <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Estimated file size:</span>
                    <span className="text-sm font-medium text-white">
                      ~{getEstimatedFileSize()} MB
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Batch Export Options */}
            {activeTab === 'batch' && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-4">Batch Export Options</h3>
                
                {/* Filename Pattern */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Filename Pattern
                  </label>
                  <input
                    data-testid="filename-pattern"
                    type="text"
                    value={settings.filenamePattern}
                    onChange={(e) => updateSettings({ filenamePattern: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    placeholder="{title}_{variation}_{timestamp}"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Available variables: {'{title}'}, {'{variation}'}, {'{timestamp}'}, {'{index}'}
                  </div>
                </div>

                {/* Variation Selection */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-300">
                      Select Variations ({selectedVariations.length}/{variations.length})
                    </label>
                    <div className="space-x-2">
                      <button
                        onClick={selectAllVariations}
                        className="text-xs text-purple-400 hover:text-purple-300"
                      >
                        Select All
                      </button>
                      <button
                        onClick={clearSelection}
                        className="text-xs text-gray-400 hover:text-gray-300"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {variations.map((variation, index) => (
                      <label
                        key={index}
                        data-testid={`variation-${index}`}
                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedVariations.includes(index)
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedVariations.includes(index)}
                          onChange={() => toggleVariationSelection(index)}
                          className="rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-white">{variation.label}</div>
                          <div className="text-xs text-gray-400">Variation {index + 1}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Export Progress */}
            {exportProgress.status !== 'idle' && (
              <div data-testid="export-progress" className="mb-6 p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">
                    {exportProgress.status === 'preparing' && 'Preparing export...'}
                    {exportProgress.status === 'exporting' && 'Exporting...'}
                    {exportProgress.status === 'completed' && 'Export completed!'}
                    {exportProgress.status === 'error' && 'Export failed'}
                  </span>
                  {exportProgress.status === 'exporting' && (
                    <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                  )}
                  {exportProgress.status === 'completed' && (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  )}
                  {exportProgress.status === 'error' && (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                </div>
                
                <div className="w-full bg-gray-600 rounded-full h-2 mb-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress.progress}%` }}
                  />
                </div>
                
                {exportProgress.currentFile && (
                  <div className="text-xs text-gray-400">
                    Current: {exportProgress.currentFile}
                  </div>
                )}
                
                {exportProgress.totalFiles && (
                  <div className="text-xs text-gray-400">
                    Progress: {exportProgress.completedFiles || 0} / {exportProgress.totalFiles} files
                  </div>
                )}
                
                {exportProgress.errorMessage && (
                  <div className="text-xs text-red-400 mt-2">
                    Error: {exportProgress.errorMessage}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {activeTab === 'single' ? (
                `Export 1 thumbnail as ${settings.format} (${settings.resolution})`
              ) : (
                `Export ${selectedVariations.length} variations as ${settings.format}`
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              
              {exportProgress.status === 'error' && (
                <button
                  onClick={() => setExportProgress({ status: 'idle', progress: 0 })}
                  className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </button>
              )}
              
              <button
                onClick={activeTab === 'single' ? handleSingleExport : handleBatchExport}
                disabled={exportProgress.status === 'preparing' || exportProgress.status === 'exporting' || 
                         (activeTab === 'batch' && selectedVariations.length === 0)}
                className="flex items-center px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
              >
                {exportProgress.status === 'preparing' || exportProgress.status === 'exporting' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {activeTab === 'single' ? 'Exporting...' : 'Exporting Batch...'}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    {activeTab === 'single' ? 'Export' : `Export ${selectedVariations.length} Files`}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportMenu; 