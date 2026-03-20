import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';

const LoginScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const st = getStyles(colors);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useUser();

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            alert('Por favor, ingresa tu usuario y contraseña');
            return;
        }

        setLoading(true);
        const result = await login(username.trim(), password);
        setLoading(false);

        if (!result.success) {
            alert(result.error || 'Error al iniciar sesión');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={st.container}
        >
            <View style={st.card}>
                <Text style={st.title}>Bienvenido a Secretario</Text>
                <Text style={st.subtitle}>Ingresa tus credenciales para acceder a la aplicación local.</Text>

                <Text style={st.label}>Usuario</Text>
                <TextInput
                    style={st.input}
                    placeholder="ej. secretario"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    placeholderTextColor={colors.textSecondary}
                />

                <Text style={st.label}>Contraseña</Text>
                <TextInput
                    style={st.input}
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholderTextColor={colors.textSecondary}
                />

                <TouchableOpacity
                    style={[st.button, loading && st.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    <Text style={st.buttonText}>{loading ? 'Iniciando...' : 'Iniciar Sesión'}</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const getStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
        padding: 20,
    },
    card: {
        width: '100%',
        backgroundColor: colors.card,
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
        color: colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 24,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
        backgroundColor: colors.inputBackground,
        color: colors.inputText,
    },
    button: {
        backgroundColor: colors.primary,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
        marginBottom: 4,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
});

export default LoginScreen;
