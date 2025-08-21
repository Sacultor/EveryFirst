import { useCallback, useState } from 'react';
import { FiUpload, FiX } from 'react-icons/fi';

interface ImageUploaderProps {
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  initialImages?: string[];
}

const ImageUploader = ({ onImagesChange, maxImages = 3, initialImages = [] }: ImageUploaderProps) => {
  const [images, setImages] = useState<string[]>(initialImages);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const newImages: string[] = [];
    const fileArray = Array.from(files).slice(0, maxImages - images.length);
    
    if (fileArray.length === 0) return;

    fileArray.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const updatedImages = [...images, result];
        setImages(updatedImages);
        onImagesChange(updatedImages);
      };
      reader.readAsDataURL(file);
    });
  }, [images, maxImages, onImagesChange]);

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
    onImagesChange(newImages);
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
