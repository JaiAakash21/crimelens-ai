import { useState } from "react";
import * as ImagePicker from "expo-image-picker";

interface ImageResult {
  uri: string;
  type: string;
  name: string;
}

export function useImagePicker() {
  const [image, setImage] = useState<ImageResult | null>(null);

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImage({
        uri: asset.uri,
        type: asset.type ?? "image/jpeg",
        name: asset.fileName ?? `photo_${Date.now()}.jpg`,
      });
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImage({
        uri: asset.uri,
        type: asset.type ?? "image/jpeg",
        name: asset.fileName ?? `photo_${Date.now()}.jpg`,
      });
    }
  };

  const clearImage = () => setImage(null);

  return { image, pickFromGallery, takePhoto, clearImage };
}
