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
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';

import api from '../services/api';

interface Donante {
  id_donante: number;
  nombre: string;
  tipo_donante: string;
  identificacion?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  observaciones?: string | null;
  activo?: number;
  fecha_registro?: string | null;
}

export default function DetalleDonante() {

  const parametros =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const parametroId =
    Array.isArray(parametros.id)
      ? parametros.id[0]
      : parametros.id;

  const idDonante =
    Number(parametroId);

  const [
    donante,
    setDonante,
  ] = useState<Donante | null>(
    null
  );

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    actualizando,
    setActualizando,
  ] = useState(false);

  /**
   * Formatea la fecha recibida
   * desde el backend.
   */
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
      .toLocaleString('es-CR');
  };

  /**
   * Obtiene el donante por su ID.
   */
  const obtenerDonante =
    useCallback(
      async (
        esActualizacion = false
      ) => {

        if (
          !Number.isInteger(
            idDonante
          ) ||
          idDonante <= 0
        ) {

          Alert.alert(
            'Error',
            'El identificador del donante no es válido.',
            [
              {
                text: 'Volver',
                onPress: () =>
                  router.back(),
              },
            ]
          );

          setCargando(false);
          return;
        }

        try {

          if (esActualizacion) {
            setActualizando(true);
          } else {
            setCargando(true);
          }

          const response =
            await api.get(
              `/donantes/${idDonante}`
            );

          const datosDonante =
            response.data?.data ||
            response.data?.donante ||
            response.data;

          if (
            !datosDonante ||
            !datosDonante.id_donante
          ) {
            throw new Error(
              'La respuesta no contiene un donante válido.'
            );
          }

          setDonante(
            datosDonante
          );

        } catch (error: any) {

          console.error(
            'Error al obtener el donante:',
            error?.response?.data ||
            error?.message
          );

          Alert.alert(
            'Error',
            error?.response?.data
              ?.mensaje ||
            error?.response?.data
              ?.message ||
            'No fue posible cargar el donante.'
          );

        } finally {

          setCargando(false);
          setActualizando(false);
        }
      },
      [idDonante]
    );

  useEffect(() => {

    obtenerDonante();

  }, [obtenerDonante]);

  if (cargando) {

    return (
      <View style={styles.cargando}>

        <ActivityIndicator
          size="large"
          color="#198754"
        />

        <Text
          style={
            styles.textoCargando
          }
        >
          Cargando donante...
        </Text>

      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.contenido
      }
      showsVerticalScrollIndicator={
        false
      }
      refreshControl={
        <RefreshControl
          refreshing={actualizando}
          onRefresh={() =>
            obtenerDonante(true)
          }
        />
      }
    >
      <TouchableOpacity
        style={styles.botonVolver}
        onPress={() => router.back()}
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

      <View style={styles.encabezado}>

        <Text style={styles.icono}>
          👤
        </Text>

        <Text style={styles.titulo}>
          Detalle del Donante
        </Text>

        <Text style={styles.subtitulo}>
          Información registrada en el sistema
        </Text>

      </View>

      {
        donante
          ? (
            <View style={styles.tarjeta}>

              <Text
                style={
                  styles.nombre
                }
              >
                {donante.nombre}
              </Text>

              <View
                style={
                  styles.insignia
                }
              >
                <Text
                  style={
                    styles.textoInsignia
                  }
                >
                  {
                    donante.tipo_donante ||
                    'SIN TIPO'
                  }
                </Text>
              </View>

              <View
                style={
                  styles.separador
                }
              />

              <View style={styles.fila}>
                <Text style={styles.etiqueta}>
                  Identificación:
                </Text>

                <Text style={styles.valor}>
                  {
                    donante.identificacion ||
                    'No registrada'
                  }
                </Text>
              </View>

              <View style={styles.fila}>
                <Text style={styles.etiqueta}>
                  Teléfono:
                </Text>

                <Text style={styles.valor}>
                  {
                    donante.telefono ||
                    'No registrado'
                  }
                </Text>
              </View>

              <View style={styles.fila}>
                <Text style={styles.etiqueta}>
                  Correo:
                </Text>

                <Text style={styles.valor}>
                  {
                    donante.correo ||
                    'No registrado'
                  }
                </Text>
              </View>

              <View style={styles.fila}>
                <Text style={styles.etiqueta}>
                  Dirección:
                </Text>

                <Text style={styles.valor}>
                  {
                    donante.direccion ||
                    'No registrada'
                  }
                </Text>
              </View>

              <View style={styles.fila}>
                <Text style={styles.etiqueta}>
                  Fecha de registro:
                </Text>

                <Text style={styles.valor}>
                  {
                    formatearFecha(
                      donante.fecha_registro
                    )
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
                    donante.observaciones ||
                    'Sin observaciones'
                  }
                </Text>
              </View>

            </View>
          )
          : (
            <View
              style={
                styles.sinDatos
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
                  styles.textoSinDatos
                }
              >
                No se encontró la información del donante.
              </Text>
            </View>
          )
      }

    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },

  contenido: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 50,
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
    marginTop: 10,
    marginBottom: 20,
  },

  textoBotonVolver: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  encabezado: {
    alignItems: 'center',
    marginBottom: 22,
  },

  icono: {
    fontSize: 50,
    marginBottom: 5,
  },

  titulo: {
    color: '#0D3B66',
    fontSize: 29,
    fontWeight: '800',
    textAlign: 'center',
  },

  subtitulo: {
    color: '#667085',
    fontSize: 15,
    marginTop: 5,
    textAlign: 'center',
  },

  tarjeta: {
    width: '100%',
    maxWidth: 650,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E8EF',
    borderRadius: 18,
    padding: 20,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  nombre: {
    color: '#198754',
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
  },

  insignia: {
    alignSelf: 'center',
    backgroundColor: '#DFF3E5',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginTop: 10,
  },

  textoInsignia: {
    color: '#157347',
    fontSize: 12,
    fontWeight: '800',
  },

  separador: {
    height: 1,
    backgroundColor: '#E3E8EF',
    marginVertical: 20,
  },

  fila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginBottom: 14,
  },

  etiqueta: {
    color: '#344054',
    fontSize: 15,
    fontWeight: '800',
    marginRight: 6,
  },

  valor: {
    flex: 1,
    minWidth: 100,
    color: '#475467',
    fontSize: 15,
  },

  observacionesContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },

  observaciones: {
    color: '#475467',
    fontSize: 15,
    lineHeight: 21,
    marginTop: 6,
  },

  sinDatos: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },

  iconoSinDatos: {
    fontSize: 55,
    marginBottom: 12,
  },

  textoSinDatos: {
    color: '#667085',
    fontSize: 17,
    textAlign: 'center',
  },
});