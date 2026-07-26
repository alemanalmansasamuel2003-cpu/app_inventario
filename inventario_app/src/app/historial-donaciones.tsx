import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import { router } from 'expo-router';

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
 * Datos utilizados por la pantalla.
 */
interface Donacion {
  id_donacion: number;
  fecha_donacion: string | null;
  numero_documento: string | null;
  estado: string | null;
  observaciones: string | null;

  id_donante: number | null;
  donante: string | null;

  id_usuario: number | null;
  registrado_por: string | null;

  total_productos: number;
  total_unidades: number;
  productos_donados: string | null;
}

/**
 * Datos que puede devolver la vista SQL.
 */
interface DonacionApi {
  id_donacion?: number;
  fecha_donacion?: string | null;
  numero_documento?: string | null;
  estado?: string | null;
  observaciones?: string | null;

  id_donante?: number | null;
  nombre_donante?: string | null;
  donante?: string | null;

  id_usuario?: number | null;
  nombre_usuario?: string | null;
  registrado_por?: string | null;

  productos_diferentes?: number | null;
  total_productos?: number | null;
  total_unidades?: number | null;
  productos_donados?: string | null;
}

export default function HistorialDonaciones() {

  const [donaciones, setDonaciones] =
    useState<Donacion[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [actualizando, setActualizando] =
    useState(false);

  const mostrarMensaje = (
    titulo: string,
    mensaje: string
  ) => {
    Alert.alert(titulo, mensaje);
  };

  /**
   * Convierte los nombres devueltos por MySQL
   * a los nombres utilizados por la pantalla.
   */
  const normalizarDonacion = (
    item: DonacionApi
  ): Donacion => {

    return {
      id_donacion:
        Number(item.id_donacion) || 0,

      fecha_donacion:
        item.fecha_donacion || null,

      numero_documento:
        item.numero_documento || null,

      estado:
        item.estado || null,

      observaciones:
        item.observaciones || null,

      id_donante:
        item.id_donante !== null &&
        item.id_donante !== undefined
          ? Number(item.id_donante)
          : null,

      /**
       * La vista devuelve nombre_donante.
       */
      donante:
        item.nombre_donante ||
        item.donante ||
        null,

      id_usuario:
        item.id_usuario !== null &&
        item.id_usuario !== undefined
          ? Number(item.id_usuario)
          : null,

      /**
       * La vista devuelve nombre_usuario.
       */
      registrado_por:
        item.nombre_usuario ||
        item.registrado_por ||
        null,

      /**
       * La vista devuelve productos_diferentes.
       */
      total_productos:
        Number(
          item.productos_diferentes ??
          item.total_productos ??
          0
        ),

      total_unidades:
        Number(item.total_unidades ?? 0),

      productos_donados:
        item.productos_donados || null,
    };
  };

  /**
   * GET /api/movimientos/donaciones
   */
  const obtenerDonaciones =
    useCallback(
      async (
        esActualizacion = false
      ) => {

        try {

          if (esActualizacion) {
            setActualizando(true);
          } else {
            setCargando(true);
          }

          const response =
            await api.get(
              '/movimientos/donaciones'
            );

          console.log(
            'Donaciones obtenidas:',
            JSON.stringify(
              response.data,
              null,
              2
            )
          );

          const respuesta =
            response.data;

          let datosRecibidos:
            DonacionApi[] = [];

          if (
            Array.isArray(
              respuesta?.data
            )
          ) {

            datosRecibidos =
              respuesta.data;

          } else if (
            Array.isArray(respuesta)
          ) {

            datosRecibidos =
              respuesta;
          }

          const listaNormalizada =
            datosRecibidos.map(
              normalizarDonacion
            );

          setDonaciones(
            listaNormalizada
          );

        } catch (error: any) {

          console.error(
            'Error al obtener donaciones:',
            error?.response?.data ||
            error?.message ||
            error
          );

          mostrarMensaje(
            'Error',
            error?.response?.data
              ?.mensaje ||
            error?.response?.data
              ?.message ||
            'No se pudo cargar el historial de donaciones.'
          );

        } finally {

          setCargando(false);
          setActualizando(false);
        }
      },
      []
    );

  useEffect(() => {
    obtenerDonaciones();
  }, [obtenerDonaciones]);

  const formatearFecha = (
    fecha?: string | null
  ): string => {

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
      return fecha.substring(0, 10);
    }

    return fechaConvertida
      .toLocaleString(
        'es-CR',
        {
          dateStyle: 'medium',
          timeStyle: 'short',
        }
      );
  };

  const formatearNumero = (
    valor?: number | null
  ): string => {

    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
      return '0';
    }

    return numero.toLocaleString(
      'es-CR'
    );
  };

  const abrirDetalleDonante = (
    idDonante: number | null
  ) => {

    const idNumerico =
      Number(idDonante);

    if (
      idDonante === null ||
      !Number.isInteger(idNumerico) ||
      idNumerico <= 0
    ) {

      mostrarMensaje(
        'Donante no disponible',
        'Esta donación no tiene un donante asociado.'
      );

      return;
    }

    router.push({
      pathname:
        '/detalle-donante' as any,

      params: {
        id: String(idNumerico),
      },
    });
  };

  if (cargando) {

    return (
      <View style={styles.cargando}>

        <ActivityIndicator
          size="large"
          color="#198754"
        />

        <Text style={styles.textoCargando}>
          Cargando donaciones...
        </Text>

      </View>
    );
  }

  return (
    <View style={styles.container}>

      <TouchableOpacity
        style={styles.botonVolver}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Text style={styles.textoBotonVolver}>
          ← Volver
        </Text>
      </TouchableOpacity>

      <View style={styles.encabezado}>

        <Text style={styles.iconoTitulo}>
          🎁
        </Text>

        <Text style={styles.titulo}>
          Historial de Donaciones
        </Text>

        <Text style={styles.subtitulo}>
          Consulte las donaciones recibidas
        </Text>

      </View>

      <View style={styles.tarjetaResumen}>

        <Text style={styles.numeroResumen}>
          {donaciones.length}
        </Text>

        <Text style={styles.textoResumen}>
          {
            donaciones.length === 1
              ? 'donación registrada'
              : 'donaciones registradas'
          }
        </Text>

      </View>

      <FlatList
        data={donaciones}

        keyExtractor={(item) =>
          String(item.id_donacion)
        }

        showsVerticalScrollIndicator={
          false
        }

        contentContainerStyle={
          donaciones.length === 0
            ? styles.listaVacia
            : styles.contenidoLista
        }

        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={() =>
              obtenerDonaciones(true)
            }
            colors={['#198754']}
            tintColor="#198754"
          />
        }

        renderItem={({ item }) => {

          const tieneDonante =
            item.id_donante !== null &&
            Number(item.id_donante) > 0;

          return (
            <TouchableOpacity
              style={[
                styles.tarjeta,
                !tieneDonante &&
                  styles.tarjetaDeshabilitada,
              ]}
              onPress={() =>
                abrirDetalleDonante(
                  item.id_donante
                )
              }
              disabled={!tieneDonante}
              activeOpacity={0.8}
            >

              <View
                style={
                  styles.encabezadoTarjeta
                }
              >

                <View style={styles.flexUno}>

                  <Text style={styles.donante}>
                    {
                      item.donante ||
                      'Donante no registrado'
                    }
                  </Text>

                  <Text style={styles.tipo}>
                    {
                      item.estado ||
                      'Estado no registrado'
                    }
                  </Text>

                </View>

                <View
                  style={
                    styles.insigniaDonacion
                  }
                >
                  <Text
                    style={
                      styles.textoInsignia
                    }
                  >
                    DONACIÓN
                  </Text>
                </View>

              </View>

              <View style={styles.separador} />

              <Text style={styles.producto}>
                Donación #{item.id_donacion}
              </Text>

              <View style={styles.fila}>

                <Text style={styles.etiqueta}>
                  Productos diferentes:
                </Text>

                <Text style={styles.valor}>
                  {
                    formatearNumero(
                      item.total_productos
                    )
                  }
                </Text>

              </View>

              <View style={styles.fila}>

                <Text style={styles.etiqueta}>
                  Total de unidades:
                </Text>

                <Text style={styles.valor}>
                  {
                    formatearNumero(
                      item.total_unidades
                    )
                  }
                </Text>

              </View>

              <View
                style={
                  styles.productosDonadosContainer
                }
              >

                <Text style={styles.etiqueta}>
                  Productos donados:
                </Text>

                <Text
                  style={
                    styles.productosDonados
                  }
                >
                  {
                    item.productos_donados ||
                    'No registrados'
                  }
                </Text>

              </View>

              <View style={styles.fila}>

                <Text style={styles.etiqueta}>
                  Documento:
                </Text>

                <Text style={styles.valor}>
                  {
                    item.numero_documento ||
                    'No registrado'
                  }
                </Text>

              </View>

              <View style={styles.fila}>

                <Text style={styles.etiqueta}>
                  Estado:
                </Text>

                <Text style={styles.valor}>
                  {
                    item.estado ||
                    'No registrado'
                  }
                </Text>

              </View>

              <View style={styles.fila}>

                <Text style={styles.etiqueta}>
                  Fecha:
                </Text>

                <Text style={styles.valor}>
                  {
                    formatearFecha(
                      item.fecha_donacion
                    )
                  }
                </Text>

              </View>

              <View style={styles.fila}>

                <Text style={styles.etiqueta}>
                  Registrado por:
                </Text>

                <Text style={styles.valor}>
                  {
                    item.registrado_por ||
                    'No registrado'
                  }
                </Text>

              </View>

              <View
                style={
                  styles.observacionesContainer
                }
              >

                <Text style={styles.etiqueta}>
                  Observaciones
                </Text>

                <Text
                  style={
                    styles.observaciones
                  }
                >
                  {
                    item.observaciones ||
                    'Sin observaciones'
                  }
                </Text>

              </View>

              {
                tieneDonante ? (
                  <Text style={styles.verDetalle}>
                    Ver detalle del donante →
                  </Text>
                ) : (
                  <Text style={styles.sinDetalle}>
                    Sin donante asociado
                  </Text>
                )
              }

            </TouchableOpacity>
          );
        }}

        ListEmptyComponent={
          <View
            style={
              styles.contenedorSinDatos
            }
          >

            <Text style={styles.iconoSinDatos}>
              📭
            </Text>

            <Text style={styles.tituloSinDatos}>
              No hay donaciones
            </Text>

            <Text style={styles.sinDatos}>
              No existen donaciones registradas en el sistema.
            </Text>

            <TouchableOpacity
              style={styles.botonActualizar}
              onPress={() =>
                obtenerDonaciones()
              }
              activeOpacity={0.8}
            >
              <Text style={styles.textoActualizar}>
                Actualizar
              </Text>
            </TouchableOpacity>

          </View>
        }
      />

    </View>
  );
}

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
    textAlign: 'center',
    color: '#0D3B66',
  },

  subtitulo: {
    marginTop: 5,
    color: '#667085',
    fontSize: 15,
    textAlign: 'center',
  },

  tarjetaResumen: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    backgroundColor: '#198754',
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
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 5,
    borderLeftColor: '#198754',
    padding: 17,
    borderRadius: 14,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E3E8EF',

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.08,
    shadowRadius: 7,
    elevation: 3,
  },

  tarjetaDeshabilitada: {
    opacity: 0.75,
  },

  encabezadoTarjeta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },

  flexUno: {
    flex: 1,
  },

  donante: {
    fontSize: 21,
    fontWeight: '800',
    color: '#198754',
  },

  tipo: {
    color: '#667085',
    marginTop: 4,
    fontSize: 14,
  },

  insigniaDonacion: {
    backgroundColor: '#DFF3E5',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },

  textoInsignia: {
    color: '#157347',
    fontWeight: '800',
    fontSize: 11,
  },

  separador: {
    height: 1,
    backgroundColor: '#E3E8EF',
    marginVertical: 13,
  },

  producto: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
    color: '#1D2939',
  },

  fila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    flexWrap: 'wrap',
  },

  etiqueta: {
    fontWeight: '700',
    color: '#344054',
    fontSize: 15,
    marginRight: 5,
  },

  valor: {
    flex: 1,
    minWidth: 100,
    color: '#475467',
    fontSize: 15,
  },

  productosDonadosContainer: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    marginBottom: 10,
  },

  productosDonados: {
    color: '#166534',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 5,
  },

  observacionesContainer: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    marginTop: 5,
  },

  observaciones: {
    color: '#475467',
    fontSize: 14,
    marginTop: 5,
    lineHeight: 20,
  },

  verDetalle: {
    color: '#0D6EFD',
    fontWeight: '800',
    marginTop: 14,
    fontSize: 15,
  },

  sinDetalle: {
    color: '#98A2B3',
    fontWeight: '700',
    marginTop: 14,
    fontSize: 14,
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
    color: '#667085',
    fontSize: 16,
    lineHeight: 22,
  },

  botonActualizar: {
    marginTop: 20,
    backgroundColor: '#198754',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },

  textoActualizar: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
});