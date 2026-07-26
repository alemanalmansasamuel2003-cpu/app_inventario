import React, { useState } from 'react';

import {
  router,
  useLocalSearchParams
} from 'expo-router';

import {
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  View
} from 'react-native';

import { Picker } from '@react-native-picker/picker';

import api from '../services/api';

/**
 * ============================================================
 * INTERFAZ DE CATEGORÍA
 * ============================================================
 */
interface Categoria {
  id_categoria: number;
  nombre: string;
}

/**
 * ============================================================
 * LISTA DE CATEGORÍAS
 * ============================================================
 *
 * Estas categorías corresponden a los registros existentes
 * en la tabla categorias de MySQL.
 */
const categorias: Categoria[] = [
  {
    id_categoria: 1,
    nombre: 'Alimentos'
  },
  {
    id_categoria: 2,
    nombre: 'Higiene personal'
  },
  {
    id_categoria: 3,
    nombre: 'Limpieza'
  },
  {
    id_categoria: 4,
    nombre: 'Medicamentos'
  },
  {
    id_categoria: 5,
    nombre: 'Ropa'
  },
  {
    id_categoria: 6,
    nombre: 'Otros'
  }
];

/**
 * ============================================================
 * PANTALLA: AGREGAR PRODUCTO
 * ============================================================
 *
 * Funcionamiento:
 *
 * ✔ No solicita ni envía id_producto.
 * ✔ MySQL genera el id_producto automáticamente.
 * ✔ Si el producto ya existe, el backend suma la cantidad.
 * ✔ Si el producto es nuevo, el backend lo registra.
 * ✔ Permite productos sin fecha de vencimiento.
 * ✔ Valida cantidad, stock mínimo, categoría y fecha.
 * ✔ Muestra las categorías mediante una lista desplegable.
 * ✔ Regresa a la lista después de guardar.
 *
 * IMPORTANTE:
 *
 * La detección del producto repetido y la suma de cantidad
 * deben realizarse en POST /api/productos del backend.
 * ============================================================
 */
export default function AgregarProducto() {

  /**
   * Parámetros del usuario autenticado.
   *
   * Se conservan para regresar a la lista de productos
   * sin perder la sesión ni el rol.
   */
  const parametros = useLocalSearchParams<{
    id?: string;
    nombre?: string;
    correo?: string;
    rol?: string;
  }>();

  /**
   * ============================================================
   * ESTADOS DEL FORMULARIO
   * ============================================================
   */

  const [
    nombreProducto,
    setNombreProducto
  ] = useState('');

  const [
    descripcion,
    setDescripcion
  ] = useState('');

  const [
    cantidad,
    setCantidad
  ] = useState('');

  const [
    unidadMedida,
    setUnidadMedida
  ] = useState('');

  const [
    stockMinimo,
    setStockMinimo
  ] = useState('');

  const [
    fechaVencimiento,
    setFechaVencimiento
  ] = useState('');

  const [
    idCategoria,
    setIdCategoria
  ] = useState('');

  const [
    guardando,
    setGuardando
  ] = useState(false);

  /**
   * ============================================================
   * MOSTRAR MENSAJE
   * ============================================================
   */
  const mostrarMensaje = (
    titulo: string,
    mensaje: string,
    alAceptar?: () => void
  ) => {

    /**
     * Alert para la versión web.
     */
    if (typeof window !== 'undefined') {

      window.alert(
        `${titulo}\n\n${mensaje}`
      );

      if (alAceptar) {
        alAceptar();
      }

      return;
    }

    /**
     * Alert para Android/iOS.
     */
    Alert.alert(
      titulo,
      mensaje,
      [
        {
          text: 'Aceptar',
          onPress: alAceptar
        }
      ]
    );
  };

  /**
   * ============================================================
   * LIMPIAR FORMULARIO
   * ============================================================
   */
  const limpiarFormulario = () => {

    setNombreProducto('');
    setDescripcion('');
    setCantidad('');
    setUnidadMedida('');
    setStockMinimo('');
    setFechaVencimiento('');
    setIdCategoria('');
  };

  /**
   * ============================================================
   * REGRESAR A LA LISTA
   * ============================================================
   */
  const irAListaProductos = () => {

    router.replace({
      pathname: '/ver-productos',
      params: {
        id: parametros.id ?? '',
        nombre: parametros.nombre ?? '',
        correo: parametros.correo ?? '',
        rol: parametros.rol ?? ''
      }
    });
  };

  /**
   * ============================================================
   * VALIDAR FECHA
   * ============================================================
   */
  const fechaEsValida = (
    fecha: string
  ): boolean => {

    const formatoFecha =
      /^\d{4}-\d{2}-\d{2}$/;

    if (!formatoFecha.test(fecha)) {
      return false;
    }

    const [
      anio,
      mes,
      dia
    ] = fecha
      .split('-')
      .map(Number);

    const fechaConstruida =
      new Date(
        anio,
        mes - 1,
        dia
      );

    return (
      fechaConstruida.getFullYear() === anio &&
      fechaConstruida.getMonth() === mes - 1 &&
      fechaConstruida.getDate() === dia
    );
  };

  /**
   * ============================================================
   * GUARDAR PRODUCTO
   * ============================================================
   */
  const guardarProducto = async () => {

    if (guardando) {
      return;
    }

    /**
     * Limpiar espacios innecesarios.
     */
    const nombreLimpio =
      nombreProducto.trim();

    const descripcionLimpia =
      descripcion.trim();

    const unidadLimpia =
      unidadMedida.trim();

    const cantidadLimpia =
      cantidad.trim();

    const stockMinimoLimpio =
      stockMinimo.trim();

    const categoriaLimpia =
      idCategoria.trim();

    const fechaLimpia =
      fechaVencimiento.trim();

    /**
     * ========================================================
     * VALIDAR CAMPOS OBLIGATORIOS
     * ========================================================
     */
    if (
      !nombreLimpio ||
      !descripcionLimpia ||
      !cantidadLimpia ||
      !unidadLimpia ||
      !stockMinimoLimpio ||
      !categoriaLimpia
    ) {

      mostrarMensaje(
        'Campos incompletos',
        'Complete todos los campos obligatorios.'
      );

      return;
    }

    /**
     * ========================================================
     * VALIDAR CANTIDAD
     * ========================================================
     */
    const cantidadNumero =
      Number(cantidadLimpia);

    if (
      !Number.isInteger(cantidadNumero) ||
      cantidadNumero <= 0
    ) {

      mostrarMensaje(
        'Cantidad inválida',
        'La cantidad debe ser un número entero mayor que cero.'
      );

      return;
    }

    /**
     * ========================================================
     * VALIDAR STOCK MÍNIMO
     * ========================================================
     */
    const stockMinimoNumero =
      Number(stockMinimoLimpio);

    if (
      !Number.isInteger(stockMinimoNumero) ||
      stockMinimoNumero < 0
    ) {

      mostrarMensaje(
        'Stock mínimo inválido',
        'El stock mínimo debe ser un número entero mayor o igual a cero.'
      );

      return;
    }

    /**
     * ========================================================
     * VALIDAR CATEGORÍA
     * ========================================================
     */
    const categoriaNumero =
      Number(categoriaLimpia);

    if (
      !Number.isInteger(categoriaNumero) ||
      categoriaNumero <= 0
    ) {

      mostrarMensaje(
        'Categoría inválida',
        'Debe seleccionar una categoría.'
      );

      return;
    }

    /**
     * Verificar que la categoría seleccionada
     * exista dentro de la lista.
     */
    const categoriaExiste =
      categorias.some(
        categoria =>
          categoria.id_categoria ===
          categoriaNumero
      );

    if (!categoriaExiste) {

      mostrarMensaje(
        'Categoría inválida',
        'La categoría seleccionada no existe.'
      );

      return;
    }

    /**
     * ========================================================
     * VALIDAR FECHA
     * ========================================================
     *
     * La fecha es opcional.
     */
    if (fechaLimpia) {

      if (!fechaEsValida(fechaLimpia)) {

        mostrarMensaje(
          'Fecha inválida',
          'La fecha debe tener el formato AAAA-MM-DD.'
        );

        return;
      }

      const [
        anio,
        mes,
        dia
      ] = fechaLimpia
        .split('-')
        .map(Number);

      const fechaProducto =
        new Date(
          anio,
          mes - 1,
          dia
        );

      const fechaActual =
        new Date();

      fechaActual.setHours(
        0,
        0,
        0,
        0
      );

      if (
        fechaProducto <
        fechaActual
      ) {

        mostrarMensaje(
          'Fecha vencida',
          'La fecha de vencimiento no puede ser anterior a la fecha actual.'
        );

        return;
      }
    }

    try {

      setGuardando(true);

      /**
       * ======================================================
       * DATOS ENVIADOS AL BACKEND
       * ======================================================
       *
       * No se envía id_producto.
       * MySQL lo genera automáticamente.
       */
      const producto = {
        nombre:
          nombreLimpio,

        descripcion:
          descripcionLimpia,

        cantidad:
          cantidadNumero,

        unidad_medida:
          unidadLimpia,

        stock_minimo:
          stockMinimoNumero,

        fecha_vencimiento:
          fechaLimpia || null,

        id_categoria:
          categoriaNumero
      };

      console.log(
        'Producto enviado:',
        producto
      );

      const response =
        await api.post(
          '/productos',
          producto
        );

      /**
       * El backend puede responder utilizando
       * "mensaje" o "message".
       */
      const mensajeServidor =
        response.data?.mensaje ||
        response.data?.message ||
        'Operación realizada correctamente.';

      /**
       * Identificar si el producto ya existía.
       */
      const productoExistente =
        response.data?.productoExistente === true ||
        response.data?.accion === 'actualizado';

      const titulo =
        productoExistente
          ? 'Cantidad actualizada'
          : 'Producto registrado';

      limpiarFormulario();

      mostrarMensaje(
        titulo,
        mensajeServidor,
        irAListaProductos
      );

    } catch (error: any) {

      console.error(
        'Error al registrar producto:',
        error?.response?.data ||
        error?.message ||
        error
      );

      const mensajeError =
        error?.response?.data?.mensaje ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'No se pudo registrar el producto. Revise la conexión con el servidor.';

      mostrarMensaje(
        'Error',
        mensajeError
      );

    } finally {

      setGuardando(false);
    }
  };

  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contenido}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >

      {/* BOTÓN VOLVER */}

      <TouchableOpacity
        style={styles.botonVolver}
        onPress={() => router.back()}
        disabled={guardando}
      >

        <Text style={styles.textoVolver}>
          ⬅ Volver
        </Text>

      </TouchableOpacity>

      {/* ENCABEZADO */}

      <View style={styles.encabezado}>

        <Text style={styles.titulo}>
          ➕ Agregar Producto
        </Text>

        <Text style={styles.subtitulo}>
          Registre una entrada de producto en el inventario
        </Text>

      </View>

      {/* NOMBRE */}

      <Text style={styles.label}>
        Nombre del producto *
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Ejemplo: Galleta de soda"
        placeholderTextColor="#999999"
        value={nombreProducto}
        onChangeText={setNombreProducto}
        editable={!guardando}
        maxLength={150}
        autoCapitalize="sentences"
      />

      {/* DESCRIPCIÓN */}

      <Text style={styles.label}>
        Descripción *
      </Text>

      <TextInput
        style={[
          styles.input,
          styles.areaTexto
        ]}
        placeholder="Descripción del producto"
        placeholderTextColor="#999999"
        value={descripcion}
        onChangeText={setDescripcion}
        editable={!guardando}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        maxLength={500}
      />

      {/* CANTIDAD */}

      <Text style={styles.label}>
        Cantidad que ingresa *
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Ejemplo: 10"
        placeholderTextColor="#999999"
        keyboardType="numeric"
        value={cantidad}
        onChangeText={(texto) =>
          setCantidad(
            texto.replace(/[^0-9]/g, '')
          )
        }
        editable={!guardando}
        maxLength={9}
      />

      <Text style={styles.ayuda}>
        Si el producto ya existe, esta cantidad se sumará al inventario.
      </Text>

      {/* UNIDAD DE MEDIDA */}

      <Text style={styles.label}>
        Unidad de medida *
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Ejemplo: unidades, paquetes o litros"
        placeholderTextColor="#999999"
        value={unidadMedida}
        onChangeText={setUnidadMedida}
        editable={!guardando}
        maxLength={50}
        autoCapitalize="sentences"
      />

      {/* STOCK MÍNIMO */}

      <Text style={styles.label}>
        Stock mínimo *
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Ejemplo: 5"
        placeholderTextColor="#999999"
        keyboardType="numeric"
        value={stockMinimo}
        onChangeText={(texto) =>
          setStockMinimo(
            texto.replace(/[^0-9]/g, '')
          )
        }
        editable={!guardando}
        maxLength={9}
      />

      {/* FECHA DE VENCIMIENTO */}

      <Text style={styles.label}>
        Fecha de vencimiento
      </Text>

      <TextInput
        style={styles.input}
        placeholder="AAAA-MM-DD"
        placeholderTextColor="#999999"
        value={fechaVencimiento}
        onChangeText={setFechaVencimiento}
        editable={!guardando}
        autoCapitalize="none"
        maxLength={10}
      />

      <Text style={styles.ayuda}>
        Deje este campo vacío cuando el producto no tenga vencimiento.
      </Text>

      {/* CATEGORÍA */}

      <Text style={styles.label}>
        Categoría *
      </Text>

      <View
        style={[
          styles.contenedorPicker,
          guardando &&
          styles.pickerDeshabilitado
        ]}
      >

        <Picker
          selectedValue={idCategoria}
          onValueChange={(
            valorSeleccionado
          ) => {

            setIdCategoria(
              String(valorSeleccionado)
            );
          }}
          enabled={!guardando}
          style={styles.picker}
        >

          <Picker.Item
            label="Seleccione una categoría"
            value=""
            color="#777777"
          />

          {categorias.map(
            categoria => (

              <Picker.Item
                key={
                  categoria.id_categoria
                }
                label={
                  categoria.nombre
                }
                value={
                  String(
                    categoria.id_categoria
                  )
                }
              />

            )
          )}

        </Picker>

      </View>

      <Text style={styles.ayuda}>
        Seleccione la categoría a la que pertenece el producto.
      </Text>

      {/* BOTÓN GUARDAR */}

      <TouchableOpacity
        style={[
          styles.botonGuardar,
          guardando &&
          styles.botonDeshabilitado
        ]}
        onPress={guardarProducto}
        disabled={guardando}
        activeOpacity={0.8}
      >

        {guardando ? (

          <View style={styles.filaCargando}>

            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />

            <Text style={styles.textoBoton}>
              Guardando...
            </Text>

          </View>

        ) : (

          <Text style={styles.textoBoton}>
            💾 Guardar Producto
          </Text>
        )}

      </TouchableOpacity>

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
    backgroundColor: '#F5F1E8'
  },

  contenido: {
    padding: 20,
    paddingBottom: 45
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
    marginBottom: 25
  },

  titulo: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center'
  },

  subtitulo: {
    color: '#DCE6F0',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8
  },

  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0D3B66'
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 16,
    fontSize: 16,
    color: '#222222'
  },

  areaTexto: {
    minHeight: 90
  },

  ayuda: {
    color: '#666666',
    fontSize: 13,
    marginTop: -8,
    marginBottom: 18
  },

  contenedorPicker: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden'
  },

  picker: {
    width: '100%',
    height: 55,
    color: '#222222',
    backgroundColor: '#FFFFFF'
  },

  pickerDeshabilitado: {
    opacity: 0.65
  },

  botonGuardar: {
    backgroundColor: '#198754',
    paddingVertical: 16,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginTop: 10
  },

  botonDeshabilitado: {
    opacity: 0.65
  },

  filaCargando: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10
  },

  textoBoton: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold'
  }

});