import React, { useState } from 'react';
import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { Picker } from '@react-native-picker/picker';

import api from '../services/api';

/**
 * =====================================================
 * PANTALLA: EDITAR PERFIL
 * =====================================================
 *
 * Funcionalidades:
 *
 * ✔ Editar nombre.
 * ✔ Editar correo.
 * ✔ Cambiar contraseña de forma opcional.
 * ✔ Mostrar u ocultar contraseña.
 * ✔ El administrador puede cambiar el rol.
 * ✔ El encargado solo puede visualizar su rol.
 * ✔ Validar los datos antes de enviarlos.
 * ✔ Evitar múltiples solicitudes.
 * ✔ Mostrar indicador de carga.
 *
 * =====================================================
 */

export default function EditarPerfil() {

  /**
   * =====================================================
   * PARÁMETROS RECIBIDOS
   * =====================================================
   */

  const parametros = useLocalSearchParams<{
    id?: string | string[];
    nombre?: string | string[];
    correo?: string | string[];
    rol?: string | string[];
    rolUsuario?: string | string[];
  }>();

  /**
   * Convierte un parámetro de Expo Router
   * en una cadena segura.
   */
  const obtenerParametro = (
    valor?: string | string[]
  ): string => {

    if (Array.isArray(valor)) {
      return valor[0] || '';
    }

    return valor || '';
  };

  const idUsuario =
    obtenerParametro(parametros.id);

  const nombreActual =
    obtenerParametro(parametros.nombre);

  const correoActual =
    obtenerParametro(parametros.correo);

  const rolActual =
    obtenerParametro(parametros.rol);

  const rolUsuarioActual =
    obtenerParametro(parametros.rolUsuario);

  /**
   * =====================================================
   * ESTADOS
   * =====================================================
   */

  const [
    nuevoNombre,
    setNuevoNombre,
  ] = useState(nombreActual);

  const [
    nuevoCorreo,
    setNuevoCorreo,
  ] = useState(correoActual);

  const [
    nuevoRol,
    setNuevoRol,
  ] = useState(
    rolActual || 'Encargado'
  );

  const [
    nuevoPassword,
    setNuevoPassword,
  ] = useState('');

  const [
    mostrarPassword,
    setMostrarPassword,
  ] = useState(false);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  /**
   * Determina si el usuario que inició sesión
   * tiene permisos de administrador.
   */
  const esAdministrador =
    rolUsuarioActual === 'Administrador';

  /**
   * =====================================================
   * MOSTRAR MENSAJES
   * =====================================================
   */

  const mostrarMensaje = (
    titulo: string,
    mensaje: string
  ) => {

    Alert.alert(
      titulo,
      mensaje
    );
  };

  /**
   * =====================================================
   * VALIDAR CORREO
   * =====================================================
   */

  const validarCorreo = (
    email: string
  ): boolean => {

    const expresion =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return expresion.test(email);
  };

  /**
   * =====================================================
   * GUARDAR CAMBIOS
   * =====================================================
   */

  const guardarCambios = async () => {

    if (guardando) {
      return;
    }

    const nombreLimpio =
      nuevoNombre.trim();

    const correoLimpio =
      nuevoCorreo
        .trim()
        .toLowerCase();

    const passwordLimpio =
      nuevoPassword.trim();

    /**
     * Validar identificador.
     */
    const idNumerico =
      Number(idUsuario);

    if (
      !idUsuario ||
      !Number.isInteger(idNumerico) ||
      idNumerico <= 0
    ) {

      mostrarMensaje(
        'Error',
        'No se recibió un identificador de usuario válido.'
      );

      return;
    }

    /**
     * Validar nombre.
     */
    if (!nombreLimpio) {

      mostrarMensaje(
        'Nombre obligatorio',
        'Debe ingresar el nombre completo.'
      );

      return;
    }

    if (nombreLimpio.length < 3) {

      mostrarMensaje(
        'Nombre inválido',
        'El nombre debe contener al menos 3 caracteres.'
      );

      return;
    }

    /**
     * Validar correo.
     */
    if (!correoLimpio) {

      mostrarMensaje(
        'Correo obligatorio',
        'Debe ingresar el correo electrónico.'
      );

      return;
    }

    if (!validarCorreo(correoLimpio)) {

      mostrarMensaje(
        'Correo inválido',
        'Ingrese un correo electrónico válido.'
      );

      return;
    }

    /**
     * La contraseña es opcional.
     * Solo se valida cuando el usuario escribió una.
     */
    if (
      passwordLimpio &&
      passwordLimpio.length < 6
    ) {

      mostrarMensaje(
        'Contraseña inválida',
        'La nueva contraseña debe contener al menos 6 caracteres.'
      );

      return;
    }

    /**
     * El administrador puede cambiar el rol.
     * El encargado conserva el rol original.
     */
    const rolGuardar =
      esAdministrador
        ? nuevoRol
        : rolActual;

    const rolesPermitidos = [
      'Administrador',
      'Encargado',
    ];

    if (
      !rolGuardar ||
      !rolesPermitidos.includes(
        rolGuardar
      )
    ) {

      mostrarMensaje(
        'Rol inválido',
        'Debe seleccionar un rol válido.'
      );

      return;
    }

    try {

      setGuardando(true);

      /**
       * Se construye el objeto sin contraseña.
       *
       * La contraseña solamente se agrega
       * cuando el usuario escribió una nueva.
       */
      const datosActualizar: {
        nombre: string;
        correo: string;
        rol: string;
        password?: string;
      } = {
        nombre: nombreLimpio,
        correo: correoLimpio,
        rol: rolGuardar,
      };

      if (passwordLimpio) {
        datosActualizar.password =
          passwordLimpio;
      }

      console.log(
        'Actualizando usuario:',
        {
          id: idNumerico,
          nombre:
            datosActualizar.nombre,
          correo:
            datosActualizar.correo,
          rol:
            datosActualizar.rol,
          cambiaPassword:
            Boolean(
              datosActualizar.password
            ),
        }
      );

      const response =
        await api.put(
          `/usuarios/${idNumerico}`,
          datosActualizar
        );

      mostrarMensaje(
        'Éxito',
        response.data?.mensaje ||
        response.data?.message ||
        'Perfil actualizado correctamente.'
      );

      router.back();

    } catch (error: any) {

      console.error(
        'Error al actualizar perfil:',
        error.response?.data ||
        error.message
      );

      mostrarMensaje(
        'Error',
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        'No fue posible actualizar el perfil.'
      );

    } finally {

      setGuardando(false);
    }
  };

  /**
   * =====================================================
   * INTERFAZ
   * =====================================================
   */

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={
          styles.contenido
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Botón volver */}

        <TouchableOpacity
          style={styles.botonVolver}
          onPress={() => router.back()}
          disabled={guardando}
          activeOpacity={0.8}
        >
          <Text
            style={
              styles.textoBotonVolver
            }
          >
            ← Volver
          </Text>
        </TouchableOpacity>

        {/* Encabezado */}

        <View style={styles.encabezado}>
          <Text style={styles.iconoPerfil}>
            👤
          </Text>

          <Text style={styles.titulo}>
            Editar Perfil
          </Text>

          <Text style={styles.subtitulo}>
            Actualice la información del usuario
          </Text>
        </View>

        {/* Formulario */}

        <View style={styles.tarjeta}>

          {/* Nombre */}

          <Text style={styles.label}>
            Nombre completo
          </Text>

          <TextInput
            style={styles.input}
            value={nuevoNombre}
            onChangeText={setNuevoNombre}
            placeholder="Ingrese el nombre completo"
            placeholderTextColor="#8A8A8A"
            autoCapitalize="words"
            editable={!guardando}
            maxLength={100}
          />

          {/* Correo */}

          <Text style={styles.label}>
            Correo electrónico
          </Text>

          <TextInput
            style={styles.input}
            value={nuevoCorreo}
            onChangeText={setNuevoCorreo}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Ingrese el correo electrónico"
            placeholderTextColor="#8A8A8A"
            editable={!guardando}
            maxLength={150}
          />

          {/* Contraseña */}

          <Text style={styles.label}>
            Nueva contraseña
          </Text>

          <View
            style={
              styles.passwordContainer
            }
          >
            <TextInput
              style={
                styles.passwordInput
              }
              placeholder="Déjela vacía para conservar la actual"
              placeholderTextColor="#8A8A8A"
              secureTextEntry={
                !mostrarPassword
              }
              value={nuevoPassword}
              onChangeText={
                setNuevoPassword
              }
              editable={!guardando}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={100}
            />

            <TouchableOpacity
              style={
                styles.botonMostrarPassword
              }
              onPress={() =>
                setMostrarPassword(
                  (valorActual) =>
                    !valorActual
                )
              }
              disabled={guardando}
              activeOpacity={0.7}
            >
              <Text style={styles.icono}>
                {
                  mostrarPassword
                    ? '🙈'
                    : '👁️'
                }
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.ayuda}>
            La contraseña es opcional y debe tener al menos 6 caracteres.
          </Text>

          {/* Rol */}

          <Text style={styles.label}>
            Rol
          </Text>

          {
            esAdministrador
              ? (
                <View
                  style={
                    styles.pickerContainer
                  }
                >
                  <Picker
                    selectedValue={
                      nuevoRol
                    }
                    onValueChange={(
                      valor
                    ) =>
                      setNuevoRol(
                        String(valor)
                      )
                    }
                    style={styles.picker}
                    enabled={!guardando}
                  >
                    <Picker.Item
                      label="Administrador"
                      value="Administrador"
                    />

                    <Picker.Item
                      label="Encargado"
                      value="Encargado"
                    />
                  </Picker>
                </View>
              )
              : (
                <View
                  style={
                    styles.rolContainer
                  }
                >
                  <Text
                    style={
                      styles.rolTexto
                    }
                  >
                    {
                      rolActual ||
                      'Sin rol asignado'
                    }
                  </Text>

                  <Text
                    style={
                      styles.rolAyuda
                    }
                  >
                    Solo un administrador puede modificar el rol.
                  </Text>
                </View>
              )
          }

          {/* Botón guardar */}

          <TouchableOpacity
            style={[
              styles.botonGuardar,
              guardando &&
                styles.botonDeshabilitado,
            ]}
            onPress={guardarCambios}
            disabled={guardando}
            activeOpacity={0.8}
          >
            {
              guardando
                ? (
                  <View
                    style={
                      styles.contenidoBoton
                    }
                  >
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />

                    <Text
                      style={
                        styles.textoBotonGuardar
                      }
                    >
                      Guardando...
                    </Text>
                  </View>
                )
                : (
                  <Text
                    style={
                      styles.textoBotonGuardar
                    }
                  >
                    Guardar cambios
                  </Text>
                )
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * =====================================================
 * ESTILOS
 * =====================================================
 */

const styles = StyleSheet.create({

  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },

  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },

  contenido: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 50,
  },

  botonVolver: {
    alignSelf: 'flex-start',
    backgroundColor: '#0D6EFD',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 20,
  },

  textoBotonVolver: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  encabezado: {
    alignItems: 'center',
    marginBottom: 25,
  },

  iconoPerfil: {
    fontSize: 50,
    marginBottom: 8,
  },

  titulo: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0D3B66',
    textAlign: 'center',
  },

  subtitulo: {
    marginTop: 6,
    fontSize: 15,
    color: '#667085',
    textAlign: 'center',
  },

  tarjeta: {
    width: '100%',
    maxWidth: 650,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E3E8EF',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D3B66',
    marginBottom: 8,
    marginTop: 10,
  },

  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#D9DEE7',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 16,
    color: '#1D2939',
    marginBottom: 14,
  },

  passwordContainer: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9DEE7',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    paddingLeft: 15,
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 16,
    color: '#1D2939',
  },

  botonMostrarPassword: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  icono: {
    fontSize: 22,
  },

  ayuda: {
    fontSize: 13,
    color: '#667085',
    marginTop: 7,
    marginBottom: 14,
  },

  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D9DEE7',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 25,
    overflow: 'hidden',
  },

  picker: {
    width: '100%',
    height: 55,
    color: '#1D2939',
  },

  rolContainer: {
    borderWidth: 1,
    borderColor: '#D9DEE7',
    borderRadius: 12,
    backgroundColor: '#F2F4F7',
    paddingVertical: 14,
    paddingHorizontal: 15,
    marginBottom: 25,
  },

  rolTexto: {
    fontSize: 16,
    color: '#344054',
    fontWeight: '700',
  },

  rolAyuda: {
    marginTop: 5,
    fontSize: 13,
    color: '#667085',
  },

  botonGuardar: {
    minHeight: 54,
    backgroundColor: '#0D6EFD',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 5,
  },

  botonDeshabilitado: {
    opacity: 0.65,
  },

  contenidoBoton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  textoBotonGuardar: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
  },
});