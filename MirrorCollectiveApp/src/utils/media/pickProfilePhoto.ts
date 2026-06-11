/**
 * Profile-photo picker with a native crop / zoom / adjust step.
 *
 * Wraps react-native-image-crop-picker's `openPicker` with a circular crop
 * overlay (avatars are round) so the user can pinch-zoom, pan, rotate and crop
 * before saving. `forceJpg` guarantees a JPEG result, which:
 *   - matches the upload pipeline (the presigned PUT is signed as image/jpeg,
 *     and S3 rejects a mismatched Content-Type), and
 *   - sidesteps HEIC photos that otherwise don't render.
 *
 * Shared by the user profile, recipient and guardian "add photo" flows.
 */
import ImageCropPicker from 'react-native-image-crop-picker';

export interface PickedProfilePhoto {
  /** Local file uri of the cropped JPEG, ready to upload as image/jpeg. */
  uri: string;
}

/**
 * Open the library, let the user crop/zoom/adjust, and return the cropped
 * JPEG's uri. Returns null if the user cancels or picking fails.
 */
export async function pickProfilePhoto(): Promise<PickedProfilePhoto | null> {
  try {
    const image = await ImageCropPicker.openPicker({
      width: 800,
      height: 800,
      cropping: true,
      cropperCircleOverlay: true, // round avatar crop
      mediaType: 'photo',
      forceJpg: true, // always JPEG (upload + HEIC safety)
      compressImageQuality: 0.85,
      enableRotationGesture: true,
      cropperToolbarTitle: 'Adjust photo',
      cropperChooseText: 'Use photo',
      cropperCancelText: 'Cancel',
    });
    return { uri: image.path };
  } catch (err: unknown) {
    // The library signals cancel via an error code, not a return value.
    if ((err as { code?: string })?.code !== 'E_PICKER_CANCELLED') {
      console.warn('Profile photo pick/crop failed:', err);
    }
    return null;
  }
}
