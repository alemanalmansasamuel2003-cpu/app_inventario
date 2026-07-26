import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import api from '../services/api';

/**
 * ============================================================
 * INTERFAZ: USUARIO
 * ============================================================
 *
 * Define la estructura de los usuarios
 * recibidos desde el backend.
 *
 * ============================================================
 */
interface Usuario {
  id_usuario: number;
  nombre: string;
  correo: string;
  rol: string;
}

/**
 * ============================================================
 * PANTALLA: ADMINISTRAR USUARIOS
 * ============================================================
 *
 * Funcionalidades:
 *
 * ✔ Consultar usuarios registrados.
 * ✔ Editar usuarios.
 * ✔ Eliminar usuarios.
 * ✔ Actualizar la lista deslizando hacia abajo.
 * ✔ Manejar carga y errores.
 * ✔ Mantener el rol del usuario autenticado.
 *
 * Permisos:
 *
 * Administrador:
 * - Puede editar usuarios.
 * - Puede eliminar usuarios.
 *
 * Encargado:
 * - Puede consultar usuarios.
 *
 * ============================================================
 */
export default function Usuarios() {

  /**
   * ============================================================
   * PARÁMETROS DEL USUARIO AUTENTICADO
   * ============================================================
   */
  const parametros =
    useLocalSearchParams();

  /**
   * Expo Router puede devolver parámetros como:
   *
   * string
   * string[]
   * undefined
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
  const idUsuarioAutenticado =
    obtenerParametro(
      parametros.id
    );

  const nombreUsuarioAutenticado =
    obtenerParametro(
      parametros.nombre
    );

  const correoUsuarioAutenticado =
    obtenerParametro(
      parametros.correo
    );

  const rolUsuarioAutenticado =
    obtenerParametro(
      parametros.rol
    );

  /**
   * Verifica si el usuario actual
   * tiene rol Administrador.
   */
  const esAdministrador =
    rolUsuarioAutenticado
      .trim()
      .toLowerCase() ===
    'administrador';

  /**
   * ============================================================
   * ESTADOS
   * ============================================================
   */

  /**
   * Lista de usuarios.
   */
  const [
    usuarios,
    setUsuarios,
  ] = useState<Usuario[]>([]);

  /**
   * Controla la carga inicial.
   */
  const [
    cargando,
    setCargando,
  ] = useState<boolean>(true);

  /**
   * Controla la actualización manual.
   */
  const [
    actualizando,
    setActualizando,
  ] = useState<boolean>(false);

  /**
   * Guarda el ID del usuario
   * que se está eliminando.
   */
  const [
    idEliminando,
    setIdEliminando,
  ] = useState<number | null>(null);

  /**
   * ============================================================
   * CONSULTAR USUARIOS
   * ============================================================
   *
   * GET /api/usuarios
   */
  const obtenerUsuarios =
    useCallback(
      async (
        esActualizacion = false
      ): Promise<void> => {

        try {

          if (esActualizacion) {

            setActualizando(true);

          } else {

            setCargando(true);
          }

          const response =
            await api.get(
              '/usuarios'
            );

          console.log(
            'Usuarios obtenidos:',
            response.data
          );

          /**
           * Permite recibir:
           *
           * {
           *   success: true,
           *   data: []
           * }
           *
           * o directamente:
           *
           * []
           */
          let listaUsuarios:
            Usuario[] = [];

          if (
            Array.isArray(
              response.data?.data
            )
          ) {

            listaUsuarios =
              response.data.data;

          } else if (
            Array.isArray(
              response.data
            )
          ) {

            listaUsuarios =
              response.data;
          }

          setUsuarios(
            listaUsuarios
          );

        } catch (error: any) {

          console.error(
            'Error al obtener usuarios:',
            error?.response?.data ||
            error?.message ||
            error
          );

          setUsuarios([]);

          Alert.alert(
            'Error',

            error?.response?.data
              ?.mensaje ||

            error?.response?.data
              ?.message ||

            error?.message ||

            'No fue posible cargar los usuarios.'
          );

        } finally {

          setCargando(false);
          setActualizando(false);
        }
      },
      []
    );

  /**
   * Consulta los usuarios al abrir
   * la pantalla.
   */
  useEffect(() => {

    obtenerUsuarios();

  }, [obtenerUsuarios]);

  /**
   * ============================================================
   * EDITAR USUARIO
   * ============================================================
   */
  const editarUsuario = (
    usuario: Usuario
  ): void => {

    if (
      !Number.isInteger(
        Number(
          usuario.id_usuario
        )
      ) ||
      Number(
        usuario.id_usuario
      ) <= 0
    ) {

      Alert.alert(
        'Error',
        'Usuario inválido.'
      );

      return;
    }

    if (!esAdministrador) {

      Alert.alert(
        'Acceso restringido',
        'Solo un Administrador puede editar otros usuarios.'
      );

      return;
    }

    router.push({
      pathname:
        '/editar-perfil',

      params: {
        /**
         * Usuario que se editará.
         */
        id:
          String(
            usuario.id_usuario
          ),

        nombre:
          usuario.nombre,

        correo:
          usuario.correo,

        rol:
          usuario.rol,

        /**
         * Rol del usuario autenticado.
         */
        rolUsuario:
          rolUsuarioAutenticado,

        /**
         * Datos del usuario autenticado
         * para conservar la navegación.
         */
        idUsuarioAutenticado,
        nombreUsuarioAutenticado,
        correoUsuarioAutenticado,
      },
    } as any);
  };

  /**
   * ============================================================
   * EJECUTAR ELIMINACIÓN
   * ============================================================
   */
  const ejecutarEliminacion =
    async (
      idUsuario: number
    ): Promise<void> => {

      try {

        setIdEliminando(
          idUsuario
        );

        console.log(
          'Eliminando usuario ID:',
          idUsuario
        );

        const response =
          await api.delete(
            `/usuarios/${idUsuario}`
          );

        /**
         * Actualiza inmediatamente
         * la lista local.
         */
        setUsuarios(
          (
            usuariosActuales
          ) =>
            usuariosActuales.filter(
              (usuario) =>
                usuario.id_usuario !==
                idUsuario
            )
        );

        Alert.alert(
          'Usuario eliminado',

          response.data?.mensaje ||
          response.data?.message ||
          'El usuario se eliminó correctamente.'
        );

      } catch (error: any) {

        console.error(
          'Error al eliminar usuario:',
          error?.response?.data ||
          error?.message ||
          error
        );

        Alert.alert(
          'Error',

          error?.response?.data
            ?.mensaje ||

          error?.response?.data
            ?.message ||

          error?.message ||

          'No fue posible eliminar el usuario.'
        );

      } finally {

        setIdEliminando(null);
      }
    };

  /**
   * ============================================================
   * ELIMINAR USUARIO
   * ============================================================
   *
   * DELETE /api/usuarios/:id
   */
  const eliminarUsuario = (
    usuario: Usuario
  ): void => {

    const idUsuario =
      Number(
        usuario.id_usuario
      );

    if (
      !Number.isInteger(
        idUsuario
      ) ||
      idUsuario <= 0
    ) {

      Alert.alert(
        'Error',
        'Usuario inválido.'
      );

      return;
    }

    if (!esAdministrador) {

      Alert.alert(
        'Acceso restringido',
        'Solo un Administrador puede eliminar usuarios.'
      );

      return;
    }

    /**
     * Impide que el Administrador
     * elimine su propia cuenta.
     */
    if (
      String(idUsuario) ===
      idUsuarioAutenticado
    ) {

      Alert.alert(
        'Operación no permitida',
        'No puede eliminar su propia cuenta mientras tiene la sesión iniciada.'
      );

      return;
    }

    Alert.alert(
      'Eliminar usuario',

      `¿Desea eliminar a ${usuario.nombre}?`,

      [
        {
          text:
            'Cancelar',

          style:
            'cancel',
        },

        {
          text:
            'Eliminar',

          style:
            'destructive',

          onPress: () => {

            ejecutarEliminacion(
              idUsuario
            );
          },
        },
      ]
    );
  };

  /**
   * ============================================================
   * PANTALLA DE CARGA
   * ============================================================
   */
  if (cargando) {

    return (
      <View
        style={
          styles.cargandoContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#0D6EFD"
        />

        <Text
          style={
            styles.textoCargando
          }
        >
          Cargando usuarios...
        </Text>
      </View>
    );
  }

  /**
   * ============================================================
   * INTERFAZ
   * ============================================================
   */
  return (
    <View style={styles.container}>

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

      <View
        style={
          styles.encabezado
        }
      >
        <Text
          style={
            styles.iconoTitulo
          }
        >
          👥
        </Text>

        <Text
          style={
            styles.titulo
          }
        >
          Administrar Usuarios
        </Text>

        <Text
          style={
            styles.subtitulo
          }
        >
          Consulte y administre las cuentas del sistema
        </Text>
      </View>

      {/* Resumen */}

      <View
        style={
          styles.tarjetaResumen
        }
      >
        <Text
          style={
            styles.numeroResumen
          }
        >
          {usuarios.length}
        </Text>

        <Text
          style={
            styles.textoResumen
          }
        >
          {
            usuarios.length === 1
              ? 'usuario registrado'
              : 'usuarios registrados'
          }
        </Text>
      </View>

      {/* Lista */}

      <FlatList
        data={usuarios}

        keyExtractor={(item) =>
          String(
            item.id_usuario
          )
        }

        showsVerticalScrollIndicator={
          false
        }

        contentContainerStyle={
          usuarios.length === 0
            ? styles.listaVacia
            : styles.contenidoLista
        }

        refreshControl={
          <RefreshControl
            refreshing={
              actualizando
            }
            onRefresh={() =>
              obtenerUsuarios(
                true
              )
            }
            colors={[
              '#0D6EFD',
            ]}
            tintColor="#0D6EFD"
          />
        }

        renderItem={({
          item,
        }) => {

          const eliminando =
            idEliminando ===
            item.id_usuario;

          const esCuentaActual =
            String(
              item.id_usuario
            ) ===
            idUsuarioAutenticado;

          return (
            <View
              style={
                styles.tarjeta
              }
            >
              {/* Encabezado de la tarjeta */}

              <View
                style={
                  styles.encabezadoTarjeta
                }
              >
                <View
                  style={
                    styles.avatar
                  }
                >
                  <Text
                    style={
                      styles.textoAvatar
                    }
                  >
                    {
                      item.nombre
                        ?.trim()
                        .charAt(0)
                        .toUpperCase() ||
                      'U'
                    }
                  </Text>
                </View>

                <View
                  style={
                    styles.contenidoUsuario
                  }
                >
                  <Text
                    style={
                      styles.nombre
                    }
                  >
                    {item.nombre}
                  </Text>

                  {
                    esCuentaActual
                      ? (
                        <Text
                          style={
                            styles.cuentaActual
                          }
                        >
                          Cuenta actual
                        </Text>
                      )
                      : null
                  }
                </View>

                <View
                  style={
                    styles.insigniaRol
                  }
                >
                  <Text
                    style={
                      styles.textoRol
                    }
                  >
                    {item.rol}
                  </Text>
                </View>
              </View>

              {/* Correo */}

              <View
                style={
                  styles.filaInformacion
                }
              >
                <Text
                  style={
                    styles.etiqueta
                  }
                >
                  Correo:
                </Text>

                <Text
                  style={
                    styles.informacion
                  }
                  numberOfLines={2}
                >
                  {item.correo}
                </Text>
              </View>

              {/* Botones de administrador */}

              {
                esAdministrador
                  ? (
                    <View
                      style={
                        styles.botones
                      }
                    >
                      <TouchableOpacity
                        style={
                          styles.botonEditar
                        }
                        onPress={() =>
                          editarUsuario(
                            item
                          )
                        }
                        disabled={
                          eliminando
                        }
                        activeOpacity={0.8}
                      >
                        <Text
                          style={
                            styles.textoBoton
                          }
                        >
                          ✏️ Editar
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.botonEliminar,

                          (
                            eliminando ||
                            esCuentaActual
                          ) &&
                            styles.botonDeshabilitado,
                        ]}
                        onPress={() =>
                          eliminarUsuario(
                            item
                          )
                        }
                        disabled={
                          eliminando ||
                          esCuentaActual
                        }
                        activeOpacity={0.8}
                      >
                        {
                          eliminando
                            ? (
                              <ActivityIndicator
                                color="#FFFFFF"
                                size="small"
                              />
                            )
                            : (
                              <Text
                                style={
                                  styles.textoBoton
                                }
                              >
                                🗑️ Eliminar
                              </Text>
                            )
                        }
                      </TouchableOpacity>
                    </View>
                  )
                  : (
                    <Text
                      style={
                        styles.mensajeConsulta
                      }
                    >
                      Permiso de solo consulta
                    </Text>
                  )
              }
            </View>
          );
        }}

        ListEmptyComponent={
          <View
            style={
              styles.contenedorSinDatos
            }
          >
            <Text
              style={
                styles.iconoSinDatos
              }
            >
              👤
            </Text>

            <Text
              style={
                styles.tituloSinDatos
              }
            >
              No hay usuarios
            </Text>

            <Text
              style={
                styles.sinDatos
              }
            >
              No existen usuarios registrados.
            </Text>

            <TouchableOpacity
              style={
                styles.botonActualizar
              }
              onPress={() =>
                obtenerUsuarios(
                  true
                )
              }
              activeOpacity={0.8}
            >
              <Text
                style={
                  styles.textoActualizar
                }
              >
                Actualizar
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
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
    backgroundColor: '#F4F7FB',
    paddingHorizontal: 16,
  },

  cargandoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F7FB',
  },

  textoCargando: {
    marginTop: 12,
    fontSize: 16,
    color: '#667085',
  },

  botonVolver: {
    alignSelf: 'flex-start',
    backgroundColor: '#0D6EFD',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 18,
  },

  textoBotonVolver: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  encabezado: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    backgroundColor: '#0D3B66',
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginBottom: 16,
  },

  iconoTitulo: {
    fontSize: 42,
    marginBottom: 7,
  },

  titulo: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
    textAlign: 'center',
  },

  subtitulo: {
    color: '#DCE6F0',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },

  tarjetaResumen: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    backgroundColor: '#0D6EFD',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginBottom: 17,
  },

  numeroResumen: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '800',
  },

  textoResumen: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 2,
  },

  contenidoLista: {
    paddingBottom: 35,
  },

  listaVacia: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 50,
  },

  tarjeta: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E8EF',
    borderRadius: 16,
    padding: 17,
    marginBottom: 14,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  encabezadoTarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EAF2FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  textoAvatar: {
    color: '#0D3B66',
    fontSize: 21,
    fontWeight: '800',
  },

  contenidoUsuario: {
    flex: 1,
  },

  nombre: {
    color: '#0D3B66',
    fontSize: 20,
    fontWeight: '800',
  },

  cuentaActual: {
    color: '#198754',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },

  insigniaRol: {
    backgroundColor: '#EAF2FA',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 8,
  },

  textoRol: {
    color: '#0D3B66',
    fontSize: 11,
    fontWeight: '800',
  },

  filaInformacion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },

  etiqueta: {
    color: '#344054',
    fontSize: 15,
    fontWeight: '700',
    marginRight: 5,
  },

  informacion: {
    flex: 1,
    color: '#667085',
    fontSize: 15,
  },

  botones: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 17,
  },

  botonEditar: {
    flex: 1,
    backgroundColor: '#0D6EFD',
    paddingVertical: 12,
    borderRadius: 10,
  },

  botonEliminar: {
    flex: 1,
    backgroundColor: '#DC3545',
    paddingVertical: 12,
    borderRadius: 10,
  },

  botonDeshabilitado: {
    backgroundColor: '#98A2B3',
    opacity: 0.6,
  },

  textoBoton: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
  },

  mensajeConsulta: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: '#F4F7FB',
    borderRadius: 9,
    paddingVertical: 9,
    marginTop: 15,
  },

  contenedorSinDatos: {
    alignItems: 'center',
    paddingHorizontal: 25,
  },

  iconoSinDatos: {
    fontSize: 54,
    marginBottom: 10,
  },

  tituloSinDatos: {
    color: '#344054',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },

  sinDatos: {
    color: '#667085',
    fontSize: 16,
    textAlign: 'center',
  },

  botonActualizar: {
    backgroundColor: '#0D6EFD',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
    marginTop: 19,
  },

  textoActualizar: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});