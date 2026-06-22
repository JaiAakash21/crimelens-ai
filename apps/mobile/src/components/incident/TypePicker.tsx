import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
} from "react-native";
import { colors, incidentTypes } from "../../constants";

interface TypePickerProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function TypePicker({ value, onChange, error }: TypePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selected = incidentTypes.find((t) => t.value === value);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Incident Type</Text>
      <Pressable
        style={[styles.trigger, error ? styles.triggerError : null]}
        onPress={() => setOpen(true)}
      >
        <Text
          style={[styles.triggerText, !selected && styles.placeholder]}
        >
          {selected?.label ?? "Select incident type"}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setOpen(false)}
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Select Incident Type</Text>
            <FlatList
              data={incidentTypes}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.option,
                    item.value === value && styles.optionSelected,
                  ]}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.value === value && styles.optionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6,
  },
  trigger: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
  },
  triggerError: {
    borderColor: colors.danger,
  },
  triggerText: {
    fontSize: 16,
    color: colors.text,
    textTransform: "capitalize",
  },
  placeholder: {
    color: colors.muted,
  },
  arrow: {
    fontSize: 12,
    color: colors.muted,
  },
  error: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "60%",
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.primary + "10",
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
    textTransform: "capitalize",
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
});
