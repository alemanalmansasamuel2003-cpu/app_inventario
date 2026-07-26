import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';

/**
 * =====================================================
 * MENÚ PRINCIPAL DEL SISTEMA DE INVENTARIO
 * =====================================================
 *
 * Funcionalidades:
 *
 * ✔ Mostrar bienvenida al usuario.
 * ✔ Acceder al módulo de productos.
 * ✔ Acceder al módulo de movimientos.
 * ✔ Acceder al módulo de donaciones.
 * ✔ Acceder al módulo de informes.
 * ✔ Acceder al perfil.
 * ✔ Cerrar sesión.
 *
 * =====================================================
 */

export default function Inventario() {

  /**
   * =====================================================
   * DATOS DEL USUARIO AUTENTICADO
   * =====================================================
   */
  const {
    id,
    nombre,
    correo,
    rol
  } = useLocalSearchParams();

  /**
   * Convierte los parámetros en texto seguro.
   */
  const idUsuario = String(id || '');
  const nombreUsuario = String(nombre || 'Usuario');
  const correoUsuario = String(correo || '');
  const rolUsuario = String(rol || '');

  /**
   * Parámetros que se enviarán a las demás pantallas.
   */
  const parametrosUsuario = {
    id: idUsuario,
    nombre: nombreUsuario,
    correo: correoUsuario,
    rol: rolUsuario
  };

  return (

    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >

      <View style={styles.card}>

        {/* Encabezado principal */}

        <View style={styles.encabezado}>

          <Text style={styles.tituloMenu}>
            📋 Menú Principal
          </Text>

          <Text style={styles.bienvenida}>
            Bienvenido {nombreUsuario}
          </Text>

          <Text style={styles.rol}>
            {rolUsuario || 'Usuario'}
          </Text>

        </View>

        {/* Separador decorativo */}

        <Text style={styles.separador}>
          ───── 💛 ─────
        </Text>

        {/* ==================================================
            MÓDULO DE PRODUCTOS
            ================================================== */}

        <TouchableOpacity
          style={styles.boton}
          activeOpacity={0.7}
          onPress={() =>
            router.push({
              pathname: '/menu-productos',
              params: parametrosUsuario
            })
          }
        >

          <Text style={styles.icono}>
            📦
          </Text>

          <View style={styles.contenidoBoton}>

            <Text
              style={styles.textoBoton}
              numberOfLines={1}
            >
              Productos
            </Text>

            <Text
              style={styles.descripcionBoton}
              numberOfLines={1}
            >
              Agregar, consultar y buscar productos
            </Text>

          </View>

          <Text style={styles.flecha}>
            ›
          </Text>

        </TouchableOpacity>

        {/* ==================================================
            MÓDULO DE MOVIMIENTOS
            ================================================== */}

        <TouchableOpacity
          style={styles.boton}
          activeOpacity={0.7}
          onPress={() =>
            router.push({
              pathname: '/menu-movimientos',
              params: parametrosUsuario
            })
          }
        >

          <Text style={styles.icono}>
            🔄
          </Text>

          <View style={styles.contenidoBoton}>

            <Text
              style={styles.textoBoton}
              numberOfLines={1}
            >
              Movimientos
            </Text>

            <Text
              style={styles.descripcionBoton}
              numberOfLines={1}
            >
              Entradas, salidas e historial
            </Text>

          </View>

          <Text style={styles.flecha}>
            ›
          </Text>

        </TouchableOpacity>

        {/* ==================================================
            MÓDULO DE DONACIONES
            ================================================== */}

        <TouchableOpacity
          style={styles.boton}
          activeOpacity={0.7}
          onPress={() =>
            router.push({
              pathname: '/menu-donaciones',
              params: parametrosUsuario
            })
          }
        >

          <Text style={styles.icono}>
            🤝
          </Text>

          <View style={styles.contenidoBoton}>

            <Text
              style={styles.textoBoton}
              numberOfLines={1}
            >
              Donaciones
            </Text>

            <Text
              style={styles.descripcionBoton}
              numberOfLines={1}
            >
              Donantes e historial de donaciones
            </Text>

          </View>

          <Text style={styles.flecha}>
            ›
          </Text>

        </TouchableOpacity>

        {/* ==================================================
            MÓDULO DE INFORMES
            ================================================== */}

        <TouchableOpacity
          style={styles.boton}
          activeOpacity={0.7}
          onPress={() =>
            router.push({
              pathname: '/reportes',
              params: parametrosUsuario
            })
          }
        >

          <Text style={styles.icono}>
            📊
          </Text>

          <View style={styles.contenidoBoton}>

            <Text
              style={styles.textoBoton}
              numberOfLines={1}
            >
              Informes
            </Text>

            <Text
              style={styles.descripcionBoton}
              numberOfLines={1}
            >
              Stock, vencimientos y estadísticas
            </Text>

          </View>

          <Text style={styles.flecha}>
            ›
          </Text>

        </TouchableOpacity>

        {/* ==================================================
            PERFIL DEL USUARIO
            ================================================== */}

        <TouchableOpacity
          style={styles.boton}
          activeOpacity={0.7}
          onPress={() =>
            router.push({
              pathname: '/perfil',
              params: parametrosUsuario
            })
          }
        >

          <Text style={styles.icono}>
            👤
          </Text>

          <View style={styles.contenidoBoton}>

            <Text
              style={styles.textoBoton}
              numberOfLines={1}
            >
              Perfil
            </Text>

            <Text
              style={styles.descripcionBoton}
              numberOfLines={1}
            >
              Consultar y editar información
            </Text>

          </View>

          <Text style={styles.flecha}>
            ›
          </Text>

        </TouchableOpacity>

        {/* ==================================================
            CERRAR SESIÓN
            ================================================== */}

        <TouchableOpacity
          style={styles.botonSalir}
          activeOpacity={0.7}
          onPress={() =>
            router.replace('/')
          }
        >

          <Text style={styles.textoSalir}>
            🚪 Cerrar Sesión
          </Text>

        </TouchableOpacity>

      </View>

    </ScrollView>

  );
}

/**
 * =====================================================
 * ESTILOS
 * =====================================================
 */

const styles = StyleSheet.create({

  /**
   * Contenedor principal.
   */
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F5F1E8'
  },

  /**
   * Tarjeta blanca principal.
   */
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 20,

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,
      height: 4
    },

    shadowOpacity: 0.12,
    shadowRadius: 8,

    elevation: 6
  },

  /**
   * Encabezado del menú.
   */
  encabezado: {
    backgroundColor: '#0D3B66',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 15,
    marginBottom: 18
  },

  /**
   * Título Menú Principal.
   */
  tituloMenu: {
    color: '#FFFFFF',
    fontSize: 24,
    textAlign: 'center',
    fontWeight: 'bold'
  },

  /**
   * Nombre del usuario.
   */
  bienvenida: {
    color: '#FFFFFF',
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 8
  },

  /**
   * Rol del usuario.
   */
  rol: {
    color: '#DCE6F0',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5
  },

  /**
   * Separador decorativo.
   */
  separador: {
    textAlign: 'center',
    color: '#D4AF37',
    fontSize: 20,
    marginBottom: 25
  },

  /**
   * Botones principales.
   */
  boton: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 18,

    paddingVertical: 18,
    paddingHorizontal: 16,

    marginBottom: 15,

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,
      height: 2
    },

    shadowOpacity: 0.05,
    shadowRadius: 4,

    elevation: 2
  },

  /**
   * Icono de cada módulo.
   */
  icono: {
    fontSize: 29,
    width: 48
  },

  /**
   * Contenedor del nombre y descripción.
   */
  contenidoBoton: {
    flex: 1,
    paddingRight: 5
  },

  /**
   * Nombre del módulo.
   */
  textoBoton: {
    fontSize: 18,
    color: '#0D3B66',
    fontWeight: 'bold'
  },

  /**
   * Descripción pequeña.
   */
  descripcionBoton: {
    fontSize: 12,
    color: '#777777',
    marginTop: 4
  },

  /**
   * Flecha derecha.
   */
  flecha: {
    fontSize: 32,
    color: '#999999',
    marginLeft: 5
  },

  /**
   * Botón para cerrar sesión.
   */
  botonSalir: {
    borderWidth: 1.5,
    borderColor: '#E74C3C',
    borderRadius: 18,
    paddingVertical: 18,
    marginTop: 8
  },

  /**
   * Texto de cerrar sesión.
   */
  textoSalir: {
    color: '#C0392B',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold'
  }

});