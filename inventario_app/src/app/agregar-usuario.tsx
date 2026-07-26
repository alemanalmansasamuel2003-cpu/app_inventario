import React, { useState } from 'react';

import { router } from 'expo-router';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator
} from 'react-native';

import {
  Picker
} from '@react-native-picker/picker';

import api from '../services/api';

/**
 * =====================================================
 * PANTALLA: AGREGAR USUARIO
 * =====================================================
 *
 * Permite registrar nuevos usuarios.
 *
 * Funcionalidades:
 *
 * ✔ Validar campos obligatorios.
 * ✔ Validar nombre.
 * ✔ Validar correo electrónico.
 * ✔ Validar contraseña.
 * ✔ Seleccionar rol.
 * ✔ Mostrar u ocultar contraseña.
 * ✔ Evitar múltiples envíos.
 * ✔ Limpiar formulario.
 *
 * =====================================================
 */
export default function AgregarUsuario() {

  /**
   * =====================================================
   * ESTADOS DEL FORMULARIO
   * =====================================================
   */
  const [nombre, setNombre] =
    useState('');

  const [correo, setCorreo] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [rol, setRol] =
    useState('');

  /**
   * Mostrar u ocultar contraseña.
   */
  const [
    mostrarPassword,
    setMostrarPassword
  ] = useState(false);

  /**
   * Indica si se está guardando
   * el usuario.
   */
  const [guardando, setGuardando] =
    useState(false);

  /**
   * =====================================================
   * MOSTRAR MENSAJES
   * =====================================================
   */
  const mostrarMensaje = (
    titulo: string,
    mensaje: string
  ) => {

    if (
      typeof window !== 'undefined'
    ) {

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
   * =====================================================
   * LIMPIAR FORMULARIO
   * =====================================================
   */
  const limpiarFormulario = () => {

    setNombre('');
    setCorreo('');
    setPassword('');
    setRol('');
    setMostrarPassword(false);
  };

  /**
   * =====================================================
   * GUARDAR USUARIO
   * =====================================================
   */
  const guardarUsuario = async () => {

    const nombreLimpio =
      nombre.trim();

    const correoLimpio =
      correo
        .trim()
        .toLowerCase();

    const passwordLimpia =
      password.trim();

    /**
     * Validar campos obligatorios.
     */
    if (
      !nombreLimpio ||
      !correoLimpio ||
      !passwordLimpia ||
      !rol
    ) {

      mostrarMensaje(
        'Campos incompletos',
        'Debe completar todos los campos.'
      );

      return;
    }

    /**
     * Validar nombre.
     */
    if (
      nombreLimpio.length < 3
    ) {

      mostrarMensaje(
        'Nombre inválido',
        'El nombre debe contener al menos 3 caracteres.'
      );

      return;
    }

    /**
     * Evitar nombres únicamente numéricos.
     */
    if (
      /^\d+$/.test(nombreLimpio)
    ) {

      mostrarMensaje(
        'Nombre inválido',
        'El nombre debe contener letras.'
      );

      return;
    }

    /**
     * Validar correo electrónico.
     */
    const expresionCorreo =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !expresionCorreo.test(
        correoLimpio
      )
    ) {

      mostrarMensaje(
        'Correo inválido',
        'Debe ingresar un correo electrónico válido.'
      );

      return;
    }

    /**
     * Validar contraseña.
     */
    if (
      passwordLimpia.length < 6
    ) {

      mostrarMensaje(
        'Contraseña inválida',
        'La contraseña debe contener al menos 6 caracteres.'
      );

      return;
    }

    /**
     * Validar roles permitidos.
     */
    const rolesPermitidos = [
      'Administrador',
      'Encargado'
    ];

    if (
      !rolesPermitidos.includes(rol)
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
       * Petición POST al backend.
       */
      const response =
        await api.post(
          '/auth/register',
          {
            nombre:
              nombreLimpio,

            correo:
              correoLimpio,

            password:
              passwordLimpia,

            rol
          }
        );

      mostrarMensaje(
        'Usuario registrado',
        response.data?.mensaje ||
        'Usuario registrado correctamente.'
      );

      limpiarFormulario();

    } catch (error: any) {

      console.log(
        'Error al registrar usuario:',
        error?.response?.data ||
        error?.message ||
        error
      );

      const mensaje =
        error?.response?.data?.mensaje ||
        error?.response?.data?.message ||
        'No fue posible registrar el usuario.';

      mostrarMensaje(
        'Error al registrar usuario',
        mensaje
      );

    } finally {

      setGuardando(false);
    }
  };

  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.contenido
      }
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >

      {/* Botón volver */}

      <TouchableOpacity
        style={styles.botonVolver}
        onPress={() =>
          router.back()
        }
        disabled={guardando}
      >

        <Text style={styles.textoVolver}>
          ⬅ Volver
        </Text>

      </TouchableOpacity>

      {/* Encabezado */}

      <View style={styles.encabezado}>

        <Text style={styles.titulo}>
          👤 Agregar Usuario
        </Text>

        <Text style={styles.subtitulo}>
          Registre un nuevo usuario en el sistema
        </Text>

      </View>

      {/* Nombre */}

      <Text style={styles.label}>
        Nombre completo *
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Ejemplo: Samuel Alemán"
        placeholderTextColor="#999999"
        value={nombre}
        onChangeText={setNombre}
        editable={!guardando}
        autoCapitalize="words"
        maxLength={150}
      />

      {/* Correo */}

      <Text style={styles.label}>
        Correo electrónico *
      </Text>

      <TextInput
        style={styles.input}
        placeholder="correo@ejemplo.com"
        placeholderTextColor="#999999"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={correo}
        onChangeText={setCorreo}
        editable={!guardando}
        maxLength={150}
      />

      {/* Contraseña */}

      <Text style={styles.label}>
        Contraseña *
      </Text>

      <View style={styles.passwordContainer}>

        <TextInput
          style={styles.passwordInput}
          placeholder="Mínimo 6 caracteres"
          placeholderTextColor="#999999"
          secureTextEntry={
            !mostrarPassword
          }
          value={password}
          onChangeText={setPassword}
          editable={!guardando}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={100}
        />

        <TouchableOpacity
          disabled={guardando}
          onPress={() =>
            setMostrarPassword(
              estadoAnterior =>
                !estadoAnterior
            )
          }
        >

          <Text style={styles.iconoPassword}>
            {
              mostrarPassword
                ? '🙈'
                : '👁️'
            }
          </Text>

        </TouchableOpacity>

      </View>

      {/* Rol */}

      <Text style={styles.label}>
        Rol *
      </Text>

      <View style={styles.pickerContainer}>

        <Picker
          selectedValue={rol}
          style={styles.picker}
          enabled={!guardando}
          onValueChange={(
            itemValue: string
          ) =>
            setRol(itemValue)
          }
        >

          <Picker.Item
            label="Seleccione un rol"
            value=""
          />

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

      <Text style={styles.ayudaRol}>
        El administrador puede gestionar usuarios. El encargado trabaja con el inventario.
      </Text>

      {/* Botón guardar */}

      <TouchableOpacity
        style={[
          styles.botonGuardar,

          guardando &&
          styles.botonDeshabilitado
        ]}
        onPress={
          guardarUsuario
        }
        disabled={guardando}
      >

        {guardando ? (

          <View style={styles.filaCargando}>

            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />

            <Text style={styles.textoBoton}>
              Guardando...
            </Text>

          </View>

        ) : (

          <Text style={styles.textoBoton}>
            💾 Guardar Usuario
          </Text>
        )}

      </TouchableOpacity>

    </ScrollView>
  );
}

/**
 * =====================================================
 * ESTILOS
 * =====================================================
 */
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F5F1E8'
  },

  contenido: {
    padding: 20,
    paddingBottom: 45
  },

  botonVolver: {
    alignSelf: 'flex-start',
    backgroundColor: '#0D3B66',
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 20
  },

  textoVolver: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  },

  encabezado: {
    backgroundColor: '#0D3B66',
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 18,
    marginBottom: 25
  },

  titulo: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center'
  },

  subtitulo: {
    color: '#DCE6F0',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8
  },

  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0D3B66',
    marginBottom: 8
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 16,
    fontSize: 16,
    color: '#222222'
  },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 16
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#222222'
  },

  iconoPassword: {
    fontSize: 24,
    paddingLeft: 10
  },

  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 12,
    marginBottom: 8,
    minHeight: 56,
    justifyContent: 'center',
    overflow: 'hidden'
  },

  picker: {
    width: '100%',
    height: 56,
    color: '#222222'
  },

  ayudaRol: {
    color: '#666666',
    fontSize: 13,
    marginBottom: 22
  },

  botonGuardar: {
    backgroundColor: '#198754',
    paddingVertical: 16,
    paddingHorizontal: 15,
    borderRadius: 12
  },

  botonDeshabilitado: {
    opacity: 0.65
  },

  filaCargando: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10
  },

  textoBoton: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold'
  }

});