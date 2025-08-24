import { useCallback, useState, useEffect } from 'react';
import { FiUpload, FiX } from 'react-icons/fi';

interface ImageUploaderProps {
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  initialImages?: string[];
}

const ImageUploader = ({ onImagesChange, maxImages = 3, initialImages = [] }: ImageUploaderProps) => {
  const [images, setImages] = useState<string[]>(initialImages);
  const [isDragging, setIsDragging] = useState(false);

  // 当images状态变化时通知父组件
  useEffect(() => {
    onImagesChange(images);
  }, [images, onImagesChange]);

  // compress single file to be under maxSizeBytes (target 2MB)
  async function compressFileToDataUrl(file: File, maxSizeBytes = 2 * 1024 * 1024): Promise<string> {
    // load image
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
      image.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
      image.src = url;
    });

    // create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas not supported');

    // initial size: keep original but constrain max dimension
    const MAX_DIM = 1920;
    let { width, height } = img;
    if (width > MAX_DIM || height > MAX_DIM) {
      const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    // try decreasing quality and size until under maxSizeBytes
    let quality = 0.92;
    let blob: Blob | null = null;
    const mime = file.type === 'image/png' ? 'image/jpeg' : file.type || 'image/jpeg';

    // helper to get blob
    const canvasToBlob = (q: number) => new Promise<Blob | null>(res => canvas.toBlob(b => res(b), mime, q));

    for (let pass = 0; pass < 8; pass++) {
      blob = await canvasToBlob(quality);
      if (!blob) break;
      if (blob.size <= maxSizeBytes) break;
      // reduce quality
      quality = Math.max(0.35, quality - 0.12);
      // if quality already low and still too big, scale down dimensions
      if (quality <= 0.4) {
        width = Math.round(width * 0.85);
        height = Math.round(height * 0.85);
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
      }
    }

    if (!blob) throw new Error('Failed to compress image');

    // convert blob to dataURL
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read blob'));
      reader.readAsDataURL(blob as Blob);
    });
    return dataUrl;
  }

  const handleFileChange = useCallback(async (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    try {
      const processFiles = async () => {
        const results = await Promise.all(
          fileArray.map(file => compressFileToDataUrl(file, 2 * 1024 * 1024).catch(() => {
            // 如果压缩失败，回退到原始文件
            return new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
          }))
        );

        setImages(prev => {
          const available = maxImages - prev.length;
          if (available <= 0) return prev;

          const newImages = [...prev, ...results].slice(0, maxImages);
          return newImages;
        });
      };

      processFiles();
    } catch (error) {
      console.error('处理图片时出错:', error);
    }
  }, [maxImages]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (images.length >= maxImages) return;
    
    const files = e.dataTransfer.files;
    handleFileChange(files);
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  return (
    <div className="image-uploader">
      <div 
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="image-upload"
          accept="image/*"
          multiple
          onChange={(e) => handleFileChange(e.target.files)}
          style={{ display: 'none' }}
          disabled={images.length >= maxImages}
        />
        <label 
          htmlFor="image-upload" 
          className={`upload-button ${images.length >= maxImages ? 'disabled' : ''}`}
        >
          <FiUpload className="icon" />
          <span>{images.length >= maxImages ? '最多上传3张图片' : '点击或拖拽上传图片'}</span>
        </label>
        <div className="image-preview">
          {images.map((img, index) => (
            <div key={index} className="image-preview-item">
              <img src={img} alt={`预览 ${index + 1}`} />
              <button 
                type="button" 
                className="remove-image"
                onClick={() => removeImage(index)}
              >
                <FiX />
              </button>
            </div>
          ))}
        </div>
      </div>
      <style >{`
        .image-uploader {
          width: 100%;
          margin: 12px 0;
        }
        .upload-area {
          border: 2px dashed #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          transition: all 0.3s ease;
        }
        .upload-area.dragging {
          border-color: #646cff;
          background-color: rgba(100, 108, 255, 0.05);
        }
        .upload-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 16px;
          cursor: pointer;
          color: #666;
          transition: all 0.2s ease;
        }
        .upload-button:hover:not(.disabled) {
          color: #646cff;
        }
        .upload-button.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .icon {
          font-size: 24px;
          margin-bottom: 8px;
        }
        .image-preview {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 16px;
        }
        .image-preview-item {
          position: relative;
          width: 80px;
          height: 80px;
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid #eee;
        }
        .image-preview-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .remove-image {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(0, 0, 0, 0.6);
          border: none;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0;
          font-size: 12px;
          transition: all 0.2s ease;
        }
        .remove-image:hover {
          background: #ff4d4f;
        }
      `}</style>
    </div>
  );
};

export default ImageUploader;
