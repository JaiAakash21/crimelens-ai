import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import { TypePicker } from "../../src/components/incident/TypePicker";
import { useCreateIncident } from "../../src/hooks/useIncidents";
import { useLocation } from "../../src/hooks/useLocation";
import { useImagePicker } from "../../src/hooks/useImagePicker";
import { colors } from "../../src/constants";

export default function ReportScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [incidentType, setIncidentType] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutateAsync: createIncident, isPending } = useCreateIncident();
  const { location } = useLocation();
  const { image, pickFromGallery, takePhoto, clearImage } = useImagePicker();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim() || title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }
    if (!description.trim() || description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }
    if (!incidentType) {
      newErrors.type = "Please select an incident type";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    if (!location) {
      Alert.alert(
        "Location Required",
        "We couldn't get your location. Please ensure location permissions are enabled."
      );
      return;
    }

    try {
      await createIncident({
        data: {
          title: title.trim(),
          description: description.trim(),
          incident_type: incidentType,
          lat: location.latitude,
          lng: location.longitude,
          gps_accuracy: location.accuracy,
          occurred_at: new Date().toISOString(),
        },
        image: image ?? undefined,
      });

      Alert.alert(
        "Report Submitted",
        "Your incident has been reported. Our AI is analyzing it for classification.",
        [
          {
            text: "OK",
            onPress: () => {
              setTitle("");
              setDescription("");
              setIncidentType("");
              clearImage();
              setErrors({});
              router.push("/(tabs)");
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert(
        "Error",
        "Failed to submit report. Please try again."
      );
    }
  };

  const showImagePicker = () => {
    Alert.alert("Add Photo", "Choose a source", [
      { text: "Take Photo", onPress: takePhoto },
      { text: "Choose from Gallery", onPress: pickFromGallery },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Incident Details</Text>

        <Input
          label="Title"
          value={title}
          onChangeText={(t) => {
            setTitle(t);
            if (errors.title) setErrors((e) => ({ ...e, title: "" }));
          }}
          placeholder="e.g., Phone snatched near MG Road"
          error={errors.title}
        />

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <View
            style={[
              styles.textArea,
              errors.description ? styles.fieldError : null,
            ]}
          >
            <Input
              label=""
              value={description}
              onChangeText={(d) => {
                setDescription(d);
                if (errors.description)
                  setErrors((e) => ({ ...e, description: "" }));
              }}
              placeholder="Describe what happened, including time, location details, and any suspect information..."
              multiline
              numberOfLines={4}
              style={styles.textAreaInput}
            />
          </View>
          {errors.description ? (
            <Text style={styles.errorText}>{errors.description}</Text>
          ) : null}
        </View>

        <TypePicker
          value={incidentType}
          onChange={(t) => {
            setIncidentType(t);
            if (errors.type) setErrors((e) => ({ ...e, type: "" }));
          }}
          error={errors.type}
        />

        <View style={styles.field}>
          <Text style={styles.label}>Location</Text>
          <View style={styles.locationBox}>
            <Text style={styles.locationIcon}>📍</Text>
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                {location
                  ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                  : "Detecting location..."}
              </Text>
              {location?.accuracy && (
                <Text style={styles.accuracyText}>
                  Accuracy: ±{location.accuracy.toFixed(0)}m
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Photo (optional)</Text>
          {image ? (
            <View style={styles.imagePreview}>
              <Image
                source={{ uri: image.uri }}
                style={styles.image}
              />
              <TouchableOpacity
                style={styles.removeImage}
                onPress={clearImage}
              >
                <Text style={styles.removeImageText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.imageButton}
              onPress={showImagePicker}
            >
              <Text style={styles.imageButtonIcon}>📷</Text>
              <Text style={styles.imageButtonText}>
                Add Photo Evidence
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Button
          title="Submit Report"
          onPress={handleSubmit}
          loading={isPending}
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 20,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  textAreaInput: {
    height: 120,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  fieldError: {
    borderColor: colors.danger,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },
  locationBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    color: colors.text,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  accuracyText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    padding: 24,
  },
  imageButtonIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  imageButtonText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  imagePreview: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  removeImage: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: colors.danger + "DD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removeImageText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  submitButton: {
    marginTop: 8,
  },
});
