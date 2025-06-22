import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';

const ProfileImageUpload = ({ onImageUpload, isLoading = false }) => {
  const { user } = useSelector(state => state.auth);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // 사용자의 프로필 이미지 URL을 설정
  useEffect(() => {
    if (user?.profileImageUrl) {
      // 백엔드에서 제공하는 정적 파일 URL로 변환
      const imageUrl = user.profileImageUrl.startsWith('http') 
        ? user.profileImageUrl 
        : `http://localhost:3000${user.profileImageUrl}`;
      setPreviewUrl(imageUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [user?.profileImageUrl]);

  const handleFileSelect = (file) => {
    if (!file) return;

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 검증 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);

    // 부모 컴포넌트에 파일 전달
    onImageUpload(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* 프로필 이미지 미리보기 */}
      <div className="relative">
        <div
          className={`w-32 h-32 rounded-full overflow-hidden border-4 cursor-pointer transition-all duration-200 ${
            dragActive 
              ? 'border-primary bg-primary/10' 
              : 'border-gray-200 hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="프로필 이미지"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}
          
          {/* 업로드 오버레이 */}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        {/* 로딩 인디케이터 */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {/* 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* 안내 텍스트 */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          클릭하거나 이미지를 드래그하여 업로드하세요
        </p>
        <p className="text-xs text-gray-400 mt-1">
          JPG, PNG, GIF (최대 5MB)
        </p>
      </div>

      {/* 이미지 제거 버튼 */}
      {previewUrl && !isLoading && (
        <button
          type="button"
          onClick={() => {
            setPreviewUrl(null);
            onImageUpload(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}
          className="text-sm text-red-500 hover:text-red-700 transition-colors"
        >
          이미지 제거
        </button>
      )}
    </div>
  );
};

export default ProfileImageUpload; 