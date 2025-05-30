import { createClient } from '@supabase/supabase-js';

export class FrameService {
  private static supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  public static async extractFrame(videoElement: HTMLVideoElement): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get canvas context');
    }
    
    context.drawImage(videoElement, 0, 0);
    return canvas.toDataURL('image/jpeg');
  }

  public static async uploadFrame(frameDataUrl: string): Promise<string> {
    try {
      // Convert base64 to blob
      const response = await fetch(frameDataUrl);
      const blob = await response.blob();

      // Generate unique filename
      const filename = `frame_${Date.now()}.jpg`;
      const filePath = `frames/${filename}`;

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from('video-frames')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('video-frames')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading frame:', error);
      throw new Error('Failed to upload frame to storage');
    }
  }
}
