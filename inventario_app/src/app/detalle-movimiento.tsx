import React, {
  useEffect,
  useState
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';

import {
  router,
  useLocalSearchParams
} from 'expo-router';

import api from '../services/api';

/**
 * ============================================================
 * INTERFAZ: MOVIMIENTO
 * ============================================================
 */
interface Movimiento {
  id_movimiento: number;

  /**
   * La API puede devolver:
   * ENTRADA, Entrada, entrada,
   * SALIDA, Salida o salida.
   */
  tipo_movimiento: string;

  cantidad: number;
  fecha_movimiento: string;
  motivo: string;
  observaciones?: string | null;
  nombre_producto: string;
  unidad_medida: string;
  nombre_usuario?: string | null;
  nombre_donante?: string | null;
  telefono_donante?: string | null;
  correo_donante?: string | null;
  existencia_anterior?: number | null;
  existencia_resultante?: number | null;
}

/**
 * ============================================================
 * PANTALLA: DETALLE DEL MOVIMIENTO
 * ============================================================
 */
export default function DetalleMovimiento() {

  const { id } =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const idMovimiento =
    Array.isArray(id)
      ? id[0]
      : id;

  const [
    movimiento,
    setMovimiento
  ] = useState<Movimiento | null>(null);

  const [
    cargando,
    setCargando
  ] = useState(true);

  /**
   * ============================================================
   * MOSTRAR MENSAJES
   * ============================================================
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
   * ============================================================
   * OBTENER DETALLE DEL MOVIMIENTO
   * ============================================================
   */
  const obtenerDetalle = async () => {

    if (!idMovimiento) {
      return;
    }

    try {

      setCargando(true);

      const response =
        await api.get(
          `/movimientos/${idMovimiento}`
        );

      /**
       * La API puede devolver:
       *
       * response.data.data
       * response.data.movimiento
       * response.data
       */
      const detalle =
        response.data?.data ||
        response.data?.movimiento ||
        response.data ||
        null;

      setMovimiento(detalle);

    } catch (error: any) {

      console.log(
        'Error al obtener detalle del movimiento:',
        error?.response?.data ||
        error?.message ||
        error
      );

      const mensaje =
        error?.response?.data?.mensaje ||
        error?.response?.data?.message ||
        'No se pudo cargar el movimiento.';

      mostrarMensaje(
        'Error',
        mensaje
      );

      setMovimiento(null);

    } finally {

      setCargando(false);
    }
  };

  /**
   * ============================================================
   * CARGAR DETALLE
   * ============================================================
   */
  useEffect(() => {

    if (idMovimiento) {

      obtenerDetalle();

    } else {

      setCargando(false);

      mostrarMensaje(
        'Error',
        'No se recibió el identificador del movimiento.'
      );
    }

  }, [idMovimiento]);

  /**
   * ============================================================
   * FORMATEAR FECHA
   * ============================================================
   */
  const formatearFecha = (
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
      'es-CR'
    );
  };

  /**
   * ============================================================
   * FORMATEAR NÚMERO
   * ============================================================
   */
  const formatearNumero = (
    valor?: number | null
  ) => {

    return valor !== null &&
      valor !== undefined
      ? String(valor)
      : 'No registrado';
  };

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
          Cargando detalle...
        </Text>

      </View>
    );
  }

  /**
   * ============================================================
   * MOVIMIENTO NO ENCONTRADO
   * ============================================================
   */
  if (!movimiento) {

    return (

      <View style={styles.cargando}>

        <Text style={styles.iconoSinDatos}>
          📋
        </Text>

        <Text style={styles.sinDatos}>
          No se encontró el movimiento.
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
   * ============================================================
   * NORMALIZAR TIPO DE MOVIMIENTO
   * ============================================================
   *
   * Convierte Entrada, ENTRADA o entrada
   * al mismo formato antes de comparar.
   */
  const tipoMovimientoNormalizado =
    String(
      movimiento.tipo_movimiento || ''
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

  /**
   * Si la API devuelve un valor desconocido,
   * se muestra el texto recibido.
   */
  const textoTipoMovimiento =
    esEntrada
      ? '📥 ENTRADA'
      : esSalida
        ? '📤 SALIDA'
        : `🔄 ${
            movimiento.tipo_movimiento ||
            'MOVIMIENTO'
          }`;

  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.contenido
      }
      showsVerticalScrollIndicator={false}
    >

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

      <View style={styles.encabezado}>

        <Text style={styles.titulo}>
          🔄 Detalle del Movimiento
        </Text>

        <Text style={styles.subtituloEncabezado}>
          Información completa de la operación
        </Text>

      </View>

      <View
        style={[
          styles.tarjeta,

          esEntrada
            ? styles.entrada
            : esSalida
              ? styles.salida
              : styles.movimientoDesconocido
        ]}
      >

        <View style={styles.filaSuperior}>

          <Text
            style={[
              styles.tipo,

              esEntrada
                ? styles.textoEntrada
                : esSalida
                  ? styles.textoSalida
                  : styles.textoMovimientoDesconocido
            ]}
          >
            {textoTipoMovimiento}
          </Text>

          <Text style={styles.numeroMovimiento}>
            #{movimiento.id_movimiento}
          </Text>

        </View>

        <Text style={styles.producto}>
          {
            movimiento.nombre_producto ||
            'Producto no registrado'
          }
        </Text>

        <Dato
          etiqueta="Cantidad"
          valor={
            `${movimiento.cantidad} ${
              movimiento.unidad_medida || ''
            }`
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
          etiqueta="Fecha"
          valor={
            formatearFecha(
              movimiento.fecha_movimiento
            )
          }
        />

        <Dato
          etiqueta="Existencia anterior"
          valor={
            formatearNumero(
              movimiento.existencia_anterior
            )
          }
        />

        <Dato
          etiqueta="Existencia resultante"
          valor={
            formatearNumero(
              movimiento.existencia_resultante
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

        <Dato
          etiqueta="Detalle"
          valor={
            movimiento.observaciones ||
            'Sin detalle'
          }
        />

      </View>

      {movimiento.nombre_donante ? (

        <View style={styles.tarjetaDonante}>

          <Text style={styles.subtitulo}>
            🤝 Información del Donante
          </Text>

          <Dato
            etiqueta="Nombre"
            valor={
              movimiento.nombre_donante
            }
          />

          <Dato
            etiqueta="Teléfono"
            valor={
              movimiento.telefono_donante ||
              'No registrado'
            }
          />

          <Dato
            etiqueta="Correo"
            valor={
              movimiento.correo_donante ||
              'No registrado'
            }
          />

        </View>

      ) : null}

      <TouchableOpacity
        style={styles.botonRecargar}
        onPress={
          obtenerDetalle
        }
      >

        <Text style={styles.textoBoton}>
          🔄 Actualizar información
        </Text>

      </TouchableOpacity>

    </ScrollView>
  );
}

/**
 * ============================================================
 * COMPONENTE REUTILIZABLE: DATO
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
 * ESTILOS
 * ============================================================
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

  cargando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F1E8',
    padding: 20
  },

  textoCargando: {
    marginTop: 10,
    fontSize: 16,
    color: '#555555'
  },

  encabezado: {
    backgroundColor: '#0D3B66',
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 18,
    marginBottom: 22
  },

  titulo: {
    fontSize: 27,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FFFFFF'
  },

  subtituloEncabezado: {
    textAlign: 'center',
    color: '#DCE6F0',
    fontSize: 14,
    marginTop: 8
  },

  tarjeta: {
    padding: 18,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 6,

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,
      height: 2
    },

    shadowOpacity: 0.08,
    shadowRadius: 4,

    elevation: 3
  },

  entrada: {
    borderLeftColor: '#198754'
  },

  salida: {
    borderLeftColor: '#DC3545'
  },

  movimientoDesconocido: {
    borderLeftColor: '#6C757D'
  },

  filaSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8
  },

  tipo: {
    fontSize: 18,
    fontWeight: 'bold'
  },

  textoEntrada: {
    color: '#198754'
  },

  textoSalida: {
    color: '#DC3545'
  },

  textoMovimientoDesconocido: {
    color: '#6C757D'
  },

  numeroMovimiento: {
    color: '#777777',
    fontSize: 14,
    fontWeight: 'bold'
  },

  producto: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#0D3B66',
    marginTop: 12,
    marginBottom: 20
  },

  filaDato: {
    marginBottom: 13
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

  tarjetaDonante: {
    backgroundColor: '#EAF4FF',
    padding: 18,
    borderRadius: 15,
    marginTop: 18,

    borderWidth: 1,
    borderColor: '#CFE2F3'
  },

  subtitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0D3B66',
    marginBottom: 15
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

  botonRecargar: {
    backgroundColor: '#6F42C1',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginTop: 20
  },

  textoBoton: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  },

  iconoSinDatos: {
    fontSize: 45,
    marginBottom: 10
  },

  sinDatos: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold'
  }

});