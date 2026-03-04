import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useUser } from '../contexts/UserContext';

const RegistrationScreen = ({ navigation }) => {
    const [nombre, setNombre] = useState('');
    const { saveProfile } = useUser();

    const handleRegister = async () => {
        if (!nombre.trim()) {
            alert('Por favor, ingresa tu nombre');
            return;
        }

        try {
            await saveProfile({ nombre: nombre.trim() });
            // The App.js navigation will automatically switch to the Main App Stack 
            // when userProfile is populated in context
        } catch (error) {
            alert('Error al guardar el perfil');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <View style={styles.card}>
                <Text style={styles.title}>Bienvenido a Secretario</Text>
                <Text style={styles.subtitle}>Ingresa tu nombre para identificarte localmente en esta aplicación.</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Tu nombre (Ej. Juan Pérez)"
                    value={nombre}
                    onChangeText={setNombre}
                    autoCapitalize="words"
                />

                <TouchableOpacity style={styles.button} onPress={handleRegister}>
                    <Text style={styles.buttonText}>Comenzar</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        padding: 20,
    },
    card: {
        width: '100%',
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 24,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
        backgroundColor: '#f9fafb',
    },
    button: {
        backgroundColor: '#3b82f6',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default RegistrationScreen;
