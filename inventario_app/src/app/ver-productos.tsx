import React, { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';

import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  Platform
} from 'react-native';

import { Picker } from '@react-native-picker/picker';
import api from '../services/api';

interface Producto {
  id_producto: number;
  nombre: string;
  descripcion: string;
  cantidad: number;
  unidad_medida: string;
  stock_minimo: number;
  fecha_vencimiento: string | null;
  id_categoria?: number | null;
}

interface Categoria {
  id_categoria: number;
  nombre: string;
}

const categorias: Categoria[] = [
  { id_categoria: 1, nombre: 'Alimentos' },
  { id_categoria: 2, nombre: 'Higiene personal' },
  { id_categoria: 3, nombre: 'Limpieza' },
  { id_categoria: 4, nombre: 'Medicamentos' },
  { id_categoria: 5, nombre: 'Ropa' },
  { id_categoria: 6, nombre: 'Otros' }
];

const PRODUCTOS_POR_PAGINA = 5;

export default function VerProductos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);

  const [modalVisible, setModalVisible] = useState(false);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);

  const [nombreEditar, setNombreEditar] = useState('');
  const [descripcionEditar, setDescripcionEditar] = useState('');
  const [cantidadEditar, setCantidadEditar] = useState('');
  const [unidadEditar, setUnidadEditar] = useState('');
  const [stockMinimoEditar, setStockMinimoEditar] = useState('');
  const [fechaVencimientoEditar, setFechaVencimientoEditar] = useState('');
  const [idCategoriaEditar, setIdCategoriaEditar] = useState('');

  useEffect(() => {
    obtenerProductos();
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda]);

  const mostrarMensaje = (titulo: string, mensaje: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${titulo}\n\n${mensaje}`);
      return;
    }

    Alert.alert(titulo, mensaje);
  };

  const confirmar = (
    titulo: string,
    mensaje: string,
    accionConfirmada: () => void
  ) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(`${titulo}\n\n${mensaje}`)) {
        accionConfirmada();
      }
      return;
    }

    Alert.alert(titulo, mensaje, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: accionConfirmada
      }
    ]);
  };

  const obtenerProductos = async () => {
    try {
      setCargando(true);

      const response = await api.get('/productos');

      const lista: Producto[] = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];

      setProductos(lista);
      setPaginaActual(1);
    } catch (error: any) {
      console.error(
        'Error al obtener productos:',
        error?.response?.data || error?.message || error
      );

      mostrarMensaje('Error', 'No se pudieron cargar los productos.');
    } finally {
      setCargando(false);
    }
  };

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      return productos;
    }

    return productos.filter((producto) => {
      const nombre = String(producto.nombre ?? '').toLowerCase();
      const descripcion = String(producto.descripcion ?? '').toLowerCase();
      const unidad = String(producto.unidad_medida ?? '').toLowerCase();
      const cantidad = String(producto.cantidad ?? '');
      const stock = String(producto.stock_minimo ?? '');
      const fecha = producto.fecha_vencimiento
        ? String(producto.fecha_vencimiento).substring(0, 10)
        : '';

      return (
        nombre.includes(texto) ||
        descripcion.includes(texto) ||
        unidad.includes(texto) ||
        cantidad.includes(texto) ||
        stock.includes(texto) ||
        fecha.includes(texto)
      );
    });
  }, [productos, busqueda]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA)
  );

  const productosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * PRODUCTOS_POR_PAGINA;
    const fin = inicio + PRODUCTOS_POR_PAGINA;

    return productosFiltrados.slice(inicio, fin);
  }, [productosFiltrados, paginaActual]);

  const abrirEdicion = (producto: Producto) => {
    setProductoEditando(producto);
    setNombreEditar(String(producto.nombre ?? ''));
    setDescripcionEditar(String(producto.descripcion ?? ''));
    setCantidadEditar(String(producto.cantidad ?? 0));
    setUnidadEditar(String(producto.unidad_medida ?? ''));
    setStockMinimoEditar(String(producto.stock_minimo ?? 0));
    setFechaVencimientoEditar(
      producto.fecha_vencimiento
        ? String(producto.fecha_vencimiento).substring(0, 10)
        : ''
    );
    setIdCategoriaEditar(
      producto.id_categoria !== undefined &&
      producto.id_categoria !== null
        ? String(producto.id_categoria)
        : ''
    );

    setModalVisible(true);
  };

  const cerrarEdicion = () => {
    if (guardandoEdicion) {
      return;
    }

    setModalVisible(false);
    setProductoEditando(null);
    setNombreEditar('');
    setDescripcionEditar('');
    setCantidadEditar('');
    setUnidadEditar('');
    setStockMinimoEditar('');
    setFechaVencimientoEditar('');
    setIdCategoriaEditar('');
  };

  const fechaEsValida = (fecha: string): boolean => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return false;
    }

    const [anio, mes, dia] = fecha.split('-').map(Number);
    const fechaConstruida = new Date(anio, mes - 1, dia);

    return (
      fechaConstruida.getFullYear() === anio &&
      fechaConstruida.getMonth() === mes - 1 &&
      fechaConstruida.getDate() === dia
    );
  };

  const guardarCambios = async () => {
    if (!productoEditando || guardandoEdicion) {
      return;
    }

    const nombre = nombreEditar.trim();
    const descripcion = descripcionEditar.trim();
    const unidad = unidadEditar.trim();
    const fecha = fechaVencimientoEditar.trim();

    const cantidad = Number(cantidadEditar);
    const stockMinimo = Number(stockMinimoEditar);
    const idCategoria = Number(idCategoriaEditar);

    if (
      !nombre ||
      !descripcion ||
      cantidadEditar.trim() === '' ||
      !unidad ||
      stockMinimoEditar.trim() === '' ||
      idCategoriaEditar.trim() === ''
    ) {
      mostrarMensaje(
        'Campos incompletos',
        'Complete todos los campos obligatorios.'
      );
      return;
    }

    if (!Number.isInteger(cantidad) || cantidad < 0) {
      mostrarMensaje(
        'Cantidad inválida',
        'La cantidad debe ser un número entero mayor o igual a cero.'
      );
      return;
    }

    if (!Number.isInteger(stockMinimo) || stockMinimo < 0) {
      mostrarMensaje(
        'Stock inválido',
        'El stock mínimo debe ser un número entero mayor o igual a cero.'
      );
      return;
    }

    if (!Number.isInteger(idCategoria) || idCategoria <= 0) {
      mostrarMensaje('Categoría inválida', 'Seleccione una categoría.');
      return;
    }

    if (fecha && !fechaEsValida(fecha)) {
      mostrarMensaje(
        'Fecha inválida',
        'La fecha debe tener el formato AAAA-MM-DD.'
      );
      return;
    }

    const productoActualizado = {
      nombre,
      descripcion,
      cantidad,
      unidad_medida: unidad,
      stock_minimo: stockMinimo,
      fecha_vencimiento: fecha || null,
      id_categoria: idCategoria
    };

    try {
      setGuardandoEdicion(true);

      const response = await api.put(
        `/productos/${productoEditando.id_producto}`,
        productoActualizado
      );

      setProductos((listaActual) =>
        listaActual.map((producto) =>
          producto.id_producto === productoEditando.id_producto
            ? {
                ...producto,
                ...productoActualizado
              }
            : producto
        )
      );

      setModalVisible(false);
      setProductoEditando(null);

      mostrarMensaje(
        'Éxito',
        response.data?.mensaje ||
          response.data?.message ||
          'Producto actualizado correctamente.'
      );
    } catch (error: any) {
      console.error(
        'Error al actualizar producto:',
        error?.response?.data || error?.message || error
      );

      mostrarMensaje(
        'Error',
        error?.response?.data?.mensaje ||
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          'No se pudo actualizar el producto.'
      );
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const eliminarProducto = (idProducto: number) => {
    confirmar(
      'Confirmación',
      '¿Desea eliminar este producto?',
      async () => {
        try {
          await api.delete(`/productos/${idProducto}`);

          const actualizados = productos.filter(
            (producto) => producto.id_producto !== idProducto
          );

          setProductos(actualizados);

          const nuevasPaginas = Math.max(
            1,
            Math.ceil(actualizados.length / PRODUCTOS_POR_PAGINA)
          );

          if (paginaActual > nuevasPaginas) {
            setPaginaActual(nuevasPaginas);
          }

          mostrarMensaje('Éxito', 'Producto eliminado correctamente.');
        } catch (error: any) {
          console.error(
            'Error al eliminar producto:',
            error?.response?.data || error?.message || error
          );

          mostrarMensaje(
            'Error',
            error?.response?.data?.mensaje ||
              error?.response?.data?.message ||
              'No se pudo eliminar el producto.'
          );
        }
      }
    );
  };

  const renderizarNumerosPagina = () => {
    return Array.from(
      { length: totalPaginas },
      (_, indice) => indice + 1
    ).map((numero) => (
      <TouchableOpacity
        key={`pagina-${numero}`}
        style={[
          styles.botonNumeroPagina,
          numero === paginaActual && styles.botonNumeroPaginaActivo
        ]}
        onPress={() => setPaginaActual(numero)}
      >
        <Text
          style={[
            styles.textoNumeroPagina,
            numero === paginaActual && styles.textoNumeroPaginaActivo
          ]}
        >
          {numero}
        </Text>
      </TouchableOpacity>
    ));
  };

  if (cargando) {
    return (
      <View style={styles.cargando}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.textoCargando}>Cargando productos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.botonVolver}
        onPress={() => router.back()}
      >
        <Text style={styles.textoVolver}>⬅ Volver</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>Lista de Productos</Text>

      <Text style={styles.totalProductos}>
        Total de productos: {productos.length}
      </Text>

      <View style={styles.contenedorBuscador}>
        <Text style={styles.iconoBuscar}>🔍</Text>

        <TextInput
          style={styles.inputBuscador}
          placeholder="Buscar producto..."
          placeholderTextColor="#888888"
          value={busqueda}
          onChangeText={setBusqueda}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />

        {busqueda.length > 0 ? (
          <TouchableOpacity
            style={styles.botonLimpiar}
            onPress={() => setBusqueda('')}
          >
            <Text style={styles.textoLimpiar}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {busqueda.trim() !== '' ? (
        <Text style={styles.resultadosBusqueda}>
          Resultados encontrados: {productosFiltrados.length}
        </Text>
      ) : null}

      <FlatList
        data={productosPaginados}
        extraData={productos}
        keyExtractor={(item) => `producto-${item.id_producto}`}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        contentContainerStyle={
          productosFiltrados.length === 0
            ? styles.listaVacia
            : styles.contenidoLista
        }
        renderItem={({ item }) => (
          <View style={styles.tarjeta}>
            <Text style={styles.nombre}>{item.nombre}</Text>

            <Text style={styles.informacion}>
              <Text style={styles.etiqueta}>Descripción:</Text>{' '}
              {item.descripcion || 'Sin descripción'}
            </Text>

            <Text style={styles.informacion}>
              <Text style={styles.etiqueta}>Cantidad:</Text> {item.cantidad}
            </Text>

            <Text style={styles.informacion}>
              <Text style={styles.etiqueta}>Unidad:</Text>{' '}
              {item.unidad_medida}
            </Text>

            <Text style={styles.informacion}>
              <Text style={styles.etiqueta}>Stock mínimo:</Text>{' '}
              {item.stock_minimo}
            </Text>

            <Text style={styles.informacion}>
              <Text style={styles.etiqueta}>Fecha de vencimiento:</Text>{' '}
              {item.fecha_vencimiento
                ? String(item.fecha_vencimiento).substring(0, 10)
                : 'Sin fecha'}
            </Text>

            <TouchableOpacity
              style={styles.botonEditar}
              onPress={() => abrirEdicion(item)}
            >
              <Text style={styles.textoBoton}>✏️ Editar Producto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botonDetalle}
              onPress={() =>
                router.push({
                  pathname: '/detalle-producto',
                  params: {
                    id: String(item.id_producto)
                  }
                })
              }
            >
              <Text style={styles.textoBoton}>
                📄 Detalle y Seguimiento
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botonEliminar}
              onPress={() => eliminarProducto(item.id_producto)}
            >
              <Text style={styles.textoBoton}>🗑️ Eliminar Producto</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.contenedorSinDatos}>
            <Text style={styles.sinDatos}>
              {busqueda.trim()
                ? 'No se encontraron productos.'
                : 'No hay productos registrados.'}
            </Text>

            {busqueda.trim() ? (
              <TouchableOpacity
                style={styles.botonMostrarTodos}
                onPress={() => setBusqueda('')}
              >
                <Text style={styles.textoMostrarTodos}>Mostrar todos</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        }
        ListFooterComponent={
          productosFiltrados.length > 0 ? (
            <View style={styles.seccionPaginacion}>
              <Text style={styles.textoPagina}>
                Página {paginaActual} de {totalPaginas}
              </Text>

              <View style={styles.contenedorNumerosPagina}>
                {renderizarNumerosPagina()}
              </View>

              <View style={styles.contenedorPaginacion}>
                <TouchableOpacity
                  style={[
                    styles.botonPagina,
                    paginaActual === 1 && styles.botonDeshabilitado
                  ]}
                  disabled={paginaActual === 1}
                  onPress={() =>
                    setPaginaActual((pagina) => Math.max(1, pagina - 1))
                  }
                >
                  <Text style={styles.textoBotonPagina}>Anterior</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.botonPagina,
                    paginaActual === totalPaginas &&
                      styles.botonDeshabilitado
                  ]}
                  disabled={paginaActual === totalPaginas}
                  onPress={() =>
                    setPaginaActual((pagina) =>
                      Math.min(totalPaginas, pagina + 1)
                    )
                  }
                >
                  <Text style={styles.textoBotonPagina}>Siguiente</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null
        }
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={cerrarEdicion}
      >
        <View style={styles.fondoModal}>
          <View style={styles.modal}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.tituloEdicion}>✏️ Editar producto</Text>

              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={styles.inputEditar}
                value={nombreEditar}
                onChangeText={setNombreEditar}
                editable={!guardandoEdicion}
              />

              <Text style={styles.label}>Descripción *</Text>
              <TextInput
                style={[styles.inputEditar, styles.areaTexto]}
                value={descripcionEditar}
                onChangeText={setDescripcionEditar}
                editable={!guardandoEdicion}
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.label}>Cantidad *</Text>
              <TextInput
                style={styles.inputEditar}
                value={cantidadEditar}
                onChangeText={(texto) =>
                  setCantidadEditar(texto.replace(/[^0-9]/g, ''))
                }
                editable={!guardandoEdicion}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Unidad de medida *</Text>
              <TextInput
                style={styles.inputEditar}
                value={unidadEditar}
                onChangeText={setUnidadEditar}
                editable={!guardandoEdicion}
              />

              <Text style={styles.label}>Stock mínimo *</Text>
              <TextInput
                style={styles.inputEditar}
                value={stockMinimoEditar}
                onChangeText={(texto) =>
                  setStockMinimoEditar(texto.replace(/[^0-9]/g, ''))
                }
                editable={!guardandoEdicion}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Fecha de vencimiento</Text>
              <TextInput
                style={styles.inputEditar}
                value={fechaVencimientoEditar}
                onChangeText={setFechaVencimientoEditar}
                editable={!guardandoEdicion}
                placeholder="AAAA-MM-DD"
                placeholderTextColor="#888888"
                maxLength={10}
              />

              <Text style={styles.label}>Categoría *</Text>
              <View style={styles.contenedorPicker}>
                <Picker
                  selectedValue={idCategoriaEditar}
                  onValueChange={(valor) =>
                    setIdCategoriaEditar(String(valor))
                  }
                  enabled={!guardandoEdicion}
                  style={styles.picker}
                >
                  <Picker.Item
                    label="Seleccione una categoría"
                    value=""
                  />

                  {categorias.map((categoria) => (
                    <Picker.Item
                      key={`categoria-${categoria.id_categoria}`}
                      label={categoria.nombre}
                      value={String(categoria.id_categoria)}
                    />
                  ))}
                </Picker>
              </View>

              <TouchableOpacity
                style={[
                  styles.botonGuardar,
                  guardandoEdicion && styles.botonDeshabilitado
                ]}
                onPress={guardarCambios}
                disabled={guardandoEdicion}
              >
                {guardandoEdicion ? (
                  <View style={styles.filaCargando}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.textoBoton}>Guardando...</Text>
                  </View>
                ) : (
                  <Text style={styles.textoBoton}>💾 Guardar cambios</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botonCancelar}
                onPress={cerrarEdicion}
                disabled={guardandoEdicion}
              >
                <Text style={styles.textoBoton}>✖ Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 15
  },

  cargando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  },

  textoCargando: {
    marginTop: 10,
    fontSize: 16,
    color: '#555555'
  },

  botonVolver: {
    marginTop: 20,
    marginBottom: 20,
    alignSelf: 'flex-start',
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10
  },

  textoVolver: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  },

  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#222222'
  },

  totalProductos: {
    textAlign: 'center',
    fontSize: 15,
    color: '#666666',
    marginBottom: 15
  },

  contenedorBuscador: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#D8D8D8',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10
  },

  iconoBuscar: {
    fontSize: 18,
    marginRight: 8
  },

  inputBuscador: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 16,
    color: '#222222'
  },

  botonLimpiar: {
    paddingVertical: 8,
    paddingHorizontal: 8
  },

  textoLimpiar: {
    color: '#666666',
    fontSize: 18,
    fontWeight: 'bold'
  },

  resultadosBusqueda: {
    textAlign: 'center',
    fontSize: 14,
    color: '#555555',
    marginBottom: 14
  },

  contenidoLista: {
    paddingBottom: 25
  },

  listaVacia: {
    flexGrow: 1,
    justifyContent: 'center'
  },

  tarjeta: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.15,
    shadowRadius: 4
  },

  nombre: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#222222'
  },

  informacion: {
    fontSize: 15,
    color: '#444444',
    marginBottom: 5
  },

  etiqueta: {
    fontWeight: 'bold',
    color: '#222222'
  },

  botonEditar: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 10,
    marginTop: 15
  },

  botonDetalle: {
    backgroundColor: '#6F42C1',
    padding: 12,
    borderRadius: 10,
    marginTop: 10
  },

  botonEliminar: {
    backgroundColor: '#DC3545',
    padding: 12,
    borderRadius: 10,
    marginTop: 10
  },

  textoBoton: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16
  },

  contenedorSinDatos: {
    alignItems: 'center',
    paddingHorizontal: 20
  },

  sinDatos: {
    textAlign: 'center',
    fontSize: 18,
    color: '#666666',
    marginBottom: 15
  },

  botonMostrarTodos: {
    backgroundColor: '#007AFF',
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 8
  },

  textoMostrarTodos: {
    color: '#FFFFFF',
    fontWeight: 'bold'
  },

  seccionPaginacion: {
    paddingTop: 10,
    paddingBottom: 25
  },

  textoPagina: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12
  },

  contenedorNumerosPagina: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    gap: 8
  },

  botonNumeroPagina: {
    minWidth: 38,
    height: 38,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E9ECEF',
    borderRadius: 8
  },

  botonNumeroPaginaActivo: {
    backgroundColor: '#007AFF'
  },

  textoNumeroPagina: {
    color: '#333333',
    fontSize: 15,
    fontWeight: 'bold'
  },

  textoNumeroPaginaActivo: {
    color: '#FFFFFF'
  },

  contenedorPaginacion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  botonPagina: {
    backgroundColor: '#007AFF',
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 110,
    alignItems: 'center'
  },

  botonDeshabilitado: {
    backgroundColor: '#BDBDBD',
    opacity: 0.6
  },

  textoBotonPagina: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold'
  },

  fondoModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18
  },

  modal: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '92%',
    backgroundColor: '#F5F1E8',
    borderRadius: 16,
    padding: 18
  },

  tituloEdicion: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0D3B66',
    marginBottom: 18,
    textAlign: 'center'
  },

  label: {
    color: '#0D3B66',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 6
  },

  inputEditar: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: '#222222',
    marginBottom: 12
  },

  areaTexto: {
    minHeight: 85
  },

  contenedorPicker: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 9,
    overflow: 'hidden',
    marginBottom: 12
  },

  picker: {
    width: '100%',
    height: 55,
    color: '#222222',
    backgroundColor: '#FFFFFF'
  },

  botonGuardar: {
    backgroundColor: '#198754',
    padding: 13,
    borderRadius: 10,
    marginTop: 8
  },

  botonCancelar: {
    backgroundColor: '#6C757D',
    padding: 13,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 8
  },

  filaCargando: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9
  }
});