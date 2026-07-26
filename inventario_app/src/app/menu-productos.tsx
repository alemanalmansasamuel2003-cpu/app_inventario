import React from 'react';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

/**
 * ============================================================
 * MENÚ DE PRODUCTOS
 * ============================================================
 *
 * Funcionalidades:
 *
 * ✔ Agregar productos.
 * ✔ Ver todos los productos.
 * ✔ Buscar productos.
 * ✔ Conservar los datos del usuario.
 * ✔ Regresar al menú principal.
 *
 * ============================================================
 */
export default function MenuProductos() {

  /**
   * ============================================================
   * PARÁMETROS
   * ============================================================
   */
  const parametros = useLocalSearchParams();

  /**
   * ============================================================
   * NORMALIZAR PARÁMETROS
   * ============================================================
   */
  const obtenerTexto = (
    valor: string | string[] | undefined,
    defecto = ''
  ): string => {

    if (Array.isArray(valor)) {
      return valor[0] || defecto;
    }

    return valor || defecto;
  };

  /**
   * Usuario autenticado.
   */
  const id = obtenerTexto(parametros.id);

  const nombre = obtenerTexto(
    parametros.nombre,
    'Usuario'
  );

  const correo = obtenerTexto(
    parametros.correo
  );

  const rol = obtenerTexto(
    parametros.rol,
    'Usuario'
  );

  /**
   * ============================================================
   * AGREGAR PRODUCTO
   * ============================================================
   */
  const agregarProducto = () => {

    router.push({
      pathname:
        '/agregar-producto' as any,

      params: {
        id,
        nombre,
        correo,
        rol,
      },
    } as any);
  };

  /**
   * ============================================================
   * VER PRODUCTOS
   * ============================================================
   */
  const verProductos = () => {

    router.push({
      pathname:
        '/ver-productos' as any,

      params: {
        id,
        nombre,
        correo,
        rol,
      },
    } as any);
  };

  /**
   * ============================================================
   * BUSCAR PRODUCTOS
   * ============================================================
   */
  const buscarProducto = () => {

    router.push({
      pathname:
        '/buscar-producto' as any,

      params: {
        id,
        nombre,
        correo,
        rol,
      },
    } as any);
  };

  /**
   * ============================================================
   * REGRESAR
   * ============================================================
   */
  const regresar = () => {

    router.back();
  };

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>

        {/* Volver */}

        <TouchableOpacity
          style={styles.botonVolver}
          onPress={regresar}
        >
          <Text style={styles.textoVolver}>
            ← Volver
          </Text>
        </TouchableOpacity>

        {/* Encabezado */}

        <View style={styles.encabezado}>

          <Text style={styles.icono}>
            📦
          </Text>

          <Text style={styles.titulo}>
            Productos
          </Text>

          <Text style={styles.subtitulo}>
            Administración del inventario
          </Text>

          <Text style={styles.usuario}>
            {nombre}
          </Text>

          <Text style={styles.rol}>
            {rol}
          </Text>

        </View>

        <Text style={styles.separador}>
          ───── 💛 ─────
        </Text>

        {/* Agregar */}

        <TouchableOpacity
          style={styles.boton}
          onPress={agregarProducto}
        >

          <Text style={styles.iconoBoton}>
            ➕
          </Text>

          <View style={styles.info}>

            <Text style={styles.tituloBoton}>
              Agregar Producto
            </Text>

            <Text style={styles.descripcion}>
              Registrar un nuevo producto en el inventario.
            </Text>

          </View>

          <Text style={styles.flecha}>
            ›
          </Text>

        </TouchableOpacity>

        {/* Ver */}

        <TouchableOpacity
          style={styles.boton}
          onPress={verProductos}
        >

          <Text style={styles.iconoBoton}>
            📋
          </Text>

          <View style={styles.info}>

            <Text style={styles.tituloBoton}>
              Ver Productos
            </Text>

            <Text style={styles.descripcion}>
              Consultar todos los productos registrados.
            </Text>

          </View>

          <Text style={styles.flecha}>
            ›
          </Text>

        </TouchableOpacity>

        {/* Buscar */}

        <TouchableOpacity
          style={styles.boton}
          onPress={buscarProducto}
        >

          <Text style={styles.iconoBoton}>
            🔍
          </Text>

          <View style={styles.info}>

            <Text style={styles.tituloBoton}>
              Buscar Producto
            </Text>

            <Text style={styles.descripcion}>
              Buscar un producto por nombre o código.
            </Text>

          </View>

          <Text style={styles.flecha}>
            ›
          </Text>

        </TouchableOpacity>

        {/* Información */}

        <View style={styles.informacion}>

          <Text style={styles.tituloInfo}>
            Información
          </Text>

          <Text style={styles.textoInfo}>
            Desde este módulo podrá administrar
            completamente los productos del inventario,
            consultar existencias y realizar búsquedas.
          </Text>

        </View>

      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F5F1E8',
  },

  card: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },

  botonVolver: {
    alignSelf: 'flex-start',
    backgroundColor: '#0D6EFD',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginBottom: 20,
  },

  textoVolver: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },

  encabezado: {
    backgroundColor: '#0D3B66',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },

  icono: {
    fontSize: 50,
  },

  titulo: {
    fontSize: 30,
    color: '#FFF',
    fontWeight: '800',
    marginTop: 10,
  },

  subtitulo: {
    color: '#DCE6F0',
    marginTop: 8,
    fontSize: 15,
  },

  usuario: {
    marginTop: 15,
    color: '#FFF',
    fontWeight: '700',
  },

  rol: {
    color: '#DCE6F0',
    marginTop: 4,
  },

  separador: {
    textAlign: 'center',
    color: '#D4AF37',
    fontSize: 20,
    marginVertical: 20,
  },

  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E3E8EF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 15,
    backgroundColor: '#FFF',

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },

  iconoBoton: {
    fontSize: 28,
    width: 45,
  },

  info: {
    flex: 1,
  },

  tituloBoton: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D3B66',
  },

  descripcion: {
    marginTop: 5,
    color: '#667085',
    lineHeight: 18,
    fontSize: 13,
  },

  flecha: {
    fontSize: 32,
    color: '#98A2B3',
  },

  informacion: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E3E8EF',
    padding: 16,
  },

  tituloInfo: {
    fontSize: 16,
    fontWeight: '800',
    color: '#344054',
    marginBottom: 8,
  },

  textoInfo: {
    color: '#667085',
    lineHeight: 22,
    fontSize: 14,
  },

});