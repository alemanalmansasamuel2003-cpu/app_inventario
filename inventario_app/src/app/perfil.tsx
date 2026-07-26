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
 * PANTALLA: MI PERFIL
 * ============================================================
 *
 * Muestra la información del usuario que inició sesión.
 *
 * Funcionalidades:
 *
 * ✔ Mostrar nombre.
 * ✔ Mostrar correo.
 * ✔ Mostrar rol.
 * ✔ Editar el propio perfil.
 * ✔ Acceder a la administración de usuarios.
 * ✔ Agregar usuarios cuando el usuario es Administrador.
 * ✔ Manejar parámetros string, string[] o undefined.
 *
 * ============================================================
 */
export default function Perfil() {

  /**
   * ============================================================
   * DATOS RECIBIDOS POR EXPO ROUTER
   * ============================================================
   */
  const parametros =
    useLocalSearchParams();

  /**
   * ============================================================
   * NORMALIZAR PARÁMETROS
   * ============================================================
   *
   * Expo Router puede entregar los parámetros como:
   *
   * string
   * string[]
   * undefined
   */
  const obtenerTextoParametro = (
    valor: string | string[] | undefined,
    valorPredeterminado = ''
  ): string => {

    if (Array.isArray(valor)) {
      return valor[0] || valorPredeterminado;
    }

    return valor || valorPredeterminado;
  };

  /**
   * Datos normalizados del usuario.
   */
  const idUsuario =
    obtenerTextoParametro(
      parametros.id
    );

  const nombreUsuario =
    obtenerTextoParametro(
      parametros.nombre,
      'No disponible'
    );

  const correoUsuario =
    obtenerTextoParametro(
      parametros.correo,
      'No disponible'
    );

  const rolUsuario =
    obtenerTextoParametro(
      parametros.rol,
      'No disponible'
    );

  /**
   * Rol normalizado para realizar
   * comparaciones seguras.
   */
  const rolNormalizado =
    rolUsuario
      .trim()
      .toLowerCase();

  /**
   * Verifica si el usuario autenticado
   * es Administrador.
   */
  const esAdministrador =
    rolNormalizado ===
    'administrador';

  /**
   * ============================================================
   * EDITAR PERFIL
   * ============================================================
   */
  const editarPerfil = (): void => {

    router.push({
      pathname:
        '/editar-perfil' as any,

      params: {
        id: idUsuario,
        nombre: nombreUsuario,
        correo: correoUsuario,

        /**
         * Rol del usuario que será editado.
         */
        rol: rolUsuario,

        /**
         * Rol del usuario autenticado.
         */
        rolUsuario,
      },
    } as any);
  };

  /**
   * ============================================================
   * ADMINISTRAR USUARIOS
   * ============================================================
   */
  const administrarUsuarios =
    (): void => {

      router.push({
        pathname:
          '/usuarios' as any,

        params: {
          id: idUsuario,
          nombre: nombreUsuario,
          correo: correoUsuario,
          rol: rolUsuario,
        },
      } as any);
    };

  /**
   * ============================================================
   * AGREGAR USUARIO
   * ============================================================
   */
  const agregarUsuario =
    (): void => {

      router.push({
        pathname:
          '/agregar-usuario' as any,

        params: {
          id: idUsuario,
          nombre: nombreUsuario,
          correo: correoUsuario,
          rol: rolUsuario,
        },
      } as any);
    };

  /**
   * ============================================================
   * REGRESAR
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
      contentContainerStyle={
        styles.container
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      <View style={styles.contenido}>

        {/* Botón volver */}

        <TouchableOpacity
          style={
            styles.botonVolver
          }
          onPress={regresar}
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

        <View
          style={
            styles.encabezado
          }
        >
          <Text
            style={
              styles.iconoPerfil
            }
          >
            👤
          </Text>

          <Text style={styles.titulo}>
            Mi Perfil
          </Text>

          <Text
            style={
              styles.subtitulo
            }
          >
            Información de la cuenta
          </Text>
        </View>

        {/* Tarjeta del perfil */}

        <View style={styles.tarjeta}>

          {/* Nombre */}

          <View
            style={
              styles.filaInformacion
            }
          >
            <View
              style={
                styles.contenedorIcono
              }
            >
              <Text style={styles.iconoDato}>
                👤
              </Text>
            </View>

            <View style={styles.contenidoDato}>

              <Text style={styles.etiqueta}>
                Nombre
              </Text>

              <Text style={styles.valor}>
                {nombreUsuario}
              </Text>

            </View>
          </View>

          <View style={styles.separador} />

          {/* Correo */}

          <View
            style={
              styles.filaInformacion
            }
          >
            <View
              style={
                styles.contenedorIcono
              }
            >
              <Text style={styles.iconoDato}>
                ✉️
              </Text>
            </View>

            <View style={styles.contenidoDato}>

              <Text style={styles.etiqueta}>
                Correo electrónico
              </Text>

              <Text style={styles.valor}>
                {correoUsuario}
              </Text>

            </View>
          </View>

          <View style={styles.separador} />

          {/* Rol */}

          <View
            style={
              styles.filaInformacion
            }
          >
            <View
              style={
                styles.contenedorIcono
              }
            >
              <Text style={styles.iconoDato}>
                🔐
              </Text>
            </View>

            <View style={styles.contenidoDato}>

              <Text style={styles.etiqueta}>
                Rol
              </Text>

              <Text style={styles.valor}>
                {rolUsuario}
              </Text>

            </View>
          </View>

        </View>

        {/* Editar perfil */}

        <TouchableOpacity
          style={styles.boton}
          onPress={editarPerfil}
          activeOpacity={0.8}
        >
          <Text style={styles.iconoBoton}>
            ✏️
          </Text>

          <View
            style={
              styles.contenidoBoton
            }
          >
            <Text
              style={
                styles.textoBoton
              }
            >
              Editar Perfil
            </Text>

            <Text
              style={
                styles.descripcionBoton
              }
            >
              Modificar nombre, correo o contraseña
            </Text>
          </View>

          <Text style={styles.flecha}>
            ›
          </Text>
        </TouchableOpacity>

        {/* Opciones del administrador */}

        {
          esAdministrador
            ? (
              <>
                <Text
                  style={
                    styles.tituloAdministracion
                  }
                >
                  Administración
                </Text>

                {/* Administrar usuarios */}

                <TouchableOpacity
                  style={styles.boton}
                  onPress={
                    administrarUsuarios
                  }
                  activeOpacity={0.8}
                >
                  <Text
                    style={
                      styles.iconoBoton
                    }
                  >
                    👥
                  </Text>

                  <View
                    style={
                      styles.contenidoBoton
                    }
                  >
                    <Text
                      style={
                        styles.textoBoton
                      }
                    >
                      Administrar Usuarios
                    </Text>

                    <Text
                      style={
                        styles.descripcionBoton
                      }
                    >
                      Consultar, editar o eliminar usuarios
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.flecha
                    }
                  >
                    ›
                  </Text>
                </TouchableOpacity>

                {/* Agregar usuario */}

                <TouchableOpacity
                  style={styles.boton}
                  onPress={agregarUsuario}
                  activeOpacity={0.8}
                >
                  <Text
                    style={
                      styles.iconoBoton
                    }
                  >
                    ➕
                  </Text>

                  <View
                    style={
                      styles.contenidoBoton
                    }
                  >
                    <Text
                      style={
                        styles.textoBoton
                      }
                    >
                      Agregar Usuario
                    </Text>

                    <Text
                      style={
                        styles.descripcionBoton
                      }
                    >
                      Registrar una nueva cuenta
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.flecha
                    }
                  >
                    ›
                  </Text>
                </TouchableOpacity>
              </>
            )
            : null
        }

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
    backgroundColor: '#F5F1E8',
    padding: 20,
  },

  /**
   * Contenido central.
   */
  contenido: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
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
    marginTop: 10,
    marginBottom: 20,
  },

  /**
   * Texto del botón volver.
   */
  textoBotonVolver: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },

  /**
   * Encabezado.
   */
  encabezado: {
    backgroundColor: '#0D3B66',
    borderRadius: 22,
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },

  /**
   * Icono del perfil.
   */
  iconoPerfil: {
    fontSize: 48,
    marginBottom: 8,
  },

  /**
   * Título principal.
   */
  titulo: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    color: '#FFFFFF',
  },

  /**
   * Subtítulo.
   */
  subtitulo: {
    color: '#DCE6F0',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 6,
  },

  /**
   * Tarjeta del perfil.
   */
  tarjeta: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E3E8EF',
    marginBottom: 20,

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },

  /**
   * Fila de información.
   */
  filaInformacion: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /**
   * Contenedor del icono.
   */
  contenedorIcono: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EAF2FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  /**
   * Icono de cada dato.
   */
  iconoDato: {
    fontSize: 23,
  },

  /**
   * Contenido de cada dato.
   */
  contenidoDato: {
    flex: 1,
  },

  /**
   * Etiquetas.
   */
  etiqueta: {
    fontSize: 14,
    fontWeight: '700',
    color: '#667085',
    marginBottom: 4,
  },

  /**
   * Valores.
   */
  valor: {
    fontSize: 17,
    color: '#1D2939',
    fontWeight: '600',
  },

  /**
   * Separador.
   */
  separador: {
    height: 1,
    backgroundColor: '#E3E8EF',
    marginVertical: 17,
  },

  /**
   * Botones principales.
   */
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E8EF',
    borderRadius: 16,
    paddingVertical: 17,
    paddingHorizontal: 16,
    marginBottom: 14,

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  /**
   * Icono de cada botón.
   */
  iconoBoton: {
    width: 46,
    fontSize: 27,
  },

  /**
   * Contenido del botón.
   */
  contenidoBoton: {
    flex: 1,
    paddingRight: 8,
  },

  /**
   * Texto principal del botón.
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
    marginTop: 4,
  },

  /**
   * Flecha del botón.
   */
  flecha: {
    color: '#98A2B3',
    fontSize: 32,
  },

  /**
   * Título de administración.
   */
  tituloAdministracion: {
    color: '#344054',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 12,
  },
});