import React, { useState } from 'react';
import { router } from 'expo-router';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';

import api from '../services/api';

export default function RecuperarPassword() {

  const [correo, setCorreo] = useState('');
  const [enviando, setEnviando] = useState(false);

  /**
   * ============================================================
   * ENVIAR CÓDIGO DE RECUPERACIÓN
   * ============================================================
   */
  const enviarCodigo = async () => {

    const correoLimpio =
      correo.trim().toLowerCase();

    if (!correoLimpio) {

      Alert.alert(
        'Validación',
        'Ingrese su correo electrónico.'
      );

      return;
    }

    try {

      setEnviando(true);

      const response = await api.post(
        '/auth/recuperar-password',
        {
          correo: correoLimpio
        }
      );

      console.log(
        'Respuesta del servidor:',
        response.data
      );

      /**
       * Cambia directamente a la pantalla
       * donde se ingresa el código.
       */
      router.push({
        pathname: '/verificar-codigo',
        params: {
          correo: correoLimpio
        }
      });

    } catch (error: any) {

      console.error(
        'Error enviando el código:',
        error?.response?.data ||
        error?.message
      );

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
        error?.response?.data?.mensaje ||
        'No se pudo enviar el código.'
      );

    } finally {

      setEnviando(false);
    }
  };

  return (

    <View style={styles.container}>

      <View style={styles.formulario}>

        <Text style={styles.titulo}>
          Recuperar contraseña
        </Text>

        <Text style={styles.descripcion}>
          Escriba el correo asociado a su cuenta.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor="#777777"
          value={correo}
          onChangeText={setCorreo}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!enviando}
          onSubmitEditing={enviarCodigo}
        />

        <TouchableOpacity
          style={[
            styles.boton,
            enviando && styles.botonDeshabilitado
          ]}
          onPress={enviarCodigo}
          disabled={enviando}
          activeOpacity={0.8}
        >

          {enviando ? (

            <ActivityIndicator
              color="#FFFFFF"
            />

          ) : (

            <Text style={styles.textoBoton}>
              Enviar código
            </Text>
          )}

        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botonVolver}
          onPress={() => router.back()}
          disabled={enviando}
        >

          <Text style={styles.textoVolver}>
            Volver
          </Text>

        </TouchableOpacity>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
    backgroundColor: '#F5F1E8'
  },

  formulario: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center'
  },

  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0D3B66',
    textAlign: 'center',
    marginBottom: 15
  },

  descripcion: {
    textAlign: 'center',
    color: '#555555',
    marginBottom: 25
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 15
  },

  boton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50
  },

  botonDeshabilitado: {
    opacity: 0.65
  },

  textoBoton: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center'
  },

  botonVolver: {
    padding: 15,
    marginTop: 10
  },

  textoVolver: {
    color: '#007AFF',
    textAlign: 'center',
    fontWeight: 'bold'
  }
});