import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';

import {
  router,
  useLocalSearchParams
} from 'expo-router';

import api from '../services/api';

/**
 * ============================================================
 * INTERFAZ: PRODUCTO
 * ============================================================
 *
 * Representa la información de un producto recibida
 * desde la API.
 * ============================================================
 */
interface Producto {
  id_producto: number;
  nombre: string;
  descripcion?: string | null;
  cantidad: number;
  unidad_medida: string;
  stock_minimo: number;
  fecha_vencimiento?: string | null;
  nombre_categoria?: string | null;
}

/**
 * ============================================================
 * INTERFAZ: MOVIMIENTO
 * ============================================================
 *
 * Representa una entrada o salida relacionada
 * con el producto.
 * ============================================================
 */
interface Movimiento {
  id_movimiento: number;
  tipo_movimiento: string;
  cantidad: number;
  fecha_movimiento: string;
  motivo?: string | null;
  observaciones?: string | null;
  existencia_anterior?: number | null;
  existencia_resultante?: number | null;
  nombre_usuario?: string | null;
  nombre_donante?: string | null;
}

/**
 * ============================================================
 * NORMALIZAR TIPO DE MOVIMIENTO
 * ============================================================
 *
 * Convierte valores como:
 *
 * ENTRADA
 * Entrada
 * entrada
 * ENTRADA con espacios
 *
 * en un único formato seguro.
 */
const normalizarTipoMovimiento = (
  valor?: string | null
): string => {

  return String(valor || '')
    .trim()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .toUpperCase();
};

/**
 * ============================================================
 * PANTALLA: DETALLE DEL PRODUCTO
 * ============================================================
 *
 * Muestra:
 *
 * ✔ Información general del producto.
 * ✔ Estado actual del inventario.
 * ✔ Cantidad de entradas y salidas.
 * ✔ Historial de movimientos.
 * ✔ Usuario que registró el movimiento.
 * ✔ Información del donante cuando exista.
 * ✔ Actualización manual deslizando la pantalla.
 *
 * ============================================================
 */
export default function DetalleProducto() {

  /**
   * Obtiene el identificador enviado desde
   * la pantalla anterior.
   */
  const { id } =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  /**
   * Convierte el parámetro en un texto seguro.
   */
  const idProducto =
    Array.isArray(id)
      ? id[0]
      : id;

  /**
   * Información del producto seleccionado.
   */
  const [
    producto,
    setProducto
  ] = useState<Producto | null>(null);

  /**
   * Historial de movimientos del producto.
   */
  const [
    movimientos,
    setMovimientos
  ] = useState<Movimiento[]>([]);

  /**
   * Controla la carga inicial.
   */
  const [
    cargando,
    setCargando
  ] = useState(true);

  /**
   * Controla la actualización por deslizamiento.
   */
  const [
    actualizando,
    setActualizando
  ] = useState(false);

  /**
   * ============================================================
   * MOSTRAR MENSAJE
   * ============================================================
   */
  const mostrarMensaje = (
    titulo: string,
    mensaje: string
  ) => {

    if (typeof window !== 'undefined') {

      window.alert(
        `${titulo}\n\n${mensaje}`
      );

      return;
    }

    Alert.alert(
      titulo,
      mensaje
    );
  };

  /**
   * ============================================================
   * OBTENER DETALLE
   * ============================================================
   *
   * Consulta:
   *
   * GET /productos/:id
   * GET /movimientos/producto/:id
   *
   * ============================================================
   */
  const obtenerDetalle =
    useCallback(async (
      mostrarCarga = true
    ) => {

      if (!idProducto) {

        setProducto(null);
        setMovimientos([]);
        setCargando(false);
        setActualizando(false);

        return;
      }

      try {

        if (mostrarCarga) {

          setCargando(true);

        } else {

          setActualizando(true);
        }

        const [
          respuestaProducto,
          respuestaMovimientos
        ] = await Promise.all([

          api.get(
            `/productos/${idProducto}`
          ),

          api.get(
            `/movimientos/producto/${idProducto}`
          )
        ]);

        /**
         * Obtiene el producto desde la propiedad data.
         */
        const productoObtenido =
          respuestaProducto.data?.data ??
          respuestaProducto.data?.producto ??
          null;

        /**
         * Obtiene la lista de movimientos.
         */
        const listaMovimientos =
          respuestaMovimientos.data?.data ??
          respuestaMovimientos.data?.movimientos ??
          [];

        setProducto(
          productoObtenido
        );

        setMovimientos(
          Array.isArray(listaMovimientos)
            ? listaMovimientos
            : []
        );

      } catch (error: any) {

        console.log(
          'Error al obtener detalle del producto:',
          error?.response?.data ??
          error?.message ??
          error
        );

        const mensaje =
          error?.response?.data?.mensaje ??
          error?.response?.data?.message ??
          'No se pudo cargar el detalle del producto.';

        mostrarMensaje(
          'Error',
          mensaje
        );

        setProducto(null);
        setMovimientos([]);

      } finally {

        setCargando(false);
        setActualizando(false);
      }

    }, [idProducto]);

  /**
   * Consulta la información cuando se recibe
   * el identificador del producto.
   */
  useEffect(() => {

    obtenerDetalle(true);

  }, [obtenerDetalle]);

  /**
   * ============================================================
   * FORMATEAR FECHA
   * ============================================================
   */
  const formatearFecha = (
    fecha?: string | null
  ) => {

    if (!fecha) {

      return 'N/A';
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

    return fechaConvertida.toLocaleDateString(
      'es-CR',
      {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }
    );
  };

  /**
   * ============================================================
   * FORMATEAR FECHA Y HORA
   * ============================================================
   */
  const formatearFechaHora = (
    fecha?: string | null
  ) => {

    if (!fecha) {

      return 'No registrada';
    }

    const fechaConvertida =
      new Date(fecha);

    if (
      Number.isNaN(
        fechaConvertida.getTime()
      )
    ) {

      return fecha;
    }

    return fechaConvertida.toLocaleString(
      'es-CR',
      {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }
    );
  };

  /**
   * ============================================================
   * FORMATEAR CANTIDAD
   * ============================================================
   */
  const formatearCantidad = (
    valor?: number | null,
    unidad?: string
  ) => {

    if (
      valor === null ||
      valor === undefined
    ) {

      return 'No registrada';
    }

    return unidad
      ? `${valor} ${unidad}`
      : String(valor);
  };

  /**
   * ============================================================
   * RESUMEN DE MOVIMIENTOS
   * ============================================================
   */
  const resumenMovimientos =
    useMemo(() => {

      const entradas =
        movimientos.filter(
          (movimiento) =>
            normalizarTipoMovimiento(
              movimiento.tipo_movimiento
            ) === 'ENTRADA'
        );

      const salidas =
        movimientos.filter(
          (movimiento) =>
            normalizarTipoMovimiento(
              movimiento.tipo_movimiento
            ) === 'SALIDA'
        );

      const cantidadEntrada =
        entradas.reduce(
          (total, movimiento) =>
            total +
            Number(movimiento.cantidad || 0),
          0
        );

      const cantidadSalida =
        salidas.reduce(
          (total, movimiento) =>
            total +
            Number(movimiento.cantidad || 0),
          0
        );

      return {
        totalEntradas: entradas.length,
        totalSalidas: salidas.length,
        totalMovimientos: movimientos.length,
        cantidadEntrada,
        cantidadSalida
      };

    }, [movimientos]);

  /**
   * ============================================================
   * PANTALLA DE CARGA
   * ============================================================
   */
  if (cargando) {

    return (

      <View style={styles.cargando}>

        <ActivityIndicator
          size="large"
          color="#0D3B66"
        />

        <Text style={styles.textoCargando}>
          Cargando seguimiento...
        </Text>

      </View>
    );
  }

  /**
   * ============================================================
   * PRODUCTO NO ENCONTRADO
   * ============================================================
   */
  if (!producto) {

    return (

      <View style={styles.cargando}>

        <Text style={styles.iconoSinDatos}>
          📦
        </Text>

        <Text style={styles.sinDatos}>
          No se encontró el producto.
        </Text>

        <TouchableOpacity
          style={styles.botonVolver}
          onPress={() =>
            router.back()
          }
        >

          <Text style={styles.textoBoton}>
            ⬅ Volver
          </Text>

        </TouchableOpacity>

      </View>
    );
  }

  /**
   * Determina el estado del inventario.
   */
  const sinExistencias =
    producto.cantidad <= 0;

  const stockBajo =
    producto.cantidad > 0 &&
    producto.cantidad <=
    producto.stock_minimo;

  const estadoInventario =
    sinExistencias
      ? 'SIN EXISTENCIAS'
      : stockBajo
        ? 'STOCK BAJO'
        : 'DISPONIBLE';

  const estiloEstado =
    sinExistencias
      ? styles.estadoAgotado
      : stockBajo
        ? styles.estadoBajo
        : styles.estadoDisponible;

  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.contenido
      }
      showsVerticalScrollIndicator={false}
      refreshControl={

        <RefreshControl
          refreshing={actualizando}
          onRefresh={() =>
            obtenerDetalle(false)
          }
        />
      }
    >

      {/* Botón para regresar */}

      <TouchableOpacity
        style={styles.botonVolver}
        onPress={() =>
          router.back()
        }
      >

        <Text style={styles.textoBoton}>
          ⬅ Volver
        </Text>

      </TouchableOpacity>

      {/* Encabezado */}

      <View style={styles.encabezado}>

        <Text style={styles.titulo}>
          📦 Detalle del Producto
        </Text>

        <Text style={styles.descripcionEncabezado}>
          Información y seguimiento del inventario
        </Text>

      </View>

      {/* Información general */}

      <View style={styles.tarjetaProducto}>

        <View style={styles.filaNombre}>

          <Text style={styles.nombre}>
            {producto.nombre}
          </Text>

          <Text style={styles.identificador}>
            #{producto.id_producto}
          </Text>

        </View>

        <View
          style={[
            styles.estado,
            estiloEstado
          ]}
        >

          <Text style={styles.textoEstado}>
            {estadoInventario}
          </Text>

        </View>

        <Dato
          etiqueta="Descripción"
          valor={
            producto.descripcion ||
            'Sin descripción'
          }
        />

        <Dato
          etiqueta="Categoría"
          valor={
            producto.nombre_categoria ||
            'Sin categoría'
          }
        />

        <Dato
          etiqueta="Cantidad actual"
          valor={
            formatearCantidad(
              producto.cantidad,
              producto.unidad_medida
            )
          }
        />

        <Dato
          etiqueta="Stock mínimo"
          valor={
            formatearCantidad(
              producto.stock_minimo,
              producto.unidad_medida
            )
          }
        />

        <Dato
          etiqueta="Fecha de vencimiento"
          valor={
            formatearFecha(
              producto.fecha_vencimiento
            )
          }
        />

      </View>

      {/* Resumen */}

      <View style={styles.resumen}>

        <Text style={styles.subtitulo}>
          Resumen del inventario
        </Text>

        <View style={styles.filaResumen}>

          <CajaResumen
            numero={
              resumenMovimientos.totalEntradas
            }
            texto="Entradas"
          />

          <CajaResumen
            numero={
              resumenMovimientos.totalSalidas
            }
            texto="Salidas"
          />

          <CajaResumen
            numero={
              resumenMovimientos.totalMovimientos
            }
            texto="Movimientos"
          />

        </View>

        <View style={styles.balanceContainer}>

          <View style={styles.balanceItem}>

            <Text style={styles.balanceEtiqueta}>
              Total ingresado
            </Text>

            <Text style={styles.balanceEntrada}>
              +{
                resumenMovimientos.cantidadEntrada
              }{' '}
              {producto.unidad_medida}
            </Text>

          </View>

          <View style={styles.balanceItem}>

            <Text style={styles.balanceEtiqueta}>
              Total retirado
            </Text>

            <Text style={styles.balanceSalida}>
              -{
                resumenMovimientos.cantidadSalida
              }{' '}
              {producto.unidad_medida}
            </Text>

          </View>

        </View>

      </View>

      {/* Historial */}

      <Text style={styles.subtituloHistorial}>
        Historial de movimientos
      </Text>

      {movimientos.length === 0 ? (

        <View style={styles.contenedorSinMovimientos}>

          <Text style={styles.iconoSinMovimientos}>
            📋
          </Text>

          <Text style={styles.sinMovimientos}>
            Este producto no tiene movimientos registrados.
          </Text>

        </View>

      ) : (

        movimientos.map(
          (movimiento) => {

            const tipoMovimiento =
              normalizarTipoMovimiento(
                movimiento.tipo_movimiento
              );

            const esEntrada =
              tipoMovimiento ===
              'ENTRADA';

            const esSalida =
              tipoMovimiento ===
              'SALIDA';

            return (

              <TouchableOpacity
                key={
                  movimiento.id_movimiento
                }
                activeOpacity={0.8}
                style={[
                  styles.tarjetaMovimiento,

                  esEntrada
                    ? styles.movimientoEntrada
                    : esSalida
                      ? styles.movimientoSalida
                      : styles.movimientoDesconocido
                ]}
                onPress={() =>
                  router.push({
                    pathname:
                      '/detalle-movimiento',

                    params: {
                      id: String(
                        movimiento.id_movimiento
                      )
                    }
                  })
                }
              >

                <View style={styles.filaMovimiento}>

                  <Text
                    style={[
                      styles.tipoMovimiento,

                      esEntrada
                        ? styles.textoEntrada
                        : esSalida
                          ? styles.textoSalida
                          : styles.textoDesconocido
                    ]}
                  >
                    {
                      esEntrada
                        ? '📥 ENTRADA'
                        : esSalida
                          ? '📤 SALIDA'
                          : '🔄 MOVIMIENTO'
                    }
                  </Text>

                  <Text style={styles.numeroMovimiento}>
                    #{movimiento.id_movimiento}
                  </Text>

                </View>

                <Dato
                  etiqueta="Cantidad"
                  valor={
                    formatearCantidad(
                      movimiento.cantidad,
                      producto.unidad_medida
                    )
                  }
                />

                <Dato
                  etiqueta="Fecha"
                  valor={
                    formatearFechaHora(
                      movimiento.fecha_movimiento
                    )
                  }
                />

                <Dato
                  etiqueta="Motivo"
                  valor={
                    movimiento.motivo ||
                    'No registrado'
                  }
                />

                <Dato
                  etiqueta="Existencia anterior"
                  valor={
                    formatearCantidad(
                      movimiento.existencia_anterior,
                      producto.unidad_medida
                    )
                  }
                />

                <Dato
                  etiqueta="Existencia resultante"
                  valor={
                    formatearCantidad(
                      movimiento.existencia_resultante,
                      producto.unidad_medida
                    )
                  }
                />

                <Dato
                  etiqueta="Registrado por"
                  valor={
                    movimiento.nombre_usuario ||
                    'No registrado'
                  }
                />

                {movimiento.nombre_donante ? (

                  <Dato
                    etiqueta="Donante"
                    valor={
                      movimiento.nombre_donante
                    }
                  />

                ) : null}

                <Dato
                  etiqueta="Observaciones"
                  valor={
                    movimiento.observaciones ||
                    'Sin observaciones'
                  }
                />

                <Text style={styles.textoVerDetalle}>
                  Presione para ver el detalle
                </Text>

              </TouchableOpacity>
            );
          }
        )
      )}

      {/* Botón actualizar */}

      <TouchableOpacity
        style={styles.botonActualizar}
        onPress={() =>
          obtenerDetalle(false)
        }
        disabled={actualizando}
      >

        {
          actualizando ? (

            <ActivityIndicator
              color="#FFFFFF"
            />

          ) : (

            <Text style={styles.textoBoton}>
              🔄 Actualizar información
            </Text>
          )
        }

      </TouchableOpacity>

    </ScrollView>
  );
}

/**
 * ============================================================
 * COMPONENTE: DATO
 * ============================================================
 */
function Dato({
  etiqueta,
  valor
}: {
  etiqueta: string;
  valor: string;
}) {

  return (

    <View style={styles.filaDato}>

      <Text style={styles.etiqueta}>
        {etiqueta}:
      </Text>

      <Text style={styles.valor}>
        {valor}
      </Text>

    </View>
  );
}

/**
 * ============================================================
 * COMPONENTE: CAJA DE RESUMEN
 * ============================================================
 */
function CajaResumen({
  numero,
  texto
}: {
  numero: number;
  texto: string;
}) {

  return (

    <View style={styles.cajaResumen}>

      <Text style={styles.numeroResumen}>
        {numero}
      </Text>

      <Text style={styles.textoResumen}>
        {texto}
      </Text>

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
    backgroundColor: '#F5F1E8'
  },

  contenido: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 50
  },

  cargando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F1E8',
    padding: 20
  },

  textoCargando: {
    marginTop: 12,
    fontSize: 16,
    color: '#555555'
  },

  iconoSinDatos: {
    fontSize: 48,
    marginBottom: 12
  },

  sinDatos: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold'
  },

  botonVolver: {
    alignSelf: 'flex-start',
    backgroundColor: '#0D3B66',
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginBottom: 20
  },

  textoBoton: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  },

  encabezado: {
    backgroundColor: '#0D3B66',
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 18,
    marginBottom: 20
  },

  titulo: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center'
  },

  descripcionEncabezado: {
    color: '#DCE6F0',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8
  },

  tarjetaProducto: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E3E3E3',

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,
      height: 2
    },

    shadowOpacity: 0.08,
    shadowRadius: 4,

    elevation: 3
  },

  filaNombre: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 10
  },

  nombre: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0D3B66',
    marginBottom: 12
  },

  identificador: {
    color: '#777777',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5
  },

  estado: {
    alignSelf: 'flex-start',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 18
  },

  estadoDisponible: {
    backgroundColor: '#198754'
  },

  estadoBajo: {
    backgroundColor: '#D89C00'
  },

  estadoAgotado: {
    backgroundColor: '#DC3545'
  },

  textoEstado: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13
  },

  filaDato: {
    marginBottom: 12
  },

  etiqueta: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333333'
  },

  valor: {
    fontSize: 16,
    color: '#555555',
    marginTop: 4,
    lineHeight: 22
  },

  resumen: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 17,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#E3E3E3'
  },

  subtitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0D3B66',
    marginBottom: 15
  },

  filaResumen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8
  },

  cajaResumen: {
    flex: 1,
    backgroundColor: '#EEF4FA',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 5,
    alignItems: 'center'
  },

  numeroResumen: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0D3B66'
  },

  textoResumen: {
    fontSize: 12,
    color: '#555555',
    marginTop: 4,
    textAlign: 'center'
  },

  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 16
  },

  balanceItem: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
    padding: 12
  },

  balanceEtiqueta: {
    color: '#555555',
    fontSize: 13,
    marginBottom: 5
  },

  balanceEntrada: {
    color: '#198754',
    fontSize: 17,
    fontWeight: 'bold'
  },

  balanceSalida: {
    color: '#DC3545',
    fontSize: 17,
    fontWeight: 'bold'
  },

  subtituloHistorial: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0D3B66',
    marginTop: 26,
    marginBottom: 15
  },

  contenedorSinMovimientos: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E3E3E3'
  },

  iconoSinMovimientos: {
    fontSize: 42,
    marginBottom: 10
  },

  sinMovimientos: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 16
  },

  tarjetaMovimiento: {
    backgroundColor: '#FFFFFF',
    padding: 17,
    borderRadius: 14,
    borderLeftWidth: 6,
    marginBottom: 15,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#E3E3E3',
    borderRightColor: '#E3E3E3',
    borderBottomColor: '#E3E3E3',

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,
      height: 2
    },

    shadowOpacity: 0.06,
    shadowRadius: 3,

    elevation: 2
  },

  movimientoEntrada: {
    borderLeftColor: '#198754'
  },

  movimientoSalida: {
    borderLeftColor: '#DC3545'
  },

  movimientoDesconocido: {
    borderLeftColor: '#6C757D'
  },

  filaMovimiento: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },

  tipoMovimiento: {
    fontSize: 18,
    fontWeight: 'bold'
  },

  textoEntrada: {
    color: '#198754'
  },

  textoSalida: {
    color: '#DC3545'
  },

  textoDesconocido: {
    color: '#6C757D'
  },

  numeroMovimiento: {
    color: '#777777',
    fontSize: 13,
    fontWeight: 'bold'
  },

  textoVerDetalle: {
    color: '#6F42C1',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 5
  },

  botonActualizar: {
    backgroundColor: '#6F42C1',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginTop: 10,
    minHeight: 50,
    justifyContent: 'center'
  }

});