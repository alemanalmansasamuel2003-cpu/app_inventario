import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import { router } from 'expo-router';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator
} from 'react-native';

import api from '../services/api';

/**
 * ============================================================
 * INTERFAZ: PRODUCTO
 * ============================================================
 *
 * Define la estructura de los productos recibidos
 * desde el backend.
 * ============================================================
 */
interface Producto {
  id_producto: number;
  nombre: string;
  descripcion: string;
  cantidad: number;
  unidad_medida: string;
  stock_minimo: number;
  fecha_vencimiento?: string | null;
  nombre_categoria?: string | null;
}

/**
 * ============================================================
 * TIPOS DE BÚSQUEDA
 * ============================================================
 */
type TipoBusqueda =
  | 'TODOS'
  | 'NOMBRE'
  | 'DESCRIPCION'
  | 'UNIDAD'
  | 'CANTIDAD'
  | 'STOCK'
  | 'CATEGORIA';

/**
 * ============================================================
 * PANTALLA: BUSCAR PRODUCTO
 * ============================================================
 *
 * Permite buscar productos por:
 *
 * ✔ Todos los campos.
 * ✔ Nombre.
 * ✔ Descripción.
 * ✔ Unidad de medida.
 * ✔ Cantidad.
 * ✔ Stock mínimo.
 * ✔ Categoría.
 *
 * También permite abrir el detalle y seguimiento
 * del producto seleccionado.
 * ============================================================
 */
export default function BuscarProducto() {

  /**
   * Texto ingresado en el buscador.
   */
  const [busqueda, setBusqueda] =
    useState('');

  /**
   * Lista completa de productos.
   */
  const [productos, setProductos] =
    useState<Producto[]>([]);

  /**
   * Tipo de búsqueda seleccionado.
   */
  const [
    tipoBusqueda,
    setTipoBusqueda
  ] = useState<TipoBusqueda>('TODOS');

  /**
   * Estado de carga.
   */
  const [cargando, setCargando] =
    useState(true);

  /**
   * ============================================================
   * CARGAR PRODUCTOS
   * ============================================================
   */
  useEffect(() => {

    obtenerProductos();

  }, []);

  /**
   * ============================================================
   * OBTENER PRODUCTOS
   * ============================================================
   */
  const obtenerProductos = async () => {

    try {

      setCargando(true);

      const response =
        await api.get('/productos');

      const listaProductos: Producto[] =
        Array.isArray(response.data?.data)
          ? response.data.data
          : [];

      setProductos(listaProductos);

    } catch (error: any) {

      console.log(
        'Error al obtener productos:',
        error?.response?.data ||
        error?.message ||
        error
      );

      mostrarMensaje(
        'Error',
        error?.response?.data?.mensaje ||
        error?.response?.data?.message ||
        'No se pudieron obtener los productos.'
      );

    } finally {

      setCargando(false);
    }
  };

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
   * NORMALIZAR TEXTO
   * ============================================================
   *
   * Convierte el valor a minúscula y elimina acentos.
   *
   * Ejemplo:
   *
   * "Azúcar" pasa a "azucar".
   * ============================================================
   */
  const normalizarTexto = (
    valor:
      | string
      | number
      | null
      | undefined
  ) => {

    return String(valor ?? '')
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .trim()
      .toLowerCase();
  };

  /**
   * ============================================================
   * PRODUCTOS FILTRADOS
   * ============================================================
   */
  const productosFiltrados =
    useMemo(() => {

      const textoBuscado =
        normalizarTexto(busqueda);

      /**
       * Cuando el campo está vacío,
       * se muestran todos los productos.
       */
      if (!textoBuscado) {

        return productos;
      }

      return productos.filter(
        (producto) => {

          const nombre =
            normalizarTexto(
              producto.nombre
            );

          const descripcion =
            normalizarTexto(
              producto.descripcion
            );

          const unidad =
            normalizarTexto(
              producto.unidad_medida
            );

          const cantidad =
            normalizarTexto(
              producto.cantidad
            );

          const stock =
            normalizarTexto(
              producto.stock_minimo
            );

          const categoria =
            normalizarTexto(
              producto.nombre_categoria
            );

          switch (tipoBusqueda) {

            case 'NOMBRE':

              return nombre.includes(
                textoBuscado
              );

            case 'DESCRIPCION':

              return descripcion.includes(
                textoBuscado
              );

            case 'UNIDAD':

              return unidad.includes(
                textoBuscado
              );

            case 'CANTIDAD':

              return cantidad.includes(
                textoBuscado
              );

            case 'STOCK':

              return stock.includes(
                textoBuscado
              );

            case 'CATEGORIA':

              return categoria.includes(
                textoBuscado
              );

            case 'TODOS':

            default:

              return (
                nombre.includes(
                  textoBuscado
                ) ||

                descripcion.includes(
                  textoBuscado
                ) ||

                unidad.includes(
                  textoBuscado
                ) ||

                cantidad.includes(
                  textoBuscado
                ) ||

                stock.includes(
                  textoBuscado
                ) ||

                categoria.includes(
                  textoBuscado
                )
              );
          }
        }
      );

    }, [
      productos,
      busqueda,
      tipoBusqueda
    ]);

  /**
   * ============================================================
   * LIMPIAR BÚSQUEDA
   * ============================================================
   */
  const limpiarBusqueda = () => {

    setBusqueda('');
    setTipoBusqueda('TODOS');
  };

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

    /**
     * Evita problemas de zona horaria
     * mostrando directamente AAAA-MM-DD.
     */
    return fecha.substring(
      0,
      10
    );
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
          Cargando productos...
        </Text>

      </View>
    );
  }

  return (

    <View style={styles.container}>

      {/* Botón volver */}

      <TouchableOpacity
        style={styles.botonVolver}
        onPress={() =>
          router.back()
        }
      >

        <Text style={styles.textoVolver}>
          ⬅ Volver
        </Text>

      </TouchableOpacity>

      {/* Encabezado */}

      <View style={styles.encabezado}>

        <Text style={styles.titulo}>
          🔍 Buscar Producto
        </Text>

        <Text style={styles.descripcion}>
          Consulte productos registrados en el inventario
        </Text>

      </View>

      {/* Tipos de búsqueda */}

      <Text style={styles.subtitulo}>
        Buscar por:
      </Text>

      <View style={styles.contenedorOpciones}>

        {[
          {
            valor: 'TODOS',
            texto: 'Todos'
          },
          {
            valor: 'NOMBRE',
            texto: 'Nombre'
          },
          {
            valor: 'DESCRIPCION',
            texto: 'Descripción'
          },
          {
            valor: 'UNIDAD',
            texto: 'Unidad'
          },
          {
            valor: 'CANTIDAD',
            texto: 'Cantidad'
          },
          {
            valor: 'STOCK',
            texto: 'Stock mínimo'
          },
          {
            valor: 'CATEGORIA',
            texto: 'Categoría'
          }
        ].map((opcion) => {

          const seleccionado =
            tipoBusqueda ===
            opcion.valor;

          return (

            <TouchableOpacity
              key={opcion.valor}
              style={[
                styles.botonOpcion,

                seleccionado &&
                styles.botonOpcionActivo
              ]}
              onPress={() =>
                setTipoBusqueda(
                  opcion.valor as TipoBusqueda
                )
              }
            >

              <Text
                style={[
                  styles.textoOpcion,

                  seleccionado &&
                  styles.textoOpcionActivo
                ]}
              >
                {opcion.texto}
              </Text>

            </TouchableOpacity>
          );
        })}

      </View>

      {/* Campo de búsqueda */}

      <TextInput
        style={styles.input}
        placeholder="Escriba el dato que desea buscar"
        placeholderTextColor="#999999"
        value={busqueda}
        onChangeText={setBusqueda}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      {/* Botón limpiar */}

      <TouchableOpacity
        style={styles.botonLimpiar}
        onPress={limpiarBusqueda}
      >

        <Text style={styles.textoBoton}>
          Limpiar búsqueda
        </Text>

      </TouchableOpacity>

      {/* Cantidad de resultados */}

      <Text style={styles.totalResultados}>
        Resultados encontrados:{' '}
        {productosFiltrados.length}
      </Text>

      {/* Lista de productos */}

      <FlatList
        data={productosFiltrados}

        keyExtractor={(item) =>
          item.id_producto.toString()
        }

        showsVerticalScrollIndicator={false}

        contentContainerStyle={
          productosFiltrados.length === 0
            ? styles.listaVacia
            : styles.contenidoLista
        }

        keyboardShouldPersistTaps="handled"

        renderItem={({ item }) => {

          const sinExistencias =
            item.cantidad <= 0;

          const stockBajo =
            item.cantidad > 0 &&
            item.cantidad <=
            item.stock_minimo;

          const estado =
            sinExistencias
              ? 'SIN EXISTENCIAS'
              : stockBajo
                ? 'STOCK BAJO'
                : 'DISPONIBLE';

          return (

            <View style={styles.tarjeta}>

              <View style={styles.encabezadoTarjeta}>

                <Text style={styles.nombre}>
                  {item.nombre}
                </Text>

                <View
                  style={[
                    styles.estado,

                    sinExistencias
                      ? styles.estadoAgotado
                      : stockBajo
                        ? styles.estadoBajo
                        : styles.estadoDisponible
                  ]}
                >

                  <Text style={styles.textoEstado}>
                    {estado}
                  </Text>

                </View>

              </View>

              <Text style={styles.informacion}>

                <Text style={styles.etiqueta}>
                  Descripción:
                </Text>

                {' '}

                {
                  item.descripcion ||
                  'Sin descripción'
                }

              </Text>

              <Text style={styles.informacion}>

                <Text style={styles.etiqueta}>
                  Categoría:
                </Text>

                {' '}

                {
                  item.nombre_categoria ||
                  'Sin categoría'
                }

              </Text>

              <Text style={styles.informacion}>

                <Text style={styles.etiqueta}>
                  Cantidad:
                </Text>

                {' '}

                {item.cantidad}{' '}
                {item.unidad_medida}

              </Text>

              <Text style={styles.informacion}>

                <Text style={styles.etiqueta}>
                  Stock mínimo:
                </Text>

                {' '}

                {item.stock_minimo}{' '}
                {item.unidad_medida}

              </Text>

              <Text style={styles.informacion}>

                <Text style={styles.etiqueta}>
                  Fecha de vencimiento:
                </Text>

                {' '}

                {
                  formatearFecha(
                    item.fecha_vencimiento
                  )
                }

              </Text>

              {/* Abrir detalle */}

              <TouchableOpacity
                style={styles.botonDetalle}
                onPress={() =>
                  router.push({
                    pathname:
                      '/detalle-producto',

                    params: {
                      id: String(
                        item.id_producto
                      )
                    }
                  })
                }
              >

                <Text style={styles.textoBoton}>
                  Ver detalle y seguimiento
                </Text>

              </TouchableOpacity>

            </View>
          );
        }}

        ListEmptyComponent={

          <View style={styles.contenedorSinDatos}>

            <Text style={styles.iconoSinDatos}>
              📦
            </Text>

            <Text style={styles.sinDatos}>
              No se encontraron productos.
            </Text>

            <Text style={styles.ayudaSinDatos}>
              Pruebe con otro criterio o texto de búsqueda.
            </Text>

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
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#F5F1E8'
  },

  cargando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F1E8'
  },

  textoCargando: {
    marginTop: 10,
    fontSize: 16,
    color: '#555555'
  },

  botonVolver: {
    marginBottom: 20,
    alignSelf: 'flex-start',
    backgroundColor: '#0D3B66',
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 12
  },

  textoVolver: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  },

  encabezado: {
    backgroundColor: '#0D3B66',
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 18,
    marginBottom: 22
  },

  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FFFFFF'
  },

  descripcion: {
    color: '#DCE6F0',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8
  },

  subtitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0D3B66'
  },

  contenedorOpciones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15
  },

  botonOpcion: {
    backgroundColor: '#E2E8EE',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 20
  },

  botonOpcionActivo: {
    backgroundColor: '#0D3B66'
  },

  textoOpcion: {
    color: '#333333',
    fontWeight: 'bold',
    fontSize: 13
  },

  textoOpcionActivo: {
    color: '#FFFFFF'
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 12,
    fontSize: 16,
    color: '#222222'
  },

  botonLimpiar: {
    backgroundColor: '#6C757D',
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 15
  },

  totalResultados: {
    textAlign: 'center',
    color: '#555555',
    marginBottom: 15,
    fontWeight: 'bold'
  },

  contenidoLista: {
    paddingBottom: 35
  },

  listaVacia: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 80
  },

  tarjeta: {
    backgroundColor: '#FFFFFF',
    padding: 17,
    borderRadius: 15,
    marginBottom: 15,

    borderWidth: 1,
    borderColor: '#E4E4E4',

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,
      height: 2
    },

    shadowOpacity: 0.08,
    shadowRadius: 4,

    elevation: 2
  },

  encabezadoTarjeta: {
    marginBottom: 12
  },

  nombre: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#0D3B66',
    marginBottom: 9
  },

  estado: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 20
  },

  estadoDisponible: {
    backgroundColor: '#198754'
  },

  estadoBajo: {
    backgroundColor: '#E0A800'
  },

  estadoAgotado: {
    backgroundColor: '#DC3545'
  },

  textoEstado: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12
  },

  informacion: {
    color: '#444444',
    marginBottom: 7,
    fontSize: 15,
    lineHeight: 21
  },

  etiqueta: {
    fontWeight: 'bold',
    color: '#222222'
  },

  botonDetalle: {
    backgroundColor: '#6F42C1',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 12
  },

  textoBoton: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold'
  },

  contenedorSinDatos: {
    alignItems: 'center',
    paddingHorizontal: 20
  },

  iconoSinDatos: {
    fontSize: 45,
    marginBottom: 10
  },

  sinDatos: {
    textAlign: 'center',
    color: '#555555',
    fontSize: 18,
    fontWeight: 'bold'
  },

  ayudaSinDatos: {
    textAlign: 'center',
    color: '#777777',
    fontSize: 14,
    marginTop: 7
  }

});