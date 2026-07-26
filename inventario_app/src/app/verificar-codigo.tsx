import React, { useState } from 'react';

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

import {
  router,
  useLocalSearchParams
} from 'expo-router';

import api from '../services/api';

/**
 * ============================================================
 * VERIFICAR CÓDIGO
 * ============================================================
 *
 * Permite validar el código de recuperación enviado al correo.
 *
 * Si el código es correcto:
 *
 * 1. Envía el correo y el código al backend.
 * 2. Valida que el código exista y no haya vencido.
 * 3. Navega a la pantalla para crear una nueva contraseña.
 *
 * Si el código es incorrecto:
 *
 * 1. Muestra un mensaje de error.
 * 2. Limpia el campo del código.
 * 3. No permite navegar a la siguiente pantalla.
 *
 * ============================================================
 */
export default function VerificarCodigo() {

  /**
   * Obtiene el correo enviado desde
   * recuperar-password.tsx.
   */
  const params = useLocalSearchParams<{
    correo?: string | string[];
  }>();

  /**
   * Convierte el parámetro correo
   * en un texto seguro.
   */
  const correoRecibido = Array.isArray(params.correo)
    ? params.correo[0]
    : params.correo;

  const correoLimpio = String(
    correoRecibido || ''
  )
    .trim()
    .toLowerCase();

  /**
   * Código ingresado por el usuario.
   */
  const [codigo, setCodigo] = useState('');

  /**
   * Indica si se está verificando el código.
   */
  const [verificando, setVerificando] =
    useState(false);

  /**
   * ============================================================
   * MOSTRAR MENSAJE
   * ============================================================
   *
   * Alert.alert puede no mostrarse correctamente en Expo Web.
   * Por eso, en navegador se utiliza window.alert.
   */
  const mostrarMensaje = (
    titulo: string,
    mensaje: string
  ) => {

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
   * VERIFICAR CÓDIGO
   * ============================================================
   */
  const verificarCodigo = async () => {

    const codigoLimpio = codigo.trim();

    /**
     * Evita realizar varias solicitudes
     * al mismo tiempo.
     */
    if (verificando) {
      return;
    }

    /**
     * Valida que el correo exista.
     */
    if (!correoLimpio) {

      mostrarMensaje(
        'Error',
        'No se recibió el correo electrónico.'
      );

      return;
    }

    /**
     * Valida que el código tenga seis números.
     */
    if (!/^\d{6}$/.test(codigoLimpio)) {

      mostrarMensaje(
        'Validación',
        'Ingrese el código completo de 6 dígitos.'
      );

      return;
    }

    try {

      setVerificando(true);

      /**
       * Envía el correo y el código al backend.
       */
      const response = await api.post(
        '/auth/verificar-codigo',
        {
          correo: correoLimpio,
          codigo: codigoLimpio
        }
      );

      console.log(
        'Respuesta al verificar código:',
        response.data
      );

      /**
       * Aunque el servidor responda con estado 200,
       * se valida la propiedad success.
       *
       * Esto evita avanzar cuando el backend devuelve:
       *
       * {
       *   success: false,
       *   mensaje: "Código incorrecto"
       * }
       */
      if (response.data?.success !== true) {

        setCodigo('');

        mostrarMensaje(
          'Código incorrecto',
          response.data?.mensaje ||
          response.data?.message ||
          'El código ingresado es incorrecto.'
        );

        return;
      }

      /**
       * Navega a la pantalla para crear
       * la nueva contraseña solamente cuando
       * el código fue validado correctamente.
       */
      router.replace({
        pathname: '/nueva-password',
        params: {
          correo: correoLimpio,
          codigo: codigoLimpio
        }
      });

    } catch (error: any) {

      const datosError =
        error?.response?.data;

      const estadoHttp =
        error?.response?.status;

      console.error(
        'Error al verificar código:',
        {
          estado: estadoHttp,
          datos: datosError,
          mensaje: error?.message
        }
      );

      /**
       * Limpia el código incorrecto para
       * permitir que el usuario lo vuelva
       * a ingresar.
       */
      setCodigo('');

      /**
       * Mensaje enviado por el backend.
       */
      const mensajeServidor =
        datosError?.mensaje ||
        datosError?.message;

      /**
       * Detecta los errores relacionados
       * con código incorrecto o vencido.
       */
      if (
        estadoHttp === 400 ||
        estadoHttp === 401 ||
        estadoHttp === 404
      ) {

        mostrarMensaje(
          'Código incorrecto',
          mensajeServidor ||
          'El código ingresado es incorrecto o ha vencido.'
        );

        return;
      }

      /**
       * Error de conexión con el servidor.
       */
      if (!error?.response) {

        mostrarMensaje(
          'Error de conexión',
          'No fue posible conectar con el servidor. Verifique que el backend esté ejecutándose.'
        );

        return;
      }

      /**
       * Error inesperado.
       */
      mostrarMensaje(
        'Error',
        mensajeServidor ||
        'No fue posible verificar el código. Inténtelo nuevamente.'
      );

    } finally {

      setVerificando(false);
    }
  };

  return (

    <View style={styles.container}>

      <View style={styles.formulario}>

        {/* Título */}

        <Text style={styles.titulo}>
          Verificar Código
        </Text>

        {/* Instrucciones */}

        <Text style={styles.descripcion}>
          Ingrese el código de 6 dígitos enviado al correo:
        </Text>

        {/* Correo */}

        <Text style={styles.correo}>
          {correoLimpio || 'Correo no disponible'}
        </Text>

        {/* Campo del código */}

        <TextInput
          style={styles.inputCodigo}
          placeholder="000000"
          placeholderTextColor="#A0A0A0"
          value={codigo}
          onChangeText={(texto) => {

            /**
             * Solo permite números y limita
             * el contenido a seis dígitos.
             */
            const soloNumeros = texto
              .replace(/\D/g, '')
              .slice(0, 6);

            setCodigo(soloNumeros);
          }}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={6}
          textAlign="center"
          autoFocus
          editable={!verificando}
          selectTextOnFocus
          selectionColor="#007AFF"
          onSubmitEditing={verificarCodigo}
          returnKeyType="done"
        />

        {/* Botón verificar */}

        <TouchableOpacity
          style={[
            styles.botonVerificar,
            verificando &&
              styles.botonDeshabilitado
          ]}
          disabled={verificando}
          onPress={verificarCodigo}
          activeOpacity={0.8}
        >

          {verificando ? (

            <ActivityIndicator
              color="#FFFFFF"
            />

          ) : (

            <Text style={styles.textoBoton}>
              Verificar Código
            </Text>
          )}

        </TouchableOpacity>

        {/* Botón volver */}

        <TouchableOpacity
          style={styles.botonVolver}
          onPress={() => router.back()}
          disabled={verificando}
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

/**
 * ============================================================
 * ESTILOS
 * ============================================================
 */
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
    fontSize: 16,
    color: '#555555',
    textAlign: 'center',
    marginBottom: 8
  },

  correo: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25
  },

  inputCodigo: {
    width: '100%',
    height: 72,

    backgroundColor: '#FFFFFF',

    borderWidth: 2,
    borderColor: '#D0D5DD',
    borderRadius: 12,

    fontSize: 32,
    fontWeight: 'bold',
    color: '#0D3B66',

    textAlign: 'center',
    textAlignVertical: 'center',

    letterSpacing: 12,

    paddingHorizontal: 0,
    paddingVertical: 0,

    marginBottom: 20
  },

  botonVerificar: {
    minHeight: 50,
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },

  botonDeshabilitado: {
    opacity: 0.6
  },

  textoBoton: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold'
  },

  botonVolver: {
    padding: 15,
    marginTop: 10
  },

  textoVolver: {
    color: '#007AFF',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16
  }
});