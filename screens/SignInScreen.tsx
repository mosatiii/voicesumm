import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';

export default function SignInScreen({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      {/* Outer pressable catches taps outside the modal */}
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* Inner pressable blocks the tap from closing when clicking inside modal */}
        <Pressable style={styles.modal} onPress={() => {}}>
          <Text style={styles.title}>Sign In</Text>

          <Pressable style={styles.google} onPress={() => {}}>
            <Text style={styles.googleText}>Continue with Google</Text>
          </Pressable>

          <Pressable style={styles.apple} onPress={() => {}}>
            <Text style={styles.appleText}>Continue with Apple</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    width: '85%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
  },
  google: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  googleText: {
    fontSize: 16,
  },
  apple: {
    backgroundColor: 'black',
    padding: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  appleText: {
    fontSize: 16,
    color: 'white',
  },
});
