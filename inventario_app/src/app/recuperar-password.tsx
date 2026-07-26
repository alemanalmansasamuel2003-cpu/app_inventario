import React, { useState } from 'react';
import { router } from 'expo-router';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';

import api from '../services/api';

export default function RecuperarPassword() {
  const [correo, setCorreo] = useState('');
  const [enviando, setEnviando] = useState(false);

  const [mensajeError, setMensajeError] =
    useState('');

  /**
   * Valida el formato básico del correo.
   */
  const validarCorreo = (
    correoValidar: string
  ): boolean => {
    const expresionCorreo =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return expresionCorreo.test(
      correoValidar
    );
  };

  /**
   * Obtiene un mensaje de error legible,
   * aunque el servidor devuelva diferentes nombres.
   */
  const obtenerMensajeError = (
    error: any
  ): string => {
    const datos =
      error?.response?.data;

    if (typeof datos === 'string') {
      return datos;
    }

    if (
      typeof datos?.mensaje === 'string'
    ) {
      return datos.mensaje;
    }

    if (
      typeof datos?.message === 'string'
    ) {
      return datos.message;
    }

    if (
      typeof datos?.error === 'string'
    ) {
      return datos.error;
    }

    return 'No se pudo enviar el código. Intente nuevamente.';
  };

  /**
   * Muestra mensajes compatibles con web
   * y dispositivos móviles.
   */
  const mostrarMensaje = (
    titulo: string,
    mensaje: string
  ) => {
    if (Platform.OS === 'web') {
      window.alert(
        `${titulo}\n\n${mensaje}`
      );
    } else {
      Alert.alert(
        titulo,
        mensaje
      );
    }
  };

  /**
   * ============================================================
   * ENVIAR CÓDIGO DE RECUPERACIÓN
   * ============================================================
   */
  const enviarCodigo = async () => {
    const correoLimpio =
      correo.trim().toLowerCase();

    setMensajeError('');

    if (!correoLimpio) {
      setMensajeError(
        'Ingrese su correo electrónico.'
      );

      return;
    }

    if (!validarCorreo(correoLimpio)) {
      setMensajeError(
        'Ingrese un correo electrónico válido.'
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

      const mensajeExito =
        typeof response?.data?.mensaje ===
        'string'
          ? response.data.mensaje
          : 'El código fue enviado correctamente.';

      mostrarMensaje(
        'Código enviado',
        mensajeExito
      );

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

      const mensaje =
        obtenerMensajeError(error);

      setMensajeError(mensaje);
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
          style={[
            styles.input,
            mensajeError
              ? styles.inputError
              : null
          ]}
          placeholder="Correo electrónico"
          placeholderTextColor="#777777"
          value={correo}
          onChangeText={(texto) => {
            setCorreo(texto);

            if (mensajeError) {
              setMensajeError('');
            }
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!enviando}
          onSubmitEditing={enviarCodigo}
          returnKeyType="send"
        />

        {mensajeError ? (
          <View style={styles.contenedorError}>
            <Text style={styles.iconoError}>
              !
            </Text>

            <Text style={styles.textoError}>
              {mensajeError}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.boton,
            enviando &&
              styles.botonDeshabilitado
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
          activeOpacity={0.7}
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
    color: '#222222'
  },

  inputError: {
    borderColor: '#C62828',
    borderWidth: 1.5
  },

  contenedorError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDECEC',
    borderWidth: 1,
    borderColor: '#C62828',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 12
  },

  iconoError: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#C62828',
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 22,
    marginRight: 9
  },

  textoError: {
    flex: 1,
    color: '#9B1C1C',
    fontSize: 14,
    fontWeight: '500'
  },

  boton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginTop: 15
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