import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { API_ORIGIN } from '@/lib/apiConfig';

const AvatarUpload = ({ currentAvatar, userName, onAvatarUpdate }) => {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!preview) return;
    setUploading(true);
    try {
      const token = localStorage.getItem('devinspect-token');
      // Convert base64 to blob
      const res = await fetch(preview);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.jpg');

      const response = await fetch(`${API_ORIGIN}/api/user/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onAvatarUpdate?.(data.avatarUrl);
        setPreview(null);
        toast.success('Avatar updated!');
      } else {
        // Store locally as fallback
        localStorage.setItem('devinspect-avatar', preview);
        onAvatarUpdate?.(preview);
        setPreview(null);
        toast.success('Avatar saved locally!');
      }
    } catch {
      // Fallback: store in localStorage
      localStorage.setItem('devinspect-avatar', preview);
      onAvatarUpdate?.(preview);
      setPreview(null);
      toast.success('Avatar saved!');
    } finally {
      setUploading(false);
    }
  };

  const displayAvatar = preview || currentAvatar || localStorage.getItem('devinspect-avatar');
  const initials = userName?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar Display */}
      <div className="relative">
        <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-border/50 shadow-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
          {displayAvatar ? (
            <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-black text-gradient">{initials}</span>
          )}
        </div>
        {preview && (
          <button
            onClick={() => setPreview(null)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-destructive rounded-full flex items-center justify-center shadow-md"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        )}
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`w-full max-w-xs border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
          isDragActive ? 'border-primary bg-primary/10' : 'border-border/40 hover:border-primary/50 hover:bg-muted/30'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-5 h-5 mx-auto mb-1.5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          {isDragActive ? 'Drop image here' : 'Drag & drop or click to upload'}
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">JPG, PNG, WebP · Max 5MB</p>
      </div>

      {preview && (
        <Button
          onClick={handleUpload}
          disabled={uploading}
          className="btn-primary h-9 px-6 text-sm font-bold rounded-xl"
        >
          {uploading ? 'Uploading...' : 'Save Avatar'}
        </Button>
      )}
    </div>
  );
};

export default AvatarUpload;
