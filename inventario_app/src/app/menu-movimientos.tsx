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
 * PANTALLA: MENÚ DE MOVIMIENTOS
 * ============================================================
 *
 * Permite acceder a:
 *
 * ✔ Registrar una entrada o salida.
 * ✔ Consultar el historial de movimientos.
 *
 * ============================================================
 */
export default function MenuMovimientos() {

  /**
   * ============================================================
   * PARÁMETROS DEL USUARIO
   * ============================================================
   */
  const parametros =
    useLocalSearchParams();

  /**
   * Normaliza los parámetros recibidos
   * mediante Expo Router.
   */
  const obtenerParametro = (
    valor:
      | string
      | string[]
      | undefined
  ): string => {

    if (Array.isArray(valor)) {
      return valor[0] || '';
    }

    return valor || '';
  };

  /**
   * Datos del usuario autenticado.
   */
  const idUsuario =
    obtenerParametro(
      parametros.id
    );

  const nombreUsuario =
    obtenerParametro(
      parametros.nombre
    );

  const correoUsuario =
    obtenerParametro(
      parametros.correo
    );

  const rolUsuario =
    obtenerParametro(
      parametros.rol
    );

  /**
   * ============================================================
   * ABRIR REGISTRAR MOVIMIENTO
   * ============================================================
   */
  const abrirRegistrarMovimiento =
    (): void => {

      router.push({
        pathname:
          '/registrar-movimiento',

        params: {
          id:
            idUsuario,

          nombre:
            nombreUsuario,

          correo:
            correoUsuario,

          rol:
            rolUsuario,
        },
      } as any);
    };

  /**
   * ============================================================
   * ABRIR HISTORIAL
   * ============================================================
   */
  const abrirHistorial =
    (): void => {

      router.push({
        pathname:
          '/movimientos',

        params: {
          id:
            idUsuario,

          nombre:
            nombreUsuario,

          correo:
            correoUsuario,

          rol:
            rolUsuario,
        },
      } as any);
    };

  /**
   * ============================================================
   * INTERFAZ
   * ============================================================
   */
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.contenido
      }
      showsVerticalScrollIndicator={false}
    >

      {/* Contenedor principal */}

      <View style={styles.tarjetaPrincipal}>

        {/* Botón volver */}

        <TouchableOpacity
          style={
            styles.botonVolver
          }
          onPress={() =>
            router.back()
          }
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

          <Text
            style={
              styles.iconoEncabezado
            }
          >
            🔄
          </Text>

          <Text style={styles.titulo}>
            Movimientos
          </Text>

          <Text style={styles.subtitulo}>
            Control de entradas y salidas de productos.
          </Text>

          {
            nombreUsuario
              ? (
                <Text
                  style={
                    styles.usuario
                  }
                >
                  Usuario: {nombreUsuario}
                </Text>
              )
              : null
          }

          {
            rolUsuario
              ? (
                <Text
                  style={
                    styles.rol
                  }
                >
                  Rol: {rolUsuario}
                </Text>
              )
              : null
          }

        </View>

        {/* Separador */}

        <View style={styles.separador}>

          <View
            style={
              styles.lineaSeparador
            }
          />

          <Text
            style={
              styles.corazon
            }
          >
            💛
          </Text>

          <View
            style={
              styles.lineaSeparador
            }
          />

        </View>

        {/* Registrar movimiento */}

        <TouchableOpacity
          style={styles.opcion}
          onPress={
            abrirRegistrarMovimiento
          }
          activeOpacity={0.8}
        >

          <View
            style={[
              styles.iconoOpcion,
              styles.fondoMovimiento,
            ]}
          >
            <Text
              style={
                styles.textoIcono
              }
            >
              🔄
            </Text>
          </View>

          <View
            style={
              styles.contenidoOpcion
            }
          >
            <Text
              style={
                styles.tituloOpcion
              }
            >
              Registrar Movimiento
            </Text>

            <Text
              style={
                styles.descripcionOpcion
              }
            >
              Registrar una entrada o salida del inventario
            </Text>
          </View>

          <Text style={styles.flecha}>
            ›
          </Text>

        </TouchableOpacity>

        {/* Historial */}

        <TouchableOpacity
          style={styles.opcion}
          onPress={
            abrirHistorial
          }
          activeOpacity={0.8}
        >

          <View
            style={[
              styles.iconoOpcion,
              styles.fondoHistorial,
            ]}
          >
            <Text
              style={
                styles.textoIcono
              }
            >
              📋
            </Text>
          </View>

          <View
            style={
              styles.contenidoOpcion
            }
          >
            <Text
              style={
                styles.tituloOpcion
              }
            >
              Historial de Movimientos
            </Text>

            <Text
              style={
                styles.descripcionOpcion
              }
            >
              Consultar todas las entradas y salidas registradas
            </Text>
          </View>

          <Text style={styles.flecha}>
            ›
          </Text>

        </TouchableOpacity>

        {/* Información */}

        <View
          style={
            styles.tarjetaInformacion
          }
        >
          <Text
            style={
              styles.tituloInformacion
            }
          >
            Información
          </Text>

          <Text
            style={
              styles.textoInformacion
            }
          >
            Cada movimiento modifica automáticamente el inventario. Antes de registrar una salida, verifique que exista suficiente cantidad disponible.
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

  container: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },

  contenido: {
    flexGrow: 1,
    padding: 18,
  },

  tarjetaPrincipal: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 7,
    elevation: 4,
  },

  botonVolver: {
    alignSelf: 'flex-start',
    backgroundColor: '#0D6EFD',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginBottom: 15,
  },

  textoBotonVolver: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },

  encabezado: {
    backgroundColor: '#0D3B66',
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
  },

  iconoEncabezado: {
    fontSize: 42,
    marginBottom: 8,
  },

  titulo: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },

  subtitulo: {
    color: '#DCE6F0',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },

  usuario: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 14,
  },

  rol: {
    color: '#FFFFFF',
    fontSize: 13,
    marginTop: 4,
  },

  separador: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },

  lineaSeparador: {
    width: 60,
    height: 1,
    backgroundColor: '#E4A11B',
  },

  corazon: {
    fontSize: 18,
    marginHorizontal: 10,
  },

  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E8EF',
    borderRadius: 15,
    padding: 14,
    marginBottom: 14,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
  },

  iconoOpcion: {
    width: 45,
    height: 45,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  fondoMovimiento: {
    backgroundColor: '#E8F5ED',
  },

  fondoHistorial: {
    backgroundColor: '#EAF2FA',
  },

  textoIcono: {
    fontSize: 23,
  },

  contenidoOpcion: {
    flex: 1,
    paddingRight: 8,
  },

  tituloOpcion: {
    color: '#0D3B66',
    fontSize: 17,
    fontWeight: '800',
  },

  descripcionOpcion: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },

  flecha: {
    color: '#98A2B3',
    fontSize: 30,
  },

  tarjetaInformacion: {
    backgroundColor: '#F4F7FB',
    borderWidth: 1,
    borderColor: '#D9E2EC',
    borderRadius: 13,
    padding: 14,
    marginTop: 4,
  },

  tituloInformacion: {
    color: '#0D3B66',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },

  textoInformacion: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 19,
  },
});