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
 * MENÚ DE DONACIONES
 * ============================================================
 *
 * Funcionalidades:
 *
 * ✔ Abrir la administración de donantes.
 * ✔ Registrar una nueva donación.
 * ✔ Abrir el historial de donaciones.
 * ✔ Conservar los datos del usuario autenticado.
 * ✔ Regresar al menú principal.
 *
 * ============================================================
 */
export default function MenuDonaciones() {

  /**
   * ============================================================
   * OBTENER PARÁMETROS DEL USUARIO
   * ============================================================
   *
   * Estos parámetros fueron enviados desde
   * la pantalla inventario.tsx.
   */
  const parametros = useLocalSearchParams();

  /**
   * ============================================================
   * NORMALIZAR PARÁMETROS
   * ============================================================
   *
   * Expo Router puede devolver:
   *
   * string
   * string[]
   * undefined
   *
   * Esta función asegura que siempre se utilice un string.
   */
  const obtenerTextoParametro = (
    valor:
      | string
      | string[]
      | undefined,
    valorPredeterminado = ''
  ): string => {

    if (Array.isArray(valor)) {
      return valor[0] || valorPredeterminado;
    }

    return valor || valorPredeterminado;
  };

  /**
   * ============================================================
   * DATOS NORMALIZADOS DEL USUARIO
   * ============================================================
   */
  const idUsuario = obtenerTextoParametro(
    parametros.id
  );

  const nombreUsuario = obtenerTextoParametro(
    parametros.nombre,
    'Usuario'
  );

  const correoUsuario = obtenerTextoParametro(
    parametros.correo
  );

  const rolUsuario = obtenerTextoParametro(
    parametros.rol,
    'Usuario'
  );

  /**
   * ============================================================
   * PARÁMETROS COMUNES
   * ============================================================
   *
   * Estos datos se envían a las demás pantallas para conservar
   * la información del usuario autenticado.
   */
  const parametrosUsuario = {
    id: idUsuario,
    nombre: nombreUsuario,
    correo: correoUsuario,
    rol: rolUsuario,
  };

  /**
   * ============================================================
   * ABRIR PANTALLA DE DONANTES
   * ============================================================
   *
   * Permite registrar, consultar, editar y eliminar donantes.
   */
  const abrirDonantes = (): void => {

    router.push({
      pathname: '/donantes' as any,

      params: {
        ...parametrosUsuario,
      },
    } as any);
  };

  /**
   * ============================================================
   * ABRIR REGISTRO DE DONACIÓN
   * ============================================================
   *
   * Abre registrar-movimiento.tsx indicando:
   *
   * tipo: entrada
   * origen: donacion
   *
   * De esta forma, registrar-movimiento podrá mostrar:
   *
   * ✔ Selector de donante.
   * ✔ Selector de producto.
   * ✔ Cantidad donada.
   * ✔ Detalle de la donación.
   * ✔ Opción para crear un producto nuevo.
   */
  const abrirRegistrarDonacion = (): void => {

    router.push({
      pathname: '/registrar-movimiento' as any,

      params: {
        ...parametrosUsuario,

        /**
         * Indica que el inventario debe aumentar.
         */
        tipo: 'entrada',

        /**
         * Indica que el origen de la entrada
         * corresponde a una donación.
         */
        origen: 'donacion',
      },
    } as any);
  };

  /**
   * ============================================================
   * ABRIR HISTORIAL DE DONACIONES
   * ============================================================
   *
   * Permite consultar todos los productos recibidos mediante
   * donaciones y la información del donante.
   */
  const abrirHistorialDonaciones = (): void => {

    router.push({
      pathname: '/historial-donaciones' as any,

      params: {
        ...parametrosUsuario,
      },
    } as any);
  };

  /**
   * ============================================================
   * REGRESAR AL MENÚ PRINCIPAL
   * ============================================================
   */
  const regresar = (): void => {
    router.back();
  };

  /**
   * ============================================================
   * INTERFAZ
   * ============================================================
   */
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>

        {/* =====================================================
            BOTÓN VOLVER
        ====================================================== */}

        <TouchableOpacity
          style={styles.botonVolver}
          onPress={regresar}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Volver al menú anterior"
        >
          <Text style={styles.textoVolver}>
            ← Volver
          </Text>
        </TouchableOpacity>

        {/* =====================================================
            ENCABEZADO
        ====================================================== */}

        <View style={styles.encabezado}>

          <Text style={styles.iconoPrincipal}>
            🤝
          </Text>

          <Text style={styles.titulo}>
            Donaciones
          </Text>

          <Text style={styles.subtitulo}>
            Gestión de donantes y donaciones recibidas
          </Text>

          <Text style={styles.usuario}>
            Usuario: {nombreUsuario}
          </Text>

          <Text style={styles.rol}>
            Rol: {rolUsuario}
          </Text>

        </View>

        {/* =====================================================
            SEPARADOR DECORATIVO
        ====================================================== */}

        <Text style={styles.separador}>
          ───── 💛 ─────
        </Text>

        {/* =====================================================
            ADMINISTRACIÓN DE DONANTES
        ====================================================== */}

        <TouchableOpacity
          style={styles.boton}
          onPress={abrirDonantes}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Administrar donantes"
        >
          <View
            style={[
              styles.contenedorIcono,
              styles.iconoDonantes,
            ]}
          >
            <Text style={styles.icono}>
              👥
            </Text>
          </View>

          <View style={styles.contenidoBoton}>

            <Text style={styles.textoBoton}>
              Donantes
            </Text>

            <Text style={styles.descripcionBoton}>
              Registrar, consultar, editar y eliminar donantes
            </Text>

          </View>

          <Text style={styles.flecha}>
            ›
          </Text>
        </TouchableOpacity>

        {/* =====================================================
            REGISTRAR UNA NUEVA DONACIÓN
        ====================================================== */}

        <TouchableOpacity
          style={styles.boton}
          onPress={abrirRegistrarDonacion}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Registrar una nueva donación"
        >
          <View
            style={[
              styles.contenedorIcono,
              styles.iconoRegistrarDonacion,
            ]}
          >
            <Text style={styles.icono}>
              📥
            </Text>
          </View>

          <View style={styles.contenidoBoton}>

            <Text style={styles.textoBoton}>
              Registrar Donación
            </Text>

            <Text style={styles.descripcionBoton}>
              Registrar quién donó, qué producto donó y la cantidad recibida
            </Text>

          </View>

          <Text style={styles.flecha}>
            ›
          </Text>
        </TouchableOpacity>

        {/* =====================================================
            HISTORIAL DE DONACIONES
        ====================================================== */}

        <TouchableOpacity
          style={styles.boton}
          onPress={abrirHistorialDonaciones}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Consultar historial de donaciones"
        >
          <View
            style={[
              styles.contenedorIcono,
              styles.iconoHistorial,
            ]}
          >
            <Text style={styles.icono}>
              🎁
            </Text>
          </View>

          <View style={styles.contenidoBoton}>

            <Text style={styles.textoBoton}>
              Historial de Donaciones
            </Text>

            <Text style={styles.descripcionBoton}>
              Consultar las donaciones registradas en el sistema
            </Text>

          </View>

          <Text style={styles.flecha}>
            ›
          </Text>
        </TouchableOpacity>

        {/* =====================================================
            INFORMACIÓN ADICIONAL
        ====================================================== */}

        <View style={styles.tarjetaInformacion}>

          <Text style={styles.tituloInformacion}>
            Información
          </Text>

          <Text style={styles.textoInformacion}>
            Desde este módulo puede administrar los datos de los
            donantes, registrar los productos recibidos, actualizar
            automáticamente el inventario y consultar el historial
            de donaciones.
          </Text>

        </View>

      </View>
    </ScrollView>
  );
}

/**
 * ============================================================
 * ESTILOS
 * ============================================================
 */
const styles = StyleSheet.create({

  /**
   * Contenedor principal.
   */
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: '#F5F1E8',
    padding: 20,
  },

  /**
   * Tarjeta principal.
   */
  card: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },

  /**
   * Botón volver.
   */
  botonVolver: {
    alignSelf: 'flex-start',
    backgroundColor: '#0D6EFD',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginBottom: 18,
  },

  /**
   * Texto del botón volver.
   */
  textoVolver: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  /**
   * Encabezado.
   */
  encabezado: {
    backgroundColor: '#198754',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
  },

  /**
   * Icono principal.
   */
  iconoPrincipal: {
    fontSize: 48,
    marginBottom: 8,
  },

  /**
   * Título principal.
   */
  titulo: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },

  /**
   * Subtítulo.
   */
  subtitulo: {
    color: '#E7F7ED',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 7,
    lineHeight: 21,
  },

  /**
   * Nombre del usuario.
   */
  usuario: {
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
  },

  /**
   * Rol del usuario.
   */
  rol: {
    color: '#E7F7ED',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },

  /**
   * Separador decorativo.
   */
  separador: {
    textAlign: 'center',
    color: '#D4AF37',
    fontSize: 20,
    marginVertical: 22,
  },

  /**
   * Botón de cada opción.
   */
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E8EF',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 15,
    marginBottom: 16,

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },

  /**
   * Contenedor general de los iconos.
   */
  contenedorIcono: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  /**
   * Fondo del icono de donantes.
   */
  iconoDonantes: {
    backgroundColor: '#DFF3E5',
  },

  /**
   * Fondo del icono para registrar donación.
   */
  iconoRegistrarDonacion: {
    backgroundColor: '#FFF3CD',
  },

  /**
   * Fondo del icono del historial.
   */
  iconoHistorial: {
    backgroundColor: '#E8E5FF',
  },

  /**
   * Icono del botón.
   */
  icono: {
    fontSize: 27,
  },

  /**
   * Contenedor del texto.
   */
  contenidoBoton: {
    flex: 1,
    paddingRight: 8,
  },

  /**
   * Título del botón.
   */
  textoBoton: {
    color: '#0D3B66',
    fontSize: 18,
    fontWeight: '800',
  },

  /**
   * Descripción del botón.
   */
  descripcionBoton: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
  },

  /**
   * Flecha derecha.
   */
  flecha: {
    color: '#98A2B3',
    fontSize: 32,
    marginLeft: 4,
  },

  /**
   * Tarjeta informativa.
   */
  tarjetaInformacion: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E3E8EF',
    padding: 16,
    marginTop: 6,
  },

  /**
   * Título informativo.
   */
  tituloInformacion: {
    color: '#344054',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },

  /**
   * Texto informativo.
   */
  textoInformacion: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 21,
  },
});