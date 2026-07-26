import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';

import { useRouter } from 'expo-router';

import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';

import api from '../services/api';

/**
 * ============================================================
 * LOGO DEL HOGAR EL BUEN SAMARITANO
 * ============================================================
 */
const logoHBS = require(
  '../../assets/images/logo-hbs.jpg'
);

/**
 * ============================================================
 * DATOS DEL USUARIO
 * ============================================================
 */
interface UsuarioLogin {
  id_usuario: number;
  nombre: string;
  correo: string;
  rol: string;
}

/**
 * ============================================================
 * RESPUESTA DEL BACKEND
 * ============================================================
 */
interface RespuestaLogin {
  success: boolean;
  mensaje?: string;
  message?: string;
  token?: string;
  usuario?: UsuarioLogin;
}

/**
 * ============================================================
 * LOGIN DEL SISTEMA DE INVENTARIO
 * ============================================================
 */
export default function LoginScreen() {

  const router = useRouter();

  /**
   * ============================================================
   * ESTADOS
   * ============================================================
   */
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');

  const [
    mostrarPassword,
    setMostrarPassword,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  /**
   * ============================================================
   * MOSTRAR ALERTAS
   * ============================================================
   *
   * Alert.alert funciona correctamente en Android y iOS.
   * En web se utiliza window.alert.
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
      mensaje,
      [
        {
          text: 'Aceptar',
        },
      ]
    );
  };

  /**
   * ============================================================
   * VALIDAR CORREO
   * ============================================================
   */
  const correoEsValido = (
    email: string
  ): boolean => {

    const expresionCorreo =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return expresionCorreo.test(email);
  };

  /**
   * ============================================================
   * INICIAR SESIÓN
   * ============================================================
   */
  const iniciarSesion = async (): Promise<void> => {

    if (loading) {
      return;
    }

    const email =
      correo
        .trim()
        .toLowerCase();

    const clave =
      password.trim();

    /**
     * Validar campos vacíos.
     */
    if (!email && !clave) {

      mostrarMensaje(
        'Campos incompletos',
        'Ingrese su correo electrónico y contraseña.'
      );

      return;
    }

    if (!email) {

      mostrarMensaje(
        'Correo requerido',
        'Ingrese su correo electrónico.'
      );

      return;
    }

    if (!clave) {

      mostrarMensaje(
        'Contraseña requerida',
        'Ingrese su contraseña.'
      );

      return;
    }

    /**
     * Validar formato del correo.
     */
    if (!correoEsValido(email)) {

      mostrarMensaje(
        'Correo inválido',
        'Ingrese un correo electrónico válido.'
      );

      return;
    }

    try {

      setLoading(true);

      const response =
        await api.post<RespuestaLogin>(
          '/auth/login',
          {
            correo: email,
            password: clave,
          }
        );

      const datos = response.data;

      /**
       * Inicio de sesión exitoso.
       */
      if (
        datos?.success &&
        datos?.usuario
      ) {

        const usuario =
          datos.usuario;

        console.log(
          '========== USUARIO AUTENTICADO =========='
        );

        console.log(usuario);

        setPassword('');

        router.replace({
          pathname: '/inventario' as any,

          params: {
            id: String(
              usuario.id_usuario
            ),

            nombre: String(
              usuario.nombre
            ),

            correo: String(
              usuario.correo
            ),

            rol: String(
              usuario.rol
            ),
          },
        });

        return;
      }

      /**
       * El backend respondió, pero no autorizó
       * el acceso.
       */
      mostrarMensaje(
        'Acceso rechazado',
        datos?.mensaje ||
        datos?.message ||
        'El correo o la contraseña son incorrectos.'
      );

    } catch (error: any) {

      const estadoHttp =
        error?.response?.status;

      const datosError =
        error?.response?.data;

      console.error(
        'Error al iniciar sesión:',
        datosError ||
        error?.message ||
        error
      );

      /**
       * Credenciales incorrectas.
       */
      if (estadoHttp === 401) {

        mostrarMensaje(
          'Datos incorrectos',
          datosError?.mensaje ||
          datosError?.message ||
          'El correo o la contraseña son incorrectos.'
        );

        return;
      }

      /**
       * Usuario desactivado.
       */
      if (estadoHttp === 403) {

        mostrarMensaje(
          'Cuenta desactivada',
          datosError?.mensaje ||
          datosError?.message ||
          'Su cuenta se encuentra desactivada. Contacte al administrador.'
        );

        return;
      }

      /**
       * Error de conexión.
       */
      if (!error?.response) {

        mostrarMensaje(
          'Sin conexión',
          'No se pudo conectar con el servidor. Verifique que el backend esté ejecutándose.'
        );

        return;
      }

      /**
       * Otros errores.
       */
      mostrarMensaje(
        'Error al iniciar sesión',
        datosError?.mensaje ||
        datosError?.message ||
        'No fue posible iniciar sesión.'
      );

    } finally {

      setLoading(false);
    }
  };

  /**
   * ============================================================
   * RECUPERAR CONTRASEÑA
   * ============================================================
   */
  const recuperarPassword = (): void => {

    if (loading) {
      return;
    }

    router.push(
      '/recuperar-password' as any
    );
  };

  /**
   * ============================================================
   * MOSTRAR U OCULTAR CONTRASEÑA
   * ============================================================
   */
  const cambiarVisibilidadPassword =
    (): void => {

      if (loading) {
        return;
      }

      setMostrarPassword(
        (estadoActual) =>
          !estadoActual
      );
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

      <StatusBar
        barStyle="dark-content"
        backgroundColor="#EAF3FF"
      />

      <ScrollView
        contentContainerStyle={
          styles.contenidoScroll
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* =====================================================
            ENCABEZADO DE INVENTARIO
        ====================================================== */}

        <Animated.View
          entering={
            FadeInUp.duration(700)
          }
          style={styles.encabezado}
        >

          <View style={styles.iconoInventario}>

            <Text style={styles.iconoLista}>
              📋
            </Text>

            <Text style={styles.iconoCaja}>
              📦
            </Text>

          </View>

          <Text style={styles.tituloSistema}>
            INVENTARIO
          </Text>

          <View style={styles.lineaInstitucion}>

            <View style={styles.lineaDorada} />

            <Text style={styles.nombreInstitucion}>
              Hogar El Buen Samaritano
            </Text>

            <View style={styles.lineaDorada} />

          </View>

          <Text style={styles.descripcionSistema}>
            Controla, organiza y gestiona el inventario de forma eficiente.
          </Text>

        </Animated.View>

        {/* =====================================================
            TARJETA DEL LOGIN
        ====================================================== */}

        <Animated.View
          entering={
            FadeInDown
              .delay(150)
              .duration(700)
          }
          style={styles.card}
        >

          <Text style={styles.bienvenida}>
            ¡Bienvenido!
          </Text>

          <Text style={styles.subtitulo}>
            Inicie sesión para continuar
          </Text>

          {/* Correo */}

          <Text style={styles.label}>
            ✉️  Correo electrónico
          </Text>

          <View style={styles.inputContainer}>

            <Text style={styles.iconoInput}>
              👤
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ingrese su correo electrónico"
              placeholderTextColor="#98A2B3"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              autoComplete="email"
              returnKeyType="next"
              value={correo}
              onChangeText={setCorreo}
              editable={!loading}
            />

          </View>

          {/* Contraseña */}

          <Text style={styles.label}>
            🔒  Contraseña
          </Text>

          <View style={styles.inputContainer}>

            <Text style={styles.iconoInput}>
              🔐
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ingrese su contraseña"
              placeholderTextColor="#98A2B3"
              secureTextEntry={!mostrarPassword}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              autoComplete="password"
              returnKeyType="done"
              value={password}
              onChangeText={setPassword}
              editable={!loading}
              onSubmitEditing={iniciarSesion}
            />

            <TouchableOpacity
              style={styles.botonOjo}
              onPress={
                cambiarVisibilidadPassword
              }
              disabled={loading}
              activeOpacity={0.7}
            >

              <Text style={styles.iconoOjo}>
                {
                  mostrarPassword
                    ? '🙈'
                    : '👁️'
                }
              </Text>

            </TouchableOpacity>

          </View>

          {/* Recuperación */}

          <TouchableOpacity
            style={styles.botonRecuperar}
            onPress={recuperarPassword}
            disabled={loading}
            activeOpacity={0.7}
          >

            <Text style={styles.textoRecuperar}>
              ¿Olvidó su contraseña?
            </Text>

          </TouchableOpacity>

          {/* Iniciar sesión */}

          <TouchableOpacity
            style={[
              styles.botonIngresar,

              loading &&
                styles.botonDeshabilitado,
            ]}
            onPress={iniciarSesion}
            disabled={loading}
            activeOpacity={0.85}
          >

            {loading ? (

              <View style={styles.contenidoCargando}>

                <ActivityIndicator
                  color="#FFFFFF"
                  size="small"
                />

                <Text style={styles.textoBoton}>
                  Ingresando...
                </Text>

              </View>

            ) : (

              <View style={styles.contenidoBoton}>

                <Text style={styles.iconoEntrar}>
                  ↪
                </Text>

                <Text style={styles.textoBoton}>
                  Iniciar Sesión
                </Text>

              </View>

            )}

          </TouchableOpacity>

          {/* Acceso seguro */}

          <View style={styles.tarjetaSeguridad}>

            <View style={styles.circuloSeguridad}>

              <Text style={styles.iconoSeguridad}>
                🛡️
              </Text>

            </View>

            <View style={styles.informacionSeguridad}>

              <Text style={styles.tituloSeguridad}>
                Acceso seguro
              </Text>

              <Text style={styles.descripcionSeguridad}>
                Solo los usuarios autorizados pueden acceder al sistema.
              </Text>

            </View>

          </View>

        </Animated.View>

        {/* =====================================================
            PIE INSTITUCIONAL
        ====================================================== */}

        <View style={styles.piePagina}>

          <Image
            source={logoHBS}
            style={styles.logo}
            accessibilityLabel={
              'Logo del Hogar El Buen Samaritano'
            }
          />

          <Text style={styles.textoPie}>
            Sistema de Inventario HBS
          </Text>

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
    backgroundColor: '#EAF3FF',
  },

  contenidoScroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 25,
  },

  /**
   * Encabezado.
   */
  encabezado: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 35,
    backgroundColor: '#F6FAFF',
    borderBottomLeftRadius: 55,
    borderBottomRightRadius: 55,
  },

  iconoInventario: {
    width: 130,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 4,
  },

  iconoLista: {
    fontSize: 70,
    position: 'absolute',
    left: 10,
    top: 0,
  },

  iconoCaja: {
    fontSize: 65,
    position: 'absolute',
    right: 0,
    bottom: 0,
  },

  tituloSistema: {
    color: '#063B78',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },

  lineaInstitucion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },

  lineaDorada: {
    width: 34,
    height: 3,
    backgroundColor: '#D5A84B',
    marginHorizontal: 9,
    borderRadius: 5,
  },

  nombreInstitucion: {
    color: '#D5A84B',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },

  descripcionSistema: {
    color: '#344054',
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 360,
    marginTop: 12,
  },

  /**
   * Tarjeta.
   */
  card: {
    width: '90%',
    maxWidth: 430,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 25,
    paddingVertical: 28,
    marginTop: -20,

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 8,
  },

  bienvenida: {
    color: '#063B78',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
  },

  subtitulo: {
    color: '#667085',
    fontSize: 17,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 25,
  },

  label: {
    color: '#0D3B66',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 10,
  },

  inputContainer: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CDD9E8',
    borderRadius: 14,
    paddingHorizontal: 13,
  },

  iconoInput: {
    fontSize: 21,
    marginRight: 9,
  },

  input: {
    flex: 1,
    minHeight: 55,
    color: '#1D2939',
    fontSize: 15,
    paddingVertical: 13,
  },

  botonOjo: {
    paddingVertical: 10,
    paddingLeft: 10,
  },

  iconoOjo: {
    fontSize: 21,
  },

  botonRecuperar: {
    alignSelf: 'flex-end',
    paddingVertical: 10,
    marginTop: 3,
  },

  textoRecuperar: {
    color: '#0070D9',
    fontSize: 14,
    fontWeight: '800',
  },

  botonIngresar: {
    minHeight: 56,
    backgroundColor: '#064F98',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,

    shadowColor: '#064F98',

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },

  botonDeshabilitado: {
    opacity: 0.65,
  },

  contenidoBoton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  contenidoCargando: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconoEntrar: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: 'bold',
    marginRight: 10,
  },

  textoBoton: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginLeft: 8,
  },

  tarjetaSeguridad: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F7FD',
    borderRadius: 17,
    padding: 15,
    marginTop: 22,
  },

  circuloSeguridad: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DDEEFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  iconoSeguridad: {
    fontSize: 27,
  },

  informacionSeguridad: {
    flex: 1,
  },

  tituloSeguridad: {
    color: '#063B78',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 3,
  },

  descripcionSeguridad: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
  },

  piePagina: {
    alignItems: 'center',
    marginTop: 20,
  },

  logo: {
    width: 115,
    height: 55,
    resizeMode: 'contain',
  },

  textoPie: {
    color: '#0D3B66',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
});