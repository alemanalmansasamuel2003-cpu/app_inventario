import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';

import api from '../services/api';

/**
 * ============================================================
 * INTERFAZ: MOVIMIENTO
 * ============================================================
 */
interface Movimiento {
  id_movimiento: number;
  id_producto?: number;
  id_usuario?: number | null;
  id_donacion?: number | null;

  /**
   * Puede venir desde la API como:
   * ENTRADA, Entrada, entrada,
   * SALIDA, Salida o salida.
   */
  tipo_movimiento: string;

  cantidad: number;

  fecha_movimiento:
    | string
    | null;

  motivo:
    | string
    | null;

  destinatario?:
    | string
    | null;

  observaciones?:
    | string
    | null;

  nombre_producto:
    | string
    | null;

  unidad_medida:
    | string
    | null;

  nombre_usuario?:
    | string
    | null;

  existencia_anterior?:
    | number
    | null;

  existencia_resultante?:
    | number
    | null;
}

/**
 * Cantidad de movimientos
 * mostrados por página.
 */
const MOVIMIENTOS_POR_PAGINA = 8;

/**
 * ============================================================
 * PANTALLA: HISTORIAL DE MOVIMIENTOS
 * ============================================================
 */
export default function Movimientos() {

  /**
   * ============================================================
   * PARÁMETROS DEL USUARIO
   * ============================================================
   */
  const parametros =
    useLocalSearchParams();

  /**
   * Normaliza parámetros recibidos
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
   * ESTADOS
   * ============================================================
   */
  const [
    movimientos,
    setMovimientos,
  ] = useState<Movimiento[]>([]);

  const [
    cargando,
    setCargando,
  ] = useState<boolean>(true);

  const [
    actualizando,
    setActualizando,
  ] = useState<boolean>(false);

  const [
    paginaActual,
    setPaginaActual,
  ] = useState<number>(1);

  const [
    pantallaCargada,
    setPantallaCargada,
  ] = useState<boolean>(false);

  /**
   * ============================================================
   * MOSTRAR MENSAJE
   * ============================================================
   */
  const mostrarMensaje = (
    titulo: string,
    mensaje: string
  ): void => {

    Alert.alert(
      titulo,
      mensaje
    );
  };

  /**
   * ============================================================
   * OBTENER MOVIMIENTOS
   * ============================================================
   */
  const obtenerMovimientos =
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
              '/movimientos'
            );

          const respuesta =
            response.data;

          let listaMovimientos:
            Movimiento[] = [];

          if (
            Array.isArray(
              respuesta?.data
            )
          ) {

            listaMovimientos =
              respuesta.data;

          } else if (
            Array.isArray(
              respuesta
            )
          ) {

            listaMovimientos =
              respuesta;
          }

          setMovimientos(
            listaMovimientos
          );

          setPaginaActual(1);
          setPantallaCargada(true);

        } catch (error: any) {

          console.error(
            'Error al obtener movimientos:',
            error?.response?.data ||
            error?.message ||
            error
          );

          mostrarMensaje(
            'Error',

            error?.response?.data
              ?.message ||

            error?.response?.data
              ?.mensaje ||

            error?.message ||

            'No se pudieron cargar los movimientos.'
          );

          setMovimientos([]);

        } finally {

          setCargando(false);
          setActualizando(false);
        }
      },
      []
    );

  /**
   * Actualiza los movimientos al entrar
   * o regresar a la pantalla.
   */
  useFocusEffect(
    useCallback(() => {

      obtenerMovimientos(
        pantallaCargada
      );

    }, [
      obtenerMovimientos,
      pantallaCargada,
    ])
  );

  /**
   * ============================================================
   * PAGINACIÓN
   * ============================================================
   */
  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        movimientos.length /
        MOVIMIENTOS_POR_PAGINA
      )
    );

  const movimientosPaginados =
    useMemo(() => {

      const inicio =
        (
          paginaActual - 1
        ) *
        MOVIMIENTOS_POR_PAGINA;

      return movimientos.slice(
        inicio,
        inicio +
        MOVIMIENTOS_POR_PAGINA
      );

    }, [
      movimientos,
      paginaActual,
    ]);

  /**
   * ============================================================
   * FORMATEAR FECHA
   * ============================================================
   */
  const formatearFecha = (
    fecha:
      | string
      | null
  ): string => {

    if (!fecha) {
      return 'Sin fecha';
    }

    const fechaConvertida =
      new Date(fecha);

    if (
      Number.isNaN(
        fechaConvertida.getTime()
      )
    ) {

      return fecha.substring(
        0,
        10
      );
    }

    return fechaConvertida
      .toLocaleString(
        'es-CR',
        {
          dateStyle:
            'medium',

          timeStyle:
            'short',
        }
      );
  };

  /**
   * ============================================================
   * FORMATEAR CANTIDAD
   * ============================================================
   */
  const formatearCantidad = (
    cantidad: number
  ): string => {

    const numero =
      Number(cantidad);

    if (
      !Number.isFinite(numero)
    ) {
      return '0';
    }

    return numero.toLocaleString(
      'es-CR'
    );
  };

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
   * ABRIR DETALLE DEL MOVIMIENTO
   * ============================================================
   */
  const abrirDetalleMovimiento = (
    idMovimiento: number
  ): void => {

    const id =
      Number(idMovimiento);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {

      mostrarMensaje(
        'Movimiento no disponible',
        'No se pudo identificar el movimiento seleccionado.'
      );

      return;
    }

    router.push({
      pathname:
        '/detalle-movimiento',

      params: {
        id:
          String(id),

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
   * CAMBIAR PÁGINA
   * ============================================================
   */
  const paginaAnterior =
    (): void => {

      setPaginaActual(
        (pagina) =>
          Math.max(
            pagina - 1,
            1
          )
      );
    };

  const paginaSiguiente =
    (): void => {

      setPaginaActual(
        (pagina) =>
          Math.min(
            pagina + 1,
            totalPaginas
          )
      );
    };

  /**
   * ============================================================
   * PANTALLA DE CARGA
   * ============================================================
   */
  if (
    cargando &&
    !pantallaCargada
  ) {

    return (
      <View style={styles.cargando}>

        <ActivityIndicator
          size="large"
          color="#0D6EFD"
        />

        <Text
          style={
            styles.textoCargando
          }
        >
          Cargando movimientos...
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

      <View style={styles.encabezado}>

        <Text
          style={
            styles.iconoTitulo
          }
        >
          🔄
        </Text>

        <Text style={styles.titulo}>
          Movimientos de Inventario
        </Text>

        <Text style={styles.subtitulo}>
          Historial de entradas y salidas
        </Text>

      </View>

      {/* Botón registrar movimiento */}

      <TouchableOpacity
        style={
          styles.botonRegistrar
        }
        onPress={
          abrirRegistrarMovimiento
        }
        activeOpacity={0.8}
      >
        <View
          style={
            styles.iconoRegistrar
          }
        >
          <Text
            style={
              styles.textoIconoRegistrar
            }
          >
            ➕
          </Text>
        </View>

        <View
          style={
            styles.contenidoRegistrar
          }
        >
          <Text
            style={
              styles.tituloRegistrar
            }
          >
            Registrar Movimiento
          </Text>

          <Text
            style={
              styles.descripcionRegistrar
            }
          >
            Registrar una entrada o salida del inventario
          </Text>
        </View>

        <Text style={styles.flecha}>
          ›
        </Text>
      </TouchableOpacity>

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
          {movimientos.length}
        </Text>

        <Text
          style={
            styles.textoResumen
          }
        >
          {
            movimientos.length === 1
              ? 'movimiento registrado'
              : 'movimientos registrados'
          }
        </Text>
      </View>

      {/* Lista */}

      <FlatList
        data={
          movimientosPaginados
        }

        keyExtractor={(item) =>
          String(
            item.id_movimiento
          )
        }

        showsVerticalScrollIndicator={
          false
        }

        contentContainerStyle={
          movimientos.length === 0
            ? styles.listaVacia
            : styles.contenidoLista
        }

        refreshControl={
          <RefreshControl
            refreshing={
              actualizando
            }
            onRefresh={() =>
              obtenerMovimientos(
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

          /**
           * Normaliza el tipo de movimiento para que
           * Entrada, ENTRADA o entrada sean equivalentes.
           */
          const tipoMovimientoNormalizado =
            String(
              item.tipo_movimiento || ''
            )
              .trim()
              .normalize('NFD')
              .replace(
                /[\u0300-\u036f]/g,
                ''
              )
              .toUpperCase();

          const esEntrada =
            tipoMovimientoNormalizado ===
            'ENTRADA';

          const esSalida =
            tipoMovimientoNormalizado ===
            'SALIDA';

          return (
            <TouchableOpacity
              style={[
                styles.tarjeta,

                esEntrada
                  ? styles
                      .tarjetaEntrada
                  : esSalida
                    ? styles
                        .tarjetaSalida
                    : styles
                        .tarjetaDesconocida,
              ]}
              onPress={() =>
                abrirDetalleMovimiento(
                  item.id_movimiento
                )
              }
              activeOpacity={0.8}
            >

              {/* Encabezado */}

              <View
                style={
                  styles
                    .encabezadoTarjeta
                }
              >
                <Text
                  style={[
                    styles.tipo,

                    esEntrada
                      ? styles
                          .textoEntrada
                      : esSalida
                        ? styles
                            .textoSalida
                        : styles
                            .textoDesconocido,
                  ]}
                >
                  {
                    esEntrada
                      ? '📥 ENTRADA'
                      : esSalida
                        ? '📤 SALIDA'
                        : `🔄 ${
                            item.tipo_movimiento ||
                            'MOVIMIENTO'
                          }`
                  }
                </Text>

                <View
                  style={[
                    styles.insignia,

                    esEntrada
                      ? styles
                          .insigniaEntrada
                      : esSalida
                        ? styles
                            .insigniaSalida
                        : styles
                            .insigniaDesconocida,
                  ]}
                >
                  <Text
                    style={[
                      styles
                        .textoInsignia,

                      esEntrada
                        ? styles
                            .textoEntrada
                        : esSalida
                          ? styles
                              .textoSalida
                          : styles
                              .textoDesconocido,
                    ]}
                  >
                    {
                      esEntrada
                        ? '+ STOCK'
                        : esSalida
                          ? '- STOCK'
                          : 'MOVIMIENTO'
                    }
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.separador
                }
              />

              {/* Producto */}

              <Text
                style={
                  styles.producto
                }
              >
                {
                  item.nombre_producto ||
                  'Producto no registrado'
                }
              </Text>

              {/* Cantidad */}

              <View style={styles.fila}>

                <Text
                  style={
                    styles.etiqueta
                  }
                >
                  Cantidad:
                </Text>

                <Text
                  style={
                    styles.valor
                  }
                >
                  {
                    formatearCantidad(
                      item.cantidad
                    )
                  }{' '}
                  {
                    item.unidad_medida ||
                    ''
                  }
                </Text>
              </View>

              {/* Motivo */}

              <View style={styles.fila}>

                <Text
                  style={
                    styles.etiqueta
                  }
                >
                  Motivo:
                </Text>

                <Text
                  style={
                    styles.valor
                  }
                >
                  {
                    item.motivo ||
                    'No registrado'
                  }
                </Text>
              </View>

              {/* Destinatario */}

              {
                !esEntrada &&
                item.destinatario
                  ? (
                    <View
                      style={
                        styles.fila
                      }
                    >
                      <Text
                        style={
                          styles.etiqueta
                        }
                      >
                        Destinatario:
                      </Text>

                      <Text
                        style={
                          styles.valor
                        }
                      >
                        {
                          item.destinatario
                        }
                      </Text>
                    </View>
                  )
                  : null
              }

              {/* Fecha */}

              <View style={styles.fila}>

                <Text
                  style={
                    styles.etiqueta
                  }
                >
                  Fecha:
                </Text>

                <Text
                  style={
                    styles.valor
                  }
                >
                  {
                    formatearFecha(
                      item
                        .fecha_movimiento
                    )
                  }
                </Text>
              </View>

              {/* Usuario */}

              {
                item.nombre_usuario
                  ? (
                    <View
                      style={
                        styles.fila
                      }
                    >
                      <Text
                        style={
                          styles.etiqueta
                        }
                      >
                        Usuario:
                      </Text>

                      <Text
                        style={
                          styles.valor
                        }
                      >
                        {
                          item.nombre_usuario
                        }
                      </Text>
                    </View>
                  )
                  : null
              }

              {/* Existencia anterior */}

              {
                item.existencia_anterior !==
                  null &&
                item.existencia_anterior !==
                  undefined
                  ? (
                    <View
                      style={
                        styles.fila
                      }
                    >
                      <Text
                        style={
                          styles.etiqueta
                        }
                      >
                        Existencia anterior:
                      </Text>

                      <Text
                        style={
                          styles.valor
                        }
                      >
                        {
                          formatearCantidad(
                            item
                              .existencia_anterior
                          )
                        }
                      </Text>
                    </View>
                  )
                  : null
              }

              {/* Existencia resultante */}

              {
                item.existencia_resultante !==
                  null &&
                item.existencia_resultante !==
                  undefined
                  ? (
                    <View
                      style={
                        styles.fila
                      }
                    >
                      <Text
                        style={
                          styles.etiqueta
                        }
                      >
                        Existencia resultante:
                      </Text>

                      <Text
                        style={
                          styles.valor
                        }
                      >
                        {
                          formatearCantidad(
                            item
                              .existencia_resultante
                          )
                        }
                      </Text>
                    </View>
                  )
                  : null
              }

              <Text
                style={
                  styles.verDetalle
                }
              >
                Ver detalle →
              </Text>

            </TouchableOpacity>
          );
        }}

        ListEmptyComponent={
          <View
            style={
              styles
                .contenedorSinDatos
            }
          >
            <Text
              style={
                styles.iconoSinDatos
              }
            >
              📭
            </Text>

            <Text
              style={
                styles.tituloSinDatos
              }
            >
              No hay movimientos
            </Text>

            <Text
              style={
                styles.sinDatos
              }
            >
              No existen entradas ni salidas registradas.
            </Text>

            <TouchableOpacity
              style={
                styles
                  .botonActualizar
              }
              onPress={() =>
                obtenerMovimientos(
                  true
                )
              }
              activeOpacity={0.8}
            >
              <Text
                style={
                  styles
                    .textoActualizar
                }
              >
                Actualizar
              </Text>
            </TouchableOpacity>
          </View>
        }

        ListFooterComponent={
          movimientos.length > 0
            ? (
              <View
                style={
                  styles.paginacion
                }
              >
                <Text
                  style={
                    styles.textoPagina
                  }
                >
                  Página {paginaActual} de {totalPaginas}
                </Text>

                <View
                  style={
                    styles.botonesPagina
                  }
                >
                  <TouchableOpacity
                    style={[
                      styles.botonPagina,

                      paginaActual === 1 &&
                        styles
                          .botonDeshabilitado,
                    ]}
                    disabled={
                      paginaActual === 1
                    }
                    onPress={
                      paginaAnterior
                    }
                    activeOpacity={0.8}
                  >
                    <Text
                      style={
                        styles
                          .textoBotonPagina
                      }
                    >
                      Anterior
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.botonPagina,

                      paginaActual ===
                        totalPaginas &&
                        styles
                          .botonDeshabilitado,
                    ]}
                    disabled={
                      paginaActual ===
                      totalPaginas
                    }
                    onPress={
                      paginaSiguiente
                    }
                    activeOpacity={0.8}
                  >
                    <Text
                      style={
                        styles
                          .textoBotonPagina
                      }
                    >
                      Siguiente
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
            : null
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

  cargando: {
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
    fontWeight: '700',
    fontSize: 16,
  },

  encabezado: {
    alignItems: 'center',
    marginBottom: 18,
  },

  iconoTitulo: {
    fontSize: 44,
    marginBottom: 5,
  },

  titulo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0D3B66',
    textAlign: 'center',
  },

  subtitulo: {
    color: '#667085',
    fontSize: 15,
    marginTop: 5,
    textAlign: 'center',
  },

  botonRegistrar: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 15,
    padding: 15,
    marginBottom: 16,

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
  },

  iconoRegistrar: {
    width: 46,
    height: 46,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5ED',
    marginRight: 13,
  },

  textoIconoRegistrar: {
    fontSize: 23,
  },

  contenidoRegistrar: {
    flex: 1,
  },

  tituloRegistrar: {
    color: '#0D3B66',
    fontSize: 17,
    fontWeight: '800',
  },

  descripcionRegistrar: {
    color: '#667085',
    fontSize: 13,
    marginTop: 3,
  },

  flecha: {
    color: '#98A2B3',
    fontSize: 31,
  },

  tarjetaResumen: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    backgroundColor: '#0D3B66',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 18,
    alignItems: 'center',
  },

  numeroResumen: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },

  textoResumen: {
    color: '#FFFFFF',
    fontSize: 15,
    marginTop: 2,
  },

  contenidoLista: {
    paddingBottom: 35,
  },

  listaVacia: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },

  tarjeta: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    padding: 17,
    borderRadius: 14,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E8EF',
    borderLeftWidth: 5,

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.08,
    shadowRadius: 7,
    elevation: 3,
  },

  tarjetaEntrada: {
    borderLeftColor: '#198754',
  },

  tarjetaSalida: {
    borderLeftColor: '#DC3545',
  },

  tarjetaDesconocida: {
    borderLeftColor: '#6C757D',
  },

  encabezadoTarjeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },

  tipo: {
    fontWeight: '800',
    fontSize: 17,
  },

  textoEntrada: {
    color: '#198754',
  },

  textoSalida: {
    color: '#DC3545',
  },

  textoDesconocido: {
    color: '#6C757D',
  },

  insignia: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },

  insigniaEntrada: {
    backgroundColor: '#DFF3E5',
  },

  insigniaSalida: {
    backgroundColor: '#FCE2E2',
  },

  insigniaDesconocida: {
    backgroundColor: '#E9ECEF',
  },

  textoInsignia: {
    fontWeight: '800',
    fontSize: 11,
  },

  separador: {
    height: 1,
    backgroundColor: '#E3E8EF',
    marginVertical: 13,
  },

  producto: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1D2939',
    marginBottom: 12,
  },

  fila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    flexWrap: 'wrap',
  },

  etiqueta: {
    color: '#344054',
    fontWeight: '700',
    fontSize: 15,
    marginRight: 5,
  },

  valor: {
    flex: 1,
    minWidth: 100,
    color: '#475467',
    fontSize: 15,
  },

  verDetalle: {
    color: '#0D6EFD',
    fontWeight: '800',
    marginTop: 12,
    fontSize: 15,
  },

  contenedorSinDatos: {
    alignItems: 'center',
    paddingHorizontal: 25,
  },

  iconoSinDatos: {
    fontSize: 55,
    marginBottom: 10,
  },

  tituloSinDatos: {
    fontSize: 22,
    fontWeight: '800',
    color: '#344054',
    marginBottom: 7,
  },

  sinDatos: {
    textAlign: 'center',
    fontSize: 16,
    color: '#667085',
    lineHeight: 22,
  },

  botonActualizar: {
    marginTop: 20,
    backgroundColor: '#0D6EFD',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },

  textoActualizar: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },

  paginacion: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    paddingVertical: 20,
  },

  textoPagina: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#344054',
    marginBottom: 12,
  },

  botonesPagina: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },

  botonPagina: {
    flex: 1,
    backgroundColor: '#0D6EFD',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
  },

  botonDeshabilitado: {
    backgroundColor: '#98A2B3',
    opacity: 0.6,
  },

  textoBotonPagina: {
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },
});