import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import api from '../services/api';

/**
 * ============================================================
 * PANTALLA: NUEVA CONTRASEÑA
 * ============================================================
 *
 * Permite establecer una nueva contraseña después
 * de validar el código de recuperación.
 *
 * Funcionalidades:
 *
 * ✔ Recibir correo y código desde la pantalla anterior.
 * ✔ Validar los campos de contraseña.
 * ✔ Confirmar que ambas contraseñas coincidan.
 * ✔ Mostrar u ocultar las contraseñas.
 * ✔ Enviar la nueva contraseña al backend.
 * ✔ Mostrar mensaje de éxito.
 * ✔ Regresar automáticamente al login.
 *
 * ============================================================
 */
export default function NuevaPassword() {

  /**
   * ============================================================
   * PARÁMETROS DE RECUPERACIÓN
   * ============================================================
   */
  const parametros = useLocalSearchParams<{
    correo?: string | string[];
    codigo?: string | string[];
  }>();

  /**
   * Convierte un parámetro de Expo Router
   * en una cadena de texto segura.
   */
  const obtenerTextoParametro = (
    valor: string | string[] | undefined
  ): string => {

    if (Array.isArray(valor)) {
      return valor[0] || '';
    }

    return valor || '';
  };

  /**
   * Correo y código recibidos desde
   * verificar-codigo.tsx.
   */
  const correo = obtenerTextoParametro(
    parametros.correo
  )
    .trim()
    .toLowerCase();

  const codigo = obtenerTextoParametro(
    parametros.codigo
  ).trim();

  /**
   * ============================================================
   * ESTADOS
   * ============================================================
   */

  const [
    nuevaPassword,
    setNuevaPassword,
  ] = useState('');

  const [
    confirmarPassword,
    setConfirmarPassword,
  ] = useState('');

  const [
    mostrarPassword,
    setMostrarPassword,
  ] = useState(false);

  const [
    actualizando,
    setActualizando,
  ] = useState(false);

  /**
   * ============================================================
   * MOSTRAR MENSAJE
   * ============================================================
   */
  const mostrarMensaje = (
    titulo: string,
    mensaje: string
  ): void => {

    if (Platform.OS === 'web') {

      window.alert(
        `${titulo}\n\n${mensaje}`
      );

      return;
    }

    Alert.alert(
      titulo,
      mensaje
    );
  };

  /**
   * ============================================================
   * ACTUALIZAR CONTRASEÑA
   * ============================================================
   */
  const actualizarPassword = async (): Promise<void> => {

    if (actualizando) {
      return;
    }

    const passwordNueva =
      nuevaPassword.trim();

    const passwordConfirmacion =
      confirmarPassword.trim();

    /**
     * Verificar parámetros recibidos.
     */
    if (!correo || !codigo) {

      mostrarMensaje(
        'Información incompleta',
        'No se recibió correctamente el correo o el código de recuperación.'
      );

      return;
    }

    /**
     * Validar campos obligatorios.
     */
    if (
      !passwordNueva ||
      !passwordConfirmacion
    ) {

      mostrarMensaje(
        'Campos incompletos',
        'Ingrese y confirme la nueva contraseña.'
      );

      return;
    }

    /**
     * Validar longitud mínima.
     */
    if (passwordNueva.length < 6) {

      mostrarMensaje(
        'Contraseña inválida',
        'La contraseña debe contener al menos 6 caracteres.'
      );

      return;
    }

    /**
     * Validar espacios.
     */
    if (/\s/.test(passwordNueva)) {

      mostrarMensaje(
        'Contraseña inválida',
        'La contraseña no debe contener espacios.'
      );

      return;
    }

    /**
     * Validar que ambas contraseñas coincidan.
     */
    if (
      passwordNueva !==
      passwordConfirmacion
    ) {

      mostrarMensaje(
        'Las contraseñas no coinciden',
        'La nueva contraseña y su confirmación deben ser iguales.'
      );

      return;
    }

    try {

      setActualizando(true);

      /**
       * Enviar los datos al backend.
       */
      const response = await api.post(
        '/auth/restablecer-password',
        {
          correo,
          codigo,
          nuevaPassword: passwordNueva,
        }
      );

      console.log(
        'Contraseña actualizada:',
        response.data
      );

      /**
       * Limpiar los campos.
       */
      setNuevaPassword('');
      setConfirmarPassword('');

      const mensajeExito =
        response?.data?.mensaje ||
        response?.data?.message ||
        'La contraseña se cambió con éxito.';

      /**
       * Expo Web.
       */
      if (Platform.OS === 'web') {

        window.alert(
          `Contraseña actualizada\n\n${mensajeExito}`
        );

        router.replace('/');

        return;
      }

      /**
       * Android y iOS.
       */
      Alert.alert(
        'Contraseña actualizada',
        mensajeExito,
        [
          {
            text: 'Iniciar sesión',
            onPress: () => {
              router.replace('/');
            },
          },
        ],
        {
          cancelable: false,
        }
      );

    } catch (error: any) {

      const datosError =
        error?.response?.data;

      console.error(
        'Error al actualizar la contraseña:',
        datosError ||
        error?.message ||
        error
      );

      mostrarMensaje(
        'Error',
        datosError?.mensaje ||
        datosError?.message ||
        error?.message ||
        'No se pudo actualizar la contraseña.'
      );

    } finally {

      setActualizando(false);
    }
  };

  /**
   * ============================================================
   * MOSTRAR U OCULTAR CONTRASEÑAS
   * ============================================================
   */
  const cambiarVisibilidadPassword = (): void => {

    if (actualizando) {
      return;
    }

    setMostrarPassword(
      (valorActual) =>
        !valorActual
    );
  };

  /**
   * ============================================================
   * CANCELAR
   * ============================================================
   */
  const cancelar = (): void => {

    if (actualizando) {
      return;
    }

    router.replace('/');
  };

  /**
   * ============================================================
   * INTERFAZ
   * ============================================================
   */
  return (

    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >

      <ScrollView
        contentContainerStyle={
          styles.contenidoScroll
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.card}>

          {/* Icono */}

          <Text style={styles.icono}>
            🔐
          </Text>

          {/* Título */}

          <Text style={styles.titulo}>
            Nueva Contraseña
          </Text>

          {/* Descripción */}

          <Text style={styles.descripcion}>
            Ingrese y confirme una nueva contraseña para su cuenta.
          </Text>

          {/* Cuenta */}

          {correo ? (

            <View style={styles.tarjetaCorreo}>

              <Text style={styles.etiquetaCorreo}>
                Cuenta
              </Text>

              <Text style={styles.correo}>
                {correo}
              </Text>

            </View>

          ) : null}

          {/* Nueva contraseña */}

          <Text style={styles.label}>
            Nueva contraseña
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ingrese la nueva contraseña"
            placeholderTextColor="#999999"
            value={nuevaPassword}
            onChangeText={setNuevaPassword}
            secureTextEntry={!mostrarPassword}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            autoComplete="new-password"
            editable={!actualizando}
            returnKeyType="next"
          />

          {/* Confirmación */}

          <Text style={styles.label}>
            Confirmar contraseña
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Confirme la nueva contraseña"
            placeholderTextColor="#999999"
            value={confirmarPassword}
            onChangeText={setConfirmarPassword}
            secureTextEntry={!mostrarPassword}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            autoComplete="new-password"
            editable={!actualizando}
            returnKeyType="done"
            onSubmitEditing={actualizarPassword}
          />

          {/* Requisito */}

          <Text style={styles.requisito}>
            La contraseña debe contener al menos 6 caracteres y no debe incluir espacios.
          </Text>

          {/* Mostrar u ocultar */}

          <TouchableOpacity
            style={styles.botonMostrar}
            onPress={
              cambiarVisibilidadPassword
            }
            disabled={actualizando}
            activeOpacity={0.7}
          >

            <Text style={styles.textoMostrar}>

              {
                mostrarPassword
                  ? '🙈 Ocultar contraseñas'
                  : '👁️ Mostrar contraseñas'
              }

            </Text>

          </TouchableOpacity>

          {/* Actualizar */}

          <TouchableOpacity
            style={[
              styles.botonActualizar,
              actualizando &&
                styles.botonDeshabilitado,
            ]}
            disabled={actualizando}
            onPress={actualizarPassword}
            activeOpacity={0.8}
          >

            {actualizando ? (

              <View style={styles.contenidoCargando}>

                <ActivityIndicator
                  color="#FFFFFF"
                  size="small"
                />

                <Text style={styles.textoBoton}>
                  Actualizando...
                </Text>

              </View>

            ) : (

              <Text style={styles.textoBoton}>
                Actualizar Contraseña
              </Text>

            )}

          </TouchableOpacity>

          {/* Cancelar */}

          <TouchableOpacity
            style={styles.botonCancelar}
            onPress={cancelar}
            disabled={actualizando}
            activeOpacity={0.7}
          >

            <Text style={styles.textoCancelar}>
              Cancelar
            </Text>

          </TouchableOpacity>

        </View>

      </ScrollView>

    </KeyboardAvoidingView>
  );
}

/**
 * ============================================================
 * ESTILOS
 * ============================================================
 */
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },

  contenidoScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 25,
  },

  card: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 25,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },

  icono: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 10,
  },

  titulo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0D3B66',
    textAlign: 'center',
    marginBottom: 12,
  },

  descripcion: {
    textAlign: 'center',
    color: '#667085',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 22,
  },

  tarjetaCorreo: {
    backgroundColor: '#F4F7FB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3E8EF',
    padding: 13,
    marginBottom: 18,
  },

  etiquetaCorreo: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },

  correo: {
    color: '#0D3B66',
    fontSize: 15,
    fontWeight: '700',
  },

  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#344054',
    marginBottom: 8,
    marginTop: 8,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 10,
    fontSize: 16,
    color: '#222222',
  },

  requisito: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },

  botonMostrar: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    marginTop: 4,
    marginBottom: 16,
  },

  textoMostrar: {
    color: '#0D6EFD',
    fontWeight: '700',
    fontSize: 14,
  },

  botonActualizar: {
    backgroundColor: '#198754',
    paddingVertical: 16,
    borderRadius: 12,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },

  botonDeshabilitado: {
    opacity: 0.6,
  },

  contenidoCargando: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },

  textoBoton: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
  },

  botonCancelar: {
    paddingVertical: 15,
    marginTop: 8,
  },

  textoCancelar: {
    color: '#DC3545',
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 16,
  },
});